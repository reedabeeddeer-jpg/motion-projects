"""Calm, percussion-free score for the Quran competition video: a low drone and choir-like "aah" pads
in Maqam Bayati on D, soft chimes on scene changes, ducked under the voice. Mixes voice + music.

Usage: python3 scripts/quran_music.py [voice.mp3] [out.wav]
"""
import subprocess, sys, wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
VOICE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "assets/audio/quran-voice.mp3"
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "output/quran-mix.wav"
SR, DUR = 44100, 20.0
n = int(SR * DUR)
t = np.arange(n) / SR
rng = np.random.default_rng(5)

# scene starts (s), matching SCENES in src/quran.html
CUES = [0.0, 2.95, 6.45, 9.15, 11.8, 13.4]
D2 = 73.42
note = lambda semis: D2 * 2 ** (semis / 12)
# Bayati on D (E half-flat = 1.5 semitones). Chords as semitone offsets from D2.
CHORDS = [
    [0, 12, 15, 19],        # D  F  A   (Dm)
    [8, 12, 15, 20],        # Bb D  F
    [10, 14, 17, 22],       # C  E  G   (lifts toward the call to register)
    [5, 12, 15, 17],        # G  D  F
    [8, 12, 15, 20],        # Bb D  F
    [0, 12, 15, 19, 24],    # D  F  A  D (resolve on the hadith)
]


def formant_gain(f):
    # soft "aah" vowel: formants near 700 Hz and 1150 Hz
    return np.exp(-((f - 700) / 260) ** 2) + 0.6 * np.exp(-((f - 1150) / 300) ** 2) + 0.25


def choir_note(freq, length, seed):
    r = np.random.default_rng(seed)
    m = int(length * SR)
    tt = np.arange(m) / SR
    out = np.zeros(m)
    for v in range(5):  # detuned voices
        det = freq * (1 + r.uniform(-0.006, 0.006))
        vib = 1 + 0.004 * np.sin(2 * np.pi * r.uniform(4.5, 5.5) * tt + r.uniform(0, 6.28))
        ph = 2 * np.pi * np.cumsum(det * vib) / SR
        for h in range(1, 14):
            if det * h > 5000:
                break
            out += np.sin(h * ph + r.uniform(0, 6.28)) * formant_gain(det * h) / h
    a, rel = int(1.4 * SR), int(1.6 * SR)
    e = np.ones(m)
    e[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    e[-rel:] *= np.cos(np.linspace(0, np.pi / 2, rel)) ** 2
    return out * e / 5


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    j = min(len(buf), i + len(sig))
    if j > i:
        buf[i:j] += sig[: j - i] * gain


mix = np.zeros(n)

# drone: D2 + A2 with slow breathing
breath = 0.75 + 0.25 * np.sin(2 * np.pi * 0.12 * t)
mix += 0.22 * breath * (np.sin(2 * np.pi * D2 * t) + 0.5 * np.sin(2 * np.pi * D2 * 1.5 * t) + 0.25 * np.sin(2 * np.pi * D2 * 2 * t))

# choir pads, overlapping across scene changes
pads = np.zeros(n)
for k, (start, chord) in enumerate(zip(CUES, CHORDS)):
    end = CUES[k + 1] if k + 1 < len(CUES) else DUR
    length = end - start + 1.6
    for j, s in enumerate(chord):
        place(pads, choir_note(note(s), length, 100 * k + j), max(0, start - 0.4), 0.16)
mix += pads

# a soft, slow Bayati phrase in the upper register (sine "ney"-like breath tone)
MELODY = [(0.8, 24, 1.6), (2.4, 25.5, 1.0), (3.4, 27, 1.8), (5.6, 29, 1.4), (7.1, 27, 1.2), (8.4, 25.5, 1.4),
          (10.0, 24, 1.6), (12.0, 29, 1.3), (13.4, 31, 1.6), (15.4, 29, 1.2), (16.8, 27, 1.0), (17.9, 25.5, 1.0), (19.0, 24, 1.0)]
for at, s, length in MELODY:
    m = int((length + 0.8) * SR)
    tt = np.arange(m) / SR
    f = note(s) * (1 + 0.006 * np.sin(2 * np.pi * 5 * tt) * np.clip(tt / 0.5, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.03 * rng.standard_normal(m)  # breathy
    e = np.clip(tt / 0.35, 0, 1) * np.exp(-np.clip(tt - length, 0, None) * 4)
    place(mix, tone * e, at, 0.07)

# soft chimes on scene changes
for at in CUES[1:]:
    m = int(3 * SR)
    tt = np.arange(m) / SR
    bell = sum(np.sin(2 * np.pi * note(36) * r * tt) * a for r, a in [(1, 1), (2.76, 0.4), (5.4, 0.15)])
    place(mix, bell * np.exp(-tt * 1.6), at - 0.15, 0.05)

# reverb: exponentially decaying noise impulse
ir_len = int(2.6 * SR)
ir = rng.standard_normal(ir_len) * np.exp(-np.arange(ir_len) / SR * 2.4)
ir[:int(0.02 * SR)] = 0
L = 1 << int(np.ceil(np.log2(n + ir_len)))
wet = np.fft.irfft(np.fft.rfft(mix, L) * np.fft.rfft(ir, L), L)[:n]
mix = 0.7 * mix + 0.3 * wet / (np.abs(wet).max() + 1e-9) * np.abs(mix).max()

# fades
mix *= np.clip(t / 1.2, 0, 1) * np.clip((DUR - t) / 1.5, 0, 1)
mix /= np.abs(mix).max() + 1e-9

# voice
pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(VOICE), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
voice = np.frombuffer(pcm, np.int16).astype(np.float64) / 32768
voice = np.pad(voice, (0, max(0, n - len(voice))))[:n]

# duck the music under the voice (smoothed envelope)
win = int(0.25 * SR)
venv = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode="same"))
venv = np.clip(venv / (np.percentile(venv, 95) + 1e-9), 0, 1)
duck = 1 - 0.45 * venv

music_gain = 0.22  # about -13 dB under the voice peak
out = voice * 0.95 + mix * duck * music_gain
out /= max(1.0, np.abs(out).max() / 0.97)

stereo = np.stack([out, out], 1)
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())
print(f"wrote {OUT.relative_to(ROOT)}")
