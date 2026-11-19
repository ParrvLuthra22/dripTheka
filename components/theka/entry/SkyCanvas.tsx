"use client";

// SkyCanvas — the volumetric night-cloud deck. Raw WebGL, no three.js; the fragment
// shader is copied verbatim from entry-reference/index.html.
//
// Renders on demand: whenever a uniform changes (invalidate()), plus a 15fps idle
// drift while the camera hovers at the top (u < .02). The Entry flips it inactive
// once the clouds are gone (timeline time 3.1). If WebGL is unavailable the layer
// stays empty and the CSS gradient (#skyfb) beneath it is the sky.

import { useImperativeHandle, useEffect, useRef, type Ref } from "react";
import { MOBILE_MAX } from "./entryCamera";

export interface SkyHandle {
  /** u: descent 0→1 · r: how far the cloud deck has broken apart 0→1 (GSAP tweens this object). */
  state: { u: number; r: number };
  invalidate: () => void;
  /** Stop/resume rendering (the loop is cancelled entirely while inactive). */
  setActive: (on: boolean) => void;
}

const FS = `precision highp float;
uniform vec2 R; uniform float T; uniform float D; uniform float RV;
float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm5(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}
float fbm3(vec3 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*n(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}
float prof(float y){return smoothstep(0.,.7,y)*smoothstep(2.4,1.2,y);}
float dens(vec3 p){
 if(p.y<0.||p.y>2.4) return 0.;
 vec3 q=p*vec3(.38,.6,.38)+vec3(T*.012,0.,T*.02);
 float f=fbm5(q+.35*fbm3(q*1.7)); float pr=prof(p.y);
 return clamp((f-.52-.34*RV+.22*pr)*3.6*pr,0.,1.);}
float densLo(vec3 p){
 if(p.y<0.||p.y>2.4) return 0.;
 vec3 q=p*vec3(.38,.6,.38)+vec3(T*.012,0.,T*.02); float pr=prof(p.y);
 return clamp((fbm3(q)-.52-.34*RV+.22*pr)*3.6*pr,0.,1.);}
vec3 sky(vec3 rd,vec3 md){
 float y=rd.y;
 vec3 c=mix(vec3(.10,.11,.19),vec3(.012,.02,.055),smoothstep(-.05,.6,y));
 c+=vec3(.55,.24,.08)*exp(-abs(y+.02)*14.)*.55;
 float m=dot(rd,md); c+=vec3(.75,.8,.95)*smoothstep(.9994,.9997,m); c+=vec3(.25,.3,.45)*pow(max(m,0.),40.)*.6;
 vec3 sp=floor(rd*260.); c+=step(.9975,h(sp))*.7*smoothstep(.05,.4,y);
 if(y<0.) c=mix(vec3(.22,.23,.33),vec3(.08,.09,.15),smoothstep(0.,-.25,y))+vec3(.5,.22,.08)*exp(-abs(y)*18.)*.5;
 return c;}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
 float d=D;
 vec3 ro=vec3(0.,mix(4.2,-.7,d),T*.25+d*9.);
 float pitch=mix(-.06,-.42,smoothstep(.0,.8,d));
 vec3 fw=normalize(vec3(0.,sin(pitch),cos(pitch)));
 vec3 rt=normalize(cross(vec3(0,1,0),fw)); vec3 up=cross(fw,rt);
 vec3 rd=normalize(fw*1.35+uv.x*rt+uv.y*up);
 vec3 md=normalize(vec3(.34,.24,.9));
 vec3 bg=sky(rd,md);
 float t0=(0.-ro.y)/rd.y, t1=(2.4-ro.y)/rd.y; if(t0>t1){float k=t0;t0=t1;t1=k;}
 t0=max(t0,0.); t1=min(t1,40.);
 vec3 acc=vec3(0.); float Tr=1.;
 if(t1>t0){
  float dt=min((t1-t0)/40.,.9); float t=t0+dt*fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5);
  for(int i=0;i<40;i++){
   vec3 p=ro+rd*t; float de=dens(p)*smoothstep(.15,2.2,t);   // no grey wall right in front of the lens
   if(de>.01){
     float sh=densLo(p+md*.35)+densLo(p+md*.9)*.6; float lit=exp(-sh*2.6);
     vec3 c=mix(vec3(.035,.045,.1),vec3(.86,.9,1.05),lit*lit*.7+lit*.3);
     c+=vec3(.55,.26,.1)*smoothstep(1.,0.,p.y)*.55;
     float a=1.-exp(-de*dt*2.2);
     acc+=Tr*a*c; Tr*=1.-a;
     if(Tr<.02) break;
   }
   t+=dt;
  }
 }
 vec3 col=bg*Tr*(1.-RV)+acc;
 float alpha=1.-Tr*RV;
 col=1.-exp(-col*1.5); col=pow(col,vec3(.92));
 gl_FragColor=vec4(min(col,vec3(alpha)),alpha);
}`;

