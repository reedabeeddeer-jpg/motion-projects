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

## ai-tool

فيديو موشن جرافيك عن أداة الذكاء الاصطناعي: 15 ثانية، 1920×1080 (16:9)، 30fps، مع موسيقى ومؤثرات مولّدة برمجياً.

المشاهد: شبكة عصبية تتجمع في شريحة AI ← عنوان «أداة الذكاء الاصطناعي» ← محادثة تجريبية مع المساعد ← المزايا (كتابة، صور، برمجة، تحليل) ← الخاتمة «المستقبل بين يديك».

- `src/ai-tool.html`: الأنيميشن (Canvas).
- `scripts/soundtrack_ai.py`: الصوت في `output/ai-tool-soundtrack.wav`.

```bash
npm run ai:audio
npm run ai:render   # output/ai-tool.mp4
npm run ai:preview  # صور ثابتة في output/stills/ai-tool
```

## إعلان 10 ثوانٍ (`src/ad.html`)

خلفية بألوان متدرجة متحركة، وشعار يدخل من اليمين إلى اليسار مع صوت «ووش» ينتقل من السماعة اليمنى إلى الوسط، ثم اسم العلامة والشعار النصي وزر «اطلب الآن».

```bash
npm run ad:audio     # output/ad_soundtrack.wav
npm run ad:render    # output/ad.mp4
npm run ad:preview   # صور ثابتة في output/stills/ad
```

لاستخدام شعارك: ضع صورة PNG شفافة في `assets/logo.png`. النصوص قابلة للتعديل من `TEXT` في أعلى `src/ad.html`.

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

## calm (موشن هادئ)

فيديو تأمّلي 20 ثانية (1080p، 30fps): دائرة تتنفّس (شهيق / زفير) مع شفق وجزيئات ضوئية، وموسيقى محيطية هادئة بصوت منخفض جداً (ذروة ‎-18 dB).

```bash
npm run calm:audio     # output/calm.wav
npm run calm:preview   # output/stills/calm
npm run calm:render    # output/calm.mp4
```
## fashion-offer

إعلان عرض أسعار ملابس لمتجر **جكوك شي إن** (15 ثانية، 1920×1080، 30fps): الصورة على اليمين والجرافيك على اليسار، وخلفية تتغير من الليلكي إلى الذهبي ثم العنابي، مع تعليق صوتي من ElevenLabs وموسيقى ومؤثرات مولّدة برمجياً.

- `fashion-offer/src/offer.html`: الأنيميشن (Canvas)، والأسعار في أعلى السكربت.
- `fashion-offer/scripts/prepare_image.py`: يكبّر الصورة ويزيل خلفيتها (rembg) ويحفظ `assets/model-cutout.png`.
- `fashion-offer/scripts/prepare_talking.py`: يحوّل فيديو SadTalker (`assets/talking-raw.mp4`، الفتاة تتكلم مع مزامنة الشفاه على التعليق) إلى إطارات شفافة في `assets/talking/`.
- `fashion-offer/scripts/soundtrack.py`: الموسيقى والمؤثرات، ويدمج معها التعليق الصوتي `assets/audio/vo-short.mp3`.

```bash
pip install rembg && python3 fashion-offer/scripts/prepare_image.py
# talking head: SadTalker (github.com/OpenTalker/SadTalker) --preprocess full --size 256 على الصورة والتعليق المسرّع ×1.33
python3 fashion-offer/scripts/prepare_talking.py fashion-offer/assets/talking-raw.mp4
python3 fashion-offer/scripts/soundtrack.py
node scripts/render.mjs --src fashion-offer/src/offer.html --audio fashion-offer/output/soundtrack.wav --out fashion-offer/output/jakook-shein-offer.mp4
```

Fonts: Aref Ruqaa, Tajawal, Playfair Display (SIL OFL)، في `fashion-offer/assets/fonts`.
