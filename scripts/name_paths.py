"""Shape Arabic text with HarfBuzz and export each glyph contour as an SVG path (for Trim Path animation).
Usage: python3 scripts/name_paths.py FONT.ttf out.json [LINE ...]
"""
import sys, json, re
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

font_path, out = sys.argv[1], sys.argv[2]
LINES = sys.argv[3:] or ["أبا القاسم", "محمد رائد عبد الزهرة"]
tt = TTFont(font_path); gs = tt.getGlyphSet(); upm = tt["head"].unitsPerEm
blob = hb.Blob.from_file_path(font_path); face = hb.Face(blob); font = hb.Font(face)

def shape(text):
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    order = tt.getGlyphOrder(); x = 0; res = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        res.append((order[info.codepoint], x + pos.x_offset, pos.y_offset)); x += pos.x_advance
    return res, x

result = []
for text in LINES:
    glyphs, width = shape(text)
    contours = []
    for name, gx, gy in glyphs:
        pen = SVGPathPen(gs, ntos=lambda v: f"{v:.1f}")
        # flip Y, keep font units
        gs[name].draw(TransformPen(pen, (1, 0, 0, -1, gx, -gy)))
        for sub in re.findall(r"M[^M]*", pen.getCommands()):
            nums = [float(n) for n in re.findall(r"-?\d+\.?\d*", sub)]
            xs = nums[0::2]
            contours.append({"d": sub.strip(), "cx": sum(xs) / len(xs)})
    result.append({"text": text, "width": width, "contours": contours})
json.dump({"upm": upm, "ascent": tt["hhea"].ascent, "descent": tt["hhea"].descent, "lines": result}, open(out, "w"), ensure_ascii=False)
print([(len(l["contours"]), l["width"]) for l in result], upm)
