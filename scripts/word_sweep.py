"""فيديو 10 ثوانٍ: كلمة قصيرة تتلوّن حروفها بلون يدخل من اليمين ولون من اليسار مع مؤثرات.

الاستخدام: python3 scripts/word_sweep.py [الكلمة]   ->  output/word-sweep.mp4
"""
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output" / "word-sweep.mp4"
WORD = sys.argv[1] if len(sys.argv) > 1 else "إبداع"
W, H, FPS, DUR = 1280, 720, 30, 10

# woff2 -> ttf مؤقتاً لأن PIL لا يقرأ woff2
_font = TTFont(ROOT / "assets/fonts/cairo-arabic-900-normal.woff2")
_font.flavor = None
FONT_PATH = Path(tempfile.mkdtemp()) / "cairo900.ttf"
_font.save(FONT_PATH)

ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
u, v = xs / W, ys / H

LEFT_A = np.array([1.00, 0.20, 0.55], np.float32)
LEFT_B = np.array([1.00, 0.70, 0.10], np.float32)
RIGHT_A = np.array([0.10, 0.75, 1.00], np.float32)
RIGHT_B = np.array([0.50, 0.25, 1.00], np.float32)
BG = np.array([0.03, 0.03, 0.07], np.float32)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def ease(x):
    return 1 - (1 - np.clip(x, 0, 1)) ** 3


def fit_size():
    size = 100
    while True:
        f = ImageFont.truetype(str(FONT_PATH), size, layout_engine=ImageFont.Layout.RAQM)
        l, t, r, b = f.getbbox(WORD)
        if r - l > W * 0.72 or size > 600:
            return size - 10
        size += 10


BASE = fit_size()


def text_mask(scale):
    f = ImageFont.truetype(str(FONT_PATH), int(BASE * scale), layout_engine=ImageFont.Layout.RAQM)
    img = Image.new("L", (W, H), 0)
    ImageDraw.Draw(img).text((W / 2, H / 2), WORD, font=f, fill=255, anchor="mm")
    return img


def wobble(m, t, amp):
    """موجة عمودية على الحروف تخمد مع الزمن."""
    if amp < 0.3:
        return m
    shift = (amp * np.sin(xs[0] * 0.03 - t * 9)).astype(int)
    idx = (np.arange(H)[:, None] - shift[None, :]) % H
    return m[idx, np.arange(W)[None, :]]


def wave(t, k):
    return 0.035 * np.sin(v * 9 + t * 2.6 * k) + 0.02 * np.sin(v * 19 - t * 3.4 * k + 1.3)


rng = np.random.default_rng(7)
# شرارات: (جانب، زمن الولادة، y، سرعة x، سرعة y، حجم)
SPARKS = [
    (side, rng.uniform(0.3, 3.6), rng.uniform(0.38, 0.62), rng.uniform(0.05, 0.25),
     rng.uniform(-0.25, 0.25), rng.uniform(2, 5))
    for side in (0, 1) for _ in range(45)
]


def sparks_layer(t, reach):
    img = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(img)
    for side, t0, y0, vx, vy, sz in SPARKS:
        age = t - t0
        if age < 0 or age > 1.4:
            continue
        # الشرارة تولد على الحافة المتحركة لحظة الولادة
        r0 = 0.55 * ease(t0 / 3.5)
        x = r0 - vx * age if side == 0 else 1 - r0 + vx * age
        y = y0 + vy * age
        a = 1 - age / 1.4
        col = LEFT_B if side == 0 else RIGHT_A
        c = tuple(int(255 * k * a) for k in col)
        px, py = x * W, y * H
        d.ellipse((px - sz, py - sz, px + sz, py + sz), fill=c)
    return np.asarray(img.filter(ImageFilter.GaussianBlur(2)), np.float32) / 255 * 1.6


def frame(t):
    leave = smooth((t - 9.2) / 0.8)
    # نبضة تكبير عند الالتقاء (3.5s) ثم استقرار
    pop = np.exp(-((t - 3.6) / 0.25) ** 2) * 0.08
    intro = ease(t / 1.2)
    scale = (0.92 + 0.08 * intro) + pop
    m = text_mask(scale)
    m = wobble(np.asarray(m, np.float32) / 255, t, 14 * np.exp(-max(t - 3.5, 0) * 1.4) * (t > 3.4))
    mpil = Image.fromarray((m * 255).astype(np.uint8))

    # خلفية
    img = np.broadcast_to(BG, (H, W, 3)).copy()
    d = np.sqrt(((u - 0.5) * W / H) ** 2 + (v - 0.5) ** 2)
    img += 0.05 * (0.5 + 0.5 * np.sin(d * 9 - t * 1.6))[..., None] * np.array([0.5, 0.4, 1.0], np.float32)

    # ألوان من اليسار واليمين
    reach = 0.56 * ease(t / 3.5)
    lm = smooth((reach + wave(t, 1) - u) / 0.08 + 0.5)
    rm = smooth((reach + wave(t, -1) - (1 - u)) / 0.08 + 0.5)
    lg = (0.5 + 0.5 * np.sin(v * 4 + u * 3 - t * 2.2))[..., None]
    rg = (0.5 + 0.5 * np.sin(v * 4 - u * 3 + t * 2.2 + 2))[..., None]
    lcol = LEFT_A * (1 - lg) + LEFT_B * lg
    rcol = RIGHT_A * (1 - rg) + RIGHT_B * rg
    fill = np.zeros((H, W, 3), np.float32)
    fill = fill * (1 - lm[..., None]) + lcol * lm[..., None]
    fill = fill * (1 - rm[..., None]) + rcol * rm[..., None]
    both = (lm * rm)[..., None]
    fill += both * 0.35  # ضوء عند منطقة الاختلاط

    # لمعة مائلة تمر على الحروف
    for ts in (4.2, 7.0):
        pos = (t - ts) / 1.3
        band = np.exp(-(((u + v * 0.3) - (pos * 1.6 - 0.3)) / 0.05) ** 2)
        fill += (band * 0.9)[..., None] * (0 < pos < 1)

    # توهّج خلف الحروف بلون الجانبين
    glow = np.asarray(mpil.filter(ImageFilter.GaussianBlur(28)), np.float32) / 255
    gcol = lcol * (1 - u)[..., None] + rcol * u[..., None]
    img += glow[..., None] * gcol * 0.9 * smooth(t / 2.0)

    # الحروف: حدّ باهت قبل وصول اللون، ثم تعبئة كاملة
    edge = np.clip(m - np.asarray(mpil.filter(ImageFilter.MinFilter(5)), np.float32) / 255, 0, 1)
    img += edge[..., None] * 0.25 * (1 - np.clip(lm + rm, 0, 1))[..., None] * intro
    cover = np.clip(lm + rm, 0, 1)[..., None]
    img = img * (1 - m[..., None]) + (fill * cover + 0.12 * (1 - cover)) * m[..., None]

    # شرارات + وميض الالتقاء + حلقة صدمة
    img += sparks_layer(t, reach)
    img += np.exp(-((t - 3.5) / 0.1) ** 2) * 0.30
    r = (t - 3.5) * 0.7
    if 0 < r < 0.9:
        ring = np.exp(-(((d - r) / 0.012) ** 2)) * (1 - r / 0.9)
        img += ring[..., None] * np.array([1, 0.95, 0.9], np.float32) * 0.6

    img *= (1 - 0.35 * smooth((d - 0.45) / 0.5))[..., None]
    img *= smooth(t / 0.4) * (1 - leave)
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
