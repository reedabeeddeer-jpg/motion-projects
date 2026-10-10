import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "./fonts";
import { Icon } from "./Icons";
import { clamp, COLORS, mixHex, SIDE } from "./theme";
import type { Caption, Edit, MotionEvent, Point, Side } from "./types";

type Props = { edit: Edit };

const FACE_Y = 0.28; // zoom origin: roughly the face, as a fraction of frame height
const SHIFT = 190; // how far he slides aside to make room for a panel
// In the footage he points to screen-left when saying "Claude Code" and to screen-right for "ChatGPT",
// so each tool's cards live on the side he gestures to.
const SCREEN: Record<Side, "left" | "right"> = { claude: "left", chatgpt: "right" };

/* ------------------------------------------------------------------ helpers */

const accentAt = (f: number, e: Edit) => {
  const { claude, chatgpt } = e.sections;
  if (f < claude) return mixHex(COLORS.intro, COLORS.claude, (f - (claude - 15)) / 15);
  if (f < chatgpt) return mixHex(COLORS.claude, COLORS.chatgpt, (f - (chatgpt - 15)) / 15);
  return COLORS.chatgpt;
};

const usePersonTransform = (e: Edit) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = Math.max(0, e.cuts.findIndex((c) => frame >= c.from && frame < c.to));
  const cut = e.cuts[idx] ?? e.cuts[e.cuts.length - 1];
  // alternate framing on every jump cut so the edits read as intentional punch-ins
  const base = [1.0, 1.13, 1.06][idx % 3];
  const push = interpolate(frame, [cut.from, cut.to], [0, 0.02], clamp);
  const intro = interpolate(spring({ frame, fps, config: { damping: 200 }, durationInFrames: 25 }), [0, 1], [0.12, 0]);
  const toClaude = spring({ frame: frame - e.sections.claude, fps, config: { damping: 18, mass: 0.9 } });
  const toGpt = spring({ frame: frame - e.sections.chatgpt, fps, config: { damping: 18, mass: 0.9 } });
  const tx = SHIFT * toClaude - 2 * SHIFT * toGpt;
  const out = spring({ frame: frame - e.speechFrames, fps, config: { damping: 200 }, durationInFrames: 20 });
  const scale = (base + push + intro) * (1 - 0.25 * out);
  return { scale, tx: tx * (1 - out), ty: 220 * out, opacity: 1 - out, frame };
};

const toScreen = (x: number, y: number, t: { scale: number; tx: number; ty: number }, w: number, h: number) => ({
  x: w / 2 + (x * w - w / 2) * t.scale + t.tx,
  y: h * FACE_Y + (y * h - h * FACE_Y) * t.scale + t.ty,
});

/* -------------------------------------------------------------- background */

