import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { FONT } from "../fonts";
import { COLORS, CoverImage, KineticLine, LightBeams, Particles, Vignette, clamp, inExpo, useProgress } from "../ui";

// 0 – 4.6 s. VO: "الليلةُ... ليست كأيِّ ليلة!" (speech ≈ 0.9 – 3.4 s)
export const IntroScene: React.FC = () => {
  const { t, p } = useProgress();
  const out = p(3.95, 0.65, inExpo); // title punches into the camera

  return (
    <AbsoluteFill style={{ background: "#020611" }}>
      <AbsoluteFill style={{ opacity: p(0, 0.8) }}>
        <CoverImage
          src="img/bg-gradient.jpg"
          zoom={interpolate(t, [0, 4.6], [1.25, 1.08], clamp)}
          x={Math.sin(t * 0.5) * 25}
          filter="brightness(0.62) saturate(1.2)"
        />
      </AbsoluteFill>
      <LightBeams opacity={p(0.3, 1)} />
      <Particles seed="intro" count={70} color="#CFE6FF" speed={35} />

      <AbsoluteFill style={{ scale: String(1 + out * 3.5), opacity: 1 - out, filter: `blur(${out * 12}px)` }}>
        {/* kicker */}
        <div
          style={{
            position: "absolute",
            top: 250,
            width: "100%",
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 46,
            color: COLORS.sky,
            letterSpacing: interpolate(t, [0.2, 1.2], [0, 10], clamp),
            opacity: p(0.2, 0.6),
          }}
        >
          كلاسيكو رمضان
        </div>

        <KineticLine y={340} size={190} words={[{ text: "الليلة", at: 0.85, gold: true }]} />
        <KineticLine
          y={600}
          size={96}
          weight={900}
          words={[
            { text: "ليست", at: 1.95 },
            { text: "كأيِّ", at: 2.3 },
            { text: "ليلة!", at: 2.7, color: COLORS.gold },
          ]}
        />
        {/* underline swipe */}
        <div
          style={{
            position: "absolute",
            top: 770,
            right: 960 - 460,
            width: 920 * p(2.9, 0.7),
            height: 8,
            borderRadius: 4,
            background: `linear-gradient(270deg, ${COLORS.gold}, ${COLORS.white}, ${COLORS.barcaBlue})`,
            boxShadow: `0 0 24px ${COLORS.gold}`,
          }}
        />
      </AbsoluteFill>
      <Vignette strength={0.75} />
    </AbsoluteFill>
  );
};
