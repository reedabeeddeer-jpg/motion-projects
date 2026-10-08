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

## موشن انفوجرافيك: الأمن السيبراني

فيديو 22 ثانية (1920×1080، 30fps) بطابع تقني (شاشة مراقبة، مطر ثنائي، انتقالات glitch) مع موسيقى ومؤثرات مولّدة برمجياً.

1. مقدمة: درع يُرسم وقفل يُغلق، ثم العنوان «الأمن السيبراني».
2. أرقام مقلقة: هجوم كل 39 ثانية، 95% من الاختراقات سببها خطأ بشري، 10.5 تريليون دولار تكلفة سنوية.
3. أبرز التهديدات: التصيّد، برامج الفدية، البرمجيات الخبيثة، كلمات المرور الضعيفة.
4. كيف تحمي نفسك؟ قائمة نصائح تُعلَّم تباعاً مع عدّاد «مستوى الأمان» يصل إلى 100%.
5. خاتمة: «أمانك الرقمي يبدأ منك».

- `src/cyber.html`: الأنيميشن (افتحه في المتصفح للمعاينة).
- `scripts/cyber_soundtrack.py`: الموسيقى والمؤثرات في `output/cyber-soundtrack.wav`.

```bash
npm run cyber:audio
npm run cyber:render    # output/cyber.mp4
npm run cyber:preview   # صور ثابتة في output/stills/cyber
```

الأرقام في مشهد الإحصاءات تقديرات شائعة في تقارير الأمن السيبراني (دراسة جامعة ماريلاند، تقديرات Cybersecurity Ventures لعام 2025)، ويمكن تعديلها من مصفوفة `STATS` في `src/cyber.html`.

## remotion-logo

مشروع Remotion: ظهور لوغو بحركة ناعمة مع نص عربي تحته، 10 ثوانٍ بدقة 1080p على خلفية متدرجة داكنة.

```bash
cd remotion-logo
npm install
npm run studio   # معاينة وتعديل
npm run render   # out/logo-reveal.mp4
```

النصوص قابلة للتعديل من `defaultProps` في `src/Root.tsx`. لاستخدام Chromium مثبت مسبقاً بدل التنزيل: اضبط `REMOTION_BROWSER` على مسار المتصفح.
