"""Soundtrack for src/bein.html (34 s, 120 BPM): sports beat + hits, ducked under the Arabic voice-over."""
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 34.0
BEAT = 0.5  # 120 BPM
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "output" / "bein-soundtrack.wav"
# Arabic voice-over (ElevenLabs, voice "Rawi", eleven_multilingual_v2), placed as one take
VO = ROOT / "output" / "voice" / "bein-vo.mp3"
VO_AT = 0.6  # must match VO_AT in src/bein.html

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros(n)
rng = np.random.default_rng(42)


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
    freq = 48 + 120 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 9) * gain


def clap():
    tt = np.arange(int(0.22 * SR)) / SR
    noise = rng.standard_normal(len(tt))
    bursts = sum(np.exp(-np.clip(tt - d, 0, None) * 60) * (tt >= d) for d in (0, 0.012, 0.024))
    return noise * bursts * np.exp(-tt * 14) * 0.3


def hat(open_=False):
    d = 0.18 if open_ else 0.05
    tt = np.arange(int(d * SR)) / SR
    return np.diff(rng.standard_normal(len(tt) + 1)) * np.exp(-tt * (18 if open_ else 80)) * 0.09


def bass(freq, d):
    tt = np.arange(int(d * SR)) / SR
    saw = 2 * ((freq * tt) % 1) - 1
    return (np.sin(2 * np.pi * freq * tt) * 0.7 + saw * 0.15) * env(d, 0.005, d * 0.5) * 0.35


def whoosh(d=0.6, rising=True):
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
    sub = np.sin(2 * np.pi * (36 + 50 * np.exp(-tt * 8)) * tt) * np.exp(-tt * 3)
    crack = rng.standard_normal(len(tt)) * np.exp(-tt * 25) * 0.2
    return sub * 0.9 + crack


def riser(d=1.0):
    tt = np.arange(int(d * SR)) / SR
    f = 200 * (8 ** (tt / d))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (tt / d) ** 2 * 0.12 + whoosh(d) * 0.4


v = lambda s: s + VO_AT  # noqa: E731

# chord pad (E minor feel): Em - C - G - D, 4 s each
chords = [[82.41, 164.81, 196.0, 246.94], [65.41, 130.81, 164.81, 196.0],
          [98.0, 146.83, 196.0, 246.94], [73.42, 146.83, 185.0, 220.0]]
roots = [41.2, 32.7, 49.0, 36.71]
for bar, start in enumerate(np.arange(0, DUR, 4.0)):
    notes = chords[bar % 4]
    length = min(4.6, DUR - start)
    tt = np.arange(int(length * SR)) / SR
    sig = sum(np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2.01 * f * tt) for f in notes)
    place(sig * env(length, 0.4, 0.6) * 0.03, start)
    if start >= 3.6:  # bass line on 8ths after the intro
        for k in range(8):
            place(bass(roots[bar % 4] * (2 if k % 4 == 3 else 1), 0.24), start + k * BEAT / 2, 1.0)

# drums: half-time intro, full groove from scene 2
for at in np.arange(0, DUR - 1.5, BEAT):
    beat_i = round(at / BEAT)
    if at < 3.6:
        if beat_i % 2 == 0:
            place(kick(), at, 0.6)
        continue
    place(kick(), at, 0.8 if beat_i % 2 == 0 else 0.55)
    if beat_i % 2 == 1:
        place(clap(), at, 1.0)
    place(hat(), at + BEAT / 2)
    if beat_i % 4 == 3:
        place(hat(True), at + BEAT / 2, 0.8)

# cue hits matched to the animation
place(impact(), 0.45, 0.9)
place(whoosh(0.5), v(0) - 0.1, 0.6)
place(riser(0.9), 2.4, 1.0)
place(whoosh(0.6), 3.1, 1.0)
place(impact(), 3.65, 0.7)
place(pop(1200), v(4.4), 1.4)
for k, at in enumerate([v(6.2), v(7.3)]):
    place(pop(700 + 300 * k, 0.22), at, 1.4)
place(whoosh(0.5), 9.4, 0.8)
for k, at in enumerate([v(11.4), v(12.5), v(14.1), v(15.3)]):
    place(impact(0.8), at + 0.05, 0.45)
    place(pop(660 + 110 * k, 0.2), at + 0.05, 1.2)
place(whoosh(0.5, rising=False), 17.2, 0.7)
for k, at in enumerate([v(17.05), v(18.4), v(19.4), v(20.3)]):
    place(pop(330 + 80 * k, 0.25), at + 0.38, 1.6)  # ball bounce
place(riser(0.7), 20.9, 1.0)
place(whoosh(0.6), 21.6, 1.0)
place(impact(), v(22.9), 0.8)
place(pop(1400, 0.3), v(24.1), 1.2)
place(riser(1.0), v(26.9), 1.0)
place(impact(2.4), v(27.9), 1.2)

# voice-over, music ducked underneath
if VO.exists():
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(VO), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    vo = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768
    voice = np.zeros(n)
    i = int(VO_AT * SR)
    voice[i:i + len(vo)] = vo[: n - i]
    win = int(0.3 * SR)
    level = np.convolve(np.abs(voice), np.ones(win) / win, mode="same")
    duck = 1 - 0.6 * np.clip(level / 0.03, 0, 1)
    mix = np.tanh(mix * 1.2) * 0.75 * duck + voice * 1.15
    mix /= max(1.0, np.abs(mix).max() / 0.95)
else:
    mix = np.tanh(mix * 1.2) * 0.8

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
