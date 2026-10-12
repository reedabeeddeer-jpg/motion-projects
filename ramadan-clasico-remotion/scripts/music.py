"""Synthesizes the hype score + SFX for the Remotion promo (36.5 s), cue-locked to src/timeline.ts.

Writes public/audio/music.wav. The voice-over is not mixed in here: it is placed as separate
<Audio> clips in Remotion, and the music is ducked under it there.
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 36.5
OUT = Path(__file__).resolve().parent.parent / "public" / "audio" / "music.wav"

# scene starts (seconds) — keep in sync with src/timeline.ts
CLASH, RAMADAN, PRODUCT, END = 4.6, 14.6, 22.0, 30.0
BEAT = 60 / 128

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros((n, 2))
rng = np.random.default_rng(12)


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    j = min(n, i + len(sig))
    if j <= i or i < 0:
        return
    mix[i:j, 0] += sig[: j - i] * gain * (1 - max(pan, 0))
    mix[i:j, 1] += sig[: j - i] * gain * (1 + min(pan, 0))


def tt_(d):
    return np.arange(int(d * SR)) / SR


def env(length, attack, release):
    m = int(length * SR)
    e = np.ones(m)
    a, r = int(attack * SR), int(release * SR)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


def onepole(x, coef):
    """Simple lowpass; coef may be scalar or per-sample array."""
    coef = np.broadcast_to(coef, x.shape)
    y = np.zeros_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc += coef[k] * (x[k] - acc)
        y[k] = acc
    return y


# ---------- instruments ----------
def kick(g=1.0):
    tt = tt_(0.45)
    f = 45 + 140 * np.exp(-tt * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7)
    click = rng.standard_normal(len(tt)) * np.exp(-tt * 300) * 0.3
    return (body + click) * g


def snare(g=1.0):
    tt = tt_(0.3)
    tone = np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 25) * 0.5
    noise = onepole(rng.standard_normal(len(tt)), 0.6) * np.exp(-tt * 14)
    return (tone + noise) * 0.55 * g


def hat(g=1.0, open_=False):
    tt = tt_(0.25 if open_ else 0.05)
    x = np.diff(rng.standard_normal(len(tt) + 1))
    return x * np.exp(-tt * (12 if open_ else 90)) * 0.09 * g


def taiko(g=1.0):
    tt = tt_(1.2)
    f = 60 + 50 * np.exp(-tt * 12)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3.5)
    skin = onepole(rng.standard_normal(len(tt)), 0.15) * np.exp(-tt * 20) * 0.8
    return (body + skin) * g


def doumbek(kind, g=1.0):
    tt = tt_(0.35)
    if kind == "dum":
        f = 85 + 40 * np.exp(-tt * 20)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) * 0.8 * g
    x = np.sin(2 * np.pi * 620 * tt) * np.exp(-tt * 40) + rng.standard_normal(len(tt)) * np.exp(-tt * 60) * 0.5
    return x * 0.35 * g


def impact(d=2.5, g=1.0):
    tt = tt_(d)
    sub = np.sin(2 * np.pi * (32 + 70 * np.exp(-tt * 6)) * tt) * np.exp(-tt * 1.8)
    crack = onepole(rng.standard_normal(len(tt)), 0.5) * np.exp(-tt * 10) * 0.6
    return (sub + crack) * g


def braam(root, d=2.6, g=1.0):
    """Brassy cinematic hit: detuned saws through a closing filter."""
    tt = tt_(d)
    sig = np.zeros(len(tt))
    for f in (root, root * 1.5, root * 2):
        for det in (-0.6, 0, 0.7):
            ph = (f + det) * tt
            sig += 2 * (ph - np.floor(ph + 0.5))
    cut = 0.02 + 0.25 * np.exp(-tt * 2.5)
    y = onepole(onepole(sig, cut), cut)
    return y * env(d, 0.02, 1.2) * 0.22 * g


def whoosh(d=0.8, rising=True, g=1.0):
    m = int(d * SR)
    cut = np.linspace(0.01, 0.45, m) if rising else np.linspace(0.45, 0.01, m)
    y = onepole(rng.standard_normal(m), cut)
    return y * np.sin(np.linspace(0, np.pi, m)) ** 2 * 0.9 * g


def riser(d, g=1.0):
    m = int(d * SR)
    tt = np.arange(m) / SR
    tone = sum(np.sin(2 * np.pi * np.cumsum(np.linspace(f, f * 4, m)) / SR) for f in (180, 270)) * 0.08
    noise = onepole(rng.standard_normal(m), np.linspace(0.01, 0.5, m)) * 0.6
    return (tone + noise) * (tt / d) ** 2.2 * g


def reverse_cymbal(d=1.2, g=1.0):
    m = int(d * SR)
    x = np.diff(rng.standard_normal(m + 1)) * np.exp(-np.arange(m) / SR * 3)
    return x[::-1] * 0.25 * g


def pluck(freq, d=0.5, g=1.0, bright=1.0):
    """Oud-like pluck (Karplus–Strong)."""
    m = int(d * SR)
    period = int(SR / freq)
    buf = rng.uniform(-1, 1, period)
    out = np.zeros(m)
    for k in range(m):
        out[k] = buf[k % period]
        nxt = buf[(k + 1) % period]
        buf[k % period] = 0.5 * (buf[k % period] + nxt) * (0.994 if bright else 0.99)
    return out * 0.35 * g


def bell(freq, d=2.5, g=1.0):
    tt = tt_(d)
    partials = [(1, 1), (2.76, 0.4), (5.4, 0.2), (8.9, 0.08)]
    return sum(a * np.sin(2 * np.pi * freq * p * tt) * np.exp(-tt * (1.4 + p)) for p, a in partials) * 0.22 * g


def sub808(freq, d, g=1.0):
    tt = tt_(d)
    f = freq * (1 + 0.5 * np.exp(-tt * 30))
    return np.tanh(2.0 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(d, 0.005, 0.12) * 0.32 * g


def pad(notes, start, end, g, bright=0.08):
    length = end - start
    tt = tt_(length)
    sig = np.zeros(len(tt))
    for f in notes:
        for det in (-0.4, 0.4):
            ph = (f + det) * tt
            sig += 2 * (ph - np.floor(ph + 0.5))
    sig = onepole(sig, bright)
    place(sig * env(length, 0.6, 0.8) * g, start)


def stabs(notes, at, g=1.0):
    d = 0.22
    tt = tt_(d)
    sig = sum(2 * ((f * tt) - np.floor(f * tt + 0.5)) for f in notes)
    return onepole(sig, 0.25) * np.exp(-tt * 9) * 0.12 * g


# D minor / Hijaz palette
D2, A2, Bb2, C3, D3, F3, A3 = 73.42, 110.0, 116.54, 130.81, 146.83, 174.61, 220.0
HIJAZ = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33]

# ---------- 0 – 4.6: cold open ----------
place(impact(3.0), 0.0, 0.7)
pad([D2, A2, D3, F3], 0.0, CLASH + 0.3, 0.05, 0.03)
for k, at in enumerate(np.arange(0.4, 3.6, BEAT * 2)):
    place(taiko(), at, 0.5 + 0.1 * k)
place(riser(2.4), CLASH - 2.4, 0.9)
place(reverse_cymbal(1.4), CLASH - 1.4, 1.0)
for k in range(8):  # snare roll into the drop
    place(snare(0.6 + 0.05 * k), CLASH - 0.9 + k * 0.11, 0.6)

# ---------- 4.6 – 14.6: the clash (full beat) ----------
place(impact(2.5), CLASH, 1.0)
place(braam(D2), CLASH, 1.0)
bass_line = [D2, D2, Bb2 / 2, Bb2 / 2, C3 / 2, C3 / 2, A2 / 2, A2 / 2]
beats = np.arange(CLASH, RAMADAN - 0.5, BEAT)
for k, at in enumerate(beats):
    bar_pos = k % 4
    place(kick(), at, 0.95 if bar_pos in (0, 2) else 0.0)
    if bar_pos in (1, 3):
        place(snare(), at, 0.8)
    place(hat(), at + BEAT / 2, 0.9, pan=0.3)
    place(hat(0.6), at + BEAT / 4, 0.5, pan=-0.3)
    if k % 2 == 0:
        place(sub808(bass_line[(k // 2) % 8], BEAT * 1.9), at, 1.0)
    if bar_pos == 3:
        place(stabs([D3, F3, A3], at), at + BEAT / 2, 0.8, pan=0.2)
pad([D3, F3, A3], CLASH, RAMADAN, 0.035, 0.06)
place(whoosh(0.8), CLASH + 0.35, 0.8, pan=-0.7)          # Barça crest flies in
place(whoosh(0.8), CLASH + 2.05, 0.8, pan=0.7)           # Madrid crest flies in
place(riser(0.9), CLASH + 3.0, 0.7)
place(impact(2.5, 1.3), CLASH + 3.9, 1.0)                # collision
place(braam(Bb2 / 2), CLASH + 3.9, 1.0)
place(bell(587.33, 1.5), CLASH + 3.95, 0.5)
place(braam(D2, 3.0), CLASH + 4.6, 1.2)                  # "الكلاسيكو" title slam
place(impact(2.0), CLASH + 4.6, 0.8)
place(whoosh(0.6, rising=False), CLASH + 6.3, 0.6)
place(riser(1.2), RAMADAN - 1.2, 1.0)
place(reverse_cymbal(1.0), RAMADAN - 1.0, 1.0)

# ---------- 14.6 – 22.0: Ramadan (oriental half-time) ----------
place(impact(3.0), RAMADAN, 0.9)
place(bell(D3 * 2, 4.0), RAMADAN, 1.2)
place(bell(A3 * 2, 3.5), RAMADAN + 0.05, 0.6)
pad([D2, A2, D3, 185.0, A3], RAMADAN, PRODUCT, 0.05, 0.04)
dum_tek = ["dum", None, "tek", "tek", "dum", None, "tek", None]
for k, at in enumerate(np.arange(RAMADAN + 0.5, PRODUCT - 0.3, BEAT / 2)):
    kind = dum_tek[k % 8]
    if kind:
        place(doumbek(kind), at, 0.9, pan=-0.2 if kind == "tek" else 0)
melody = [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 5, 4, 2, 1, 0]
for k, idx in enumerate(melody):
    at = RAMADAN + 0.9 + k * BEAT * 0.75
    if at < PRODUCT - 0.6:
        place(pluck(HIJAZ[idx], 0.7), at, 0.9, pan=0.25 * np.sin(k))
for k in range(5):
    place(bell(880 + 220 * k, 1.2), RAMADAN + 3.4 + k * 0.08, 0.25, pan=-0.5 + 0.25 * k)
place(riser(1.4), PRODUCT - 1.4, 1.0)
place(whoosh(0.7), PRODUCT - 0.5, 0.9)

# ---------- 22.0 – 30.0: product (beat back, brighter) ----------
place(impact(2.0), PRODUCT, 0.9)
place(braam(D2 * 2, 2.0), PRODUCT, 0.6)
for k in range(8):  # sparkle cascade as the tube lands
    place(pluck(1174.66 * (1.122 ** k), 0.3), PRODUCT + 0.6 + k * 0.05, 0.6, pan=0.6 - 0.15 * k)
bass_line2 = [D2, D2, F3 / 4, F3 / 4, Bb2 / 2, Bb2 / 2, C3 / 2, A2 / 2]
for k, at in enumerate(np.arange(PRODUCT, END - 0.3, BEAT)):
    bar_pos = k % 4
    place(kick(), at, 0.9 if bar_pos in (0, 2) else 0.0)
    if bar_pos in (1, 3):
        place(snare(), at, 0.7)
    place(hat(), at + BEAT / 2, 0.8, pan=0.3)
    if k % 2 == 0:
        place(sub808(bass_line2[(k // 2) % 8], BEAT * 1.9), at, 0.9)
pad([D3, 185.0, A3, 293.66], PRODUCT, END, 0.03, 0.08)
for at in (PRODUCT + 2.1, PRODUCT + 3.0, PRODUCT + 4.5):  # feature badges pop
    place(pluck(880, 0.25), at, 1.0, pan=0.5)
    place(whoosh(0.3), at - 0.15, 0.4, pan=0.5)
place(riser(1.5), END - 1.5, 1.0)
place(reverse_cymbal(1.2), END - 1.2, 1.0)

# ---------- 30.0 – 36.5: end card ----------
place(impact(3.0, 1.2), END, 1.0)
place(braam(D2, 3.5), END, 1.2)
for k, at in enumerate(np.arange(END + BEAT * 2, END + 4.6, BEAT)):
    place(kick(), at, 0.85 if k % 2 == 0 else 0.0)
    if k % 4 in (1, 3):
        place(snare(), at, 0.6)
    place(hat(), at + BEAT / 2, 0.7)
for k in range(4):
    place(taiko(), END + 4.6 + k * 0.12, 0.6 + 0.1 * k)
place(impact(3.0, 1.3), END + 5.0, 1.0)
place(braam(D2, 3.0), END + 5.0, 1.0)
place(bell(587.33, 3.0), END + 5.05, 0.8)

# ---------- master ----------
mix = np.tanh(mix * 1.25) * 0.88
fade = np.clip(t / 0.05, 0, 1) * np.clip((DUR - t) / 1.2, 0, 1)
mix *= fade[:, None]
pcm = (mix * 32767).astype(np.int16)

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote {OUT}")
