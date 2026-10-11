"""فيديو 10 ثوانٍ بدون أي نص: ألوان تدخل من اليسار واليمين مع حركات.

الاستخدام: python3 scripts/color_sweep.py   ->  output/color-sweep.mp4
"""
import subprocess
from pathlib import Path

import numpy as np

W, H, FPS, DUR = 960, 540, 30, 10  # يُكبَّر إلى 1080p عند الترميز
OUT = Path(__file__).resolve().parent.parent / "output" / "color-sweep.mp4"

ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
u = xs / W
v = ys / H
aspect = W / H
cx, cy = 0.5, 0.5
dist = np.sqrt(((u - cx) * aspect) ** 2 + (v - cy) ** 2)
ang = np.arctan2(v - cy, (u - cx) * aspect)

LEFT_A = np.array([1.00, 0.20, 0.55], np.float32)   # وردي
LEFT_B = np.array([1.00, 0.65, 0.10], np.float32)   # برتقالي
RIGHT_A = np.array([0.10, 0.75, 1.00], np.float32)  # سماوي
RIGHT_B = np.array([0.45, 0.25, 1.00], np.float32)  # بنفسجي
BG = np.array([0.03, 0.03, 0.07], np.float32)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def ease(x):
    x = np.clip(x, 0, 1)
    return 1 - (1 - x) ** 3


def wave(t, k):
    return (
        0.040 * np.sin(v * 9 + t * 2.6 * k)
        + 0.025 * np.sin(v * 17 - t * 3.4 * k + 1.3)
        + 0.012 * np.sin(v * 31 + t * 5.0 * k)
    )


def frame(t):
    # المرحلة 1 (0-4s): دخول الألوان من الجانبين. 2 (4-8s): اختلاط ودوران. 3 (8-10s): انحسار.
    enter = ease(t / 4.0)
    leave = ease((t - 8.0) / 2.0)
    reach = 0.58 * enter - 0.7 * leave  # أقصى وصول للحافة (نسبة من العرض)
    soft = 0.10

    # حافة اليسار واليمين متموّجة
    left_edge = reach + wave(t, 1.0)
    right_edge = reach + wave(t, -1.0)
    left_m = smooth((left_edge - u) / soft + 0.5)
    right_m = smooth((right_edge - (1 - u)) / soft + 0.5)

    # تدرّج ألوان متحرك داخل كل جانب
    lg = 0.5 + 0.5 * np.sin(v * 5 + u * 3 - t * 1.8)
    rg = 0.5 + 0.5 * np.sin(v * 5 - u * 3 + t * 1.8 + 2.0)
    left_col = LEFT_A * (1 - lg[..., None]) + LEFT_B * lg[..., None]
    right_col = RIGHT_A * (1 - rg[..., None]) + RIGHT_B * rg[..., None]

    img = np.broadcast_to(BG, (H, W, 3)).copy()
    # خلفية: توهّج خفيف يتنفّس
    img += 0.04 * (0.5 + 0.5 * np.sin(dist * 10 - t * 2))[..., None]

    img = img * (1 - left_m[..., None]) + left_col * left_m[..., None]
    img = img * (1 - right_m[..., None]) + right_col * right_m[..., None]

    # عند التقاء الألوان: إضافة (additive) مع دوّامة
    both = left_m * right_m
    swirl = 0.5 + 0.5 * np.sin(ang * 3 + dist * 14 - t * 4.0)
    mix = np.array([1.0, 0.95, 0.9], np.float32)
    img += (both * swirl * 0.55)[..., None] * mix

    # موجات دائرية تنطلق من المركز بعد الالتقاء
    if t > 3.0:
        for i in range(4):
            r = ((t - 3.0) * 0.28 - i * 0.18) % 0.9
            ring = np.exp(-(((dist - r) / 0.012) ** 2))
            fade = np.clip(1 - r / 0.9, 0, 1) * smooth((t - 3.0) / 0.5) * (1 - leave)
            img += (ring * fade * 0.7)[..., None] * mix

    # كرات مضيئة تتحرك
    for i in range(7):
        ph = i * 0.9
        ox = 0.5 + 0.38 * np.sin(t * (0.7 + 0.13 * i) + ph)
        oy = 0.5 + 0.30 * np.cos(t * (0.9 + 0.11 * i) + ph * 1.7)
        d2 = ((u - ox) * aspect) ** 2 + (v - oy) ** 2
        glow = np.exp(-d2 / (0.004 + 0.0015 * i)) * (0.5 + 0.5 * np.sin(t * 3 + i))
        col = LEFT_B if i % 2 == 0 else RIGHT_A
        img += (glow * 0.8 * smooth(t / 1.5) * (1 - leave * 0.8))[..., None] * col

    # نبضة ضوء خفيفة (flash) لحظة الالتقاء
    flash = np.exp(-((t - 3.6) / 0.12) ** 2) * 0.35
    img += flash

    # تعتيم الحواف
    vig = 1 - 0.35 * smooth((dist - 0.4) / 0.6)
    img *= vig[..., None]

    # fade in/out ناعم
    img *= smooth(t / 0.4) * smooth((DUR - t) / 0.4)
    return (np.clip(img, 0, 1) * 255).astype(np.uint8)


def main():
    OUT.parent.mkdir(exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-vf", "scale=1920:1080:flags=bicubic,noise=alls=6:allf=t",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-movflags", "+faststart",
        str(OUT),
    ]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for n in range(FPS * DUR):
        p.stdin.write(frame(n / FPS).tobytes())
    p.stdin.close()
    p.wait()
    print("saved", OUT)


if __name__ == "__main__":
    main()
