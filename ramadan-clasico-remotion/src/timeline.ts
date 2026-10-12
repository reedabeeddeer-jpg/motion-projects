// All times in seconds. Keep scene starts in sync with scripts/music.py.
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const SCENES = {
  intro: { start: 0, duration: 4.6 },
  clash: { start: 4.6, duration: 10 },
  ramadan: { start: 14.6, duration: 7.4 },
  product: { start: 22.0, duration: 8 },
  end: { start: 30.0, duration: 6.5 },
} as const;

export const TOTAL_SECONDS = 36.5;

// Voice-over clips (public/audio/vo/*.mp3) and where they start on the main timeline.
// `speech` is the [start, end] of actual speech inside the clip, used to duck the music.
export const VO = [
  { id: "l1", at: 0.8, speech: [0.0, 2.6] },
  { id: "l2", at: 4.9, speech: [0.28, 3.41] },
  { id: "l3", at: 8.9, speech: [0.2, 4.81] },
  { id: "l4", at: 15.0, speech: [0.35, 5.4] },
  { id: "l5", at: 22.4, speech: [0.38, 6.54] },
  { id: "l6a", at: 30.3, speech: [0.25, 2.89] },
  { id: "l6b", at: 33.4, speech: [0.2, 1.53] },
] as const;
