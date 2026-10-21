import React from "react";
import { AbsoluteFill } from "remotion";
import { Heading, Icon, SceneFade, useSpring } from "../ui";
import { C, SCENES } from "../theme";

const Card: React.FC<{ name: string; color: string; icon: "chat" | "terminal"; lines: string[]; delay: number; dir: 1 | -1 }> = ({
  name,
  color,
  icon,
  lines,
  delay,
  dir,
}) => {
  const s = useSpring(delay, 13);
  return (
    <div
      style={{
        width: 720,
        padding: "44px 52px",
        borderRadius: 36,
        background: C.panel,
        border: `2px solid ${color}66`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.4), 0 0 50px ${color}22`,
        transform: `translateX(${(1 - s) * 500 * dir}px) rotate(${(1 - s) * 6 * dir}deg)`,
        opacity: s,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 28 }}>
        <div style={{ width: 110, height: 110, borderRadius: 28, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon kind={icon} color={color} size={70} />
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, color, direction: "ltr" }}>{name}</div>
      </div>
      {lines.map((l, i) => (
        <Line key={l} text={l} color={color} delay={delay + 14 + i * 8} />
      ))}
    </div>
  );
};

const Line: React.FC<{ text: string; color: string; delay: number }> = ({ text, color, delay }) => {
  const s = useSpring(delay, 15);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        fontSize: 38,
        fontWeight: 700,
        margin: "16px 0",
        opacity: s,
        transform: `translateY(${(1 - s) * 24}px)`,
      }}
    >
      <div style={{ width: 16, height: 16, borderRadius: 8, background: color, flexShrink: 0, transform: `scale(${s})` }} />
      {text}
    </div>
  );
};

export const Overview: React.FC = () => (
  <SceneFade dur={SCENES.overview.dur}>
    <Heading kicker="01 — التعريف" title="ما هو كل منهما؟" />
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 70, paddingTop: 170 }}>
      <Card
        name="GPT"
        color={C.gpt}
        icon="chat"
        dir={1}
        delay={12}
        lines={["نموذج لغوي من OpenAI", "يُستخدم عبر ChatGPT والـ API", "مساعد متعدد الاستخدامات"]}
      />
      <Card
        name="Claude Code"
        color={C.claude}
        icon="terminal"
        dir={-1}
        delay={20}
        lines={["أداة برمجة من Anthropic", "تعمل في الطرفية والمحرر والويب", "وكيل ينفّذ المهام داخل مشروعك"]}
      />
    </AbsoluteFill>
  </SceneFade>
);
