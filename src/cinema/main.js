// CINEMA — 15 s cinematic 3D motion graphics. Everything is a pure function of time t,
// so frames can be rendered in any order (see scripts/render-cinema.mjs).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const qs = new URLSearchParams(location.search);
const W = +qs.get("w") || 1920;
const H = Math.round((W * 9) / 16);
const SUB_BASE = +qs.get("sub") || 3;
const S = W / 1920; // resolution scale for 2D post effects
const DURATION = 15;
const FPS = 30;
window.DURATION = DURATION;

// ---------- helpers ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const sstep5 = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * k * (k * (k * 6 - 15) + 10); };
const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
const easeInOut = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };

// smooth scalar track through keys [[t,v],...] (cubic Hermite, finite-difference tangents)
function track(keys) {
  const n = keys.length;
  const m = keys.map((k, i) => {
    if (i === 0 || i === n - 1) return 0;
    return (keys[i + 1][1] - keys[i - 1][1]) / (keys[i + 1][0] - keys[i - 1][0]);
  });
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    if (t >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0;
    while (t > keys[i + 1][0]) i++;
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    const h = t1 - t0, s = (t - t0) / h;
    const s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * h * m[i + 1];
  };
}

function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  Object.assign(t, opts);
  return t;
}
const radialTex = (stops, size = 256) => canvasTex(size, size, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});

// ---------- renderer ----------
const glCanvas = document.createElement("canvas");
glCanvas.width = W; glCanvas.height = H;
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: qs.get('aa') !== '0', preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(35, W / H, 0.05, 2000);

// studio environment for reflections (soft boxes on black)
const pmrem = new THREE.PMREMGenerator(renderer);
function makeEnv(warm = 1) {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x020203);
  const panel = (w, h, c, i, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(12, 3, 0xffe0b0, 14 * warm, [0, 8, 5]);
  panel(2.5, 14, 0x78a8ff, 9, [-9, 1, 2]);
  panel(2.5, 14, 0xff8d4d, 7 * warm, [9, 1, -5]);
  panel(14, 2, 0xffffff, 3, [0, -3, 9]);
  panel(6, 6, 0x4466aa, 1.5, [0, 3, -10]);
  return pmrem.fromScene(s, 0.03).texture;
}
const envStudio = makeEnv();
scene.environment = envStudio;

// ---------- shared textures ----------
const glowTex = radialTex([[0, "rgba(255,255,255,1)"], [0.15, "rgba(255,240,215,.7)"], [0.5, "rgba(255,200,140,.18)"], [1, "rgba(255,160,90,0)"]]);
const softTex = radialTex([[0, "rgba(255,255,255,1)"], [0.5, "rgba(255,255,255,.35)"], [1, "rgba(255,255,255,0)"]]);
const bokehTex = canvasTex(128, 128, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, "rgba(255,255,255,.35)"); gr.addColorStop(0.82, "rgba(255,255,255,.55)");
  gr.addColorStop(0.95, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 1, 0, 7); g.fill();
});

// ============================================================
// Hero: cinema camera
// ============================================================
const CAMZ = -1.2; // camera model offset so the whole rig is centred on the origin
const GLASSZ = CAMZ + 3.3; // front glass plane (world z)
const matBody = new THREE.MeshStandardMaterial({ color: 0x1c1d21, metalness: 0.85, roughness: 0.36 });
const matMetal = new THREE.MeshStandardMaterial({ color: 0x8b8e96, metalness: 1, roughness: 0.2 });
const matRubber = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, metalness: 0.1, roughness: 0.75 });
const matRed = new THREE.MeshStandardMaterial({ color: 0xb3141b, metalness: 0.4, roughness: 0.3, emissive: 0x4a0408, emissiveIntensity: 0.8 });
const matGlass = new THREE.MeshPhysicalMaterial({ color: 0x070b16, metalness: 0.2, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 3.2, iridescence: 0.6, iridescenceIOR: 1.6 });

function buildCamera() {
  const g = new THREE.Group();
  const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m;
  };
  const cyl = (r, len, mat, z, seg = 72) => add(new THREE.CylinderGeometry(r, r, len, seg), mat, 0, 0, z, Math.PI / 2);

  add(new RoundedBoxGeometry(1.5, 1.2, 2.3, 5, 0.14), matBody, 0, 0, 0.2);
  add(new RoundedBoxGeometry(1.72, 1.42, 0.4, 5, 0.12), matBody, 0, 0, 1.42);
  add(new RoundedBoxGeometry(0.2, 0.5, 1.6, 3, 0.05), matMetal, 0.8, 0.0, 0.2);   // side plate
  add(new RoundedBoxGeometry(0.5, 0.9, 0.7, 4, 0.1), matRubber, 0, -1.0, 0.4);      // grip
  add(new RoundedBoxGeometry(1.0, 0.18, 1.5, 3, 0.06), matBody, 0, -0.68, 0.3);
  // lens stack
  cyl(0.7, 0.6, matBody, 1.9);
  cyl(0.62, 0.4, matMetal, 2.3);
  const focus = cyl(0.75, 0.55, matRubber, 2.65);
  const knurl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.05, 0.5), matMetal, 56);
  const dm = new THREE.Object3D();
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2;
    dm.position.set(Math.cos(a) * 0.765, Math.sin(a) * 0.765, 2.65); dm.rotation.set(0, 0, a); dm.updateMatrix(); knurl.setMatrixAt(i, dm.matrix);
  }
  g.add(knurl);
  cyl(0.68, 0.18, matMetal, 3.0);
  cyl(0.74, 0.3, matBody, 3.2);
  add(new THREE.TorusGeometry(0.64, 0.03, 12, 72), matRed, 0, 0, 3.34);
  // glass dome + inner coating rings
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.6, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2.6), matGlass);
  glass.rotation.x = Math.PI / 2; glass.position.z = 3.2; g.add(glass);
  const ringMats = [0x6a2cff, 0x00d4a0, 0xff3f8a, 0x2ca4ff];
  ringMats.forEach((c, i) => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.2 + i * 0.1, 0.24 + i * 0.1, 64), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    r.position.z = 3.27 - i * 0.01; g.add(r);
  });
  // matte box
  const mb = add(new THREE.CylinderGeometry(1.0, 0.8, 0.7, 4, 1, true), matRubber, 0, 0, 3.8, Math.PI / 2, Math.PI / 4, 0);
  mb.material = new THREE.MeshStandardMaterial({ color: 0x080809, metalness: 0.3, roughness: 0.6, side: THREE.DoubleSide });
  add(new THREE.BoxGeometry(1.5, 0.04, 0.6), matRubber, 0, 0.78, 3.95); // top flag
  // magazines
  const mags = [];
  const mag = (r, z, y) => {
    const mg = new THREE.Group(); mg.position.set(0, y, z);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.62, 80), matBody); body.rotation.z = Math.PI / 2; mg.add(body);
    for (const sx of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.96, r * 0.96, 0.04, 80), matMetal); cap.rotation.z = Math.PI / 2; cap.position.x = sx * 0.33; mg.add(cap);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.22, 0.07, 32), matRubber); hub.rotation.z = Math.PI / 2; hub.position.x = sx * 0.34; mg.add(hub);
      const spokes = new THREE.Group(); spokes.position.x = sx * 0.355; spokes.name = "spokes";
      for (let k = 0; k < 4; k++) {
        const sp = new THREE.Mesh(new THREE.BoxGeometry(0.03, r * 1.5, r * 0.22), matRubber); sp.rotation.x = (k / 4) * Math.PI; spokes.add(sp);
      }
      mg.add(spokes); mags.push(spokes);
    }
    g.add(mg);
  };
  mag(0.82, -0.45, 1.05);
  mag(0.66, 0.85, 0.93);
  // viewfinder + details
  cyl(0.2, 1.1, matBody, -1.45);
  add(new THREE.SphereGeometry(0.1, 24, 12), matRed, 0.82, 0.45, 1.5);
  add(new THREE.TorusGeometry(0.42, 0.04, 16, 48, Math.PI), matMetal, 0, 1.65, 0.18, 0, Math.PI / 2, 0); // carry handle
  g.userData.mags = mags;
  g.position.z = CAMZ;
  return g;
}
const heroCam = buildCamera();
scene.add(heroCam);