const Background: React.FC<{ e: Edit }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const accent = accentAt(frame, e);
  const b1x = 30 + Math.sin(frame / 60) * 10;
  const b1y = 35 + Math.cos(frame / 75) * 8;
  const b2x = 72 + Math.cos(frame / 70) * 10;
  const b2y = 65 + Math.sin(frame / 55) * 8;
  const gridShift = (frame * 1.2) % 80;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #070914 0%, #10122A 55%, #0A1426 100%)" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${b1x}% ${b1y}%, ${accent} 0%, transparent 42%),
                       radial-gradient(circle at ${b2x}% ${b2y}%, #3A2D8F 0%, transparent 45%)`,
          opacity: 0.38,
          filter: "blur(40px)",
        }}
      />
      {/* perspective grid floor */}
      <div
        style={{
          position: "absolute",
          left: -width * 0.5,
          right: -width * 0.5,
          top: height * 0.55,
          height: height * 0.9,
          transform: "perspective(700px) rotateX(62deg)",
          transformOrigin: "50% 0%",
          backgroundImage: `linear-gradient(${accent} 2px, transparent 2px), linear-gradient(90deg, ${accent} 2px, transparent 2px)`,
          backgroundSize: "80px 80px",
          backgroundPosition: `0 ${gridShift}px`,
          opacity: 0.16,
          maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 60%, transparent 100%)",
        }}
      />
      {/* floating dust */}
      {new Array(36).fill(0).map((_, i) => {
        const x = random(`x${i}`) * width;
        const speed = 0.3 + random(`s${i}`) * 0.8;
        const y = (height + 40 - ((frame * speed + random(`y${i}`) * height) % (height + 80))) - 40;
        const r = 2 + random(`r${i}`) * 4;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + Math.sin(frame / 40 + i) * 12,
              top: y,
              width: r,
              height: r,
              borderRadius: r,
              background: i % 3 === 0 ? accent : "#ffffff",
              opacity: 0.12 + random(`o${i}`) * 0.3,
              boxShadow: `0 0 ${r * 3}px ${accent}`,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,0.6) 100%)" }} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ person */

const Person: React.FC<{ e: Edit }> = ({ e }) => {
  const t = usePersonTransform(e);
  const { width, height } = useVideoConfig();
  const accent = accentAt(t.frame, e);
  const head = toScreen(0.5, 0.42, t, width, height);
  return (
    <AbsoluteFill style={{ opacity: t.opacity }}>
      {/* back light */}
      <div
        style={{
          position: "absolute",
          left: head.x - 520,
          top: head.y - 420,
          width: 1040,
          height: 1040,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, transparent 62%)`,
          opacity: 0.32,
          filter: "blur(20px)",
        }}
      />
      <AbsoluteFill
        style={{
          transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.scale})`,
          transformOrigin: `50% ${FACE_Y * 100}%`,
        }}
      >
        <OffthreadVideo
          src={staticFile("person.webm")}
          transparent
          muted
          style={{
            width: "100%",
            height: "100%",
            filter: "drop-shadow(0 0 1.5px rgba(255,255,255,0.45)) drop-shadow(0 30px 50px rgba(0,0,0,0.55))",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- motion fx */

// A gesture made while naming a tool takes that tool's colour.
const gestureColor = (f: number, e: Edit) => {
  const near = e.captions.flatMap((c) => c.words).filter((w) => Math.abs(w.from - f) <= 12);
  if (near.some((w) => w.text.startsWith("Claude"))) return COLORS.claude;
  if (near.some((w) => w.text.startsWith("ChatGPT"))) return COLORS.chatgpt;
  return accentAt(f, e);
};

const Burst: React.FC<{ ev: MotionEvent; e: Edit }> = ({ ev, e }) => {
  const frame = useCurrentFrame(); // local to the Sequence
  const { width, height } = useVideoConfig();
  // anchor to where the person is drawn at the moment of the gesture
  const t = usePersonTransformAt(e, ev.frame);
  const p = toScreen(ev.x, ev.y, t, width, height);
  const accent = gestureColor(ev.frame, e);
  const life = interpolate(frame, [0, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const fade = interpolate(frame, [10, 24], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: p.x, top: p.y, opacity: fade }}>
      {[0, 1].map((k) => {
        const r = 40 + life * (150 + k * 90);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: -r,
              top: -r,
              width: 2 * r,
              height: 2 * r,
              borderRadius: "50%",
              border: `${5 - k * 2}px solid ${k ? "#fff" : accent}`,
              boxShadow: `0 0 24px ${accent}`,
            }}
          />
        );
      })}
      {new Array(10).fill(0).map((_, i) => {
        const a = (i / 10) * Math.PI * 2 + random(`b${ev.frame}${i}`) * 0.5;
        const d0 = 60 + life * 120;
        const len = 26 * (1 - life) + 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: Math.cos(a) * d0,
              top: Math.sin(a) * d0,
              width: len,
              height: 5,
              borderRadius: 3,
              background: i % 2 ? "#fff" : accent,
              transform: `translate(-50%,-50%) rotate(${a}rad)`,
            }}
          />
        );
      })}
    </div>
  );
};

// Same maths as usePersonTransform but for an arbitrary frame (used to pin bursts).
const usePersonTransformAt = (e: Edit, f: number) => {
  const { fps } = useVideoConfig();
  const idx = Math.max(0, e.cuts.findIndex((c) => f >= c.from && f < c.to));
  const cut = e.cuts[idx];
  const base = [1.0, 1.13, 1.06][idx % 3];
  const push = interpolate(f, [cut.from, cut.to], [0, 0.02], clamp);
  const toClaude = spring({ frame: f - e.sections.claude, fps, config: { damping: 18, mass: 0.9 } });
  const toGpt = spring({ frame: f - e.sections.chatgpt, fps, config: { damping: 18, mass: 0.9 } });
  return { scale: base + push, tx: SHIFT * toClaude - 2 * SHIFT * toGpt, ty: 0 };
};

