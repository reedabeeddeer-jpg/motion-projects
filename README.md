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

## fashion-offer

إعلان عرض أسعار ملابس لمتجر **جكوك شي إن** (15 ثانية، 1920×1080، 30fps): الصورة على اليمين والجرافيك على اليسار، وخلفية تتغير من الليلكي إلى الذهبي ثم العنابي، مع تعليق صوتي من ElevenLabs وموسيقى ومؤثرات مولّدة برمجياً.

- `fashion-offer/src/offer.html`: الأنيميشن (Canvas)، والأسعار في أعلى السكربت.
- `fashion-offer/scripts/prepare_image.py`: يكبّر الصورة ويزيل خلفيتها (rembg) ويحفظ `assets/model-cutout.png`.
- `fashion-offer/scripts/soundtrack.py`: الموسيقى والمؤثرات، ويدمج معها التعليق الصوتي `assets/audio/vo-short.mp3`.

```bash
pip install rembg && python3 fashion-offer/scripts/prepare_image.py
python3 fashion-offer/scripts/soundtrack.py
node scripts/render.mjs --src fashion-offer/src/offer.html --audio fashion-offer/output/soundtrack.wav --out fashion-offer/output/jakook-shein-offer.mp4
```

Fonts: Aref Ruqaa, Tajawal, Playfair Display (SIL OFL)، في `fashion-offer/assets/fonts`.
