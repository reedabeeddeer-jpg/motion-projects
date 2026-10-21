import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const FONT = "Cairo";

const arabic = "U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF";
const latin = "U+0000-00FF, U+00D7, U+2013-2014";

for (const w of ["400", "700", "900"]) {
  loadFont({ family: FONT, url: staticFile(`fonts/cairo-arabic-${w}-normal.woff2`), weight: w, unicodeRange: arabic });
  loadFont({ family: FONT, url: staticFile(`fonts/cairo-latin-${w}-normal.woff2`), weight: w, unicodeRange: latin });
}
