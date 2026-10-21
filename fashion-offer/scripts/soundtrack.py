"""Builds the 15 s soundtrack: synthesized promo beat (128 BPM) + SFX on the animation cues + ElevenLabs voiceover.

The voiceover (assets/audio/vo-short.mp3) is sped up x1.33 so it fits the 15 s cut, placed at 0.8 s,
and the music ducks under it. Output: output/soundtrack.wav
"""
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
VO = ROOT / "assets" / "audio" / "vo-short.mp3"
OUT = ROOT / "output" / "soundtrack.wav"

SR = 44100
DUR = 15.0
BPM = 128
BEAT = 60 / BPM
VO_START, VO_TEMPO = 0.8, 1.33

n = int(SR * DUR)
music = np.zeros((n, 2))
sfx = np.zeros((n, 2))
rng = np.random.default_rng(11)


def place(buf, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= n:
        return
    j = min(n, i + len(sig))
    seg = sig[: j - i] * gain
    buf[i:j, 0] += seg * (1 - max(0, pan))
    buf[i:j, 1] += seg * (1 + min(0, pan))


def tt(d):
    return np.arange(int(d * SR)) / SR


def kick():
    t = tt(0.4)
    f = 45 + 130 * np.exp(-t * 35)
    return np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7))


def clap():
    t = tt(0.25)
    noise = rng.standard_normal(len(t))
    env = np.exp(-t * 28) + 0.6 * np.exp(-((t - 0.012) * 300) ** 2) + 0.5 * np.exp(-((t - 0.024) * 300) ** 2)
    return np.diff(noise, prepend=0) * env * 0.35


def hat(open_=False):
    t = tt(0.25 if open_ else 0.05)
    return np.diff(rng.standard_normal(len(t) + 1)) * np.exp(-t * (14 if open_ else 80)) * 0.12


def saw(freq, d, detune=0.0):
    t = tt(d)
    ph = (freq * (1 + detune) * t) % 1.0
    return 2 * ph - 1


def lowpass(x, a):
    y = np.zeros_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc += a * (x[k] - acc)
        y[k] = acc
    return y


def pluck(freq, d=0.22):
    t = tt(d)
    s = (saw(freq, d) + saw(freq, d, 0.006) + saw(freq * 2, d) * 0.4) / 2.4
    return lowpass(s, 0.25) * np.exp(-t * 14)


def bass(freq, d):
    t = tt(d)
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sign(np.sin(2 * np.pi * freq * t))
    env = np.minimum(1, t / 0.005) * np.exp(-t * 4)
    return lowpass(s, 0.08) * env


def whoosh(d=0.6, rising=True):
    m = int(d * SR)
    noise = rng.standard_normal(m)
    cut = np.linspace(0.02, 0.45, m) if rising else np.linspace(0.45, 0.02, m)
    y = np.zeros(m)
    acc = 0.0
    for k in range(m):
        acc += cut[k] * (noise[k] - acc)
        y[k] = acc
    return y * np.sin(np.linspace(0, np.pi, m)) ** 2 * 0.6


def pop(freq=900):
    t = tt(0.15)
    f = freq * (1 + 0.8 * np.exp(-t * 45))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26) * 0.3


def ding(freq=1568):
    t = tt(1.0)
    return sum(np.sin(2 * np.pi * freq * h * t) * np.exp(-t * (4 + 3 * h)) / h for h in (1, 2.01, 3.02)) * 0.22


def riser(d=1.2):
    t = tt(d)
    f = 200 + 1600 * (t / d) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15
    return (tone + whoosh(d) * 0.6) * (t / d) ** 1.5


def impact():
    t = tt(1.5)
    sub = np.sin(2 * np.pi * (38 + 60 * np.exp(-t * 10)) * t) * np.exp(-t * 2.8)
    crash = np.diff(rng.standard_normal(len(t) + 1)) * np.exp(-t * 3) * 0.12
    return sub * 0.9 + crash