// ---- iris + tunnel (flight through the lens) ----
const tunnel = new THREE.Group();
const irisRings = [];
for (let i = 0; i < 11; i++) {
  const r = new THREE.Mesh(
    new THREE.RingGeometry(0.46 - i * 0.02, 0.72, 48),
    new THREE.MeshBasicMaterial({ color: 0x030304, side: THREE.DoubleSide })
  );
  r.position.z = GLASSZ - 0.22 - i * 0.26;
  tunnel.add(r);
  const e = new THREE.Mesh(new THREE.TorusGeometry(0.46 - i * 0.02, 0.02, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.58 - i * 0.05, 1, 0.6).multiplyScalar(3), toneMapped: false, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.9, depthWrite: false }));
  e.position.z = r.position.z; tunnel.add(e);
}
// barrel walls
const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 4, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0x020203, side: THREE.BackSide }));
wall.rotation.x = Math.PI / 2; wall.position.z = GLASSZ - 2.2; tunnel.add(wall);
const irisMat = new THREE.MeshBasicMaterial({ color: 0x15151a, side: THREE.DoubleSide });
let irisMesh = null;
function setIris(open) {
  if (irisMesh) { tunnel.remove(irisMesh); irisMesh.geometry.dispose(); }
  const sh = new THREE.Shape(); sh.absarc(0, 0, 0.75, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  const n = 7, rr = Math.max(0.0001, open);
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + 0.3; i ? hole.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : hole.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  hole.closePath(); sh.holes.push(hole);
  irisMesh = new THREE.Mesh(new THREE.ShapeGeometry(sh), irisMat);
  irisMesh.position.z = GLASSZ - 3.1; tunnel.add(irisMesh);
}
const whiteDisc = new THREE.Mesh(new THREE.CircleGeometry(30, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5.4, 4.6), toneMapped: false }));
whiteDisc.position.z = GLASSZ - 3.4; whiteDisc.rotation.y = Math.PI; tunnel.add(whiteDisc);
setIris(0.05);
scene.add(tunnel);

