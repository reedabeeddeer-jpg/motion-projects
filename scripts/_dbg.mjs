import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1920,height:1080}});
p.on("console", m=>console.log(m.text())); p.on("pageerror", e=>console.log("ERR", e.message));
await p.goto(pathToFileURL("/home/user/motion-projects/src/handwriting.html").href);
await p.evaluate(()=>window.ready);
console.log(await p.evaluate(()=>{ render(3.0); return JSON.stringify({ws: wordX, ps: penState(3.0), edge: revealEdge(3.0), il: inkL, ir: inkR}); }));
