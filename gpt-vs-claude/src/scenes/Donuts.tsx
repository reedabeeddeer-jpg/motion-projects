import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp, Heading, SceneFade, useSpring } from "../ui";
import { C, SCENES } from "../theme";

const R = 150;
const STROKE = 30;
const CIRC = 2 * Math.PI * R;

const Donut: React.FC<{ pct: number; color: string; name: string; caption: string; chips: string[]; delay: number }> = ({
  pct,
  color,
  name,
  caption,
  chips,
  delay,
}) => {
  const frame = useCurrentFrame();
  const enter = useSpring(delay, 12);
  const p = interpolate(frame - delay, [6, 56], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const size = (R + STROKE) * 2;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: enter, transform: `scale(${0.6 + enter * 0.4})` }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
          <circle cx={size / 2} cy={size / 2} r={R} stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={R}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - (pct / 100) * p)}
            style={{ filter: `drop-shadow(0 0 14px ${color})` }}
          />
        </svg>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 900, direction: "ltr", lineHeight: 1 }}>{Math.round(pct * p)}%</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.muted, marginTop: 8 }}>{caption}</div>
        </AbsoluteFill>
      </div>
      <div style={{ fontSize: 56, fontWeight: 900, color, direction: "ltr", marginTop: 20 }}>{name}</div>
      <div style={{ display: "flex", gap: 16, marginTop: 18 }}>
        {chips.map((c, i) => (
          <Chip key={c} text={c} color={color} delay={delay + 30 + i * 7} />
        ))}
      </div>
    </div>
  );
};

const Chip: React.FC<{ text: string; color: string; delay: number }> = ({ text, color, delay }) => {
  const s = useSpring(delay, 10);
  return (
    <div
      style={{
        fontSize: 30,
        fontWeight: 700,
        padding: "10px 26px",
        borderRadius: 40,
        border: `2px solid ${color}`,
        background: `${color}22`,
        transform: `scale(${s})`,
      }}
    >
      {text}
    </div>
  );
};

export const Donuts: React.FC = () => (
  <SceneFade dur={SCENES.donuts.dur}>
    <Heading kicker="03 — نقاط القوة" title="أين يتفوّق كل منهما؟" />
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 260, paddingTop: 200 }}>
      <Donut pct={90} color={C.gpt} name="GPT" caption="المهام العامة" chips={["محادثة", "كتابة", "صور"]} delay={14} />
      <Donut
        pct={95}
        color={C.claude}
        name="Claude Code"
        caption="مهام البرمجة"
        chips={["تعديل الملفات", "أوامر", "Git"]}
        delay={24}
      />
    </AbsoluteFill>
  </SceneFade>
);
