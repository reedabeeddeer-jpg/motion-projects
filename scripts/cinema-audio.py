"""Builds output/cinema-audio.wav (15 s, stereo): Arabic voice-over + synthesized epic score and SFX.
Voice-over clips come from assets/vo/l1..l5.mp3 (ElevenLabs, Arabic male). Needs ffmpeg + numpy."""
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
VO = ROOT / "assets" / "vo"
OUT = ROOT / "output" / "cinema-audio.wav"
SR = 44100
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(11)

# ---------------------------------------------------------------- helpers
mus = np.zeros((2, N))   # music bus
sfx = np.zeros((2, N))   # sfx bus
voc = np.zeros((2, N))   # voice (dry)
vsend = np.zeros(N)      # voice reverb send


def put(bus, sig, at, gain=1.0, pan=0.0):
    """pan -1..1 (equal-power)."""
    i = int(at * SR)
    if i >= N or i + len(sig) <= 0:
        return
    a, b = max(0, -i), min(len(sig), N - i)
    ang = (pan + 1) * np.pi / 4
    bus[0, i + a:i + b] += sig[a:b] * gain * np.cos(ang)
    bus[1, i + a:i + b] += sig[a:b] * gain * np.sin(ang)


def tt(d):
    return np.arange(int(d * SR)) / SR


def env(d, a, r, curve=2.0):
    e = np.ones(int(d * SR))
    ai, ri = int(a * SR), int(r * SR)
    if ai:
        e[:ai] = np.linspace(0, 1, ai) ** 1.5
    if ri:
        e[-ri:] *= np.linspace(1, 0, ri) ** curve
    return e


def sweep_noise(d, f0, f1, bw=0.6, seed=0):
    """Band-limited noise whose centre frequency glides f0->f1 (log), via STFT."""
    r = np.random.default_rng(seed)
    n = int(d * SR)
    x = r.standard_normal(n + 4096)
    win, hop = 2048, 512
    w = np.hanning(win)
    out = np.zeros(n + 4096)
    freqs = np.fft.rfftfreq(win, 1 / SR)
    for s in range(0, n, hop):
        k = s / max(1, n - 1)
        fc = np.exp(np.log(f0) + (np.log(f1) - np.log(f0)) * k)
        m = np.exp(-0.5 * (np.log(np.maximum(freqs, 1) / fc) / bw) ** 2)
        seg = np.fft.irfft(np.fft.rfft(x[s:s + win] * w) * m)
        out[s:s + win] += seg * w
    out = out[:n]
    return out / (np.abs(out).max() + 1e-9)


def lowpass_noise(d, fc, seed=0):
    r = np.random.default_rng(seed)
    n = int(d * SR)
    X = np.fft.rfft(r.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    X *= 1 / (1 + (f / fc) ** 4)
    y = np.fft.irfft(X, n)
    return y / (np.abs(y).max() + 1e-9)


def reverb_ir(d=3.2, seed=1, damp=3500.0):
    r = np.random.default_rng(seed)
    n = int(d * SR)
    t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-t * (6.9 / d))
    X = np.fft.rfft(ir)
    f = np.fft.rfftfreq(n, 1 / SR)
    X *= 1 / (1 + (f / damp) ** 2)
    ir = np.fft.irfft(X, n)
    ir[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
    return ir / np.sqrt((ir ** 2).sum())


def convolve(x, ir):
    n = len(x) + len(ir)
    m = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[: len(x)]


def saw_pad(freq, d, harm=10):
    t = tt(d)
    y = np.zeros_like(t)
    for dc in (-7, 0, 6):
        f = freq * 2 ** (dc / 1200)
        for h in range(1, harm + 1):
            y += np.sin(2 * np.pi * f * h * t + dc) / h ** 1.6
    return y / 4


# ---------------------------------------------------------------- music
# drone: A1 + E2, swells towards the impact, tails off at the end
t = np.arange(N) / SR
swell = np.interp(t, [0, 3, 8, 11.8, 12.2, 15], [0.1, 0.35, 0.55, 0.85, 1.0, 0.35])
drone = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 55.4 * t) + 0.35 * np.sin(2 * np.pi * 82.4 * t + 1)) * swell
drone *= 1 + 0.08 * np.sin(2 * np.pi * 0.17 * t)
put(mus, drone, 0, 0.17)

