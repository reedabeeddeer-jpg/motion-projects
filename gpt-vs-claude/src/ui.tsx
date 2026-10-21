import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { C } from "./theme";
import { FONT } from "./fonts";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const useSpring = (delay = 0, damping = 14, mass = 0.8) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass } });
};

/** Fades a scene in at its start and out at its end. */
export const SceneFade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, dur - 10, dur], [0, 1, 1, 0], clamp);
  const scale = interpolate(frame, [dur - 10, dur], [1, 1.04], clamp);
  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})`, direction: "rtl", fontFamily: FONT, color: C.text }}>
      {children}
    </AbsoluteFill>
  );
};

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = (frame * 0.6) % 80;
  const blobs = [
    { x: 20 + Math.sin(frame / 50) * 6, y: 30 + Math.cos(frame / 60) * 8, c: C.gpt },
    { x: 78 + Math.cos(frame / 55) * 6, y: 65 + Math.sin(frame / 45) * 8, c: C.claude },
  ];
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: 900,
            height: 900,
            marginLeft: -450,
            marginTop: -450,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${b.c}33 0%, transparent 65%)`,
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          backgroundPosition: `${shift}px ${shift}px`,
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
      {new Array(24).fill(0).map((_, i) => {
        const x = (i * 97) % 100;
        const y = (((i * 53) % 100) - frame * (0.08 + (i % 5) * 0.03) + 200) % 100;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              borderRadius: "50%",
              background: i % 2 ? C.gpt : C.claude,
              opacity: 0.35,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Section heading with an underline that draws in. */
export const Heading: React.FC<{ title: string; kicker: string; delay?: number }> = ({ title, kicker, delay = 0 }) => {
  const frame = useCurrentFrame();
  const s = useSpring(delay);
  const line = interpolate(frame - delay, [8, 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center" }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: C.muted, opacity: s, letterSpacing: 2 }}>{kicker}</div>
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          lineHeight: 1.25,
          opacity: s,
          transform: `translateY(${(1 - s) * 40}px)`,
        }}
      >
        {title}
      </div>
      <div
        style={{
          margin: "10px auto 0",
          height: 6,
          width: 360 * line,
          borderRadius: 3,
          background: `linear-gradient(90deg, ${C.claude}, ${C.gpt})`,
        }}
      />
    </div>
  );
};

/** Brand-neutral badge: a glowing ring with initials. */
export const Badge: React.FC<{ label: string; color: string; size?: number; icon: "chat" | "terminal" }> = ({
  label,
  color,
  size = 220,
  icon,
}) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 10) * 0.03;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `6px solid ${color}`,
        boxShadow: `0 0 ${60 * pulse}px ${color}88, inset 0 0 40px ${color}44`,
        background: `${color}1A`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${pulse})`,
      }}
    >
      <Icon kind={icon} color={color} size={size * 0.36} />
      <div style={{ fontSize: size * 0.13, fontWeight: 900, direction: "ltr", marginTop: 4 }}>{label}</div>
    </div>
  );
};

export const Icon: React.FC<{ kind: "chat" | "terminal"; color: string; size: number }> = ({ kind, color, size }) =>
  kind === "chat" ? (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M10 14h44a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H28l-12 10v-10h-6a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z"
        stroke={color}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <circle cx="22" cy="30" r="3.5" fill={color} />
      <circle cx="32" cy="30" r="3.5" fill={color} />
      <circle cx="42" cy="30" r="3.5" fill={color} />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="6" y="10" width="52" height="44" rx="5" stroke={color} strokeWidth={5} />
      <path d="M16 26l8 6-8 6" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 40h16" stroke={color} strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
