"""فيديو 10 ثوانٍ: عدة كلمات تظهر تباعاً (من اليمين لليسار) ويدخل لون من اليمين ولون من اليسار داخل حروف كل كلمة.

الاستخدام: python3 scripts/words_sweep.py [كلمة1 كلمة2 ...]   ->  output/words-sweep.mp4
"""
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output" / "words-sweep.mp4"
WORDS = sys.argv[1:] or ["ألوان", "وحركة", "وإبداع"]
W, H, FPS, DUR = 1280, 720, 30, 10
STAGGER = 1.4   # الفارق بين ظهور كل كلمة والتي بعدها
SWEEP = 2.0     # زمن دخول اللونين حتى يلتقيا داخل الكلمة
PAD = 140

_font = TTFont(ROOT / "assets/fonts/cairo-arabic-900-normal.woff2")
_font.flavor = None
FONT_PATH = Path(tempfile.mkdtemp()) / "cairo900.ttf"
_font.save(FONT_PATH)


def load(size):
    return ImageFont.truetype(str(FONT_PATH), int(size), layout_engine=ImageFont.Layout.RAQM)


def measure(size):
    f = load(size)
    ws = [f.getbbox(w)[2] - f.getbbox(w)[0] for w in WORDS]
    return ws, int(size * 0.28)


def fit_size():
    size = 60
    while size < 320:
        ws, gap = measure(size + 10)
        if sum(ws) + gap * (len(WORDS) - 1) > W * 0.86:
            break
        size += 10
    return size


BASE = fit_size()
WIDTHS, GAP = measure(BASE)
TOTAL = sum(WIDTHS) + GAP * (len(WORDS) - 1)
# الكلمة الأولى في أقصى اليمين
CENTERS = []
x = W / 2 + TOTAL / 2
for w in WIDTHS:
    CENTERS.append(x - w / 2)
    x -= w + GAP
CY = H / 2
HEIGHT = int(BASE * 1.6) + 240

YS, XS = np.mgrid[0:H, 0:W].astype(np.float32)
U, V = XS / W, YS / H

LEFT_A = np.array([1.00, 0.20, 0.55], np.float32)
LEFT_B = np.array([1.00, 0.70, 0.10], np.float32)
RIGHT_A = np.array([0.10, 0.75, 1.00], np.float32)
RIGHT_B = np.array([0.50, 0.25, 1.00], np.float32)
BG = np.array([0.03, 0.03, 0.07], np.float32)
WHITE = np.array([1, 0.95, 0.9], np.float32)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def ease(x):
    return 1 - (1 - np.clip(x, 0, 1)) ** 3


rng = np.random.default_rng(7)
SPARKS = [
    [(side, rng.uniform(0.1, SWEEP), rng.uniform(-0.4, 0.4), rng.uniform(0.02, 0.12),
      rng.uniform(-0.25, 0.25), rng.uniform(2, 4.5))
     for side in (0, 1) for _ in range(28)]
    for _ in WORDS
]


def draw_sparks(d, i, tl):
    for side, t0, y0, vx, vy, sz in SPARKS[i]:
        age = tl - t0
        if age < 0 or age > 1.2:
            continue
        r0 = 0.5 * ease(t0 / SWEEP)  # موضع الحافة لحظة الولادة (نسبة من عرض الكلمة)
        wx0 = CENTERS[i] - WIDTHS[i] / 2
        px = wx0 + WIDTHS[i] * (r0 - vx * age if side == 0 else 1 - r0 + vx * age)
        py = CY + y0 * BASE + vy * age * 200
        a = 1 - age / 1.2
        col = LEFT_B if side == 0 else RIGHT_A
        d.ellipse((px - sz, py - sz, px + sz, py + sz), fill=tuple(int(255 * k * a) for k in col))


