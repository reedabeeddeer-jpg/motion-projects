import React from "react";
import { Audio } from "@remotion/media";
import { lightLeak } from "@remotion/effects/light-leak";
import { TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, Solid, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "./fonts";
import { ClashScene } from "./scenes/ClashScene";
import { EndScene } from "./scenes/EndScene";
import { IntroScene } from "./scenes/IntroScene";
import { ProductScene } from "./scenes/ProductScene";
import { RamadanScene } from "./scenes/RamadanScene";
import { VO } from "./timeline";
import { Flash, Grain, clamp } from "./ui";

const LightLeakOverlay: React.FC<{ seed?: number; hueShift?: number }> = ({ seed = 0, hueShift = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, height, width } = useVideoConfig();
  return (
    <Solid
      width={width}
      height={height}
      style={{ mixBlendMode: "screen", opacity: 0.9 }}
      effects={[
        lightLeak({
          seed,
          hueShift,
          progress: interpolate(frame, [0, durationInFrames - 1], [0, 1], clamp),
        }),
      ]}
    />
  );
};

// a flash that peaks at the middle of the overlay (the cut point)
const CutFlash: React.FC<{ color?: string; peak?: number }> = ({ color, peak }) => {
  const { durationInFrames, fps } = useVideoConfig();
  const half = durationInFrames / fps / 2;
  return <Flash at={half} dur={half} color={color} peak={peak} centered />;
};

// music sits lower while the narrator speaks
const musicVolume = (frame: number, fps: number) => {
  const t = frame / fps;
  let duck = 0;
  for (const v of VO) {
    const a = v.at + v.speech[0];
    const b = v.at + v.speech[1];
    duck = Math.max(duck, interpolate(t, [a - 0.15, a, b, b + 0.3], [0, 1, 1, 0], clamp));
  }
  return 0.5 - 0.3 * duck;
};

export const RamadanClasico: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "black" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Intro" durationInFrames={4.6 * fps} premountFor={fps}>
          <IntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={12} premountFor={fps}>
          <CutFlash peak={0.95} />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence name="Clash" durationInFrames={10 * fps} premountFor={fps}>
          <ClashScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={16} premountFor={fps}>
          <CutFlash color="255,236,200" peak={1} />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence name="Ramadan" durationInFrames={7.4 * fps} premountFor={fps}>
          <RamadanScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={30} premountFor={fps}>
          <LightLeakOverlay seed={3} />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence name="Product" durationInFrames={8 * fps} premountFor={fps}>
          <ProductScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={24} premountFor={fps}>
          <LightLeakOverlay seed={7} hueShift={200} />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence name="End" durationInFrames={6.5 * fps} premountFor={fps}>
          <EndScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Grain />

      <Audio name="Music" src={staticFile("audio/music.wav")} volume={(f) => musicVolume(f, fps)} />
      <Audio name="VO: الليلة ليست كأي ليلة" src={staticFile("audio/vo/l1.mp3")} from={0.8 * fps} volume={0.78} premountFor={fps} />
      <Audio name="VO: برشلونة في مواجهة ريال مدريد" src={staticFile("audio/vo/l2.mp3")} from={4.9 * fps} volume={0.78} premountFor={fps} />
      <Audio name="VO: إنه الكلاسيكو" src={staticFile("audio/vo/l3.mp3")} from={8.9 * fps} volume={0.78} premountFor={fps} />
      <Audio name="VO: ليالي رمضان" src={staticFile("audio/vo/l4.mp3")} from={15 * fps} volume={0.78} premountFor={fps} />
      <Audio name="VO: ومع سيجنال" src={staticFile("audio/vo/l5.mp3")} from={22.4 * fps} volume={0.78} premountFor={fps} />
      <Audio name="VO: سيجنال ابتسامة الفوز" src={staticFile("audio/vo/l6a.mp3")} from={30.3 * fps} volume={0.78} premountFor={fps} />
      <Audio name="VO: رمضان كريم" src={staticFile("audio/vo/l6b.mp3")} from={33.4 * fps} volume={0.78} premountFor={fps} />
    </AbsoluteFill>
  );
};
