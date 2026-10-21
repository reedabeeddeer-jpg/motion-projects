const {chromium}=require('playwright-core');
const K=+process.argv[2],M=3,N=300;
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const p=await b.newPage({viewport:{width:1920,height:1080}});
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('file://'+process.cwd()+'/letters.html');
 await p.waitForFunction('window.ready');
 const out=process.argv[3]||'frames_letters';require('fs').mkdirSync(out,{recursive:true});
 const only=process.argv[4];
 if(only){for(const t of only.split(',')){await p.evaluate(t=>render(t),+t);await p.screenshot({path:`${out}/t${t}.jpg`,type:'jpeg',quality:85});}}
 else for(let i=K;i<N;i+=M){await p.evaluate(t=>render(t),i/30);
  await p.screenshot({path:`${out}/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:95});}
 await b.close();
})();
