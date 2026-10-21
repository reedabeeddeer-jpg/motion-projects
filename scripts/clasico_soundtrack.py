"""Synthesizes the soundtrack for src/clasico.html (15 s): stadium crowd, referee whistle, drums and cue hits."""
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 15.0
BEAT = 0.5  # 120 BPM
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output" / "clasico-soundtrack.wav"
# Arabic voice-over (ElevenLabs, voice "Mohammad – Warm Arabic Commercial", eleven_multilingual_v2), one take
VO = ROOT / "output" / "voice" / "clasico-vo.mp3"
# (start, end) of each line inside VO, time it lands in the video, playback speed
VO_LINES = [
    ((0.00, 0.80), 1.05, 1.0),   # الكلاسيكو!
    ((2.15, 5.24), 4.35, 1.0),   # ريال مدريد، ضد برشلونة! مواجهة القمة!
    ((6.57, 12.51), 7.90, 1.2),  # الأحد، خمسة وعشرين أكتوبر، الساعة العاشرة مساءً، على قنوات بي إن سبورتس!
    ((13.84, 15.33), 13.15, 1.1),  # لا تفوّتوا المباراة!
]

n = int(SR * DUR)
t = np.arange(n) / SR
L = np.zeros(n)
R = np.zeros(n)
rng = np.random.default_rng(10)


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2)
    R[i:j] += s * np.sqrt((1 + pan) / 2)


def lowpass(x, cut):
    y = np.zeros_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc += cut * (x[k] - acc)
        y[k] = acc
    return y


def kick():
    tt = np.arange(int(0.4 * SR)) / SR
    f = 45 + 120 * np.exp(-tt * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 8)


def tom(freq):
    tt = np.arange(int(0.5 * SR)) / SR
    f = freq * (1 + 0.5 * np.exp(-tt * 20))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7) * 0.7


def clap():
    tt = np.arange(int(0.25 * SR)) / SR
    noise = np.diff(rng.standard_normal(len(tt) + 1))
    bursts = sum(np.exp(-np.maximum(tt - d, 0) * 60) * (tt >= d) for d in (0, 0.012, 0.024))
    return noise * bursts * np.exp(-tt * 12) * 0.35


def whoosh(d=0.6, rising=True):
    m = int(d * SR)
    cut = np.linspace(0.02, 0.45, m) if rising else np.linspace(0.45, 0.02, m)
    noise = rng.standard_normal(m)
    y = np.zeros(m)
    acc = 0.0
    for k in range(m):
        acc += cut[k] * (noise[k] - acc)
        y[k] = acc
    return y * np.sin(np.linspace(0, np.pi, m)) ** 2 * 0.6


def impact(d=1.8):
    tt = np.arange(int(d * SR)) / SR
    sub = np.sin(2 * np.pi * (38 + 50 * np.exp(-tt * 7)) * tt) * np.exp(-tt * 2.5)
    crack = rng.standard_normal(len(tt)) * np.exp(-tt * 25) * 0.4
    return sub + crack


def whistle(d=0.7):
    tt = np.arange(int(d * SR)) / SR
    # pea whistle: high tone with fast trill
    f = 2900 + 120 * np.sin(2 * np.pi * 32 * tt)
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.75 + 0.25 * np.sin(2 * np.pi * 32 * tt))
    e = np.minimum(1, tt / 0.02) * np.minimum(1, (d - tt) / 0.08)
    return sig * e * 0.22


def clunk():
    tt = np.arange(int(0.3 * SR)) / SR
    return (np.sin(2 * np.pi * 90 * tt) * 0.6 + rng.standard_normal(len(tt)) * 0.2) * np.exp(-tt * 18)


