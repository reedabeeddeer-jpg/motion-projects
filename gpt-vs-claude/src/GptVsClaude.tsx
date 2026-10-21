import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Background } from "./ui";
import { SCENES } from "./theme";
import { Intro } from "./scenes/Intro";
import { Overview } from "./scenes/Overview";
import { Bars } from "./scenes/Bars";
import { Donuts } from "./scenes/Donuts";
import { Outro } from "./scenes/Outro";

export const GptVsClaude: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Sequence name="Intro" from={SCENES.intro.from} durationInFrames={SCENES.intro.dur}>
      <Intro />
    </Sequence>
    <Sequence name="Overview" from={SCENES.overview.from} durationInFrames={SCENES.overview.dur}>
      <Overview />
    </Sequence>
    <Sequence name="Bars" from={SCENES.bars.from} durationInFrames={SCENES.bars.dur}>
      <Bars />
    </Sequence>
    <Sequence name="Donuts" from={SCENES.donuts.from} durationInFrames={SCENES.donuts.dur}>
      <Donuts />
    </Sequence>
    <Sequence name="Outro" from={SCENES.outro.from} durationInFrames={SCENES.outro.dur}>
      <Outro />
    </Sequence>
    <Audio src={staticFile("audio/music.wav")} volume={0.8} />
  </AbsoluteFill>
);