/* ------------------------------------------------------------------ panels */

const Brand: React.FC<{ side: Side; size?: number }> = ({ side, size = 64 }) => {
  const c = SIDE[side].color;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: `linear-gradient(135deg, ${c}, ${c}99)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 8px 30px ${SIDE[side].glow}0.55)`,
      }}
    >
      <Icon name={side === "claude" ? "spark" : "chat"} color="#fff" size={size * 0.62} />
    </div>
  );
};

const PointCard: React.FC<{ p: Point; at: number; active: boolean }> = ({ p, at, active }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 15, mass: 0.7 } });
  const draw = interpolate(frame - at, [4, 26], [0, 1], clamp);
  const sweep = interpolate(frame - at, [6, 28], [-120, 220], clamp);
  const c = SIDE[p.side].color;
  const dir = SCREEN[p.side] === "right" ? 1 : -1;
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 18,
        padding: "16px 20px",
        borderRadius: 22,
        background: active ? "rgba(20,22,44,0.82)" : "rgba(20,22,44,0.6)",
        border: `2px solid ${active ? c : "rgba(255,255,255,0.10)"}`,
        boxShadow: active ? `0 10px 40px ${SIDE[p.side].glow}0.35)` : "0 10px 30px rgba(0,0,0,0.3)",
        transform: `translateX(${(1 - s) * 140 * dir}px) scale(${0.85 + 0.15 * s})`,
        opacity: s * (active ? 1 : 0.78),
        filter: `blur(${(1 - s) * 8}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(100deg, transparent ${sweep - 30}%, rgba(255,255,255,0.18) ${sweep}%, transparent ${sweep + 30}%)`,
        }}
      />
      <div
        style={{
          flex: "0 0 auto",
          width: 54,
          height: 54,
          borderRadius: 27,
          background: c,
          color: COLORS.ink,
          fontWeight: 900,
          fontSize: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${spring({ frame: frame - at - 6, fps, config: { damping: 9 } })})`,
        }}
      >
        {p.n}
      </div>
      <div style={{ flex: 1, textAlign: "right", direction: "rtl" }}>
        <div style={{ color: COLORS.white, fontWeight: 700, fontSize: 31, lineHeight: 1.3 }}>{p.ar}</div>
        <div style={{ color: COLORS.muted, fontWeight: 400, fontSize: 20, direction: "ltr", textAlign: "right" }}>{p.en}</div>
      </div>
      <div style={{ flex: "0 0 auto" }}>
        <Icon name={p.icon} color={c} size={50} progress={draw} />
      </div>
    </div>
  );
};

const Panel: React.FC<{ e: Edit; side: Side; start: number; end: number; outro?: boolean }> = ({
  e,
  side,
  start,
  end,
  outro,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - start, fps, config: { damping: 16 } });
  const leave = spring({ frame: frame - end, fps, config: { damping: 200 }, durationInFrames: 18 });
  const v = enter * (1 - leave);
  if (frame < start || v < 0.001) return null;
  const pts = e.points.filter((p) => p.side === side);
  const dir = SCREEN[side] === "right" ? 1 : -1;
  const meta = SIDE[side];
  return (
    <div
      style={{
        position: "absolute",
        top: outro ? 210 : 130,
        [SCREEN[side]]: outro ? 110 : 60,
        width: outro ? 760 : 560,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transform: `translateX(${(1 - v) * 260 * dir}px)`,
        opacity: v,
      }}
    >
      <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 18, marginBottom: 6 }}>
        <Brand side={side} />
        <div style={{ textAlign: "right" }}>
          <div style={{ color: meta.color, fontWeight: 900, fontSize: 46, lineHeight: 1.05, direction: "ltr" }}>{meta.name}</div>
          <div style={{ color: COLORS.muted, fontWeight: 700, fontSize: 22, direction: "rtl" }}>{meta.tag}</div>
        </div>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: `linear-gradient(${dir > 0 ? "270deg" : "90deg"}, ${meta.color}, transparent)`,
          width: `${interpolate(frame - start, [5, 30], [0, 100], clamp)}%`,
          alignSelf: SCREEN[side] === "right" ? "flex-end" : "flex-start",
        }}
      />
      {pts.map((p, i) => {
        const at = outro ? start + 8 + i * 6 : p.from;
        const next = pts[i + 1];
        const active = outro || (frame >= p.from && (!next || frame < next.from));
        return frame >= at ? <PointCard key={p.n} p={p} at={at} active={active} /> : null;
      })}
    </div>
  );
};

/* ----------------------------------------------------------------- titles */

const Greeting: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 6, fps, config: { damping: 12 } });
  const out = interpolate(frame, [130, 150], [1, 0], clamp);
  const wave = Math.sin(frame / 4) * 14 * interpolate(frame, [6, 60], [1, 0.2], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 90,
        right: 120,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 30px",
        borderRadius: 999,
        background: "rgba(139,124,255,0.18)",
        border: "2px solid rgba(139,124,255,0.6)",
        backdropFilter: "blur(6px)",
        transform: `scale(${s}) rotate(${(1 - s) * -8}deg)`,
        opacity: out,
        direction: "rtl",
      }}
    >
      <div style={{ transform: `rotate(${wave}deg)`, transformOrigin: "70% 90%" }}>
        <Icon name="spark" color={COLORS.intro} size={44} />
      </div>
      <span style={{ color: COLORS.white, fontWeight: 900, fontSize: 40 }}>أهلاً بكم</span>
    </div>
  );
};

const Versus: React.FC<{ e: Edit }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = e.sections.versus;
  const end = e.sections.claude;
  if (frame < start - 2 || frame > end + 20) return null;
  const out = interpolate(frame, [end - 4, end + 12], [1, 0], clamp);
  const card = (side: Side, delay: number) => {
    const s = spring({ frame: frame - start - delay, fps, config: { damping: 13 } });
    const dir = SCREEN[side] === "right" ? 1 : -1;
    return (
      <div
        style={{
          position: "absolute",
          top: 300,
          [SCREEN[side]]: 90,
          display: "flex",
          flexDirection: SCREEN[side] === "right" ? "row-reverse" : "row",
          alignItems: "center",
          gap: 20,
          padding: "22px 34px",
          borderRadius: 30,
          background: "rgba(16,18,38,0.85)",
          border: `3px solid ${SIDE[side].color}`,
          boxShadow: `0 0 60px ${SIDE[side].glow}0.45)`,
          transform: `translateX(${(1 - s) * 420 * dir}px) rotate(${(1 - s) * 10 * dir}deg)`,
          opacity: out,
        }}
      >
        <Brand side={side} size={78} />
        <span style={{ color: COLORS.white, fontWeight: 900, fontSize: 56 }}>{SIDE[side].name}</span>
      </div>
    );
  };
  const vs = spring({ frame: frame - start - 16, fps, config: { damping: 8, mass: 0.6 } });
  const shake = frame - start - 16 < 10 && frame > start + 16 ? Math.sin(frame * 3) * 6 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      {card("claude", 0)}
      {card("chatgpt", 7)}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 640,
          transform: `translate(-50%,-50%) scale(${vs * 1.0}) rotate(${(1 - vs) * 30}deg)`,
          opacity: out,
          fontWeight: 900,
          fontSize: 150,
          fontStyle: "italic",
          letterSpacing: -4,
          background: `linear-gradient(90deg, ${COLORS.claude}, #fff 50%, ${COLORS.chatgpt})`,
          WebkitBackgroundClip: "text",
          color: "transparent",
          filter: "drop-shadow(0 0 30px rgba(255,255,255,0.45)) drop-shadow(0 10px 20px rgba(0,0,0,0.6))",
        }}
      >
        VS
      </div>
    </AbsoluteFill>
  );
};

