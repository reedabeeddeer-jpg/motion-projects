import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const FONT = "Amiri";
loadFont({ family: FONT, url: staticFile("fonts/amiri-arabic-700-normal.woff2"), weight: "700" });
