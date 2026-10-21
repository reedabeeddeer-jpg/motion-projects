import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { onTwos, torn } from "./collage";
import { AbuNuwas, CassetteTV, Intro, Outro, Rashid } from "./scenes";
import { FPS, PALETTE as C, SCENES, VO_LINES, VO_READY } from "./timeline";

const COMPONENTS = { Intro, Rashid, AbuNuwas, Cassette: CassetteTV, Outro } as const;
const WIPE_COLORS = [C.mustard, C.red, C.teal, C.pink];
const WIPE = 14;

// A big torn sheet that sweeps up across the cut between two scenes.
const PaperWipe: React.FC<{ color: string; seed: string }> = ({ color, seed }) => {
  const f = onTwos(useCurrentFrame());
  const y = 1920 - (f / WIPE) * (1920 + 2500);
  return (
    <AbsoluteFill style={{ zIndex: 100, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: -60, top: y, width: 1200, height: 2500, transform: "rotate(-4deg)", filter: "drop-shadow(0 -12px 10px rgba(0,0,0,0.35))" }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            background: color,
            clipPath: torn(seed, 26, 30),
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.15) 32%, transparent 36%)",
            backgroundSize: "18px 18px",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Music sits lower while the narrator speaks (each line is ~2.8s).
const musicVolume = (f: number) => {
  if (!VO_READY) return 0.9;
  const t = f / FPS;
  const speaking = VO_LINES.some((l) => t > l.at - 0.15 && t < l.at + 2.8);
  return speaking ? 0.35 : 0.9;
};

export const Baghdad80s: React.FC = () => (
  <AbsoluteFill style={{ background: C.cream }}>
    <Audio src={staticFile("audio/music.wav")} volume={musicVolume} />
    {VO_READY
      ? VO_LINES.map((l) => (
          <Sequence key={l.id} name={`VO ${l.id}`} from={Math.round(l.at * FPS)}>
            <Audio src={staticFile(`audio/vo/${l.id}.wav`)} volume={1} />
          </Sequence>
        ))
      : null}
    {SCENES.map((s) => {
      const Comp = COMPONENTS[s.id];
      return (
        <Sequence key={s.id} name={s.id} from={s.from} durationInFrames={s.duration}>
          <Comp />
        </Sequence>
      );
    })}
    {SCENES.slice(1).map((s, i) => (
      <Sequence key={`wipe-${s.id}`} name={`Wipe → ${s.id}`} from={s.from - WIPE / 2} durationInFrames={WIPE}>
        <PaperWipe color={WIPE_COLORS[i]} seed={`wipe-${i}`} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