# pad chords: Am | F | C | G (3.75 s each, overlapped)
chords = [
    [110, 164.8, 220, 261.6, 329.6],
    [87.3, 130.8, 174.6, 220, 261.6],
    [130.8, 196, 261.6, 329.6, 392],
    [98, 146.8, 196, 246.9, 293.7],
]
for ci, ch in enumerate(chords):
    start = ci * 3.75 - 0.3
    d = 4.9
    e = env(d, 1.4, 1.6, 1.0) * np.interp(start + tt(d), [0, 6, 12, 15], [0.35, 0.6, 1.0, 0.7])
    for k, f in enumerate(ch):
        y = saw_pad(f, d)
        y *= 0.5 + 0.5 * np.sin(2 * np.pi * (0.1 + 0.03 * k) * tt(d) + k)  # slow shimmer
        put(mus, y * e, max(0, start), 0.05, pan=(k - 2) * 0.22)
# the last chord keeps ringing into the fade-out
put(mus, saw_pad(98, 3.0) * env(3.0, 0.2, 2.6, 1.0), 12.0, 0.07)

# driving low ostinato (eighths @ 120 BPM) from the strip shot to the build
notes = [55, 55, 82.4, 55, 65.4, 65.4, 98, 65.4]
step = 0.25
for k, st in enumerate(np.arange(3.0, 12.0, step)):
    f = notes[k % len(notes)]
    d = 0.32
    tn = tt(d)
    y = (np.sin(2 * np.pi * f * tn) + 0.4 * np.sin(2 * np.pi * f * 2 * tn) + 0.2 * np.sin(2 * np.pi * f * 3 * tn)) * np.exp(-tn * 9)
    lvl = np.interp(st, [3, 6, 9, 12], [0.10, 0.17, 0.26, 0.34])
    put(mus, y, st, lvl, pan=0.0)

# taiko / timpani
def taiko(gain=1.0, f0=95, f1=48, d=0.9):
    tn = tt(d)
    ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-tn * 14)) / SR
    body = np.sin(ph) * np.exp(-tn * 5.5)
    click = lowpass_noise(d, 2500, 5) * np.exp(-tn * 60) * 0.35
    return (body + click) * gain

for at, g in [(3.0, 0.5), (6.0, 0.55), (7.95, 0.5), (10.0, 1.0)]:
    put(mus, taiko(g), at, 0.5)
for at, g in zip(np.linspace(10.5, 12.0, 12), np.linspace(0.3, 0.9, 12)):
    put(mus, taiko(g, 110, 60, 0.5), at, 0.4, pan=np.sin(at * 9) * 0.3)

# riser into the impact (noise + sine glide)
rs = sweep_noise(3.2, 500, 9000, 0.55, 3) * (np.linspace(0, 1, int(3.2 * SR)) ** 2.2)
put(mus, rs, 9.0, 0.5)
glide = np.sin(2 * np.pi * np.cumsum(np.geomspace(180, 1500, int(3.2 * SR))) / SR) * np.linspace(0, 1, int(3.2 * SR)) ** 2.5
put(mus, glide, 9.0, 0.09)

# ---------------------------------------------------------------- sfx
def whoosh(d, f0, f1, g, at, pan0=-0.7, pan1=0.7, seed=1):
    y = sweep_noise(d, f0, f1, 0.7, seed) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 1.5
    n = len(y)
    pans = np.linspace(pan0, pan1, n)
    ang = (pans + 1) * np.pi / 4
    i = int(at * SR)
    j = min(N, i + n)
    sfx[0, i:j] += (y * np.cos(ang) * g)[: j - i]
    sfx[1, i:j] += (y * np.sin(ang) * g)[: j - i]

