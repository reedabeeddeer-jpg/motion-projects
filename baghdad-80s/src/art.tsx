// Flat SVG cut-out illustrations. Each is wrapped in the shared #cut filter
// (white scissor border + shadow) and scales to its container width.
import React from "react";
import { useCurrentFrame } from "remotion";
import { onTwos } from "./collage";
import { PALETTE as C } from "./timeline";

const Svg: React.FC<{ vb: string; children: React.ReactNode }> = ({ vb, children }) => (
  <svg viewBox={vb} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
    <g filter="url(#cut)">{children}</g>
  </svg>
);

export const Sun: React.FC = () => (
  <Svg vb="0 0 400 400">
    <circle cx="200" cy="200" r="190" fill={C.mustard} />
    <circle cx="200" cy="200" r="190" fill="url(#halftone)" />
  </Svg>
);

export const Skyline: React.FC<{ color?: string }> = ({ color = C.teal }) => (
  <Svg vb="0 0 1080 520">
    <g fill={color}>
      {/* buildings */}
      <rect x="0" y="300" width="1080" height="220" />
      <rect x="40" y="230" width="120" height="120" />
      <rect x="860" y="210" width="150" height="140" />
      <rect x="640" y="260" width="110" height="80" />
      {/* minaret left */}
      <rect x="250" y="60" width="34" height="260" />
      <rect x="240" y="130" width="54" height="14" />
      <path d="M250 60 L267 10 L284 60 Z" />
      {/* great dome */}
      <rect x="360" y="240" width="300" height="80" />
      <path d="M380 245 Q380 110 510 90 Q640 110 640 245 Z" />
      <rect x="505" y="40" width="10" height="55" />
      <circle cx="510" cy="40" r="10" />
      {/* minaret right */}
      <rect x="720" y="40" width="34" height="280" />
      <rect x="710" y="120" width="54" height="14" />
      <path d="M720 40 L737 -10 L754 40 Z" />
      {/* small dome */}
      <path d="M870 215 Q870 140 935 130 Q1000 140 1000 215 Z" />
      {/* palms */}
      <rect x="130" y="150" width="12" height="160" />
      <path d="M136 150 q-70 -10 -95 35 q55 -30 95 -35 q-40 -55 -95 -45 q60 0 95 45 q20 -60 75 -60 q-55 20 -75 60 q65 -15 95 30 q-50 -30 -95 -30z" />
      <rect x="1000" y="170" width="12" height="140" />
      <path d="M1006 170 q-70 -10 -95 35 q55 -30 95 -35 q-40 -55 -95 -45 q60 0 95 45 q20 -60 75 -60 q-55 20 -75 60 q65 -15 95 30 q-50 -30 -95 -30z" />
    </g>
    {/* lit windows */}
    <g fill={C.mustard}>
      {[60, 100, 880, 920, 960, 660, 700].map((x, i) => (
        <rect key={i} x={x} y={i < 2 ? 260 : i < 5 ? 240 : 285} width="22" height="30" />
      ))}
      <path d="M480 320 v-50 q30 -30 60 0 v50z" />
    </g>
  </Svg>
);

export const Bus: React.FC = () => {
  const frame = useCurrentFrame();
  const spin = onTwos(frame) * 14;
  const wheel = (cx: number) => (
    <g transform={`rotate(${spin} ${cx} 360)`}>
      <circle cx={cx} cy="360" r="46" fill={C.ink} />
      <circle cx={cx} cy="360" r="20" fill="#bdb6a6" />
      <rect x={cx - 3} y="318" width="6" height="84" fill={C.ink} />
    </g>
  );
  return (
    <Svg vb="0 0 640 420">
      <rect x="10" y="20" width="620" height="335" rx="34" fill={C.red} />
      {/* deck stripe */}
      <rect x="10" y="185" width="620" height="18" fill={C.cream} />
      {/* upper windows */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={`u${i}`} x={40 + i * 112} y="55" width="92" height="100" rx="8" fill="#cfe6e8" />
      ))}
      {/* lower windows */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={`l${i}`} x={150 + i * 112} y="225" width="92" height="85" rx="6" fill="#cfe6e8" />
      ))}
      {/* door */}
      <rect x="40" y="225" width="80" height="125" rx="6" fill="#7d1418" />
      <rect x="48" y="233" width="28" height="80" fill="#cfe6e8" />
      <rect x="84" y="233" width="28" height="80" fill="#cfe6e8" />
      {/* destination board */}
      <rect x="40" y="28" width="210" height="22" rx="4" fill={C.ink} />
      <text x="145" y="45" fontSize="18" fill={C.mustard} textAnchor="middle" fontFamily="Cairo" fontWeight="900">
        الرشيد ← باب المعظم
      </text>
      {/* number plate & lights */}
      <rect x="560" y="320" width="60" height="22" rx="3" fill={C.cream} />
      <circle cx="610" cy="300" r="10" fill={C.mustard} />
      {wheel(170)}
      {wheel(500)}
    </Svg>
  );
};

