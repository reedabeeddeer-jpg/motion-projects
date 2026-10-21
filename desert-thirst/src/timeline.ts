export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const TOTAL = 660; // 22 s

// Beats (frames). Keep in sync with scripts/sound.py.
export const T = {
  slowStart: 170, // heat gets to him
  stop: 250, // he stops, wipes his forehead
  povStart: 300, // POV: sees the lake on the horizon
  povEnd: 390,
  runEnd: 450, // reaches the water
  drinkEnd: 560,
  praise: 575, // "الحمد لله"
};

export const GROUND_Y = 820;
export const MAN_X = 760;
export const LAKE_OFFSET = 120; // lake's left edge sits this far ahead of the man when he arrives

const RUN = 26;

/** Scroll speed in px/frame at a given frame. */
export const speedAt = (f: number) => {
  if (f < T.slowStart) return 4;
  if (f < T.stop) return 4 * (1 - (f - T.slowStart) / (T.stop - T.slowStart)) ** 1.5;
  if (f < T.povEnd) return 0;
  if (f < T.runEnd - 15) return Math.min(RUN, ((f - T.povEnd) / 12) * RUN);
  if (f < T.runEnd) return RUN * ((T.runEnd - f) / 15);
  return 0;
};

const cum: number[] = [0];
for (let f = 1; f <= TOTAL + 1; f++) cum.push(cum[f - 1] + speedAt(f - 1));

/** Camera x = total distance walked. */
export const camX = (f: number) => cum[Math.max(0, Math.min(TOTAL, Math.floor(f)))];
export const LAKE_WORLD_X = camX(T.runEnd) + MAN_X + LAKE_OFFSET;