whoosh(0.7, 300, 5000, 0.55, 2.7, -0.8, 0.8, 1)      # into shot 2
whoosh(0.9, 400, 6000, 0.6, 3.5, 0.6, -0.6, 2)       # strip unfurls
whoosh(0.7, 500, 7000, 0.6, 5.5, -0.7, 0.7, 3)       # orbit whip to the lens
whoosh(1.1, 150, 7000, 0.75, 7.0, -0.2, 0.2, 4)      # flight through the lens
whoosh(0.6, 5000, 300, 0.5, 9.65, 0.5, -0.5, 5)      # out of the sunset
whoosh(0.9, 300, 6000, 0.45, 10.4, -0.8, 0.8, 6)     # convergence
whoosh(0.8, 200, 8000, 0.45, 11.2, 0.8, -0.8, 7)

# projector / film transport
for tk in np.concatenate([np.cumsum(np.interp(np.arange(0, 90), [0, 30, 90], [1 / 70, 1 / 40, 1 / 24])) + 3.0,
                          3.0 + 1.5 + np.arange(0, 3.4, 1 / 24)]):
    if tk > 6.9:
        continue
    d = 0.02
    tn = tt(d)
    click = lowpass_noise(d, 4000, int(tk * 100) % 97) * np.exp(-tn * 220) * (0.5 + rng.random() * 0.5)
    click += np.sin(2 * np.pi * 70 * tn) * np.exp(-tn * 160) * 0.5
    f = np.interp(tk, [3.0, 3.4, 6.4, 6.9], [0, 1, 1, 0])
    put(sfx, click, tk, 0.16 * f, pan=rng.uniform(-0.3, 0.3))
motor = np.sin(2 * np.pi * 96 * t + 2 * np.sin(2 * np.pi * 24 * t)) * np.interp(t, [2.0, 3.4, 6.4, 7.0], [0, 0.04, 0.04, 0])
motor += np.sin(2 * np.pi * 48 * t) * np.interp(t, [2.0, 3.4, 6.4, 7.0], [0, 0.05, 0.05, 0])
sfx[0] += motor; sfx[1] += motor

# camera power-up hum + red tally blip near 2 s
hum = np.sin(2 * np.pi * np.geomspace(60, 240, int(1.3 * SR)).cumsum() / SR) * np.linspace(0, 1, int(1.3 * SR)) ** 2 * 0.08
put(sfx, hum, 1.4, 1.0)

# glint shimmer on the lens (6.1-7.3) and bell at the flash (7.95)
def bell(f, d, g, at, partials=(1, 2.01, 2.76, 4.1, 5.43)):
    tn = tt(d)
    y = sum(np.sin(2 * np.pi * f * p * tn) * np.exp(-tn * (1.2 + 0.9 * k)) / (1 + 0.6 * k) for k, p in enumerate(partials))
    put(sfx, y * g, at, 1.0, pan=0.0)

bell(2200, 1.6, 0.05, 6.4)
bell(3300, 1.4, 0.04, 6.75, (1, 1.5, 2.3))
bell(880, 2.6, 0.12, 7.95)
bell(1320, 2.6, 0.08, 7.97)

# IMPACT at 12.2
def boom(at):
    d = 3.2
    tn = tt(d)
    ph = 2 * np.pi * np.cumsum(38 + 60 * np.exp(-tn * 6)) / SR
    sub = np.sin(ph) * np.exp(-tn * 1.1)
    thud = lowpass_noise(d, 400, 8) * np.exp(-tn * 3.5) * 0.9
    crack = lowpass_noise(0.6, 9000, 9) * np.exp(-tt(0.6) * 12)
    crack = np.pad(crack, (0, len(tn) - len(crack)))
    ring = sum(np.sin(2 * np.pi * f * tn) * np.exp(-tn * (1.5 + i * 0.4)) / (i + 2) for i, f in enumerate((180, 273, 411, 625, 999)))
    braam = (saw_pad(55, d, 14) + 0.7 * saw_pad(82.4, d, 14)) * np.exp(-tn * 1.2) * np.minimum(1, tn * 20)
    y = sub * 1.2 + thud + crack * 0.7 + ring * 0.35 + braam * 0.5
    put(sfx, y, at, 0.55)
