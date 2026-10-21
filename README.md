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

## الذكاء الاصطناعي (4K)

فيديو موشن جرافيك بدقة **4K (3840×2160)**، 30fps، 31 ثانية، باللغة العربية:
العنوان مع شريحة AI ← ما هو الذكاء الاصطناعي (شبكة عصبية متحركة) ← كيف يعمل (البيانات ← التدريب ← النموذج) ← عائلة واحدة (AI ⊃ تعلّم الآلة ⊃ التعلّم العميق ⊃ الذكاء التوليدي) ← أين نراه اليوم (6 مجالات) ← «المستقبل يُكتب الآن».

- `src/ai-4k.html`: الأنيميشن. اللوحة 4K أصلية، والتصميم بوحدات 1920×1080 مضروبة في `SCALE = 2`، فكل الخطوط والنصوص حادّة بالدقة الكاملة.
- `scripts/ai4k_soundtrack.py`: موسيقى إلكترونية ستيريو ومؤثرات رقمية، مع التعليق الصوتي العربي (`output/voice/ai-4k-vo.mp3`، ElevenLabs صوت Rawi) مقسّماً على المشاهد عبر `VO_LINES` والموسيقى منخفضة تحته.

```bash
npm run ai4k:audio
npm run ai4k:render   # output/ai-4k.mp4 (3840×2160)
```

## قنوات بي إن سبورتس

فيديو موشن جرافيك تعريفي (1920×1080، 30fps، 34 ثانية) مع تعليق صوتي عربي:
الاسم ← شبكة قنوات مقرّها الدوحة وامتداد للجزيرة الرياضية ← أكبر البطولات ← رياضات متعددة ← صورة 4K وتعليق عربي ← «الملاعب في بيتك».

- `src/bein.html`: الأنيميشن. كل التوقيتات مربوطة بالتعليق الصوتي عبر `VO_AT` والدالة `v()`.
- `scripts/bein_soundtrack.py`: الإيقاع والمؤثرات، ويضع التعليق الصوتي ويخفض الموسيقى تحته.
- `output/voice/bein-vo.mp3`: التعليق الصوتي من ElevenLabs (صوت Rawi – فصحى، نموذج eleven_multilingual_v2).

```bash
npm run bein:audio
npm run bein:render   # output/bein.mp4
```

لا يُستخدم الشعار الرسمي؛ الاسم مكتوب بخط Cairo فقط.

## العراق 3 - 0 الإمارات (خليجي 27)

فيديو موشن جرافيك لمباراة المنتخب العراقي والإماراتي في كأس الخليج 27 (1920×1080، 30fps، 22 ثانية):
مقدمة البطولة ← مواجهة العلمين ← الأهداف الثلاثة (زيدان إقبال، سيف رشيد، كرار نبيل) مع لوحة نتيجة تتحدّث ← النتيجة النهائية والهدافون ← ختام «أسود الرافدين».

- `src/iraq-uae.html`: الأنيميشن (أسماء الهدافين وتوقيتاتهم في مصفوفة `GOALS`).
- `scripts/iraq-uae-soundtrack.py`: أجواء الملعب، صافرة الحكم، هتاف الجمهور عند كل هدف، وإيقاع بمقام الحجاز.

```bash
npm run iraq-uae:audio
npm run iraq-uae:render   # output/iraq-uae.mp4
```

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

## مقارنة ChatGPT ضد Claude

فيديو موشن جرافيك (1920×1080، 30fps، 25 ثانية): مواجهة افتتاحية، بطاقات تعريف، 5 جولات مع لوحة نتائج، ثم النتيجة ونصيحة الاختيار.

- `src/compare.html`: الأنيميشن. نصوص الجولات والحكم في كل جولة في مصفوفة `ROUNDS`.
- `scripts/compare_soundtrack.py`: الموسيقى والمؤثرات في `output/compare-soundtrack.wav`، ويدمج معها التعليق الصوتي ويخفض الموسيقى تحته.
- `output/voice/compare-vo.mp3`: التعليق الصوتي العربي من ElevenLabs (صوت Rawi – فصحى، نموذج eleven_multilingual_v2). كل جملة تُقصّ وتوضع على مشهدها حسب `VO_LINES`.

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

