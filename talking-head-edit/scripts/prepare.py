"""Prepare footage for the Remotion edit.

Steps:
  1. Cut silences / stumbles (segment list below), mirror-fix, denoise, upscale to 1080p, colour grade.
  2. Cut the isolated voice track on the same frame boundaries and master it (EQ, compression, de-ess, loudness).
  3. Remove the background with u2net_human_seg + guided-filter edge refinement -> person.webm (VP9 + alpha).
  4. Detect gestures (big silhouette changes) -> motion events for the reactive graphics.
  5. Write public/edit.json (segments, captions with word timings, sections, events).

Usage:
  python scripts/prepare.py --video in.mp4 --voice voice_isolated.mp3 --model u2net_human_seg.onnx
"""

import argparse
import json
import subprocess
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort

FPS = 30
W, H = 1920, 1080
ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

# Kept ranges of the original recording (seconds). Everything else is silence or a stumble.
KEEP = [
    (0.55, 5.10),    # السلام عليكم ... الكرام
    (7.78, 8.62),    # اليوم...
    (10.74, 12.24),  # راح نسوي مقارنة
    (12.66, 15.70),  # بين Claude Code والـ ChatGPT
    (16.98, 18.74),  # راح نبلش بـ Claude Code
    (19.58, 23.62),  # أولاً ...
    (26.56, 30.66),  # ثانياً ...
    (33.08, 37.76),  # ثالثاً ...
    (39.04, 41.96),  # وهسه راح نبلش عن الـ ChatGPT
    (42.94, 44.16),  # أول: يخطط   (stumble "للمشـ آ الـ" removed)
    (45.36, 46.18),  # المشاهد
    (46.62, 47.70),  # السينمائية
    (48.64, 50.48),  # اثنين: يكتب prompt
    (50.90, 52.40),  # والأوامر الجاهزة
    (53.56, 58.20),  # الثالث ...
]

# Captions: tokens are (word index in transcript, display text or None to keep it).
CAPTIONS = [
    ([0, 1, 2, 3, 4], "Peace be upon you, and God's mercy and blessings"),
    ([5, 6, 7, 8, 9, 10], "How are you all? How's your health, dear viewers?"),
    ([11, 12, 13, 14], "Today, we're going to make a comparison"),
    ([15, 16, 17, 18, 19], "between Claude Code and ChatGPT"),
    ([20, 21, 22, 23, 24], "Let's start with Claude Code"),
    ([25, 26, 27, 28, 29, 30], "First: it inspects files, videos, images and audio"),
    ([31, (32, "ينشئ"), 33, 34, 35], "Second: it creates a motion graphics script"),
    ([36, 37, 38, 39, 40, 41], "Third: it executes coding tasks and tests the results"),
    ([42, 43, 44, 45, 46, 47], "Now, let's move on to ChatGPT"),
    ([(48, "أولًا:"), 49, 53, 54], "First: it plans cinematic scenes"),
    ([(55, "ثانيًا:"), 56, 57, 58, 59], "Second: it writes prompts and ready-made commands"),
    ([((60, 61), "ثالثًا:"), 62, 63, 64, 65, 66, 67], "Third: it helps you fix errors and improve animations"),
]

# Graphics cues, anchored on transcript words.
SECTIONS = {
    "versus": 15,  # "بين Claude Code والـ ChatGPT"
    "claude": 20,
    "chatgpt": 42,
}
POINTS = [
    {"side": "claude", "n": 1, "word": 25, "icon": "files", "ar": "يفحص الملفات والفيديو والصور والصوت", "en": "Inspects files, video, images & audio"},
    {"side": "claude", "n": 2, "word": 31, "icon": "motion", "ar": "ينشئ سكربت موشن جرافيك", "en": "Builds motion-graphics scripts"},
    {"side": "claude", "n": 3, "word": 36, "icon": "code", "ar": "ينفذ المهام البرمجية ويختبر النتائج", "en": "Runs coding tasks & tests results"},
    {"side": "chatgpt", "n": 1, "word": 48, "icon": "film", "ar": "يخطط للمشاهد السينمائية", "en": "Plans cinematic scenes"},
    {"side": "chatgpt", "n": 2, "word": 55, "icon": "prompt", "ar": "يكتب البرومبت والأوامر الجاهزة", "en": "Writes prompts & ready commands"},
    {"side": "chatgpt", "n": 3, "word": 60, "icon": "wrench", "ar": "يساعدك بحل الأخطاء وتحسين الحركات", "en": "Fixes errors & polishes motion"},
]
OUTRO_SECONDS = 4.0

