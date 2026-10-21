import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Bus, Cassette, Fish, Istikan, Palm, River, Shanasheel, Skyline, Sun, TV } from "./art";
import { Chips, Cut, onTwos, Paper, Scene, Stamp, Tape } from "./collage";
import { CAIRO, KUFI, RUQAA } from "./fonts";
import { PALETTE as C } from "./timeline";

// 1 — Title: "بغداد / الثمانينات"
export const Intro: React.FC = () => (
  <Scene bg={C.cream} halftone="rgba(200,38,44,0.10)">
    <Cut x={190} y={420} w={700} seed="sun" delay={0}>
      <Sun />
    </Cut>
    <Cut x={0} y={1010} w={1080} seed="sky" from="bottom" delay={6}>
      <Skyline />
    </Cut>
    <Cut x={110} y={560} w={860} h={430} rot={-4} seed="title" delay={12}>
      <Paper color={C.red} seed="title-paper" halftone>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: KUFI,
            fontWeight: 700,
            fontSize: 290,
            color: C.cream,
            paddingBottom: 40,
            textShadow: "6px 6px 0 rgba(0,0,0,0.25)",
          }}
        >
          بغداد
        </div>
      </Paper>
      <Tape x={-40} y={-10} seed="t1" rot={-28} />
      <Tape x={730} y={380} seed="t2" rot={-22} />
    </Cut>
    <Chips
      x={60}
      y={1440}
      w={960}
      delay={24}
      seed="sub"
      words={[
        { t: "أيام", bg: C.ink, fg: C.mustard, size: 104 },
        { t: "الثمانينات", bg: C.mustard, fg: C.ink, size: 116 },
      ]}
    />
    <Chips x={140} y={250} w={800} delay={30} seed="kicker" words={[{ t: "حكاية مدينة", bg: C.teal, fg: C.cream, size: 64, font: CAIRO }]} />
    <Stamp x={790} y={330} text="80s" sub="BAGHDAD" delay={40} size={210} />
  </Scene>
);

