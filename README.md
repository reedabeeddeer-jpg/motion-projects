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

## remotion-logo

مشروع Remotion: ظهور لوغو بحركة ناعمة مع نص عربي تحته، 10 ثوانٍ بدقة 1080p على خلفية متدرجة داكنة.

```bash
cd remotion-logo
npm install
npm run studio   # معاينة وتعديل
npm run render   # out/logo-reveal.mp4
```

النصوص قابلة للتعديل من `defaultProps` في `src/Root.tsx`. لاستخدام Chromium مثبت مسبقاً بدل التنزيل: اضبط `REMOTION_BROWSER` على مسار المتصفح.

## quran-competition

فيديو ترويجي لمسابقة القرآن الكريم (1920×1080، 30fps، 20 ثانية): خلفية متدرجة متحركة بزخارف هندسية، والنص يظهر كلمة بكلمة متزامناً مع صوت معلّق (ElevenLabs، صوت Omar). الكلمة المنطوقة تتوهّج، والجرافيك يتفاعل مع شدة الصوت.

- `src/quran.html`: الأنيميشن وتوقيت الكلمات (`SCENES`).
- `assets/audio/quran-voice.mp3`: التعليق الصوتي.
- `scripts/voice_envelope.py`: يولّد `src/quran-envelope.js` (شدة الصوت لكل إطار).

```bash
python3 scripts/voice_envelope.py
node scripts/render.mjs --src src/quran.html --audio assets/audio/quran-voice.mp3 --out output/quran-competition.mp4
```

Font: Amiri (SIL OFL)، في `assets/fonts`.
