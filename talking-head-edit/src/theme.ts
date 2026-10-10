export const COLORS = {
  intro: "#8B7CFF",
  claude: "#F0875A",
  chatgpt: "#1FC9A0",
  white: "#F6F7FB",
  muted: "#A9B0CC",
  ink: "#0A0D1C",
};

export const SIDE = {
  claude: { name: "Claude Code", color: COLORS.claude, glow: "rgba(240,135,90,", tag: "أداة البرمجة" },
  chatgpt: { name: "ChatGPT", color: COLORS.chatgpt, glow: "rgba(31,201,160,", tag: "المساعد الذكي" },
} as const;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.min(1, Math.max(0, t))));
  return `rgb(${c.join(",")})`;
};
