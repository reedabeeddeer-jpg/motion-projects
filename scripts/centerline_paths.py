"""Extract pen (centre-line) strokes for an Arabic phrase so it can be 'written' with a single moving stroke
(the Trim Paths idea from signature_write_on.jsx) and revealed through the glyph shapes.
Usage: python3 scripts/centerline_paths.py src/sahib_paths.json out.json [SIZE X0 BASE T0 T1]
Needs: numpy scipy scikit-image playwright (chromium in /opt/pw-browsers)
"""
import sys, json, glob, io, math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.morphology import skeletonize
from skimage.measure import find_contours, approximate_polygon
from playwright.sync_api import sync_playwright

src, out = sys.argv[1], sys.argv[2]
SIZE, X0, BASE, T0, T1 = [float(v) for v in sys.argv[3:8]] if len(sys.argv) > 7 else (330, 216, 610, 0.8, 6.6)
S = 2  # supersampling
P = json.load(open(src)); k = SIZE / P["upm"]
d_all = " ".join(c["d"] for c in P["lines"][0]["contours"])

svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" style="background:#000"><g transform="translate({X0} {BASE}) scale({k})"><path d="{d_all}" fill="#fff" fill-rule="nonzero"/></g></svg>'
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=glob.glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome")[0])
    pg = b.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=S)
    pg.set_content(f"<body style='margin:0;background:#000'>{svg}</body>")
    png = pg.screenshot(); b.close()
img = np.array(Image.open(io.BytesIO(png)).convert("L")).astype(float) / 255
mask = img > 0.5
lab, n = ndi.label(mask, structure=np.ones((3, 3)))
print("components:", n)
NB = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]

def contour_path(m):
    pad = np.pad(m.astype(float), 1)
    ds = []
    for c in find_contours(pad, 0.5):
        c = approximate_polygon(c, 0.35)
        ds.append("M" + " L".join(f"{(x-1)/S:.1f} {(y-1)/S:.1f}" for y, x in c) + "Z")
    return " ".join(ds)

def trace(comp):
    sk = skeletonize(comp)
    ys, xs = np.nonzero(sk); pix = set(zip(ys.tolist(), xs.tolist()))
    if not pix: return [], 0
    nb = lambda p: [(p[0]+a, p[1]+b) for a, b in NB if (p[0]+a, p[1]+b) in pix]
    node = {p for p in pix if len(nb(p)) != 2}
    # cluster node pixels
    cid, cl = {}, []
    for p in node:
        if p in cid: continue
        st = [p]; cid[p] = len(cl); mem = [p]
        while st:
            q = st.pop()
            for r in nb(q):
                if r in node and r not in cid: cid[r] = len(cl); st.append(r); mem.append(r)
        cl.append(mem)
    cen = [np.mean(m, axis=0) for m in cl]
    used, edges = set(), []
    def walk(start, first):
        path = [start, first]; prev, cur = start, first
        while cur not in node:
            used.add(cur)
            nxt = [r for r in nb(cur) if r != prev and r not in node or (r in node and r != prev and r not in cl[cid[start]])]
            nxt = [r for r in nxt if r not in used or r in node]
            if not nxt: break
            prev, cur = cur, nxt[0]; path.append(cur)
        return path, cur
    for p in node:
        for q in nb(p):
            if q in node or q in used: continue
            path, end = walk(p, q)
            if end in node: edges.append([cid[p], cid[end], path])
    if not node:  # pure loop / single pixel
        p0 = next(iter(pix)); path = [p0]; prev, cur = None, p0; seen = {p0}
        while True:
            nx = [r for r in nb(cur) if r not in seen]
            if not nx: break
            cur = nx[0]; seen.add(cur); path.append(cur)
        return [[path]], 0
    # prune short spurs
    for _ in range(2):
        deg = {}
        for a, b, _p in edges: deg[a] = deg.get(a, 0) + 1; deg[b] = deg.get(b, 0) + 1
        edges = [e for e in edges if not ((deg[e[0]] == 1 or deg[e[1]] == 1) and len(e[2]) < 14 and (deg[e[0]] >= 3 or deg[e[1]] >= 3))]
    inc = {}
    for i, (a, b, _p) in enumerate(edges): inc.setdefault(a, []).append(i); inc.setdefault(b, []).append(i)
    if not edges: return [[[tuple(np.round(cen[0]).astype(int))]]], 0
    leaves = [c for c, v in inc.items() if len(v) == 1] or list(inc)
    start = max(leaves, key=lambda c: cen[c][1])           # rightmost → Arabic writing starts at the right
    done, order = set(), []
    def pts(e, frm):
        a, b, p = edges[e]; pp = [tuple(cen[a])] + p[1:-1] + [tuple(cen[b])] if len(p) > 2 else [tuple(cen[a]), tuple(cen[b])]
        return (pp, b) if frm == a else (pp[::-1], a)
    def visit(c, dirv):
        while True:
            cand = [e for e in inc.get(c, []) if e not in done]
            if not cand: return
            def score(e):
                pp, _ = pts(e, c); v = np.array(pp[min(4, len(pp)-1)]) - np.array(pp[0]); nv = np.linalg.norm(v)
                return float(np.dot(v / (nv or 1), dirv))
            e = max(cand, key=score); done.add(e)
            pp, nxt = pts(e, c); order.append(pp)
            v = np.array(pp[-1]) - np.array(pp[max(len(pp)-5, 0)])
            visit(nxt, v / (np.linalg.norm(v) or 1))
    visit(start, np.array([0.0, -1.0]))
    return order, 0

