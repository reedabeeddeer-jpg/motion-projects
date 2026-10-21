import React from "react";
import { Composition, Folder } from "remotion";
import { FlatDesign } from "./FlatDesign";
import { Grocery } from "./grocery/Grocery";
import { DesignScene } from "./scenes/DesignScene";
import { EndScene } from "./scenes/EndScene";
import { IdeaScene } from "./scenes/IdeaScene";
import { LaunchScene } from "./scenes/LaunchScene";
import { FPS, HEIGHT, SCENES, TOTAL_FRAMES, WIDTH } from "./theme";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Scenes">
        <Composition id="Idea" component={IdeaScene} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={SCENES.idea} />
        <Composition id="Design" component={DesignScene} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={SCENES.design} />
        <Composition id="Launch" component={LaunchScene} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={SCENES.launch} />
        <Composition id="End" component={EndScene} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={SCENES.end} />
      </Folder>
      <Composition id="FlatDesign" component={FlatDesign} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={TOTAL_FRAMES} />
      <Composition id="Grocery" component={Grocery} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={TOTAL_FRAMES} />
    </>
  );
};