const LightSweep: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 16], [-60, 160], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(105deg, transparent ${x - 25}%, ${color}55 ${x - 6}%, rgba(255,255,255,0.35) ${x}%, ${color}55 ${x + 6}%, transparent ${x + 25}%)`,
        mixBlendMode: "screen",
      }}
    />
  );
};

const SectionTag: React.FC<{ side: Side; label: string }> = ({ side, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14 } });
  const out = interpolate(frame, [70, 85], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 34,
        left: "50%",
        transform: `translate(-50%, ${(1 - s) * -80}px)`,
        opacity: out,
        padding: "8px 28px",
        borderRadius: 999,
        background: SIDE[side].color,
        color: COLORS.ink,
        fontWeight: 900,
        fontSize: 28,
        direction: "rtl",
        boxShadow: `0 8px 30px ${SIDE[side].glow}0.5)`,
      }}
    >
      {label}
    </div>
  );
};

/* --------------------------------------------------------------- captions */

const isLatin = (s: string) => /^[A-Za-z]/.test(s);

const CaptionView: React.FC<{ c: Caption; accent: string }> = ({ c, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - c.from, fps, config: { damping: 18 } });
  const out = interpolate(frame, [c.to - 5, c.to], [1, 0], clamp);
  // group consecutive Latin words so "Claude Code" keeps its LTR order inside the RTL line
  const groups: { latin: boolean; words: typeof c.words }[] = [];
  for (const w of c.words) {
    const l = isLatin(w.text);
    const last = groups[groups.length - 1];
    if (last && last.latin && l) last.words.push(w);
    else groups.push({ latin: l, words: [w] });
  }
  const word = (w: (typeof c.words)[number], i: number) => {
    const on = frame >= w.from && frame < w.to + 2;
    const said = frame >= w.from;
    const pop = spring({ frame: frame - w.from, fps, config: { damping: 10, mass: 0.4 } });
    return (
      <span
        key={i}
        style={{
          display: "inline-block",
          padding: "0 12px",
          margin: "0 5px",
          borderRadius: 12,
          color: on ? COLORS.ink : said ? COLORS.white : "rgba(246,247,251,0.55)",
          background: on ? accent : "transparent",
          transform: `scale(${on ? 1 + 0.08 * pop : 1}) translateY(${on ? -3 : 0}px)`,
        }}
      >
        {w.text}
      </span>
    );
  };
  return (
    <div
      style={{
        position: "absolute",
        bottom: 46,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: s * out,
        transform: `translateY(${(1 - s) * 40}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          padding: "14px 34px 16px",
          borderRadius: 26,
          background: "rgba(8,10,24,0.72)",
          border: "1.5px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
          textAlign: "center",
        }}
      >
        <div style={{ direction: "rtl", fontSize: 50, fontWeight: 900, lineHeight: 1.35 }}>
          {groups.map((g, gi) =>
            g.latin ? (
              <span key={gi} style={{ direction: "ltr", unicodeBidi: "isolate", display: "inline-block" }}>
                {g.words.map(word)}
              </span>
            ) : (
              g.words.map((w, i) => word(w, gi * 100 + i))
            ),
          )}
        </div>
        <div style={{ direction: "ltr", fontSize: 28, fontWeight: 700, color: "#C9CEE6", marginTop: 2 }}>{c.en}</div>
      </div>
    </div>
  );
};

