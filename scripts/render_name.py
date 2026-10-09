"""Render src/name-signature.html (1920x1080, 30fps, 15 s) frame by frame and mux with the echo voice-over.
Usage: python3 scripts/render_name.py AUDIO.wav OUT.mp4 [--preview t1,t2,...]
"""
import sys, json, subprocess, pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
audio, out = sys.argv[1], sys.argv[2]
preview = sys.argv[sys.argv.index("--preview") + 1].split(",") if "--preview" in sys.argv else None
FPS = 30
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=__import__("glob").glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome")[0]); pg = b.new_page(viewport={"width": 1920, "height": 1080})
    pg.add_init_script("window.PATHS=" + (root / "src/name_paths.json").read_text())
    pg.goto((root / "src/name-signature.html").as_uri())
    if preview:
        for t in preview:
            pg.evaluate(f"render({t})"); pg.screenshot(path=f"{out}_t{t}.png")
        b.close(); sys.exit()
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-i", "-",
        "-i", audio, "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
        "-t", "15", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for i in range(15 * FPS):
        pg.evaluate(f"render({i / FPS})")
        ff.stdin.write(pg.screenshot(type="png"))
    ff.stdin.close(); ff.wait(); b.close()
