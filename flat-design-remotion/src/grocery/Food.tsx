import React from "react";
import { C } from "../theme";

export const G = { green: "#7BC043", leaf: "#3E8E41", red: "#E63946", bread: "#D9A066", crust: "#B5793F" } as const;

/** Flat food icons, each drawn in a 100x100 box centred on 0,0. */
export type FoodKind = "apple" | "banana" | "carrot" | "milk" | "bread" | "tomato";

export const FoodShape: React.FC<{ kind: FoodKind }> = ({ kind }) => {
  switch (kind) {
    case "apple":
      return (
        <g>
          <path d="M 0 -26 C -30 -42 -48 -14 -44 10 C -40 34 -20 46 0 38 C 20 46 40 34 44 10 C 48 -14 30 -42 0 -26 Z" fill={G.red} />
          <rect x={-3} y={-46} width={6} height={22} rx={3} fill={C.navy} />
          <path d="M 4 -36 C 14 -50 30 -48 32 -42 C 24 -32 12 -32 4 -36 Z" fill={G.green} />
          <path d="M -28 -6 A 20 20 0 0 1 -14 -22" stroke={C.white} strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
      );
    case "tomato":
      return (
        <g>
          <ellipse cx={0} cy={6} rx={44} ry={38} fill={C.coral} />
          <path d="M -22 -28 L 0 -18 L 22 -28 L 10 -14 L 0 -34 L -10 -14 Z" fill={G.leaf} />
          <path d="M -26 0 A 22 22 0 0 1 -12 -18" stroke={C.white} strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
      );
    case "banana":
      return (
        <g>
          <path d="M -42 -20 C -40 30 10 46 44 18 C 30 26 -10 24 -30 -24 Z" fill={C.yellow} />
          <path d="M -42 -20 L -40 -34 L -30 -24 Z" fill={C.navy} />
          <path d="M 44 18 L 48 22 L 40 22 Z" fill={C.navy} />
        </g>
      );
    case "carrot":
      return (
        <g transform="rotate(-25)">
          <path d="M -20 -26 L 20 -26 L 2 48 Q 0 52 -2 48 Z" fill={C.orange} />
          <path d="M -8 -26 L -18 -50 L 0 -32 L 4 -54 L 8 -32 L 20 -48 L 10 -26 Z" fill={G.green} />
          <rect x={-10} y={-6} width={12} height={5} rx={2.5} fill={C.navy} opacity={0.35} />
          <rect x={0} y={14} width={10} height={5} rx={2.5} fill={C.navy} opacity={0.35} />
        </g>
      );
    case "milk":
      return (
        <g>
          <path d="M -26 -26 L -14 -46 L 14 -46 L 26 -26 Z" fill={C.blue} />
          <rect x={-26} y={-28} width={52} height={76} rx={6} fill={C.white} />
          <rect x={-26} y={0} width={52} height={22} fill={C.blue} />
          <circle cx={0} cy={11} r={7} fill={C.white} />
          <rect x={-10} y={-52} width={20} height={8} rx={3} fill={C.navy} />
        </g>
      );
    case "bread":
      return (
        <g>
          <path d="M -46 -4 C -50 -36 50 -36 46 -4 L 40 34 Q 0 42 -40 34 Z" fill={G.bread} />
          <path d="M -24 -18 L -14 -4 M -2 -22 L 8 -8 M 20 -20 L 30 -6" stroke={G.crust} strokeWidth={7} strokeLinecap="round" />
        </g>
      );
  }
};

export const Food: React.FC<{ kind: FoodKind; size: number; style?: React.CSSProperties }> = ({ kind, size, style }) => (
  <svg viewBox="-55 -58 110 112" width={size} height={size} style={{ overflow: "visible", ...style }}>
    <FoodShape kind={kind} />
  </svg>
);
