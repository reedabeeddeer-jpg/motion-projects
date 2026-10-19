"""Soundtrack for src/iphone15.html (22 s, 110 BPM): airy synth pad + soft pulse, whooshes and chimes on the scene cuts."""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 22.0
BEAT = 60 / 110
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output" / "iphone15-soundtrack.wav"
# scene starts, same as S in src/iphone15.html
CUTS = [0.0, 3.6, 7.4, 11.4, 14.6, 17.6]

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros(n)
rng = np.random.default_rng(15)


def place(sig, at, gain=1.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    if i < n:
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


def tone(freq, d, vol=0.2):
    tt = np.arange(int(d * SR)) / SR
    sig = np.sin(2 * np.pi * freq * tt) + 0.3 * np.sin(2 * np.pi * 2 * freq * tt) + 0.12 * np.sin(2 * np.pi * 3 * freq * tt)
    return sig * np.exp(-tt * 2.2) * env(d, 0.003, d * 0.6) * vol


def kick():
    tt = np.arange(int(0.3 * SR)) / SR
    return np.sin(2 * np.pi * np.cumsum(46 + 110 * np.exp(-tt * 28)) / SR) * np.exp(-tt * 10) * 0.55


def hat():
    tt = np.arange(int(0.05 * SR)) / SR
    return np.diff(rng.standard_normal(len(tt) + 1)) * np.exp(-tt * 90) * 0.06


def whoosh(d=0.7, rising=True):
    m = int(d * SR)
    noise = rng.standard_normal(m)
    cut = np.linspace(0.02, 0.45, m) if rising else np.linspace(0.45, 0.02, m)
    y = np.zeros(m)
    acc = 0.0
    for k in range(m):
        acc += cut[k] * (noise[k] - acc)
        y[k] = acc
    return y * np.sin(np.linspace(0, np.pi, m)) ** 2 * 0.55


def pop(freq=880, d=0.2):
    tt = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * np.cumsum(freq * (1 + 0.5 * np.exp(-tt * 40))) / SR) * np.exp(-tt * 20) * 0.22


def tick(d=0.03):
    tt = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 120) * 0.08


# pad: Am - F - C - G, 5.5 s each (one chord per two scenes), with a slow shimmer
chords = [[110.0, 164.81, 220.0, 261.63], [87.31, 130.81, 174.61, 261.63], [130.81, 196.0, 261.63, 329.63], [98.0, 146.83, 196.0, 293.66]]
for k, start in enumerate(np.arange(0, DUR, 5.5)):
    length = min(6.4, DUR - start)
    tt = np.arange(int(length * SR)) / SR
    sig = sum(np.sin(2 * np.pi * f * tt) + 0.2 * np.sin(2 * np.pi * 2.005 * f * tt) for f in chords[k % 4])
    place(sig * env(length, 0.8, 1.2) * 0.035 * (0.85 + 0.15 * np.sin(2 * np.pi * 0.3 * tt)), start)

# pulse from the first cut onwards, plus a plucked arpeggio
for i, at in enumerate(np.arange(0.8, DUR - 1.5, BEAT)):
    if i % 2 == 0:
        place(kick(), at, 0.8 if at > CUTS[1] else 0.5)
    if at > CUTS[1]:
        place(hat(), at + BEAT / 2)
    notes = chords[int(at // 5.5) % 4]
    place(tone(notes[i % 4] * 2, 0.45), at, 0.7)

# scene transitions
for c in CUTS[1:]:
    place(whoosh(0.6), c - 0.15, 0.9)
    place(pop(1000), c + 0.15, 1.1)
place(whoosh(0.9), 0.2, 0.8)
place(tone(880, 1.8, 0.3), 0.5, 1.0)  # title chime

# scene-specific cues
for at in (4.8, 5.3, 5.9):  # island morphs
    place(pop(600 + 200 * (at - 4.8)), at, 1.2)
for k in range(48):  # camera megapixel counter
    place(tick(), 8.0 + 1.8 * (k / 48) ** 0.6, 1.0)
place(pop(1500, 0.3), 8.4, 1.2)  # focus lock
place(tone(1320, 0.8, 0.25), 12.0, 1.0)  # chip power-up
place(whoosh(1.0, rising=True), 11.7, 0.8)
place(pop(500, 0.35), 15.9, 1.4)  # cable plugs in
place(tone(990, 1.0, 0.25), 16.0, 1.0)
for k in range(5):  # colour phones pop in
    place(pop(520 + 110 * k, 0.25), 17.8 + k * 0.18, 1.3)
place(tone(660, 2.4, 0.3), 19.8, 1.0)
place(tone(990, 2.4, 0.25), 19.8, 1.0)

mix = np.tanh(mix * 1.3) * 0.8
mix *= np.clip((DUR - t) / 1.4, 0, 1) * np.clip(t / 0.15, 0, 1)
pcm = (mix * 32767).astype(np.int16)
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(np.column_stack([pcm, pcm]).ravel().tobytes())
print(f"wrote {OUT}")
