"""Synthesizes the cinema soundtrack (12 s): projector hum, film ticks, countdown beeps, cinematic hits and a final chord."""
import wave
from pathlib import Path

import numpy as np

SR, DUR = 44100, 12.0
OUT = Path(__file__).resolve().parent.parent / "output" / "cinema.wav"
n = int(SR * DUR)
mix = np.zeros((n, 2))
rng = np.random.default_rng(5)


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    s = sig[: j - i] * gain
    mix[i:j, 0] += s * (1 - max(pan, 0))
    mix[i:j, 1] += s * (1 + min(pan, 0))


def tt(d):
    return np.arange(int(d * SR)) / SR


def tone(f, d, vol=1.0, a=0.01, r=0.2):
    x = tt(d)
    e = np.minimum(1, x / a) * np.exp(-x / r)
    return np.sin(2 * np.pi * f * x) * e * vol


def hit(d=1.6):
    x = tt(d)
    f = 45 + 90 * np.exp(-x * 14)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 3)
    noise = rng.standard_normal(len(x)) * np.exp(-x * 8) * 0.25
    return (body + noise) * 0.9


def whoosh(d=1.2):
    x = tt(d)
    nz = rng.standard_normal(len(x))
    k = np.convolve(nz, np.ones(60) / 60, mode="same")
    return k * np.sin(np.pi * x / d) ** 2 * 1.2


def tick():
    x = tt(0.02)
    return rng.standard_normal(len(x)) * np.exp(-x * 300) * 0.5


# projector hum + film flutter from 1.0s on
x = tt(DUR)
hum = (np.sin(2 * np.pi * 55 * x) + 0.4 * np.sin(2 * np.pi * 110 * x)) * 0.05
hum *= np.clip((x - 0.6) / 1.5, 0, 1) * np.clip((DUR - x) / 1.0, 0, 1)
mix += hum[:, None]
for k in range(int(1.2 * 24), int(DUR * 24)):
    place(tick(), k / 24, 0.35, pan=(-1) ** k * 0.2)

# curtain whoosh + title hit
place(whoosh(2.0), 0.6, 0.5)
place(hit(), 1.4, 0.9)
for c in (3.2, 6.2, 9.2):
    place(whoosh(0.7), c - 0.35, 0.35)
    place(hit(1.0), c, 0.6)

# countdown beeps 3,2,1
for i in range(3):
    place(tone(880, 0.35, 0.5, r=0.12), 3.2 + i * 0.6)
place(tone(1320, 1.0, 0.5, r=0.3), 3.2 + 1.8)

# ticket slide + feature pops
place(whoosh(0.6), 6.2, 0.4)
for i, f in enumerate((523.25, 659.25, 783.99)):
    place(tone(f, 0.8, 0.45, r=0.25), 7.1 + i * 0.35, pan=(i - 1) * 0.4)

# finale chord (A minor add9 -> A major lift)
for f in (110, 220, 261.63, 329.63, 440, 659.25):
    place(tone(f, 2.8, 0.22, a=0.05, r=0.9), 9.3)
for f in (554.37, 880):
    place(tone(f, 2.2, 0.18, a=0.05, r=0.8), 10.6)

mix *= 0.9 / max(1e-9, np.abs(mix).max())
fade = np.clip((DUR - x) / 0.6, 0, 1)
mix *= fade[:, None]
OUT.parent.mkdir(exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("wrote", OUT)
