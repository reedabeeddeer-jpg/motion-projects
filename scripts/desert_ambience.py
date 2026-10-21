#!/usr/bin/env python3
"""Desert ambience for src/desert-thirst.html: gusting wind, low drone, heartbeat that speeds up as he collapses."""
import math, random, struct, wave
RATE, DUR = 48000, 5.0
n = int(RATE * DUR); random.seed(3)
out = [0.0] * n
lp1 = lp2 = 0.0
for i in range(n):
    t = i / RATE
    # wind: low-passed noise with slow gusts
    w = random.uniform(-1, 1)
    cut = 0.02 + 0.03 * (0.5 + 0.5 * math.sin(t * 1.3))
    lp1 += cut * (w - lp1); lp2 += cut * (lp1 - lp2)
    gust = 0.55 + 0.45 * math.sin(t * 0.9 + 1) ** 2
    s = lp2 * 3.2 * gust
    # low, uneasy drone
    s += 0.06 * math.sin(2 * math.pi * 55 * t) * min(1, t / 1.5) + 0.03 * math.sin(2 * math.pi * 58.3 * t)
    out[i] = s
# heartbeat: lub-dub, faster toward the end
beat, t = 0, 1.0
while t < DUR:
    for off, amp in ((0, 0.55), (0.16, 0.38)):
        start = int((t + off) * RATE)
        for k in range(int(0.12 * RATE)):
            j = start + k
            if j >= n: break
            tt = k / RATE
            out[j] += amp * min(1, (t - 1.0) / 2 + 0.3) * math.sin(2 * math.pi * 48 * tt) * math.exp(-tt * 28)
    t += max(0.55, 0.95 - beat * 0.06); beat += 1
fade = int(0.08 * RATE)
for i in range(fade): out[i] *= i / fade; out[-1 - i] *= i / fade
peak = max(abs(x) for x in out)
with wave.open("output/desert-thirst-ambience.wav", "wb") as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(RATE)
    f.writeframes(b"".join(struct.pack("<h", int(x / peak * 0.6 * 32767)) for x in out))
print("wrote output/desert-thirst-ambience.wav")
