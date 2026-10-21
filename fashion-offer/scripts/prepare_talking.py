"""Turns the SadTalker talking-head render into a transparent frame sequence for offer.html.

Usage: python3 fashion-offer/scripts/prepare_talking.py <sadtalker.mp4>

The SadTalker video ("full" preprocess) keeps the original photo framing, so each frame is upscaled and
cut out exactly like assets/model-cutout.png and written to assets/talking/f_0000.webp ... at 30 fps.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageFilter
from rembg import new_session, remove

ASSETS = Path(__file__).resolve().parent.parent / "assets"
OUT = ASSETS / "talking"
FPS = 30
SIZE = 1000

src = Path(sys.argv[1])
OUT.mkdir(exist_ok=True)
for old in OUT.glob("f_*.webp"):
    old.unlink()

session = new_session("isnet-general-use")
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(src), "-vf", f"fps={FPS}", f"{tmp}/%04d.png"], check=True)
    frames = sorted(Path(tmp).glob("*.png"))
    for i, f in enumerate(frames):
        im = Image.open(f).convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=3, percent=90, threshold=2))
        cut = remove(im, session=session)
        alpha = cut.getchannel("A").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
        cut.putalpha(alpha)
        cut.save(OUT / f"f_{i:04d}.webp", quality=90)
        if i % 30 == 0:
            print(f"frame {i}/{len(frames)}", flush=True)
print(f"wrote {len(frames)} frames to {OUT}")