const Captions: React.FC<{ e: Edit }> = ({ e }) => {
  const frame = useCurrentFrame();
  const c = e.captions.find((k) => frame >= k.from && frame < k.to);
  return c ? <CaptionView c={c} accent={accentAt(frame, e)} /> : null;
};

/* ------------------------------------------------------------------ outro */

const Outro: React.FC<{ e: Edit }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 0; // rendered inside a Sequence that begins at speechFrames
  const title = spring({ frame: frame - start - 4, fps, config: { damping: 14 } });
  const cta = spring({ frame: frame - start - 40, fps, config: { damping: 12 } });
  const vs = spring({ frame: frame - start - 18, fps, config: { damping: 8 } });
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 70,
          width: "100%",
          textAlign: "center",
          fontWeight: 900,
          fontSize: 66,
          color: COLORS.white,
          direction: "ltr",
          opacity: title,
          transform: `translateY(${(1 - title) * -60}px)`,
        }}
      >
        <span style={{ color: COLORS.claude }}>Claude Code</span>
        <span style={{ color: COLORS.muted, margin: "0 28px", fontStyle: "italic" }}>vs</span>
        <span style={{ color: COLORS.chatgpt }}>ChatGPT</span>
      </div>
      <Panel e={e} side="claude" start={start + 6} end={1e9} outro />
      <Panel e={e} side="chatgpt" start={start + 12} end={1e9} outro />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 520,
          width: 120,
          height: 120,
          borderRadius: 60,
          transform: `translate(-50%,-50%) scale(${vs})`,
          background: `linear-gradient(135deg, ${COLORS.claude}, ${COLORS.chatgpt})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 900,
          fontSize: 54,
          fontStyle: "italic",
          boxShadow: "0 0 60px rgba(255,255,255,0.3)",
        }}
      >
        VS
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 70,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          opacity: cta,
          transform: `scale(${0.8 + 0.2 * cta})`,
        }}
      >
        <div
          style={{
            padding: "16px 40px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            border: "2px solid rgba(255,255,255,0.25)",
            color: COLORS.white,
            fontWeight: 700,
            fontSize: 36,
            direction: "rtl",
          }}
        >
          أيهما تفضّل؟ شاركنا رأيك بالتعليقات
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Progress: React.FC<{ e: Edit }> = ({ e }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        height: 6,
        width: `${(frame / e.durationInFrames) * 100}%`,
        background: `linear-gradient(270deg, ${accentAt(frame, e)}, #fff)`,
        boxShadow: `0 0 12px ${accentAt(frame, e)}`,
      }}
    />
  );
};

