'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
const CASES=[
  {name:'desktop',viewport:{width:1280,height:720},isMobile:false,hasTouch:false},
  {name:'mobile-landscape',viewport:{width:844,height:390},isMobile:true,hasTouch:true}
];
function startServer(root){
  const base=path.resolve(root);
  const server=http.createServer((req,res)=>{
    const requestPath=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    const relative=requestPath==='/'?'index.html':requestPath.replace(/^\/+/, '');
    const file=path.resolve(base,relative);
    if(file!==base&&!file.startsWith(base+path.sep)){res.writeHead(403);res.end('forbidden');return;}
    fs.stat(file,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404);res.end('not found');return;}res.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);});
  });
  return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server));});
}
async function dismiss(page){await page.evaluate(()=>{const update=document.getElementById('updateLogOverlay');if(update){update.classList.remove('show');update.hidden=true;}document.body.classList.remove('updateLogOpen');const prompt=document.getElementById('tutorialPrompt');if(prompt)prompt.hidden=true;});}
async function installFixture(page){
  await page.evaluate(async()=>{
    const now=new Date().toISOString();
    for(let index=0;index<8;index++){
      const id=`overflow-song-${index}`;
      const old=await window.CircleMixLocalSongs.get(id).catch(()=>null);
      if(old)await window.CircleMixLocalSongs.delete(id,{withBackup:true});
      const ids=index===0?['master','basic','expert','advanced']:['normal'];
      const levels={master:12,basic:3,expert:9.5,advanced:6,normal:5};
      const charts={},difficulties={};
      for(const [chartIndex,chartId] of ids.entries()){
        charts[chartId]={format:'circle-mix-chart',formatVersion:1,id:chartId,bpm:120,offset:0,notes:[{id:`cut-${index}-${chartIndex}`,type:'cut',beat:1,angle:(index*31+chartIndex*47)%360}]};
        difficulties[chartId]={id:chartId,label:chartId.toUpperCase(),level:levels[chartId],stars:levels[chartId]};
      }
      await window.CircleMixLocalSongs.put({id,source:'local',title:`OVERFLOW TRACK ${index+1}`,artist:'CIRCLE MIX TEST',bpm:120,offset:0,audioBlob:new Blob([new Uint8Array([82,73,70,70,0,0,0,0,87,65,86,69])],{type:'audio/wav'}),packageType:'full',packageVersion:1,charts,difficultyOrder:ids,difficulties,installedAt:now,updatedAt:now});
    }
    await window.CircleMixSongRegistry.refreshLocal();
    await window.CircleMixOpenLocalSong('overflow-song-0');
  });
}
function rect(element){if(!element)return null;const box=element.getBoundingClientRect();return {top:box.top,bottom:box.bottom,left:box.left,right:box.right,height:box.height};}
(async()=>{
  const server=await startServer(process.cwd());
  const port=server.address().port;
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    for(const testCase of CASES){
      const context=await browser.newContext({viewport:testCase.viewport,isMobile:testCase.isMobile,hasTouch:testCase.hasTouch,deviceScaleFactor:1,serviceWorkers:'block'});
      await context.addInitScript(()=>{try{localStorage.setItem('circleMixLastSeenVersion','0.9.49');}catch(_){}});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      try{
        await page.goto(`http://127.0.0.1:${port}/index.html?browserTest=1&tab=local`,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.CircleMixLocalSongs&&window.CircleMixSongRegistry&&window.CircleMixOpenLocalSong,{timeout:10000});
        await dismiss(page);await installFixture(page);await dismiss(page);
        const local=page.locator('.songTab').filter({hasText:/LOCAL/i}).first();
        await local.click();
        await page.waitForFunction(()=>document.querySelectorAll('.songCard').length>=8&&document.querySelector('link[data-circle-mix-song-select-fixes]'),{timeout:5000});
        await page.evaluate(()=>{const carousel=document.getElementById('songCarousel');carousel.scrollTop=0;});
        await page.waitForTimeout(100);
        const top=await page.evaluate(()=>{
          const carousel=document.getElementById('songCarousel'),tabs=document.querySelector('.songTabs'),cards=[...document.querySelectorAll('.songCard')];
          const style=getComputedStyle(carousel);
          return {carousel:rect(carousel),tabs:rect(tabs),first:rect(cards[0]),second:rect(cards[1]),count:cards.length,scrollTop:carousel.scrollTop,clientHeight:carousel.clientHeight,scrollHeight:carousel.scrollHeight,alignContent:style.alignContent,overflowY:style.overflowY,difficulties:[...document.querySelectorAll('.songDiffBtn')].map(button=>(button.textContent||'').trim())};
          function rect(element){if(!element)return null;const box=element.getBoundingClientRect();return {top:box.top,bottom:box.bottom,left:box.left,right:box.right,height:box.height};}
        });
        assert.equal(top.count,8,`${testCase.name} local card count`);
        assert.equal(top.scrollTop,0,`${testCase.name} list does not start at top`);
        assert.equal(top.alignContent,'flex-start',`${testCase.name} rows are still vertically centered`);
        assert.match(top.overflowY,/auto|scroll/,`${testCase.name} list is not vertically scrollable`);
        assert(top.scrollHeight>top.clientHeight,`${testCase.name} fixture should overflow`);
        assert(top.first.top>=top.tabs.bottom-2&&top.first.bottom<=top.carousel.bottom+2,`${testCase.name} first song is clipped: ${JSON.stringify(top)}`);
        assert(top.second.top>=top.tabs.bottom-2,`${testCase.name} second song is clipped: ${JSON.stringify(top)}`);
        assert.deepEqual(top.difficulties.map(text=>text.split(/\s+/)[0]),['BASIC','ADVANCED','EXPERT','MASTER'],`${testCase.name} LOCAL difficulties are not ascending`);
        await page.evaluate(()=>{const carousel=document.getElementById('songCarousel');carousel.scrollTop=carousel.scrollHeight;});
        await page.waitForTimeout(100);
        const bottom=await page.evaluate(()=>{const carousel=document.getElementById('songCarousel'),cards=[...document.querySelectorAll('.songCard')],box=carousel.getBoundingClientRect(),last=cards.at(-1).getBoundingClientRect();return {carousel:{top:box.top,bottom:box.bottom},last:{top:last.top,bottom:last.bottom},scrollTop:carousel.scrollTop};});
        assert(bottom.scrollTop>0,`${testCase.name} list did not scroll`);
        assert(bottom.last.bottom<=bottom.carousel.bottom+2&&bottom.last.bottom>bottom.carousel.top,`${testCase.name} last song is unreachable: ${JSON.stringify(bottom)}`);
        assert.deepEqual(errors,[],`${testCase.name} page errors: ${JSON.stringify(errors)}`);
        console.log(`song select overflow passed: ${testCase.name}`);
      }finally{await context.close();}
    }
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