GRADE = (
    "hflip,"  # selfie camera recorded mirrored (shirt text reads backwards)
    "hqdn3d=3:3:4:4,"
    f"scale={W}:{H}:flags=lanczos,"
    "curves=master='0/0 0.1/0.1 0.45/0.58 0.8/0.9 1/1',"
    "eq=contrast=1.08:saturation=0.96,"
    "colorbalance=rs=-0.04:bs=0.04:rm=-0.05:bm=0.03,"
    "unsharp=5:5:0.7"
)

VOICE_CHAIN = (
    "highpass=f=80,lowpass=f=15000,"
    "equalizer=f=250:t=q:w=1.2:g=-2.5,"
    "equalizer=f=3500:t=q:w=1.0:g=3,"
    "equalizer=f=10000:t=q:w=0.8:g=2,"
    "deesser=i=0.4,"
    "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=3dB,"
    "loudnorm=I=-15:TP=-1.5:LRA=7,"
    "aresample=48000"
)


def frames(segs):
    """Round to whole frames so audio and video cut on identical boundaries."""
    return [(round(a * FPS), round(b * FPS)) for a, b in segs]


def run(cmd):
    print("+", " ".join(str(c) for c in cmd)[:200])
    subprocess.run(cmd, check=True)


def cut_video_and_audio(video, voice, segs, tmp):
    n = len(segs)
    parts = []
    for i, (fa, fb) in enumerate(segs):
        a, b = fa / FPS, fb / FPS
        parts.append(f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{i}];")
        parts.append(
            f"[1:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,"
            f"afade=t=in:d=0.015,afade=t=out:st={b - a - 0.02:.3f}:d=0.02[a{i}];"
        )
    concat = "".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[vc][ac];"
    fc = "".join(parts) + concat + f"[vc]{GRADE},fps={FPS}[vo];[ac]{VOICE_CHAIN}[ao]"
    graded = tmp / "graded.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", voice, "-filter_complex", fc,
         "-map", "[vo]", "-an", "-c:v", "libx264", "-crf", "12", "-preset", "medium", "-pix_fmt", "yuv420p", str(graded),
         "-map", "[ao]", "-vn", "-c:a", "pcm_s16le", str(PUBLIC / "voice.wav")])
    return graded


class Matter:
    def __init__(self, model):
        self.sess = ort.InferenceSession(str(model), providers=["CPUExecutionProvider"])
        self.inp = self.sess.get_inputs()[0].name
        self.prev = None

    def prob(self, bgr):
        x = cv2.resize(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), (320, 320), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
        o = self.sess.run(None, {self.inp: x.transpose(2, 0, 1)[None].astype(np.float32)})[0][0, 0]
        return (o - o.min()) / (o.max() - o.min() + 1e-8)

    def alpha(self, bgr):
        p = self.prob(bgr)
        half = cv2.resize(bgr, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        p = cv2.resize(p, (W // 2, H // 2), interpolation=cv2.INTER_LINEAR)
        # temporal smoothing kills edge flicker; current frame dominates so fast hands are not left behind
        if self.prev is not None:
            p = 0.7 * p + 0.3 * self.prev
        self.prev = p
        g = cv2.ximgproc.guidedFilter(half, p.astype(np.float32), 6, 1e-3)
        g = np.clip((g - 0.12) / 0.76, 0, 1) ** 1.2  # tighten edges, avoid white-wall halo
        return cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR), p


def matte(graded, model):
    m = Matter(model)
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(graded), "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                           stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0",
                            "-crf", "20", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", "-auto-alt-ref", "0",
                            str(PUBLIC / "person.webm")], stdin=subprocess.PIPE)
    low_masks = []
    i = 0
    while True:
        buf = dec.stdout.read(W * H * 3)
        if len(buf) < W * H * 3:
            break
        bgr = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        a, p = m.alpha(bgr)
        bgra = np.dstack([bgr, (a * 255).astype(np.uint8)])
        enc.stdin.write(bgra.tobytes())
        low_masks.append(cv2.resize(p, (192, 108)) > 0.5)
        i += 1
        if i % 100 == 0:
            print(f"  matte frame {i}")
    enc.stdin.close()
    enc.wait()
    dec.wait()
    return np.array(low_masks)