def bounce():
    tt = np.arange(int(0.25 * SR)) / SR
    return np.sin(2 * np.pi * (140 + 160 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 20) * 0.8


def brass(freqs, d):
    tt = np.arange(int(d * SR)) / SR
    sig = sum(np.sign(np.sin(2 * np.pi * f * tt)) * 0.3 + np.sin(2 * np.pi * f * tt) for f in freqs)
    sig = lowpass(sig, 0.08)
    e = np.minimum(1, tt / 0.05) * np.minimum(1, (d - tt) / 0.3)
    return sig * e * 0.09


# crowd bed: two decorrelated noise layers with slow swells, louder after the title and at the finale
crowd_level = 0.25 + 0.35 * np.clip((t - 1.0) / 0.5, 0, 1) + 0.35 * np.clip((t - 12.9) / 0.6, 0, 1)
crowd_level *= 1 + 0.15 * np.sin(2 * np.pi * 0.3 * t)
for side, arr in ((-1, L), (1, R)):
    c = lowpass(rng.standard_normal(n), 0.06) - lowpass(rng.standard_normal(n), 0.004)
    arr += c * crowd_level * 0.35

# drums from the face-off on
for k, at in enumerate(np.arange(3.2, 14.0, BEAT)):
    place(kick(), at, 0.8)
    if k % 2 == 1:
        place(clap(), at, 0.9)
for at in (7.25, 7.5, 7.625, 7.75):
    place(tom(110 - 15 * (at - 7.25) * 8), at, 0.8)

# heroic brass stabs on the chord changes
for at, chord in ((3.2, [146.83, 220.0, 293.66]), (5.2, [130.81, 196.0, 261.63]),
                  (8.2, [116.54, 174.61, 233.08]), (10.2, [130.81, 196.0, 261.63]), (12.6, [146.83, 220.0, 293.66])):
    place(brass(chord, 1.6), at, 1.0)

# cues
place(whistle(0.9), 0.05, 1.0)
for i, s in enumerate((0.15, 0.27, 0.39, 0.51)):
    place(clunk(), s, 0.8, pan=(-0.8, -0.3, 0.3, 0.8)[i])
place(whoosh(0.6), 0.45, 0.8)
place(impact(), 1.0, 1.0)
place(whoosh(0.7), 2.7, 1.0)
place(whoosh(0.6), 3.3, 0.7, pan=0.7)
place(whoosh(0.6), 3.42, 0.7, pan=-0.7)
place(impact(), 4.25, 0.9)
place(tom(180), 4.55, 0.6, pan=0.5)
place(tom(160), 4.67, 0.6, pan=-0.5)
place(whoosh(0.7, rising=False), 7.85, 0.7)
for i in range(3):
    place(tom(200 - 30 * i), 8.7 + i * 0.22, 0.7, pan=0.6 - 0.6 * i)
place(whoosh(0.5), 12.2, 0.8)
for at, g in ((12.8, 1.0), (13.2, 0.7), (13.6, 0.45)):
    place(bounce(), at, g)
place(impact(), 13.0, 1.0)
place(whistle(0.35), 14.0, 0.9)
place(whistle(0.35), 14.45, 0.9)

mix = np.column_stack([L, R])
mix = np.tanh(mix * 1.3) * 0.85

if VO.exists():
    voice = np.zeros(n)
    for (a, b), at, speed in VO_LINES:
        raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", str(a), "-to", str(b), "-i", str(VO),
                              "-af", f"atempo={speed}", "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                             check=True, capture_output=True).stdout
        seg = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768
        fade = int(0.03 * SR)
        seg[:fade] *= np.linspace(0, 1, fade)
        seg[-fade:] *= np.linspace(1, 0, fade)
        i = int(at * SR)
        voice[i:i + len(seg)] += seg[: n - i]
    # duck crowd and music under the voice
    win = int(0.25 * SR)
    level = np.convolve(np.abs(voice), np.ones(win) / win, mode="same")
    duck = 1 - 0.65 * np.clip(level / 0.03, 0, 1)
    mix = mix * duck[:, None] * 0.8 + voice[:, None] * 1.15
    mix /= max(1.0, np.abs(mix).max() / 0.95)
mix *= np.clip((DUR - t) / 0.8, 0, 1)[:, None]
mix *= np.clip(t / 0.15, 0, 1)[:, None]
pcm = (mix * 32767).astype(np.int16)

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote {OUT}")
