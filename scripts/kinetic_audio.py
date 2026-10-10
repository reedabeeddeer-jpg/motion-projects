"""Sound effects for src/kinetic.html (10 s): whooshes, glitch bursts and a final hit, timed to the phrase cuts."""
import wave
from pathlib import Path

import numpy as np

SR, DUR = 44100, 10.0
OUT = Path(__file__).resolve().parent.parent / "output" / "kinetic.wav"
n = int(SR * DUR)
mix = np.zeros(n)
rng = np.random.default_rng(5)


def place(sig, at, gain=1.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    if i < n:
        mix[i:j] += sig[: j - i] * gain


def noise_burst(length, decay):
    m = int(length * SR)
    return rng.standard_normal(m) * np.exp(-np.arange(m) / (decay * SR))


def glitch(length=0.45):
    m = int(length * SR)
    x = np.zeros(m)
    for _ in range(9):  # stuttering bit-crushed bursts
        s = int(rng.uniform(0, m - 2000)); l = int(rng.uniform(300, 1800))
        x[s:s + l] += np.sign(rng.standard_normal(l)) * rng.uniform(0.3, 1)
    return x * np.linspace(1, 0, m)


def whoosh(length, up=True):
    m = int(length * SR)
    k = np.linspace(0, 1, m) ** 2 if up else np.linspace(1, 0, m) ** 2
    x = rng.standard_normal(m)
    y = np.zeros(m); a = 0.0
    for i in range(m):  # one-pole low-pass whose cutoff sweeps
        c = 0.02 + 0.6 * k[i]
        a += c * (x[i] - a); y[i] = a
    return y * np.sin(np.pi * np.linspace(0, 1, m)) * 2.5


def boom(length=0.9, f0=90):
    m = int(length * SR); tt = np.arange(m) / SR
    return np.sin(2 * np.pi * (f0 * np.exp(-tt * 3.5) + 35) * tt) * np.exp(-tt * 4)


def tick(freq=1400):
    m = int(0.06 * SR); tt = np.arange(m) / SR
    return np.sin(2 * np.pi * freq * tt) * np.exp(-tt * 70)


# phrase 1: words pop in
for i in range(3):
    place(tick(1000 + 250 * i), 0.0 + i * 0.22 + 0.1, 0.5)
# phrase 1 exit -> 2 enter
place(glitch(0.5), 2.05, 0.55); place(whoosh(0.5), 2.1, 0.5); place(boom(), 2.6, 0.8); place(glitch(0.4), 2.6, 0.4)
# phrase 2 exit -> 3 enter
place(whoosh(0.55, up=False), 4.45, 0.55); place(tick(300), 4.98, 0.6); place(whoosh(0.5), 5.0, 0.5); place(boom(0.7, 110), 5.0, 0.6)
# phrase 3 exit -> 4 slam
place(whoosh(0.55), 6.85, 0.7); place(boom(1.4, 70), 7.4, 1.0); place(glitch(0.6), 7.4, 0.6)
# gentle pulse under the final phrase
for k in range(4):
    place(boom(0.35, 120), 8.1 + k * 0.45, 0.25)

mix *= 0.8 / max(1e-9, np.abs(mix).max())
fade = int(0.4 * SR); mix[-fade:] *= np.linspace(1, 0, fade)
OUT.parent.mkdir(exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("wrote", OUT)
