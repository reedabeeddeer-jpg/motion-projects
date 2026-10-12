import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFamily } from "./fonts";

type Props = { text: string; stagger: number; damping: number };

const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

// Bounce / Elastic: each unit drops in with Position + Scale driven by an
// under-damped spring (the "overshoot" curve), staggered like an AE Range Selector.
export const BounceText: React.FC<Props> = ({ text, stagger, damping }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Arabic letters must stay joined, so animate whole words; Latin text goes letter by letter.
  const units = hasArabic(text) ? text.split(" ") : Array.from(text);

  return (
    <AbsoluteFill style={{ background: "#000", justifyContent: "center", alignItems: "center" }}>
      <div
        dir={hasArabic(text) ? "rtl" : "ltr"}
        style={{
          display: "flex",
          gap: hasArabic(text) ? 36 : 0,
          fontFamily,
          fontWeight: hasArabic(text) ? 900 : 700,
          fontSize: 190,
          color: "#fff",
          whiteSpace: "pre",
        }}
      >
        {units.map((u, i) => {
          const p = spring({
            frame: frame - 10 - i * stagger,
            fps,
            config: { damping, stiffness: 140, mass: 0.7 }, // low damping => overshoot
          });
          const y = interpolate(p, [0, 1], [-260, 0]);
          const scale = interpolate(p, [0, 1], [0.2, 1]);
          const opacity = interpolate(p, [0, 0.15], [0, 1], { extrapolateRight: "clamp" });
          return (
            <span key={i} style={{ display: "inline-block", transform: `translateY(${y}px) scale(${scale})`, opacity }}>
              {u}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
