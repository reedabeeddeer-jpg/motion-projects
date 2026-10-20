"""80s synth-pop bed for the Baghdad 80s video (15 s, 112 BPM, D Hijaz).

Drum machine with gated-reverb snare, detuned saw pad, pulsing bass, a Hijaz
synth lead, tape wobble, and paper-swoosh hits on the scene cuts.
Writes public/audio/music.wav (stereo, 44.1 kHz).
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 15.0
BPM = 112
BEAT = 60 / BPM
BAR = BEAT * 4
CUTS = [96 / 30, 198 / 30, 300 / 30, 390 / 30]  # scene starts (see src/timeline.ts)
OUT = Path(__file__).resolve().parent.parent / "public" / "audio" / "music.wav"

n = int(SR * DUR)
L = np.zeros(n)
R = np.zeros(n)
rng = np.random.default_rng(1980)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= n:
        return
    j = min(n, i + len(sig))
    s = sig[: j - i] * gain
    L[i:j] += s * (1 - pan) / 2 * 2 ** 0.5
    R[i:j] += s * (1 + pan) / 2 * 2 ** 0.5


def adsr(m, a=0.005, d=0.1, s=0.6, r=0.1):
    e = np.full(m, s)
    ai, di, ri = int(a * SR), int(d * SR), int(r * SR)
    ai = max(1, min(ai, m))
    e[:ai] = np.linspace(0, 1, ai)
    if ai + di < m:
        e[ai : ai + di] = np.linspace(1, s, di)
    if ri < m:
        e[-ri:] *= np.linspace(1, 0, ri)
    return e


def saw(f, d, detune=0.0):
    t = np.arange(int(d * SR)) / SR
    out = np.zeros_like(t)
    for k, off in enumerate((-detune, 0, detune)):
        ph = (t * f * 2 ** (off / 1200) + k * 0.31) % 1
        out += 2 * ph - 1
    return out / 3


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


# ---- chords (one per bar): D, Cm, Bb, D, D, Cm, D, D
CHORDS = [[50, 54, 57], [48, 51, 55], [46, 50, 53], [50, 54, 57], [50, 54, 57], [48, 51, 55], [50, 54, 57], [50, 54, 57]]
for b, ch in enumerate(CHORDS):
    at = b * BAR
    if at >= DUR:
        break
    d = BAR + 0.3
    pad = sum(saw(hz(m + 12), d, detune=12) for m in ch) / 3
    pad = lowpass(pad, 1800) * adsr(len(pad), a=0.25, d=0.4, s=0.8, r=0.35)
    place(pad, at, 0.16, pan=-0.3)
    place(pad, at + 0.012, 0.16, pan=0.3)  # chorus-ish width
    # pulsing 8th-note bass
    root = ch[0] - 12
    for k in range(8):
        f = hz(root + (12 if k % 2 else 0))
        bs = saw(f, BEAT / 2 * 0.9, detune=4)
        bs = lowpass(bs, 700) * adsr(len(bs), a=0.003, d=0.12, s=0.5, r=0.04)
        place(bs, at + k * BEAT / 2, 0.42)

# ---- drums: kick on 1&3, gated snare on 2&4, 16th hats
def kick():
    m = int(0.35 * SR)
    t = np.arange(m) / SR
    f = 50 + 110 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def snare():
    m = int(0.32 * SR)
    t = np.arange(m) / SR
    noise = rng.uniform(-1, 1, m)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    # gated reverb: dense noise tail, hard-cut at ~280ms
    gate = np.where(t < 0.28, 0.9 - t * 1.5, 0) * np.exp(-t * 3)
    return (noise * gate * 0.7 + body * 0.6)


def hat(open_=False):
    m = int((0.18 if open_ else 0.05) * SR)
    t = np.arange(m) / SR
    x = rng.uniform(-1, 1, m)
    x = x - lowpass(x, 6000)
    return x * np.exp(-t * (14 if open_ else 70))


K, S = kick(), snare()
beats = int(DUR / BEAT)
for i in range(beats):
    at = i * BEAT
    if at > DUR - 0.6:
        break
    if i % 4 in (0, 2) or (i % 8 == 7):
        place(K, at, 0.85)
    if i % 4 in (1, 3):
        place(S, at, 0.38, pan=0.05)
    for s16 in range(4):
        place(hat(open_=(s16 == 2 and i % 2)), at + s16 * BEAT / 4, 0.11 if s16 % 2 else 0.16, pan=0.35)

# ---- Hijaz lead (D Eb F# G A Bb C) — enters bar 2, quieter so VO sits on top
D = 62
SCALE = [0, 1, 4, 5, 7, 8, 10, 12]
MELODY = [  # (bar, beat, scale degree, length in beats)
    (1, 0, 4, 1), (1, 1, 3, 0.5), (1, 1.5, 2, 0.5), (1, 2, 1, 1), (1, 3, 2, 1),
    (2, 0, 3, 1.5), (2, 1.5, 2, 0.5), (2, 2, 1, 2),
    (3, 0, 2, 0.5), (3, 0.5, 1, 0.5), (3, 1, 0, 3),
    (4, 0, 4, 1), (4, 1, 5, 0.5), (4, 1.5, 4, 0.5), (4, 2, 3, 1), (4, 3, 2, 1),
    (5, 0, 1, 1), (5, 1, 2, 1), (5, 2, 3, 2),
    (6, 0, 2, 0.5), (6, 0.5, 1, 0.5), (6, 1, 0, 3),
]
for bar, beat, deg, ln in MELODY:
    at = bar * BAR + beat * BEAT
    d = ln * BEAT
    t = np.arange(int(d * SR)) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 4, 0, 1)
    f = hz(D + SCALE[deg])
    ph = np.cumsum(f * vib) / SR
    sq = np.sign(np.sin(2 * np.pi * ph)) * 0.5 + np.sin(2 * np.pi * ph * 2) * 0.3
    lead = lowpass(sq, 2600) * adsr(len(sq), a=0.01, d=0.15, s=0.7, r=0.08)
    place(lead, at, 0.09, pan=0.15)
    place(lead, at + BEAT * 0.75, 0.035, pan=-0.4)  # dotted-8th echo

# ---- paper swoosh + snare hit on each scene cut
for c in CUTS:
    m = int(0.45 * SR)
    t = np.arange(m) / SR
    x = rng.uniform(-1, 1, m)
    sw = (x - lowpass(x, 2200)) * np.sin(np.pi * t / 0.45) ** 2
    place(sw, c - 0.28, 0.35, pan=-0.2)
    place(S, c, 0.25)
# ---- tape flutter, master fade, soft-clip
flutter = 1 + 0.015 * np.sin(2 * np.pi * 0.7 * np.arange(n) / SR)
L *= flutter
R *= flutter
fade = np.ones(n)
fi, fo = int(0.05 * SR), int(1.4 * SR)
fade[:fi] = np.linspace(0, 1, fi)
fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
L *= fade
R *= fade
hiss = rng.normal(0, 0.004, n)
L += hiss
R += hiss
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = np.tanh(L / peak * 1.3) * 0.85, np.tanh(R / peak * 1.3) * 0.85

OUT.parent.mkdir(parents=True, exist_ok=True)
pcm = (np.stack([L, R], axis=1) * 32767).astype("<i2")
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote {OUT} ({DUR}s)")
