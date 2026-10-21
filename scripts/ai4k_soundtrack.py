"""Soundtrack for src/ai-4k.html (31 s, 110 BPM): airy synth pads, arpeggios and digital hits on each cue,
with the Arabic voice-over placed line by line and the music ducked underneath."""
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 31.0
BEAT = 60 / 110
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output" / "ai-4k-soundtrack.wav"
# Arabic voice-over (ElevenLabs, voice "Rawi", eleven_multilingual_v2), one take with pauses between phrases
VO = ROOT / "output" / "voice" / "ai-4k-vo.mp3"
# (start, end) of each phrase inside VO -> time it lands in the video
VO_LINES = [
    ((0.00, 1.16), 1.50),    # الذكاء الاصطناعي
    ((1.59, 2.93), 4.60),    # ما هو الذكاء الاصطناعي؟
    ((3.36, 5.14), 5.95),    # أنظمة تتعلّم من البيانات
    ((5.44, 7.78), 7.65),    # لتفهم وتتوقّع وتتّخذ القرار
    ((8.19, 8.82), 10.40),   # كيف يعمل؟
    ((9.28, 10.20), 11.05),  # بيانات ضخمة
    ((10.55, 11.21), 11.95), # ثم تدريب
    ((11.51, 12.80), 12.65), # ثم نموذج يُجيب
    ((13.30, 17.81), 16.00), # تعلّم الآلة، والتعلّم العميق، والذكاء التوليدي... عائلة واحدة
    ((18.35, 22.77), 21.40), # نراه اليوم في الطب، والتعليم، والسيارات الذاتية، والترجمة
    ((23.33, 26.48), 27.20), # المستقبل يُكتب الآن... فاستخدمه بوعي
]

n = int(SR * DUR)
t = np.arange(n) / SR
L = np.zeros(n)
R = np.zeros(n)
rng = np.random.default_rng(11)


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414
    R[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414


def env(length, attack, release):
    m = int(length * SR)
    e = np.ones(m)
    a, r = int(attack * SR), int(release * SR)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


def onepole(x, cut):
    y = np.zeros_like(x)
    acc = 0.0
    cut = np.broadcast_to(cut, x.shape)
    for k in range(len(x)):
        acc += cut[k] * (x[k] - acc)
        y[k] = acc
    return y


def kick(gain=1.0):
    tt = np.arange(int(0.4 * SR)) / SR
    f = 45 + 110 * np.exp(-tt * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 8) * gain


def hat():
    tt = np.arange(int(0.05 * SR)) / SR
    return np.diff(rng.standard_normal(len(tt) + 1)) * np.exp(-tt * 90) * 0.08


def snare():
    tt = np.arange(int(0.25 * SR)) / SR
    return (rng.standard_normal(len(tt)) * np.exp(-tt * 16) * 0.3 + np.sin(2 * np.pi * 200 * tt) * np.exp(-tt * 30) * 0.3) * 0.6


def pluck(freq, d=0.35):
    tt = np.arange(int(d * SR)) / SR
    sig = np.sign(np.sin(2 * np.pi * freq * tt)) * 0.3 + np.sin(2 * np.pi * freq * tt)
    return onepole(sig * np.exp(-tt * 9), 0.25) * 0.18


def blip(freq=1200, d=0.12):
    tt = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * freq * (1 + 0.5 * np.exp(-tt * 50)) * tt) * np.exp(-tt * 30) * 0.22


def whoosh(d=0.7, rising=True):
    m = int(d * SR)
    cut = np.linspace(0.02, 0.45, m) if rising else np.linspace(0.45, 0.02, m)
    return onepole(rng.standard_normal(m), cut) * np.sin(np.linspace(0, np.pi, m)) ** 2 * 0.45


def impact(d=2.0):
    tt = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * (34 + 46 * np.exp(-tt * 7)) * tt) * np.exp(-tt * 2.5) * 0.9


