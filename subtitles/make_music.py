"""Original ambient score for the Al-Mutanabbi Street clip: oud-like plucks in maqam Hijaz over a drone and soft daf."""
import sys, wave
import numpy as np

SR = 44100
DUR = 9.6
N = int(SR * DUR)
rng = np.random.default_rng(7)
out = np.zeros(N)

def hz(semis, base=146.83):  # semitones from D3
    return base * 2 ** (semis / 12)

def pluck(freq, dur, amp=0.5, bright=0.5):
    n = int(SR * dur); p = int(SR / freq)
    y = np.zeros(n + p)
    burst = rng.uniform(-1, 1, p)
    burst = np.convolve(burst, np.ones(3) / 3, 'same') * (1 - bright) + burst * bright
    y[:p] = burst
    decay = 0.996
    for s in range(p, n + p, p):
        e = min(s + p, n + p)
        prev = y[s - p:e - p]
        prev2 = y[s - p - 1:e - p - 1] if s - p - 1 >= 0 else np.concatenate(([0], y[s - p:e - p - 1]))
        y[s:e] = decay * 0.5 * (prev + prev2[:len(prev)])
    y = y[p:] * np.exp(-np.linspace(0, 3.2, n))
    return amp * y / (np.abs(y).max() + 1e-9)

def add(sig, t):
    i = int(t * SR)
    if i >= N:
        return
    j = min(N, i + len(sig))
    out[i:j] += sig[:j - i]

# Drone: D2 + A2 with slow swell
t = np.arange(N) / SR
drone = 0.10 * np.sin(2 * np.pi * 73.42 * t) + 0.05 * np.sin(2 * np.pi * 110.0 * t) + 0.025 * np.sin(2 * np.pi * 146.83 * t)
drone *= (0.8 + 0.2 * np.sin(2 * np.pi * 0.25 * t)) * np.clip(t / 1.5, 0, 1)
out += drone

# Maqam Hijaz on D: D Eb F# G A Bb C D
H = {'D': 0, 'Eb': 1, 'F#': 4, 'G': 5, 'A': 7, 'Bb': 8, 'C': 10, 'D2': 12}
beat = 0.55
melody = [  # (beat, note, length in beats)
    (0.5, 'D', 1), (1.5, 'Eb', 0.5), (2, 'F#', 1), (3, 'G', 1),
    (4, 'A', 1.5), (5.5, 'G', 0.5), (6, 'F#', 1), (7, 'Eb', 1),
    (8, 'D', 0.5), (8.5, 'Eb', 0.5), (9, 'F#', 1), (10, 'A', 2),
    (12, 'G', 0.5), (12.5, 'F#', 0.5), (13, 'Eb', 0.5), (13.5, 'D', 2.5),
]
for b, note, ln in melody:
    f = hz(H[note])
    add(pluck(f, ln * beat + 1.2, 0.32, 0.6), b * beat)
    add(pluck(f / 2, ln * beat + 1.0, 0.10, 0.3), b * beat)  # soft octave below

# Soft daf: low thump on 1, light tak on the off-beats
def daf(low=True):
    n = int(SR * 0.35); tt = np.arange(n) / SR
    if low:
        s = np.sin(2 * np.pi * (70 - 25 * tt) * tt) * np.exp(-tt * 14) * 0.35
        s += rng.uniform(-1, 1, n) * np.exp(-tt * 40) * 0.04
    else:
        s = np.convolve(rng.uniform(-1, 1, n), np.ones(4) / 4, 'same') * np.exp(-tt * 45) * 0.07
    return s
for k in range(16):
    add(daf(True), 0.55 + k * beat)
    add(daf(False), 0.55 + k * beat + beat * 0.5)

# Fade in/out and normalise
fade = np.ones(N); fi = int(0.4 * SR); fo = int(1.2 * SR)
fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo)
out *= fade
out = 0.85 * out / np.abs(out).max()
stereo = np.stack([out, np.roll(out, 220)], 1)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype('<i2').tobytes())
