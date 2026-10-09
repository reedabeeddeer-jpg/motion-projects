"""Soundtrack for src/sahib-alzaman.html (10 s): soft pad + pen scratch while writing, chime at the sparkle.
Usage: python3 scripts/sahib_audio.py out.wav [SWOOSH_START WRITING_END DURATION]
"""
import sys, wave
import numpy as np
SR = 44100
SW0, WEND, D = (float(v) for v in (sys.argv[2:5] if len(sys.argv) > 4 else (6.8, 6.8, 10)))
D = int(D)
t = np.arange(SR * D) / SR
rng = np.random.default_rng(7)
env = lambda a, b, fi=0.5, fo=0.5: np.clip((t - a) / fi, 0, 1) * np.clip((b - t) / fo, 0, 1)

# calm pad (D minor-ish drone)
pad = sum(np.sin(2 * np.pi * f * t + i) * g for i, (f, g) in enumerate([(73.4, .5), (110, .35), (146.8, .3), (174.6, .18), (220, .12)]))
pad *= (0.7 + 0.3 * np.sin(2 * np.pi * 0.15 * t)) * env(0, D, 1.5, 1.5) * 0.18

# pen scratch: band-passed noise, gated in short strokes between 0.8 s and 6.8 s
n = rng.standard_normal(len(t))
spec = np.fft.rfft(n); fr = np.fft.rfftfreq(len(n), 1 / SR)
spec *= ((fr > 2500) & (fr < 7000)).astype(float); scr = np.fft.irfft(spec, len(n))
gate = np.zeros_like(t); s = 0.8
while s < WEND:
    d = rng.uniform(0.18, 0.4); gate += env(s, s + d, 0.04, 0.08) * rng.uniform(.5, 1); s += d + rng.uniform(0.02, 0.1)
scr = scr / np.abs(scr).max() * np.clip(gate, 0, 1) * 0.35

# underline swoosh + chime at sparkle (7.7 s)
sw = scr * 0 + (np.fft.irfft(np.fft.rfft(n) * ((fr > 1200) & (fr < 5000)), len(n)))
sw = sw / np.abs(sw).max() * env(SW0, SW0 + 1.2, 0.3, 0.5) * 0.18
ch = sum(np.sin(2 * np.pi * f * (t - (SW0 + 0.9))) * np.exp(-(t - (SW0 + 0.9)) * k) * g for f, k, g in [(1318, 1.6, .5), (1976, 2.2, .3), (2637, 3, .2)]) * (t >= SW0 + 0.9) * 0.25

x = pad + scr + sw + ch
x *= np.clip((D - t) / 1.0, 0, 1)
x = np.tanh(x * 1.3) * 0.8
st = np.stack([x, np.roll(x, 40)], 1)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype("<i2").tobytes())
