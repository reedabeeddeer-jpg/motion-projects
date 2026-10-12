"""Synthesizes the stadium soundtrack for src/iraq-uae.html (22 s, 120 BPM, Hijaz flavour)."""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 22.0
BEAT = 0.5  # 120 BPM
GOALS = [7.9, 9.9, 11.9]  # must match GOALS[].at in src/iraq-uae.html
OUT = Path(__file__).resolve().parent.parent / "output" / "iraq-uae.wav"

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros(n)
rng = np.random.default_rng(27)


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


def onepole(x, cut):
    y = np.zeros_like(x)
    acc = 0.0
    cut = np.broadcast_to(cut, x.shape)
    for k in range(len(x)):
        acc += cut[k] * (x[k] - acc)
        y[k] = acc
    return y


def kick(gain=1.0):
    tt = np.arange(int(0.35 * SR)) / SR
    freq = 48 + 120 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 9) * gain


def drum(freq=180, d=0.22):
    # darbuka-ish "dum/tak"
    tt = np.arange(int(d * SR)) / SR
    tone = np.sin(2 * np.pi * freq * (1 + 0.3 * np.exp(-tt * 50)) * tt) * np.exp(-tt * 18)
    snap = rng.standard_normal(len(tt)) * np.exp(-tt * 60) * 0.3
    return (tone + snap) * 0.5


def hat():
    tt = np.arange(int(0.06 * SR)) / SR
    return np.diff(rng.standard_normal(len(tt) + 1)) * np.exp(-tt * 70) * 0.1


def whoosh(d=0.6, rising=True):
    m = int(d * SR)
    cut = np.linspace(0.02, 0.5, m) if rising else np.linspace(0.5, 0.02, m)
    return onepole(rng.standard_normal(m), cut) * np.sin(np.linspace(0, np.pi, m)) ** 2 * 0.5


def pop(freq=880, d=0.18):
    tt = np.arange(int(d * SR)) / SR
    f = freq * (1 + 0.6 * np.exp(-tt * 40))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 22) * 0.25


def impact(d=1.6):
    tt = np.arange(int(d * SR)) / SR
    sub = np.sin(2 * np.pi * (38 + 45 * np.exp(-tt * 8)) * tt) * np.exp(-tt * 3)
    crack = rng.standard_normal(len(tt)) * np.exp(-tt * 25) * 0.25
    return sub * 0.9 + crack


def whistle(d=0.5):
    tt = np.arange(int(d * SR)) / SR
    trill = 1 + 0.5 * np.sign(np.sin(2 * np.pi * 32 * tt))  # pea rattle
    tone = np.sin(2 * np.pi * 2900 * tt + 8 * np.sin(2 * np.pi * 32 * tt))
    return tone * trill * env(d, 0.02, 0.08) * 0.12


# crowd: band-limited noise with slow swells, louder roars after each goal
crowd_raw = onepole(rng.standard_normal(n), 0.12) - onepole(rng.standard_normal(n), 0.01)
level = 0.25 + 0.08 * np.sin(2 * np.pi * 0.31 * t) + 0.05 * np.sin(2 * np.pi * 0.83 * t + 1)
for g in GOALS + [14.45]:
    k = np.clip(t - (g + 0.42), 0, None)
    level += np.where(t >= g + 0.42, (1 - np.exp(-k * 8)) * np.exp(-k * 0.9) * 1.1, 0)
level *= np.clip(t / 1.5, 0, 1)
mix += crowd_raw * level * 0.55

# pad on D with a Hijaz colour (D, Eb, F#, A)
pads = [(0, [73.42, 146.83, 220.0]), (3.4, [73.42, 155.56, 185.0]),
        (7.2, [98.0, 146.83, 233.08]), (13.8, [73.42, 146.83, 185.0, 220.0])]
for idx, (start, notes) in enumerate(pads):
    end = pads[idx + 1][0] if idx + 1 < len(pads) else DUR
    length = end - start + 0.6
    tt = np.arange(int(length * SR)) / SR
    sig = sum(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt + 0.3) for f in notes)
    place(sig * env(length, 0.5, 0.6) * 0.035, start)

# Hijaz arpeggio
arp = [293.66, 311.13, 369.99, 392.0, 440.0, 392.0, 369.99, 311.13]
for k, at in enumerate(np.arange(3.4, 18.4, BEAT / 2)):
    place(pop(arp[k % len(arp)], 0.12), at, 0.3)

# rhythm: kick on the beat, darbuka "dum-tak" pattern, hats in the goal section
for at in np.arange(3.4, 18.4, BEAT):
    place(kick(), at, 0.75)
    place(drum(140), at + BEAT * 0.5, 0.35)
    place(drum(320, 0.12), at + BEAT * 0.75, 0.25)
    if at >= 7.2:
        place(hat(), at + BEAT / 4)

# cue hits matched to the animation
place(impact(), 0.05, 0.7)
place(whistle(0.35), 0.5, 1.0)
place(whoosh(0.6), 2.8, 0.9)
place(impact(), 4.42, 0.9)
place(whoosh(0.5), 7.0, 0.7)
for g in GOALS:
    place(whoosh(0.45), g - 0.05, 0.7)
    place(impact(), g + 0.42, 1.1)
    place(whoosh(0.5, rising=False), g + 0.7, 0.5)
place(whoosh(0.5), 13.5, 0.7)
place(impact(), 14.45, 1.0)
for k in range(3):
    place(pop(587 + 150 * k, 0.25), 15.3 + k * 0.22, 1.2)
# final whistle: three blasts
for at, d in [(17.5, 0.3), (17.9, 0.3), (18.3, 0.8)]:
    place(whistle(d), at, 1.0)
place(impact(2.4), 18.8, 1.1)
place(whoosh(0.8, rising=False), 18.8, 0.6)

# master: soft clip and fade out
mix = np.tanh(mix * 1.3) * 0.82
mix *= np.clip((DUR - t) / 1.4, 0, 1)
pcm = (mix * 32767).astype(np.int16)
stereo = np.column_stack([pcm, pcm]).ravel()

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print(f"wrote {OUT}")
