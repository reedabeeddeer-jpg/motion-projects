import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Bar, Headline } from "../ui";
import { G } from "./Food";

const Buildings: React.FC = () => {
  const frame = useCurrentFrame();
  const blocks = [
    { w: 160, h: 300, c: "#F48FA8" },
    { w: 120, h: 420, c: "#D93A62" },
    { w: 200, h: 240, c: "#F48FA8" },
    { w: 140, h: 360, c: "#D93A62" },
    { w: 180, h: 280, c: "#F48FA8" },
    { w: 130, h: 400, c: "#D93A62" },
  ];
  const total = blocks.reduce((s, b) => s + b.w + 40, 0);
  const off = (frame * 6) % total;
  const row = (shift: number) =>
    blocks.map((b, i) => {
      const x = blocks.slice(0, i).reduce((s, bb) => s + bb.w + 40, 0) + shift - off;
      return (
        <div key={`${shift}-${i}`} style={{ position: "absolute", left: x, bottom: 0, width: b.w, height: b.h, borderRadius: "16px 16px 0 0", background: b.c }}>
          {Array.from({ length: Math.floor(b.h / 90) }).map((_, j) => (
            <div key={j} style={{ position: "absolute", left: b.w / 2 - 22, top: 36 + j * 80, width: 44, height: 40, borderRadius: 8, background: C.coral }} />
          ))}
        </div>
      );
    });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 260, height: 440 }}>
      {row(0)}
      {row(total)}
      {row(total * 2)}
    </div>
  );
};

const Scooter: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 35], [-700, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const bob = Math.sin(frame * 0.9) * 4;
  const spin = frame * 18;
  const wheel = (cx: number) => (
    <g transform={`translate(${cx} 150) rotate(${spin})`}>
      <circle r={56} fill={C.navy} />
      <circle r={24} fill={C.cream} />
      <rect x={-4} y={-56} width={8} height={112} fill={C.cream} opacity={0.35} />
    </g>
  );
  return (
    <svg viewBox="-300 -300 600 520" width={600} height={520} style={{ position: "absolute", left: 230, top: 330, transform: `translate(${x}px, ${bob}px)`, overflow: "visible" }}>
      {/* speed lines */}
      {[0, 1, 2].map((i) => {
        const l = 80 + ((frame * 9 + i * 40) % 90);
        return <rect key={i} x={-300 - l} y={-60 + i * 60} width={l} height={14} rx={7} fill={C.white} opacity={0.75} />;
      })}
      {wheel(-170)}
      {wheel(170)}
      {/* body */}
      <path d="M -230 110 L -90 110 L -40 40 L 130 40 L 220 110 L 230 150 L -230 150 Z" fill={C.yellow} />
      <rect x={-60} y={10} width={150} height={40} rx={20} fill={C.navy} />
      {/* front stem + handlebar */}
      <rect x={160} y={-120} width={22} height={200} rx={11} fill={C.navy} transform="rotate(14 170 -20)" />
      <rect x={150} y={-130} width={90} height={22} rx={11} fill={C.navy} />
      {/* delivery box */}
      <rect x={-250} y={-150} width={190} height={170} rx={20} fill={C.teal} />
      <rect x={-250} y={-110} width={190} height={22} fill={G.leaf} />
      <path d="M -155 -50 C -185 -60 -195 -20 -175 -5 L -155 10 L -135 -5 C -115 -20 -125 -60 -155 -50 Z" fill={C.white} />
      {/* rider */}
      <rect x={-20} y={-170} width={110} height={190} rx={50} fill={C.blue} />
      <rect x={60} y={-140} width={110} height={34} rx={17} fill={C.blue} transform="rotate(12 60 -140)" />
      <circle cx={40} cy={-230} r={58} fill="#F2C29B" />
      <path d="M -22 -232 A 62 62 0 0 1 102 -232 L 102 -222 L -22 -222 Z" fill={C.teal} />
      <rect x={60} y={-232} width={56} height={14} rx={7} fill={C.navy} />
      <circle cx={70} cy={-200} r={7} fill={C.navy} />
    </svg>
  );
};

const Clock: React.FC = () => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [20, 110], [0, 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg viewBox="-60 -60 120 120" width={150} height={150} style={{ position: "absolute", left: 140, top: 130 }}>
      <circle r={56} fill={C.white} />
      <circle r={44} fill={C.cream} />
      <rect x={-4} y={-34} width={8} height={36} rx={4} fill={C.navy} transform={`rotate(${a})`} />
      <rect x={-4} y={-4} width={26} height={8} rx={4} fill={C.coral} transform={`rotate(${a / 12})`} />
      <circle r={7} fill={C.navy} />
    </svg>
  );
};

export const DeliveryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const dash = (frame * 22) % 240;
  return (
    <AbsoluteFill style={{ background: C.coral, overflow: "hidden" }}>
      <Buildings />
      {/* road */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 260, background: C.navy }} />
      {Array.from({ length: 11 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: i * 240 - dash, bottom: 120, width: 130, height: 18, borderRadius: 9, background: C.yellow }} />
      ))}
      <Clock />
      <Scooter />
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "flex-end", paddingRight: 150, paddingTop: 110 }}>
        <div style={{ width: 900 }}>
          <Headline text="يوصلك بسرعة" delay={16} color={C.white} size={120} />
          <Headline text="لباب البيت" delay={26} color={C.navy} size={120} />
          <Bar delay={46} color={C.yellow} width={300} style={{ marginTop: 16 }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
