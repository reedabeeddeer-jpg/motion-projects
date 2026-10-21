"""Synthesizes the soundtrack for src/ai-tool.html (15 s, 120 BPM), timed to its animation cues."""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 15.0
BEAT = 0.5  # 120 BPM
OUT = Path(__file__).resolve().parent.parent / "output" / "ai-tool-soundtrack.wav"

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros(n)
rng = np.random.default_rng(21)


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


def kick():
    tt = np.arange(int(0.35 * SR)) / SR
    freq = 48 + 120 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 9)


def hat(d=0.06, decay=70):
    tt = np.arange(int(d * SR)) / SR
    return np.diff(rng.standard_normal(len(tt) + 1)) * np.exp(-tt * decay) * 0.12


def whoosh(d=0.7, rising=True):
    m = int(d * SR)
    noise = rng.standard_normal(m)
    cut = np.linspace(0.02, 0.5, m) if rising else np.linspace(0.5, 0.02, m)
    y = np.zeros(m)
    acc = 0.0
    for k in range(m):
        acc += cut[k] * (noise[k] - acc)
        y[k] = acc
    return y * np.sin(np.linspace(0, np.pi, m)) ** 2 * 0.5


def blip(freq=880, d=0.15, glide=0.6):
    tt = np.arange(int(d * SR)) / SR
    f = freq * (1 + glide * np.exp(-tt * 40))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 24) * 0.25


def click():
    tt = np.arange(int(0.03 * SR)) / SR
    return np.diff(rng.standard_normal(len(tt) + 1)) * np.exp(-tt * 200) * 0.18


def impact():
    tt = np.arange(int(1.6 * SR)) / SR
    return np.sin(2 * np.pi * (38 + 45 * np.exp(-tt * 8)) * tt) * np.exp(-tt * 3) * 0.9


def riser(start, end):
    d = end - start
    tt = np.arange(int(d * SR)) / SR
    f = 200 * (8 ** (tt / d))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (tt / d) ** 2 * 0.08


# pad: D minor -> Bb -> F -> C, detuned saw-ish
chords = [(0, [146.83, 174.61, 220.0]), (2.7, [116.54, 146.83, 174.61]), (6.1, [174.61, 220.0, 261.63]),
          (9.5, [130.81, 164.81, 196.0]), (12.3, [146.83, 220.0, 293.66])]
for idx, (start, notes) in enumerate(chords):
    end = chords[idx + 1][0] if idx + 1 < len(chords) else DUR
    length = end - start + 0.5
    tt = np.arange(int(length * SR)) / SR
    sig = sum(np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 1.004 * 2 * tt) + 0.15 * np.sin(2 * np.pi * 3 * f * tt)
              for f in notes)
    sig *= 1 + 0.2 * np.sin(2 * np.pi * 4 * tt)  # pulsing gate feel
    place(sig * env(length, 0.4, 0.5) * 0.035, start)

# bass on beats from the chip reveal
bass_roots = [(2.7, 58.27), (6.1, 87.31), (9.5, 65.41), (12.3, 73.42)]
for at in np.arange(2.75, 14.0, BEAT):
    root = [f for s, f in bass_roots if s <= at][-1]
    tt = np.arange(int(0.42 * SR)) / SR
    place(np.tanh(3 * np.sin(2 * np.pi * root * tt)) * np.exp(-tt * 5) * 0.12, at + BEAT / 2)

# rhythm
for at in np.arange(2.75, 14.0, BEAT):
    place(kick(), at, 0.75)
    if at >= 6.1:
        place(hat(), at + BEAT / 2)
        place(hat(0.03, 120), at + BEAT / 4, 0.6)

# scene 1: node pops, signals, collapse
for k, at in enumerate(np.arange(0.2, 1.1, 0.09)):
    place(blip([523.25, 659.25, 783.99, 1046.5][k % 4], 0.12), at, 0.5)
for at in np.arange(1.2, 2.2, 0.125):
    place(blip(1318.5 + 200 * rng.random(), 0.07, 0.2), at, 0.25)
place(riser(1.6, 2.7), 1.6)
place(whoosh(0.5), 2.2, 0.8)
place(impact(), 2.7, 1.0)

# scene 2: title
place(whoosh(0.5), 3.6, 0.7)
for k in range(3):
    place(blip(660 + 165 * k, 0.2), 4.6 + k * 0.16, 1.0)

# transitions
for at in (5.85, 9.1, 11.95):
    place(whoosh(0.7), at, 1.0)

# scene 3: typing, send, reply, thumbnails
prompt_len = 25
for k in range(prompt_len):
    place(click(), 6.6 + 1.2 * k / prompt_len + rng.random() * 0.01, 1.0)
place(blip(1200, 0.15, 0.3), 7.8, 1.0)
for at in (7.95, 8.1, 8.25):
    place(blip(990, 0.08, 0.1), at, 0.5)
for k in range(3):
    place(blip(784 + 196 * k, 0.22), 8.55 + k * 0.13, 1.1)

# scene 4: cards
for k in range(4):
    place(blip(587.33 * (1.26 ** k), 0.22), 9.7 + k * 0.13, 1.1)

# outro
place(impact(), 12.35, 1.0)
place(blip(1760, 0.6, 0.0), 12.85, 0.4)

mix = np.tanh(mix * 1.4) * 0.8
mix *= np.clip((DUR - t) / 1.0, 0, 1)
pcm = (mix * 32767).astype(np.int16)
stereo = np.column_stack([pcm, pcm]).ravel()

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print(f"wrote {OUT}")
