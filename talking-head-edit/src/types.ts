export type Word = { text: string; from: number; to: number };
export type Caption = { words: Word[]; en: string; from: number; to: number };
export type Side = "claude" | "chatgpt";
export type Point = { side: Side; n: number; icon: string; ar: string; en: string; from: number };
export type MotionEvent = { frame: number; x: number; y: number; strength: number };
export type Edit = {
  fps: number;
  width: number;
  height: number;
  speechFrames: number;
  durationInFrames: number;
  cuts: { from: number; to: number }[];
  captions: Caption[];
  sections: { versus: number; claude: number; chatgpt: number };
  points: Point[];
  motion: MotionEvent[];
};
