// Renders src/cinema (Three.js) frame-by-frame in headless Chromium, in parallel, and encodes an MP4.
// Usage: node scripts/render-cinema.mjs [--width 3840] [--fps 30] [--workers 4] [--sub 3]
//        [--out output/ai-tool.mp4] [--audio output/cinema-audio.wav]
//        [--preview --times 1,2.5,...]   (PNG stills into output/stills-cinema)
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import http from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const width = Number(opt("--width", 1920));
const fps = Number(opt("--fps", 30));
const workers = Number(opt("--workers", 4));
const sub = Number(opt("--sub", 3));
const out = path.resolve(root, opt("--out", "output/ai-tool.mp4"));
const audio = path.resolve(root, opt("--audio", "output/cinema-audio.wav"));
const tmp = opt("--tmp", fs.mkdtempSync(path.join(os.tmpdir(), "cinema-")));
const range = opt("--range", null);

const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/src/cinema/index.html?w=${width}&sub=${sub}&aa=0`;

const flags = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"];
async function open() {
  const browser = await chromium.launch({ args: flags });
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text()); });
  await page.goto(url);
  await page.evaluate(() => window.ready);
  return { browser, page };
}

if (args.includes("--preview")) {
  const dir = path.join(root, "output/stills-cinema");
  fs.mkdirSync(dir, { recursive: true });
  const { browser, page } = await open();
  for (const t of opt("--times", "0.5,1.5,2.7,3.6,4.8,6.5,7.4,8.6,9.4,10.8,11.8,12.5,13.5,14.5").split(",").map(Number)) {
    const t0 = Date.now();
    const png = await page.evaluate((t) => { window.render(t); return document.getElementById("c").toDataURL("image/png"); }, t);
    fs.writeFileSync(path.join(dir, `t${t.toFixed(2)}.png`), Buffer.from(png.split(",")[1], "base64"));
    console.log(`t=${t} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  await browser.close(); server.close(); process.exit(0);
}

const total = Math.round(15 * fps);
let [from, to] = range ? range.split("-").map(Number) : [0, total - 1];
fs.mkdirSync(tmp, { recursive: true });
console.log("frames dir:", tmp);
const todo = []; for (let f = from; f <= to; f++) if (!fs.existsSync(path.join(tmp, `f${String(f).padStart(4, "0")}.jpg`))) todo.push(f);
let done = 0; const t0 = Date.now();
await Promise.all(Array.from({ length: workers }, async (_, w) => {
  const { browser, page } = await open();
  for (let k = w; k < todo.length; k += workers) {
    const f = todo[k];
    const data = await page.evaluate((t) => { window.render(t); return document.getElementById("c").toDataURL("image/jpeg", 0.94); }, f / fps);
    fs.writeFileSync(path.join(tmp, `f${String(f).padStart(4, "0")}.jpg`), Buffer.from(data.split(",")[1], "base64"));
    done++;
    if (done % 10 === 0) console.log(`${done}/${todo.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await browser.close();
}));
server.close();
if (args.includes("--no-encode")) process.exit(0);

fs.mkdirSync(path.dirname(out), { recursive: true });
const hasAudio = fs.existsSync(audio);
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", path.join(tmp, "f%04d.jpg"), ...(hasAudio ? ["-i", audio] : []),
  "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", String(fps),
  ...(hasAudio ? ["-c:a", "aac", "-b:a", "256k", "-shortest"] : []), out], { stdio: "inherit" });
await new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg " + c)))));
console.log("wrote", path.relative(root, out));
