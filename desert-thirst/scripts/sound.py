"""Ambient sound for the desert short (22 s): wind, sand footsteps, heartbeat while thirsty,
shimmer when the lake appears, water splashes while drinking, and a warm pad at the end.

Writes public/audio/sound.wav. Beat frames mirror src/timeline.ts.
"""
import math
import wave
from pathlib import Path

import numpy as np

SR, FPS, TOTAL = 44100, 30, 660
SLOW, STOP, POV, POV_END, RUN_END, DRINK_END, PRAISE = 170, 250, 300, 390, 450, 560, 575
OUT = Path(__file__).resolve().parent.parent / "public" / "audio" / "sound.wav"
n = int(SR * TOTAL / FPS)
L = np.zeros(n)
R = np.zeros(n)
rng = np.random.default_rng(5)


def speed(f):
    if f < SLOW:
        return 4
    if f < STOP:
        return 4 * (1 - (f - SLOW) / (STOP - SLOW)) ** 1.5
    if f < POV_END:
        return 0
    if f < RUN_END - 15:
        return min(26, (f - POV_END) / 12 * 26)
    if f < RUN_END:
        return 26 * (RUN_END - f) / 15
    return 0


def place(sig, sec, g=1.0, pan=0.0):
    i = int(sec * SR)
    j = min(n, i + len(sig))
    if 0 <= i < j:
        L[i:j] += sig[: j - i] * g * (1 - max(pan, 0))
        R[i:j] += sig[: j - i] * g * (1 + min(pan, 0))


def lp(x, a):
    y = np.empty_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc += a * (x[k] - acc)
        y[k] = acc
    return y


t = np.arange(n) / SR
# wind: slowly swelling filtered noise, a little stronger in the heat
noise = rng.standard_normal(n)
wind = lp(noise, 0.02) * (0.6 + 0.4 * np.sin(t * 0.7) + 0.3 * np.sin(t * 1.9 + 1))
heat = np.interp(t * FPS, [SLOW, STOP + 20, RUN_END, RUN_END + 60], [0, 1, 1, 0])
L += wind * (1.4 + heat)
R += np.roll(wind, 900) * (1.4 + heat)

# footsteps: one per half walk-cycle (cycle = 240 px)
dist, nxt = 0.0, 120.0
for f in range(TOTAL):
    dist += speed(f)
    if dist >= nxt:
        nxt += 120
        d = 0.14
        tt = np.arange(int(d * SR)) / SR
        crunch = lp(rng.standard_normal(len(tt)), 0.25) * np.exp(-tt * 30)
        place(crunch, f / FPS, 0.9, pan=0.15 if int(nxt / 120) % 2 else -0.15)

# heartbeat while thirsty
for k in range(12):
    s = SLOW / FPS + 0.3 + k * 0.85
    if s > POV_END / FPS:
        break
    for off, g in ((0, 1.0), (0.18, 0.7)):
        tt = np.arange(int(0.25 * SR)) / SR
        place(np.sin(2 * math.pi * 52 * tt) * np.exp(-tt * 18), s + off, 0.9 * g)

# shimmer when the oasis appears
tt = np.arange(int(2.5 * SR)) / SR
shimmer = sum(np.sin(2 * math.pi * f0 * tt + i) for i, f0 in enumerate([880, 1320, 1760, 2217]))
place(shimmer * np.minimum(1, tt / 0.5) * np.exp(-tt * 1.2) * 0.06, POV / FPS + 0.4, 1.0)

# splashes on each scoop
for s in (RUN_END + 36, RUN_END + 36 + 39):
    tt = np.arange(int(0.6 * SR)) / SR
    splash = (lp(rng.standard_normal(len(tt)), 0.5) - lp(rng.standard_normal(len(tt)), 0.05)) * np.exp(-tt * 7)
    bubble = np.sin(2 * math.pi * (600 + 900 * tt) * tt) * np.exp(-tt * 14) * 0.3
    place(splash + bubble, s / FPS, 1.1, pan=0.2)

# warm pad for the final moment
tt = np.arange(int((TOTAL - DRINK_END) / FPS * SR)) / SR
pad = sum(np.sin(2 * math.pi * f0 * tt) + np.sin(2 * math.pi * f0 * 1.003 * tt) for f0 in (146.8, 220, 293.7, 370))
pad *= np.minimum(1, tt / 1.5) * 0.05
place(pad, DRINK_END / FPS)

mix = np.stack([L, R], 1)
mix *= np.minimum(1, t / 0.5)[:, None] * np.minimum(1, (TOTAL / FPS - t) / 1.2)[:, None]
mix = mix / np.max(np.abs(mix)) * 0.8
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("wrote", OUT)
