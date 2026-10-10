"""Soundtrack for src/handwriting.html: soft pad + pen-scratch noise while writing + final chime."""
import numpy as np, wave, os
SR, DUR = 44100, 10.0
WRITE = [(1.5, 3.2), (3.6, 4.5), (4.9, 5.7), (6.1, 7.7)]  # keep in sync with src/handwriting.html
rng = np.random.default_rng(3)
t = np.arange(int(SR * DUR)) / SR

# warm pad (Dm add9-ish drone)
pad = sum(a * np.sin(2 * np.pi * f * t + p) for f, a, p in
          [(73.4, .5, 0), (110, .35, 1), (146.8, .3, 2), (220, .18, 3), (293.7, .12, 4), (329.6, .08, 5)])
pad *= (1 + 0.15 * np.sin(2 * np.pi * 0.15 * t))
pad *= np.clip(t / 2, 0, 1) * np.clip((DUR - t) / 1.5, 0, 1) * 0.16

# pen scratch: band-passed noise gated by writing windows, with stroke-rate modulation
noise = rng.standard_normal(len(t))
spec = np.fft.rfft(noise); fr = np.fft.rfftfreq(len(t), 1 / SR)
spec *= ((fr > 2500) & (fr < 7500)) * 1.0
scr = np.fft.irfft(spec, len(t))
gate = np.zeros_like(t)
for s, e in WRITE:
    k = np.clip((t - s) / 0.05, 0, 1) * np.clip((e - t) / 0.08, 0, 1) * ((t >= s) & (t <= e))
    gate += k * (0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 3.1 * (t - s))))
scr = scr / np.abs(scr).max() * gate * 0.35

# paper whoosh at pen entrance and exit
def whoosh(c, w):
    n = rng.standard_normal(len(t)); sp = np.fft.rfft(n); sp *= (fr < 1800)
    x = np.fft.irfft(sp, len(t)); env = np.exp(-((t - c) / w) ** 2)
    return x / np.abs(x).max() * env * 0.18
sfx = whoosh(0.9, 0.25) + whoosh(8.2, 0.35)

# final chime
chime = np.zeros_like(t)
for f, a in [(880, .5), (1320, .3), (1760, .2), (2640, .1)]:
    chime += a * np.sin(2 * np.pi * f * t) * np.exp(-1.8 * np.clip(t - 7.9, 0, None)) * (t >= 7.9)
chime *= 0.12

mix = pad + scr + sfx + chime
mix = np.tanh(mix * 1.3) * 0.9
out = os.path.join(os.path.dirname(__file__), "..", "output", "handwriting.wav")
with wave.open(out, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", os.path.normpath(out))
