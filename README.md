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

## مقارنة ChatGPT ضد Claude

فيديو موشن جرافيك (1920×1080، 30fps، 25 ثانية): مواجهة افتتاحية، بطاقات تعريف، 5 جولات مع لوحة نتائج، ثم النتيجة ونصيحة الاختيار.

- `src/compare.html`: الأنيميشن. نصوص الجولات والحكم في كل جولة في مصفوفة `ROUNDS`.
- `scripts/compare_soundtrack.py`: الموسيقى والمؤثرات في `output/compare-soundtrack.wav`.

```bash
npm run compare:audio
npm run compare:render    # output/compare.mp4
npm run compare:preview   # صور ثابتة في output/stills/compare
```

التقييمات تقريبية وتعتمد على نوع الاستخدام، ولا تُستخدم الشعارات الرسمية (رموز G وC بدلاً منها).

## remotion-logo

مشروع Remotion: ظهور لوغو بحركة ناعمة مع نص عربي تحته، 10 ثوانٍ بدقة 1080p على خلفية متدرجة داكنة.

```bash
cd remotion-logo
npm install
npm run studio   # معاينة وتعديل
npm run render   # out/logo-reveal.mp4
```

النصوص قابلة للتعديل من `defaultProps` في `src/Root.tsx`. لاستخدام Chromium مثبت مسبقاً بدل التنزيل: اضبط `REMOTION_BROWSER` على مسار المتصفح.