def render_word(img, i, t):
    tl = t - i * STAGGER
    if tl < 0:
        return
    w, cx = WIDTHS[i], CENTERS[i]
    x0 = int(max(0, cx - w / 2 - PAD))
    x1 = int(min(W, cx + w / 2 + PAD))
    y0 = int(CY - HEIGHT / 2)
    y1 = int(CY + HEIGHT / 2)
    cw, ch = x1 - x0, y1 - y0

    intro = ease(tl / 0.5)
    pop = np.exp(-((tl - SWEEP) / 0.22) ** 2) * 0.09
    scale = 0.8 + 0.2 * intro + pop

    tmp = Image.new("L", (cw, ch), 0)
    ImageDraw.Draw(tmp).text((cx - x0, ch / 2), WORDS[i], font=load(BASE * scale), fill=255, anchor="mm")
    m = np.asarray(tmp, np.float32) / 255

    # تموّج عمودي يخمد بعد التقاء اللونين
    if tl > SWEEP - 0.1:
        amp = 12 * np.exp(-(tl - SWEEP) * 1.5)
        shift = (amp * np.sin(np.arange(cw) * 0.035 - tl * 9)).astype(int)
        m = m[(np.arange(ch)[:, None] - shift[None, :]) % ch, np.arange(cw)[None, :]]
    mpil = Image.fromarray((m * 255).astype(np.uint8))

    u = U[y0:y1, x0:x1]
    v = V[y0:y1, x0:x1]
    wu = (XS[y0:y1, x0:x1] - (cx - w / 2)) / w   # إحداثي أفقي داخل الكلمة 0..1

    reach = 0.56 * ease(tl / SWEEP)
    wav = lambda k: 0.04 * np.sin(v * 9 + t * 2.6 * k) + 0.02 * np.sin(v * 19 - t * 3.4 * k + 1.3)
    lm = smooth((reach + wav(1) - wu) / 0.10 + 0.5)
    rm = smooth((reach + wav(-1) - (1 - wu)) / 0.10 + 0.5)
    lg = (0.5 + 0.5 * np.sin(v * 5 + u * 4 - t * 2.2))[..., None]
    rg = (0.5 + 0.5 * np.sin(v * 5 - u * 4 + t * 2.2 + 2))[..., None]
    lcol = LEFT_A * (1 - lg) + LEFT_B * lg
    rcol = RIGHT_A * (1 - rg) + RIGHT_B * rg
    fill = lcol * lm[..., None]
    fill = fill * (1 - rm[..., None]) + rcol * rm[..., None]
    fill += (lm * rm)[..., None] * 0.35

    # لمعة تمر على كل الكلمات مرة بعد اكتمالها
    pos = (t - 6.2) / 1.6
    if 0 < pos < 1:
        fill += (np.exp(-(((u + v * 0.3) - (pos * 1.6 - 0.3)) / 0.05) ** 2) * 0.9)[..., None]

    cover = np.clip(lm + rm, 0, 1)[..., None]
    region = img[y0:y1, x0:x1]

    glow = np.asarray(mpil.filter(ImageFilter.GaussianBlur(26)), np.float32) / 255
    gcol = lcol * (1 - wu)[..., None] + rcol * wu[..., None]
    region += glow[..., None] * gcol * 0.9 * intro

    edge = np.clip(m - np.asarray(mpil.filter(ImageFilter.MinFilter(5)), np.float32) / 255, 0, 1)
    region += edge[..., None] * 0.25 * (1 - cover) * intro
    region[:] = region * (1 - m[..., None]) + (fill * cover + 0.12 * (1 - cover)) * m[..., None]

    # وميض + حلقة صدمة عند التقاء اللونين
    flash = np.exp(-((tl - SWEEP) / 0.1) ** 2) * 0.28
    region += flash * m[..., None]


def frame(t):
    d = np.sqrt(((U - 0.5) * W / H) ** 2 + (V - 0.5) ** 2)
    img = np.broadcast_to(BG, (H, W, 3)).copy()
    img += 0.05 * (0.5 + 0.5 * np.sin(d * 9 - t * 1.6))[..., None] * np.array([0.5, 0.4, 1.0], np.float32)

    for i in range(len(WORDS)):
        render_word(img, i, t)

    for i in range(len(WORDS)):
        r = (t - i * STAGGER - SWEEP) * 260
        if 0 < r < 360:
            dd = np.sqrt((XS - CENTERS[i]) ** 2 + (YS - CY) ** 2)
            img += (np.exp(-(((dd - r) / 5) ** 2)) * (1 - r / 360))[..., None] * WHITE * 0.6

    sp = Image.new("RGB", (W, H), (0, 0, 0))
    sd = ImageDraw.Draw(sp)
    for i in range(len(WORDS)):
        draw_sparks(sd, i, t - i * STAGGER)
    img += np.asarray(sp.filter(ImageFilter.GaussianBlur(2)), np.float32) / 255 * 1.6

    img *= (1 - 0.35 * smooth((d - 0.45) / 0.5))[..., None]
    img *= smooth(t / 0.4) * (1 - smooth((t - 9.2) / 0.8))
    return (np.clip(img, 0, 1) * 255).astype(np.uint8)


def main():
    OUT.parent.mkdir(exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-vf", "scale=1920:1080:flags=bicubic",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", str(OUT),
    ]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for n in range(FPS * DUR):
        p.stdin.write(frame(n / FPS).tobytes())
    p.stdin.close()
    p.wait()
    print("saved", OUT)


if __name__ == "__main__":
    main()
