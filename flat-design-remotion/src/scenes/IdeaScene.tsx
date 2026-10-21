import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Bar, Floater, Headline, usePop } from "../ui";

const Bulb: React.FC = () => {
  const frame = useCurrentFrame();
  const body = usePop(8, 9);
  const base = usePop(16, 12);
  const glow = interpolate(frame, [30, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rays = Array.from({ length: 8 });
  return (
    <svg viewBox="-300 -300 600 600" width={640} height={640} style={{ position: "absolute", left: 200, top: 200 }}>
      {/* back disc */}
      <circle r={250 * usePop(0, 14)} fill={C.cream} />
      {/* rays */}
      {rays.map((_, i) => {
        const a = (i / rays.length) * Math.PI * 2 - Math.PI / 2;
        const len = 46 * glow;
        const r0 = 175;
        return (
          <line
            key={i}
            x1={Math.cos(a) * r0}
            y1={Math.sin(a) * r0 - 30}
            x2={Math.cos(a) * (r0 + len)}
            y2={Math.sin(a) * (r0 + len) - 30}
            stroke={C.orange}
            strokeWidth={18}
            strokeLinecap="round"
            opacity={glow}
          />
        );
      })}
      <g transform={`translate(0 -30) scale(${body})`}>
        <circle r={120} fill={glow > 0.5 ? C.yellow : C.white} stroke={C.navy} strokeWidth={14} />
        {/* filament */}
        <path d="M -36 40 L -18 -10 L 0 30 L 18 -10 L 36 40" fill="none" stroke={C.navy} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
        {/* shine */}
        <path d="M -70 -40 A 80 80 0 0 1 -30 -82" fill="none" stroke={C.white} strokeWidth={14} strokeLinecap="round" opacity={0.9} />
      </g>
      <g transform={`translate(0 ${120 + (1 - base) * 60})`} opacity={base}>
        <rect x={-58} y={0} width={116} height={34} rx={10} fill={C.navy} />
        <rect x={-50} y={42} width={100} height={28} rx={10} fill={C.blue} />
        <rect x={-30} y={78} width={60} height={22} rx={11} fill={C.navy} />
      </g>
    </svg>
  );
};

export const IdeaScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.yellow }}>
      <Floater x={140} y={150} size={70} color={C.coral} kind="circle" delay={4} />
      <Floater x={880} y={120} size={90} color={C.white} kind="ring" delay={10} />
      <Floater x={1760} y={160} size={60} color={C.teal} kind="triangle" delay={14} spin={1.2} />
      <Floater x={1100} y={930} size={70} color={C.blue} kind="square" delay={18} />
      <Floater x={180} y={900} size={80} color={C.navy} kind="plus" delay={22} spin={1} />
      <Floater x={1820} y={880} size={110} color={C.orange} kind="ring" delay={26} />
      <Bulb />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-end", paddingRight: 150 }}>
        <div style={{ width: 860 }}>
          <Headline text="كل شيء" delay={20} color={C.navy} size={120} />
          <Headline text="يبدأ بفكرة" delay={30} color={C.coral} size={160} />
          <Bar delay={48} color={C.navy} width={360} style={{ marginTop: 24 }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
