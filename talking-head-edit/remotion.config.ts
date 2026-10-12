import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(17);
Config.setPixelFormat("yuv420p");
Config.setAudioCodec("aac");
Config.setAudioBitrate("320k");

// Use a locally installed Chromium when provided (e.g. in sandboxed CI without downloads).
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