// ============================================================
// Film strips
// ============================================================
function frameArt(g, x, y, w, h, kind, rnd) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  const grad = (stops) => { const gr = g.createLinearGradient(0, y, 0, y + h); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(x, y, w, h); };
  if (kind === 0) { // sunset ridge
    grad([[0, "#1b1440"], [0.5, "#d4552e"], [0.72, "#ffb45c"], [1, "#2a1410"]]);
    g.fillStyle = "#ffd78a"; g.beginPath(); g.arc(x + w * 0.62, y + h * 0.62, w * 0.09, 0, 7); g.fill();
    g.fillStyle = "#120a10"; g.beginPath(); g.moveTo(x, y + h);
    for (let i = 0; i <= 12; i++) g.lineTo(x + (w * i) / 12, y + h * (0.74 + 0.1 * Math.sin(i * 1.3) + rnd() * 0.05));
    g.lineTo(x + w, y + h); g.fill();
  } else if (kind === 1) { // moon over sea
    grad([[0, "#050a1c"], [0.55, "#16335a"], [0.56, "#0a1a30"], [1, "#030810"]]);
    g.fillStyle = "#e8f0ff"; g.beginPath(); g.arc(x + w * 0.3, y + h * 0.28, w * 0.07, 0, 7); g.fill();
    g.fillStyle = "rgba(200,225,255,.5)"; for (let i = 0; i < 9; i++) g.fillRect(x + w * 0.3 - 20 + rnd() * 40 - i * 2, y + h * (0.58 + i * 0.045), 10 + i * 5, 2);
  } else if (kind === 2) { // neon street
    grad([[0, "#150a28"], [1, "#050310"]]);
    for (let i = 0; i < 24; i++) { g.fillStyle = `hsla(${[320, 190, 40][i % 3]},100%,60%,${0.25 + rnd() * 0.6})`; g.beginPath(); g.arc(x + rnd() * w, y + h * (0.3 + rnd() * 0.6), 3 + rnd() * 13, 0, 7); g.fill(); }
    g.fillStyle = "#07040f"; g.fillRect(x + w * 0.4, y + h * 0.45, w * 0.06, h * 0.55); g.beginPath(); g.arc(x + w * 0.43, y + h * 0.42, w * 0.035, 0, 7); g.fill();
  } else if (kind === 3) { // desert
    grad([[0, "#2a5b8f"], [0.5, "#f1c27a"], [0.51, "#c4762f"], [1, "#4a2410"]]);
    g.fillStyle = "#5b2c12"; g.beginPath(); g.moveTo(x, y + h * 0.7); g.quadraticCurveTo(x + w * 0.4, y + h * 0.45, x + w, y + h * 0.75); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.fill();
  } else if (kind === 4) { // foggy forest
    grad([[0, "#9db8b0"], [1, "#223a38"]]);
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(10,24,22,${0.25 + rnd() * 0.5})`; const tw = 4 + rnd() * 9; g.fillRect(x + rnd() * w, y, tw, h); }
    g.fillStyle = "rgba(210,230,225,.35)"; g.fillRect(x, y + h * 0.4, w, h * 0.2);
  } else { // stars
    grad([[0, "#02030a"], [1, "#1b2658"]]);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; g.fillRect(x + rnd() * w, y + rnd() * h, 1.6, 1.6); }
    g.fillStyle = "#04050c"; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w * 0.3, y + h * 0.78); g.lineTo(x + w * 0.55, y + h * 0.9); g.lineTo(x + w, y + h * 0.7); g.lineTo(x + w, y + h); g.fill();
  }
  g.restore();
}
function makeFilmTexture(frames = 12, seed = 7) {
  const rnd = rng(seed);
  const FW = 384, FH = 384;
  const c = document.createElement("canvas"); c.width = FW * frames; c.height = FH;
  const g = c.getContext("2d");
  g.fillStyle = "#0e0c0a"; g.fillRect(0, 0, c.width, c.height);
  for (let f = 0; f < frames; f++) {
    const ox = f * FW;
    frameArt(g, ox + 18, 51, FW - 36, FH - 102, (f + seed) % 6, rnd);
    g.fillStyle = "rgba(255,200,120,.06)"; g.fillRect(ox + 18, 51, FW - 36, FH - 102);
  }
  // sprocket holes → cut out via alpha
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < frames * 4; i++) {
    const px = i * (FW / 4) + (FW / 8) - 13;
    for (const py of [12, FH - 39]) { g.beginPath(); g.roundRect(px, py, 27, 27, 6); g.fill(); }
  }
  g.globalCompositeOperation = "source-over";
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}
function makeStrip(opts) {
  const { turns, radius, height, phase, seed, segs = 500, hw = 0.5, rise = 0.28, wobble = 0.5 } = opts;
  const pos = [], uv = [], idx = [];
  const P = (s) => {
    const ang = phase + turns * Math.PI * 2 * s;
    const r = lerp(1.4, radius, sstep(0, rise, s)) + Math.sin(s * 9 + seed) * wobble;
    return new THREE.Vector3(Math.cos(ang) * r, (s - 0.5) * height + Math.sin(s * 5 + seed) * 0.5, Math.sin(ang) * r);
  };
  let len = 0, prev = P(0);
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= segs; i++) {
    const s = i / segs, p = P(s);
    len += p.distanceTo(prev); prev = p;
    const p2 = P(Math.min(1, s + 0.002)), p1 = P(Math.max(0, s - 0.002));
    const tng = p2.sub(p1).normalize();
    const w = up.clone().sub(tng.clone().multiplyScalar(up.dot(tng))).normalize();
    // slight twist so the ribbon catches light
    w.applyAxisAngle(tng, Math.sin(s * 11 + seed) * 0.35);
    const a = p.clone().addScaledVector(w, hw), b = p.clone().addScaledVector(w, -hw);
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    uv.push(len, 1, len, 0);
    if (i < segs) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const tex = makeFilmTexture(12, seed);
  const frameLen = hw * 2; // one frame is square
  tex.repeat.set(1 / (frameLen * 12), 1);
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.55, metalness: 0.2, roughness: 0.45, side: THREE.DoubleSide, alphaTest: 0.5 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData = { tex, count: idx.length, frameLen };
  return mesh;
}
const stripGroup = new THREE.Group();
const stripA = makeStrip({ turns: 1.7, radius: 5.0, height: 5.2, phase: 0.5, seed: 3 });
const stripB = makeStrip({ turns: 1.3, radius: 6.8, height: 4.0, phase: 2.8, seed: 9, hw: 0.42, wobble: 0.7 });
const stripC = makeStrip({ turns: 1.1, radius: 3.6, height: 3.2, phase: 4.6, seed: 5, hw: 0.36, wobble: 0.3 });
stripGroup.add(stripA, stripB, stripC);
scene.add(stripGroup);

// ============================================================
// Volumetric beams + dust
// ============================================================
const beamVS = `varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP;
void main(){ vUv=uv; vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vV=-mv.xyz; vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*mv; }`;
const beamFS = `uniform float uTime; uniform float uI; uniform vec3 uColor; uniform float uK;
varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP;
void main(){
  float ndv = abs(dot(normalize(vN), normalize(vV)));
  float edge = pow(ndv, 1.6);
  float ang = atan(vP.x, vP.z);
  float streak = 0.72 + 0.28*sin(ang*13.0 + uTime*0.25)*sin(ang*5.0 - uTime*0.17);
  float along = pow(clamp(vUv.y,0.,1.), uK);
  float tip = smoothstep(1.0, 0.93, vUv.y);
  gl_FragColor = vec4(uColor * uI * edge * streak * along * tip, 1.0);
}`;
function makeBeam(apex, target, radius, color = new THREE.Color(1.0, 0.82, 0.58), k = 0.9) {
  const dir = target.clone().sub(apex); const h = dir.length(); dir.normalize();
  const mat = new THREE.ShaderMaterial({ vertexShader: beamVS, fragmentShader: beamFS, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, uniforms: { uTime: { value: 0 }, uI: { value: 0 }, uColor: { value: color }, uK: { value: k } } });
  const m = new THREE.Mesh(new THREE.ConeGeometry(radius, h, 72, 1, true), mat);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  m.position.copy(apex).addScaledVector(dir, h / 2);
  m.userData = { apex, dir, tan: radius / h };
  return m;
}
const beamKey = makeBeam(new THREE.Vector3(5.5, 11, -5), new THREE.Vector3(-0.4, -1.3, 0.6), 3.4);
scene.add(beamKey);
const beamBackL = makeBeam(new THREE.Vector3(-9, 7, -12), new THREE.Vector3(0, 0.5, 0), 2.6, new THREE.Color(0.55, 0.72, 1.0), 0.7);
const beamBackR = makeBeam(new THREE.Vector3(9, 6, -13), new THREE.Vector3(0, 0.5, 0), 2.4, new THREE.Color(1.0, 0.62, 0.34), 0.7);
scene.add(beamBackL, beamBackR);

const dustVS = `attribute vec4 aSeed; uniform float uTime; uniform float uScale; uniform float uSize; uniform vec3 uBO; uniform vec3 uBD; uniform float uBT; uniform float uBase; uniform float uBeam; uniform vec3 uArea; uniform float uSpeed;
varying float vA;
void main(){
  vec3 p = position;
  p.x += sin(uTime*0.25*aSeed.x + aSeed.y*6.283)*0.9;
  p.z += cos(uTime*0.21*aSeed.z + aSeed.w*6.283)*0.9;
  p.y = mod(p.y + uTime*uSpeed*(0.4+aSeed.z) + uArea.y, 2.0*uArea.y) - uArea.y;
  vec3 tp = p - uBO; float along = dot(tp, uBD); float dist = length(tp - along*uBD);
  float cone = step(0.0, along) * smoothstep(along*uBT, along*uBT*0.35, dist);
  float tw = 0.65 + 0.35*sin(uTime*(1.5+aSeed.x*3.0) + aSeed.y*20.0);
  vA = (uBase + uBeam*cone) * tw;
  vec4 mv = modelViewMatrix*vec4(p,1.0);
  gl_PointSize = max(1.0, uSize*(0.4+aSeed.w)*uScale/-mv.z);
  gl_Position = projectionMatrix*mv;
}`;
const dustFS = `uniform vec3 uColor; uniform float uOp; uniform sampler2D uMap; varying float vA;
void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(uColor*vA*uOp*t.a*t.r, 1.0); }`;
function makeDust(count, area, size, tex, color, seed, base, beam, speed = 0.12) {
  const r = rng(seed);
  const pos = new Float32Array(count * 3), sd = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (r() - 0.5) * area.x * 2; pos[i * 3 + 1] = (r() - 0.5) * area.y * 2; pos[i * 3 + 2] = (r() - 0.5) * area.z * 2;
    sd[i * 4] = r(); sd[i * 4 + 1] = r(); sd[i * 4 + 2] = r(); sd[i * 4 + 3] = r();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aSeed", new THREE.BufferAttribute(sd, 4));
  const m = new THREE.ShaderMaterial({
    vertexShader: dustVS, fragmentShader: dustFS, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: {
      uTime: { value: 0 }, uScale: { value: H * 0.5 }, uSize: { value: size }, uBO: { value: beamKey.userData.apex }, uBD: { value: beamKey.userData.dir }, uBT: { value: beamKey.userData.tan },
      uBase: { value: base }, uBeam: { value: beam }, uArea: { value: new THREE.Vector3(area.x, area.y, area.z) }, uColor: { value: new THREE.Color(color) }, uOp: { value: 1 }, uMap: { value: tex }, uSpeed: { value: speed },
    },
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
}
const dust = makeDust(1800, { x: 11, y: 7, z: 11 }, 0.12, softTex, 0xffe6c0, 11, 0.18, 1.6);
const bokeh = makeDust(46, { x: 12, y: 7, z: 12 }, 1.0, bokehTex, 0xffd9a0, 21, 0.2, 0.9, 0.05);
scene.add(dust, bokeh);

// studio floor + light pool
const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshStandardMaterial({ color: 0x0a0a0c, metalness: 0, roughness: 0.9, envMapIntensity: 0.05, transparent: true, opacity: 0.82 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -1.45; scene.add(floor);
const pool = new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.MeshBasicMaterial({ map: radialTex([[0, "rgba(255,226,170,.55)"], [0.5, "rgba(255,180,100,.14)"], [1, "rgba(0,0,0,0)"]], 256), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
pool.rotation.x = -Math.PI / 2; pool.position.set(-0.4, -1.43, 0.4); scene.add(pool);

// lights
const keySpot = new THREE.SpotLight(0xffe2b8, 0, 40, 0.5, 0.6, 1.2); keySpot.position.copy(beamKey.userData.apex); keySpot.target.position.set(0, 0, 0.5); scene.add(keySpot, keySpot.target);
const rimL = new THREE.PointLight(0x6fa0ff, 0, 40, 1.6); rimL.position.set(-7, 3, -5); scene.add(rimL);
const rimR = new THREE.PointLight(0xff8a45, 0, 40, 1.6); rimR.position.set(7, 2.5, -6); scene.add(rimR);
const fillL = new THREE.PointLight(0xffffff, 0, 30, 1.8); fillL.position.set(2, 2.5, 8); scene.add(fillL);
const glintLight = new THREE.PointLight(0xffffff, 0, 8, 1.4); scene.add(glintLight);
const orbLight = new THREE.PointLight(0xffd9a0, 0, 30, 1.5); scene.add(orbLight);

// ============================================================
// World B: cinematic sunset
// ============================================================
const X0 = 2000;
const world = new THREE.Group();
world.position.x = X0;
scene.add(world);
const SUN = new THREE.Vector3(-14, 20, -330);
{
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uSun: { value: SUN.clone().normalize() } },
    vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uSun; varying vec3 vD;
      void main(){
        float h = clamp(vD.y,-0.1,1.0);
        vec3 zen = vec3(0.045,0.04,0.17), mid = vec3(0.55,0.17,0.30), hor = vec3(1.0,0.46,0.14);
        vec3 c = mix(hor, mid, smoothstep(0.0,0.22,h)); c = mix(c, zen, smoothstep(0.18,0.8,h));
        float s = max(dot(vD,uSun),0.0);
        c += vec3(1.0,0.62,0.25)*pow(s,24.0)*0.6 + vec3(1.0,0.85,0.55)*pow(s,300.0)*1.0;
        gl_FragColor = vec4(c,1.0);
      }`,
  }));
  world.add(sky);
  // sun disc + halo
  const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(0.4, 0.27, 0.16), fog: false }));
  sunSpr.scale.set(150, 150, 1); sunSpr.position.copy(SUN); world.add(sunSpr);
  const sunCore = new THREE.Mesh(new THREE.CircleGeometry(8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3.6, 2), toneMapped: false, fog: false }));
  sunCore.position.copy(SUN).add(new THREE.Vector3(0, 0, 4)); world.add(sunCore);
  // crepuscular shafts
  const shaftTex = canvasTex(64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,200,120,.55)"); gr.addColorStop(1, "rgba(255,160,80,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, "rgba(0,0,0,1)"); gx.addColorStop(.5, "rgba(0,0,0,0)"); gx.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = gx; g.fillRect(0, 0, w, h); });
  const rr = rng(77);
  for (let i = 0; i < 16; i++) {
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(14 + rr() * 22, 380), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.04 + rr() * 0.07, side: THREE.DoubleSide, fog: false }));
    const a = -Math.PI / 2 + (rr() - 0.5) * 2.6;
    sh.position.set(SUN.x + Math.cos(a) * 190 * 0.0, SUN.y, SUN.z + 6);
    sh.geometry.translate(0, -190, 0); sh.rotation.z = a + Math.PI / 2 - Math.PI / 2 + (rr() - 0.5) * 0.0;
    sh.rotation.z = (rr() - 0.5) * 2.4 + Math.PI; sh.userData.rot0 = sh.rotation.z; sh.userData.sp = (rr() - 0.5) * 0.03;
    sh.name = "shaft"; world.add(sh);
  }
  // mountains
  const noise = (x, s) => Math.sin(x * 0.011 * s + s) * 0.5 + Math.sin(x * 0.027 * s + s * 2) * 0.28 + Math.sin(x * 0.061 * s + s * 3.1) * 0.14 + Math.sin(x * 0.13 * s) * 0.06;
  const layers = [
    { z: -300, y: -4, a: 26, s: 1.0, c: [0.72, 0.30, 0.20] },
    { z: -230, y: -6, a: 34, s: 1.6, c: [0.55, 0.20, 0.20] },
    { z: -160, y: -6, a: 30, s: 2.2, c: [0.34, 0.12, 0.17] },
    { z: -100, y: -5, a: 24, s: 2.9, c: [0.18, 0.07, 0.12] },
    { z: -55, y: -4, a: 16, s: 3.6, c: [0.08, 0.035, 0.07] },
  ];
  layers.forEach((L) => {
    const sh = new THREE.Shape(); sh.moveTo(-700, -80);
    for (let x = -700; x <= 700; x += 5) sh.lineTo(x, L.y + L.a * (0.55 + noise(x, L.s) * 0.9));
    sh.lineTo(700, -80); sh.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: new THREE.Color(...L.c), fog: false }));
    m.position.z = L.z; world.add(m);
    // haze band over each layer
    const hz = new THREE.Mesh(new THREE.PlaneGeometry(1400, 36), new THREE.MeshBasicMaterial({ map: canvasTex(4, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,150,80,0)"); gr.addColorStop(0.55, "rgba(255,140,70,.35)"); gr.addColorStop(1, "rgba(255,140,70,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.35 - layers.indexOf(L) * 0.04 }));
    hz.position.set(0, L.y + 8, L.z + 1); world.add(hz);
  });
  // clouds
  const cloudTex = canvasTex(512, 128, (g, w, h) => { const r = rng(5); for (let i = 0; i < 70; i++) { const x = 70 + r() * (w - 140), y = h / 2 + (r() - 0.5) * h * 0.25, rad = 14 + r() * 26; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(255,255,255,.22)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); } });
  const cr = rng(31);
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(420, 90), new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, color: new THREE.Color().setHSL(0.02 + cr() * 0.06, 0.9, 0.5 + cr() * 0.1), opacity: 0.16 }));
    c.position.set((cr() - 0.5) * 700, 45 + cr() * 130, -420 - cr() * 120); c.userData.sp = 3 + cr() * 4; c.name = "cloud"; world.add(c);
  }
  // cliff (foreground ground)
  const gg = new THREE.PlaneGeometry(120, 90, 90, 70); gg.rotateX(-Math.PI / 2);
  const gp = gg.attributes.position;
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i);
    const edge = sstep(-14, -40, z);
    let y = 0.5 * Math.sin(x * 0.2) * Math.cos(z * 0.15) + 0.25 * Math.sin(x * 0.7 + z * 0.4);
    y -= edge * 30; y -= Math.pow(Math.abs(x) / 60, 3) * 8;
    gp.setY(i, y);
  }
  gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ color: 0x120a0a, roughness: 0.9, metalness: 0, envMapIntensity: 0.15 }));
  ground.position.set(0, 0, 0); world.add(ground);
  // lone figure with cloak
  const fig = new THREE.Group(); fig.name = "figure";
  const dark = new THREE.MeshStandardMaterial({ color: 0x050304, roughness: 0.8, envMapIntensity: 0.1 });
  const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.9, 24, 8, true), dark); cloak.position.y = 0.95; fig.add(cloak);
  const sh2 = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 12), dark); sh2.scale.set(1.25, 0.55, 0.7); sh2.position.y = 1.72; fig.add(sh2);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 14), dark); head.position.y = 2.03; fig.add(head);
  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.36, 16), dark); hood.position.y = 2.2; fig.add(hood);
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 2.6, 8), dark); staff.position.set(0.45, 1.3, 0.1); staff.rotation.z = -0.05; fig.add(staff);
  fig.position.set(0, 0.35, -8);
  world.add(fig);
  // rim light from the sun
  const sunLight = new THREE.DirectionalLight(0xff9a4a, 3.2); sunLight.position.set(-14, 20, -330); sunLight.target.position.set(0, 0, 0); world.add(sunLight, sunLight.target);
  world.add(new THREE.HemisphereLight(0xff8a55, 0x1a0b18, 0.55));
  // low mist
  const mistTex = canvasTex(256, 64, (g, w, h) => { const r = rng(9); for (let i = 0; i < 40; i++) { const x = r() * w, y = h / 2 + (r() - 0.5) * 12, rad = 10 + r() * 22; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(255,255,255,.3)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); } });
  const mr = rng(15);
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(90, 10), new THREE.MeshBasicMaterial({ map: mistTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xff9060, opacity: 0.5, fog: false }));
    m.position.set((mr() - 0.5) * 60, -0.6 + mr() * 2.2, -20 - i * 26); m.userData.sp = (mr() - 0.5) * 2; m.name = "mist"; world.add(m);
  }
  // warm drifting embers / dust in the world
  const wd = makeDust(900, { x: 22, y: 8, z: 30 }, 0.1, softTex, 0xffb878, 41, 0.55, 0, 0.22);
  wd.position.set(0, 4, -6); world.add(wd);
}
const worldFog = new THREE.Fog(0xa24a38, 120, 640);
const studioFog = new THREE.Fog(0x000000, 14, 42);

