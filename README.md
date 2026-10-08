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

## إعلان «جكوك شي» (15 ثانية، 1920×1080)

عرض أسعار (الحجاب 3,000 والقميص 7,000 دينار عراقي) مع خصم 50%. البنت على اليمين تتحرك وفمها يتزامن مع التعليق الصوتي، والجرافيك على اليسار، والخلفية تتغير خمس مرات.

- `src/promo.html`: الأنيميشن (Canvas).
- `assets/promo/`: الصورة، والصورة المفرّغة (rembg)، والتعليق الصوتي من ElevenLabs (`vo.mp3`).
- `scripts/promo_soundtrack.py`: الموسيقى الحماسية والمؤثرات ودمج الصوت، ويكتب `assets/promo/vo_env.js` لتحريك الفم.

```bash
python3 scripts/promo_soundtrack.py
node scripts/render.mjs --src src/promo.html --audio output/promo_soundtrack.wav --out output/jakook-shi-promo.mp4
```

Fonts: Reem Kufi و Aref Ruqaa (SIL OFL).