export const Shanasheel: React.FC<{ flip?: boolean }> = ({ flip }) => (
  <Svg vb="0 0 320 760">
    <g transform={flip ? "translate(320 0) scale(-1 1)" : undefined}>
      {/* brick wall */}
      <rect x="0" y="0" width="320" height="760" fill="#c99c68" />
      {Array.from({ length: 24 }).map((_, r) => (
        <line key={r} x1="0" x2="320" y1={r * 32} y2={r * 32} stroke="#a77c4c" strokeWidth="3" />
      ))}
      {/* wooden bay window */}
      <rect x="30" y="120" width="260" height="300" fill={C.brown} />
      <rect x="20" y="100" width="280" height="26" fill="#5a3218" />
      <rect x="20" y="414" width="280" height="22" fill="#5a3218" />
      {/* lattice */}
      <g stroke="#e9c58d" strokeWidth="4">
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`a${i}`} x1={50 + i * 36} y1="145" x2={50 + i * 36} y2="395" />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`b${i}`} x1="50" y1={145 + i * 36} x2="266" y2={145 + i * 36} />
        ))}
      </g>
      <g fill="#e9c58d">
        {Array.from({ length: 6 }).map((_, i) =>
          Array.from({ length: 7 }).map((__, j) => (
            <rect key={`${i}-${j}`} x={62 + i * 36} y={157 + j * 36} width="12" height="12" transform={`rotate(45 ${68 + i * 36} ${163 + j * 36})`} />
          )),
        )}
      </g>
      {/* brackets */}
      <path d="M40 436 l30 0 l-30 50z M250 436 l30 0 l0 50z" fill="#5a3218" />
      {/* arched door */}
      <path d="M90 760 v-170 q70 -80 140 0 v170z" fill="#3d5b6b" />
      <path d="M160 760 v-215" stroke="#24363f" strokeWidth="6" />
      <circle cx="145" cy="670" r="7" fill={C.mustard} />
      <circle cx="175" cy="670" r="7" fill={C.mustard} />
    </g>
  </Svg>
);

export const Palm: React.FC<{ color?: string }> = ({ color = "#2f7a3a" }) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(onTwos(frame) / 9) * 3;
  return (
    <Svg vb="0 0 360 700">
      <path d="M170 700 Q160 450 185 230 L200 230 Q190 450 196 700 Z" fill="#8a5a33" />
      {Array.from({ length: 14 }).map((_, i) => (
        <path key={i} d={`M${167 + i * 0.6} ${690 - i * 33} l28 -8`} stroke="#5d3a1d" strokeWidth="5" />
      ))}
      <g transform={`rotate(${sway} 192 230)`} fill={color}>
        {[-70, -35, 0, 35, 70, 110, 145, 180, 215].map((a, i) => (
          <ellipse key={i} cx="192" cy="230" rx="150" ry="24" transform={`rotate(${a + 15} 192 230) translate(110 0)`} />
        ))}
        <circle cx="192" cy="240" r="20" fill="#d07a1e" />
        <circle cx="214" cy="248" r="16" fill="#e39a2a" />
      </g>
    </Svg>
  );
};

export const Fish: React.FC = () => (
  <Svg vb="0 0 460 220">
    <path d="M20 110 Q140 0 330 70 L440 20 L410 110 L440 200 L330 150 Q140 220 20 110 Z" fill="#c8732e" />
    <g stroke="#5a2a10" strokeWidth="10" strokeLinecap="round">
      {[110, 160, 210, 260].map((x) => (
        <line key={x} x1={x} y1="60" x2={x + 30} y2="165" />
      ))}
    </g>
    <circle cx="75" cy="95" r="12" fill={C.cream} />
    <circle cx="75" cy="95" r="5" fill={C.ink} />
    <path d="M200 50 q30 -40 70 -10" stroke="#8a3e14" strokeWidth="8" fill="none" />
    {/* lemon slice */}
    <circle cx="300" cy="185" r="32" fill="#f4d23c" />
    <circle cx="300" cy="185" r="22" fill="#fbeb8a" />
  </Svg>
);

export const Istikan: React.FC = () => {
  const frame = useCurrentFrame();
  const steam = onTwos(frame);
  return (
    <Svg vb="0 0 240 340">
      {/* steam */}
      <g stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.85">
        {[90, 125, 160].map((x, i) => (
          <path key={x} d={`M${x} 100 q${12 * Math.sin((steam + i * 7) / 5)} -25 0 -45 q-12 -20 0 -45`} />
        ))}
      </g>
      {/* saucer */}
      <ellipse cx="125" cy="300" rx="115" ry="28" fill={C.cream} />
      <ellipse cx="125" cy="296" rx="115" ry="24" fill="none" stroke={C.blue} strokeWidth="8" />
      {/* glass */}
      <path d="M68 120 L182 120 Q160 200 176 280 Q125 300 74 280 Q90 200 68 120 Z" fill="rgba(255,255,255,0.55)" />
      <path d="M74 150 L176 150 Q158 205 172 276 Q125 294 78 276 Q92 205 74 150 Z" fill="#a8371c" />
      <rect x="66" y="112" width="118" height="12" rx="5" fill={C.mustard} />
      {/* spoon */}
      <rect x="140" y="70" width="8" height="160" rx="4" fill="#cfc9bd" transform="rotate(12 144 150)" />
    </Svg>
  );
};

