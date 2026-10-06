"""Synthesizes the 10 s soundtrack for src/ad.html (cues match the T timings there)."""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 10.0
BEAT = 60 / 112
OUT = Path(__file__).resolve().parent.parent / "output" / "ad_soundtrack.wav"

n = int(SR * DUR)
t = np.arange(n) / SR
left = np.zeros(n)
right = np.zeros(n)
rng = np.random.default_rng(7)


def place(sig, at, gain=1.0, pan=0.0):
    """pan: -1 = left, +1 = right."""
    i = int(at * SR)
    j = min(n, i + len(sig))
    s = sig[: j - i] * gain
    left[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414
    right[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414


def tt_(d):
    return np.arange(int(d * SR)) / SR


def kick():
    tt = tt_(0.4)
    f = 48 + 120 * np.exp(-tt * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 8)


def clap():
    tt = tt_(0.2)
    return rng.standard_normal(len(tt)) * np.exp(-tt * 25) * 0.25


def hat():
    tt = tt_(0.05)
    return np.diff(rng.standard_normal(len(tt) + 1)) * np.exp(-tt * 80) * 0.1


def sweep_noise(d, lo, hi):
    m = int(d * SR)
    noise = rng.standard_normal(m)
    cut = np.linspace(lo, hi, m)
    y = np.zeros(m)
    acc = 0.0
    for k in range(m):
        acc += cut[k] * (noise[k] - acc)
        y[k] = acc
    return y


def impact():
    tt = tt_(1.8)
    sub = np.sin(2 * np.pi * (36 + 50 * np.exp(-tt * 9)) * tt) * np.exp(-tt * 2.5)
    crack = rng.standard_normal(len(tt)) * np.exp(-tt * 30) * 0.3
    return sub + crack


def chime(freq, d=1.2):
    tt = tt_(d)
    return sum(np.sin(2 * np.pi * freq * h * tt) / h for h in (1, 2, 3)) * np.exp(-tt * 4) * 0.2


def riser(d):
    tt = tt_(d)
    f = np.linspace(300, 1400, len(tt))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.linspace(0, 1, len(tt)) ** 2 * 0.08


# warm pad: Dm - Bb - F - C
chords = [(0.0, [146.83, 174.61, 220.0]), (2.5, [116.54, 146.83, 174.61]),
          (5.0, [174.61, 220.0, 261.63]), (7.5, [130.81, 164.81, 196.0])]
for idx, (start, notes) in enumerate(chords):
    length = (chords[idx + 1][0] if idx + 1 < len(chords) else DUR) - start + 0.5
    tt = tt_(length)
    sig = sum(np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2.003 * f * tt) for f in notes)
    e = np.minimum(1, np.minimum(tt / 0.5, (length - tt) / 0.5))
    place(sig * e * 0.04, start)

# beat kicks in after the logo lands
for at in np.arange(2.15, 9.2, BEAT):
    place(kick(), at, 0.7)
for at in np.arange(2.15 + BEAT, 9.2, BEAT * 2):
    place(clap(), at, 0.8)
for at in np.arange(3.6, 9.2, BEAT / 2):
    place(hat(), at, 1.0, pan=0.3 * np.sin(at * 3))

# logo whoosh: travels from right speaker to centre while the logo slides in (0.6 -> 2.1 s)
d = 1.5
w = sweep_noise(d, 0.03, 0.35) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 1.5 * 0.9
m = len(w)
i = int(0.55 * SR)
pan = np.linspace(1.0, 0.0, m)
left[i:i + m] += w * np.sqrt((1 - pan) / 2) * 1.414
right[i:i + m] += w * np.sqrt((1 + pan) / 2) * 1.414

place(impact(), 1.95, 0.9)                     # logo lands
place(chime(1318.5), 2.3, 1.0, pan=0.4)       # shine sweep
place(chime(1760.0), 2.45, 0.7, pan=-0.4)
place(sweep_noise(0.5, 0.05, 0.3) * np.hanning(int(0.5 * SR)) * 0.4, 2.55, pan=0.5)   # brand
place(chime(880.0, 0.8), 3.6, 0.6)           # tagline
place(riser(1.2), 5.0)
place(impact(), 6.2, 0.6)                      # CTA pop
place(chime(1046.5), 6.2, 0.8)

# master
mix = np.column_stack([left, right])
mix = np.tanh(mix * 1.3) * 0.85
mix *= np.clip((DUR - t) / 1.0, 0, 1)[:, None]
pcm = (mix * 32767).astype(np.int16)

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes(pcm.tobytes())
print(f"wrote {OUT}")