## kinetic text (10 ثوانٍ)

فيديو نصوص متحركة: كل جملة تظهر بتأثير وتختفي بتأثير مختلف (glitch، انهيار، zoom، slam) ثم تظهر جملة جديدة.

```bash
python3 scripts/kinetic_audio.py   # output/kinetic.wav
node scripts/render.mjs --src src/kinetic.html --audio output/kinetic.wav --out output/kinetic.mp4
```

الجمل وتوقيتاتها في `PHRASES` داخل `src/kinetic.html`.

## grunge-titles

عناوين بأسلوب قصاصات الورق الممزق (Grunge Collage): محمد أبوالقاسم رائد / علي حسين / محسن حسين. 1920×1080، 30fps، 15 ثانية.

```bash
npm install
npm run grunge:audio    # output/grunge-soundtrack.wav
npm run grunge:render   # output/grunge-titles.mp4
```

الأسماء قابلة للتعديل من مصفوفة `TITLES` في `src/grunge-titles.html` (النص، الحجم، لون الورقة، الملصقات).
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

### النسخة الثانية: عرض السيت الكامل (`src/promo-set.html`)

البنت في المنتصف، بطاقة الحجاب يسار والقميص يمين، ثم «السيت الكامل» 10,000 ← 5,000 دينار (خصم 50%). الخلفية تتغير ست مرات بانتقال شرائح.

```bash
python3 scripts/promo_set_soundtrack.py
node scripts/render.mjs --src src/promo-set.html --audio output/promo_set_soundtrack.wav --out output/jakook-shi-set-offer.mp4
```

## quran-competition

فيديو ترويجي لمسابقة القرآن الكريم (1920×1080، 30fps، 20 ثانية): خلفية متدرجة متحركة بزخارف هندسية، والنص يظهر كلمة بكلمة متزامناً مع صوت معلّق (ElevenLabs، صوت Omar). الكلمة المنطوقة تتوهّج، والجرافيك يتفاعل مع شدة الصوت.

- `src/quran.html`: الأنيميشن وتوقيت الكلمات (`SCENES`).
- `assets/audio/quran-voice.mp3`: التعليق الصوتي.
- `scripts/voice_envelope.py`: يولّد `src/quran-envelope.js` (شدة الصوت لكل إطار).
- `scripts/quran_music.py`: موسيقى هادئة بلا إيقاع (درون + أصوات كورال على مقام البياتي) تنخفض تحت الصوت، ويخرج المزج في `output/quran-mix.wav`.
- حركة النص: ظهور بالموضع والشفافية (position + opacity). توقيت الكلمات من تفريغ ElevenLabs Scribe.

```bash
python3 scripts/voice_envelope.py
python3 scripts/quran_music.py
node scripts/render.mjs --src src/quran.html --audio output/quran-mix.wav --out output/quran-competition.mp4
```

Font: Amiri (SIL OFL)، في `assets/fonts`.

## handwriting (الحمد لله رب العالمين)

فيديو موشن جرافيك (1920×1080، 30fps، 10 ثوانٍ): العبارة تُكتب بقلم قصب بخط «عارف رقعة» بحبر ذهبي مع لمعان وصوت خشخشة القلم.

```bash
python3 scripts/handwriting_audio.py
node scripts/render.mjs --src src/handwriting.html --audio output/handwriting.wav --out output/handwriting.mp4
```

Font: Aref Ruqaa (SIL OFL).

## typing (كتابة حرف حرف + صوت رجل)

نفس العبارة تُكتب حرفاً حرفاً مع مؤشر وامض، مع قراءة بصوت رجل (ElevenLabs، صوت Omar) مرتين.

```bash
python3 scripts/typing_audio.py
node scripts/render.mjs --src src/typing.html --audio output/typing.wav --out output/typing.mp4
```

## sahib-alzaman (يا صاحب الزمان)

