/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// light leaks use WebGL2
Config.setChromiumOpenGlRenderer("angle");
Config.setCodec("h264");
Config.setCrf(20);
Config.setPixelFormat("yuv420p");

// Use a locally installed Chromium when provided (e.g. in sandboxed environments without downloads).
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
