import { Composition } from "remotion";
import { TalkingHead } from "./TalkingHead";
import edit from "../public/edit.json";
import type { Edit } from "./types";

const data = edit as unknown as Edit;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="TalkingHead"
    component={TalkingHead}
    durationInFrames={data.durationInFrames}
    fps={data.fps}
    width={data.width}
    height={data.height}
    defaultProps={{ edit: data }}
  />
);
