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

## ramadan-clasico — كلاسيكو رمضان × Signal

مشهد موشن جرافيك كامل مدته 20 ثانية (1920×1080، 30fps) مع موسيقى ومؤثرات صوتية مولّدة برمجياً.

| الوقت | المشهد |
|---|---|
| 0–3.4 ث | خلفية متدرجة + عنوان حركي «ليلة الكلاسيكو» ثم يندفع نحو الكاميرا |
| 3.4–8 ث | دخول شعاري برشلونة وريال مدريد، اصطدام مع موجة صدمة وشرارات واهتزاز كاميرا، ظهور VS |
| 8–13.4 ث | انتقال بوميض وخطوط سرعة إلى إطار رمضان: فوانيس متوهجة، «رمضان كريم» بتدرج ذهبي ولمعة |
| 13.4–18 ث | انتقال دائري ذهبي إلى المنتج: أنبوب Signal مع لمعة وفقاعات وشارات المزايا |
| 18–20 ث | البطاقة الختامية ثم تلاشٍ للأسود |

```bash
npm run ramadan-clasico:audio    # output/ramadan-clasico-soundtrack.wav
npm run ramadan-clasico:render   # output/ramadan-clasico.mp4
```

الصور في `ramadan-clasico/assets` (أُزيلت الخلفية البيضاء من المنتج والشعارات). المعاينة المباشرة: افتح `ramadan-clasico/motion.html` في Chromium مع `--allow-file-access-from-files`.
