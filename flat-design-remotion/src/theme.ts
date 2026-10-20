export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Scene lengths (frames). Transitions overlap by TRANSITION frames.
export const SCENES = { idea: 125, design: 130, launch: 130, end: 125 } as const;
export const TRANSITION = 20;
export const TOTAL_FRAMES =
  SCENES.idea + SCENES.design + SCENES.launch + SCENES.end - 3 * TRANSITION; // 450 = 15s

// Flat palette
export const C = {
  yellow: "#FFD166",
  coral: "#EF476F",
  teal: "#06D6A0",
  blue: "#118AB2",
  navy: "#073B4C",
  cream: "#FFF8E7",
  white: "#FFFFFF",
  orange: "#F78C3B",
} as const;
