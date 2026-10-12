import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "./fonts";

const COLORS = {
  coral: "#FF4D6D",
  amber: "#FFC145",
  teal: "#3DDBD9",
  violet: "#7B61FF",
  white: "#F5F7FF",
  muted: "#9AA3C7",
};

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Props = { title: string; subtitle: string };

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const angle = interpolate(frame, [0, 300], [135, 175]);
  // two soft glows drifting slowly behind the logo
  const g1x = 50 + Math.sin(frame / 70) * 12;
  const g1y = 40 + Math.cos(frame / 90) * 8;
  const g2x = 50 - Math.sin(frame / 80) * 18;
  const g2y = 70 + Math.sin(frame / 60) * 6;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(${angle}deg, #070A17 0%, #141038 45%, #0A2233 100%)` }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${g1x}% ${g1y}%, rgba(123,97,255,0.30) 0%, rgba(123,97,255,0) 38%),
                       radial-gradient(circle at ${g2x}% ${g2y}%, rgba(61,219,217,0.16) 0%, rgba(61,219,217,0) 35%)`,
        }}
      />
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tiles = [COLORS.coral, COLORS.amber, COLORS.teal, COLORS.violet];
  const positions = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  const size = 110;
  const gap = 20;

  // whole-mark rotation: settles from -90deg to 45deg (diamond)
  const settle = spring({ frame: frame - 6, fps, config: { damping: 18, mass: 1.2 } });
  const rotation = interpolate(settle, [0, 1], [-90, 45]);
  const breathe = 1 + Math.sin(frame / 22) * 0.015;
  const floatY = Math.sin(frame / 30) * 6;

  return (
    <div style={{ position: "relative", width: 360, height: 360, transform: `translateY(${floatY}px) rotate(${rotation}deg) scale(${breathe})` }}>
      {tiles.map((color, i) => {
        const s = spring({ frame: frame - 4 - i * 5, fps, config: { damping: 13, stiffness: 120 } });
        const [dx, dy] = positions[i];
        const spread = interpolate(s, [0, 1], [140, 0]);
        const off = (size + gap) / 2 + spread;
        const blur = interpolate(s, [0, 1], [18, 0], clampOpts);
        return (
          <div
            key={color}
            style={{
              position: "absolute",
              left: 180 + dx * off - size / 2,
              top: 180 + dy * off - size / 2,
              width: size,
              height: size,
              borderRadius: size * 0.28,
              background: color,
              opacity: Math.min(1, s * 1.4),
              transform: `scale(${s})`,
              filter: `blur(${blur}px)`,
              boxShadow: `0 0 50px ${color}55`,
            }}
          />
        );
      })}
    </div>
  );
};

const Ring: React.FC<{ delay: number; color: string; max: number }> = ({ delay, color, max }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame - delay, [0, 40], [0, 1], { ...clampOpts, easing: Easing.out(Easing.cubic) });
  if (k <= 0 || k >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        width: max * k,
        height: max * k,
        borderRadius: "50%",
        border: `${Math.max(1, 6 * (1 - k))}px solid ${color}`,
        opacity: 1 - k,
      }}
    />
  );
};

const Title: React.FC<Props> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t = spring({ frame: frame - 45, fps, config: { damping: 20, mass: 0.9 } });
  const titleY = interpolate(t, [0, 1], [140, 0]);
  const titleBlur = interpolate(t, [0, 1], [12, 0], clampOpts);

  const line = interpolate(frame, [62, 92], [0, 1], { ...clampOpts, easing: Easing.out(Easing.cubic) });

  const sub = spring({ frame: frame - 72, fps, config: { damping: 200 } });

  // light sweep across the title after it lands
  const shine = interpolate(frame, [95, 150], [-30, 130], clampOpts);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl", fontFamily }}>
      <div style={{ overflow: "hidden", padding: "0 40px" }}>
        <div
          style={{
            fontSize: 150,
            fontWeight: 900,
            lineHeight: 1.35,
            transform: `translateY(${titleY}px)`,
            filter: `blur(${titleBlur}px)`,
            backgroundImage: `linear-gradient(100deg, ${COLORS.white} ${shine - 12}%, #FFFFFF ${shine}%, #C9B8FF ${shine + 4}%, ${COLORS.white} ${shine + 14}%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {title}
        </div>
      </div>

      {/* accent line grows from the right (RTL) */}
      <div style={{ width: 620, height: 8, marginTop: 6, display: "flex", justifyContent: "flex-start" }}>
        <div
          style={{
            width: `${line * 100}%`,
            height: "100%",
            borderRadius: 4,
            background: `linear-gradient(to left, ${COLORS.coral}, ${COLORS.amber}, ${COLORS.teal})`,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 30,
          fontSize: 54,
          fontWeight: 700,
          color: COLORS.muted,
          opacity: sub,
          transform: `translateY(${interpolate(sub, [0, 1], [30, 0])}px)`,
          letterSpacing: 0,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};

export const LogoReveal: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // outro: gentle zoom-out + fade over the last ~1.2s, fade in over the first 10 frames
  const outro = interpolate(frame, [durationInFrames - 36, durationInFrames], [0, 1], {
    ...clampOpts,
    easing: Easing.in(Easing.cubic),
  });
  const fadeIn = interpolate(frame, [0, 10], [0, 1], clampOpts);
  // slow push-in during the hold for a bit of life
  const push = interpolate(frame, [0, durationInFrames], [1, 1.04]);

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: fadeIn * (1 - outro),
          transform: `scale(${push * (1 - outro * 0.08)})`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -40 }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", height: 380 }}>
            <Ring delay={10} color={COLORS.violet} max={760} />
            <Ring delay={18} color={COLORS.teal} max={900} />
            <Logo />
          </div>
          <Title {...props} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
