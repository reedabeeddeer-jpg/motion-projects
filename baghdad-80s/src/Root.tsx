import React from "react";
import { Composition, Folder } from "remotion";
import { Baghdad80s } from "./Baghdad80s";
import { AbuNuwas, CassetteTV, Intro, Outro, Rashid } from "./scenes";
import { DURATION, FPS, HEIGHT, SCENES, WIDTH } from "./timeline";
import "./fonts";

const COMPONENTS = { Intro, Rashid, AbuNuwas, Cassette: CassetteTV, Outro } as const;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Baghdad80s" component={Baghdad80s} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={DURATION} />
    <Folder name="Scenes">
      {SCENES.map((s) => (
        <Composition key={s.id} id={s.id} component={COMPONENTS[s.id]} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={s.duration} />
      ))}
    </Folder>
  </>
);
