"""Paper rustle / whoosh / pop sound effects synced to src/grunge-titles.html -> output/grunge-soundtrack.wav"""
import numpy as np, wave
SR = 44100; START, SLOT, N = 0.3, 4.8, 3; DUR = START + SLOT * N + 0.4
rng = np.random.default_rng(3); out = np.zeros(int(DUR * SR))

def add(t, x):
    i = int(t * SR); out[i:i + len(x)] += x[:len(out) - i]

def noise(d): return rng.standard_normal(int(d * SR))

def lowpass_sweep(d, f0, f1):  # whoosh: filtered noise with moving cutoff
    x = noise(d); y = np.zeros_like(x); s = 0.0
    for i in range(len(x)):
        a = 1 - np.exp(-2 * np.pi * (f0 + (f1 - f0) * i / len(x)) / SR); s += a * (x[i] - s); y[i] = s
    return y

def env(n, att, rel):
    e = np.ones(n); a, r = int(att * SR), int(rel * SR)
    e[:a] = np.linspace(0, 1, a); e[-r:] = np.linspace(1, 0, r); return e

def whoosh(t, d, f0, f1, g):
    x = lowpass_sweep(d, f0, f1); x /= np.abs(x).max(); add(t, x * env(len(x), d * .4, d * .5) * g)

def rustle(t, d, g):  # crackly paper: bursts of high-passed noise
    x = np.diff(noise(d), prepend=0); x *= (rng.random(len(x)) > .93) * rng.random(len(x)) * 6 + .15
    add(t, x / np.abs(x).max() * env(len(x), .02, d * .6) * g)

def pop(t, g):
    n = int(.09 * SR); k = np.arange(n) / SR; add(t, np.sin(2 * np.pi * (500 + 900 * np.exp(-k * 50)) * k) * np.exp(-k * 45) * g)

for ti in range(N):
    s = START + ti * SLOT
    whoosh(s + .05, .5, 300, 3500, .5); rustle(s + .25, .6, .45)
    for i in range(3): pop(s + .9 + i * .12, .25)
    whoosh(s + 3.95, .55, 3500, 250, .5); rustle(s + 3.95, .55, .4)
    pop(s + 4.4, .3)

out /= max(1, np.abs(out).max()) * 1.05
with wave.open("output/grunge-soundtrack.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype("<i2").tobytes())