const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}";

export function SkyCanvas({ ref, reduced = false }: { ref?: Ref<SkyHandle>; reduced?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const handle = useRef<SkyHandle>({ state: { u: 0, r: 0 }, invalidate: () => {}, setActive: () => {} });
  useImperativeHandle(ref, () => handle.current, []);

  useEffect(() => {
    const host = wrap.current;
    if (!host) return;
    // Created here (not in JSX) so a dev double-mount never reuses a context we already lost.
    const cv = document.createElement("canvas");
    cv.style.cssText = "width:100%;height:100%;display:block";
    host.appendChild(cv);

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = cv.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
    } catch { /* falls through */ }
    const fail = () => { cv.style.display = "none"; };
    if (!gl) { fail(); return () => { cv.remove(); }; }

    const U: Record<string, WebGLUniformLocation | null> = {};
    let prog: WebGLProgram | null = null;
    try {
      const sh = (t: number, s: string) => {
        const o = gl!.createShader(t)!;
        gl!.shaderSource(o, s); gl!.compileShader(o);
        if (!gl!.getShaderParameter(o, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(o) ?? "shader");
        return o;
      };
      prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      gl.useProgram(prog);
    } catch (e) {
      console.warn("[entry] sky shader failed, using gradient", e);
      fail();
      return () => { cv.remove(); };
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ["R", "T", "D", "RV"].forEach((k) => { U[k] = gl!.getUniformLocation(prog!, k); });

    const h = handle.current;
    const P = h.state;
    const t0 = performance.now();
    let dirty = true, last = 0, active = true, raf = 0, lost = false;

    const size = () => {
      const target = innerWidth <= MOBILE_MAX ? 520 : 640; // rows of cloud resolution
      const sc = Math.min(1, target / innerHeight) * Math.min(devicePixelRatio || 1, 1.5);
      cv.width = Math.round(innerWidth * sc);
      cv.height = Math.round(innerHeight * sc);
      gl!.viewport(0, 0, cv.width, cv.height);
      dirty = true;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!active || lost) return;
      const idle = P.u < 0.02; // gentle drift only while hovering at the top
      if (dirty || (idle && !reduced && now - last > 66)) {
        gl!.uniform2f(U.R, cv.width, cv.height);
        gl!.uniform1f(U.T, reduced ? 0 : (now - t0) / 1000);
        gl!.uniform1f(U.D, P.u);
        gl!.uniform1f(U.RV, P.r);
        gl!.clearColor(0, 0, 0, 0);
        gl!.clear(gl!.COLOR_BUFFER_BIT);
        gl!.drawArrays(gl!.TRIANGLES, 0, 3);
        dirty = false; last = now;
      }
      raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf && active && !lost) raf = requestAnimationFrame(frame); };

    h.invalidate = () => { dirty = true; kick(); };
    h.setActive = (on) => {
      active = on;
      if (on) { dirty = true; kick(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    };

    const onLost = (e: Event) => { e.preventDefault(); lost = true; fail(); };
    cv.addEventListener("webglcontextlost", onLost);

    let rt = 0;
    const onResize = () => { clearTimeout(rt); rt = window.setTimeout(() => { size(); kick(); }, 80); };
    addEventListener("resize", onResize);

    size();
    kick();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(rt);
      removeEventListener("resize", onResize);
      cv.removeEventListener("webglcontextlost", onLost);
      h.invalidate = () => {};
      h.setActive = () => {};
      gl!.getExtension("WEBGL_lose_context")?.loseContext(); // release the GPU context
      cv.remove();
    };
  }, [reduced]);

  return <div ref={wrap} data-e="sky" style={{ position: "absolute", inset: 0 }} />;
}
