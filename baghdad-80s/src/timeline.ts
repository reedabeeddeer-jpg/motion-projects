export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 15 * FPS; // 450 frames

// Scene start frames and lengths (sum = 450).
export const SCENES = [
  { id: "Intro", from: 0, duration: 96 },
  { id: "Rashid", from: 96, duration: 102 },
  { id: "AbuNuwas", from: 198, duration: 102 },
  { id: "Cassette", from: 300, duration: 90 },
  { id: "Outro", from: 390, duration: 60 },
] as const;

export const PALETTE = {
  cream: "#f3e9d2",
  paper: "#e9dcbd",
  ink: "#1d1a17",
  red: "#c8262c",
  mustard: "#e3a232",
  teal: "#2c6e6a",
  sky: "#a9d3cf",
  blue: "#2f5f9e",
  river: "#3c7fb1",
  navy: "#1d2740",
  pink: "#e86f8a",
  brown: "#7a4a2a",
  orange: "#ef8a3c",
};

// Baghdadi-dialect voice-over, one line per scene (seconds = where it starts).
// Put the generated files at public/audio/vo/l1.wav … l5.wav, then set VO_READY = true.
export const VO_READY = false;
export const VO_LINES = [
  { id: "l1", at: 0.4, text: "هاي بغداد… أيام الثمانينات." },
  { id: "l2", at: 3.5, text: "شارع الرشيد، والباص الأحمر أبو الطابقين." },
  { id: "l3", at: 6.9, text: "وأبو نؤاس على دجلة… سمچ مسگوف وچاي." },
  { id: "l4", at: 10.3, text: "زمن الكاسيت والتلفزيون، وسهرات الأهل." },
  { id: "l5", at: 13.2, text: "بغداد… ذكريات ما تنتسى." },
] as const;
