"""Synthesizes the soundtrack for src/compare.html (25 s, 120 BPM), timed to its cues."""
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 25.0
BEAT = 0.5  # 120 BPM
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output" / "compare-soundtrack.wav"
# Arabic voice-over (ElevenLabs, voice "Rawi", eleven_multilingual_v2), one take with pauses between lines
VO = ROOT / "output" / "voice" / "compare-vo.mp3"
# (start, end) of each line inside VO -> time it lands in the video
VO_LINES = [
    ((0.00, 2.66), 0.40),    # تشات جي بي تي، ضد كلود! مقارنة سريعة
    ((3.98, 6.39), 4.10),    # تشات جي بي تي من أوبن إيه آي، وكلود من أنثروبيك
    ((7.58, 8.46), 7.75),    # الكتابة؟ كلود
    ((9.62, 10.77), 9.90),   # البرمجة؟ تعادل
    ((11.74, 13.32), 11.95), # الصور والصوت؟ تشات جي بي تي
    ((14.31, 15.55), 14.25), # الملفات الطويلة؟ كلود
    ((16.51, 18.23), 16.35), # التطبيقات والتكامل؟ تشات جي بي تي
    ((19.19, 21.37), 18.90), # النتيجة: تعادل، والاختيار حسب احتياجك
    ((22.27, 23.68), 22.60), # الأفضل، هو اللي يناسب شغلك
]
ROUND_START, ROUND_LEN = 7.4, 2.2
WINS = ["claude", "tie", "gpt", "claude", "gpt"]

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros(n)
rng = np.random.default_rng(5)


def place(sig, at, gain=1.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    mix[i:j] += sig[: j - i] * gain


def env(length, attack, release):
    m = int(length * SR)
    e = np.ones(m)
    a, r = int(attack * SR), int(release * SR)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


def kick(gain=1.0):
    tt = np.arange(int(0.35 * SR)) / SR
    freq = 50 + 110 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 9) * gain


def snare():
    tt = np.arange(int(0.2 * SR)) / SR
    body = np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 25)
    noise = rng.standard_normal(len(tt)) * np.exp(-tt * 18)
    return (body * 0.5 + noise * 0.35) * 0.5


def hat():
    tt = np.arange(int(0.06 * SR)) / SR
    noise = np.diff(rng.standard_normal(len(tt) + 1))
    return noise * np.exp(-tt * 70) * 0.12


def whoosh(d=0.7, rising=True):
    m = int(d * SR)
    noise = rng.standard_normal(m)
    cut = np.linspace(0.02, 0.5, m) if rising else np.linspace(0.5, 0.02, m)
    y = np.zeros(m)
    acc = 0.0
    for k in range(m):
        acc += cut[k] * (noise[k] - acc)
        y[k] = acc
    return y * np.sin(np.linspace(0, np.pi, m)) ** 2 * 0.5


def pop(freq=880, d=0.18):
    tt = np.arange(int(d * SR)) / SR
    f = freq * (1 + 0.6 * np.exp(-tt * 40))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 22) * 0.25


def impact(d=1.6):
    tt = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * (40 + 40 * np.exp(-tt * 8)) * tt) * np.exp(-tt * 3) * 0.9


def chime(notes, d=0.9):
    tt = np.arange(int(d * SR)) / SR
    sig = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * (4 + i)) for i, f in enumerate(notes))
    return sig * 0.18


# pad: Am - F - C - G looping every 4 s
progression = [[110.0, 130.81, 164.81], [87.31, 130.81, 174.61], [130.81, 164.81, 196.0], [98.0, 146.83, 196.0]]
for idx, start in enumerate(np.arange(0, DUR, 4.0)):
    notes = progression[idx % 4]
    length = min(4.6, DUR - start)
    tt = np.arange(int(length * SR)) / SR
    sig = sum(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt + 0.3) for f in notes)
    place(sig * env(length, 0.5, 0.6) * 0.04, start)

# rhythm: builds after the intro, drops out for the outro
for at in np.arange(3.5, 21.9, BEAT):
    place(kick(), at, 0.75)
    if at >= ROUND_START:
        place(hat(), at + BEAT / 2)
    if at >= ROUND_START and int(round(at / BEAT)) % 2 == 1:
        place(snare(), at, 0.8)

# intro: fly-in, collision, VS slam, title
place(whoosh(0.75), 0.1, 1.0)
place(impact(), 0.85, 1.1)
place(snare(), 0.95, 1.5)
place(pop(520, 0.3), 1.35, 1.0)
place(pop(660, 0.3), 1.55, 1.0)
place(whoosh(0.5), 3.1, 0.9)

# profile cards
place(whoosh(0.6, rising=False), 3.75, 0.7)
for i in range(2):
    for j in range(3):
        place(pop(700 + 110 * j, 0.12), 4.6 + i * 0.15 + j * 0.18, 0.7)
place(whoosh(0.4), 6.9, 0.8)

# rounds: whoosh in, verdict chime (or tie stamp)
for i, win in enumerate(WINS):
    s0 = ROUND_START + i * ROUND_LEN
    place(whoosh(0.4), s0, 0.6)
    if win == "tie":
        place(impact(0.8), s0 + 1.05, 0.7)
        place(snare(), s0 + 1.05, 1.2)
    else:
        base = 523.25 if win == "gpt" else 440.0
        place(chime([base, base * 1.25, base * 1.5]), s0 + 1.05, 1.0)

# result + picks
place(impact(), 18.5, 0.9)
place(chime([523.25, 659.25, 783.99, 1046.5], 1.4), 19.0, 1.0)
for k in range(6):
    place(pop(660 + 80 * k, 0.12), 19.8 + k * 0.1, 0.7)

# outro
place(whoosh(0.6, rising=False), 21.6, 0.8)
place(impact(), 23.0, 0.9)
place(chime([440, 554.37, 659.25, 880], 1.8), 23.0, 1.0)

mix = np.tanh(mix * 1.4) * 0.8

if VO.exists():
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(VO), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    vo_src = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768
    voice = np.zeros(n)
    for (a, b), at in VO_LINES:
        seg = vo_src[int(a * SR):int(b * SR)].copy()
        fade = int(0.03 * SR)
        seg[:fade] *= np.linspace(0, 1, fade)
        seg[-fade:] *= np.linspace(1, 0, fade)
        i = int(at * SR)
        voice[i:i + len(seg)] += seg[: n - i]
    # duck the music under the voice with a smoothed envelope
    win = int(0.25 * SR)
    level = np.convolve(np.abs(voice), np.ones(win) / win, mode="same")
    duck = 1 - 0.6 * np.clip(level / 0.03, 0, 1)
    mix = mix * duck * 0.8 + voice * 1.1
    mix /= max(1.0, np.abs(mix).max() / 0.95)

mix *= np.clip((DUR - t) / 1.2, 0, 1)
pcm = (mix * 32767).astype(np.int16)
stereo = np.column_stack([pcm, pcm]).ravel()

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print(f"wrote {OUT}")
