const {chromium}=require('playwright-core');
const S=process.argv[2],K=+process.argv[3],M=3,N=300;
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const p=await b.newPage({viewport:{width:1920,height:1080}});
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('file://'+process.cwd()+'/motion.html#'+S);
 await p.waitForFunction('window.ready');
 const d=`f${S}`;require('fs').mkdirSync(d,{recursive:true});
 for(let i=K;i<N;i+=M){await p.evaluate(t=>render(t),i/30);
  await p.screenshot({path:`${d}/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:95});}
 await b.close();
})();
