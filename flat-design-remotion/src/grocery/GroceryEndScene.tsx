import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "../fonts";
import { C } from "../theme";
import { Headline, usePop } from "../ui";
import { Food, FoodKind } from "./Food";

const POP: { kind: FoodKind; x: number; y: number; r: number; d: number }[] = [
  { kind: "carrot", x: -150, y: -170, r: -30, d: 14 },
  { kind: "bread", x: -40, y: -210, r: -8, d: 18 },
  { kind: "banana", x: 80, y: -200, r: 20, d: 22 },
  { kind: "apple", x: 170, y: -140, r: 14, d: 26 },
  { kind: "milk", x: -230, y: -80, r: -22, d: 30 },
  { kind: "tomato", x: 240, y: -60, r: 0, d: 34 },
];

const Bag: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bag = usePop(2, 10);
  return (
    <div style={{ position: "absolute", left: 960, top: 420, transform: `scale(${bag})` }}>
      {POP.map((p, i) => {
        const s = spring({ frame: frame - p.d, fps, config: { damping: 9, stiffness: 130 } });
        const float = Math.sin((frame + i * 10) / 12) * 6 * s;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x * s - 60,
              top: p.y * s - 60 + float,
              transform: `scale(${s}) rotate(${p.r}deg)`,
            }}
          >
            <Food kind={p.kind} size={120} />
          </div>
        );
      })}
      <svg viewBox="-160 -120 320 280" width={320} height={280} style={{ position: "absolute", left: -160, top: -120, overflow: "visible" }}>
        <path d="M -70 -40 C -70 -130 70 -130 70 -40" fill="none" stroke={C.yellow} strokeWidth={20} strokeLinecap="round" />
        <path d="M -140 -50 L 140 -50 L 120 150 Q 118 160 108 160 L -108 160 Q -118 160 -120 150 Z" fill={C.teal} />
        <path d="M 0 30 C -36 10 -50 60 -24 82 L 0 104 L 24 82 C 50 60 36 10 0 30 Z" fill={C.white} />
      </svg>
    </div>
  );
};

export const GroceryEndScene: React.FC = () => {
  const frame = useCurrentFrame();
  const tag = usePop(56, 14);
  return (
    <AbsoluteFill style={{ background: C.navy, overflow: "hidden" }}>
      {[0, 8, 16].map((d, i) => {
        const p = interpolate(frame, [d, d + 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const size = 320 + p * (700 + i * 300);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 - size / 2,
              top: 400 - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              border: `14px solid ${[C.teal, C.yellow, C.coral][i]}`,
              opacity: 1 - p * 0.85,
            }}
          />
        );
      })}
      <Bag />
      <AbsoluteFill style={{ alignItems: "center", top: 650 }}>
        <Headline text="تسوّقك الغذائي… صار أسهل" delay={26} color={C.white} size={120} style={{ justifyContent: "center" }} />
        <div
          dir="rtl"
          style={{
            marginTop: 26,
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
          اطلب الآن
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