// ============================================================
// Letters + stage
// ============================================================
const stage = new THREE.Group(); scene.add(stage);
const letters = [];
const frags = { mesh: null, data: [] };
let fontReady;
const goldMat = new THREE.MeshStandardMaterial({ color: 0xf0cf8a, metalness: 1, roughness: 0.17, envMapIntensity: 1.6, emissive: 0x3a2200, emissiveIntensity: 0 });
const shockRing = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 128), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.4, 1.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
shockRing.position.set(0, 1, 0.2); scene.add(shockRing);
const orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(1.5, 1.1, 0.7) }));
orb.position.set(0, 1, 0); scene.add(orb);
const letterBackGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(1.0, 0.7, 0.4), opacity: 0 }));
letterBackGlow.position.set(0, 1.0, -3); letterBackGlow.scale.set(22, 9, 1); scene.add(letterBackGlow);
const reflGroup = new THREE.Group(); scene.add(reflGroup);
const LET_Y = 0.55;

const loadFont = new Promise((res) => new FontLoader().load("/node_modules/three/examples/fonts/helvetiker_bold.typeface.json", res));
fontReady = loadFont.then((font) => {
  const word = "CINEMA";
  let x = 0;
  const parts = [];
  for (const ch of word) {
    const geo = new TextGeometry(ch, { font, size: 1.55, height: 0.5, depth: 0.5, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 5 });
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    geo.translate(-bb.min.x, 0, -0.25);
    parts.push({ geo, x, w: bb.max.x - bb.min.x });
    x += bb.max.x - bb.min.x + 0.18;
  }
  const total = x - 0.18;
  const targets = [];
  parts.forEach((p, i) => {
    const m = new THREE.Mesh(p.geo, goldMat);
    m.position.set(p.x - total / 2, LET_Y, 0);
    stage.add(m);
    const rf = new THREE.Mesh(p.geo, new THREE.MeshStandardMaterial({ color: 0xe0ac4a, metalness: 1, roughness: 0.3, transparent: true, opacity: 0.22, envMapIntensity: 1.0 }));
    rf.position.set(p.x - total / 2, 2 * -1.45 - LET_Y, 0); rf.scale.y = -1; reflGroup.add(rf);
    letters.push({ m, rf, i, x: p.x - total / 2 + p.w / 2, w: p.w });
    // fragment targets on letter faces
    const pa = p.geo.attributes.position;
    for (let k = 0; k < pa.count; k += 3) targets.push(new THREE.Vector3(pa.getX(k) + m.position.x, pa.getY(k) + LET_Y, pa.getZ(k) + 0.25));
  });
  reflGroup.position.y = 0;
  // swarm of frames / light chips that converge into the letters
  const N = Math.min(targets.length, 420);
  const r = rng(99);
  const geo = new THREE.BoxGeometry(0.34, 0.24, 0.02);
  const mat = new THREE.MeshStandardMaterial({ map: makeFilmTexture(6, 4), emissiveMap: null, emissive: 0xffffff, emissiveIntensity: 0.0, metalness: 0.3, roughness: 0.4 });
  mat.emissiveMap = mat.map; mat.emissiveIntensity = 0.7;
  mat.map.repeat.set(1 / 6, 1);
  const im = new THREE.InstancedMesh(geo, mat, N);
  frags.mesh = im; frags.n = N;
  for (let i = 0; i < N; i++) {
    const tgt = targets[Math.floor(r() * targets.length)].clone();
    const ang = r() * Math.PI * 2, rad = 6 + r() * 12;
    const start = new THREE.Vector3(Math.cos(ang) * rad, (r() - 0.3) * 7, Math.sin(ang) * rad - 2);
    frags.data.push({ tgt, start, spin: new THREE.Vector3(r() * 6, r() * 6, r() * 6), delay: r() * 0.9, tw: (r() - 0.5) * 2, size: 0.4 + r() * 0.9 });
  }
  scene.add(im);
});

