import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT } from "./fonts";

export const COLORS = {
  navy: "#071433",
  blue: "#1C5FD1",
  sky: "#8FD3FF",
  white: "#F5F8FF",
  gold: "#F2C14E",
  goldDeep: "#B8862B",
  garnet: "#A50044",
  barcaBlue: "#004D98",
  red: "#E2231A",
};

export const GOLD_TEXT: React.CSSProperties = {
  backgroundImage: "linear-gradient(180deg, #FFF3C4 0%, #F2C14E 45%, #D49A32 60%, #8F6420 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
export const inExpo = Easing.bezier(0.7, 0, 0.84, 0);
export const outBack = Easing.bezier(0.34, 1.56, 0.64, 1);

// time-based helper: progress of [start, start + dur] seconds, eased
export const useProgress = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = (start: number, dur: number, easing: (k: number) => number = outExpo) =>
    interpolate(t, [start, start + dur], [0, 1], { ...clamp, easing });
  return { t, frame, fps, p };
};

// decaying camera shake for a list of impact times (seconds)
export const shakeAt = (t: number, hits: { at: number; amount: number }[]) => {
  let x = 0;
  let y = 0;
  for (const h of hits) {
    const k = (t - h.at) / 0.5;
    if (k > 0 && k < 1) {
      const a = h.amount * (1 - k) * (1 - k);
      x += Math.sin(t * 97 + h.at) * a;
      y += Math.cos(t * 83 + h.at) * a;
    }
  }
  return `${x.toFixed(1)}px ${y.toFixed(1)}px`;
};

