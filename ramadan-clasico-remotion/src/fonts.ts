import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const FONT = "Cairo";

const arabic = "U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF";

loadFont({ family: FONT, url: staticFile("fonts/cairo-arabic-700-normal.woff2"), weight: "700", unicodeRange: arabic });
loadFont({ family: FONT, url: staticFile("fonts/cairo-arabic-900-normal.woff2"), weight: "900", unicodeRange: arabic });
loadFont({ family: FONT, url: staticFile("fonts/cairo-latin-900-normal.woff2"), weight: "900", unicodeRange: "U+0000-00FF, U+00D7" });