def glitch(d=0.4):
    m = int(d * SR)
    sig = np.zeros(m)
    for k in range(0, m, int(0.02 * SR)):
        if rng.random() > 0.4:
            f = rng.choice([400, 800, 1600, 3200])
            seg = np.sign(np.sin(2 * np.pi * f * np.arange(int(0.02 * SR)) / SR)) * 0.12
            sig[k:k + len(seg)] = seg[: m - k]
    return sig * np.linspace(1, 0.2, m)


# pads: Am - F - C - G, 8 beats each, detuned saws through a slow filter sweep
prog_ = [[110.0, 130.81, 164.81, 220.0], [87.31, 130.81, 174.61, 220.0],
         [130.81, 164.81, 196.0, 261.63], [98.0, 146.83, 196.0, 246.94]]
bar = BEAT * 8
for b, start in enumerate(np.arange(0, DUR, bar)):
    length = min(bar + 0.8, DUR - start)
    tt = np.arange(int(length * SR)) / SR
    sig = np.zeros(len(tt))
    for f in prog_[b % 4]:
        for det in (-0.004, 0.004):
            sig += 2 * ((f * (1 + det) * tt) % 1) - 1
    cut = 0.03 + 0.05 * (0.5 + 0.5 * np.sin(2 * np.pi * tt / bar))
    sig = onepole(sig, cut)
    sig *= env(length, min(0.8, length / 3), min(0.8, length / 3)) * 0.05
    place(sig, start, 1.0, -0.3)
    place(sig, start + 0.012, 1.0, 0.3)

# arpeggio (from scene 2 on), ping-ponged
arp_notes = [[440, 523.25, 659.25, 880], [349.23, 440, 523.25, 698.46], [523.25, 659.25, 783.99, 1046.5], [392, 493.88, 587.33, 783.99]]
for k, at in enumerate(np.arange(4.4, DUR - 2.5, BEAT / 2)):
    chord = arp_notes[int(at // bar) % 4]
    place(pluck(chord[k % 4]), at, 1.0, -0.5 if k % 2 else 0.5)

# drums
for k, at in enumerate(np.arange(0, DUR - 2.0, BEAT)):
    if at < 4.4:
        if k % 4 == 0:
            place(kick(), at, 0.5)
        continue
    place(kick(), at, 0.75 if k % 2 == 0 else 0.0)
    if k % 2 == 1:
        place(snare(), at, 0.8)
    place(hat(), at + BEAT / 2, 1.0, 0.3)

# cue hits matched to the animation
place(impact(), 0.05, 0.6)
for i in range(6):
    place(blip(900 + 120 * i), 0.1 + i * 0.07, 0.6, -0.6 if i % 2 else 0.6)
place(impact(), 1.05, 0.9)
place(whoosh(0.8), 1.2, 0.6)
for s in [4.35, 9.95, 15.55, 20.75, 26.35]:
    place(whoosh(0.7), s - 0.2, 0.9)
    place(glitch(0.45), s + 0.15, 0.8)
for i, at in enumerate([6.0, 6.6, 7.2, 7.8]):
    place(blip(700 + 150 * i, 0.15), at, 1.0)
for i in range(3):
    place(impact(0.9), 11.0 + i * 0.8, 0.4)
    place(blip(600 + 200 * i, 0.2), 11.0 + i * 0.8, 1.2)
for i in range(4):
    place(blip(500 + 180 * i, 0.25), 16.1 + i * 0.6, 1.3)
for i in range(6):
    place(blip(800 + 90 * i, 0.12), 21.6 + i * 0.22, 1.0, 0.5 - 0.2 * i)
place(impact(2.6), 26.9, 1.1)

mix = np.stack([L, R], axis=1)
mix = np.tanh(mix * 1.3) * 0.8

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
    win = int(0.3 * SR)
    level = np.convolve(np.abs(voice), np.ones(win) / win, mode="same")
    duck = 1 - 0.6 * np.clip(level / 0.03, 0, 1)
    mix = mix * duck[:, None] * 0.8 + voice[:, None] * 1.15
    mix /= max(1.0, np.abs(mix).max() / 0.95)
mix *= np.clip((DUR - t) / 1.6, 0, 1)[:, None]
pcm = (mix * 32767).astype(np.int16)

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote {OUT}")
