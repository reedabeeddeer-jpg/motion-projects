import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Badge, clamp, SceneFade, useSpring } from "../ui";
import { C, SCENES } from "../theme";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const right = useSpring(5, 12);
  const left = useSpring(12, 12);
  const vs = useSpring(24, 8, 0.6);
  const title = useSpring(36);
  const flash = interpolate(frame, [24, 28, 40], [0, 0.5, 0], clamp);
  return (
    <SceneFade dur={SCENES.intro.dur}>
      <AbsoluteFill style={{ background: "white", opacity: flash }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 160 }}>
        <div style={{ transform: `translateX(${(1 - right) * 700}px)`, opacity: right }}>
          <Badge label="GPT" color={C.gpt} size={300} icon="chat" />
        </div>
        <div
          style={{
            fontSize: 150,
            fontWeight: 900,
            direction: "ltr",
            transform: `scale(${vs * 1.0 + (1 - vs) * 3}) rotate(${(1 - vs) * -20}deg)`,
            opacity: Math.min(1, vs * 2),
            background: `linear-gradient(135deg, ${C.gpt}, ${C.claude})`,
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          VS
        </div>
        <div style={{ transform: `translateX(${(left - 1) * 700}px)`, opacity: left }}>
          <Badge label="Claude Code" color={C.claude} size={300} icon="terminal" />
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 130,
          width: "100%",
          textAlign: "center",
          opacity: title,
          transform: `translateY(${(1 - title) * 50}px)`,
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 900 }}>مقارنة شاملة</div>
        <div style={{ fontSize: 36, fontWeight: 700, color: C.muted }}>أيهما يناسب احتياجك؟</div>
      </div>
    </SceneFade>
  );
};
