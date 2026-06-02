"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function GlassGeometry() {
  const meshRef = useRef<THREE.Mesh>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const fillRef = useRef({ value: 0 });

  // Animate fill level from 0 to 0.6 on mount
  useFrame(({ clock }) => {
    if (!meshRef.current || !liquidRef.current) return;

    meshRef.current.rotation.y = clock.getElapsedTime() * 0.3;

    // Fill animation: 0 → 0.6 over first 3 seconds
    const elapsed = clock.getElapsedTime();
    fillRef.current.value = Math.min(0.6, elapsed * 0.2);
    liquidRef.current.scale.y = fillRef.current.value;
    liquidRef.current.position.y = -1.2 + fillRef.current.value * 0.8;
  });

  // Wine glass shape using lathe geometry
  const points = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    // Bowl of the glass — flared shape
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const y = t * 1.6 - 0.2;
      const x = 0.1 + Math.pow(t, 0.6) * 0.9;
      pts.push(new THREE.Vector2(x, y));
    }
    return pts;
  }, []);

  const stemPoints = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    // Stem — narrow cylinder
    pts.push(new THREE.Vector2(0.05, -1.4));
    pts.push(new THREE.Vector2(0.05, -0.2));
    pts.push(new THREE.Vector2(0.08, -0.2));
    pts.push(new THREE.Vector2(0.08, -1.4));
    return pts;
  }, []);

  const basePoints = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(0, -1.6));
    pts.push(new THREE.Vector2(0.6, -1.6));
    pts.push(new THREE.Vector2(0.6, -1.5));
    pts.push(new THREE.Vector2(0.08, -1.4));
    return pts;
  }, []);

  return (
    <group>
      {/* Glass bowl */}
      <mesh ref={meshRef}>
        <latheGeometry args={[points, 64]} />
        <meshPhysicalMaterial
          color="#E4E2DD"
          transparent
          opacity={0.15}
          roughness={0}
          metalness={0}
          transmission={0.95}
          thickness={0.5}
          ior={1.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Liquid inside — cobalt blue */}
      <mesh ref={liquidRef} position={[0, -1.2, 0]} scale={[0.85, 0, 0.85]}>
        <cylinderGeometry args={[0.7, 0.1, 2, 32]} />
        <meshPhysicalMaterial
          color="#004AAD"
          transparent
          opacity={0.85}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Stem */}
      <mesh>
        <latheGeometry args={[stemPoints, 16]} />
        <meshPhysicalMaterial
          color="#E4E2DD"
          transparent
          opacity={0.2}
          roughness={0}
          transmission={0.9}
          thickness={0.2}
          ior={1.5}
        />
      </mesh>

      {/* Base */}
      <mesh>
        <latheGeometry args={[basePoints, 32]} />
        <meshPhysicalMaterial
          color="#E4E2DD"
          transparent
          opacity={0.2}
          roughness={0}
          transmission={0.9}
          thickness={0.3}
          ior={1.5}
        />
      </mesh>
    </group>
  );
}

export function WineGlass() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#E4E2DD" />
      <pointLight position={[-3, 2, 2]} intensity={0.8} color="#004AAD" />
      <GlassGeometry />
    </Canvas>
  );
}
