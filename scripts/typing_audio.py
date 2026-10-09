"""Soundtrack for src/typing.html: pad + keystroke ticks + male voice reciting twice (second time with echo)."""
import numpy as np, wave, os, subprocess, tempfile
SR, DUR = 44100, 10.0
T0, T1, CHARS = 1.4, 3.6, 17          # keep in sync with src/typing.html
root = os.path.join(os.path.dirname(__file__), "..")
rng = np.random.default_rng(8)
t = np.arange(int(SR * DUR)) / SR

tmp = tempfile.mktemp(suffix=".wav")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(root, "assets/audio/alhamdulillah-voice.mp3"),
                "-ac", "1", "-ar", str(SR), tmp], check=True)
with wave.open(tmp) as w:
    voice = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(float) / 32768
os.remove(tmp)
voice /= np.abs(voice).max()

def place(sig, at, gain):
    out = np.zeros_like(t); i = int(at * SR); n = min(len(sig), len(out) - i); out[i:i + n] = sig[:n] * gain; return out

# warm pad
pad = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(73.4, .5), (110, .35), (146.8, .3), (220, .16), (293.7, .1)])
pad *= (1 + 0.15 * np.sin(2 * np.pi * 0.15 * t)) * np.clip(t / 2, 0, 1) * np.clip((DUR - t) / 1.5, 0, 1) * 0.12

# keystroke ticks
keys = np.zeros_like(t)
for i in range(CHARS):
    s = int((T0 + (T1 - T0) * i / CHARS) * SR); n = int(0.03 * SR)
    burst = rng.standard_normal(n) * np.exp(-np.arange(n) / (0.006 * SR))
    burst += 0.8 * np.sin(2 * np.pi * (1800 + 120 * (i % 3)) * np.arange(n) / SR) * np.exp(-np.arange(n) / (0.004 * SR))
    keys[s:s + n] += burst * 0.22

# voice: once in sync with typing, once more with echo
v1 = place(voice, T0 + 0.05, 0.95)
v2 = place(voice, 5.6, 0.75)
echo = sum(place(voice, 5.6 + d, g) for d, g in [(0.22, .35), (0.45, .22), (0.7, .12)])

# chime when the text completes
chime = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(880, .5), (1320, .3), (1760, .2)]) * np.exp(-2 * np.clip(t - T1, 0, None)) * (t >= T1) * 0.08

mix = pad + keys + v1 + v2 + echo * 0.8 + chime
mix = np.tanh(mix * 1.1) * 0.92
out = os.path.join(root, "output", "typing.wav")
with wave.open(out, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", os.path.normpath(out))
