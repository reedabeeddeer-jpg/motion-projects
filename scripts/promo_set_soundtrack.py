"""Soundtrack for the Jakook Shi full-set offer video (15 s, 120 BPM).

Mixes a synthesized upbeat track + SFX with the ElevenLabs voiceover
(assets/promo/vo.wav, ducking the music under speech) and writes the
voice envelope used to drive the mouth animation (assets/promo/vo_env.js).
"""
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
DUR = 15.0
BEAT = 0.5  # 120 BPM
VO_START = 0.9  # seconds into the video where the voiceover begins
FPS = 30
OUT = ROOT / "output" / "promo_set_soundtrack.wav"
VO = ROOT / "assets" / "promo" / "vo_set.mp3"
ENV_OUT = ROOT / "assets" / "promo" / "vo_set_env.js"

n = int(SR * DUR)
t = np.arange(n) / SR
music = np.zeros(n)
sfx = np.zeros(n)
rng = np.random.default_rng(11)


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= n:
        return
    j = min(n, i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def tt(d):
    return np.arange(int(d * SR)) / SR


def kick():
    x = tt(0.4)
    f = 45 + 120 * np.exp(-x * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 8)


def clap():
    x = tt(0.25)
    nz = rng.standard_normal(len(x))
    e = np.exp(-x * 22) + 0.6 * np.exp(-((x - 0.012) * 400) ** 2) + 0.5 * np.exp(-((x - 0.024) * 400) ** 2)
    hp = np.diff(nz, prepend=0)
    return hp * e * 0.35


def hat(open_=False):
    x = tt(0.25 if open_ else 0.06)
    nz = np.diff(rng.standard_normal(len(x) + 1))
    return nz * np.exp(-x * (14 if open_ else 70)) * 0.10


def saw(freq, d, detune=0.004):
    x = tt(d)
    out = np.zeros(len(x))
    for k in (-1, 0, 1):
        ph = (x * freq * (1 + k * detune)) % 1.0
        out += 2 * ph - 1
    return out / 3


def lowpass(sig, a):
    y = np.zeros_like(sig)
    acc = 0.0
    for i, v in enumerate(sig):
        acc += a * (v - acc)
        y[i] = acc
    return y


def stab(freqs, d=0.22):
    s = sum(saw(f, d) for f in freqs) / len(freqs)
    x = tt(d)
    return lowpass(s, 0.25) * np.exp(-x * 9)


def bass(freq, d):
    x = tt(d)
    s = np.sin(2 * np.pi * freq * x) + 0.35 * np.sign(np.sin(2 * np.pi * freq * x))
    e = np.minimum(1, x * 200) * np.exp(-x * 3)
    return s * e * 0.5


def whoosh(d=0.6, rising=True):
    m = int(d * SR)
    nz = rng.standard_normal(m)
    cut = np.linspace(0.02, 0.45, m) if rising else np.linspace(0.45, 0.02, m)
    y = np.zeros(m)
    acc = 0.0
    for k in range(m):
        acc += cut[k] * (nz[k] - acc)
        y[k] = acc
    return y * np.sin(np.linspace(0, np.pi, m)) ** 2 * 0.6


def ding(freq=1318.5):
    x = tt(0.9)
    s = np.sin(2 * np.pi * freq * x) + 0.5 * np.sin(2 * np.pi * freq * 2.01 * x) + 0.25 * np.sin(2 * np.pi * freq * 3.0 * x)
    return s * np.exp(-x * 5) * 0.22


def coin_count(start, dur):
    """Fast ticking while a price counter rolls up."""
    k = start
    while k < start + dur:
        x = tt(0.03)
        place(sfx, np.sin(2 * np.pi * 2400 * x) * np.exp(-x * 120) * 0.08, k)
        k += 0.045


def riser(d=1.2):
    x = tt(d)
    f = 200 * (2 ** (x / d * 3))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15 + rng.standard_normal(len(x)) * 0.05
    return s * (x / d) ** 2


def impact():
    x = tt(1.2)
    f = 40 + 80 * np.exp(-x * 10)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 3)
    crash = rng.standard_normal(len(x)) * np.exp(-x * 4) * 0.25
    return boom + crash


