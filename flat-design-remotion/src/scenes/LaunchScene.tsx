import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Bar, Floater, Headline, usePop } from "../ui";

const Cloud: React.FC<{ x: number; y: number; s: number; speed: number }> = ({ x, y, s, speed }) => {
  const frame = useCurrentFrame();
  const yy = ((y + frame * speed) % 1300) - 150;
  return (
    <svg viewBox="0 0 200 90" width={200 * s} height={90 * s} style={{ position: "absolute", left: x, top: yy }}>
      <rect x="0" y="45" width="200" height="45" rx="22.5" fill={C.white} opacity={0.9} />
      <circle cx="70" cy="50" r="38" fill={C.white} opacity={0.9} />
      <circle cx="125" cy="42" r="30" fill={C.white} opacity={0.9} />
    </svg>
  );
};

const Rocket: React.FC = () => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, 40], [700, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.4)),
  });
  const shake = Math.sin(frame * 1.7) * 3;
  const flame = 1 + Math.sin(frame * 1.3) * 0.15;
  return (
    <svg
      viewBox="-120 -220 240 460"
      width={300}
      height={575}
      style={{ position: "absolute", left: 230, top: 190, transform: `translate(${shake}px, ${rise}px) rotate(8deg)` }}
    >
      {/* flame */}
      <g transform={`translate(0 150) scale(1 ${flame})`}>
        <path d="M -40 0 Q 0 140 40 0 Z" fill={C.orange} />
        <path d="M -22 0 Q 0 90 22 0 Z" fill={C.yellow} />
      </g>
      {/* fins */}
      <path d="M -60 60 L -110 150 L -60 140 Z" fill={C.navy} />
      <path d="M 60 60 L 110 150 L 60 140 Z" fill={C.navy} />
      {/* body */}
      <path d="M 0 -210 C 80 -140 70 40 60 150 L -60 150 C -70 40 -80 -140 0 -210 Z" fill={C.white} />
      <path d="M 0 -210 C 30 -184 48 -160 58 -130 L -58 -130 C -48 -160 -30 -184 0 -210 Z" fill={C.yellow} />
      {/* window */}
      <circle cx={0} cy={-40} r={42} fill={C.navy} />
      <circle cx={0} cy={-40} r={28} fill={C.blue} />
      <path d="M -14 -54 A 20 20 0 0 1 4 -62" stroke={C.white} strokeWidth={6} fill="none" strokeLinecap="round" />
      <rect x={-60} y={120} width={120} height={30} fill={C.navy} />
      <rect x={-12} y={60} width={24} height={90} rx={12} fill={C.yellow} />
    </svg>
  );
};

const Chart: React.FC = () => {
  const heights = [120, 190, 260, 360];
  const colors = [C.yellow, C.teal, C.white, C.yellow];
  const frame = useCurrentFrame();
  const arrow = interpolate(frame, [70, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 640, top: 380, width: 420, height: 460 }}>
      {heights.map((h, i) => {
        const p = usePop(36 + i * 8, 13);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * 80,
              bottom: 40,
              width: 56,
              height: h * p,
              borderRadius: "14px 14px 4px 4px",
              background: colors[i],
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: -10, bottom: 22, width: 330, height: 18, borderRadius: 9, background: C.navy }} />
      <svg viewBox="0 0 320 380" width={320} height={380} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path
          d="M 20 330 L 110 250 L 180 270 L 300 60"
          fill="none"
          stroke={C.navy}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - arrow}
        />
        <polygon points="300,30 330,85 270,78" fill={C.navy} opacity={arrow > 0.95 ? 1 : 0} transform="rotate(8 300 60)" />
      </svg>
    </div>
  );
};

export const LaunchScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.coral, overflow: "hidden" }}>
      <Cloud x={120} y={100} s={1} speed={9} />
      <Cloud x={620} y={600} s={0.7} speed={12} />
      <Cloud x={1250} y={320} s={0.8} speed={7} />
      <Cloud x={60} y={950} s={0.6} speed={10} />
      <Floater x={1780} y={150} size={70} color={C.yellow} kind="plus" delay={8} spin={1} />
      <Floater x={1250} y={940} size={90} color={C.navy} kind="ring" delay={14} />
      <Floater x={1840} y={860} size={60} color={C.white} kind="circle" delay={20} />
      <Rocket />
      <Chart />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-end", paddingRight: 150 }}>
        <div style={{ width: 800 }}>
          <Headline text="أطلقها" delay={16} color={C.white} size={170} />
          <Headline text="وانمُ بسرعة" delay={26} color={C.navy} size={120} />
          <Bar delay={46} color={C.yellow} width={300} style={{ marginTop: 24 }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
