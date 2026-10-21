import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT } from "../fonts";
import { C } from "../theme";
import { Headline, usePop } from "../ui";

const Confetti: React.FC = () => {
  const frame = useCurrentFrame();
  const colors = [C.yellow, C.coral, C.teal, C.blue, C.orange, C.white];
  return (
    <>
      {Array.from({ length: 26 }).map((_, i) => {
        const a = (i / 26) * Math.PI * 2;
        const dist = interpolate(frame, [18, 60], [0, 520 + (i % 4) * 90], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: (t) => 1 - Math.pow(1 - t, 3),
        });
        const fall = Math.max(0, frame - 50) * 1.4;
        const s = 18 + (i % 3) * 8;
        const show = frame >= 18 ? 1 : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 + Math.cos(a) * dist * 1.5 - s / 2,
              top: 540 + Math.sin(a) * dist * 0.8 + fall - s / 2,
              width: s,
              height: i % 2 ? s : s * 0.5,
              borderRadius: i % 3 === 0 ? "50%" : 4,
              background: colors[i % colors.length],
              transform: `rotate(${frame * (4 + (i % 5))}deg)`,
              opacity: show,
            }}
          />
        );
      })}
    </>
  );
};

export const EndScene: React.FC = () => {
  const frame = useCurrentFrame();
  const badge = usePop(4, 9);
  const check = interpolate(frame, [16, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rings = [0, 8, 16];
  const tag = usePop(52, 14);
  return (
    <AbsoluteFill style={{ background: C.navy, overflow: "hidden" }}>
      {rings.map((d, i) => {
        const p = interpolate(frame, [d, d + 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const size = 300 + p * (700 + i * 300);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 - size / 2,
              top: 300 - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              border: `14px solid ${[C.teal, C.yellow, C.coral][i]}`,
              opacity: 1 - p * 0.85,
            }}
          />
        );
      })}
      <Confetti />
      {/* badge */}
      <svg viewBox="-100 -100 200 200" width={240} height={240} style={{ position: "absolute", left: 840, top: 180, transform: `scale(${badge})` }}>
        <circle r={96} fill={C.teal} />
        <circle r={74} fill={C.white} />
        <path
          d="M -36 2 L -10 28 L 40 -24"
          fill="none"
          stroke={C.navy}
          strokeWidth={18}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - check}
        />
      </svg>
      <AbsoluteFill style={{ alignItems: "center", top: 470 }}>
        <Headline text="فكرتك… صارت واقعاً" delay={22} color={C.white} size={150} style={{ justifyContent: "center" }} />
        <div
          dir="rtl"
          style={{
            marginTop: 30,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 54,
            color: C.navy,
            background: C.yellow,
            padding: "8px 56px 14px",
            borderRadius: 60,
            transform: `scale(${tag})`,
          }}
        >
          ابدأ اليوم
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
