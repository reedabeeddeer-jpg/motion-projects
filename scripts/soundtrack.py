"""Synthesizes a short soundtrack timed to the motion graphics cues (13 s, 120 BPM)."""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 13.0
BEAT = 0.5  # 120 BPM
OUT = Path(__file__).resolve().parent.parent / "output" / "soundtrack.wav"

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros(n)
rng = np.random.default_rng(3)


def place(sig, at, gain=1.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    mix[i:j] += sig[: j - i] * gain


def env(length, attack, release):
    m = int(length * SR)
    e = np.ones(m)
    a, r = int(attack * SR), int(release * SR)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


def kick(gain=1.0):
    d = 0.35
    tt = np.arange(int(d * SR)) / SR
    freq = 50 + 110 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 9) * gain


def hat():
    d = 0.06
    tt = np.arange(int(d * SR)) / SR
    noise = np.diff(rng.standard_normal(len(tt) + 1))
    return noise * np.exp(-tt * 70) * 0.12


def whoosh(d=0.7, rising=True):
    m = int(d * SR)
    noise = rng.standard_normal(m)
    # moving one-pole lowpass to sweep brightness
    cut = np.linspace(0.02, 0.5, m) if rising else np.linspace(0.5, 0.02, m)
    y = np.zeros(m)
    acc = 0.0
    for k in range(m):
        acc += cut[k] * (noise[k] - acc)
        y[k] = acc
    shape = np.sin(np.linspace(0, np.pi, m)) ** 2
    return y * shape * 0.5


def pop(freq=880, d=0.18):
    tt = np.arange(int(d * SR)) / SR
    f = freq * (1 + 0.6 * np.exp(-tt * 40))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 22) * 0.25


def impact():
    d = 1.6
    tt = np.arange(int(d * SR)) / SR
    sub = np.sin(2 * np.pi * (40 + 40 * np.exp(-tt * 8)) * tt) * np.exp(-tt * 3)
    return sub * 0.9


# pad: A minor -> F major -> C major -> G major, two bars each-ish
chords = [(0, [110.0, 130.81, 164.81]), (4, [87.31, 130.81, 174.61]),
          (7, [130.81, 164.81, 196.0]), (10, [98.0, 146.83, 196.0])]
for idx, (start, notes) in enumerate(chords):
    end = chords[idx + 1][0] if idx + 1 < len(chords) else DUR
    length = end - start + 0.6
    tt = np.arange(int(length * SR)) / SR
    sig = sum(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt + 0.3) for f in notes)
    sig *= (1 + 0.15 * np.sin(2 * np.pi * 0.25 * tt))
    place(sig * env(length, 0.6, 0.6) * 0.045, start)

# arpeggio sparkles from the title onward
arp = [440, 523.25, 659.25, 880]
for k, at in enumerate(np.arange(3.0, 12.0, BEAT / 2)):
    place(pop(arp[k % 4], 0.12), at, 0.35)

# rhythm
for at in np.arange(0, 12.0, BEAT):
    if at >= 3.0:
        place(kick(), at, 0.8)
    if at >= 6.0:
        place(hat(), at + BEAT / 2)

# cue hits matched to the animation
place(impact(), 0.05, 0.8)
for k, at in enumerate([0.7, 0.82, 0.94, 1.06]):
    place(pop(660 + 220 * k), at)
place(whoosh(0.6), 2.3, 0.9)
place(impact(), 3.25, 0.6)
for k, at in enumerate([4.25, 4.43, 4.61]):
    place(pop(880 + 110 * k), at, 1.2)
place(whoosh(0.6, rising=False), 5.75, 0.8)
for k in range(3):
    place(pop(520 + 130 * k, 0.25), 6.35 + k * 0.16, 1.2)
place(whoosh(0.5), 9.0, 0.8)
place(impact(), 9.5, 1.0)

# master: soft clip and fade out
mix = np.tanh(mix * 1.4) * 0.8
mix *= np.clip((DUR - t) / 1.2, 0, 1)
pcm = (mix * 32767).astype(np.int16)
stereo = np.column_stack([pcm, pcm]).ravel()

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print(f"wrote {OUT}")
