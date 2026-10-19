#!/usr/bin/env python3
"""Generate voice-over with Google Gemini TTS (same models as AI Studio "Generate speech").

Needs an API key from https://aistudio.google.com/apikey in GEMINI_API_KEY.

Examples:
  # one line of text
  python3 scripts/gemini_tts.py --text "أهلاً بكم" --out output/vo.wav

  # timed script (lines like "5.3s  النص...") -> one wav per line + one mixed track
  python3 scripts/gemini_tts.py --script abu-janna/vo-script.txt --out output/abu-janna-vo.wav \
      --style "اقرأ بلهجة عراقية، بحماس وطاقة إعلانية"

  # two speakers (text lines must start with "Name: ...")
  python3 scripts/gemini_tts.py --file dialog.txt --speakers "Ali=Puck,Sara=Kore" --out output/dialog.wav
"""
import argparse
import base64
import json
import os
import re
import struct
import sys
import urllib.error
import urllib.request
import wave

API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
DEFAULT_MODEL = os.environ.get("GEMINI_TTS_MODEL", "gemini-3.8-flash-tts")
RATE = 24000  # Gemini TTS returns 16-bit mono PCM at 24 kHz


def tts(text, model, voice=None, speakers=None, style=None, key=None):
    prompt = f"{style}:\n{text}" if style else text
    if speakers:
        speech = {"multiSpeakerVoiceConfig": {"speakerVoiceConfigs": [
            {"speaker": name, "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": v}}}
            for name, v in speakers]}}
    else:
        speech = {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": speech},
    }
    req = urllib.request.Request(
        API.format(model=model),
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"Gemini API error {e.code}: {e.read().decode(errors='replace')}")
    try:
        part = data["candidates"][0]["content"]["parts"][0]["inlineData"]
    except (KeyError, IndexError):
        sys.exit(f"No audio in response: {json.dumps(data)[:500]}")
    return base64.b64decode(part["data"])


def write_wav(path, pcm):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm)
    print(f"wrote {path} ({len(pcm) / 2 / RATE:.1f}s)")


def mix_at(clips):
    """Place (start_seconds, pcm) clips on one timeline."""
    end = max(int(t * RATE) + len(p) // 2 for t, p in clips)
    track = [0] * end
    for t, p in clips:
        off = int(t * RATE)
        for i, (s,) in enumerate(struct.iter_unpack("<h", p)):
            track[off + i] = max(-32768, min(32767, track[off + i] + s))
    return struct.pack(f"<{len(track)}h", *track)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--text", help="text to speak")
    src.add_argument("--file", help="text file to speak as one clip")
    src.add_argument("--script", help='timed script: lines like "5.3s  text"')
    ap.add_argument("--out", required=True, help="output .wav")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--voice", default="Kore", help="prebuilt voice (Kore, Puck, Charon, Fenrir, Aoede, Zephyr, ...)")
    ap.add_argument("--speakers", help='multi-speaker map, e.g. "Ali=Puck,Sara=Kore"')
    ap.add_argument("--style", help="delivery instructions, e.g. 'Say cheerfully in Iraqi dialect'")
    a = ap.parse_args()

    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        sys.exit("Set GEMINI_API_KEY (get one at https://aistudio.google.com/apikey)")
    speakers = [s.split("=", 1) for s in a.speakers.split(",")] if a.speakers else None
    opts = dict(model=a.model, voice=a.voice, speakers=speakers, style=a.style, key=key)

    if a.script:
        clips = []
        base = os.path.splitext(a.out)[0]
        for n, line in enumerate(open(a.script, encoding="utf-8"), 1):
            m = re.match(r"\s*([\d.]+)s\s+(.+)", line)
            if not m:
                continue
            pcm = tts(m.group(2).strip(), **opts)
            write_wav(f"{base}_{n:02d}.wav", pcm)
            clips.append((float(m.group(1)), pcm))
        if not clips:
            sys.exit("No timed lines found in script")
        write_wav(a.out, mix_at(clips))
    else:
        text = a.text or open(a.file, encoding="utf-8").read()
        write_wav(a.out, tts(text, **opts))


if __name__ == "__main__":
    main()
