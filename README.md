# motion-projects

فيديو موشن جرافيك (1920×1080، 30fps، 13 ثانية) مع موسيقى مولّدة برمجياً.

- `src/motion.html`: الأنيميشن (Canvas). افتحه في المتصفح للمعاينة المباشرة.
- `scripts/soundtrack.py`: يولّد الموسيقى والمؤثرات الصوتية في `output/soundtrack.wav`.
- `scripts/render.mjs`: يصيّر الفيديو إطاراً بإطار ويخرج `output/motion.mp4`.

```bash
npm install
npm run audio
npm run render     # output/motion.mp4
npm run preview    # صور ثابتة في output/stills
```

Font: Cairo (SIL OFL), في `assets/fonts`.

## الفيديو الرياضي

فيديو موشن جرافيك رياضي (1920×1080، 30fps، 12.5 ثانية) مع صوت مولّد برمجياً: عنوان، سباق على المضمار، بطاقات أرقام للكرات، وكأس ختامي.

- `src/sports.html`: الأنيميشن. `scripts/sports-soundtrack.py`: الصوت.
- الناتج الجاهز للتنزيل: `output/sports-motion.mp4` (الصوت: `output/sports-soundtrack.wav`).

```bash
npm run sports:audio && npm run sports:render
```

## remotion-logo

مشروع Remotion: ظهور لوغو بحركة ناعمة مع نص عربي تحته، 10 ثوانٍ بدقة 1080p على خلفية متدرجة داكنة.

```bash
cd remotion-logo
npm install
npm run studio   # معاينة وتعديل
npm run render   # out/logo-reveal.mp4
```

النصوص قابلة للتعديل من `defaultProps` في `src/Root.tsx`. لاستخدام Chromium مثبت مسبقاً بدل التنزيل: اضبط `REMOTION_BROWSER` على مسار المتصفح.
