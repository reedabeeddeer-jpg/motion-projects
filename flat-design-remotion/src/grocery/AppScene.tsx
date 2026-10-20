import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "../fonts";
import { C } from "../theme";
import { Bar, Floater, Headline, usePop } from "../ui";
import { Food, FoodKind } from "./Food";

const ROWS: { kind: FoodKind; tint: string }[] = [
  { kind: "apple", tint: "#FDE2E4" },
  { kind: "bread", tint: "#FBEBD7" },
  { kind: "milk", tint: "#D9EEF7" },
];
// frames when the finger taps each "+" button
const TAPS = [52, 72, 92];
const ROW_Y = [150, 300, 450];

const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const count = TAPS.filter((t) => frame >= t).length;
  const badgePulse = TAPS.reduce((acc, t) => acc + Math.max(0, 1 - Math.abs(frame - t - 3) / 6) * 0.35, 1);

  // finger moves from row to row
  const keys = [40, ...TAPS];
  const ys = [ROW_Y[0] + 120, ...ROW_Y.map((y) => y + 50)];
  const fy = interpolate(frame, keys, ys, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const press = TAPS.some((t) => frame >= t - 2 && frame < t + 4) ? 0.85 : 1;

  return (
    <div style={{ position: "absolute", left: 330, top: 110, width: 460, height: 880, transform: `translateY(${(1 - enter) * 900}px)` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 64, background: C.navy }} />
      <div style={{ position: "absolute", left: 22, top: 22, right: 22, bottom: 22, borderRadius: 46, background: C.cream, overflow: "hidden" }}>
        {/* header */}
        <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 120, background: C.teal }} />
        <div style={{ position: "absolute", right: 30, top: 52, width: 170, height: 26, borderRadius: 13, background: C.white, transform: `scaleX(${usePop(12, 14)})`, transformOrigin: "right" }} />
        {/* cart */}
        <svg viewBox="0 0 24 24" width={60} height={60} style={{ position: "absolute", left: 30, top: 34 }}>
          <path d="M2 4 H5 L7.5 15 H18 L20.5 7 H6.2" fill="none" stroke={C.navy} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={9} cy={19.5} r={1.8} fill={C.navy} />
          <circle cx={16.5} cy={19.5} r={1.8} fill={C.navy} />
        </svg>
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 22,
            width: 44,
            height: 44,
            borderRadius: 22,
            background: C.coral,
            color: C.white,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 28,
            lineHeight: "44px",
            textAlign: "center",
            transform: `scale(${count > 0 ? badgePulse : 0})`,
          }}
        >
          {count}
        </div>
        {/* product rows */}
        {ROWS.map((r, i) => {
          const p = usePop(16 + i * 7, 12);
          const added = frame >= TAPS[i];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 26,
                right: 26,
                top: ROW_Y[i],
                height: 126,
                borderRadius: 28,
                background: C.white,
                transform: `translateX(${(1 - p) * 500}px)`,
              }}
            >
              <div style={{ position: "absolute", right: 16, top: 13, width: 100, height: 100, borderRadius: 24, background: r.tint }}>
                <Food kind={r.kind} size={80} style={{ position: "absolute", left: 10, top: 10 }} />
              </div>
              <div style={{ position: "absolute", right: 136, top: 32, width: 120, height: 20, borderRadius: 10, background: C.navy }} />
              <div style={{ position: "absolute", right: 136, top: 70, width: 70, height: 18, borderRadius: 9, background: "#C9BFA8" }} />
              <div
                style={{
                  position: "absolute",
                  left: 18,
                  top: 33,
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  background: added ? C.teal : C.orange,
                  color: C.white,
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 44,
                  lineHeight: "56px",
                  textAlign: "center",
                }}
              >
                {added ? "✓" : "+"}
              </div>
            </div>
          );
        })}
        {/* checkout button */}
        <div
          style={{
            position: "absolute",
            left: 26,
            right: 26,
            bottom: 40,
            height: 100,
            borderRadius: 50,
            background: count === 3 ? C.coral : "#E9E0CC",
            transform: `scale(${usePop(30, 12)})`,
          }}
        >
          <div style={{ position: "absolute", left: "50%", top: 40, width: 150, height: 20, marginLeft: -75, borderRadius: 10, background: C.white }} />
        </div>
      </div>
      {/* finger */}
      <div
        style={{
          position: "absolute",
          left: 70,
          top: fy,
          width: 74,
          height: 74,
          borderRadius: 37,
          background: C.yellow,
          border: `8px solid ${C.navy}`,
          transform: `scale(${press})`,
          opacity: frame > 36 ? 1 : 0,
        }}
      />
    </div>
  );
};

export const AppScene: React.FC = () => (
  <AbsoluteFill style={{ background: C.teal }}>
    <Floater x={1060} y={140} size={80} color={C.yellow} kind="circle" delay={6} />
    <Floater x={1820} y={180} size={70} color={C.white} kind="plus" delay={12} spin={1} />
    <Floater x={1760} y={900} size={100} color={C.blue} kind="ring" delay={16} />
    <Floater x={120} y={160} size={60} color={C.coral} kind="triangle" delay={20} spin={1.2} />
    <Floater x={1060} y={960} size={60} color={C.navy} kind="square" delay={24} />
    <Floater x={150} y={880} size={90} color={C.white} kind="ring" delay={28} />
    <Phone />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-end", paddingRight: 120 }}>
      <div style={{ width: 920 }}>
        <Headline text="اطلب احتياجاتك" delay={18} color={C.navy} size={100} />
        <Headline text="بضغطة واحدة" delay={28} color={C.white} size={130} />
        <Bar delay={46} color={C.navy} width={320} style={{ marginTop: 24 }} />
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
