import React from "react";

export type Pose = {
  thighF: number; // degrees, negative = forward
  kneeF: number; // positive = shin folds back
  thighB: number;
  kneeB: number;
  armUF: number; // front upper arm, negative = forward/up
  armLF: number; // front forearm relative
  armUB: number;
  armLB: number;
  lean: number; // torso lean, positive = forward
  head: number; // positive = look down
  hipY: number; // hip height above ground (positive)
  bob: number;
};

const THIGH = 92;
const SHIN = 92;
const ROBE = "#EFE6D2";
const ROBE_SHADE = "#D6CAB0";
const SKIN = "#B97A4F";
const SKIN_DARK = "#9C6440";

const Leg: React.FC<{ thigh: number; knee: number; dark?: boolean }> = ({ thigh, knee, dark }) => {
  const c = dark ? SKIN_DARK : SKIN;
  return (
    <g transform={`rotate(${thigh})`}>
      <line x1={0} y1={0} x2={0} y2={THIGH} stroke={dark ? ROBE_SHADE : ROBE} strokeWidth={34} strokeLinecap="round" />
      <g transform={`translate(0 ${THIGH}) rotate(${knee})`}>
        <line x1={0} y1={0} x2={0} y2={SHIN} stroke={c} strokeWidth={20} strokeLinecap="round" />
        {/* sandal + foot */}
        <g transform={`translate(0 ${SHIN}) rotate(${-thigh - knee})`}>
          <path d="M-10 -6 Q 4 -12 28 -4 L 30 4 L -12 4 Z" fill={c} />
          <rect x={-14} y={3} width={48} height={6} rx={3} fill="#5B3A22" />
        </g>
      </g>
    </g>
  );
};

const Arm: React.FC<{ upper: number; lower: number; dark?: boolean }> = ({ upper, lower, dark }) => (
  <g transform={`rotate(${upper})`}>
    <line x1={0} y1={0} x2={0} y2={66} stroke={dark ? ROBE_SHADE : ROBE} strokeWidth={26} strokeLinecap="round" />
    <g transform={`translate(0 66) rotate(${lower})`}>
      <line x1={0} y1={0} x2={0} y2={46} stroke={dark ? ROBE_SHADE : ROBE} strokeWidth={22} strokeLinecap="round" />
      <circle cx={0} cy={58} r={12} fill={dark ? SKIN_DARK : SKIN} />
    </g>
  </g>
);

/** Side-view man in thobe and ghutra, facing right. Origin = ground under the hip. */
export const Man: React.FC<{ pose: Pose; x: number; y: number; scale?: number }> = ({ pose, x, y, scale = 1 }) => {
  const hip = -pose.hipY + pose.bob;
  // robe hem (torso-local) must not go below the ground
  const hem = Math.min(150, pose.hipY - 6);
  const kneeling = Math.max(0, Math.min(1, (180 - pose.hipY) / 80));
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* ground shadow */}
      <ellipse cx={10} cy={4} rx={90 + kneeling * 30} ry={12} fill="rgba(90,50,20,0.25)" />
      <g transform={`translate(0 ${hip})`}>
        <Leg thigh={pose.thighB} knee={pose.kneeB} dark />
        <Leg thigh={pose.thighF} knee={pose.kneeF} />
        <g transform={`rotate(${pose.lean})`}>
          <g transform="translate(4 -128)">
            <Arm upper={pose.armUB} lower={pose.armLB} dark />
          </g>
          {/* thobe */}
          <path
            d={`M -34 -140 Q 0 -150 34 -140 L ${44 + kneeling * 30} ${hem - 10} Q ${50 + kneeling * 40} ${hem} ${40 + kneeling * 40} ${hem} L ${-46 - kneeling * 30} ${hem} Q ${-52 - kneeling * 20} ${hem} ${-48 - kneeling * 20} ${hem - 10} Z`}
            fill={ROBE}
          />
          <path d={`M -34 -140 L -48 ${hem - 10} L -30 ${hem - 6} L -16 -136 Z`} fill={ROBE_SHADE} opacity={0.7} />
          {/* head */}
          <g transform={`translate(4 -168) rotate(${pose.head})`}>
            <rect x={-8} y={-6} width={18} height={20} fill={SKIN} />
            <ellipse cx={8} cy={-26} rx={24} ry={27} fill={SKIN} />
            <path d="M 30 -30 L 40 -20 L 31 -16 Z" fill={SKIN} />
            <path d="M 14 -10 Q 26 -2 32 -12 L 32 0 Q 20 6 12 0 Z" fill="#2B1B12" />
            <circle cx={22} cy={-30} r={3} fill="#2B1B12" />
            {/* ghutra */}
            <path d="M -26 -36 Q -20 -62 10 -60 Q 34 -58 34 -40 L 30 -38 Q 20 -50 2 -48 Q -14 -44 -18 -20 L -36 44 L -50 40 Z" fill="#FAFAF5" />
            <path d="M -18 -20 L -36 44 L -50 40 L -26 -36 Z" fill="#E3DED2" />
            {/* agal */}
            <path d="M -22 -46 Q 4 -66 32 -46" stroke="#1E1E1E" strokeWidth={8} fill="none" strokeLinecap="round" />
          </g>
          <g transform="translate(4 -128)">
            <Arm upper={pose.armUF} lower={pose.armLF} />
          </g>
        </g>
      </g>
    </g>
  );
};
