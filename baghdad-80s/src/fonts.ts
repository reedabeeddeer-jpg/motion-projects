import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const CAIRO = "Cairo";
export const KUFI = "Reem Kufi";
export const RUQAA = "Aref Ruqaa";

const arabic = "U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF";

loadFont({ family: CAIRO, url: staticFile("fonts/cairo-arabic-900-normal.woff2"), weight: "900", unicodeRange: arabic });
loadFont({ family: CAIRO, url: staticFile("fonts/cairo-arabic-700-normal.woff2"), weight: "700", unicodeRange: arabic });
loadFont({ family: CAIRO, url: staticFile("fonts/cairo-latin-900-normal.woff2"), weight: "900", unicodeRange: "U+0000-00FF" });
loadFont({ family: KUFI, url: staticFile("fonts/reemkufi-arabic-700.woff2"), weight: "700", unicodeRange: arabic });
loadFont({ family: RUQAA, url: staticFile("fonts/aref-ruqaa-arabic-700-normal.woff2"), weight: "700", unicodeRange: arabic });
