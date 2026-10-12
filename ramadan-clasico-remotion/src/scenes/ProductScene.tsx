import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile } from "remotion";
import { FONT } from "../fonts";
import { COLORS, CoverImage, KineticLine, Sparks, Vignette, clamp, inExpo, outBack, shakeAt, useProgress } from "../ui";

// 22.0 – 30.0 s (local 0 – 8).
// VO l5 @0.4: "ومع سيجنال" 0.78–1.84, "حماية أقوى لأسنانك" 2.1–4.17, "وانتعاش يدوم طوال السهرة" 4.5–6.94
const PRODUCT_H = 640;
const PX = 620;
const PY = 560;

export const Product: React.FC<{ height: number; shine: number }> = ({ height, shine }) => {
  const src = staticFile("img/signal-product.png");
  const width = (height * 514) / 447;
  return (
    <div style={{ position: "relative", width, height }}>
      <Img src={src} style={{ width, height, filter: "drop-shadow(0 30px 40px rgba(0,20,60,0.55))" }} />
      {/* shine sweep masked to the product's alpha */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: "100% 100%",
          maskImage: `url(${src})`,
          maskSize: "100% 100%",
          background: `linear-gradient(110deg, transparent ${shine * 140 - 30}%, rgba(255,255,255,0.8) ${shine * 140 - 15}%, transparent ${shine * 140}%)`,
          opacity: shine > 0 && shine < 1 ? 1 : 0,
        }}
      />
    </div>
  );
};

const Badge: React.FC<{ text: string; at: number; color: string; y: number }> = ({ text, at, color, y }) => {
  const { p } = useProgress();
  const k = p(at, 0.5, outBack);
  return (
    <div
      style={{
        position: "absolute",
        right: 150,
        top: y,
        display: "flex",
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 22,
        padding: "16px 34px 16px 40px",
        borderRadius: 60,
        background: "rgba(255,255,255,0.94)",
        boxShadow: "0 12px 30px rgba(0,30,80,0.35)",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 46,
        color: COLORS.navy,
        direction: "rtl",
        scale: String(k),
        opacity: p(at, 0.15),
        transformOrigin: "100% 50%",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 30,
        }}
      >
        ✓
      </div>
      {text}
    </div>
  );
};

export const ProductScene: React.FC = () => {
  const { t, p } = useProgress();
  const land = p(0.2, 0.9, outBack);
  const glow = p(0.3, 0.8);
  const exit = p(7.3, 0.7, inExpo);
  const count = Math.round(interpolate(t, [2.1, 3.0], [1, 10], clamp));

  return (
    <AbsoluteFill style={{ overflow: "hidden", translate: shakeAt(t, [{ at: 1.0, amount: 10 }]) }}>
      <CoverImage src="img/bg-gradient.jpg" zoom={1.1 + t * 0.02} x={60 - t * 18} y={-30} filter="brightness(0.95) saturate(1.15)" />
      <AbsoluteFill style={{ background: "rgba(8,25,70,0.22)" }} />

      {/* freshness bubbles */}
      <AbsoluteFill>
        {new Array(45).fill(0).map((_, i) => {
          const r = (k: string) => random(`bub-${i}-${k}`);
          const size = 12 + r("s") * 50;
          const y = 1140 - ((r("o") * 1200 + (90 + r("v") * 200) * (t + 0.5)) % 1260);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: r("x") * 1920 + Math.sin(t * 1.5 + r("p") * 6) * 30,
                top: y,
                width: size,
                height: size,
                borderRadius: "50%",
                border: "2px solid rgba(220,240,255,0.8)",
                background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7) 0 12%, rgba(255,255,255,0.05) 30%)",
                opacity: 0.55 * p(0, 0.6),
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* glow + rotating dashed ring behind the product */}
      <div
        style={{
          position: "absolute",
          left: PX - 520,
          top: PY - 520,
          width: 1040,
          height: 1040,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,255,255,${0.75 * glow}) 0%, rgba(150,210,255,${0.25 * glow}) 45%, rgba(150,210,255,0) 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PX - 430,
          top: PY - 430,
          width: 860,
          height: 860,
          borderRadius: "50%",
          border: "3px dashed rgba(255,255,255,0.6)",
          rotate: `${t * 35}deg`,
          scale: String(glow),
        }}
      />

      <div
        style={{
          position: "absolute",
          left: PX,
          top: PY + (1 - land) * 600 + Math.sin(t * 1.8) * 10,
          translate: "-50% -50%",
          rotate: `${(1 - land) * -25 + Math.sin(t * 1.2) * 1.2}deg`,
          scale: String(interpolate(land, [0, 1], [0.6, 1]) * (1 - exit * 0.4)),
          opacity: p(0.2, 0.2),
        }}
      >
        <Product height={PRODUCT_H} shine={p(1.3, 1.0)} />
      </div>
      <Sparks at={1.0} x={PX} y={PY} seed="prod" count={50} />

      {/* copy, right side */}
      <AbsoluteFill style={{ opacity: 1 - exit }}>
        <div
          style={{
            position: "absolute",
            right: 150,
            top: 150,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 120,
            color: COLORS.white,
            direction: "rtl",
            clipPath: `inset(0 0 0 ${100 - p(0.8, 0.8) * 100}%)`,
            textShadow: "0 0 30px rgba(30,80,200,0.7)",
          }}
        >
          ومع <span style={{ color: COLORS.red }}>Signal</span>
        </div>

        {/* 10X counter */}
        <div
          style={{
            position: "absolute",
            left: PX + 250,
            top: 170,
            width: 190,
            height: 190,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.red}, #9E1410)`,
            border: "6px solid white",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontWeight: 900,
            color: "white",
            scale: String(p(2.0, 0.5, outBack)),
            rotate: `${-12 + 12 * p(2.0, 0.6)}deg`,
          }}
        >
          <div style={{ fontSize: 84, lineHeight: 1 }}>{count}X</div>
          <div style={{ fontSize: 26, direction: "rtl" }}>أقوى</div>
        </div>

        <Badge text="حماية أقوى لأسنانك" at={2.1} color={COLORS.red} y={360} />
        <Badge text="فلورايد + كالسيوم نشط" at={3.0} color={COLORS.blue} y={490} />
        <Badge text="انتعاش يدوم طوال السهرة" at={4.5} color="#18A0FB" y={620} />

        <KineticLine
          y={800}
          size={64}
          align="right"
          right={150}
          words={[
            { text: "ابتسامة", at: 5.6 },
            { text: "قوية", at: 5.9, color: COLORS.sky },
            { text: "طوال", at: 6.2 },
            { text: "رمضان", at: 6.5, color: COLORS.gold },
          ]}
        />
      </AbsoluteFill>
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};
