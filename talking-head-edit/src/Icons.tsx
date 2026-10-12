// Simple line icons drawn in SVG so the render needs no emoji or icon fonts.
type P = { color: string; size?: number; progress?: number };

const Svg: React.FC<{ size: number; children: React.ReactNode; color: string; progress: number }> = ({
  size,
  children,
  color,
  progress,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    stroke={color}
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    // pathLength=1 on every path lets one dash offset "draw" the whole icon
    strokeDasharray={1}
    strokeDashoffset={1 - progress}
  >
    {children}
  </svg>
);

export const Icon: React.FC<P & { name: string }> = ({ name, color, size = 56, progress = 1 }) => {
  const s = { size, color, progress };
  switch (name) {
    case "files":
      return (
        <Svg {...s}>
          <path pathLength={1} d="M14 6h14l8 8v26a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
          <path pathLength={1} d="M28 6v8h8" />
          <path pathLength={1} d="M19 26l-3 3 3 3M29 26l3 3-3 3" />
        </Svg>
      );
    case "motion":
      return (
        <Svg {...s}>
          <circle pathLength={1} cx="30" cy="24" r="9" />
          <path pathLength={1} d="M6 18h10M4 24h12M6 30h10" />
          <path pathLength={1} d="M34 10l2-4M40 16l4-2M40 32l4 2" />
        </Svg>
      );
    case "code":
      return (
        <Svg {...s}>
          <rect pathLength={1} x="5" y="9" width="38" height="30" rx="4" />
          <path pathLength={1} d="M14 20l5 4-5 4M23 30h10" />
          <path pathLength={1} d="M34 15l2 2 4-4" />
        </Svg>
      );
    case "film":
      return (
        <Svg {...s}>
          <rect pathLength={1} x="6" y="16" width="36" height="24" rx="3" />
          <path pathLength={1} d="M6 16l4-8 34-0-2 8M18 8l-4 8M30 8l-4 8" />
          <path pathLength={1} d="M21 23v10l8-5z" />
        </Svg>
      );
    case "prompt":
      return (
        <Svg {...s}>
          <path pathLength={1} d="M8 10h32a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H22l-9 7v-7H8a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z" />
          <path pathLength={1} d="M13 19h22M13 25h14" />
        </Svg>
      );
    case "wrench":
      return (
        <Svg {...s}>
          <path
            pathLength={1}
            d="M30 7a10 10 0 0 0-9 14L7 35a4 4 0 0 0 6 6l14-14a10 10 0 0 0 14-9l-6 6-6-2-2-6 6-6a10 10 0 0 0-3-3z"
          />
        </Svg>
      );
    case "spark":
      return (
        <Svg {...s}>
          <path pathLength={1} d="M24 4v12M24 32v12M4 24h12M32 24h12M10 10l8 8M30 30l8 8M38 10l-8 8M18 30l-8 8" />
        </Svg>
      );
    case "chat":
      return (
        <Svg {...s}>
          <circle pathLength={1} cx="24" cy="24" r="17" />
          <path pathLength={1} d="M16 22h16M16 28h10" />
        </Svg>
      );
    default:
      return null;
  }
};