boom(12.2)
bell(440, 4.5, 0.12, 12.2, (1, 2, 3.01, 4.02, 5.99))
bell(660, 4.5, 0.09, 12.25, (1, 2, 3, 4.02))
bell(880, 4.0, 0.07, 12.3, (1, 2.01, 3.0))

# air / dust ambience + high shimmer pad under the logo
air = lowpass_noise(DUR, 2500, 12) * 0.02 * np.interp(t, [0, 1, 14, 15], [0.3, 1, 1, 0])
sfx[0] += air; sfx[1] += np.roll(air, 441)
shim = sum(np.sin(2 * np.pi * f * t + k) * (0.5 + 0.5 * np.sin(2 * np.pi * (0.3 + k * 0.07) * t)) for k, f in enumerate((880, 1318.5, 1760, 2637))) * np.interp(t, [12.2, 13.2, 14.4, 15], [0, 0.012, 0.012, 0])
sfx[0] += shim; sfx[1] += np.roll(shim, 300)

# ---------------------------------------------------------------- voice-over
FX = "highpass=f=75,equalizer=f=130:t=q:w=1:g=3,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-22dB:ratio=3.5:attack=5:release=90:makeup=5"
slots = [  # file, start, tempo, reverb send
    ("l1", 0.35, 1.0, 0.45),
    ("l2", 3.20, 1.2, 0.35),
    ("l3", 6.60, 1.12, 0.35),
    ("l4", 10.80, 1.08, 0.40),
    ("l5", 13.25, 1.10, 0.65),
]
for name, at, tempo, send in slots:
    tmp = VO / f"{name}_fx.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(VO / f"{name}.mp3"),
                    "-af", f"silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03:stop_periods=-1:stop_duration=0.3:stop_threshold=-45dB:stop_silence=0.18,atempo={tempo},{FX}",
                    "-ar", str(SR), "-ac", "1", str(tmp)], check=True)
    with wave.open(str(tmp)) as w:
        y = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
    put(voc, y, at, 1.0)
    i = int(at * SR)
    vsend[i:i + len(y)] += y[: N - i] * send
    print(f"{name}: {at:.2f}-{at + len(y) / SR:.2f}s")

# ---------------------------------------------------------------- mix
ir_l, ir_r = reverb_ir(3.4, 1), reverb_ir(3.4, 2)
vrev = np.stack([convolve(vsend, ir_l), convolve(vsend, ir_r)])
music_rev = np.stack([convolve(mus[0], ir_l), convolve(mus[1], ir_r)]) * 0.35
sfx_rev = np.stack([convolve(sfx[0], ir_l), convolve(sfx[1], ir_r)]) * 0.28

# duck music + sfx slightly under the voice
vo_env = np.abs(voc.sum(0))
k = int(0.08 * SR)
vo_env = np.convolve(vo_env, np.ones(k) / k, "same")
vo_env = np.convolve(vo_env, np.hanning(int(0.25 * SR)) / np.hanning(int(0.25 * SR)).sum(), "same")
duck = 1 - 0.38 * np.clip(vo_env / (vo_env.max() * 0.35), 0, 1)

mix = (mus + music_rev) * duck * 1.0 + (sfx + sfx_rev) * (1 - 0.12 * (1 - duck) / 0.38) + voc * 1.35 + vrev * 0.5
# master: fade in/out, gentle saturation, normalise
mix *= np.interp(t, [0, 0.4, 14.3, 15.0], [0, 1, 1, 0])
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix *= 0.89 / np.abs(mix).max()
OUT.parent.mkdir(exist_ok=True)
pcm = (mix.T * 32767).astype(np.int16)
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("wrote", OUT, f"{DUR}s")
