import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { DesignScene } from "./scenes/DesignScene";
import { EndScene } from "./scenes/EndScene";
import { IdeaScene } from "./scenes/IdeaScene";
import { LaunchScene } from "./scenes/LaunchScene";
import { SCENES, TRANSITION } from "./theme";

const timing = linearTiming({ durationInFrames: TRANSITION });

export const FlatDesign: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENES.idea}>
        <IdeaScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SCENES.design}>
        <DesignScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SCENES.launch}>
        <LaunchScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
      <TransitionSeries.Sequence durationInFrames={SCENES.end}>
        <EndScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
