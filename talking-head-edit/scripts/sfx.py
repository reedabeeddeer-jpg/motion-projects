"""Synthesizes the music bed and UI sound effects used by the Remotion edit.

Writes public/music.wav (length taken from public/edit.json), whoosh.wav, pop.wav, impact.wav.
The bed is a soft lo-fi pad + light beat that sits well under speech; Remotion ducks it while he talks.
"""
import json
import wave
from pathlib import Path

import numpy as np

SR = 48000
PUBLIC = Path(__file__).resolve().parent.parent / "public"
rng = np.random.default_rng(7)


def write(name, sig):
    sig = np.asarray(sig, dtype=np.float64)
    if sig.ndim == 1:
        sig = np.stack([sig, sig], axis=1)
    peak = np.abs(sig).max() or 1.0
    sig = sig / peak * 0.89
    with wave.open(str(PUBLIC / name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((sig * 32767).astype("<i2").tobytes())


def lowpass(x, cut):
    """One-pole lowpass with per-sample cutoff coefficients."""
    cut = np.broadcast_to(cut, x.shape)
    y = np.empty_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc += cut[k] * (x[k] - acc)
        y[k] = acc
    return y


def whoosh(d=0.55):
    m = int(d * SR)
    y = lowpass(rng.standard_normal(m), np.linspace(0.015, 0.35, m) ** 1.5)
    return y * np.sin(np.linspace(0, np.pi, m)) ** 2


def pop(freq=900, d=0.16):
    tt = np.arange(int(d * SR)) / SR
    f = freq * (1 + 0.5 * np.exp(-tt * 45))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 26)


def impact(d=1.4):
    tt = np.arange(int(d * SR)) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-tt * 9)) / SR) * np.exp(-tt * 3.2)
    noise = lowpass(rng.standard_normal(len(tt)), 0.08) * np.exp(-tt * 10) * 2
    return sub + noise


def music(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    mix = np.zeros((n, 2))
    bpm = 88
    beat = 60 / bpm
    # Am9 - Fmaj7 - Cmaj7 - G6, one chord per bar
    chords = [[110.0, 130.81, 164.81, 196.0, 246.94], [87.31, 130.81, 164.81, 174.61, 220.0],
              [130.81, 164.81, 196.0, 246.94], [98.0, 146.83, 164.81, 196.0]]
    bar = 4 * beat
    for b in range(int(dur / bar) + 1):
        notes = chords[b % 4]
        i0 = int(b * bar * SR)
        m = min(n - i0, int(bar * 1.25 * SR))
        if m <= 0:
            break
        tt = np.arange(m) / SR
        e = np.minimum(1, tt / 0.6) * np.exp(-tt * 0.35)
        for k, f in enumerate(notes):
            det = 1 + (k - 2) * 0.0015
            s = np.sin(2 * np.pi * f * det * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt + k)
            pan = 0.5 + 0.35 * np.sin(k * 1.7)
            mix[i0:i0 + m, 0] += s * e * (1 - pan) * 0.12
            mix[i0:i0 + m, 1] += s * e * pan * 0.12
        # soft sub bass on the root
        bass = np.sin(2 * np.pi * notes[0] / 2 * tt) * np.minimum(1, tt / 0.05) * np.exp(-tt * 1.2)
        mix[i0:i0 + m] += (bass * 0.35)[:, None]
    # light lo-fi kick + hat
    kick_t = np.arange(int(0.3 * SR)) / SR
    kick = np.sin(2 * np.pi * np.cumsum(48 + 90 * np.exp(-kick_t * 28)) / SR) * np.exp(-kick_t * 10)
    hat_t = np.arange(int(0.05 * SR)) / SR
    for k in range(int(dur / beat)):
        i = int(k * beat * SR)
        if k % 4 in (0, 2) and i + len(kick) < n:
            mix[i:i + len(kick)] += (kick * 0.45)[:, None]
        for off in (0.0, 0.5):
            j = int((k + off) * beat * SR)
            if j + len(hat_t) < n:
                h = np.diff(rng.standard_normal(len(hat_t) + 1)) * np.exp(-hat_t * 80) * (0.06 if off else 0.04)
                mix[j:j + len(h)] += h[:, None]
    # gentle tape warmth
    mix = np.tanh(mix * 1.2)
    fade = np.ones(n)
    fade[: int(1.5 * SR)] = np.linspace(0, 1, int(1.5 * SR))
    fade[-int(2.5 * SR):] = np.linspace(1, 0, int(2.5 * SR)) ** 2
    return mix * fade[:, None]


def main():
    edit = json.loads((PUBLIC / "edit.json").read_text())
    write("music.wav", music(edit["durationInFrames"] / edit["fps"] + 0.5))
    write("whoosh.wav", whoosh())
    write("pop.wav", pop())
    write("impact.wav", impact())
    print("audio assets written")


if __name__ == "__main__":
    main()
