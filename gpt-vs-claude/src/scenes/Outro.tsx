import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Badge, clamp, SceneFade, useSpring } from "../ui";
import { C, SCENES } from "../theme";

const Verdict: React.FC<{ name: string; text: string; color: string; icon: "chat" | "terminal"; delay: number }> = ({
  name,
  text,
  color,
  icon,
  delay,
}) => {
  const s = useSpring(delay, 13);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, opacity: s, transform: `translateY(${(1 - s) * 80}px)` }}>
      <Badge label={name} color={color} size={230} icon={icon} />
      <div
        style={{
          fontSize: 42,
          fontWeight: 900,
          padding: "18px 40px",
          borderRadius: 24,
          background: `${color}22`,
          border: `2px solid ${color}`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useSpring(4);
  const end = useSpring(50, 12);
  const line = interpolate(frame, [50, 80], [0, 1], clamp);
  return (
    <SceneFade dur={SCENES.outro.dur}>
      <div style={{ position: "absolute", top: 80, width: "100%", textAlign: "center", opacity: title, transform: `scale(${0.8 + title * 0.2})` }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: C.muted }}>04 — الخلاصة</div>
        <div style={{ fontSize: 80, fontWeight: 900 }}>الاختيار حسب مهمتك</div>
      </div>
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 240, paddingTop: 40 }}>
        <Verdict name="GPT" text="للاستخدام العام والإبداع" color={C.gpt} icon="chat" delay={16} />
        <Verdict name="Claude Code" text="للبرمجة وإنجاز المشاريع" color={C.claude} icon="terminal" delay={26} />
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: 90, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", opacity: end }}>
        <div style={{ height: 5, width: 700 * line, background: `linear-gradient(90deg, ${C.claude}, ${C.gpt})`, borderRadius: 3 }} />
        <div style={{ fontSize: 44, fontWeight: 700, marginTop: 20 }}>والأفضل؟ استخدم الاثنين معًا</div>
      </div>
    </SceneFade>
  );
};