// ============================================================
// Scene state per time
// ============================================================
const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
const orbTh = track([[0, 0.72], [3, 0.58], [4.5, 3.3], [5.4, 5.65], [5.9, Math.PI * 2], [8, Math.PI * 2]]);
const orbR = track([[0, 11.5], [3, 10.4], [4.5, 9.8], [5.9, 8.6], [6.6, 5.8], [7.0, 4.4], [7.5, 2.4], [7.8, 0.4], [7.95, -1.3], [8.2, -3]]);
const orbY = track([[0, 1.5], [3, 1.2], [4.5, 0.9], [5.9, 0.1], [7, 0.0], [8, 0]]);
const tgtZ = track([[0, 0.3], [5.5, 0.3], [6.3, -1], [7.2, -8], [8, -12]]);
const tgtY = track([[0, 0.3], [5.5, 0.3], [6.5, 0.05], [8, 0]]);
const fovA = track([[0, 32], [3, 34], [4.5, 38], [5.9, 34], [6.8, 30], [7.5, 44], [7.95, 70]]);

// sunset world camera
const sunPosX = track([[8, -3], [10, 4]]);
const sunPosY = track([[8, 1.2], [8.8, 1.6], [10, 3.2]]);
const sunPosZ = track([[8, 16], [10, 3]]);
const sunTY = track([[8, 4.2], [10, 7.2]]);
const sunFov = track([[8, 42], [10, 33]]);

// letters stage camera
const stZ = track([[10, 15], [11.5, 13.4], [13, 12], [15, 10.2]]);
const stY = track([[10, 1.9], [12, 1.5], [13, 1.35], [15, 1.25]]);
const stX = track([[10, -1.5], [12.2, -0.2], [13.2, 0.4], [15, 0]]);

function blackout(on) {
  // toggles which major groups are rendered
  heroCam.visible = on.hero; stripGroup.visible = on.strip; tunnel.visible = on.tunnel;
  beamKey.visible = on.beamKey; beamBackL.visible = beamBackR.visible = on.beamBack;
  dust.visible = on.dust; bokeh.visible = on.dust; floor.visible = on.floor; pool.visible = on.floor;
  world.visible = on.world; stage.visible = on.stage; frags.mesh && (frags.mesh.visible = on.frags);
  reflGroup.visible = on.stage; orb.visible = on.orb; letterBackGlow.visible = on.stage; shockRing.visible = on.stage;
}

const flares = []; // per-frame flare sources {x,y,i,tint}
let fadeBlack = 0, flashWhite = 0, fadeInfo = {};

