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
