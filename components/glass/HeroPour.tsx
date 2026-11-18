"use client";

// HeroPour — Three.js wine glass hero for the homepage.
// Lazy-loaded with next/dynamic (ssr: false) from the parent.
// On mobile (≤768px): render SVG fallback instead.
//
// Animation sequence (~3.5s total):
//   0.0s  Glass slides in from below (0.6s)
//   0.5s  Pour stream appears from above (0.3s fade in)
//   0.8s  Liquid fills bowl 0→75% (1.6s, ease-pour)
//   2.1s  Stream fades out (0.3s)
//   2.4s  Surface wave ripple (0.6s, then settles)
//   2.8s  Wordmark fades in (served from parent — not this component)

import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
import { WineGlassMark } from "./WineGlassMark";

// ── Meniscus surface shader ───────────────────────────────────────────────
const SURFACE_VERT = /* glsl */ `
  varying vec2 vUv;
  uniform float uWave;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float r = length(uv - vec2(0.5)) * 2.0;

    // Meniscus: liquid curves UP at glass edges (concave for water in glass)
    pos.y += pow(r, 2.2) * 0.025;

    // Decay ripple wave — only active briefly after pour
    float ripple = sin(r * 18.0 - uTime * 6.0) * uWave * 0.012 * max(0.0, 1.0 - r * 1.2);
    pos.y += ripple;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const SURFACE_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uWave;

  void main() {
    float r = length(vUv - vec2(0.5)) * 2.0;

    // Slight specular ring at meniscus edge
    float edge = smoothstep(0.75, 0.95, r);
    vec3 col = uColor + vec3(edge * 0.12 * (1.0 - uWave));

    // Transparent beyond rim
    float alpha = 1.0 - smoothstep(0.94, 1.0, r);
    gl_FragColor = vec4(col, alpha * 0.92);
  }
`;

// ── Glass profile (lathe geometry, right-half in XY plane) ───────────────
// X = radius (distance from Y axis), Y = world height
// Drawn bottom-to-top. Total height ~2 units.
function buildGlassProfile(): THREE.Vector2[] {
  return [
    // Base foot — flat disc
    new THREE.Vector2(0.00, -1.08),
    new THREE.Vector2(0.32, -1.08),
    new THREE.Vector2(0.32, -1.02),
    new THREE.Vector2(0.28, -1.00),
    // Stem — very thin column
    new THREE.Vector2(0.045, -0.96),
    new THREE.Vector2(0.040, -0.28),
    new THREE.Vector2(0.040, -0.18),
    // Bowl start — widens from stem
    new THREE.Vector2(0.060, -0.10),
    new THREE.Vector2(0.140, -0.00),
    new THREE.Vector2(0.280,  0.24),
    new THREE.Vector2(0.360,  0.44), // equator (widest)
    new THREE.Vector2(0.370,  0.52),
    new THREE.Vector2(0.340,  0.62),
    new THREE.Vector2(0.290,  0.72), // shoulder
    new THREE.Vector2(0.255,  0.82), // rim narrows
    new THREE.Vector2(0.240,  0.88), // rim lip
    new THREE.Vector2(0.252,  0.90), // slight outward flare at very tip
  ];
}

// ── Liquid interior profile (bowl inner surface) ─────────────────────────
function buildLiquidProfile(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.000, -0.94),  // center at bowl bottom (just above stem)
    new THREE.Vector2(0.120, -0.00),
    new THREE.Vector2(0.265,  0.24),
    new THREE.Vector2(0.340,  0.44),
    new THREE.Vector2(0.350,  0.52),
    new THREE.Vector2(0.320,  0.62),
    new THREE.Vector2(0.272,  0.72),
    new THREE.Vector2(0.240,  0.82),
  ];
}

// ── Clip plane constant at 75% fill ──────────────────────────────────────
const FILL_TARGET_Y = 0.52; // world Y = 75% fill (near upper bowl)
const FILL_START_Y  = -1.20; // below everything (empty)

