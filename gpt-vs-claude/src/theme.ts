export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const TOTAL_FRAMES = 25 * FPS; // 750

// Scene timing in frames — keep in sync with scripts/music.py
export const SCENES = {
  intro: { from: 0, dur: 105 },
  overview: { from: 105, dur: 135 },
  bars: { from: 240, dur: 210 },
  donuts: { from: 450, dur: 165 },
  outro: { from: 615, dur: 135 },
};

export const C = {
  bg: "#070B18",
  panel: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.12)",
  text: "#F4F6FB",
  muted: "#9AA3B8",
  gpt: "#19C39C",
  claude: "#E8875F",
};
