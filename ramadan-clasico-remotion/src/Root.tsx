import React from "react";
import { Composition, Folder } from "remotion";
import { RamadanClasico } from "./RamadanClasico";
import { ClashScene } from "./scenes/ClashScene";
import { EndScene } from "./scenes/EndScene";
import { IntroScene } from "./scenes/IntroScene";
import { ProductScene } from "./scenes/ProductScene";
import { RamadanScene } from "./scenes/RamadanScene";
import { FPS, HEIGHT, TOTAL_SECONDS, WIDTH } from "./timeline";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Scenes">
        <Composition id="Intro" component={IntroScene} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={138} />
        <Composition id="Clash" component={ClashScene} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={300} />
        <Composition id="Ramadan" component={RamadanScene} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={222} />
        <Composition id="Product" component={ProductScene} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={240} />
        <Composition id="End" component={EndScene} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={195} />
      </Folder>
      <Composition
        id="RamadanClasico"
        component={RamadanClasico}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={Math.round(TOTAL_SECONDS * FPS)}
      />
    </>
  );
};
