"""Synthesizes the Claude Code soundtrack (12 s): ambient pad, keyboard clicks, success chime."""
import wave
from pathlib import Path

import numpy as np

SR, DUR = 44100, 12.0
OUT = Path(__file__).resolve().parent.parent / "output" / "claude-code.wav"
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


# ambient pad
x = tt(DUR)
pad = sum(np.sin(2 * np.pi * f * x) for f in (110, 164.81, 220)) * 0.04
pad *= np.clip(x / 1.5, 0, 1) * np.clip((DUR - x) / 1.0, 0, 1)
mix += pad[:, None]

def click():
    d = tt(0.03)
    return rng.standard_normal(len(d)) * np.exp(-d * 250) * 0.5

# intro
place(whoosh(1.0), 0.2, 0.4)
place(hit(), 0.9, 0.7)
# scene cuts
for c in (3.0, 6.5, 9.3):
    place(whoosh(0.6), c - 0.3, 0.35)
    place(hit(1.0), c, 0.5)
# typing clicks (prompt types 0.5s..~1.6s into scene 2)
for k in range(29):
    place(click(), 3.5 + k / 26, 0.5, pan=(-1) ** k * 0.2)
# tool steps + success chime
for st in (1.5, 2.0, 2.5):
    place(tone(660, 0.25, 0.3, r=0.08), 3 + st)
for i, f in enumerate((523.25, 659.25, 783.99)):
    place(tone(f, 1.0, 0.35, r=0.3), 6.0 + i * 0.08)
# feature pops
for i, f in enumerate((523.25, 659.25, 783.99)):
    place(tone(f, 0.7, 0.4, r=0.2), 6.9 + i * 0.3, pan=(1 - i) * 0.4)
# finale chord
for f in (110, 220, 261.63, 329.63, 440, 659.25):
    place(tone(f, 2.7, 0.22, a=0.05, r=0.9), 9.4)

mix *= 0.9 / max(1e-9, np.abs(mix).max())
fade = np.clip((DUR - x) / 0.6, 0, 1)
mix *= fade[:, None]
OUT.parent.mkdir(exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("wrote", OUT)