export const CoverImage: React.FC<{ src: string; zoom: number; x?: number; y?: number; filter?: string }> = ({
  src,
  zoom,
  x = 0,
  y = 0,
  filter,
}) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <Img
      src={staticFile(src)}
      style={{ width: "100%", height: "100%", objectFit: "cover", scale: String(zoom), translate: `${x}px ${y}px`, filter }}
    />
  </AbsoluteFill>
);

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.7 }) => (
  <AbsoluteFill
    style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,${strength}) 100%)` }}
  />
);

// drifting particles (dust / sparks / bubbles share this)
export const Particles: React.FC<{
  seed: string;
  count: number;
  color: string;
  speed?: number;
  size?: [number, number];
  up?: boolean;
  opacity?: number;
  glow?: boolean;
}> = ({ seed, count, color, speed = 40, size = [2, 6], up = true, opacity = 0.8, glow = true }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const v = speed * (0.4 + r("v"));
        const yy = (((r("y") * height - (up ? 1 : -1) * v * t) % height) + height) % height;
        const xx = r("x") * width + Math.sin(t * 0.8 + r("p") * 6) * 30;
        const s = size[0] + r("s") * (size[1] - size[0]);
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 2.2 + r("p") * 6));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: xx,
              top: yy,
              width: s,
              height: s,
              borderRadius: "50%",
              background: color,
              opacity: opacity * tw,
              boxShadow: glow ? `0 0 ${s * 3}px ${color}` : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// diagonal light beams sweeping like stadium floodlights
export const LightBeams: React.FC<{ color?: string; opacity?: number }> = ({
  color = "rgba(170,215,255,0.16)",
  opacity = 1,
}) => {
  const { t } = useProgress();
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "screen", overflow: "hidden" }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: ((t * (220 + i * 90) + i * 650) % 3100) - 600,
            top: -400,
            width: 260 + i * 60,
            height: 2000,
            rotate: "-24deg",
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

export const Shockwave: React.FC<{ at: number; x: number; y: number; color?: string; maxR?: number }> = ({
  at,
  x,
  y,
  color = "255,255,255",
  maxR = 1100,
}) => {
  const { t } = useProgress();
  const k = (t - at) / 0.9;
  if (k <= 0 || k >= 1) return null;
  const r = (1 - Math.pow(1 - k, 3)) * maxR;
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        border: `${30 * (1 - k) + 2}px solid rgba(${color},${(1 - k) * 0.9})`,
        boxShadow: `0 0 60px rgba(${color},${(1 - k) * 0.6})`,
      }}
    />
  );
};

export const Sparks: React.FC<{ at: number; x: number; y: number; seed: string; count?: number }> = ({
  at,
  x,
  y,
  seed,
  count = 60,
}) => {
  const { t } = useProgress();
  const age = t - at;
  if (age < 0 || age > 1.1) return null;
  const life = 1 - age / 1.1;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {new Array(count).fill(0).map((_, i) => {
        const a = random(`${seed}-a-${i}`) * Math.PI * 2;
        const v = 500 + random(`${seed}-v-${i}`) * 1300;
        const d = (v * (1 - Math.exp(-age * 3))) / 3;
        const len = 20 + random(`${seed}-l-${i}`) * 70;
        const gold = random(`${seed}-c-${i}`) < 0.5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + Math.cos(a) * d,
              top: y + Math.sin(a) * d + 200 * age * age,
              width: len,
              height: 4 * life + 1,
              borderRadius: 4,
              transformOrigin: "0 50%",
              rotate: `${a}rad`,
              background: gold ? `rgba(255,205,90,${life})` : `rgba(170,215,255,${life})`,
              boxShadow: gold ? "0 0 10px rgba(255,190,60,0.9)" : "0 0 10px rgba(140,200,255,0.9)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// radial speed lines (zoom streaks), strength 0..1
export const SpeedLines: React.FC<{ strength: number; color?: string; seed?: string }> = ({
  strength,
  color = "255,240,210",
  seed = "speed",
}) => {
  const { width, height } = useVideoConfig();
  if (strength <= 0.01) return null;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {new Array(80).fill(0).map((_, i) => {
        const a = random(`${seed}-${i}`) * 360;
        const d0 = 120 + random(`${seed}-d-${i}`) * 400;
        const len = 300 + random(`${seed}-len-${i}`) * 900 * strength;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: width / 2,
              top: height / 2,
              width: len,
              height: 1 + random(`${seed}-w-${i}`) * 3,
              transformOrigin: "0 50%",
              rotate: `${a}deg`,
              translate: `${d0}px 0`,
              background: `linear-gradient(90deg, rgba(${color},0), rgba(${color},${0.5 * strength}))`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Flash: React.FC<{ at: number; dur?: number; color?: string; peak?: number; centered?: boolean }> = ({
  at,
  dur = 0.35,
  color = "255,255,255",
  peak = 0.9,
  centered = false,
}) => {
  const { t } = useProgress();
  const k = centered ? 1 - Math.abs(t - at) / dur : t >= at ? 1 - (t - at) / dur : 0;
  if (k <= 0) return null;
  return <AbsoluteFill style={{ background: `rgba(${color},${k * peak})` }} />;
};

// a word-by-word kinetic caption (RTL). Words pop in at their own times (seconds).
export const KineticLine: React.FC<{
  words: { text: string; at: number; color?: string; gold?: boolean }[];
  y: number;
  size: number;
  weight?: number;
  align?: "center" | "right";
  right?: number;
}> = ({ words, y, size, weight = 900, align = "center", right = 80 }) => {
  const { p } = useProgress();
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 80,
        right,
        display: "flex",
        flexDirection: "row",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: size * 0.28,
        fontFamily: FONT,
        fontWeight: weight,
        fontSize: size,
        direction: "rtl",
        lineHeight: 1.25,
      }}
    >
      {words.map((w, i) => {
        const k = p(w.at, 0.45, outBack);
        const a = p(w.at, 0.2);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: a,
              scale: String(0.4 + 0.6 * k),
              translate: `0 ${(1 - k) * 40}px`,
              filter: `blur(${(1 - a) * 10}px)`,
              color: w.color ?? COLORS.white,
              textShadow: w.gold ? undefined : "0 6px 30px rgba(0,0,0,0.55)",
              ...(w.gold ? GOLD_TEXT : {}),
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 6;
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.22, pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
