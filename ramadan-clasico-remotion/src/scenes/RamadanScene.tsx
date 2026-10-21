import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { FONT } from "../fonts";
import { COLORS, GOLD_TEXT, KineticLine, Particles, Vignette, clamp, outBack, useProgress } from "../ui";

// 14.6 – 22.0 s (local 0 – 7.4).
// VO l4 @0.4: "وفي ليالي رمضان المباركة" 0.75–2.95, "تجتمع العائلة على شغف واحد" 3.2–5.8
// The background is 1536×1024 cover-scaled to 1920×1080 (×1.25, 100px cropped top/bottom),
// so these positions are in that frame and move with the camera wrapper.
const ARCH = { x: 962, y: 455 };
const LANTERNS = [
  { x: 229, y: 487, phase: 0 },
  { x: 327, y: 552, phase: 1.7 },
];
const PLAQUE = { x: 957, y: 947 };

export const RamadanScene: React.FC = () => {
  const { t, p } = useProgress();
  const zoom = interpolate(p(0, 1.8), [0, 1], [1.4, 1.0]) + t * 0.01;
  const titleWipe = p(0.8, 1.1);

  return (
    <AbsoluteFill style={{ background: "#0A0703", overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: String(zoom) }}>
        <Img src={staticFile("img/bg-ramadan.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

        {/* lantern glow flicker */}
        {LANTERNS.map((l) => {
          const f = 0.75 + 0.15 * Math.sin(t * 9 + l.phase) + 0.1 * Math.sin(t * 23 + l.phase * 2);
          return (
            <div
              key={l.x}
              style={{
                position: "absolute",
                left: l.x - 260,
                top: l.y - 260,
                width: 520,
                height: 520,
                borderRadius: "50%",
                mixBlendMode: "screen",
                background: `radial-gradient(circle, rgba(255,200,90,${0.55 * f}) 0%, rgba(255,170,60,${0.18 * f}) 40%, rgba(255,150,40,0) 70%)`,
              }}
            />
          );
        })}

        {/* sun rays from the right sky */}
        <div
          style={{
            position: "absolute",
            left: 1720,
            top: 330,
            width: 0,
            height: 0,
            mixBlendMode: "screen",
          }}
        >
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 950,
                height: 60,
                top: -30,
                transformOrigin: "0 50%",
                rotate: `${112 + i * 7.5 + Math.sin(t * 0.5 + i) * 1.2}deg`,
                background: "linear-gradient(90deg, rgba(255,220,140,0.18), rgba(255,220,140,0))",
                clipPath: "polygon(0 45%, 100% 0, 100% 100%, 0 55%)",
              }}
            />
          ))}
        </div>

        {/* crescent + star */}
        <div
          style={{
            position: "absolute",
            left: ARCH.x - 50,
            top: ARCH.y - 300,
            width: 100,
            height: 100,
            scale: String(p(0.5, 0.8, outBack)),
            rotate: `${-20 + 20 * p(0.5, 1)}deg`,
          }}
        >
          <svg viewBox="0 0 100 100" width={100} height={100} style={{ overflow: "visible" }}>
            <defs>
              <mask id="moon">
                <rect width="100" height="100" fill="white" />
                <circle cx="64" cy="42" r="38" fill="black" />
              </mask>
            </defs>
            <circle cx="50" cy="50" r="42" fill={COLORS.goldDeep} mask="url(#moon)" />
            <polygon
              points="88,18 91,27 100,27 93,33 95,42 88,36 81,42 83,33 76,27 85,27"
              fill={COLORS.goldDeep}
              style={{ transformOrigin: "88px 30px", rotate: `${t * 40}deg` }}
            />
          </svg>
        </div>

        {/* رمضان كريم */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: ARCH.y - 205,
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 140,
            lineHeight: 1.3,
            direction: "rtl",
            clipPath: `inset(0 0 0 ${100 - titleWipe * 100}%)`,
            filter: "drop-shadow(0 5px 10px rgba(90,55,10,0.5))",
            ...GOLD_TEXT,
          }}
        >
          رمضان كريم
        </div>
        {/* shimmer across the title */}
        <div
          style={{
            position: "absolute",
            top: ARCH.y - 200,
            height: 200,
            left: interpolate(t, [2.0, 3.0], [500, 1450], clamp),
            width: 120,
            rotate: "15deg",
            background: "linear-gradient(90deg, transparent, rgba(255,255,235,0.8), transparent)",
            mixBlendMode: "overlay",
            opacity: t > 2.0 && t < 3.0 ? 1 : 0,
          }}
        />

        {/* ornament lines */}
        {[-1, 1].map((s) => (
          <div
            key={s}
            style={{
              position: "absolute",
              top: ARCH.y + 25,
              left: s < 0 ? ARCH.x - 60 - 280 * p(1.6, 0.9) : ARCH.x + 60,
              width: 280 * p(1.6, 0.9),
              height: 3,
              background: COLORS.goldDeep,
            }}
          />
        ))}

        <KineticLine
          y={ARCH.y + 50}
          size={62}
          words={[
            { text: "تجتمع", at: 3.2, color: "#3B2A10" },
            { text: "العائلة", at: 3.6, color: "#3B2A10" },
            { text: "على", at: 4.1, color: "#3B2A10" },
            { text: "شغف", at: 4.4, color: "#8F4E10" },
            { text: "واحد", at: 4.8, color: "#8F4E10" },
          ]}
        />

        {/* crests inside the arch */}
        {(
          [
            { src: "img/crest-barca.png", dx: 210, at: 5.0, h: 120 },
            { src: "img/crest-madrid.png", dx: -210, at: 5.15, h: 130 },
          ] as const
        ).map((c) => (
          <Img
            key={c.src}
            src={staticFile(c.src)}
            style={{
              position: "absolute",
              left: ARCH.x + c.dx,
              top: ARCH.y + 230,
              height: c.h,
              translate: "-50% -50%",
              scale: String(p(c.at, 0.6, outBack)),
              filter: "drop-shadow(0 4px 10px rgba(90,55,10,0.45))",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: ARCH.x,
            top: ARCH.y + 230,
            translate: "-50% -50%",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 60,
            color: COLORS.goldDeep,
            opacity: p(5.3, 0.3),
          }}
        >
          ×
        </div>

        {/* plaque */}
        <div
          style={{
            position: "absolute",
            left: PLAQUE.x,
            top: PLAQUE.y + 12,
            translate: `-50% ${-50 + (1 - p(5.6, 0.6)) * 30}%`,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 46,
            color: COLORS.gold,
            whiteSpace: "nowrap",
            direction: "rtl",
            opacity: p(5.6, 0.5),
            textShadow: "0 0 18px rgba(242,193,78,0.6)",
          }}
        >
          برعاية Signal
        </div>
      </AbsoluteFill>

      <Particles seed="ramadan" count={80} color="#FFD98A" speed={30} size={[2, 5]} opacity={0.75} />
      <AbsoluteFill style={{ background: "rgba(255,190,100,0.12)", mixBlendMode: "soft-light" }} />
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};
