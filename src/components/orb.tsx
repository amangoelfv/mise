"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * The Mise orb: a sphere of dots drawn with raw WebGL (no three.js).
 * Dots breathe when idle, swirl and ripple as `energy` rises, part around the cursor
 * and tilt toward it. Pauses off-screen; renders a single still frame under reduced motion.
 */

export type OrbPalette = "warm" | "success";

const PALETTES: Record<OrbPalette, string[]> = {
  // back-face, dot, flow, hot spot, highlight
  warm: ["#3b2a1f", "#efebe3", "#ff7a1a", "#ffc24b", "#ffffff"],
  success: ["#16301c", "#e8f3e2", "#8cd47e", "#c8f0a8", "#ffffff"],
};

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const VERTEX = `
precision highp float;
attribute vec3 aPos;
attribute float aSeed;
uniform float uTime;
uniform float uEnergy;
uniform float uHover;
uniform float uPoint;
uniform vec2 uFit;
uniform vec2 uMouse;
uniform vec2 uTilt;
uniform vec3 uC[5];
varying vec3 vColor;
varying float vAlpha;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

// Simplex 3D noise — Ashima Arts / Stefan Gustavson (MIT).
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

void main() {
  float t = uTime;
  vec3 p = aPos;

  // Organic breathing: radial displacement from flowing noise, stronger with energy.
  float n = snoise(p * 1.7 + vec3(0.0, t * 0.4, t * 0.23));
  float wave = sin(p.y * 6.0 - t * 2.2) * 0.5 + 0.5;
  float amp = 0.03 + 0.12 * uEnergy;
  p *= 1.0 + n * amp + wave * 0.035 * uEnergy + 0.01 * sin(t * 1.3 + aSeed * 6.2831);

  p = rotX(0.32 + uTilt.y) * rotY(t * 0.16 + uTilt.x) * p;

  // Cursor: the surface swells toward the pointer (outward along each dot's normal)
  // with a slight magnetic pull, so dots gather and brighten rather than leave a gap.
  float persp0 = 1.0 / (1.0 - p.z * 0.3);
  float dist = length(p.xy * persp0 * 0.7 - uMouse);
  float infl = uHover * smoothstep(-0.2, 0.6, p.z) * pow(smoothstep(0.55, 0.0, dist), 2.0);
  p *= 1.0 + infl * 0.14;

  float persp = 1.0 / (1.0 - p.z * 0.3);
  vec2 xy = p.xy * persp * 0.7;
  xy += (uMouse - xy) * infl * 0.05;

  float depth = clamp(p.z * 0.5 + 0.5, 0.0, 1.0);
  // Halftone shading, same as the logo: dots grow toward the top-left light.
  float lit = max(dot(normalize(p), normalize(vec3(-0.5, 0.55, 0.65))), 0.0);

  float flow = smoothstep(-0.15, 0.55, n + aPos.y * 0.3);
  vec3 c = mix(uC[1], uC[2], flow * (0.75 + 0.25 * uEnergy));
  c = mix(c, uC[3], smoothstep(0.55, 1.0, n) * (0.35 + 0.4 * uEnergy));
  c = mix(uC[0], c, 0.2 + 0.8 * depth);
  c = mix(c, uC[4], infl * 0.7);

  vColor = c;
  vAlpha = clamp(mix(0.1, 0.95, pow(depth, 1.4)) + infl * 0.4, 0.0, 1.0);
  gl_PointSize = uPoint * (0.35 + 0.55 * depth + 0.75 * lit) * (1.0 + infl * 0.8) * (1.0 + 0.25 * uEnergy * wave);
  gl_Position = vec4(xy * uFit, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.12, d) * vAlpha;
  gl_FragColor = vec4(vColor * a, a);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "shader compile failed");
  }
  return shader;
}

/** Evenly spread points on a unit sphere (Fibonacci lattice) plus a per-dot random seed. */
function fibonacciSphere(count: number) {
  const data = new Float32Array(count * 4);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    data.set([Math.cos(theta) * r, y, Math.sin(theta) * r, Math.random()], i * 4);
  }
  return data;
}

export function Orb({
  energy = 0.2,
  palette = "warm",
  className = "",
}: {
  energy?: number;
  palette?: OrbPalette;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef({ energy, palette });
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    target.current = { energy, palette };
  }, [energy, palette]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true });
    if (!gl) {
      queueMicrotask(() => setFallback(true));
      return;
    }

    const shaders: WebGLShader[] = [];
    const program = gl.createProgram()!;
    try {
      shaders.push(compile(gl, gl.VERTEX_SHADER, VERTEX), compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      shaders.forEach((shader) => gl.attachShader(program, shader));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "link failed");
    } catch (error) {
      console.warn("[orb] falling back to CSS", error);
      queueMicrotask(() => setFallback(true));
      return;
    }
    gl.useProgram(program);

    const cssSize = Math.min(canvas.clientWidth, canvas.clientHeight) || 240;
    const count = Math.round(Math.min(3600, Math.max(800, cssSize * 8)));
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, fibonacciSphere(count), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    const aSeed = gl.getAttribLocation(program, "aSeed");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aSeed);
    gl.vertexAttribPointer(aSeed, 1, gl.FLOAT, false, 16, 12);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE); // additive: overlapping dots glow

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uTime = u("uTime");
    const uEnergy = u("uEnergy");
    const uHover = u("uHover");
    const uPoint = u("uPoint");
    const uFit = u("uFit");
    const uMouse = u("uMouse");
    const uTilt = u("uTilt");
    const uC = u("uC");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const colors = PALETTES[target.current.palette].flatMap(hexToRgb);
    const pointer = { x: 0, y: 0, hover: 0, tx: 0, ty: 0, thover: 0 };
    const tilt = { x: 0, y: 0 };
    let e = target.current.energy;
    let time = 4.2;
    let last = performance.now();
    let raf = 0;
    let visible = true;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const min = Math.min(w, h);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uEnergy, e);
      gl.uniform1f(uHover, pointer.hover);
      gl.uniform1f(uPoint, Math.min(3.4, Math.max(1.6, (min / (window.devicePixelRatio || 1)) * 0.0085)) * (window.devicePixelRatio || 1));
      gl.uniform2f(uFit, min / w, min / h);
      gl.uniform2f(uMouse, pointer.x, pointer.y);
      gl.uniform2f(uTilt, tilt.x, tilt.y);
      gl.uniform3fv(uC, colors);
      gl.drawArrays(gl.POINTS, 0, count);
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const ease = (rate: number) => Math.min(1, dt * rate);
      e += (target.current.energy - e) * ease(2.5);
      const goal = PALETTES[target.current.palette].flatMap(hexToRgb);
      for (let i = 0; i < colors.length; i++) colors[i] += (goal[i] - colors[i]) * ease(2);
      pointer.x += (pointer.tx - pointer.x) * ease(9);
      pointer.y += (pointer.ty - pointer.y) * ease(9);
      pointer.hover += (pointer.thover - pointer.hover) * ease(pointer.thover > pointer.hover ? 6 : 2.5);
      tilt.x += (pointer.thover * pointer.tx * 0.35 - tilt.x) * ease(3);
      tilt.y += (pointer.thover * -pointer.ty * 0.35 - tilt.y) * ease(3);
      time += dt * (0.45 + e * 1.4);
      draw();
      if (visible) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduceMotion) return draw();
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const onPointerMove = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const half = Math.min(rect.width, rect.height) / 2 || 1;
      pointer.tx = (ev.clientX - (rect.left + rect.width / 2)) / half;
      pointer.ty = -(ev.clientY - (rect.top + rect.height / 2)) / half;
      pointer.thover = Math.hypot(pointer.tx, pointer.ty) < 1.15 ? 1 : 0;
    };
    const onPointerLeave = () => {
      pointer.thover = 0;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      draw();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    intersectionObserver.observe(canvas);
    if (!reduceMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
    }
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      // Free resources but keep the context: StrictMode re-runs this effect on the same canvas.
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div className={`orb relative h-full w-full ${className}`} style={{ "--energy": energy } as CSSProperties} data-palette={palette}>
      {fallback ? (
        <div aria-hidden className="orb-fallback" data-palette={palette} />
      ) : (
        <canvas ref={canvasRef} aria-hidden className="relative block h-full w-full" />
      )}
    </div>
  );
}
