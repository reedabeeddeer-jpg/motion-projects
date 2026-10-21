"""Soundtrack for src/talabat.html (20 s, 120 BPM): bouncy marimba-like plucks + light beat,
with whooshes on scene cuts, pops on reveals, taps and a 'ding' when the order is confirmed."""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 20.0
BPM = 120
BEAT = 60 / BPM
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output" / "talabat-soundtrack.wav"
CUTS = [3.5, 7.5, 11.0, 15.5, 18.0]          # same as S in src/talabat.html
POPS = [0.25, 0.7, 0.85, 1.0, 1.15, 1.5, 4.0, 4.2, 7.85, 15.1, 16.45, 18.1, 18.9]
TAPS = [6.45, 8.9]
DING = 9.45
LAND = 16.1

n = int(SR * DUR)
mix = np.zeros(n)
rng = np.random.default_rng(5)


def place(sig, at, gain=1.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    if 0 <= i < n:
        mix[i:j] += sig[: j - i] * gain


def tt(d):
    return np.arange(int(d * SR)) / SR


def pluck(f, d=0.35, vol=0.18):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 30)
    return s * np.exp(-t * 9) * np.minimum(1, t * 400) * vol


def kick():
    t = tt(0.3)
    return np.sin(2 * np.pi * np.cumsum(50 + 120 * np.exp(-t * 30)) / SR) * np.exp(-t * 11) * 0.6


def clap():
    t = tt(0.18)
    return rng.standard_normal(len(t)) * np.exp(-t * 28) * 0.14


def hat():
    t = tt(0.05)
    return np.diff(rng.standard_normal(len(t) + 1)) * np.exp(-t * 90) * 0.05


def bass(f, d):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 3) * np.minimum(1, t * 200) * 0.22


def whoosh(d=0.6):
    m = int(d * SR)
    noise = rng.standard_normal(m)
    y = np.zeros(m)
    acc = 0.0
    a = np.linspace(0.02, 0.4, m)
    for i in range(m):
        acc += a[i] * (noise[i] - acc)
        y[i] = acc
    return y * np.sin(np.linspace(0, np.pi, m)) ** 2 * 0.5


def pop():
    t = tt(0.12)
    return np.sin(2 * np.pi * np.cumsum(500 + 900 * np.exp(-t * 40)) / SR) * np.exp(-t * 35) * 0.25


def tap():
    t = tt(0.06)
    return np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 120) * 0.25


def ding():
    t = tt(1.2)
    s = sum(np.sin(2 * np.pi * f * t) * g for f, g in [(1318.5, 1), (1975.5, .5), (2637, .25)])
    s2 = np.concatenate([np.zeros(int(0.12 * SR)), (np.sin(2 * np.pi * 1760 * t) * 0.8)[: len(t) - int(0.12 * SR)]])
    return (s + s2) * np.exp(-t * 4) * 0.12


# chord loop: C – Am – F – G (one bar each), marimba arpeggio on 8ths
prog = [[261.6, 329.6, 392.0, 523.3], [220.0, 261.6, 329.6, 440.0], [174.6, 220.0, 261.6, 349.2], [196.0, 246.9, 293.7, 392.0]]
roots = [65.4, 55.0, 43.7, 49.0]
pattern = [0, 2, 1, 3, 2, 1, 3, 2]
bars = int(DUR / (4 * BEAT)) + 1
for b in range(bars):
    t0 = b * 4 * BEAT
    ch = prog[b % 4]
    for k, idx in enumerate(pattern):
        place(pluck(ch[idx]), t0 + k * BEAT / 2)
    place(bass(roots[b % 4] * 2, 1.6 * BEAT), t0)
    place(bass(roots[b % 4] * 2, 1.6 * BEAT), t0 + 2.5 * BEAT, 0.8)
    for beat in range(4):
        tb = t0 + beat * BEAT
        if tb > 0.2:
            place(kick(), tb)
        if beat % 2 == 1:
            place(clap(), tb)
        place(hat(), tb + BEAT / 2)

for c in CUTS:
    place(whoosh(), c - 0.3, 0.9)
for p in POPS:
    place(pop(), p)
for p in TAPS:
    place(tap(), p)
place(ding(), DING)
place(kick(), LAND, 1.2)
place(whoosh(0.4), LAND + 0.05, 0.5)

# master: fade in/out, soft limit
env = np.ones(n)
env[: int(0.3 * SR)] = np.linspace(0, 1, int(0.3 * SR))
env[-int(1.2 * SR):] = np.linspace(1, 0, int(1.2 * SR))
out = np.tanh(mix * env * 1.4) * 0.85
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
print("wrote", OUT.relative_to(ROOT))
