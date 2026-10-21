import React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { Man } from "./Man";
import { poseAt } from "./pose";
import { camX, GROUND_Y, HEIGHT, LAKE_WORLD_X, MAN_X, T, WIDTH } from "./timeline";
import { FONT } from "./fonts";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Rolling dune silhouette as a closed path, scrolled by `offset`. */
const dunePath = (offset: number, base: number, amp: number, seed: number) => {
  let d = `M 0 ${HEIGHT}`;
  for (let x = 0; x <= WIDTH; x += 16) {
    const w = x + offset;
    const y =
      base -
      amp * (0.55 * Math.sin(w / 420 + seed) + 0.3 * Math.sin(w / 180 + seed * 2.3) + 0.15 * Math.sin(w / 95 + seed * 5));
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  return d + ` L ${WIDTH} ${HEIGHT} Z`;
};

const Palm: React.FC<{ x: number; y: number; s: number; flip?: boolean }> = ({ x, y, s, flip }) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame / 25 + x) * 3;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M0 0 Q 12 -90 -8 -200" stroke="#7A5634" strokeWidth={14} fill="none" strokeLinecap="round" />
      <g transform={`translate(-8 -200) rotate(${sway})`}>
        {[-160, -120, -70, -20, 20, 60].map((a, i) => (
          <path
            key={i}
            d="M0 0 Q 50 -30 110 10 Q 60 -10 0 8 Z"
            fill={i % 2 ? "#3F7A3A" : "#2F6630"}
            transform={`rotate(${a + 90})`}
          />
        ))}
        <circle cx={0} cy={4} r={9} fill="#6B4A2B" />
      </g>
    </g>
  );
};

const Lake: React.FC<{ x: number }> = ({ x }) => {
  const frame = useCurrentFrame();
  const ripple = (start: number) => {
    const t = (frame - start) / 30;
    if (t < 0 || t > 1) return null;
    return <ellipse cx={130} cy={70} rx={30 + t * 160} ry={8 + t * 34} stroke="white" strokeWidth={3} fill="none" opacity={1 - t} />;
  };
  return (
    <g transform={`translate(${x} ${GROUND_Y - 40})`}>
      <Palm x={260} y={10} s={1.25} />
      <Palm x={420} y={0} s={1.0} flip />
      <Palm x={820} y={6} s={1.35} flip />
      <Palm x={980} y={14} s={0.9} />
      <ellipse cx={520} cy={74} rx={540} ry={110} fill="#C9A86A" />
      <path d="M 0 70 Q 40 10 300 20 Q 650 0 1050 40 Q 1100 90 900 150 Q 500 200 150 150 Q 10 120 0 70 Z" fill="url(#water)" />
      {new Array(9).fill(0).map((_, i) => {
        const px = 120 + ((i * 113 + frame * 1.4) % 820);
        return <rect key={i} x={px} y={40 + (i % 4) * 26} width={60 + (i % 3) * 30} height={4} rx={2} fill="white" opacity={0.45} />;
      })}
      {ripple(T.runEnd + 36)}
      {ripple(T.runEnd + 36 + 39)}
    </g>
  );
};

const Footprints: React.FC<{ cam: number; frame: number }> = ({ cam, frame }) => {
  const prints = [];
  const last = frame < T.runEnd ? cam + MAN_X - 40 : camX(T.runEnd) + MAN_X - 40;
  for (let w = Math.max(MAN_X, Math.floor(cam / 120) * 120); w < last; w += 120) {
    const sx = w - cam;
    if (sx < -40) continue;
    prints.push(<ellipse key={w} cx={sx} cy={GROUND_Y + 14 + ((w / 120) % 2) * 16} rx={16} ry={5} fill="rgba(120,80,40,0.28)" />);
  }
  return <>{prints}</>;
};

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camX(frame);
  const heat = interpolate(frame, [T.slowStart, T.stop + 20, T.runEnd, T.runEnd + 60], [0, 1, 1, 0], cl);
  const dusk = interpolate(frame, [T.drinkEnd - 40, 660], [0, 1], cl);
  const skyTop = interpolateColors(heat, [0, 1], ["#6FB3E0", "#F7E7C0"]);
  const skyTop2 = interpolateColors(dusk, [0, 1], [skyTop, "#E9895B"]);
  const skyBot = interpolateColors(dusk, [0, 1], [interpolateColors(heat, [0, 1], ["#F6E2B0", "#FFF6E0"]), "#FBD38D"]);
  const sunR = 90 + heat * 50 - dusk * 10;
  const sunY = 210 + dusk * 230;
  const haze = heat * 14;
  const lakeX = LAKE_WORLD_X - cam;
  const pose = poseAt(frame);

  return (
    <AbsoluteFill style={{ background: "#E2AE6C" }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={skyTop2} />
            <stop offset="1" stopColor={skyBot} />
          </linearGradient>
          <radialGradient id="sun">
            <stop offset="0" stopColor="#FFFDF2" />
            <stop offset="0.45" stopColor="#FFF1B8" />
            <stop offset="1" stopColor="#FFD36B" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4FC0D9" />
            <stop offset="1" stopColor="#1C7FA6" />
          </linearGradient>
          <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E9B872" />
            <stop offset="1" stopColor="#C98A4B" />
          </linearGradient>
          <filter id="haze" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.004 0.03" numOctaves={2} seed={3} result="n" />
            <feOffset in="n" dy={-frame * 3} result="m" />
            <feDisplacementMap in="SourceGraphic" in2="m" scale={haze} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter={haze > 0.5 ? "url(#haze)" : undefined} transform="translate(960 540) scale(1.03) translate(-960 -540)">
          <rect width={WIDTH} height={HEIGHT} fill="url(#sky)" />
          <circle cx={1450} cy={sunY} r={sunR * 2.4} fill="url(#sun)" opacity={0.9} />
          <circle cx={1450} cy={sunY} r={sunR * 0.7} fill="#FFFBEA" />
          <path d={dunePath(cam * 0.15, 640, 60, 1)} fill={interpolateColors(dusk, [0, 1], ["#EFCB91", "#D99A6A"])} />
          <path d={dunePath(cam * 0.4, 730, 70, 4)} fill={interpolateColors(dusk, [0, 1], ["#E5B371", "#C98055"])} />
          <path d={dunePath(cam * 0.7, 800, 40, 9)} fill={interpolateColors(dusk, [0, 1], ["#DEA45E", "#BD7247"])} />
          <rect y={GROUND_Y - 4} width={WIDTH} height={HEIGHT - GROUND_Y + 4} fill="url(#sand)" />
        </g>
        {lakeX < WIDTH + 100 && <Lake x={lakeX} />}
        <Footprints cam={cam} frame={frame} />
        <Man pose={pose} x={MAN_X} y={GROUND_Y + 10} scale={1.25} />
        <Sweat frame={frame} />
      </svg>
      {/* heat wash */}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 75% 20%, rgba(255,250,230,0.9), rgba(255,170,80,0.35) 60%)", opacity: heat * 0.45, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(60,25,5,0.55))" }} />
      <Pov />
      <Praise />
    </AbsoluteFill>
  );
};

