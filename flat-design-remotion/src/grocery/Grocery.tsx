import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { SCENES, TRANSITION } from "../theme";
import { AppScene } from "./AppScene";
import { BasketScene } from "./BasketScene";
import { DeliveryScene } from "./DeliveryScene";
import { GroceryEndScene } from "./GroceryEndScene";

const timing = linearTiming({ durationInFrames: TRANSITION });

export const Grocery: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={SCENES.idea}>
      <BasketScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={timing} />
    <TransitionSeries.Sequence durationInFrames={SCENES.design}>
      <AppScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={timing} />
    <TransitionSeries.Sequence durationInFrames={SCENES.launch}>
      <DeliveryScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
    <TransitionSeries.Sequence durationInFrames={SCENES.end}>
      <GroceryEndScene />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
