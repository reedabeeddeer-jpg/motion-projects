"""Synthesizes the sports video soundtrack (12.5 s, 128 BPM) timed to src/sports.html cues."""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 12.5
BEAT = 60 / 128
OUT = Path(__file__).resolve().parent.parent / "output" / "sports-soundtrack.wav"

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros(n)
rng = np.random.default_rng(8)


def place(sig, at, gain=1.0):
    i = int(at * SR)
    if i >= n:
        return
    j = min(n, i + len(sig))
    mix[i:j] += sig[: j - i] * gain


def tt(d):
    return np.arange(int(d * SR)) / SR


def lowpass_sweep(noise, c0, c1):
    cut = np.linspace(c0, c1, len(noise))
    y = np.zeros(len(noise))
    acc = 0.0
    for k in range(len(noise)):
        acc += cut[k] * (noise[k] - acc)
        y[k] = acc
    return y


def kick():
    x = tt(0.32)
    f = 48 + 120 * np.exp(-x * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 10)


def snare():
    x = tt(0.2)
    noise = rng.standard_normal(len(x))
    return (noise * 0.5 + np.sin(2 * np.pi * 190 * x) * 0.5) * np.exp(-x * 22) * 0.55


def hat(open_=False):
    x = tt(0.18 if open_ else 0.05)
    noise = np.diff(rng.standard_normal(len(x) + 1))
    return noise * np.exp(-x * (18 if open_ else 80)) * 0.14


def bass(freq, d=BEAT * 0.9):
    x = tt(d)
    sig = np.sin(2 * np.pi * freq * x) + 0.35 * np.sin(2 * np.pi * 2 * freq * x)
    e = np.ones(len(x))
    a, r = int(0.005 * SR), int(0.06 * SR)
    e[:a] = np.linspace(0, 1, a)
    e[-r:] *= np.linspace(1, 0, r)
    return sig * e * 0.42


def stab(freqs, d=0.22):
    x = tt(d)
    sig = sum(np.sign(np.sin(2 * np.pi * f * x)) * 0.5 + np.sin(2 * np.pi * f * x) for f in freqs)
    return sig * np.exp(-x * 14) * 0.05


def pop(freq=880, d=0.16):
    x = tt(d)
    f = freq * (1 + 0.6 * np.exp(-x * 40))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 20) * 0.28


def impact(d=1.5):
    x = tt(d)
    sub = np.sin(2 * np.pi * (38 + 45 * np.exp(-x * 9)) * x) * np.exp(-x * 3.2)
    crash = np.diff(rng.standard_normal(len(x) + 1)) * np.exp(-x * 5) * 0.18
    return sub * 0.95 + crash


def whoosh(d=0.7, rising=True):
    noise = rng.standard_normal(int(d * SR))
    y = lowpass_sweep(noise, *( (0.02, 0.5) if rising else (0.5, 0.02) ))
    return y * np.sin(np.linspace(0, np.pi, len(y))) ** 2 * 0.55


def whistle(d=0.55):
    x = tt(d)
    trill = np.sin(2 * np.pi * 38 * x)  # pea rattle
    f = 3100 + 60 * trill
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR)
    e = np.minimum(1, x / 0.02) * np.minimum(1, (d - x) / 0.08)
    return sig * e * (0.65 + 0.35 * np.sign(trill)) * 0.3


def gunshot():
    x = tt(0.45)
    noise = rng.standard_normal(len(x))
    return (noise * np.exp(-x * 18) + np.sin(2 * np.pi * 90 * x) * np.exp(-x * 14)) * 0.7


def crowd(d, peak):
    noise = rng.standard_normal(int(d * SR))
    y = lowpass_sweep(noise, 0.08, 0.14)
    swell = np.sin(np.linspace(0, np.pi, len(y))) ** 1.5
    wob = 0.7 + 0.3 * np.sin(2 * np.pi * 1.7 * tt(d) + np.sin(2 * np.pi * 0.4 * tt(d)) * 2)
    return y * swell * wob * peak


def tick():
    x = tt(0.03)
    return np.sin(2 * np.pi * 1800 * x) * np.exp(-x * 120) * 0.18


# --- ambient crowd throughout, swelling at the cues
place(crowd(DUR, 0.5), 0, 1.0)
place(crowd(3.0, 1.2), 9.5, 1.0)

# --- scene 1: whistle + title slam
place(whistle(), 0.15)
place(impact(), 0.45, 0.95)
for k, at in enumerate([1.3, 1.45, 1.6]):
    place(pop(660 + 220 * k), at, 0.9)
place(whoosh(0.7), 2.5, 0.95)

# --- scene 2: track, countdown beeps then the gun
for at in [3.3, 3.8]:
    place(pop(520, 0.2), at, 1.0)
place(gunshot(), 4.3, 1.0)
place(whoosh(0.45, True), 4.3, 0.5)

# driving groove from the gun to the wipe
G0, G1 = 4.3, 7.0
beats = np.arange(G0, G1, BEAT)
roots = [55.0, 55.0, 65.41, 49.0]  # A1 A1 C2 G1, one per bar
for i, at in enumerate(beats):
    bar = int((i // 4) % 4)
    place(kick(), at, 0.85)
    if i % 4 in (1, 3):
        place(snare(), at, 0.8)
    place(hat(), at + BEAT / 2, 1.0)
    place(hat(), at + BEAT / 4, 0.5)
    place(hat(), at + 3 * BEAT / 4, 0.5)
    place(bass(roots[bar]), at + BEAT / 2, 0.9)
    if i % 4 == 0:
        r = roots[bar] * 4
        place(stab([r, r * 1.2, r * 1.5]), at, 1.0)
place(whoosh(0.7), 6.65, 0.95)

# --- scene 3: ball cards, ticking counters
place(impact(1.2), 6.95, 0.7)
for k, at in enumerate([7.35, 7.65, 7.95]):
    place(pop(784 + 196 * k, 0.2), at, 1.1)
for at in np.arange(7.9, 9.0, 0.045):
    place(tick(), at, 0.6)
for at in np.arange(7.0, 9.7, BEAT):
    place(kick(), at, 0.7)
    place(hat(), at + BEAT / 2, 1.0)
place(whoosh(0.8), 9.4, 1.0)

# --- scene 4: final hit + sparkle
place(impact(2.2), 9.75, 1.1)
place(snare(), 9.75, 0.9)
for k, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
    place(stab([f, f * 2], 0.5), 9.95 + k * 0.12, 1.6)
for k, at in enumerate(np.arange(10.4, 12.0, BEAT / 2)):
    place(pop([880, 1047, 1319, 1568][k % 4], 0.1), at, 0.4)
for at in np.arange(10.2, 11.9, BEAT):
    place(kick(), at, 0.6)

# master: soft clip, fade in/out
mix = np.tanh(mix * 1.5) * 0.85
mix *= np.clip(t / 0.05, 0, 1) * np.clip((DUR - t) / 1.0, 0, 1)
pcm = (mix * 32767).astype(np.int16)
stereo = np.column_stack([pcm, pcm]).ravel()

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print(f"wrote {OUT}")
