"""Synthesizes the soundtrack for src/cyber.html (22 s, 120 BPM), with cues timed to the animation."""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 22.0
BEAT = 0.5  # 120 BPM
CUTS = [3.8, 8.6, 13.6, 18.8]  # keep in sync with CUTS in src/cyber.html
OUT = Path(__file__).resolve().parent.parent / "output" / "cyber-soundtrack.wav"

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros(n)
rng = np.random.default_rng(5)


def place(sig, at, gain=1.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    if i < n:
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


def tone(freq, d, decay=20.0, wave_="sine"):
    tt = np.arange(int(d * SR)) / SR
    ph = 2 * np.pi * freq * tt
    sig = np.sin(ph) if wave_ == "sine" else np.sign(np.sin(ph)) * 0.5
    return sig * np.exp(-tt * decay)


def kick(gain=1.0):
    tt = np.arange(int(0.35 * SR)) / SR
    freq = 45 + 100 * np.exp(-tt * 32)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tt * 9) * gain


def hat(d=0.05, g=0.1):
    tt = np.arange(int(d * SR)) / SR
    return np.diff(rng.standard_normal(len(tt) + 1)) * np.exp(-tt * 80) * g


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


def impact():
    tt = np.arange(int(1.6 * SR)) / SR
    return np.sin(2 * np.pi * (38 + 45 * np.exp(-tt * 8)) * tt) * np.exp(-tt * 3) * 0.9


def glitch_burst(d=0.36):
    """Bit-crushed noise + stuttering square blips for the scene cuts."""
    m = int(d * SR)
    tt = np.arange(m) / SR
    noise = rng.standard_normal(m)
    hold = 12
    noise = np.repeat(noise[::hold], hold)[:m]
    gate = (np.floor(tt * 40) % 2).astype(float)
    sq = np.sign(np.sin(2 * np.pi * 220 * tt * (1 + 3 * tt)))
    return (noise * 0.25 + sq * 0.12 * gate) * np.sin(np.linspace(0, np.pi, m))


def click():
    tt = np.arange(int(0.03 * SR)) / SR
    return rng.standard_normal(len(tt)) * np.exp(-tt * 250) * 0.4


def lock_snap():
    c = click() * 1.5
    return np.pad(c, (0, int(0.08 * SR) - len(c))) + tone(1800, 0.08, 60) * 0.3


def alarm(at, count=3):
    for k in range(count):
        place(tone(880, 0.14, 6, "square") * env(0.14, 0.005, 0.03), at + k * 0.28, 0.25)
        place(tone(660, 0.14, 6, "square") * env(0.14, 0.005, 0.03), at + k * 0.28 + 0.14, 0.25)


def chime(freq):
    return (tone(freq, 0.5, 7) + 0.4 * tone(freq * 2, 0.5, 10) + 0.2 * tone(freq * 3, 0.5, 14)) * 0.3


# dark pad: D minor -> Bb -> F -> C, ending on a bright D major for the outro
chords = [(0.0, [73.42, 110.0, 146.83, 174.61]), (CUTS[0], [58.27, 116.54, 146.83, 174.61]),
          (CUTS[1], [87.31, 130.81, 174.61, 220.0]), (CUTS[2], [65.41, 130.81, 164.81, 196.0]),
          (CUTS[3], [73.42, 146.83, 185.0, 220.0])]
for idx, (start, notes) in enumerate(chords):
    end = chords[idx + 1][0] if idx + 1 < len(chords) else DUR
    length = end - start + 0.6
    tt = np.arange(int(length * SR)) / SR
    sig = sum(np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2.003 * f * tt) for f in notes)
    sig *= 1 + 0.2 * np.sin(2 * np.pi * 0.5 * tt)
    place(sig * env(length, 0.5, 0.6) * 0.035, start)

# pulsing sub-bass on eighths from the stats onward
bass_root = {0: 73.42, 1: 58.27, 2: 87.31, 3: 65.41, 4: 73.42}
for at in np.arange(CUTS[0], 21.0, BEAT / 2):
    sec = sum(at >= c for c in CUTS)
    place(tone(bass_root[sec], 0.22, 14) * env(0.22, 0.005, 0.08), at, 0.35)

# drums
for at in np.arange(CUTS[0], 21.0, BEAT):
    place(kick(), at, 0.75)
    place(hat(), at + BEAT / 2)
for at in np.arange(CUTS[1], CUTS[3], BEAT / 4):
    place(hat(0.03, 0.05), at)

# data-blip arpeggio in the background
arp = [587.33, 698.46, 880.0, 1046.5, 880.0, 698.46]
for k, at in enumerate(np.arange(0.4, 21.0, BEAT / 2)):
    place(tone(arp[k % len(arp)], 0.09, 40), at, 0.06)

# --- cues ---
# scene 1: shield draws, padlock drops and snaps, title, typing
place(impact(), 0.05, 0.7)
place(whoosh(1.2), 0.15, 0.7)
place(tone(220, 0.3, 10), 1.35, 0.3)
place(lock_snap(), 1.95, 1.2)
place(impact(), 1.95, 0.6)
for k in range(9):
    place(click(), 2.5 + k * 0.09, 0.8)

# glitch transitions
for c in CUTS:
    place(glitch_burst(), c - 0.18, 0.9)
    place(whoosh(0.5, rising=False), c - 0.05, 0.4)

# scene 2: three stat rings pop in and count up
for i in range(3):
    st = CUTS[0] + 0.4 + i * 0.3
    place(tone(440 + 110 * i, 0.25, 12), st, 0.4)
    for k in range(12):
        place(click(), st + 0.2 + k * 0.11, 0.25)

# scene 3: alarm, then a hit per threat card
alarm(CUTS[1] + 0.1)
for i in range(4):
    st = CUTS[1] + 0.35 + i * 0.22
    place(whoosh(0.35), st - 0.1, 0.5)
    place(tone(110, 0.4, 8, "square"), st + 0.25, 0.18)

# scene 4: a chime for each ticked tip, rising as security improves
for i, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
    place(chime(f), CUTS[2] + 0.85 + i * 0.6, 1.0)
place(lock_snap(), CUTS[2] + 3.6, 1.0)

# scene 5: impact and a bright success chord
place(impact(), CUTS[3] + 0.1, 1.0)
for k, f in enumerate([587.33, 739.99, 880.0, 1174.66]):
    place(chime(f), CUTS[3] + 0.6 + k * 0.06, 0.8)

# master: soft clip and fade out
mix = np.tanh(mix * 1.3) * 0.8
mix *= np.clip((DUR - t) / 1.4, 0, 1)
pcm = (mix * 32767).astype(np.int16)
stereo = np.column_stack([pcm, pcm]).ravel()

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print(f"wrote {OUT}")
