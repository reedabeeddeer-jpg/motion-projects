"""Synthesized score for the Claude Opus 5.5 launch film (18 s).

Every sound is built from oscillators and seeded noise with numpy: no samples,
no recordings, no AI audio. Cue times match the cuts in index.html.
Writes audio/score.wav (48 kHz, 16-bit stereo).
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 18.0
OUT = Path(__file__).resolve().parent / "audio" / "score.wav"

n = int(SR * DUR)
t = np.arange(n) / SR
L = np.zeros(n)
R = np.zeros(n)
rng = np.random.default_rng(55)

IGNITE, BEATS, WARP, LOCKUP = 3.0, (6.4, 7.73, 9.07), 10.4, 13.6


def hz(note):  # MIDI note -> Hz
    return 440.0 * 2 ** ((note - 69) / 12)


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    if i >= n:
        return
    seg = sig[: j - i] * gain
    L[i:j] += seg * np.sqrt(0.5 * (1 - pan))
    R[i:j] += seg * np.sqrt(0.5 * (1 + pan))


def ramp(x, a, b):
    return np.clip((x - a) / (b - a), 0, 1)


def lowpass(x, cutoff):
    """One-pole low-pass; cutoff may be an array (time-varying)."""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc += a[k] * (x[k] - acc)
        y[k] = acc
    return y


def fft_lowpass(x, cutoff):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / (1 + (lo / np.maximum(f, 1)) ** 4)) * (1 / (1 + (f / hi) ** 4))
    return np.fft.irfft(X, len(x))


# ---------------------------------------------------------------- drone bed
# A1 drone + fifth, slow beating, swells into the ignition and the lockup
drone_env = 0.15 + 0.85 * ramp(t, 0, 2.9) ** 2
drone_env *= 1 - 0.55 * ramp(t, 3.0, 3.6)
drone_env *= 1 - 0.5 * ramp(t, 6.2, 6.6)
drone_env += 0.5 * ramp(t, 10.6, 13.5) ** 2 * (1 - ramp(t, 13.6, 13.7))
drone_env *= 1 - ramp(t, 17.0, 18.0)
drone = (np.sin(2 * np.pi * hz(33) * t) + 0.6 * np.sin(2 * np.pi * hz(40) * t * 1.0015)
         + 0.35 * np.sin(2 * np.pi * hz(45) * t * 0.999) + 0.2 * np.sin(2 * np.pi * hz(57) * t))
place(drone * drone_env * 0.16, 0, pan=-0.1)
place(drone * drone_env * 0.16, 0, pan=0.1)

# ---------------------------------------------------------------- riser into ignition
seg = int(IGNITE * SR)
noise = rng.standard_normal(seg)
cut = 300 + 7000 * ramp(t[:seg], 0.4, IGNITE) ** 3
riser = lowpass(noise, cut) * ramp(t[:seg], 0.3, IGNITE) ** 2.5
place(riser * 0.22, 0, pan=-0.3)
place(lowpass(rng.standard_normal(seg), cut) * ramp(t[:seg], 0.3, IGNITE) ** 2.5 * 0.22, 0, pan=0.3)
# rising tone
k = t[:seg]
f_rise = hz(57) * 2 ** (ramp(k, 0.5, IGNITE) ** 2 * 1.0)
place(np.sin(2 * np.pi * np.cumsum(f_rise) / SR) * ramp(k, 0.8, IGNITE) ** 3 * 0.08, 0)


# ---------------------------------------------------------------- hits
def impact(length=3.0, f0=70, f1=32, gain=1.0):
    m = int(length * SR)
    x = np.arange(m) / SR
    f = f1 + (f0 - f1) * np.exp(-x * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 1.4)
    click = rng.standard_normal(m) * np.exp(-x * 60)
    body = fft_lowpass(rng.standard_normal(m), 1800) * np.exp(-x * 6)
    return np.tanh((sub * 1.1 + click * 0.25 + body * 0.6) * 1.4) * gain


def shimmer(notes, length, decay, gain):
    m = int(length * SR)
    x = np.arange(m) / SR
    s = np.zeros(m)
    for i, nt in enumerate(notes):
        f = hz(nt)
        for h, a in ((1, 1.0), (2, 0.35), (3, 0.12), (4.01, 0.06)):
            s += a * np.sin(2 * np.pi * f * h * x + i) * np.exp(-x * decay * h ** 0.5)
    att = ramp(x, 0, 0.01)
    return s * att * gain / len(notes)


def whoosh(length, lo, hi, gain):
    m = int(length * SR)
    x = np.arange(m) / SR
    env = np.sin(np.pi * np.clip(x / length, 0, 1)) ** 2
    return bandpass(rng.standard_normal(m), lo, hi) * env * gain


def ping(note, gain):
    m = int(1.2 * SR)
    x = np.arange(m) / SR
    f = hz(note)
    s = (np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 6)) * np.exp(-x * 4)
    return s * ramp(x, 0, 0.002) * gain


# ignition: the big one
place(impact(3.5, 85, 30, 1.0) * 0.9, IGNITE)
place(shimmer([69, 73, 76, 80, 83], 4.0, 0.8, 1.0) * 0.35, IGNITE, pan=-0.25)
place(shimmer([81, 85, 88, 92], 4.0, 1.0, 1.0) * 0.22, IGNITE + 0.02, pan=0.25)

# pad after ignition: A maj9, breathing
pad_env = ramp(t, 3.0, 3.8) * (1 - ramp(t, 6.0, 6.45))
pad = sum(np.sin(2 * np.pi * hz(nt) * t * (1 + 0.002 * d)) for nt, d in ((57, -1), (64, 1), (68, 0), (71, 1), (76, -1)))
pad *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.35 * t)
place(fft_lowpass(pad, 2400) * pad_env * 0.05, 0, pan=-0.2)
place(fft_lowpass(pad, 2400) * pad_env * 0.05, 0, pan=0.2)

# capability beats: pre-whoosh, hit, ping, and a running arpeggio underneath
for i, b in enumerate(BEATS):
    place(whoosh(0.35, 800, 6000, 0.25), b - 0.32, pan=0.4 if i % 2 else -0.4)
    place(impact(1.3, 110, 45, 0.75), b)
    place(ping([76, 79, 81][i], 0.2), b + 0.01, pan=[-0.3, 0.3, 0][i])

arp_notes = [57, 64, 69, 71, 76, 71, 69, 64]
step = (BEATS[1] - BEATS[0]) / 8
for j in range(int((WARP - BEATS[0]) / step)):
    at = BEATS[0] + j * step
    m = int(0.3 * SR)
    x = np.arange(m) / SR
    nt = arp_notes[j % 8] + (12 if j >= 16 else 0)
    f = hz(nt)
    pluck = (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * 2 * f * x)) * np.exp(-x * 14) * ramp(x, 0, 0.003)
    place(pluck * 0.07, at, pan=0.35 * np.sin(j * 0.9))
    # soft tick on the off-beat
    tick = rng.standard_normal(int(0.03 * SR)) * np.exp(-np.arange(int(0.03 * SR)) / SR * 180)
    place(bandpass(tick, 5000, 12000) * 0.05, at + step / 2, pan=0.5 if j % 2 else -0.5)

# hyperspace: long rising whoosh, hit on the cut, tension tone toward the lockup
place(whoosh(1.9, 300, 9000, 0.5), WARP - 0.45, pan=-0.2)
place(whoosh(1.9, 400, 11000, 0.4), WARP - 0.4, pan=0.2)
place(impact(2.4, 95, 34, 0.85), WARP)
place(shimmer([64, 69, 76], 2.5, 1.4, 1.0) * 0.18, WARP + 0.5)
m = int((LOCKUP - 11.0) * SR)
x = np.arange(m) / SR
f_t = hz(69) * 2 ** (ramp(x, 0, LOCKUP - 11.0) ** 2 * 0.5)
tension = np.sin(2 * np.pi * np.cumsum(f_t) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f_t * 1.5) / SR)
place(tension * ramp(x, 0, LOCKUP - 11.0) ** 2 * 0.06, 11.0)
place(whoosh(0.6, 1500, 12000, 0.3), LOCKUP - 0.5)

# lockup: final impact and a resolving chord that rings out
place(impact(4.0, 80, 28, 1.0) * 0.95, LOCKUP)
place(shimmer([57, 64, 69, 73, 76, 81], 4.4, 0.45, 1.0) * 0.4, LOCKUP, pan=-0.2)
place(shimmer([85, 88, 93], 4.4, 0.7, 1.0) * 0.18, LOCKUP + 0.03, pan=0.3)
place(ping(88, 0.12), 15.95, pan=0.2)  # the "available now" pill

# ---------------------------------------------------------------- space + master
def reverb(x, seconds=2.6, seed=7):
    r = np.random.default_rng(seed)
    m = int(seconds * SR)
    ir = r.standard_normal(m) * np.exp(-np.arange(m) / SR * (6.9 / seconds))
    ir = fft_lowpass(ir, 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    size = 1 << int(np.ceil(np.log2(len(x) + m)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return y


L2 = L + 0.35 * reverb(L, seed=7)
R2 = R + 0.35 * reverb(R, seed=8)
fade = 1 - ramp(t, 17.2, 18.0) ** 1.5
L2 *= fade
R2 *= fade
peak = max(np.abs(L2).max(), np.abs(R2).max())
L2 = np.tanh(L2 / peak * 1.3) / np.tanh(1.3) * 0.89
R2 = np.tanh(R2 / peak * 1.3) / np.tanh(1.3) * 0.89

OUT.parent.mkdir(parents=True, exist_ok=True)
pcm = (np.stack([L2, R2], axis=1) * 32767).astype("<i2")
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote {OUT} ({DUR}s)")
