"""Removes the outer white background of a crest by flood-filling from the image border.

White areas enclosed by the crest (e.g. inside a ring or a shield quarter) are kept.
Usage: python3 scripts/cutout_crest.py in.png out.png [--scale 3]
"""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
scale = int(sys.argv[sys.argv.index("--scale") + 1]) if "--scale" in sys.argv else 3

im = Image.open(src).convert("RGBA")
im = im.resize((im.width * scale, im.height * scale), Image.LANCZOS)
a = np.asarray(im).astype(np.int32)
h, w = a.shape[:2]
# "whiteness": distance from pure white, 0 = white
dist = 255 * 3 - a[..., :3].sum(axis=2)
bg = np.zeros((h, w), bool)
q = deque([(y, x) for x in range(w) for y in (0, h - 1)] + [(y, x) for y in range(h) for x in (0, w - 1)])
while q:
    y, x = q.popleft()
    if bg[y, x] or dist[y, x] > 60:
        continue
    bg[y, x] = True
    for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
        if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx]:
            q.append((ny, nx))

alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
out = Image.fromarray(a.astype(np.uint8))
out.putalpha(alpha)
out.save(dst)
print(f"wrote {dst} {out.size}")