نفس فكرة سكربت `signature_write_on.jsx`: خط أبيض (Stroke) يمشي على مركز كل حرف كقلم، وقيمة Trim Paths End تتحرك من 0 إلى 100% لكل مقطع بالتتابع (من اليمين لليسار)، والخط مقصوص بشكل الحرف فيحتفظ بخط الرقعة. النقاط تظهر بعد الحروف. في النهاية خط تحت العبارة ولمعة وصوت قلم. 10 ثوانٍ، 1920×1080.

```bash
pip install uharfbuzz fonttools brotli playwright numpy scipy scikit-image
python3 scripts/name_paths.py FONT.ttf src/sahib_paths.json "يا صاحب الزمان"   # FONT.ttf = aref-ruqaa-arabic-700 woff2 محوّل إلى ttf
python3 scripts/centerline_paths.py src/sahib_paths.json src/sahib_centerline.json   # مسارات القلم (skeleton) + التوقيت
python3 scripts/sahib_audio.py output/sahib.wav
python3 scripts/render_name.py output/sahib.wav output/sahib-alzaman.mp4 --html src/sahib-pen.html --json src/sahib_centerline.json --dur 10
```

### بسم الله الرحمن الرحيم (`output/basmala.mp4`)

نفس الأسلوب (خط واحد يمشي على مركز الحروف كقلم) لكن على «بسم الله الرحمن الرحيم» بخط «ريم كوفي»، 12 ثانية. بعد مرور القلم على كل مقطع يظهر الحرف كاملًا، فالجملة تكتمل دائمًا. `src/pen-writeon.html` عام لأي عبارة.

```bash
python3 scripts/name_paths.py FONT.ttf src/basmala_reem_paths.json "بسم الله الرحمن الرحيم"   # FONT.ttf = reemkufi-arabic-700 woff2 محوّل إلى ttf
python3 scripts/centerline_paths.py src/basmala_reem_paths.json src/basmala_reem_centerline.json 190 190 600 0.8 8.0   # SIZE X0 BASE T0 T1
python3 scripts/sahib_audio.py output/basmala.wav 8.49 8.39 12
python3 scripts/render_name.py output/basmala.wav output/basmala.mp4 --html src/pen-writeon.html --json src/basmala_reem_centerline.json --dur 12
```

## talking-head-edit

مونتاج فيديو حديث (Claude Code مقابل ChatGPT) بـ Remotion. الناتج: `output/claude-vs-chatgpt.mp4` (1080p، 30fps، ~43 ثانية).

- قص السكتات والتلعثم (59 ث → 38.6 ث) مع زووم متناوب عند كل قطع لإخفاء القطعات.
- تصحيح الصورة المعكوسة (كاميرا سيلفي)، إزالة التشويش، رفع الدقة إلى 1080p، إضاءة/تباين/ألوان.
- إزالة الخلفية (u2net_human_seg + guided filter) واستبدالها بخلفية متحركة يتغير لونها حسب القسم.
- عزل الصوت من ElevenLabs ثم EQ وضغط وde-esser وloudness ‎-15 LUFS، مع موسيقى خفيفة ومؤثرات صوتية.
- ترجمة عربية كلمة بكلمة مع ترجمة إنجليزية تحتها (النص من ElevenLabs Scribe).
- موشن جرافيك: بطاقات VS، لوحات النقاط لكل أداة، تأثيرات تتفاعل مع حركة اليد، وخاتمة مقارنة.

```bash
cd talking-head-edit
npm install
# يحتاج: onnxruntime opencv-contrib-python-headless numpy + نموذج u2net_human_seg.onnx
python3 scripts/prepare.py --video input.mp4 --voice voice_isolated.mp3 --model u2net_human_seg.onnx
python3 scripts/sfx.py
npm run render   # out/claude-vs-chatgpt.mp4
```

نقاط القص والترجمات وتوقيت الجرافيك في أعلى `scripts/prepare.py`، والتصميم في `src/TalkingHead.tsx`.

## الكلاسيكو: ريال مدريد ضد برشلونة (15 ثانية، 1920×1080)

