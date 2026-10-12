"""Upscales the source photo and cuts the model out of its background -> assets/model-cutout.png."""
from pathlib import Path

from PIL import Image, ImageFilter
from rembg import new_session, remove

ASSETS = Path(__file__).resolve().parent.parent / "assets"

im = Image.open(ASSETS / "model-original.jpg").convert("RGB")
im = im.resize((1000, 1000), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=3, percent=90, threshold=2))
cut = remove(im, session=new_session("isnet-general-use"))
# tighten the matte slightly to drop the halo left from the sea background
alpha = cut.getchannel("A").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
cut.putalpha(alpha)
cut.save(ASSETS / "model-cutout.png")
print("wrote", ASSETS / "model-cutout.png")
