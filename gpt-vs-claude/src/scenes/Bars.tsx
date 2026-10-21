import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp, Heading, SceneFade, useSpring } from "../ui";
import { C, SCENES } from "../theme";

// Illustrative scores out of 10, by use case (not official benchmark results).
const ROWS = [
  { label: "البرمجة داخل المشروع", gpt: 7.5, claude: 9.5 },
  { label: "تنفيذ الأوامر والأتمتة", gpt: 6.5, claude: 9.5 },
  { label: "المحادثة والكتابة", gpt: 9.5, claude: 7.5 },
  { label: "الصور والوسائط", gpt: 9, claude: 4 },
];

const MAX_W = 620;

const Bar: React.FC<{ value: number; color: string; delay: number; side: "right" | "left" }> = ({ value, color, delay, side }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 40], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const w = (value / 10) * MAX_W * p;
  const shown = (value * p).toFixed(1);
  return (
    <div style={{ width: MAX_W + 120, display: "flex", justifyContent: side === "right" ? "flex-start" : "flex-end", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", flexDirection: side === "right" ? "row" : "row-reverse", gap: 18 }}>
        <div
          style={{
            width: w,
            height: 58,
            borderRadius: side === "right" ? "0 0 0 0" : 0,
            borderTopLeftRadius: side === "right" ? 29 : 0,
            borderBottomLeftRadius: side === "right" ? 29 : 0,
            borderTopRightRadius: side === "left" ? 29 : 0,
            borderBottomRightRadius: side === "left" ? 29 : 0,
            background: `linear-gradient(${side === "right" ? 270 : 90}deg, ${color}55, ${color})`,
            boxShadow: `0 0 30px ${color}55`,
          }}
        />
        <div style={{ fontSize: 44, fontWeight: 900, color, direction: "ltr", minWidth: 90, opacity: p }}>{shown}</div>
      </div>
    </div>
  );
};

export const Bars: React.FC = () => {
  const frame = useCurrentFrame();
  const legend = useSpring(10);
  const note = interpolate(frame, [120, 140], [0, 1], clamp);
  return (
    <SceneFade dur={SCENES.bars.dur}>
      <Heading kicker="02 — الأداء حسب الاستخدام" title="مقارنة القدرات" />
      <div style={{ position: "absolute", top: 300, width: "100%", display: "flex", justifyContent: "center", gap: 520, opacity: legend }}>
        <Legend name="GPT" color={C.gpt} />
        <Legend name="Claude Code" color={C.claude} />
      </div>
      <div style={{ position: "absolute", top: 390, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        {ROWS.map((r, i) => {
          const d = 24 + i * 16;
          return <Row key={r.label} row={r} delay={d} />;
        })}
      </div>
      <div style={{ position: "absolute", bottom: 40, width: "100%", textAlign: "center", fontSize: 26, color: C.muted, opacity: note }}>
        * تقييم توضيحي من 10 حسب حالات الاستخدام، وليس نتائج اختبار رسمية
      </div>
    </SceneFade>
  );
};

const Row: React.FC<{ row: (typeof ROWS)[number]; delay: number }> = ({ row, delay }) => {
  const s = useSpring(delay, 15);
  return (
    <div style={{ display: "flex", alignItems: "center", direction: "ltr" }}>
      <Bar value={row.claude} color={C.claude} delay={delay + 6} side="left" />
      <div
        style={{
          width: 360,
          textAlign: "center",
          fontSize: 34,
          fontWeight: 700,
          padding: "14px 0",
          borderRadius: 20,
          background: C.panel,
          border: `1px solid ${C.border}`,
          opacity: s,
          transform: `scale(${0.7 + s * 0.3})`,
          direction: "rtl",
        }}
      >
        {row.label}
      </div>
      <Bar value={row.gpt} color={C.gpt} delay={delay + 6} side="right" />
    </div>
  );
};

const Legend: React.FC<{ name: string; color: string }> = ({ name, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40, fontWeight: 900 }}>
    <div style={{ width: 28, height: 28, borderRadius: 8, background: color }} />
    <span style={{ direction: "ltr" }}>{name}</span>
  </div>
);