function setTime(t) {
  const dt = t;
  flares.length = 0;
  // defaults
  scene.fog = studioFog;
  scene.environment = envStudio;
  keySpot.intensity = 0; rimL.intensity = 0; rimR.intensity = 0; fillL.intensity = 0; glintLight.intensity = 0; orbLight.intensity = 0;
  beamKey.material.uniforms.uI.value = 0; beamBackL.material.uniforms.uI.value = 0; beamBackR.material.uniforms.uI.value = 0;
  dust.material.uniforms.uOp.value = 1; bokeh.material.uniforms.uOp.value = 1;
  [beamKey, beamBackL, beamBackR].forEach((b) => (b.material.uniforms.uTime.value = t));
  dust.material.uniforms.uTime.value = t; bokeh.material.uniforms.uTime.value = t;
  fadeBlack = 0; flashWhite = 0;
  const hero = t < 8.05;
  const sunset = t >= 8.0 && t < 10.12;
  const stg = t >= 10.0;

  // reel spin + scene visibility
  heroCam.userData.mags.forEach((m, i) => (m.rotation.x = t * (i % 2 ? 2.2 : -1.6)));
  [stripA, stripB, stripC].forEach((s, i) => { s.userData.tex.offset.x = -t * (0.55 + i * 0.12) / (s.userData.frameLen * 12) * (i === 1 ? -1 : 1); });

  blackout({ hero: hero || (t >= 10 && t < 11.7), strip: (t >= 3 && t < 6.6) || (t >= 10 && t < 11.7), tunnel: t >= 7.35 && t < 8.1, beamKey: t < 6.2 || (t >= 10 && t < 11.7), beamBack: t >= 2.8 && t < 6.5, dust: !sunset, floor: !sunset && (t < 8.1 || t >= 10), world: sunset, stage: t >= 11.0, frags: t >= 10.2 && t < 12.9, orb: t >= 10.0 && t < 12.9 });
  // lights are scene-wide; keep them off in the sunset world so it stays graded
  const studioLights = !sunset;

  // ------------------------------------------------------------
  if (t < 8.0 || (t >= 8.0 && t < 8.1)) {
    // ---- studio shots 1-3a ----
    const th = orbTh(t), R = orbR(t);
    const y = orbY(t);
    camPos.set(Math.sin(th) * R, y + (t < 3 ? 0 : 0), Math.cos(th) * R);
    camTgt.set(0, tgtY(t), tgtZ(t));
    if (t < 3) { camPos.y = lerp(1.7, 1.25, sstep(0, 3, t)); camTgt.set(lerp(0.2, 0, t / 3), lerp(0.25, 0.35, t / 3), 0.4); }
    cam.fov = fovA(t);

    // shot 1 lighting: beam fades up out of the dark, camera revealed
    const reveal = sstep(0.4, 2.6, t);
    const bI = (t < 3 ? 0.85 * sstep(0.1, 1.6, t) : 0.55) * (t > 5.4 ? 1 - sstep(5.4, 6.2, t) : 1);
    beamKey.material.uniforms.uI.value = bI;
    keySpot.intensity = 3 + 90 * reveal; keySpot.position.copy(beamKey.userData.apex);
    rimL.intensity = 8 + 38 * sstep(1.2, 3.4, t) * 1; rimR.intensity = 6 + 40 * sstep(1.5, 3.6, t);
    fillL.intensity = 0.6 * sstep(1.0, 3, t) + (t > 6 ? 4 : 0);
    renderer.toneMappingExposure = lerp(0.8, 1.15, reveal);
    floor.material.opacity = 1;
    pool.material.opacity = 1; pool.visible = true;
    const poolK = sstep(0.6, 2.4, t);
    pool.material.color.setScalar(poolK);
    const bBI = sstep(2.9, 3.6, t) * (1 - sstep(6.0, 6.5, t));
    beamBackL.material.uniforms.uI.value = 0.55 * bBI; beamBackR.material.uniforms.uI.value = 0.5 * bBI;
    dust.material.uniforms.uBeam.value = 1.6; dust.material.uniforms.uBase.value = 0.1 + 0.18 * sstep(1, 3, t);
    dust.material.uniforms.uOp.value = sstep(0.3, 1.5, t);
    bokeh.material.uniforms.uOp.value = 0.8 * sstep(0.8, 2.2, t);

    // strip unfurls out of the magazine
    const un = easeInOut((t - 3.0) / 1.5);
    stripGroup.rotation.y = (t - 3) * 0.9 + (t > 3 ? 0.2 : 0);
    stripA.geometry.setDrawRange(0, Math.floor((stripA.userData.count * un) / 6) * 6);
    stripB.geometry.setDrawRange(0, Math.floor((stripB.userData.count * easeInOut((t - 3.3) / 1.7)) / 6) * 6);
    stripC.geometry.setDrawRange(0, Math.floor((stripC.userData.count * easeInOut((t - 3.6) / 1.5)) / 6) * 6);
    stripGroup.scale.setScalar(1);
    stripGroup.position.set(0, 0, 0);
    heroCam.rotation.set(0, 0, 0); heroCam.scale.setScalar(1); heroCam.position.set(0, 0, CAMZ);
    // gentle idle float on the hero
    heroCam.position.y = Math.sin(t * 0.9) * 0.05;
    heroCam.rotation.y = Math.sin(t * 0.5) * 0.04;

    // lens glints (shot 1 sheen + shot 3a sweep)
    const gl1 = sstep(1.8, 2.3, t) * (1 - sstep(2.7, 3.0, t));
    if (t < 3.05) {
      flares.push({ x: 0.15, y: 0.2, z: GLASSZ + 0.2, i: 0.55 * gl1, tint: [1, 0.85, 0.7], ghosts: true });
      glintLight.position.set(0.25, 0.3, GLASSZ + 0.5); glintLight.intensity = 10 * gl1;
    }
    const gu = (t - 6.1) / 1.2;
    if (gu > 0 && gu < 1) {
      const gx = lerp(-0.7, 0.7, gu), gi = Math.sin(gu * Math.PI);
      flares.push({ x: gx, y: lerp(0.4, -0.1, gu), z: GLASSZ + 0.1, i: 1.1 * gi, tint: [0.85, 0.92, 1], ghosts: true, streak: 1.6 });
      glintLight.position.set(gx, 0.3, GLASSZ + 0.6); glintLight.intensity = 55 * gi;
    }
    // tunnel: iris opens as we fly through
    if (t >= 6.4) { setIris(lerp(0.05, 0.62, easeInOut((t - 7.2) / 0.75))); }
    // streak flares from strip highlights during orbit
    if (t > 3.6 && t < 5.9) flares.push({ x: Math.sin(t * 1.3) * 3, y: 1.5, z: 0, i: 0.18, tint: [1, 0.8, 0.6], ghosts: false, streak: 0.6 });

    // whips & flashes
    const w1 = 1 - sstep(0, 0.3, Math.abs(t - 3.0)); // quick punch into shot 2
    flashWhite = Math.max(w1 * 0.55, sstep(7.7, 7.98, t) * (1 - sstep(8.0, 8.12, t)) * 1.0);
    if (t < 0.01) fadeBlack = 1;
    fadeBlack = Math.max(fadeBlack, 1 - sstep(0, 0.9, t));
  }

  // ------------------------------------------------------------
  if (sunset) {
    scene.fog = worldFog;
    scene.environment = null;
    const k = t;
    camPos.set(X0 + sunPosX(k), sunPosY(k), sunPosZ(k));
    camTgt.set(X0 + sunPosX(k) * 0.3, sunTY(k), -60);
    cam.fov = sunFov(k);
    const fig = world.getObjectByName("figure");
    fig.rotation.z = Math.sin(t * 1.3) * 0.015; fig.children.forEach((c, i) => { if (i === 0) c.scale.x = 1 + Math.sin(t * 2.1) * 0.02; });
    world.children.forEach((c) => {
      if (c.name === "cloud") c.position.x += 0; // positions are pure functions below
    });
    world.traverse((c) => {
      if (c.name === "cloud") c.position.x = c.userData.baseX ?? (c.userData.baseX = c.position.x), c.position.x = c.userData.baseX + t * c.userData.sp;
      if (c.name === "mist") c.position.x = (c.userData.baseX ?? (c.userData.baseX = c.position.x)) + Math.sin(t * 0.4 + c.position.z) * 4 + t * c.userData.sp;
      if (c.name === "shaft") c.rotation.z = c.userData.rot0 + Math.sin(t * 0.3 + c.userData.rot0) * 0.03 + t * c.userData.sp;
    });
    const wdust = world.children[world.children.length - 1];
    wdust.material.uniforms.uTime.value = t;
    renderer.toneMappingExposure = 1.0;
    flares.push({ x: SUN.x + X0, y: SUN.y, z: SUN.z, i: 0.95, tint: [1, 0.72, 0.4], ghosts: true, streak: 1.2 });
    flashWhite = sstep(8.0, 8.0, t) * 0 + (1 - sstep(8.0, 8.35, t)) * 1.0 * (t < 8.4 ? 1 : 0);
    flashWhite = Math.max(flashWhite, sstep(9.8, 10.0, t));
    fadeBlack = 0;
  }

  // ------------------------------------------------------------
  if (stg) {
    const tt = t;
    const p = easeInOut((tt - 10.4) / 1.3); // elements converge
    const reveal = sstep(11.55, 12.25, tt);
    renderer.toneMappingExposure = 1.05;
    camPos.set(stX(tt), stY(tt), stZ(tt));
    camTgt.set(0, 0.9, 0);
    cam.fov = 35;
    if (tt >= 10.0 && tt < 11.9) {
      // hero camera + strips spiral into the centre and fold into light
      const sp = p, ang = sp * Math.PI * 3.2;
      const r0 = (1 - sp) * 5.5;
      heroCam.position.set(Math.cos(ang + 3.4) * r0 - (1 - sp) * 1.5, 1.0 + (1 - sp) * 0.4, Math.sin(ang + 3.4) * r0 + CAMZ * (1 - sp * 0.5));
      heroCam.rotation.set(0.1, -ang + 1.5, 0.15 * (1 - sp));
      heroCam.scale.setScalar(Math.max(0.0001, (1 - sstep(0.15, 0.95, sp)) * 0.85));
      stripGroup.position.set(0, 1.0, 0);
      stripGroup.rotation.y = tt * 1.8;
      stripGroup.scale.setScalar(Math.max(0.0001, (1 - sstep(0.1, 0.9, sp)) * 0.8));
      [stripA, stripB, stripC].forEach((s) => s.geometry.setDrawRange(0, s.userData.count));
      beamKey.material.uniforms.uI.value = 0.5 * (1 - sstep(10.8, 11.6, tt));
      keySpot.intensity = 40 * (1 - sstep(11, 11.7, tt)); keySpot.position.copy(beamKey.userData.apex); keySpot.target.position.set(0, 0.5, 0);
    }
    // swarm
    if (frags.mesh && tt >= 10.2 && tt < 12.9) {
      const d = new THREE.Object3D();
      frags.data.forEach((f, i) => {
        const k = easeInOut((tt - 10.3 - f.delay * 0.7) / 1.6);
        const swirl = (1 - k) * (2 + f.tw);
        const base = f.start.clone();
        base.applyAxisAngle(new THREE.Vector3(0, 1, 0), swirl * 1.8 * (1 - k));
        d.position.lerpVectors(base, f.tgt, k);
        d.position.y += Math.sin(tt * 2 + i) * 0.1 * (1 - k);
        d.rotation.set(f.spin.x * (1 - k), f.spin.y * (1 - k), f.spin.z * (1 - k));
        const fade = 1 - sstep(12.0, 12.35, tt);
        d.scale.setScalar(Math.max(0.0001, f.size * (0.5 + 0.5 * k) * fade));
        d.updateMatrix(); frags.mesh.setMatrixAt(i, d.matrix);
      });
      frags.mesh.instanceMatrix.needsUpdate = true;
    }
    // orb of light that grows as everything converges
    const orbK = sstep(10.5, 12.2, tt);
    orb.scale.setScalar(1.2 + orbK * 5.5 + sstep(12.0, 12.2, tt) * 6);
    orb.material.opacity = tt < 12.2 ? 0.25 + 0.75 * orbK : Math.max(0, 1 - (tt - 12.2) * 4);
    orbLight.position.set(0, 1, 0.5); orbLight.intensity = 20 + 120 * orbK * (tt < 12.2 ? 1 : Math.max(0, 1 - (tt - 12.2) * 3));

    // letters
    letters.forEach((L, i) => {
      const k = easeOut((tt - (11.55 + i * 0.07)) / 0.7);
      const sc = lerp(0.9, 1, k);
      L.m.visible = k > 0.001; L.rf.visible = k > 0.001;
      L.m.scale.set(sc, sc, lerp(0.2, 1, k));
      L.m.position.z = lerp(-1.2, 0, k);
      L.rf.scale.set(sc, -sc, lerp(0.2, 1, k));
    });
    goldMat.emissiveIntensity = 2.5 * (1 - sstep(12.2, 13.4, tt)) * sstep(11.6, 12.2, tt);
    // shockwave on impact
    const sw = (tt - 12.2) / 1.0;
    shockRing.visible = sw > 0 && sw < 1; shockRing.material.opacity = 0.9 * (1 - sw); shockRing.scale.setScalar(1 + sw * 14); shockRing.rotation.x = 0; shockRing.rotation.y = 0;
    // light rig for the logo
    const rig = sstep(11.6, 12.6, tt);
    rimL.position.set(-7, 3.5, -5); rimR.position.set(7, 3, -5.5);
    rimL.intensity = 40 * rig + 20; rimR.intensity = 48 * rig + 24; fillL.intensity = 2.5 + 12 * rig; fillL.position.set(1, 3, 9);
    keySpot.intensity = Math.max(keySpot.intensity, 55 * rig); keySpot.position.set(0.5, 8, 7); keySpot.target.position.set(0, 0.6, 0);
    // moving glint across the letters
    const gg = (tt - 13.1) / 1.4;
    glintLight.intensity = 0;
    if (gg > 0 && gg < 1) { glintLight.position.set(lerp(-5, 5, gg), 1.9, 2.2); glintLight.intensity = 90 * Math.sin(gg * Math.PI); }
    // volumetric backlights
    const bb = rig * 0.9;
    beamBackL.material.uniforms.uI.value = 0.5 * bb; beamBackR.material.uniforms.uI.value = 0.5 * bb;
    beamBackL.visible = beamBackR.visible = tt >= 11.2;
    letterBackGlow.material.opacity = 0.55 * rig * (0.85 + 0.15 * Math.sin(tt * 1.7));
    dust.material.uniforms.uBase.value = 0.3; dust.material.uniforms.uBeam.value = 0.3;
    // flares
    if (tt >= 10.5) flares.push({ x: 0, y: 1, z: 0, i: 0.9 * orbK * (tt < 12.2 ? 1 : Math.max(0.0, 1 - (tt - 12.2) * 1.2)), tint: [1, 0.78, 0.5], ghosts: true, streak: 2.2 });
    if (tt >= 12.4) flares.push({ x: 0, y: 1.2, z: -3, i: 0.45 * sstep(12.4, 13.2, tt), tint: [1, 0.75, 0.45], ghosts: false, streak: 1.4 });
    if (gg > 0 && gg < 1) flares.push({ x: lerp(-5, 5, gg), y: 1.6, z: 1, i: 0.9 * Math.sin(gg * Math.PI), tint: [0.9, 0.95, 1], ghosts: true, streak: 1.8 });
    // transitions
    flashWhite = Math.max(flashWhite, sstep(9.8, 10.0, tt) * (1 - sstep(10.0, 10.25, tt)));
    if (tt >= 12.1 && tt < 12.7) flashWhite = Math.max(flashWhite, 1 - sstep(12.2, 12.7, tt));
    if (tt >= 12.0 && tt < 12.2) flashWhite = Math.max(flashWhite, sstep(12.0, 12.2, tt) * 0.9);
    if (tt >= 10.0 && tt < 10.15) fadeBlack = Math.max(fadeBlack, 0);
    fadeBlack = Math.max(fadeBlack, sstep(14.35, 15.0, tt));
    fadeInfo.tag = sstep(13.5, 14.0, tt) * (1 - sstep(14.5, 14.95, tt));
  } else fadeInfo.tag = 0;

  cam.position.copy(camPos); cam.lookAt(camTgt);
  // slight handheld-free "operator" drift
  cam.rotateZ(Math.sin(t * 0.6) * 0.004);
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
}