/* ------------------------------------------------------------------ audio */

const Sfx: React.FC<{ at: number; src: string; volume: number }> = ({ at, src, volume }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={60}>
    <Audio src={staticFile(src)} volume={volume} />
  </Sequence>
);

const Sound: React.FC<{ e: Edit }> = ({ e }) => {
  const s = e.sections;
  return (
    <>
      <Audio src={staticFile("voice.wav")} />
      <Audio
        src={staticFile("music.wav")}
        volume={(f) => interpolate(f, [0, 20, e.speechFrames, e.speechFrames + 20], [0, 0.11, 0.11, 0.38], clamp)}
      />
      <Sfx at={s.versus - 3} src="whoosh.wav" volume={0.45} />
      <Sfx at={s.versus + 14} src="impact.wav" volume={0.5} />
      <Sfx at={s.claude - 4} src="whoosh.wav" volume={0.45} />
      <Sfx at={s.chatgpt - 4} src="whoosh.wav" volume={0.45} />
      <Sfx at={e.speechFrames} src="whoosh.wav" volume={0.5} />
      <Sfx at={e.speechFrames + 16} src="impact.wav" volume={0.4} />
      {e.points.map((p, i) => (
        <Sfx key={`p${i}`} at={p.from + 4} src="pop.wav" volume={0.22} />
      ))}
      {e.motion.map((m, i) => (
        <Sfx key={`m${i}`} at={m.frame - 2} src="whoosh.wav" volume={0.22} />
      ))}
    </>
  );
};

/* ------------------------------------------------------------------- main */

export const TalkingHead: React.FC<Props> = ({ edit: e }) => {
  const s = e.sections;
  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: COLORS.ink }}>
      <Background e={e} />
      <Person e={e} />
      <Sequence durationInFrames={160}>
        <Greeting />
      </Sequence>
      <Versus e={e} />
      <Panel e={e} side="claude" start={s.claude + 6} end={s.chatgpt} />
      <Panel e={e} side="chatgpt" start={s.chatgpt + 6} end={e.speechFrames} />
      <Sequence from={s.claude} durationInFrames={90}>
        <SectionTag side="claude" label="الجزء الأول: Claude Code" />
      </Sequence>
      <Sequence from={s.chatgpt} durationInFrames={90}>
        <SectionTag side="chatgpt" label="الجزء الثاني: ChatGPT" />
      </Sequence>
      {e.motion.map((m) => (
        <Sequence key={m.frame} from={m.frame - 3} durationInFrames={26}>
          <Burst ev={m} e={e} />
        </Sequence>
      ))}
      <Sequence from={s.claude - 4} durationInFrames={18}>
        <LightSweep color={COLORS.claude} />
      </Sequence>
      <Sequence from={s.chatgpt - 4} durationInFrames={18}>
        <LightSweep color={COLORS.chatgpt} />
      </Sequence>
      <Sequence from={e.speechFrames - 2} durationInFrames={18}>
        <LightSweep color="#ffffff" />
      </Sequence>
      <Captions e={e} />
      <Sequence from={e.speechFrames}>
        <Outro e={e} />
      </Sequence>
      <Progress e={e} />
      <Sound e={e} />
    </AbsoluteFill>
  );
};
