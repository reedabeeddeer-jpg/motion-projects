import { AbsoluteFill, Easing, interpolate, random, Sequence, useCurrentFrame } from "remotion";
import { fontFamily } from "./fonts";

export const PHRASE_FRAMES = 90;

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Props = { phrases: string[] };

const SPARK_COUNT = 28;

const Sparks: React.FC<{ t: number; seed: string }> = ({ t, seed }) => (
  <>
    {Array.from({ length: SPARK_COUNT }, (_, i) => {
      const delay = random(`${seed}-d-${i}`) * 18;
      const life = 25 + random(`${seed}-l-${i}`) * 25;
      const p = (t - delay) / life;
      if (p < 0 || p > 1) return null;
      const x = 50 + (random(`${seed}-x-${i}`) - 0.5) * 42;
      const y = 56 - p * (14 + random(`${seed}-y-${i}`) * 18);
      const drift = (random(`${seed}-f-${i}`) - 0.5) * 3 * p;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x + drift}%`,
            top: `${y}%`,
            width: 2,
            height: 8 + random(`${seed}-h-${i}`) * 10,
            background: "#FFB24A",
            boxShadow: "0 0 8px #FF8A1F",
            opacity: Math.sin(p * Math.PI) * 0.9,
            transform: `rotate(${20 + random(`${seed}-r-${i}`) * 30}deg)`,
          }}
        />
      );
    })}
  </>
);

const Phrase: React.FC<{ text: string; index: number }> = ({ text, index }) => {
  const t = useCurrentFrame();
  const inBlur = interpolate(t, [0, 22], [60, 0], { ...clampOpts, easing: Easing.out(Easing.cubic) });
  const outBlur = interpolate(t, [72, 90], [0, 45], { ...clampOpts, easing: Easing.in(Easing.cubic) });
  const opacity =
    interpolate(t, [0, 6], [0, 1], clampOpts) * interpolate(t, [72, 90], [1, 0], clampOpts);
  const scale =
    interpolate(t, [0, 22], [0.94, 1], { ...clampOpts, easing: Easing.out(Easing.cubic) }) *
    interpolate(t, [72, 90], [1, 1.1], clampOpts);
  const flash = interpolate(t, [0, 9], [0.8, 0], clampOpts);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#FF7A4D", opacity: flash, mixBlendMode: "screen" }} />
      <Sparks t={t} seed={`p${index}`} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          dir="rtl"
          style={{
            fontFamily,
            fontWeight: 900,
            fontSize: 130,
            lineHeight: 1.3,
            padding: "0 80px",
            textAlign: "center",
            opacity,
            transform: `scale(${scale})`,
            filter: `blur(${inBlur + outBlur}px) drop-shadow(0 0 22px rgba(255,140,40,0.55))`,
            background: "linear-gradient(180deg, #FFE3A0 0%, #FFB347 55%, #E9812B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const TextReveal: React.FC<Props> = ({ phrases }) => {
  const frame = useCurrentFrame();
  const pulse = 0.35 + Math.sin(frame / 40) * 0.04;
  return (
    <AbsoluteFill style={{ background: "#1c0603" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 42%, rgba(160,72,52,${pulse + 0.3}) 0%, rgba(80,24,16,0.6) 40%, rgba(20,4,2,1) 85%)`,
        }}
      />
      {phrases.map((text, i) => (
        <Sequence key={i} from={i * PHRASE_FRAMES} durationInFrames={PHRASE_FRAMES} layout="none">
          <Phrase text={text} index={i} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