export const Cassette: React.FC = () => {
  const frame = useCurrentFrame();
  const rot = onTwos(frame) * 9;
  const reel = (cx: number) => (
    <g transform={`rotate(${rot} ${cx} 150)`}>
      <circle cx={cx} cy="150" r="30" fill={C.cream} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <rect key={a} x={cx - 4} y="124" width="8" height="14" fill={C.ink} transform={`rotate(${a} ${cx} 150)`} />
      ))}
      <circle cx={cx} cy="150" r="10" fill={C.ink} />
    </g>
  );
  return (
    <Svg vb="0 0 460 290">
      <rect x="0" y="0" width="460" height="290" rx="22" fill="#2a2a2e" />
      <rect x="30" y="26" width="400" height="190" rx="10" fill={C.cream} />
      <rect x="30" y="40" width="400" height="22" fill={C.pink} />
      <rect x="30" y="66" width="400" height="12" fill={C.mustard} />
      <text x="230" y="58" textAnchor="middle" fontFamily="Cairo" fontWeight="900" fontSize="18" fill={C.cream}>
        أغاني الثمانينات — وجه أ
      </text>
      <rect x="110" y="110" width="240" height="80" rx="40" fill="#3a3a40" />
      <rect x="170" y="128" width="120" height="44" fill="#8a6a4a" opacity="0.8" />
      {reel(150)}
      {reel(310)}
      <path d="M90 290 l30 -50 h220 l30 50z" fill="#3a3a40" />
      {[140, 200, 260, 320].map((x) => (
        <circle key={x} cx={x} cy="268" r="8" fill="#1a1a1c" />
      ))}
    </Svg>
  );
};

export const TV: React.FC = () => {
  const frame = useCurrentFrame();
  const f = onTwos(frame);
  const bars = ["#e9e9e9", "#e8d23a", "#3ac7c9", "#3cb44b", "#c63fb5", "#d9302c", "#2f4fb5"];
  const showStatic = f % 24 < 4;
  return (
    <Svg vb="0 0 520 470">
      {/* antenna */}
      <path d="M260 70 L170 0 M260 70 L360 4" stroke="#3a3a40" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="260" cy="76" rx="44" ry="18" fill="#3a3a40" />
      {/* cabinet */}
      <rect x="0" y="80" width="520" height="350" rx="34" fill="#8b5a2b" />
      <rect x="0" y="80" width="520" height="350" rx="34" fill="url(#halftone)" />
      <rect x="30" y="112" width="350" height="286" rx="40" fill="#1b1b1b" />
      <g clipPath="url(#screen)">
        <clipPath id="screen">
          <rect x="46" y="128" width="318" height="254" rx="34" />
        </clipPath>
        {bars.map((c, i) => (
          <rect key={c} x={46 + i * (318 / 7)} y="128" width={318 / 7 + 1} height="190" fill={c} />
        ))}
        <rect x="46" y="318" width="318" height="64" fill="#1e2a60" />
        <text x="205" y="364" textAnchor="middle" fontFamily="Cairo" fontWeight="900" fontSize="30" fill="#fff">
          تلفزيون بغداد
        </text>
        {showStatic
          ? Array.from({ length: 40 }).map((_, i) => (
              <rect key={i} x="46" y={128 + i * 6.4} width="318" height="3" fill={(i + f) % 3 ? "#ddd" : "#555"} opacity="0.8" />
            ))
          : null}
      </g>
      {/* knobs */}
      <circle cx="450" cy="170" r="28" fill="#2a2a2e" />
      <rect x="446" y="145" width="8" height="24" fill={C.cream} transform={`rotate(${f * 3} 450 170)`} />
      <circle cx="450" cy="250" r="22" fill="#2a2a2e" />
      {[300, 322, 344, 366].map((y) => (
        <rect key={y} x="412" y={y} width="76" height="8" rx="4" fill="#5d3a1d" />
      ))}
      <rect x="60" y="430" width="30" height="40" fill="#3a3a40" />
      <rect x="430" y="430" width="30" height="40" fill="#3a3a40" />
    </Svg>
  );
};

export const River: React.FC<{ seedOffset?: number }> = () => {
  const frame = useCurrentFrame();
  const f = onTwos(frame);
  const band = (y: number, color: string, speed: number, phase: number) => {
    const shift = ((f * speed + phase) % 120) - 120;
    let d = `M${shift} ${y}`;
    for (let x = shift; x <= 1200; x += 60) d += ` q30 -26 60 0`;
    d += ` V 520 H ${shift} Z`;
    return <path d={d} fill={color} />;
  };
  return (
    <svg viewBox="0 0 1080 520" style={{ width: "100%", height: "auto", display: "block" }}>
      <g filter="url(#cut)">
        {band(40, "#7fb6d6", 2, 0)}
        {band(150, C.river, -3, 40)}
        {band(270, C.blue, 4, 80)}
        {band(390, "#1f3f6e", -2, 20)}
      </g>
    </svg>
  );
};
