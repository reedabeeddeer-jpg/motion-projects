import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { FONT } from "../fonts";
import {
  COLORS,
  CoverImage,
  GOLD_TEXT,
  KineticLine,
  LightBeams,
  Particles,
  Shockwave,
  Sparks,
  SpeedLines,
  Vignette,
  clamp,
  inExpo,
  outBack,
  shakeAt,
  useProgress,
} from "../ui";

// 4.6 – 14.6 s (local 0 – 10).
// VO l2 @0.3: "برشلونة" 0.58–1.53, "في مواجهة ريال مدريد" 1.77–3.71
// VO l3 @4.3: "إنه الكلاسيكو" 4.5–5.8, "أعظم مواجهة في عالم كرة القدم" 6.2–9.1
const HIT = 3.9; // crests collide
const SLAM = 4.6; // "الكلاسيكو" title
const CY = 470;

export const ClashScene: React.FC = () => {
  const { t, p } = useProgress();

  // crest x offset from centre: fly in → hold → pull back → collide → bounce out → spread for title
  const crestX = (side: -1 | 1, arrive: number) => {
    const fly = p(arrive - 0.5, 0.5, outBack);
    let off = interpolate(fly, [0, 1], [1400, 520]);
    off += 90 * p(3.2, 0.5) * (t < HIT ? 1 : 0); // wind-up
    if (t >= HIT - 0.2) off = interpolate(t, [HIT - 0.2, HIT], [610, 190], clamp);
    if (t >= HIT) off = interpolate(p(HIT, 0.9, outBack), [0, 1], [190, 520]);
    off += 270 * p(SLAM, 0.6); // make room for the title
    off += 1200 * p(9.3, 0.7, inExpo); // leave
    return side * off;
  };
  const crestScale = 1 - 0.25 * p(SLAM, 0.6) + 0.04 * Math.sin(t * 2);
  const crestRot = (side: number, arrive: number) =>
    side * (-25 * (1 - p(arrive - 0.5, 0.5)) + (t > HIT ? 10 * Math.sin(p(HIT, 1) * Math.PI) * (1 - p(HIT, 1)) : 0));

  const split = p(0, 0.9);
  const titleK = p(SLAM, 0.5, outBack);
  const exitZoom = p(9.2, 0.8, inExpo);

  return (
    <AbsoluteFill style={{ background: "#030814", overflow: "hidden" }}>
      <AbsoluteFill style={{ translate: shakeAt(t, [{ at: HIT, amount: 30 }, { at: SLAM, amount: 22 }]), scale: String(1 + exitZoom * 0.6) }}>
        <CoverImage src="img/bg-gradient.jpg" zoom={1.08 + t * 0.012} x={-30} filter="brightness(0.4) saturate(1.3)" />

        {/* team-colour panels sliding open */}
        <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.6 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, ${COLORS.barcaBlue}, ${COLORS.garnet})`,
              clipPath: `polygon(0 0, ${50 * split + 6}% 0, ${50 * split - 6}% 100%, 0 100%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, #E9EEF7, ${COLORS.goldDeep})`,
              clipPath: `polygon(${100 - 50 * split + 6}% 0, 100% 0, 100% 100%, ${100 - 50 * split - 6}% 100%)`,
            }}
          />
        </AbsoluteFill>
        {/* divider beam */}
        <div
          style={{
            position: "absolute",
            left: 960 - 40,
            top: -200,
            width: 80,
            height: 1480 * p(0.5, 0.5),
            rotate: "12deg",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
            opacity: 1 - p(SLAM, 0.4),
          }}
        />
        <LightBeams opacity={0.8} />
        <Particles seed="clash" count={50} color="#FFFFFF" speed={60} opacity={0.5} />

        {/* crests */}
        {(
          [
            { src: "img/crest-barca.png", side: -1, arrive: 0.9, h: 400, glow: "rgba(165,0,68,0.95)", name: "برشلونة", nameAt: 0.7 },
            { src: "img/crest-madrid.png", side: 1, arrive: 2.6, h: 430, glow: "rgba(242,193,78,0.95)", name: "ريال مدريد", nameAt: 2.3 },
          ] as const
        ).map((c) => (
          <div
            key={c.src}
            style={{
              position: "absolute",
              left: 960 + crestX(c.side, c.arrive),
              top: CY + Math.sin(t * 1.7 + c.side) * 10,
              translate: "-50% -50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              scale: String(crestScale),
              rotate: `${crestRot(c.side, c.arrive)}deg`,
            }}
          >
            <Img src={staticFile(c.src)} style={{ height: c.h, filter: `drop-shadow(0 0 45px ${c.glow})` }} />
            <div
              style={{
                marginTop: 18,
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: 68,
                color: COLORS.white,
                opacity: p(c.nameAt, 0.4) * (1 - p(SLAM, 0.3)),
                translate: `0 ${(1 - p(c.nameAt, 0.5)) * 30}px`,
                WebkitTextStroke: "2px rgba(5,10,30,0.6)",
                textShadow: `0 0 30px ${c.glow}`,
              }}
            >
              {c.name}
            </div>
          </div>
        ))}

        <Shockwave at={HIT} x={960} y={CY} maxR={1200} />
        <Shockwave at={HIT + 0.12} x={960} y={CY} maxR={750} color="242,193,78" />
        <Sparks at={HIT} x={960} y={CY} seed="hit" count={70} />

        {/* VS */}
        <div
          style={{
            position: "absolute",
            left: 960,
            top: CY,
            translate: "-50% -50%",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 210,
            rotate: "-8deg",
            scale: String(interpolate(p(HIT + 0.05, 0.45, outBack), [0, 1], [3.2, 1]) * (1 - p(SLAM - 0.1, 0.3))),
            opacity: p(HIT + 0.05, 0.15),
            filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.6))",
            ...GOLD_TEXT,
          }}
        >
          VS
        </div>

        {/* الكلاسيكو slam */}
        <Shockwave at={SLAM} x={960} y={CY} maxR={1300} color="242,193,78" />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: CY - 135,
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 215,
            lineHeight: 1.2,
            scale: String(interpolate(titleK, [0, 1], [3, 1]) * (1 + 0.03 * Math.sin(t * 3))),
            opacity: p(SLAM, 0.12),
            filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.65)) drop-shadow(0 0 40px rgba(242,193,78,0.45))",
            ...GOLD_TEXT,
          }}
        >
          الكلاسيكو
        </div>
        {/* light sweep over the title */}
        <div
          style={{
            position: "absolute",
            top: CY - 170,
            height: 340,
            left: interpolate(t, [5.4, 6.4], [-400, 2200], clamp),
            width: 220,
            rotate: "15deg",
            background: "linear-gradient(90deg, transparent, rgba(255,255,240,0.55), transparent)",
            mixBlendMode: "overlay",
            opacity: t > 5.4 && t < 6.4 ? 1 : 0,
          }}
        />

        <KineticLine
          y={760}
          size={70}
          words={[
            { text: "أعظم", at: 6.2 },
            { text: "مواجهة", at: 6.55 },
            { text: "في", at: 7.0 },
            { text: "عالم", at: 7.3 },
            { text: "كرة", at: 7.8 },
            { text: "القدم", at: 8.2, color: COLORS.gold },
          ]}
        />
      </AbsoluteFill>

      {/* broadcast ticker */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 50,
          height: 74,
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(90deg, rgba(5,15,45,0.92), rgba(20,40,110,0.92))",
          borderTop: `3px solid ${COLORS.gold}`,
          translate: `0 ${(1 - p(1.0, 0.6)) * 140 + p(9.3, 0.5, inExpo) * 140}px`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 0,
            height: "100%",
            padding: "0 36px",
            display: "flex",
            alignItems: "center",
            background: COLORS.red,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 40,
            color: "white",
            zIndex: 2,
          }}
        >
          مباشر
        </div>
        <div
          style={{
            position: "absolute",
            right: 200 - (t - 1) * 150,
            whiteSpace: "nowrap",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 40,
            color: COLORS.white,
            direction: "rtl",
          }}
        >
          برشلونة × ريال مدريد • كلاسيكو رمضان • سهرة كروية لكل العائلة • برعاية Signal • برشلونة × ريال مدريد
        </div>
      </div>

      <SpeedLines strength={p(9.0, 1.0, inExpo)} seed="clash-out" />
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};
