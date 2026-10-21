"""Cinematic 5 s score + sound design for src/desert-thirst.html.

Hijaz-mode ney/duduk-style lead over a low drone and string pad, desert wind,
a sand-gust whoosh (1.6-2.9 s), a deep frame-drum impact when he falls to his
knees (2.6 s), a swell as he calls for help (3.0 s) and a reverb tail to the end.
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 5.0
OUT = Path(__file__).resolve().parent.parent / "output" / "desert-thirst-soundtrack.wav"
n = int(SR * DUR)
t = np.arange(n) / SR
L = np.zeros(n); R = np.zeros(n)
rng = np.random.default_rng(5)


def onepole(x, a):
    """One-pole lowpass; a in (0,1], smaller = darker. a may be an array."""
    y = np.empty_like(x); acc = 0.0
    a = np.broadcast_to(a, x.shape)
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc); y[i] = acc
    return y


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR); j = min(n, i + len(sig))
    if j <= i: return
    L[i:j] += sig[: j - i] * gain * (1 - pan) / 2
    R[i:j] += sig[: j - i] * gain * (1 + pan) / 2


def env(m, a, r):
    e = np.ones(m); ai, ri = int(a * SR), int(r * SR)
    e[:ai] = np.sin(np.linspace(0, np.pi / 2, ai)) ** 2
    e[-ri:] *= np.cos(np.linspace(0, np.pi / 2, ri)) ** 2
    return e


# --- desert wind: two bands of filtered noise with slow gusts ---
noise = rng.standard_normal(n)
gusts = 0.55 + 0.25 * np.sin(2 * np.pi * t / 3.1) + 0.2 * np.sin(2 * np.pi * t / 1.3 + 1)
whoosh = np.exp(-((t - 2.25) / 0.45) ** 2)             # sand gust crossing frame
wind_lo = onepole(noise, 0.02 + 0.03 * whoosh)
wind_hi = onepole(noise, 0.12 + 0.2 * whoosh) - onepole(noise, 0.05)
wind = wind_lo / np.abs(wind_lo).max() * gusts * 0.5 + wind_hi / np.abs(wind_hi).max() * (0.12 + 0.55 * whoosh)
pan_w = np.clip((t - 1.6) / 1.3, 0, 1) * 2 - 1           # gust sweeps left -> right with the visual
L += wind * (0.6 - 0.35 * pan_w * whoosh) * 0.5
R += wind * (0.6 + 0.35 * pan_w * whoosh) * 0.5

# --- low drone D2 + A2, swelling ---
D2 = 73.42
drone = sum(np.sin(2 * np.pi * f * t + p) * g for f, p, g in [(D2, 0, 1), (D2 * 1.5, 1, 0.45), (D2 * 2.002, 2, 0.3), (D2 * 0.5, 0, 0.6)])
drone *= env(n, 1.2, 0.6) * (0.6 + 0.4 * np.clip((t - 2.4) / 1.2, 0, 1))
place(drone, 0, 0.16)

# --- string pad (detuned saws, lowpassed): Dm -> Bb -> Gm/D ---
def saw(f, m):
    tt = np.arange(m) / SR; ph = (f * tt) % 1.0
    return 2 * ph - 1

chords = [(0.0, 2.6, [146.83, 174.61, 220.0]), (2.4, 1.5, [116.54, 146.83, 174.61, 233.08]),
          (3.7, 1.3, [98.0, 146.83, 196.0, 233.08])]
for at, ln, notes in chords:
    m = int(ln * SR)
    s = sum(saw(f * d, m) for f in notes for d in (0.996, 1.004))
    bright = 0.03 + 0.05 * np.linspace(0, 1, m) if at > 2 else 0.03
    s = onepole(s, bright) * env(m, 0.5 if at == 0 else 0.35, 0.6)
    place(s / len(notes), at, 0.09, -0.2)
    place(s / len(notes), at + 0.012, 0.09, 0.2)

# --- ney / duduk-like lead in Hijaz on D (D Eb F# G A Bb C) ---
def ney(f, ln, vib=5.2):
    m = int(ln * SR); tt = np.arange(m) / SR
    depth = 0.012 * np.clip(tt / 0.4, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * (1 + depth * np.sin(2 * np.pi * vib * tt))) / SR
    tone = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph) + 0.08 * np.sin(5 * ph)
    breath = onepole(rng.standard_normal(m), 0.25) * 0.35 * (0.6 + 0.4 * np.sin(ph * 0.5) ** 2)
    e = env(m, min(0.12, ln / 3), min(0.35, ln / 2.5))
    return (tone + breath) * e

melody = [(0.55, 440.00, 0.9), (1.35, 392.00, 0.45), (1.75, 369.99, 0.55), (2.25, 311.13, 0.45),
          (2.65, 293.66, 0.55), (3.05, 587.33, 1.05), (3.95, 523.25, 0.3), (4.2, 466.16, 0.75)]
for k, (at, f, ln) in enumerate(melody):
    # little grace-note slide into each note
    place(ney(f * 1.06, 0.05), at - 0.04, 0.06, 0.1)
    place(ney(f, ln), at, 0.17 if f > 500 else 0.15, 0.1)

# --- frame-drum / taiko impact as he drops to his knees ---
def hit(f0=55, ln=1.6):
    m = int(ln * SR); tt = np.arange(m) / SR
    f = f0 * (1 + 1.8 * np.exp(-tt * 28))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3.2)
    skin = onepole(rng.standard_normal(m), 0.3) * np.exp(-tt * 40) * 0.6
    return body + skin
place(hit(), 2.6, 0.55)
place(hit(82, 0.8), 2.62, 0.18, 0.4)
place(hit(48, 2.0), 3.0, 0.35)          # second, deeper hit on the call

# --- reversed-cymbal style riser into the call ---
m = int(1.1 * SR); tt = np.arange(m) / SR
riser = (onepole(rng.standard_normal(m), 0.35) - onepole(rng.standard_normal(m), 0.05)) * (tt / tt[-1]) ** 3
place(riser, 1.9, 0.22)

# --- reverb: convolve with a decaying-noise impulse (cheap hall) ---
ir_len = int(1.9 * SR); it = np.arange(ir_len) / SR
ir = rng.standard_normal(ir_len) * np.exp(-it * 3.0); ir = onepole(ir, 0.25); ir /= np.abs(ir).sum() ** 0.5 * 6
def conv(x):
    N = 1 << int(np.ceil(np.log2(len(x) + ir_len)))
    return np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(ir, N), N)[: len(x)]
L = L + conv(L) * 0.55; R = R + conv(R) * 0.55

# --- master: fade in/out, soft clip, normalize ---
master_env = np.clip(t / 0.25, 0, 1) * np.clip((DUR - t) / 0.45, 0, 1) ** 1.5
L *= master_env; R *= master_env
peak = max(np.abs(L).max(), np.abs(R).max())
L = np.tanh(L / peak * 1.3) / np.tanh(1.3) * 0.89; R = np.tanh(R / peak * 1.3) / np.tanh(1.3) * 0.89

OUT.parent.mkdir(parents=True, exist_ok=True)
data = (np.stack([L, R], 1) * 32767).astype(np.int16)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
print("wrote", OUT)
