import { Composition } from "remotion";
import { LogoReveal } from "./LogoReveal";
import { PHRASE_FRAMES, TextReveal } from "./TextReveal";

const phrases = ["قوالب آفتر افكت", "حملها بشكل مجاني", "من حسن المزوري", "رائد"];

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="TextReveal"
    component={TextReveal}
    durationInFrames={PHRASE_FRAMES * phrases.length}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ phrases }}
  />
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
  </>
);
