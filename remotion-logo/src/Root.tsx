import { Composition } from "remotion";
import { LogoReveal } from "./LogoReveal";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="LogoReveal"
    component={LogoReveal}
    durationInFrames={300}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{
      title: "استوديو الحركة",
      subtitle: "نصنع قصصاً تتحرك",
    }}
  />
);
