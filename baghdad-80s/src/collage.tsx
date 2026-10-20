import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CAIRO } from "./fonts";
import { PALETTE } from "./timeline";

// Cut-out animation runs "on twos" like stop-motion paper animation.
export const onTwos = (frame: number) => frame - (frame % 2);

// Torn-paper clip-path: jagged edges of `amp` px around any box size.
export const torn = (seed: string, amp = 7, steps = 22): string => {
  const pts: string[] = [];
  const r = (i: number, side: string) => (random(`${seed}-${side}-${i}`) * amp).toFixed(1);
  for (let i = 0; i <= steps; i++) pts.push(`${(i / steps) * 100}% ${r(i, "t")}px`);
  for (let i = 1; i <= steps; i++) pts.push(`calc(100% - ${r(i, "r")}px) ${(i / steps) * 100}%`);
  for (let i = steps - 1; i >= 0; i--) pts.push(`${(i / steps) * 100}% calc(100% - ${r(i, "b")}px)`);
  for (let i = steps - 1; i >= 1; i--) pts.push(`${r(i, "l")}px ${(i / steps) * 100}%`);
  return `polygon(${pts.join(", ")})`;
};

// Shared SVG filter: white paper border + drop shadow, the "cut with scissors" look.
export const CutDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id="cut" x="-15%" y="-15%" width="130%" height="130%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d" />
        <feFlood floodColor="#fbf5e6" />
        <feComposite in2="d" operator="in" result="border" />
        <feMerge result="m">
          <feMergeNode in="border" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
        <feDropShadow in="m" dx="5" dy="9" stdDeviation="5" floodColor="#000" floodOpacity="0.38" />
      </filter>
      <pattern id="halftone" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="7" cy="7" r="3.2" fill="rgba(0,0,0,0.18)" />
      </pattern>
    </defs>
  </svg>
);

type From = "scale" | "left" | "right" | "top" | "bottom" | "drop";

// Positioned collage piece with a springy stepped entrance and a subtle "boil" jitter.
export const Cut: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  rot?: number;
  delay?: number;
  from?: From;
  seed: string;
  z?: number;
  children: React.ReactNode;
}> = ({ x, y, w, h, rot = 0, delay = 0, from = "scale", seed, z, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = onTwos(frame);
  const p = spring({ frame: f - delay, fps, config: { damping: 13, stiffness: 170, mass: 0.9 } });
  const tick = Math.floor(frame / 4);
  const jr = (random(`${seed}-r-${tick}`) - 0.5) * 0.9;
  const jx = (random(`${seed}-x-${tick}`) - 0.5) * 2.4;
  const jy = (random(`${seed}-y-${tick}`) - 0.5) * 2.4;

  let tx = 0;
  let ty = 0;
  let s = 1;
  let extraRot = 0;
  const away = 1 - p;
  if (from === "scale") {
    s = p;
    extraRot = away * -18;
  } else if (from === "left") tx = away * -1300;
  else if (from === "right") tx = away * 1300;
  else if (from === "top") ty = away * -2100;
  else if (from === "bottom") ty = away * 2100;
  else if (from === "drop") {
    s = interpolate(p, [0, 1], [1.8, 1]);
    extraRot = away * 10;
  }
  const opacity = from === "drop" ? interpolate(f - delay, [0, 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : f >= delay ? 1 : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        zIndex: z,
        opacity,
        transform: `translate(${tx + jx}px, ${ty + jy}px) rotate(${rot + extraRot + jr}deg) scale(${s})`,
      }}
    >
      {children}
    </div>
  );
};

// A piece of torn paper (fills its parent) with optional halftone overlay.
export const Paper: React.FC<{
  color: string;
  seed: string;
  halftone?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ color, seed, halftone, style, children }) => (
  <div style={{ width: "100%", height: "100%", filter: "drop-shadow(5px 9px 6px rgba(0,0,0,0.35))", ...style }}>
    <div
      style={{
        width: "100%",
        height: "100%",
        background: color,
        clipPath: torn(seed),
        backgroundImage: halftone ? "radial-gradient(circle, rgba(0,0,0,0.16) 32%, transparent 36%)" : undefined,
        backgroundSize: halftone ? "16px 16px" : undefined,
        position: "relative",
      }}
    >
      {children}
    </div>
  </div>
);

