"""Synthesizes the 20 s soundtrack for clasico/motion.html, with hits timed to its cues."""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 20.0
BEAT = 60 / 110  # 110 BPM
OUT = Path(__file__).resolve().parent.parent / "output" / "clasico-soundtrack.wav"

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


# harmony: D minor intro/clash, Hijaz-flavoured Ramadan section, bright D major for the product
pad([73.42, 146.83, 174.61, 220.0], 0.0, 3.4, 0.035)
pad([58.27, 116.54, 174.61, 233.08], 3.4, 8.0, 0.04)
pad([73.42, 146.83, 185.0, 220.0], 8.0, 13.4, 0.035)
pad([73.42, 146.83, 185.0, 220.0, 293.66], 13.4, DUR, 0.032)

# Hijaz melody over the Ramadan frame (D, Eb, F#, G, A)
melody = [293.66, 311.13, 369.99, 392.0, 440.0, 392.0, 369.99, 311.13, 293.66]
for k, f in enumerate(melody):
    place(pluck(f, 0.6), 8.6 + k * BEAT / 1.5, 1.0, pan=0.3 * np.sin(k))

# rhythm
for at in np.arange(0, DUR - 1.0, BEAT):
    if 3.4 <= at < 7.8 or at >= 13.6:
        place(kick(), at, 0.9)
        place(hat(), at + BEAT / 2, 1.0, pan=0.3)
    if 1.0 <= at < 3.4 or 8.0 <= at < 13.4:
        place(hat(), at, 0.6, pan=-0.3)
for at in np.arange(3.4 + BEAT, 7.8, 2 * BEAT):
    place(clap(), at, 0.8)
for at in np.arange(13.6 + BEAT, DUR - 1.0, 2 * BEAT):
    place(clap(), at, 0.7)

# cues
place(impact(), 0.0, 0.5)
for k, at in enumerate([0.55, 0.8]):
    place(impact(0.8), at, 0.45)
place(whoosh(0.7), 1.3, 0.6, pan=0.4)
place(riser(1.2), 2.2, 0.8)
place(impact(), 3.4, 0.9)
place(whoosh(0.9), 3.7, 0.8, pan=-0.6)
place(whoosh(0.9), 3.85, 0.8, pan=0.6)
place(impact(2.4), 4.6, 1.3)
place(bell(587.33, 1.2), 4.65, 0.6)
place(whoosh(0.6, rising=False), 5.6, 0.6)
place(riser(1.0), 7.0, 0.9)
place(whoosh(0.8), 7.6, 0.8)
place(bell(293.66, 4.0), 8.0, 1.3)
place(bell(440.0, 3.5), 8.05, 0.7)
for k in range(5):
    place(bell(880 + 220 * k, 1.2), 10.2 + k * 0.08, 0.25, pan=-0.5 + 0.25 * k)
place(riser(0.7), 12.7, 0.8)
place(whoosh(0.6), 12.95, 0.9)
place(whoosh(0.7), 13.7, 0.7, pan=-0.3)
place(impact(1.5), 14.55, 0.8)
for k in range(6):
    place(pluck(1174.66 * (1.12 ** k), 0.3), 14.6 + k * 0.06, 0.6, pan=0.6 - 0.2 * k)
for k, at in enumerate([15.4, 15.65, 15.9]):
    place(pluck(880 + 110 * k, 0.25), at, 1.2, pan=0.5)
place(whoosh(0.8), 17.8, 0.6)
place(impact(2.0), 18.2, 0.9)
place(bell(587.33, 2.5), 18.25, 0.8)

# master: soft clip, fade in/out
mix = np.tanh(mix * 1.3) * 0.85
fade = np.clip(t / 0.2, 0, 1) * np.clip((DUR - t) / 1.0, 0, 1)
mix *= fade[:, None]
pcm = (mix * 32767).astype(np.int16)

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote {OUT}")