// ── The 3D glass scene ────────────────────────────────────────────────────
function GlassScene({ onReady }: { onReady?: () => void }) {
  const glassGroup  = useRef<THREE.Group>(null);
  const streamMesh  = useRef<THREE.Mesh>(null);
  const surfaceMesh = useRef<THREE.Mesh>(null);

  const clipPlane = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), FILL_START_Y));
  const waveRef   = useRef(0);
  const timeRef   = useRef(0);

  const glassPoints  = useMemo(() => buildGlassProfile(),  []);
  const liquidPoints = useMemo(() => buildLiquidProfile(), []);

  // Surface shader uniforms.
  // The hero sits on a cobalt (#004AAD) background — a blue liquid would
  // camouflage, so the poured liquid renders CREAM here (Fix 7).
  const surfaceUniforms = useRef({
    uColor: { value: new THREE.Color(0xE4E2DD) },
    uWave:  { value: 0 },
    uTime:  { value: 0 },
  });

  // ── Animation timeline ────────────────────────────────────────────────
  useEffect(() => {
    const grp    = glassGroup.current;
    const stream = streamMesh.current;
    const surf   = surfaceMesh.current;
    if (!grp || !stream || !surf) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      // Instant state — skip all animation
      grp.position.y = 0;
      clipPlane.current.constant = -FILL_TARGET_Y;
      surf.position.y = FILL_TARGET_Y;
      onReady?.();
      return;
    }

    // Set initial state
    grp.position.y = -0.5;
    clipPlane.current.constant = FILL_START_Y;
    surf.position.y = -FILL_START_Y;
    ;(stream.material as THREE.MeshStandardMaterial).opacity = 0;

    const tl = gsap.timeline({
      onComplete: () => onReady?.(),
    });

    // Phase 1 — Glass rises (0.0 → 0.7s)
    tl.to(grp.position, {
      y: 0,
      duration: 0.7,
      ease: "power3.out",
      delay: 0.2,
    });

    // Phase 2 — Stream appears (0.4 → 0.7s)
    tl.to((stream.material as THREE.MeshStandardMaterial), {
      opacity: 0.75,
      duration: 0.3,
      ease: "power2.in",
    }, 0.5);

    // Phase 3 — Liquid fills 0 → 75% (0.8 → 2.4s)
    tl.to(clipPlane.current, {
      constant: -FILL_TARGET_Y,
      duration: 1.6,
      ease: "power2.inOut",
      onUpdate: () => {
        if (surfaceMesh.current) {
          surfaceMesh.current.position.y = -clipPlane.current.constant;
        }
      },
    }, 0.8);

    // Phase 4 — Stream fades out (2.0 → 2.3s)
    tl.to((stream.material as THREE.MeshStandardMaterial), {
      opacity: 0,
      duration: 0.35,
      ease: "power2.out",
    }, 2.0);

    // Phase 5 — Surface wave (2.4 → 3.0s)
    tl.to(waveRef, {
      current: 1,
      duration: 0.15,
      onComplete: () => {
        gsap.to(waveRef, {
          current: 0,
          duration: 0.55,
          ease: "power2.out",
          onUpdate: () => {
            surfaceUniforms.current.uWave.value = waveRef.current;
          },
        });
      },
    }, 2.4);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Idle animation + shader time ─────────────────────────────────────
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    timeRef.current = t;
    surfaceUniforms.current.uTime.value = t;

    if (glassGroup.current) {
      // Very gentle breath rotation
      glassGroup.current.rotation.y = Math.sin(t * 0.18) * 0.06;
    }
  });

  return (
    <group ref={glassGroup}>
      {/* ── Glass body ──────────────────────────────────────────── */}
      <mesh>
        <latheGeometry args={[glassPoints, 96]} />
        <meshPhysicalMaterial
          color="#E8E6E1"
          transmission={0.94}
          roughness={0.04}
          metalness={0.0}
          thickness={0.06}
          ior={1.52}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* ── Liquid body (clipped by horizontal plane) ───────────────
           Cream, not cobalt — the hero background is blue (Fix 7). */}
      <mesh>
        <latheGeometry args={[liquidPoints, 64]} />
        <meshPhysicalMaterial
          // Wire the shared clip plane at commit time (refs aren't read in render)
          ref={(m: THREE.MeshPhysicalMaterial | null) => { if (m) m.clippingPlanes = [clipPlane.current]; }}
          color="#E4E2DD"
          roughness={0.06}
          metalness={0.08}
          transparent
          opacity={0.9}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* ── Liquid surface — meniscus disc ──────────────────────── */}
      <mesh
        ref={surfaceMesh}
        position={[0, -FILL_START_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.34, 48]} />
        <shaderMaterial
          vertexShader={SURFACE_VERT}
          fragmentShader={SURFACE_FRAG}
          ref={(m: THREE.ShaderMaterial | null) => { if (m) m.uniforms = surfaceUniforms.current; }}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Pour stream (thin cylinder, animated in/out) ─────────── */}
      <mesh ref={streamMesh} position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.016, 0.010, 0.9, 8, 1, true]} />
        <meshStandardMaterial
          color="#E4E2DD"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Floor contact shadow plane ──────────────────────────── */}
      <mesh position={[0, -1.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshStandardMaterial
          color="#141518"
          transparent
          opacity={0.07}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ── SVG fallback (mobile / no WebGL) ────────────────────────────────────
function HeroPourFallback() {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div
        className="relative"
        style={{ width: 160, height: 224 }}
      >
        {/* Animate liquid from 0→75% via CSS animation */}
        <style>{`
          @keyframes pour-fill {
            0%   { --liq: 0; }
            20%  { --liq: 0; }
            80%  { --liq: 75; }
            100% { --liq: 75; }
          }
          .pour-fallback { animation: pour-fill 3s var(--ease-pour, cubic-bezier(.6,.05,.2,1)) forwards; }
        `}</style>
        <WineGlassMark
          size="lg"
          liquid={75}
          className="pour-fallback text-(--ink)"
        />
      </div>
    </div>
  );
}

// ── Main export — lazy-loaded; parent should use next/dynamic ────────────
interface HeroPourProps {
  className?: string;
  onReady?: () => void;
}

export function HeroPour({ className, onReady }: HeroPourProps) {
  // Use SVG fallback on mobile / touch devices
  const isMobile = typeof window !== "undefined" &&
    (window.innerWidth < 768 || ("ontouchstart" in window && window.innerWidth < 1024));

  if (isMobile) return <HeroPourFallback />;

  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      <Canvas
        onCreated={({ gl }) => {
          // Enable renderer clipping planes (liquid fill is a clip plane)
          gl.localClippingEnabled = true;
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }}
        gl={{
          antialias:    true,
          alpha:        true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 3], fov: 45 }}
        style={{ background: "transparent" }}
      >
        {/* Slight off-axis orthographic feel via camera angle */}
        <OrthographicCamera
          makeDefault
          position={[0.25, 0.2, 4]}
          zoom={190}
          near={0.1}
          far={20}
        />

        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[3, 4, 4]}
          intensity={1.4}
          color="#EAE8E3"
          castShadow={false}
        />
        <pointLight
          position={[-2, 1, 2]}
          intensity={0.8}
          color="#3060CC"
        />
        <pointLight
          position={[2, -0.5, 1]}
          intensity={0.3}
          color="#E4E2DD"
        />

        {/* Scene */}
        <GlassScene onReady={onReady} />

        {/* Environment for glass reflections */}
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
}

// ── Lazy wrapper for use with next/dynamic ───────────────────────────────
// Usage in page:
//   const HeroPour = dynamic(() =>
//     import("@/components/glass/HeroPour").then(m => ({ default: m.HeroPour })),
//     { ssr: false, loading: () => <HeroPourFallback /> }
//   );
export { HeroPourFallback };
