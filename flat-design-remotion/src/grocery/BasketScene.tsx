import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C } from "../theme";
import { Bar, Floater, Headline, usePop } from "../ui";
import { Food, FoodKind } from "./Food";

const ITEMS: { kind: FoodKind; x: number; y: number; rot: number; delay: number }[] = [
  { kind: "bread", x: -120, y: -110, rot: -12, delay: 14 },
  { kind: "milk", x: 110, y: -130, rot: 10, delay: 20 },
  { kind: "banana", x: -10, y: -150, rot: -20, delay: 26 },
  { kind: "apple", x: -170, y: -60, rot: 0, delay: 32 },
  { kind: "carrot", x: 170, y: -80, rot: 30, delay: 38 },
  { kind: "tomato", x: 50, y: -60, rot: 0, delay: 44 },
];

const Basket: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = usePop(0, 12);
  const lastLand = spring({ frame: frame - 50, fps, config: { damping: 8 } });
  const squash = 1 - Math.sin(lastLand * Math.PI) * 0.04;
  return (
    <div
      style={{
        position: "absolute",
        left: 520,
        top: 600,
        transform: `scale(${enter}) scaleY(${squash})`,
        transformOrigin: "center bottom",
      }}
    >
      {/* handle */}
      <svg viewBox="-260 -260 520 520" width={520} height={520} style={{ position: "absolute", left: -260, top: -330, overflow: "visible" }}>
        <path d="M -190 120 C -190 -150 190 -150 190 120" fill="none" stroke={C.navy} strokeWidth={26} strokeLinecap="round" />
      </svg>
      {/* falling items */}
      {ITEMS.map((it, i) => {
        const p = spring({ frame: frame - it.delay, fps, config: { damping: 11, stiffness: 120 } });
        const y = interpolate(p, [0, 1], [-900, it.y]);
        return (
          <div key={i} style={{ position: "absolute", left: it.x - 75, top: y - 75, transform: `rotate(${it.rot * p}deg)`, opacity: frame >= it.delay ? 1 : 0 }}>
            <Food kind={it.kind} size={150} />
          </div>
        );
      })}
      {/* basket body */}
      <svg viewBox="-260 0 520 300" width={520} height={300} style={{ position: "absolute", left: -260, top: 0 }}>
        <rect x={-250} y={0} width={500} height={56} rx={28} fill={C.orange} />
        <path d="M -220 56 L 220 56 L 180 280 Q 176 296 160 296 L -160 296 Q -176 296 -180 280 Z" fill={C.coral} />
        {[-120, -40, 40, 120].map((x) => (
          <rect key={x} x={x - 12} y={86} width={24} height={176} rx={12} fill={C.cream} opacity={0.85} />
        ))}
      </svg>
    </div>
  );
};

export const BasketScene: React.FC = () => (
  <AbsoluteFill style={{ background: C.yellow }}>
    <Floater x={140} y={150} size={70} color={C.teal} kind="circle" delay={4} />
    <Floater x={960} y={140} size={90} color={C.white} kind="ring" delay={10} />
    <Floater x={1760} y={160} size={60} color={C.coral} kind="triangle" delay={14} spin={1.2} />
    <Floater x={1060} y={940} size={70} color={C.blue} kind="square" delay={18} />
    <Floater x={150} y={930} size={80} color={C.navy} kind="plus" delay={22} spin={1} />
    <Floater x={1820} y={880} size={110} color={C.orange} kind="ring" delay={26} />
    <Basket />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-end", paddingRight: 120 }}>
      <div style={{ width: 920 }}>
        <Headline text="سلّتك الغذائية" delay={22} color={C.navy} size={100} />
        <Headline text="طازجة كل يوم" delay={32} color={C.coral} size={130} />
        <Bar delay={50} color={C.navy} width={360} style={{ marginTop: 24 }} />
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
