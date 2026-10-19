"""Synthesizes the 25 s soundtrack for abu-janna/motion.html, with hits timed to its cues."""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 25.0
BEAT = 60 / 128  # 128 BPM
OUT = Path(__file__).resolve().parent.parent / "output" / "abu-janna-soundtrack.wav"

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros((n, 2))
rng = np.random.default_rng(5)


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    if j <= i:
        return
    mix[i:j, 0] += sig[: j - i] * gain * (1 - max(pan, 0))
    mix[i:j, 1] += sig[: j - i] * gain * (1 + min(pan, 0))


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
    tt = np.arange(int(0.35 * SR)) / SR
    freq = 48 + 120 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 9) * gain


def hat():
    tt = np.arange(int(0.05 * SR)) / SR
    return np.diff(rng.standard_normal(len(tt) + 1)) * np.exp(-tt * 80) * 0.1


def clap():
    tt = np.arange(int(0.2 * SR)) / SR
    return rng.standard_normal(len(tt)) * np.exp(-tt * 25) * 0.25


def lowpass_sweep(noise, start, end):
    cut = np.linspace(start, end, len(noise))
    y = np.zeros(len(noise))
    acc = 0.0
    for k in range(len(noise)):
        acc += cut[k] * (noise[k] - acc)
        y[k] = acc
    return y


def whoosh(d=0.7, rising=True):
    m = int(d * SR)
    y = lowpass_sweep(rng.standard_normal(m), *((0.02, 0.5) if rising else (0.5, 0.02)))
    return y * np.sin(np.linspace(0, np.pi, m)) ** 2 * 0.6


def riser(d):
    m = int(d * SR)
    tt = np.arange(m) / SR
    tone = np.sin(2 * np.pi * np.cumsum(np.linspace(200, 1400, m)) / SR) * 0.15
    noise = lowpass_sweep(rng.standard_normal(m), 0.01, 0.4) * 0.5
    return (tone + noise) * (tt / d) ** 2


def impact(d=2.0):
    tt = np.arange(int(d * SR)) / SR
    sub = np.sin(2 * np.pi * (35 + 60 * np.exp(-tt * 7)) * tt) * np.exp(-tt * 2.5)
    crack = rng.standard_normal(len(tt)) * np.exp(-tt * 18) * 0.4
    return sub + crack


def bell(freq, d=2.5):
    tt = np.arange(int(d * SR)) / SR
    partials = [(1, 1), (2.76, 0.4), (5.4, 0.2), (8.9, 0.08)]
    return sum(a * np.sin(2 * np.pi * freq * p * tt) * np.exp(-tt * (1.5 + p)) for p, a in partials) * 0.25


def pluck(freq, d=0.4):
    tt = np.arange(int(d * SR)) / SR
    return (np.sin(2 * np.pi * freq * tt) + 0.5 * np.sin(2 * np.pi * 2 * freq * tt)) * np.exp(-tt * 9) * 0.2


def pad(notes, start, end, gain):
    length = end - start + 0.8
    tt = np.arange(int(length * SR)) / SR
    sig = sum(np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 1.004 * tt + 1) for f in notes)
    place(sig * env(length, 0.5, 0.8) * gain, start)


pad([55.0, 110.0, 164.81, 220.0], 0.0, 5.0, 0.04)
pad([73.42, 146.83, 220.0, 293.66], 5.0, 11.0, 0.035)
pad([65.41, 130.81, 196.0, 261.63], 11.0, 17.0, 0.035)
pad([73.42, 146.83, 220.0, 293.66, 369.99], 17.0, DUR, 0.035)

for at in np.arange(2.0, DUR - 1.0, BEAT):
    place(kick(), at, 0.9)
    place(hat(), at + BEAT / 2, 1.0, pan=0.3)
for at in np.arange(2.0 + BEAT, DUR - 1.0, 2 * BEAT):
    place(clap(), at, 0.7)
for k, f in enumerate([440, 523.25, 587.33, 659.25, 587.33, 523.25, 440, 392] * 3):
    at = 5.0 + k * BEAT / 2
    if at < 22.0:
        place(pluck(f, 0.3), at, 0.8, pan=0.4 * np.sin(k))

# cues: electric pulses intro, can slam, scene hits, title slams
for at in np.arange(0.2, 1.6, 0.14):
    place(rng.standard_normal(int(0.04 * SR)) * 0.25, at, 1.0, pan=rng.uniform(-1, 1))
place(riser(1.2), 0.8, 0.9)
place(impact(), 2.0, 1.1)
place(whoosh(0.7), 1.3, 0.7)
place(bell(587.33, 2.0), 2.6, 0.6)
for b in (5.0, 11.0, 17.0, 22.0):
    place(whoosh(0.5, rising=False), b - 0.45, 0.8)
    place(impact(1.5), b, 0.9)
for i in range(10):
    place(pluck(440 * 1.0595 ** (i * 2), 0.2), 5.5 + i * 0.2, 0.9, pan=-0.5 + 0.1 * i)
place(riser(1.0), 7.0, 0.8)
place(impact(2.4), 8.0, 1.2)
place(impact(), 12.0, 1.0)
for k in range(6):
    place(bell(1046.5 * (1.1 ** k), 1.0), 12.0 + k * 0.07, 0.25, pan=-0.5 + 0.2 * k)
place(riser(0.9), 13.0, 0.7)
place(whoosh(0.7), 13.4, 0.8)
place(impact(2.2), 17.3, 1.3)
place(bell(587.33, 3.0), 17.35, 0.8)
place(whoosh(0.8), 18.2, 0.7)
for k in range(3):
    place(pluck(880 + 220 * k, 0.25), 22.3 + k * 0.75, 1.2, pan=0.4 - 0.4 * k)
place(impact(2.5), 23.6, 1.0)

mix = np.tanh(mix * 1.3) * 0.85
fade = np.clip(t / 0.2, 0, 1) * np.clip((DUR - t) / 1.0, 0, 1)
mix *= fade[:, None]
pcm = (mix * 32767).astype(np.int16)
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"wrote {OUT}")