// ============================================================
// 2D post stack
// ============================================================
const out = document.getElementById("c"); out.width = W; out.height = H;
const octx = out.getContext("2d", { alpha: false });
const mk = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const acc = mk(W, H), actx = acc.getContext("2d", { alpha: false });
const bl1 = mk(W / 6, H / 6), b1 = bl1.getContext("2d");
const bl2 = mk(W / 14, H / 14), b2 = bl2.getContext("2d");
const stk0 = mk(W / 5, H / 5), s0 = stk0.getContext("2d");
const stk1 = mk(W / 90, H / 5), s1 = stk1.getContext("2d");
const edge = mk(W / 2, H / 2), ectx = edge.getContext("2d");
const grain = mk(512, 512);
{
  const g = grain.getContext("2d"), id = g.createImageData(512, 512), r = rng(3);
  for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0);
}
const vig = mk(W / 4, H / 4);
{
  const g = vig.getContext("2d"); const gr = g.createRadialGradient(vig.width / 2, vig.height / 2, vig.height * 0.35, vig.width / 2, vig.height / 2, vig.width * 0.62);
  gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.72)"); g.fillStyle = gr; g.fillRect(0, 0, vig.width, vig.height);
}
const edgeMask = mk(W / 2, H / 2);
{
  const g = edgeMask.getContext("2d"); const gr = g.createRadialGradient(edgeMask.width / 2, edgeMask.height / 2, edgeMask.height * 0.38, edgeMask.width / 2, edgeMask.height / 2, edgeMask.width * 0.6);
  gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)"); g.fillStyle = gr; g.fillRect(0, 0, edgeMask.width, edgeMask.height);
}

function project(x, y, z) {
  const v = new THREE.Vector3(x, y, z).project(cam);
  return { sx: (v.x * 0.5 + 0.5) * W, sy: (-v.y * 0.5 + 0.5) * H, z: v.z, behind: v.z > 1 };
}

