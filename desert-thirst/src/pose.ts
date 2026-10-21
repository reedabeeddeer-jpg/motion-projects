import { interpolate } from "remotion";
import type { Pose } from "./Man";
import { camX, T } from "./timeline";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const mix = (a: Pose, b: Pose, t: number): Pose => {
  const o = {} as Pose;
  (Object.keys(a) as (keyof Pose)[]).forEach((k) => (o[k] = a[k] + (b[k] - a[k]) * t));
  return o;
};
const ease = (t: number) => t * t * (3 - 2 * t);

const STAND: Pose = { thighF: 0, kneeF: 4, thighB: 0, kneeB: 4, armUF: 0, armLF: -10, armUB: 0, armLB: -10, lean: 4, head: 0, hipY: 182, bob: 0 };

const walk = (f: number, k: number, lean: number, head: number): Pose => {
  const p = (camX(f) * 2 * Math.PI) / 240;
  const s = Math.sin(p);
  const c = Math.cos(p);
  return {
    thighF: -24 * s * k,
    thighB: 24 * s * k,
    kneeF: 6 + 32 * Math.max(0, c) * k,
    kneeB: 6 + 32 * Math.max(0, -c) * k,
    armUF: 22 * s * k,
    armUB: -22 * s * k,
    armLF: -18 - 10 * k,
    armLB: -18 - 10 * k,
    lean,
    head,
    hipY: 182,
    bob: -6 * (1 - Math.abs(s)) * k,
  };
};

const WIPE = (f: number): Pose => ({ ...STAND, lean: 10, head: 6, armUF: -130, armLF: -95 + Math.sin(f / 4) * 14 });

const KNEEL: Pose = { thighF: -4, kneeF: 96, thighB: 2, kneeB: 92, armUF: 0, armLF: -10, armUB: 0, armLB: -10, lean: 10, head: 0, hipY: 94, bob: 0 };
const SCOOP: Pose = { ...KNEEL, lean: 52, head: 10, armUF: -74, armLF: -8, armUB: -70, armLB: -8 };
const SIP: Pose = { ...KNEEL, lean: 14, head: -12, armUF: -92, armLF: -124, armUB: -86, armLB: -126 };
const PRAISE: Pose = { ...KNEEL, lean: -4, head: -20, armUF: -42, armLF: -52, armUB: -38, armLB: -55 };

export const poseAt = (f: number): Pose => {
  if (f < T.slowStart) return walk(f, 1, 5, 0);
  if (f < T.stop) {
    const t = (f - T.slowStart) / (T.stop - T.slowStart);
    return walk(f, 1 - 0.45 * t, 5 + 10 * t, 22 * t);
  }
  if (f < T.povStart) {
    const into = ease(interpolate(f, [T.stop, T.stop + 14], [0, 1], cl));
    const outof = ease(interpolate(f, [T.povStart - 14, T.povStart], [0, 1], cl));
    const tired = walk(T.stop, 0.55, 15, 22);
    const wipe = WIPE(f);
    return mix(mix(tired, wipe, into), { ...STAND, lean: 6, head: -14 }, outof);
  }
  if (f < T.povEnd) return { ...STAND, lean: 6, head: -14 };
  if (f < T.runEnd) {
    const k = interpolate(f, [T.povEnd, T.povEnd + 12, T.runEnd - 12, T.runEnd], [0.4, 1.5, 1.5, 0.6], cl);
    return walk(f, k, 14, -6);
  }
  if (f < T.runEnd + 24) return mix(walk(T.runEnd, 0.6, 14, -6), KNEEL, ease((f - T.runEnd) / 24));
  if (f < T.drinkEnd) {
    // kneel -> scoop, then two scoop-and-sip cycles, ending on a sip
    const local = f - (T.runEnd + 24);
    if (local < 12) return mix(KNEEL, SCOOP, ease(local / 12));
    const cycle = (T.drinkEnd - (T.runEnd + 24) - 12) / 2;
    const n = Math.floor((local - 12) / cycle);
    const c = ((local - 12) % cycle) / cycle;
    if (c < 0.3) return SCOOP;
    if (c < 0.6) return mix(SCOOP, SIP, ease((c - 0.3) / 0.3));
    if (c < 0.85 || n >= 1) return SIP;
    return mix(SIP, SCOOP, ease((c - 0.85) / 0.15));
  }
  const t = ease(interpolate(f, [T.drinkEnd, T.drinkEnd + 20], [0, 1], cl));
  const p = mix(SIP, PRAISE, t);
  return { ...p, lean: p.lean + Math.sin(f / 12) * 1.5 };
};