comps = []
for i in range(1, n + 1):
    m = lab == i
    ys, xs = np.nonzero(m)
    h, w = (ys.max() - ys.min() + 1) / S, (xs.max() - xs.min() + 1) / S
    dt = ndi.distance_transform_edt(m)
    paths, _ = trace(m)
    if max(h, w) < SIZE * 0.2:  # diacritic dot: one pop-in stroke at its centre
        cy, cx = ndi.center_of_mass(m); paths = [[(cy, cx), (cy, cx + 1)]]
    comps.append({"i": i, "dot": bool(max(h, w) < SIZE * 0.2), "xr": xs.max() / S, "width": round(float(dt.max()) * 2 * 1.15 + 4, 1) / S * 1,
                  "mask": contour_path(m), "paths": paths, "area": int(m.sum())})
    print(i, "dot" if comps[-1]["dot"] else "body", "paths", len(paths), "w", comps[-1]["width"])

main = sorted([c for c in comps if not c["dot"]], key=lambda c: -c["xr"])
dots = sorted([c for c in comps if c["dot"]], key=lambda c: -c["xr"])
plen = lambda pp: sum(math.dist(pp[j], pp[j+1]) for j in range(len(pp)-1)) / S
def poly(pp):
    a = np.array([(x / S, y / S) for y, x in pp]); a = approximate_polygon(a, 0.6)
    return [[round(float(x), 1), round(float(y), 1)] for x, y in a]
total = sum(plen(pp) for c in main for pp in c["paths"])
GAP, DOT = 0.07, 0.14
tw = (T1 - T0) - GAP * len(main) - DOT * len(dots)
speed = total / tw
t = T0; res = []
for c in main + dots:
    edges = []
    for pp in c["paths"]:
        L = plen(pp) if len(pp) > 1 else 0.5
        dur = DOT if c["dot"] else max(L / speed, 0.04)
        pts = poly(pp) if len(pp) > 1 else [[pp[0][1] / S, pp[0][0] / S], [pp[0][1] / S + 0.5, pp[0][0] / S]]
        if len(pts) < 2: pts = [pts[0], [pts[0][0] + 0.5, pts[0][1]]]
        edges.append({"pts": pts, "t0": round(t, 3), "t1": round(t + dur, 3)}); t += dur
    t += GAP
    res.append({"dot": c["dot"], "width": c["width"], "mask": c["mask"], "edges": edges})
json.dump({"size": SIZE, "x0": X0, "base": BASE, "comps": res, "end": round(t, 2)}, open(out, "w"))
print("writing ends at", round(t, 2), "s")
