import React from "react";
import { Composition } from "remotion";
import { GptVsClaude } from "./GptVsClaude";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./theme";
import "./fonts";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="GptVsClaude"
    component={GptVsClaude}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={TOTAL_FRAMES}
  />
);
