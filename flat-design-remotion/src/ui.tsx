import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "./fonts";

export const usePop = (delay: number, damping = 12) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness: 140, mass: 0.8 } });
};

/** Headline that rises word-by-word (RTL). */
export const Headline: React.FC<{
  text: string;
  delay: number;
  color: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ text, delay, color, size = 140, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div
      dir="rtl"
      style={{
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.25,
        color,
        display: "flex",
        flexWrap: "wrap",
        gap: "0 0.28em",
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = spring({ frame: frame - delay - i * 5, fps, config: { damping: 14, stiffness: 160 } });
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.1em" }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${interpolate(p, [0, 1], [110, 0])}%)`,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Flat pill underline that draws in from the right. */
export const Bar: React.FC<{ delay: number; color: string; width: number; style?: React.CSSProperties }> = ({
  delay,
  color,
  width,
  style,
}) => {
  const p = usePop(delay, 18);
  return (
    <div
      style={{
        height: 22,
        width: width * p,
        borderRadius: 11,
        background: color,
        marginRight: 0,
        marginLeft: "auto",
        ...style,
      }}
    />
  );
};

/** A floating decorative flat shape. */
export const Floater: React.FC<{
  x: number;
  y: number;
  size: number;
  color: string;
  kind: "circle" | "ring" | "square" | "triangle" | "plus";
  delay: number;
  drift?: number;
  spin?: number;
}> = ({ x, y, size, color, kind, delay, drift = 14, spin = 0.6 }) => {
  const frame = useCurrentFrame();
  const p = usePop(delay, 10);
  const dy = Math.sin((frame + delay * 7) / 22) * drift;
  const rot = (frame - delay) * spin;
  const common: React.CSSProperties = {
    position: "absolute",
    left: x - size / 2,
    top: y - size / 2,
    width: size,
    height: size,
    transform: `translateY(${dy}px) scale(${p}) rotate(${rot}deg)`,
  };
  if (kind === "circle") return <div style={{ ...common, borderRadius: "50%", background: color }} />;
  if (kind === "ring")
    return <div style={{ ...common, borderRadius: "50%", border: `${size * 0.16}px solid ${color}`, boxSizing: "border-box" }} />;
  if (kind === "square") return <div style={{ ...common, borderRadius: size * 0.18, background: color }} />;
  if (kind === "plus")
    return (
      <svg viewBox="0 0 10 10" style={common}>
        <rect x="4" y="0" width="2" height="10" rx="1" fill={color} />
        <rect x="0" y="4" width="10" height="2" rx="1" fill={color} />
      </svg>
    );
  return (
    <svg viewBox="0 0 10 10" style={common}>
      <polygon points="5,0.5 9.5,9 0.5,9" fill={color} />
    </svg>
  );
};
