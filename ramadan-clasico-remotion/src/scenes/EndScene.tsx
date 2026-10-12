import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { FONT } from "../fonts";
import { COLORS, CoverImage, GOLD_TEXT, KineticLine, LightBeams, Particles, Shockwave, Sparks, Vignette, clamp, outBack, shakeAt, useProgress } from "../ui";
import { Product } from "./ProductScene";

// 30.0 – 36.5 s (local 0 – 6.5).
// VO l6a @0.3: "سيجنال" 0.55–1.25, "ابتسامة الفوز" 1.58–3.19 · l6b @3.4: "رمضان كريم" 3.6–4.93
const FINAL = 5.0;

export const EndScene: React.FC = () => {
  const { t, p } = useProgress();
  const slam = p(0.3, 0.6, outBack);
  const pulse = 1 + 0.06 * Math.max(0, 1 - Math.abs(t - FINAL) / 0.35);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#041030" }}>
      <AbsoluteFill style={{ translate: shakeAt(t, [{ at: 0.3, amount: 16 }, { at: FINAL, amount: 26 }]), scale: String(pulse) }}>
        <CoverImage src="img/bg-gradient.jpg" zoom={1.2 - t * 0.02} x={-40} filter="brightness(0.7) saturate(1.25)" />
        <AbsoluteFill
          style={{
            background: "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.5) 0%, rgba(140,200,255,0.15) 30%, rgba(0,0,0,0) 60%)",
            opacity: p(0.3, 0.6),
          }}
        />
        <LightBeams opacity={0.7} />
        <Particles seed="end" count={60} color="#FFE7A8" speed={45} opacity={0.7} />

        {/* rotating gold rays */}
        <div
          style={{
            position: "absolute",
            left: 960 - 900,
            top: 420 - 900,
            width: 1800,
            height: 1800,
            borderRadius: "50%",
            rotate: `${t * 12}deg`,
            opacity: 0.25 * p(0.3, 0.8),
            background: "repeating-conic-gradient(rgba(255,215,120,0.6) 0deg 4deg, rgba(255,215,120,0) 4deg 18deg)",
            maskImage: "radial-gradient(circle, black 10%, transparent 65%)",
            WebkitMaskImage: "radial-gradient(circle, black 10%, transparent 65%)",
          }}
        />

        {/* crests flanking */}
        {(
          [
            { src: "img/crest-barca.png", x: 960 - 560, h: 230 },
            { src: "img/crest-madrid.png", x: 960 + 560, h: 250 },
          ] as const
        ).map((c, i) => (
          <Img
            key={c.src}
            src={staticFile(c.src)}
            style={{
              position: "absolute",
              left: c.x,
              top: 400 + Math.sin(t * 1.6 + i * 2) * 8,
              height: c.h,
              translate: "-50% -50%",
              scale: String(p(0.7 + i * 0.12, 0.6, outBack)),
              filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.5))",
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            left: 960,
            top: 400,
            translate: "-50% -50%",
            scale: String(interpolate(slam, [0, 1], [2.2, 1])),
            opacity: p(0.3, 0.15),
          }}
        >
          <Product height={480} shine={p(0.9, 1.0) + (t > FINAL ? p(FINAL, 0.9) - 1 : 0)} />
        </div>
        <Sparks at={0.3} x={960} y={400} seed="end-slam" count={50} />

        {/* ابتسامة الفوز */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 700,
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 120,
            lineHeight: 1.25,
            direction: "rtl",
            scale: String(interpolate(p(1.55, 0.5, outBack), [0, 1], [0.3, 1])),
            opacity: p(1.55, 0.2),
            filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.5))",
            ...GOLD_TEXT,
          }}
        >
          ابتسامة الفوز
        </div>

        <KineticLine
          y={880}
          size={66}
          words={[
            { text: "رمضان", at: 3.55, color: COLORS.white },
            { text: "كريم", at: 3.95, color: COLORS.white },
          ]}
        />

        <Shockwave at={FINAL} x={960} y={420} maxR={1300} color="242,193,78" />
        <Sparks at={FINAL} x={960} y={420} seed="final" count={80} />
      </AbsoluteFill>

      <Vignette strength={0.6} />
      {/* fade to black */}
      <AbsoluteFill style={{ background: "black", opacity: interpolate(t, [5.9, 6.5], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
