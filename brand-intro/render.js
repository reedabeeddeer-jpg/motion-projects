// Renders scene.html frame-by-frame in headless Chromium and encodes an MP4 with ffmpeg.
// Usage: node render.js [--fps 30] [--out out/brand-intro.mp4] [--stills]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const FPS = Number(opt('--fps', 30));
const OUT = path.resolve(__dirname, opt('--out', 'out/brand-intro.mp4'));
const STILLS = args.includes('--stills');

(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.join(__dirname, 'scene.html') + '?capture');
  await page.evaluate(() => window.ready);
  const duration = await page.evaluate(() => window.DURATION);

  const grab = async t => Buffer.from((await page.evaluate(t => {
    window.render(t);
    return document.getElementById('c').toDataURL('image/png');
  }, t)).split(',')[1], 'base64');

  if (STILLS) {
    const dir = path.join(path.dirname(OUT), 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of [2.6, 5.4, 10.4, 14.6, 18.6]) fs.writeFileSync(path.join(dir, `t${t}.png`), await grab(t));
    await browser.close();
    return;
  }

  const audio = path.join(path.dirname(OUT), 'soundtrack.wav');
  execFileSync('python3', [path.join(__dirname, 'soundtrack.py'), audio, String(duration)], { stdio: 'inherit' });

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-i', audio,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });

  const total = Math.round(duration * FPS);
  for (let f = 0; f < total; f++) {
    const buf = await grab(f / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % FPS === 0) process.stdout.write(`\rframe ${f}/${total}`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
  await browser.close();
  console.log(`\nwrote ${OUT}`);
})();
