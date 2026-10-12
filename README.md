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

## العراق 3 - 0 الإمارات (خليجي 27)

فيديو موشن جرافيك لمباراة المنتخب العراقي والإماراتي في كأس الخليج 27 (1920×1080، 30fps، 22 ثانية):
مقدمة البطولة ← مواجهة العلمين ← الأهداف الثلاثة (زيدان إقبال، سيف رشيد، كرار نبيل) مع لوحة نتيجة تتحدّث ← النتيجة النهائية والهدافون ← ختام «أسود الرافدين».

- `src/iraq-uae.html`: الأنيميشن (أسماء الهدافين وتوقيتاتهم في مصفوفة `GOALS`).
- `scripts/iraq-uae-soundtrack.py`: أجواء الملعب، صافرة الحكم، هتاف الجمهور عند كل هدف، وإيقاع بمقام الحجاز.

```bash
npm run iraq-uae:audio
npm run iraq-uae:render   # output/iraq-uae.mp4
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
