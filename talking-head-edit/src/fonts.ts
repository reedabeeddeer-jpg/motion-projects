import { continueRender, delayRender, staticFile } from "remotion";

const AR = "U+0600-06FF, U+FB50-FDFF, U+FE70-FEFF";
const LATIN = "U+0000-00FF, U+2010-2027";
const faces = [
  { weight: "400", file: "fonts/cairo-arabic-400-normal.woff2", range: AR },
  { weight: "700", file: "fonts/cairo-arabic-700-normal.woff2", range: AR },
  { weight: "900", file: "fonts/cairo-arabic-900-normal.woff2", range: AR },
  { weight: "400", file: "fonts/cairo-latin-400-normal.woff2", range: LATIN },
  { weight: "700", file: "fonts/cairo-latin-700-normal.woff2", range: LATIN },
  { weight: "900", file: "fonts/cairo-latin-900-normal.woff2", range: LATIN },
];

export const fontFamily = "Cairo";

const handle = delayRender("Loading Cairo font");
Promise.all(
  faces.map(async ({ weight, file, range }) => {
    const face = new FontFace(fontFamily, `url(${staticFile(file)}) format("woff2")`, { weight, unicodeRange: range });
    await face.load();
    document.fonts.add(face);
  }),
)
  .then(() => continueRender(handle))
  .catch((err) => {
    console.error(err);
    continueRender(handle);
  });