إعلان مباراة: كشافات ملعب تضيء، عنوان «الكلاسيكو» بالذهبي، ثم مواجهة الشعارين مع VS، وبطاقات الموعد والساعة والقناة، وختام «لا تفوّتوا المباراة!». الصوت مولّد برمجياً: صفارة حكم، هتاف جمهور، طبول ومؤثرات.

- `src/clasico.html`: الأنيميشن. تفاصيل المباراة (التاريخ، الساعة، القناة) في `MATCH` أعلى السكربت.
- `assets/clasico/`: شعارا الناديين بعد إزالة الخلفية البيضاء عبر `scripts/cutout_crest.py`.
- `scripts/clasico_soundtrack.py`: الصوت في `output/clasico-soundtrack.wav`، ويدمج معه التعليق الصوتي ويخفض الجمهور والموسيقى تحته.
- `output/voice/clasico-vo.mp3`: التعليق الصوتي العربي من ElevenLabs (صوت Mohammad – فصحى، نموذج eleven_multilingual_v2). توقيت كل جملة وسرعتها في `VO_LINES`.

```bash
npm run clasico:audio
npm run clasico:render    # output/clasico.mp4
npm run clasico:preview   # صور ثابتة في output/stills/clasico
```
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

## ramadan-clasico-remotion — النسخة الحماسية (Remotion)

نسخة موسّعة من «كلاسيكو رمضان × Signal» في Remotion: 36.5 ثانية بتعليق صوتي رجالي حماسي (ElevenLabs) وموسيقى ومؤثرات تنخفض تحت الصوت، وخمسة مشاهد مع اصطدام الشعارين وشريط «مباشر» وعدّاد 10X وانتقالات Light Leak. التفاصيل في `ramadan-clasico-remotion/README.md`، والفيديو في `output/ramadan-clasico-remotion.mp4`.

## آيفون 15

فيديو موشن جرافيك عن هاتف آيفون 15 (1920×1080، 30fps، 22 ثانية) بنصوص عربية وموسيقى ومؤثرات مولّدة برمجياً، بدون تعليق صوتي:
العنوان ← ديناميك آيلاند (شكل الجزيرة يتحوّل بين مكالمة وموسيقى) ← كاميرا 48 ميجابكسل مع عدّاد ← شريحة A16 Bionic ← منفذ USB-C وكابل يدخل فيه ← الألوان الخمسة.

- `src/iphone15.html`: الأنيميشن (Canvas). الهواتف والعدسات والشريحة مرسومة بالكود، ولا يُستخدم أي شعار رسمي.
- `scripts/iphone15_soundtrack.py`: وسادة صوتية وإيقاع خفيف ومؤثرات على كل مشهد (توقيت المشاهد `CUTS` يطابق `S` في ملف الأنيميشن).

```bash
npm run iphone15:audio
npm run iphone15:render   # output/iphone15.mp4
```

## المعادلة التربيعية (مسودة، الثالث المتوسط)

`src/math-quadratic.html`: مشهد حوار بين معلّم وطالبة (سبورة تُكتب عليها الخطوات وترجمة مكتوبة)، بدون صوت لأن رصيد التعليق الصوتي لم يكن متاحاً.
## abu-janna — إعلان أبو جنة فور يو (25 ثانية)

إعلان موشن لمشروب FOR YOU ENERGY (1920×1080، 30fps، 25 ثانية): نزول العلبة → أرقام 1–10 وسيارة تاهو → «جنة» وآيفون 17 → «أبو جنة» → لقطة ختامية. العلبة من الصورة المرفقة دون تعديل (`abu-janna/assets/can.png`)، والسيارة والهاتف رسومات عامة بلا شعارات.

```bash
npm run abu-janna:audio    # موسيقى ومؤثرات فقط
npm run abu-janna:render   # output/abu-janna.mp4
```

التعليق الصوتي العراقي غير مضمّن: رصيد ElevenLabs نفد وPollo لا يوفّر صوتاً عربياً. النصوص الخمسة جاهزة في `abu-janna/vo-script.txt`.
