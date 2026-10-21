# Claude Opus 5.5 — launch film

An 18-second cinematic launch film built with [HyperFrames](https://hyperframes.heygen.com).
Rendered at 2560×1440, 60 fps.

Everything is made from code: no images, no stock footage, no AI-generated media.

- **Picture:** `index.html` is one HyperFrames composition. The particle nebula, light rays,
  hyperspace streaks and film grain are drawn on canvas from seeded hash functions. The Claude
  mark, the reasoning network and the dashboard tiles are SVG generated in JavaScript. Motion is
  one paused GSAP timeline, so every frame depends only on its timestamp.
- **Sound:** `score.py` synthesizes the score with numpy (oscillators, seeded noise, a
  convolution reverb built from decaying noise). No samples or recordings.
- **Type:** Inter Display and Inter (titles, Latin), Cairo (Arabic), DejaVu Sans Mono (code).
  These are open-licence font files bundled in `fonts/`.

## Shot list

| Time | Scene |
| --- | --- |
| 0.0–3.0 | Cold open: "كل فكرة عظيمة / تبدأ بسؤال". Particles spiral into a core of light |
| 3.0–6.4 | Ignition: the mark bursts out of the core, with shockwaves and light rays. "الجيل الجديد من Claude" |
| 6.4–10.4 | Three capability beats: reasoning network, live code, vision grid |
| 10.4–13.6 | Hyperspace jump, then "OPUS 5.5" swings in with a light sweep |
| 13.6–18.0 | Lockup: mark + Claude, Opus 5.5, tagline, "متاح الآن". The letterbox opens and particles settle into an orbit |

## Commands

```bash
npm install
npm run audio      # regenerate audio/score.wav
npm run check      # lint + runtime + layout + contrast
npm run snapshot   # stills at key moments
npm run render     # renders/claude-opus-5-5-launch.mp4 (2560x1440, 60 fps)
```