# ---------- music: Am - F - C - G, energy lifts at the offer (7 s) ----------
roots = [110.0, 87.31, 130.81, 98.0]
triads = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [261.63, 329.63, 392.0], [196.0, 246.94, 293.66]]
beats = int(DUR / BEAT) + 1
for b in range(beats):
    at = b * BEAT
    if at >= 14.4:  # leave the logo sting clean
        break
    bar = (b // 4) % 4
    drop = at >= 6.9
    place(music, kick(), at, 0.9)
    if b % 2 == 1:
        place(music, clap(), at, 0.9 if drop else 0.6)
    place(music, hat(), at + BEAT / 2, 1.0, pan=0.3)
    if drop:
        place(music, hat(), at + BEAT / 4, 0.6, pan=-0.3)
        place(music, hat(), at + 3 * BEAT / 4, 0.6, pan=-0.3)
    place(music, bass(roots[bar], BEAT * 0.9), at, 0.55)
    place(music, bass(roots[bar] * 2, BEAT * 0.4), at + BEAT / 2, 0.35)
    # arpeggiated plucks on 8ths
    for s in range(2):
        note = triads[bar][(b * 2 + s) % 3] * (2 if drop and s else 1)
        place(music, pluck(note), at + s * BEAT / 2, 0.22, pan=(-0.4 if s else 0.4))

# ---------- SFX on the animation cues (see src/offer.html) ----------
for at, p in [(0.10, -0.5), (0.20, 0.5), (0.25, -0.3), (0.35, 0.2), (0.45, -0.6), (0.55, 0.6)]:
    place(sfx, pop(700 + 300 * (at * 10 % 3)), at, 0.8, pan=p)
place(sfx, whoosh(0.7), 0.35, 0.9)          # model slides in
place(sfx, whoosh(0.5), 0.75, 0.5)          # headline
place(sfx, whoosh(0.6), 1.85, 0.8, pan=-0.4)  # hijab card
place(sfx, ding(), 3.75, 0.9)                # hijab price lands
place(sfx, whoosh(0.6), 4.05, 0.8, pan=-0.4)  # shirt card
place(sfx, ding(1760), 6.0, 0.9)             # shirt price lands
place(sfx, riser(1.2), 5.75, 0.8)
place(sfx, impact(), 6.95, 1.0)              # dark scene + 50% badge
place(sfx, whoosh(0.4, rising=False), 8.7, 0.6)  # strike-through
place(sfx, impact() * 0.6 + np.pad(ding(2093), (0, len(impact()) - len(ding(2093)))), 9.8, 0.9)  # new price
place(sfx, ding(2349), 12.6, 0.6)            # CTA
place(sfx, whoosh(0.5), 14.35, 0.7)
place(sfx, impact() * 0.7, 14.5, 0.8)        # logo sting

# ---------- voiceover ----------
raw = subprocess.run(
    ["ffmpeg", "-loglevel", "error", "-i", str(VO), "-af", f"atempo={VO_TEMPO},highpass=f=80",
     "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
    check=True, capture_output=True,
).stdout
vo = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
vo = vo / (np.abs(vo).max() + 1e-9) * 0.9
voice = np.zeros(n)
i = int(VO_START * SR)
voice[i:i + len(vo)] = vo[: n - i]

# duck music by ~9 dB while she speaks (smoothed envelope follower)
env = np.abs(voice)
win = int(0.12 * SR)
env = np.convolve(env, np.ones(win) / win, mode="same")
duck = 1 - 0.65 * np.clip(env / 0.08, 0, 1)
duck = np.convolve(duck, np.ones(win) / win, mode="same")

mix = music * duck[:, None] * 0.55 + sfx * 0.7 + voice[:, None] * 1.0
fade = int(0.3 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= max(1.0, np.abs(mix).max() / 0.95)

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("wrote", OUT.relative_to(ROOT), f"(voice ends at {VO_START + len(vo) / SR:.2f}s)")
