"""Synthesizes a 25 s tech/infographic music bed with whooshes on scene changes.

Writes public/audio/music.wav. Scene cue times must match src/theme.ts.
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 25.0
OUT = Path(__file__).resolve().parent.parent / "public" / "audio" / "music.wav"
CUES = [0.8, 3.5, 8.0, 15.0, 20.5]  # intro VS slam + scene starts
BPM = 120
BEAT = 60 / BPM

n = int(SR * DUR)
mix = np.zeros(n)
rng = np.random.default_rng(7)


def tt(d):
    return np.arange(int(d * SR)) / SR


def place(sig, at, gain=1.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    if 0 <= i < j:
        mix[i:j] += sig[: j - i] * gain


def kick():
    t = tt(0.35)
    f = 50 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def hat():
    t = tt(0.06)
    return np.diff(rng.standard_normal(len(t) + 1)) * np.exp(-t * 70) * 0.3


def pluck(freq, d=0.25):
    t = tt(d)
    return (np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(4 * np.pi * freq * t)) * np.exp(-t * 12)


def pad(freqs, d):
    t = tt(d)
    s = sum(np.sin(2 * np.pi * f * t) + np.sin(2 * np.pi * f * 1.004 * t) for f in freqs)
    e = np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4)
    return s * e / (2 * len(freqs))


def whoosh(d=0.7):
    t = tt(d)
    noise = rng.standard_normal(len(t))
    # crude rising bandpass: difference of moving averages
    k = np.convolve(noise, np.ones(8) / 8, "same") - np.convolve(noise, np.ones(40) / 40, "same")
    return k * np.sin(np.pi * t / d) ** 2 * 1.4


def impact():
    t = tt(1.2)
    return (np.sin(2 * np.pi * 45 * t) * np.exp(-t * 4) + rng.standard_normal(len(t)) * np.exp(-t * 18) * 0.4)


# chord progression (Am - F - C - G), one bar each
chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]]
arp = [0, 1, 2, 1, 0, 2, 1, 2]
bar = 4 * BEAT
b = 0
while b * bar < DUR:
    ch = chords[b % 4]
    start = b * bar
    place(pad(ch, bar + 0.4), start, 0.35)
    for i in range(8):
        place(pluck(ch[arp[i]] * 2), start + i * BEAT / 2, 0.16)
    b += 1

beats = int(DUR / BEAT)
for k in range(beats):
    at = k * BEAT
    if at < 1.0 or at > DUR - 1.5:
        continue
    place(kick(), at, 0.55)
    place(hat(), at + BEAT / 2, 0.5)

place(impact(), CUES[0], 0.7)
for c in CUES[1:]:
    place(whoosh(), c - 0.45, 0.25)

t = np.arange(n) / SR
mix *= np.minimum(1, t / 0.3) * np.minimum(1, (DUR - t) / 1.5)
mix = mix / np.max(np.abs(mix)) * 0.85
stereo = np.stack([mix, mix], axis=1)
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())
print("wrote", OUT)