const Sweat: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.slowStart + 20 || frame > T.povStart) return null;
  return (
    <>
      {[0, 17, 31].map((o) => {
        const t = ((frame + o) % 36) / 36;
        return (
          <path
            key={o}
            d="M0 -9 Q 6 0 0 6 Q -6 0 0 -9 Z"
            transform={`translate(${MAN_X + 40 + o / 3} ${GROUND_Y - 235 + t * 70})`}
            fill="#DFF4FF"
            opacity={1 - t}
          />
        );
      })}
    </>
  );
};

/** Point of view: he blinks, and the oasis shimmers on the horizon. */
const Pov: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.povStart - 8 || frame > T.povEnd + 8) return null;
  const f = frame - T.povStart;
  const fade = interpolate(frame, [T.povStart - 8, T.povStart, T.povEnd, T.povEnd + 8], [0, 1, 1, 0], cl);
  const lid = interpolate(f, [-8, 0, 6, 14], [0, 1, 1, 0], cl);
  const zoom = interpolate(f, [0, 90], [1, 1.35], { ...cl, easing: Easing.inOut(Easing.quad) });
  const reveal = interpolate(f, [10, 40], [0.15, 1], cl);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <linearGradient id="povsky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F5E3B8" />
            <stop offset="1" stopColor="#FFF3D6" />
          </linearGradient>
          <filter id="povhaze">
            <feTurbulence type="fractalNoise" baseFrequency="0.003 0.05" numOctaves={2} seed={8} result="n" />
            <feOffset in="n" dy={-frame * 4} result="m" />
            <feDisplacementMap in="SourceGraphic" in2="m" scale={18} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g transform={`translate(960 600) scale(${zoom}) translate(-960 -600)`} filter="url(#povhaze)">
          <g transform="translate(960 540) scale(1.04) translate(-960 -540)">
          <rect width={WIDTH} height={HEIGHT} fill="url(#povsky)" />
          <path d={dunePath(200, 610, 30, 2)} fill="#EBC58A" />
          <g opacity={reveal}>
            <Palm x={860} y={600} s={0.35} />
            <Palm x={905} y={596} s={0.42} flip />
            <Palm x={1040} y={600} s={0.38} flip />
            <ellipse cx={960} cy={612} rx={170} ry={14} fill="#5CC4DD" />
            <ellipse cx={960} cy={608} rx={120} ry={4} fill="white" opacity={0.6 + Math.sin(frame / 3) * 0.3} />
          </g>
          <path d={dunePath(600, 760, 50, 6)} fill="#DFA75F" />
          <rect y={860} width={WIDTH} height={300} fill="#D39A57" />
          </g>
        </g>
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(40,15,0,0.6))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 540 * lid, background: "#120804" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 540 * lid, background: "#120804" }} />
    </AbsoluteFill>
  );
};

const Praise: React.FC = () => {
  const frame = useCurrentFrame();
  const f = frame - T.praise;
  if (f < 0) return null;
  const a = interpolate(f, [0, 20], [0, 1], cl);
  const y = interpolate(f, [0, 30], [30, 0], { ...cl, easing: Easing.out(Easing.cubic) });
  const b = interpolate(f, [30, 50], [0, 1], cl);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 30, direction: "rtl", fontFamily: FONT }}>
      <div
        style={{
          fontSize: 150,
          fontWeight: 700,
          color: "#FFF4D2",
          opacity: a,
          transform: `translateY(${y}px)`,
          textShadow: "0 0 40px rgba(255,200,90,0.9), 0 6px 18px rgba(80,30,0,0.6)",
        }}
      >
        الحمد لله
      </div>
      <div style={{ fontSize: 46, color: "#FFF4D2", opacity: b * 0.95, marginTop: -10, textShadow: "0 3px 12px rgba(80,30,0,0.8)" }}>
        ﴿ وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ ﴾
      </div>
    </AbsoluteFill>
  );
};