def motion_events(masks, segs):
    """Gestures show up as large silhouette changes; report them with the changed region's centroid."""
    # never compare across a cut
    cut_frames = set(np.cumsum([b - a for a, b in segs]).tolist())
    lag = 4
    energy = np.zeros(len(masks))
    cents = [(0.5, 0.5)] * len(masks)
    for t in range(lag, len(masks)):
        if any(t - lag < c <= t for c in cut_frames):
            continue
        d = masks[t] ^ masks[t - lag]
        d[90:] = False  # ignore the bottom edge where the torso touches the frame
        energy[t] = d.mean()
        if d.any():
            ys, xs = np.nonzero(d)
            cents[t] = (float(xs.mean() / 192), float(ys.mean() / 108))
    energy = np.convolve(energy, np.ones(5) / 5, mode="same")
    events, last = [], -999
    thr = max(0.012, np.percentile(energy, 97))
    for t in range(len(energy)):
        if energy[t] > thr and t - last > FPS * 1.2 and energy[t] == energy[max(0, t - 6):t + 7].max():
            events.append({"frame": int(t), "x": cents[t][0], "y": cents[t][1], "strength": float(energy[t])})
            last = t
    print("  motion events:", [(e["frame"], round(e["strength"], 3)) for e in events])
    return events


def build_edit(segs, words, events):
    out_starts = np.concatenate([[0], np.cumsum([b - a for a, b in segs])[:-1]])
    total = int(sum(b - a for a, b in segs))

    def to_out(t):
        f = t * FPS
        for (a, b), o in zip(segs, out_starts):
            if a <= f <= b:
                return int(round(o + f - a))
        # inside a removed gap: snap to the start of the next kept segment
        for (a, b), o in zip(segs, out_starts):
            if f < a:
                return int(o)
        return total

    captions = []
    for toks, en in CAPTIONS:
        ws = []
        for tok in toks:
            idx, text = (tok if isinstance(tok, tuple) else (tok, None))
            i0, i1 = (idx if isinstance(idx, tuple) else (idx, idx))
            ws.append({"text": text or words[i0]["text"].rstrip(".،"),
                       "from": to_out(words[i0]["start"]), "to": to_out(words[i1]["end"])})
        captions.append({"words": ws, "en": en, "from": ws[0]["from"], "to": ws[-1]["to"]})
    # hold each caption until the next one starts (short gaps only)
    for c, n in zip(captions, captions[1:]):
        if n["from"] - c["to"] < FPS * 0.6:
            c["to"] = n["from"]
        else:
            c["to"] += int(FPS * 0.3)

    cuts = []
    for i, ((a, b), o) in enumerate(zip(segs, out_starts)):
        cuts.append({"from": int(o), "to": int(o + b - a)})

    return {
        "fps": FPS,
        "width": W,
        "height": H,
        "speechFrames": total,
        "durationInFrames": total + int(OUTRO_SECONDS * FPS),
        "cuts": cuts,
        "captions": captions,
        "sections": {k: to_out(words[i]["start"]) for k, i in SECTIONS.items()},
        "points": [{**p, "from": to_out(words[p["word"]]["start"])} for p in POINTS],
        "motion": events,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--voice", required=True, help="voice track, e.g. ElevenLabs voice-isolated audio")
    ap.add_argument("--model", required=True, help="u2net_human_seg.onnx")
    ap.add_argument("--tmp", default=str(ROOT / ".work"))
    args = ap.parse_args()
    tmp = Path(args.tmp)
    tmp.mkdir(exist_ok=True)
    PUBLIC.mkdir(exist_ok=True)

    words = json.loads((ROOT / "data" / "transcript.json").read_text())
    segs = frames(KEEP)
    graded = cut_video_and_audio(args.video, args.voice, segs, tmp)
    masks = matte(graded, args.model)
    events = motion_events(masks, segs)
    edit = build_edit(segs, words, events)
    (PUBLIC / "edit.json").write_text(json.dumps(edit, ensure_ascii=False, indent=1))
    print(f"done: {edit['speechFrames'] / FPS:.1f}s of speech (+{OUTRO_SECONDS}s outro)")


if __name__ == "__main__":
    main()