function drawFlare(g, f) {
  const p = project(f.x, f.y, f.z);
  if (p.behind || f.i <= 0.001) return;
  const edgeFade = 1 - clamp((Math.max(Math.abs(p.sx / W - 0.5), Math.abs(p.sy / H - 0.5)) - 0.5) / 0.35);
  const I = f.i * edgeFade;
  if (I <= 0.001) return;
  const [r, gg, b] = f.tint.map((c) => Math.round(c * 255));
  g.save(); g.globalCompositeOperation = "lighter";
  const R = H * 0.28 * I + H * 0.04;
  let gr = g.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, R);
  gr.addColorStop(0, `rgba(255,255,255,${0.9 * Math.min(1, I)})`); gr.addColorStop(0.12, `rgba(${r},${gg},${b},${0.55 * Math.min(1, I)})`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = gr; g.fillRect(p.sx - R, p.sy - R, R * 2, R * 2);
  // anamorphic streak (blue-ish)
  const sl = (f.streak ?? 1) * W * 0.55 * Math.min(1.3, I), sh = Math.max(2, H * 0.0035 * (0.6 + I));
  gr = g.createLinearGradient(p.sx - sl, 0, p.sx + sl, 0);
  gr.addColorStop(0, "rgba(80,140,255,0)"); gr.addColorStop(0.5, `rgba(150,195,255,${0.8 * Math.min(1, I)})`); gr.addColorStop(1, "rgba(80,140,255,0)");
  g.fillStyle = gr; g.fillRect(p.sx - sl, p.sy - sh / 2, sl * 2, sh);
  g.fillStyle = `rgba(255,255,255,${0.4 * Math.min(1, I)})`; g.fillRect(p.sx - sl * 0.18, p.sy - sh * 0.2, sl * 0.36, sh * 0.4);
  // ghosts along the optical axis
  if (f.ghosts) {
    const cx = W / 2, cy = H / 2;
    const ghosts = [[0.35, 0.05, 120, 0.4], [0.6, 0.09, 40, 0.5], [-0.25, 0.14, 200, 0.25], [-0.55, 0.06, 300, 0.35], [-0.9, 0.18, 30, 0.2], [1.25, 0.1, 160, 0.22]];
    ghosts.forEach(([k, rad, hue, al], gi) => {
      const gx = p.sx + (cx - p.sx) * (1 + k) , gy = p.sy + (cy - p.sy) * (1 + k);
      const rr = H * rad * (0.6 + I * 0.6);
      const col = `hsla(${hue},85%,62%,`;
      const grr = g.createRadialGradient(gx, gy, rr * 0.55, gx, gy, rr);
      grr.addColorStop(0, col + "0)"); grr.addColorStop(0.85, col + `${al * 0.5 * Math.min(1, I)})`); grr.addColorStop(1, col + "0)");
      g.fillStyle = grr;
      g.beginPath();
      if (gi % 2) { for (let q = 0; q < 6; q++) { const a = (q / 6) * Math.PI * 2 + 0.5; q ? g.lineTo(gx + Math.cos(a) * rr, gy + Math.sin(a) * rr) : g.moveTo(gx + Math.cos(a) * rr, gy + Math.sin(a) * rr); } g.closePath(); } else g.arc(gx, gy, rr, 0, 7);
      g.fill();
    });
  }
  g.restore();
}

function post(t) {
  const g = octx;
  g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.filter = "none";
  g.drawImage(acc, 0, 0);

  // bloom (two radii) with soft threshold via contrast
  b1.clearRect(0, 0, bl1.width, bl1.height); b1.filter = `brightness(0.75) contrast(2.6) blur(${Math.round(7 * S)}px)`; b1.drawImage(acc, 0, 0, bl1.width, bl1.height); b1.filter = "none";
  b2.clearRect(0, 0, bl2.width, bl2.height); b2.filter = `brightness(0.75) contrast(2.4) blur(${Math.round(5 * S)}px)`; b2.drawImage(acc, 0, 0, bl2.width, bl2.height); b2.filter = "none";
  g.globalCompositeOperation = "lighter";
  g.globalAlpha = 0.55; g.drawImage(bl1, 0, 0, W, H);
  g.globalAlpha = 0.7; g.drawImage(bl2, 0, 0, W, H);

  // anamorphic horizontal streak from bright pixels
  s0.clearRect(0, 0, stk0.width, stk0.height); s0.filter = "brightness(0.7) contrast(3.2)"; s0.drawImage(acc, 0, 0, stk0.width, stk0.height); s0.filter = "none";
  s1.clearRect(0, 0, stk1.width, stk1.height); s1.drawImage(stk0, 0, 0, stk1.width, stk1.height);
  s1.globalCompositeOperation = "multiply"; s1.fillStyle = "rgb(110,160,255)"; s1.fillRect(0, 0, stk1.width, stk1.height); s1.globalCompositeOperation = "source-over";
  g.globalAlpha = 0.5; g.imageSmoothingEnabled = true; g.drawImage(stk1, 0, 0, W, H);
  g.globalAlpha = 1;

  // flares
  flares.forEach((f) => drawFlare(g, f));

  // lens-edge softness (poor man's depth of field / anamorphic falloff)
  g.globalCompositeOperation = "source-over";
  ectx.clearRect(0, 0, edge.width, edge.height); ectx.filter = `blur(${Math.round(5 * S)}px)`; ectx.drawImage(out, 0, 0, edge.width, edge.height); ectx.filter = "none";
  ectx.globalCompositeOperation = "destination-in"; ectx.drawImage(edgeMask, 0, 0); ectx.globalCompositeOperation = "source-over";
  g.globalAlpha = 0.9; g.drawImage(edge, 0, 0, W, H); g.globalAlpha = 1;

  // vignette
  g.drawImage(vig, 0, 0, W, H);

  // grade: gentle teal shadows / warm highlights via soft light
  g.globalCompositeOperation = "soft-light"; g.globalAlpha = 0.22; g.fillStyle = "#2a6a8a"; g.fillRect(0, 0, W, H);
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over";

  // film grain
  g.globalCompositeOperation = "soft-light"; g.globalAlpha = 0.16;
  const fx = Math.floor(((Math.sin(t * 91.7) + 1) / 2) * 400), fy = Math.floor(((Math.cos(t * 57.3) + 1) / 2) * 400);
  for (let y = -fy; y < H; y += 512) for (let x = -fx; x < W; x += 512) g.drawImage(grain, x, y);
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over";

  // Arabic tagline under the logo
  if (fadeInfo.tag > 0.001) {
    g.save(); g.globalAlpha = fadeInfo.tag; g.textAlign = "center"; g.direction = "rtl";
    g.font = `700 ${Math.round(H * 0.052)}px Cairo`;
    const y = H * 0.9; const gr = g.createLinearGradient(W * 0.4, 0, W * 0.6, 0);
    gr.addColorStop(0, "#c88f3a"); gr.addColorStop(0.5, "#ffe6a8"); gr.addColorStop(1, "#c88f3a");
    g.fillStyle = gr; g.shadowColor = "rgba(255,190,90,.7)"; g.shadowBlur = 24 * S;
    g.fillText("اصنع قصتك", W / 2, y);
    g.restore();
  }

  // flash & fade
  if (flashWhite > 0.002) { g.fillStyle = `rgba(255,246,232,${clamp(flashWhite)})`; g.fillRect(0, 0, W, H); }
  if (fadeBlack > 0.002) { g.fillStyle = `rgba(0,0,0,${clamp(fadeBlack)})`; g.fillRect(0, 0, W, H); }
}

// motion-blur windows (shutter in frames) — longer on whips/fly-through
function shutterAt(t) {
  let s = 0.5;
  if (Math.abs(t - 3.0) < 0.45) s = 2.2;
  if (t > 4.4 && t < 6.0) s = 1.4;
  if (t > 7.0 && t < 8.1) s = 2.0;
  if (t > 9.85 && t < 10.25) s = 1.6;
  if (t > 10.3 && t < 12.1) s = 0.9;
  return s;
}

window.render = (t) => {
  const sh = shutterAt(t) / FPS;
  const sub = shutterAt(t) > 1.2 ? Math.max(SUB_BASE, 6) : SUB_BASE;
  for (let i = 0; i < sub; i++) {
    const ti = t + ((i + 0.5) / sub - 0.5) * sh;
    setTime(Math.max(0, ti));
    if (qs.get('aa') === '0') { const a = (i * 0.618034) % 1, b = (i * 0.754877) % 1; cam.setViewOffset(W, H, (a - 0.5) * 1.0, (b - 0.5) * 1.0, W, H); } 
    renderer.render(scene, cam); cam.clearViewOffset();
    if (i === 0) { actx.globalAlpha = 1; actx.drawImage(glCanvas, 0, 0); } else { actx.globalAlpha = 1 / (i + 1); actx.drawImage(glCanvas, 0, 0); }
    if (i === Math.floor(sub / 2)) { var keep = { flares: flares.map((f) => ({ ...f })), fb: fadeBlack, fw: flashWhite, tag: fadeInfo.tag }; }
  }
  actx.globalAlpha = 1;
  // post uses the mid-sample's overlay state and camera
  setTime(t);
  flares.length = 0; keep.flares.forEach((f) => flares.push(f)); fadeBlack = keep.fb; flashWhite = keep.fw; fadeInfo.tag = keep.tag;
  post(t);
};

window.profile = (t) => { const a = performance.now(); setTime(t); const b = performance.now(); renderer.render(scene, cam); renderer.getContext().finish(); const c = performance.now(); actx.drawImage(glCanvas,0,0); post(t); const d = performance.now(); return [b - a, c - b, d - c].map((x) => Math.round(x)); };
window.ready = (async () => {
  await document.fonts.load("700 40px Cairo", "اصنع قصتك");
  await fontReady;
  window.render(0.5);
  return true;
})();
