// Renders src/motion.html frame-by-frame with headless Chromium and encodes an MP4 with ffmpeg.
// Usage: node scripts/render.mjs [--src src/motion.html] [--fps 30] [--out output/motion.mp4] [--audio output/soundtrack.wav] [--preview]
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const src = path.resolve(root, opt("--src", "src/motion.html"));
const fps = Number(opt("--fps", 30));
const out = path.resolve(root, opt("--out", "output/motion.mp4"));
const audio = path.resolve(root, opt("--audio", "output/soundtrack.wav"));
fs.mkdirSync(path.dirname(out), { recursive: true });

// file access lets pages draw local images onto the canvas without tainting it
const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(src).href);
await page.evaluate(() => window.ready);
const duration = await page.evaluate(() => window.DURATION);
const frames = Math.round(duration * fps);

if (args.includes("--preview")) {
  const dir = path.resolve(root, opt("--stills", path.join("output/stills", path.basename(src, ".html"))));
  fs.mkdirSync(dir, { recursive: true });
  for (const t of (opt("--times", "0.8,2,2.8,4.8,7.8,8.5,11.5")).split(",").map(Number)) {
    const png = await page.evaluate(async t => { await window.render(t); return document.getElementById("c").toDataURL("image/png"); }, t);
    fs.writeFileSync(path.join(dir, `t${t.toFixed(1)}.png`), Buffer.from(png.split(",")[1], "base64"));
  }
  await browser.close();
  process.exit(0);
}

const hasAudio = fs.existsSync(audio);
const ff = spawn("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
  ...(hasAudio ? ["-i", audio] : []),
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  ...(hasAudio ? ["-c:a", "aac", "-b:a", "192k", "-shortest"] : []),
  out,
], { stdio: ["pipe", "inherit", "inherit"] });

for (let f = 0; f < frames; f++) {
  const png = await page.evaluate(async t => { await window.render(t); return document.getElementById("c").toDataURL("image/png"); }, f / fps);
  const buf = Buffer.from(png.split(",")[1], "base64");
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
  if (f % 30 === 0) process.stdout.write(`\rframe ${f}/${frames}`);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on("close", c => c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`))));
await browser.close();
console.log(`\nwrote ${path.relative(root, out)}`);
