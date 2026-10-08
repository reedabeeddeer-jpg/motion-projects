"""Writes the voice loudness envelope (one value per video frame, 0..1) as a JS file for src/quran.html."""
import json, subprocess, sys
import numpy as np

src = sys.argv[1] if len(sys.argv) > 1 else "assets/audio/quran-voice.mp3"
out = sys.argv[2] if len(sys.argv) > 2 else "src/quran-envelope.js"
fps, sr = 30, 48000
pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
hop = sr // fps
n = len(x) // hop
rms = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1))
env = np.clip(rms / np.percentile(rms, 98), 0, 1) ** 0.7
# fast attack, slow release so the motion reads smoothly
sm, v = [], 0.0
for e in env:
    v = e if e > v else v * 0.82 + e * 0.18
    sm.append(round(float(v), 3))
with open(out, "w") as f:
    f.write("window.VOICE_ENV = " + json.dumps(sm) + ";\n")
print(f"{n} frames -> {out}")
