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

## greeting — «السلام عليكم أيها الرجل»

موشن جرافيك 6 ثوانٍ (1080p، 30fps) مع تعليق صوتي عربي من ElevenLabs (صوت Rawi – فصحى، نموذج eleven_multilingual_v2). المعادل الصوتي والتوهج يتحركان مع مستوى الصوت.

- `output/voice/salam-alaykum.mp3`: التعليق الصوتي الأصلي.
- `output/voice/greeting-track.wav`: الصوت مؤخَّر 1.2 ثانية وممدود إلى 6 ثوانٍ.
- `src/greeting.html`: الأنيميشن.
- `output/greeting.mp4`: الفيديو النهائي.

```bash
ffmpeg -y -i output/voice/salam-alaykum.mp3 -af "adelay=1200,apad=whole_dur=6" -ar 44100 -ac 2 output/voice/greeting-track.wav
node scripts/render.mjs --src src/greeting.html --audio output/voice/greeting-track.wav --out output/greeting.mp4
```
