import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { C } from "../theme";
import { Bar, Floater, Headline, usePop } from "../ui";

const Block: React.FC<{ x: number; y: number; w: number; h: number; color: string; delay: number; r?: number }> = ({
  x,
  y,
  w,
  h,
  color,
  delay,
  r = 14,
}) => {
  const p = usePop(delay, 11);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: r,
        background: color,
        transform: `scale(${p})`,
        transformOrigin: "left center",
      }}
    />
  );
};

const Monitor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  // cursor path
  const t = interpolate(frame, [55, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const cx = interpolate(t, [0, 1], [660, 470]);
  const cy = interpolate(t, [0, 1], [560, 418]);
  const click = interpolate(frame, [86, 90, 96], [1, 0.82, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const clicked = frame >= 90;
  const ripple = interpolate(frame, [90, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        top: 190,
        width: 820,
        height: 700,
        transform: `translateY(${(1 - enter) * 700}px)`,
      }}
    >
      {/* frame */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 820, height: 540, borderRadius: 36, background: C.navy }} />
      <div style={{ position: "absolute", left: 30, top: 30, width: 760, height: 480, borderRadius: 18, background: C.cream, overflow: "hidden" }}>
        {/* browser dots */}
        <Block x={24} y={22} w={22} h={22} r={11} color={C.coral} delay={10} />
        <Block x={56} y={22} w={22} h={22} r={11} color={C.yellow} delay={12} />
        <Block x={88} y={22} w={22} h={22} r={11} color={C.teal} delay={14} />
        <Block x={140} y={20} w={380} h={26} r={13} color="#E9E0CC" delay={16} />
        {/* hero image */}
        <Block x={24} y={70} w={300} h={250} r={18} color={C.blue} delay={22} />
        <Block x={84} y={180} w={180} h={110} r={12} color={C.teal} delay={30} />
        <div style={{ position: "absolute", left: 210, top: 110, width: 60, height: 60, borderRadius: 30, background: C.yellow, transform: `scale(${usePop(34, 10)})` }} />
        {/* text lines */}
        <Block x={350} y={84} w={360} h={34} color={C.navy} delay={36} />
        <Block x={350} y={136} w={300} h={20} color="#C9BFA8" delay={40} />
        <Block x={350} y={168} w={330} h={20} color="#C9BFA8" delay={43} />
        <Block x={350} y={200} w={240} h={20} color="#C9BFA8" delay={46} />
        {/* button */}
        <div
          style={{
            position: "absolute",
            left: 350,
            top: 250,
            width: 220,
            height: 70,
            borderRadius: 35,
            background: clicked ? C.teal : C.coral,
            transform: `scale(${usePop(50, 10) * (frame >= 86 && frame < 96 ? click : 1)})`,
            transformOrigin: "left center",
          }}
        />
        {/* cards */}
        <Block x={24} y={350} w={220} h={100} color={C.white} delay={58} />
        <Block x={268} y={350} w={220} h={100} color={C.white} delay={62} />
        <Block x={512} y={350} w={220} h={100} color={C.white} delay={66} />
        <Block x={44} y={374} w={52} h={52} r={26} color={C.orange} delay={70} />
        <Block x={288} y={374} w={52} h={52} r={26} color={C.blue} delay={73} />
        <Block x={532} y={374} w={52} h={52} r={26} color={C.coral} delay={76} />
        {/* click ripple */}
        <div
          style={{
            position: "absolute",
            left: 460 - 120 * ripple,
            top: 285 - 120 * ripple,
            width: 240 * ripple,
            height: 240 * ripple,
            borderRadius: "50%",
            border: `8px solid ${C.teal}`,
            opacity: 1 - ripple,
          }}
        />
      </div>
      {/* stand */}
      <div style={{ position: "absolute", left: 350, top: 540, width: 120, height: 90, background: C.navy }} />
      <div style={{ position: "absolute", left: 250, top: 620, width: 320, height: 34, borderRadius: 17, background: C.navy }} />
      {/* cursor */}
      <svg
        viewBox="0 0 24 24"
        width={70}
        height={70}
        style={{ position: "absolute", left: cx, top: cy, opacity: frame > 52 ? 1 : 0, transform: `scale(${click})` }}
      >
        <path d="M3 2 L3 20 L8 15 L11.5 22 L14.5 20.6 L11 14 L18 14 Z" fill={C.white} stroke={C.navy} strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const DesignScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.blue }}>
      <Floater x={1060} y={140} size={80} color={C.yellow} kind="circle" delay={6} />
      <Floater x={1820} y={180} size={70} color={C.white} kind="plus" delay={12} spin={1} />
      <Floater x={1760} y={900} size={100} color={C.teal} kind="ring" delay={16} />
      <Floater x={100} y={120} size={60} color={C.coral} kind="triangle" delay={20} spin={1.2} />
      <Floater x={1060} y={960} size={60} color={C.navy} kind="square" delay={24} />
      <Monitor />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-end", paddingRight: 150 }}>
        <div style={{ width: 760 }}>
          <Headline text="صمّمها" delay={18} color={C.white} size={170} />
          <Headline text="ببساطة ووضوح" delay={28} color={C.yellow} size={110} />
          <Bar delay={46} color={C.white} width={320} style={{ marginTop: 24 }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
