"""Synthesizes a calm ambient bed for src/calm.html (20 s), mastered very quiet."""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 20.0
PEAK = 0.12  # about -18 dBFS: deliberately soft background level
OUT = Path(__file__).resolve().parent.parent / "output" / "calm.wav"

n = int(SR * DUR)
t = np.arange(n) / SR
left = np.zeros(n)
right = np.zeros(n)
rng = np.random.default_rng(21)


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    left[i:j] += sig[: j - i] * gain * (1 - pan) / 2
    right[i:j] += sig[: j - i] * gain * (1 + pan) / 2


def env(length, attack, release):
    m = int(length * SR)
    e = np.ones(m)
    a, r = int(attack * SR), int(release * SR)
    e[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    e[-r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return e


def pad_voice(f, length):
    tt = np.arange(int(length * SR)) / SR
    # three slightly detuned sines for a soft chorus, plus a quiet octave
    s = sum(np.sin(2 * np.pi * f * d * tt + p) for d, p in [(1, 0), (1.003, 1.1), (0.997, 2.3)])
    s += 0.25 * np.sin(2 * np.pi * 2 * f * tt + 0.5)
    return s / 3.25


def bell(f, d=3.0):
    tt = np.arange(int(d * SR)) / SR
    s = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2.01 * f * tt) * np.exp(-tt * 3)
    return s * np.exp(-tt * 1.4) * np.minimum(1, tt / 0.01)


# chords (Dmaj7 - Bm7 - Gmaj7 - Aadd9), 5 s each, long crossfades
chords = [
    [146.83, 185.00, 220.00, 277.18],
    [123.47, 146.83, 185.00, 220.00],
    [98.00, 146.83, 185.00, 246.94],
    [110.00, 164.81, 220.00, 246.94],
]
for k, notes in enumerate(chords):
    start = k * 5.0 - (0.0 if k == 0 else 1.5)
    length = 6.5 if k < 3 else DUR - start
    for idx, f in enumerate(notes):
        place(pad_voice(f, length) * env(length, 2.0, 2.5), start, 0.11, pan=(idx - 1.5) * 0.3)
    # sub root, very gentle
    tt = np.arange(int(length * SR)) / SR
    place(np.sin(2 * np.pi * notes[0] / 2 * tt) * env(length, 2.5, 2.5), start, 0.12)

# sparse pentatonic bells timed loosely to the visuals
melody = [(2.0, 587.33), (3.6, 739.99), (5.2, 880.0), (7.4, 739.99), (9.6, 659.25),
          (11.8, 587.33), (13.8, 739.99), (15.8, 880.0), (16.6, 1174.66), (18.0, 987.77)]
for k, (at, f) in enumerate(melody):
    place(bell(f), at, 0.09, pan=0.4 if k % 2 else -0.4)

# airy filtered noise with slow swell (like distant waves)
noise = rng.standard_normal(n)
y = np.zeros(n)
acc = 0.0
alpha = 0.015
for k in range(n):
    acc += alpha * (noise[k] - acc)
    y[k] = acc
swell = 0.5 + 0.5 * np.sin(2 * np.pi * t / 8 - np.pi / 2)
air = y / np.max(np.abs(y)) * swell * 0.05
left += air
right += np.roll(air, 900)

# simple stereo echo for space
for delay, g in [(0.31, 0.28), (0.53, 0.18), (0.89, 0.1)]:
    d = int(delay * SR)
    l0, r0 = left.copy(), right.copy()
    left[d:] += r0[:-d] * g
    right[d:] += l0[:-d] * g

# master: gentle fade in/out, then normalize to a quiet peak
fade = np.clip(t / 2.0, 0, 1) * np.clip((DUR - t) / 2.5, 0, 1)
left *= fade
right *= fade
peak = max(np.max(np.abs(left)), np.max(np.abs(right)))
left *= PEAK / peak
right *= PEAK / peak

pcm = (np.column_stack([left, right]) * 32767).astype(np.int16).ravel()
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote {OUT}")