# ---- music: chord progression (Am - F - C - G), 2 bars each loop ----
CHORDS = [
    (110.00, [440.00, 523.25, 659.25]),  # Am
    (87.31, [349.23, 440.00, 523.25]),   # F
    (130.81, [392.00, 523.25, 659.25]),  # C
    (98.00, [392.00, 493.88, 587.33]),   # G
]
intro_end = 1.0   # light intro
drop = 8.5        # discount drop
for b in range(int(DUR / BEAT)):
    at = b * BEAT
    bar = b // 4
    root, chord = CHORDS[bar % 4]
    if at >= 14.0:
        break
    full = at >= intro_end
    if full and not (7.5 <= at < drop):  # break before the drop
        place(music, kick(), at, 0.9)
    if full and b % 2 == 1:
        place(music, clap(), at, 0.8)
    place(music, hat(), at + BEAT / 2, 0.9 if full else 0.5)
    if full and b % 4 == 3:
        place(music, hat(True), at + BEAT / 2, 0.6)
    # offbeat stabs + bass
    if full:
        place(music, stab(chord), at + BEAT / 2, 0.30 if at < drop else 0.38)
        place(music, bass(root, BEAT * 0.9), at, 0.55)
    else:
        place(music, stab(chord, 0.4), at, 0.18)

# final hit + tail
place(music, impact(), 14.0, 0.5)
place(music, stab(CHORDS[0][1], 1.0), 14.0, 0.4)

# ---- SFX synced to visual cues ----
place(sfx, whoosh(0.5), 0.05, 0.6)
place(sfx, whoosh(0.6), 0.7, 0.9)           # shapes burst out
place(sfx, ding(1046.5), 1.1, 0.9)          # logo
place(sfx, whoosh(0.5), 2.55, 0.8)          # -> hijab
place(sfx, ding(), 3.05, 1.0)
coin_count(3.05, 0.8)
place(sfx, whoosh(0.5), 4.55, 0.8)          # -> shirt
place(sfx, ding(1568.0), 5.05, 1.0)
coin_count(5.05, 0.8)
place(sfx, whoosh(0.6), 6.8, 0.8)           # -> full set
coin_count(7.3, 0.8)
place(sfx, riser(1.0), 7.5, 1.0)            # build to discount
place(sfx, impact(), drop, 0.9)
place(sfx, ding(1760.0), drop + 0.1, 0.8)
place(sfx, whoosh(0.4), 8.75, 0.6)          # strike-through
place(sfx, ding(2093.0), 10.0, 1.0)         # 5,000
place(sfx, whoosh(0.6), 11.65, 0.8)         # -> finale
place(sfx, ding(1318.5), 11.9, 0.8)

# ---- voiceover ----
vo_raw = subprocess.run(
    ["ffmpeg", "-loglevel", "error", "-i", str(VO), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
    check=True, capture_output=True,
).stdout
vo_sig = np.frombuffer(vo_raw, dtype=np.float32).astype(np.float64)
vo_sig = vo_sig / (np.abs(vo_sig).max() + 1e-9) * 0.9
voice = np.zeros(n)
place(voice, vo_sig, VO_START)

# duck music under speech (smoothed envelope)
win = int(0.05 * SR)
env = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode="same"))
duck = 1 - 0.55 * np.clip(env / 0.08, 0, 1)
duck = np.convolve(duck, np.ones(int(0.12 * SR)) / int(0.12 * SR), mode="same")

mix = music * 0.55 * duck + sfx * 0.6 + voice * 1.0
fade = int(0.6 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= np.abs(mix).max() + 1e-9
mix *= 0.95

OUT.parent.mkdir(parents=True, exist_ok=True)
stereo = np.repeat((mix * 32767).astype(np.int16)[:, None], 2, axis=1)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())

# ---- per-frame voice envelope for lip motion ----
spf = SR // FPS
frames = int(DUR * FPS)
rms = np.array([np.sqrt(np.mean(voice[f * spf:(f + 1) * spf] ** 2)) for f in range(frames)])
rms = np.clip((rms - 0.015) / (np.percentile(rms[rms > 0.015], 90) - 0.015), 0, 1)
ENV_OUT.write_text("window.VO_ENV = " + json.dumps([round(float(v), 3) for v in rms]) + ";\n")
print(f"wrote {OUT.relative_to(ROOT)} and {ENV_OUT.relative_to(ROOT)}")
