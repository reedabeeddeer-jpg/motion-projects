"""Synthesizes a cinematic soundtrack synced to scene.html's timeline.

Usage: python3 soundtrack.py out.wav [duration]
"""
import sys
import wave

import numpy as np

SR = 48000
OUT = sys.argv[1]
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 20.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
mix = np.zeros((N, 2))


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    sig = sig[: max(0, N - i)]
    left, right = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    mix[i:i + len(sig), 0] += sig * gain * left
    mix[i:i + len(sig), 1] += sig * gain * right


def env(n, a, d):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    e[na:] = np.exp(-np.arange(n - na) / (d * SR))
    return e


def lowpass(x, k):
    # cheap one-pole lowpass, k in (0,1]
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc)
        y[i] = acc
    return y


def kick(length=0.6):
    n = int(length * SR)
    tt = np.arange(n) / SR
    f = 45 + 110 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.18)


def impact(length=2.5):
    n = int(length * SR)
    tt = np.arange(n) / SR
    f = 30 + 80 * np.exp(-tt * 8)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.7)
    noise = lowpass(rng.standard_normal(n), 0.08) * env(n, 0.001, 0.25)
    return boom * 0.9 + noise * 0.6


def whoosh(length=0.8, rising=True):
    n = int(length * SR)
    noise = rng.standard_normal(n)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    ks = np.linspace(0.02, 0.35, n) if rising else np.linspace(0.35, 0.02, n)
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        acc += ks[i] * (noise[i] - acc)
        y[i] = acc
    return y * shape * 1.5


def riser(length):
    n = int(length * SR)
    tt = np.arange(n) / SR
    f = 200 * (8 ** (tt / length))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3
    noise = lowpass(rng.standard_normal(n), 0.15) * 0.5
    return (tone + noise) * (tt / length) ** 2


def blip(freq, length=0.25):
    n = int(length * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * tt) + 0.3 * np.sin(4 * np.pi * freq * tt)) * env(n, 0.003, 0.06)


# --- ambient pad (A minor-ish), swelling over the whole piece ---------------
pad = np.zeros(N)
for f, g in [(110, .5), (164.8, .35), (220, .3), (261.6, .2), (329.6, .15)]:
    pad += g * np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.2 * t)) \
        + g * 0.5 * np.sin(2 * np.pi * f * 1.003 * t)
pad *= np.clip(t / 2.0, 0, 1) * np.clip((DUR - t) / 1.5, 0, 1) * 0.06
mix[:, 0] += pad
mix[:, 1] += np.roll(pad, 300)

# --- timeline cues (seconds match scene.html) --------------------------------
place(riser(1.9), 0.05, 0.5)
place(impact(), 1.95, 0.9)
place(whoosh(0.7), 3.3, 0.6)
place(impact(1.5), 3.6, 0.5)
for i, at in enumerate([3.65, 4.15, 4.65]):          # kinetic words
    place(whoosh(0.45, rising=False), at, 0.55, pan=0.6 if i % 2 == 0 else -0.6)
    place(kick(), at + 0.1, 0.7)

bpm = 120
beat = 60 / bpm
b = 4.9
while b < 16.2:                                       # driving pulse
    place(kick(), b, 0.6)
    b += beat

place(whoosh(0.9), 7.7, 0.8)                          # wipe -> scene 3
for i, at in enumerate([8.5, 8.85, 9.2]):
    place(blip(660 * (1.25 ** i)), at, 0.35, pan=0.5 - i * 0.5)
place(whoosh(0.9), 11.9, 0.8)                         # wipe -> scene 4
for i, at in enumerate([12.6, 12.85, 13.1]):
    place(blip(880 + 220 * i, 0.4), at, 0.3, pan=0.5 - i * 0.5)
for k in range(28):                                   # counter ticks
    place(blip(1800, 0.03), 12.7 + k * 0.06, 0.08, pan=rng.uniform(-.5, .5))
place(riser(1.6), 14.85, 0.6)
place(impact(3.5), 16.45, 1.0)
for i, f in enumerate([440, 554.4, 659.3, 880]):      # outro chime
    place(blip(f, 2.5) * 0.8, 17.9 + i * 0.05, 0.25)

# --- master: soft clip + normalize -----------------------------------------
mix = np.tanh(mix * 1.4)
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.89
pcm = (mix * 32767).astype('<i2')
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f'soundtrack -> {OUT}')