// 2 — Al-Rashid Street & the red double-decker
export const Rashid: React.FC = () => {
  const frame = useCurrentFrame();
  const f = onTwos(frame);
  const busX = interpolate(f, [8, 40], [1150, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bob = f % 4 === 0 ? -3 : 0;
  return (
    <Scene bg={C.sky} halftone="rgba(44,110,106,0.18)">
      <Cut x={-60} y={520} w={380} seed="sh1" from="left" delay={2} rot={2}>
        <Shanasheel />
      </Cut>
      <Cut x={760} y={560} w={380} seed="sh2" from="right" delay={5} rot={-2}>
        <Shanasheel flip />
      </Cut>
      {/* street strip */}
      <Cut x={-40} y={1420} w={1160} h={220} seed="road" from="bottom" delay={0} rot={-1}>
        <Paper color="#3b3a3e" seed="road-paper">
          <div style={{ position: "absolute", top: 100, left: 0, right: 0, height: 14, backgroundImage: `repeating-linear-gradient(90deg, ${C.cream} 0 70px, transparent 70px 130px)` }} />
        </Paper>
      </Cut>
      <div style={{ position: "absolute", left: busX, top: 1080 + bob, width: 780, zIndex: 5 }}>
        <Bus />
      </div>
      <Chips
        x={40}
        y={240}
        w={1000}
        delay={6}
        seed="rashid"
        words={[
          { t: "شارع", bg: C.cream, fg: C.ink, size: 120 },
          { t: "الرشيد", bg: C.red, fg: C.cream, size: 150, font: RUQAA },
        ]}
      />
      <Chips
        x={60}
        y={1660}
        w={960}
        delay={30}
        seed="bus-cap"
        words={[
          { t: "الباص الأحمر", bg: C.mustard, fg: C.ink, size: 66 },
          { t: "أبو الطابقين", bg: C.ink, fg: C.cream, size: 66 },
        ]}
      />
    </Scene>
  );
};

// 3 — Abu Nuwas on the Tigris: masgouf & tea
export const AbuNuwas: React.FC = () => (
  <Scene bg="#f2b27a" halftone="rgba(200,38,44,0.14)">
    <Cut x={300} y={560} w={480} seed="sun2" delay={0}>
      <Sun />
    </Cut>
    <Cut x={-70} y={520} w={380} seed="palm1" from="left" delay={4} rot={-3}>
      <Palm />
    </Cut>
    <Cut x={770} y={560} w={360} seed="palm2" from="right" delay={7} rot={4}>
      <Palm color="#24663a" />
    </Cut>
    <Cut x={0} y={1060} w={1080} seed="river" from="bottom" delay={2}>
      <River />
    </Cut>
    <Cut x={40} y={1280} w={500} rot={-8} seed="fish" delay={20} from="drop">
      <Fish />
    </Cut>
    <Cut x={700} y={1180} w={260} rot={6} seed="tea" delay={26} from="drop">
      <Istikan />
    </Cut>
    <Chips
      x={40}
      y={230}
      w={1000}
      delay={6}
      seed="nuwas"
      words={[
        { t: "أبو نؤاس", bg: C.teal, fg: C.cream, size: 140, font: RUQAA },
        { t: "على ضفاف دجلة", bg: C.cream, fg: C.ink, size: 76 },
      ]}
    />
    <Chips
      x={40}
      y={1660}
      w={1000}
      delay={34}
      seed="food"
      words={[
        { t: "سمك مسكوف", bg: C.red, fg: C.cream, size: 66 },
        { t: "وچاي بالاستكان", bg: C.cream, fg: C.ink, size: 66 },
      ]}
    />
  </Scene>
);

// 4 — The era of cassettes & television
export const CassetteTV: React.FC = () => (
  <Scene bg={C.navy} halftone="rgba(232,111,138,0.22)">
    <Cut x={60} y={560} w={960} h={760} rot={3} seed="bgpaper" delay={0} from="scale">
      <Paper color={C.pink} seed="pink-paper" halftone />
    </Cut>
    <Cut x={190} y={600} w={700} rot={-3} seed="tv" delay={6} from="drop">
      <TV />
    </Cut>
    <Cut x={300} y={1200} w={560} rot={-10} seed="cas" delay={18} from="right">
      <Cassette />
    </Cut>
    <Tape x={140} y={1230} seed="t3" rot={30} />
    <Chips
      x={40}
      y={240}
      w={1000}
      delay={4}
      seed="era"
      words={[
        { t: "زمن", bg: C.mustard, fg: C.ink, size: 110 },
        { t: "الكاسيت", bg: C.cream, fg: C.red, size: 120 },
        { t: "والتلفزيون", bg: C.red, fg: C.cream, size: 110 },
      ]}
    />
    <Chips
      x={40}
      y={1640}
      w={1000}
      delay={28}
      seed="nights"
      words={[
        { t: "سهرات العائلة", bg: C.cream, fg: C.ink, size: 64 },
        { t: "وأغاني الزمن الجميل", bg: C.mustard, fg: C.ink, size: 64 },
      ]}
    />
  </Scene>
);

// 5 — Outro: "بغداد... ذاكرة لا تُنسى"
export const Outro: React.FC = () => (
  <Scene bg={C.cream} halftone="rgba(44,110,106,0.14)">
    <Cut x={-80} y={260} w={420} rot={-14} seed="o-bus" delay={0}>
      <Bus />
    </Cut>
    <Cut x={760} y={200} w={300} rot={10} seed="o-palm" delay={3}>
      <Palm />
    </Cut>
    <Cut x={60} y={1360} w={360} rot={12} seed="o-cas" delay={6}>
      <Cassette />
    </Cut>
    <Cut x={790} y={1330} w={210} rot={-8} seed="o-tea" delay={8}>
      <Istikan />
    </Cut>
    <Cut x={110} y={740} w={860} h={360} rot={-3} seed="o-title" delay={10}>
      <Paper color={C.teal} seed="o-paper" halftone>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: KUFI,
            fontWeight: 700,
            fontSize: 240,
            color: C.cream,
            paddingBottom: 30,
          }}
        >
          بغداد
        </div>
      </Paper>
      <Tape x={330} y={-22} seed="t4" rot={4} />
    </Cut>
    <Chips
      x={40}
      y={1140}
      w={1000}
      delay={18}
      seed="memory"
      words={[
        { t: "ذاكرة", bg: C.red, fg: C.cream, size: 100 },
        { t: "لا تُنسى", bg: C.ink, fg: C.mustard, size: 100 },
      ]}
    />
    <Stamp x={440} y={1400} text="80s" sub="بغداد" delay={28} size={200} color={C.red} />
  </Scene>
);