// Translucent masking tape strip.
export const Tape: React.FC<{ x: number; y: number; w?: number; rot?: number; seed: string }> = ({ x, y, w = 170, rot = -12, seed }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: 46,
      transform: `rotate(${rot}deg)`,
      background: "rgba(246, 236, 200, 0.78)",
      clipPath: torn(seed, 4, 10),
      boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
      zIndex: 20,
    }}
  />
);

// Ransom-note style headline: each word on its own torn chip, popping in one by one.
export const Chips: React.FC<{
  words: { t: string; bg: string; fg: string; font?: string; size?: number }[];
  x: number;
  y: number;
  w: number;
  delay?: number;
  seed: string;
  gap?: number;
}> = ({ words, x, y, w, delay = 0, seed, gap = 8 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      display: "flex",
      flexWrap: "wrap",
      direction: "rtl",
      justifyContent: "center",
      alignItems: "center",
      gap,
    }}
  >
    {words.map((wd, i) => (
      <Chip key={i} {...wd} delay={delay + i * 5} seed={`${seed}-${i}`} />
    ))}
  </div>
);

const Chip: React.FC<{ t: string; bg: string; fg: string; font?: string; size?: number; delay: number; seed: string }> = ({
  t,
  bg,
  fg,
  font = CAIRO,
  size = 96,
  delay,
  seed,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = onTwos(frame);
  const p = spring({ frame: f - delay, fps, config: { damping: 11, stiffness: 200 } });
  const baseRot = (random(`${seed}-rot`) - 0.5) * 9;
  const jr = (random(`${seed}-j-${Math.floor(frame / 4)}`) - 0.5) * 0.8;
  return (
    <div
      style={{
        transform: `scale(${p}) rotate(${baseRot + (1 - p) * 25 + jr}deg)`,
        opacity: f >= delay ? 1 : 0,
        filter: "drop-shadow(4px 7px 4px rgba(0,0,0,0.35))",
      }}
    >
      <div
        style={{
          background: bg,
          color: fg,
          fontFamily: font,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1.25,
          padding: `${size * 0.08}px ${size * 0.28}px ${size * 0.16}px`,
          clipPath: torn(seed, 5, 14),
          whiteSpace: "nowrap",
        }}
      >
        {t}
      </div>
    </div>
  );
};

// Round rubber stamp that slams in.
export const Stamp: React.FC<{ x: number; y: number; text: string; sub?: string; delay: number; size?: number; color?: string }> = ({
  x,
  y,
  text,
  sub,
  delay,
  size = 230,
  color = PALETTE.red,
}) => {
  const frame = useCurrentFrame();
  const f = onTwos(frame) - delay;
  const s = interpolate(f, [0, 4, 6, 8], [2.4, 0.92, 1.04, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        opacity: f >= 0 ? 0.88 : 0,
        transform: `rotate(-14deg) scale(${s})`,
        borderRadius: "50%",
        border: `${size * 0.035}px solid ${color}`,
        boxShadow: `inset 0 0 0 ${size * 0.03}px transparent, inset 0 0 0 ${size * 0.05}px ${color}`,
        color,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: CAIRO,
        fontWeight: 900,
        mixBlendMode: "multiply",
        zIndex: 30,
      }}
    >
      <div style={{ fontSize: size * 0.3, lineHeight: 1 }}>{text}</div>
      {sub ? <div style={{ fontSize: size * 0.12, marginTop: size * 0.03 }}>{sub}</div> : null}
    </div>
  );
};

// Paper background + animated grain + vignette; wraps every scene.
export const Scene: React.FC<{ bg: string; halftone?: string; children: React.ReactNode }> = ({ bg, halftone, children }) => {
  const frame = useCurrentFrame();
  const grainSeed = Math.floor(frame / 2) % 7;
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <CutDefs />
      {halftone ? (
        <AbsoluteFill
          style={{
            backgroundImage: `radial-gradient(circle, ${halftone} 30%, transparent 34%)`,
            backgroundSize: "22px 22px",
            opacity: 0.5,
          }}
        />
      ) : null}
      {children}
      {/* paper fibres & grain */}
      <AbsoluteFill style={{ mixBlendMode: "multiply", opacity: 0.32, pointerEvents: "none", zIndex: 50 }}>
        <svg width="100%" height="100%">
          <filter id={`paper-${grainSeed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed={grainSeed} />
            <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 0.9 0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#paper-${grainSeed})`} />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(40,20,0,0.38) 100%)",
          pointerEvents: "none",
          zIndex: 51,
        }}
      />
    </AbsoluteFill>
  );
};
