import React from "react";
import { AbsoluteFill, Composition, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Scene } from "./Scene";
import { FPS, HEIGHT, TOTAL, WIDTH } from "./timeline";
import "./fonts";

const DesertThirst: React.FC = () => (
  <AbsoluteFill>
    <Scene />
    <Audio src={staticFile("audio/sound.wav")} />
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <Composition id="DesertThirst" component={DesertThirst} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={TOTAL} />
);
