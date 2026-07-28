'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const artifactDir=process.env.BROWSER_ARTIFACTS_DIR;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
const CASES=[
  {name:'desktop',viewport:{width:1280,height:720},isMobile:false,hasTouch:false},
  {name:'mobile-landscape',viewport:{width:844,height:390},isMobile:true,hasTouch:true}
];
function startServer(root){
  const base=path.resolve(root);
  const server=http.createServer((req,res)=>{
    try{
      const requestPath=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
      const relative=requestPath==='/'?'index.html':requestPath.replace(/^\/+/, '');
      const file=path.resolve(base,relative);
      if(file!==base&&!file.startsWith(base+path.sep)){res.writeHead(403);res.end('forbidden');return;}
      fs.stat(file,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404);res.end('not found');return;}res.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);});
    }catch(error){res.writeHead(500);res.end(error.message);}
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
async function snapshot(page){
  return page.evaluate(()=>{
    const box=element=>{if(!element)return null;const rect=element.getBoundingClientRect();return {top:rect.top,bottom:rect.bottom,left:rect.left,right:rect.right,width:rect.width,height:rect.height};};
    const carousel=document.getElementById('songCarousel'),tabs=document.querySelector('.songTabs'),cards=[...document.querySelectorAll('.songCard')];
    const style=carousel?getComputedStyle(carousel):null;
    return {
      url:location.href,bodyClass:document.body.className,activeTab:[...document.querySelectorAll('.songTab')].find(tab=>tab.classList.contains('active'))?.textContent||null,
      songSelectHidden:document.getElementById('songSelect')?.hidden,updateLogVisible:!!document.getElementById('updateLogOverlay')?.classList.contains('show'),
      cssLoaded:!!document.querySelector('link[data-circle-mix-song-select-fixes]'),carousel:box(carousel),tabs:box(tabs),first:box(cards[0]),second:box(cards[1]),last:box(cards.at(-1)),count:cards.length,
      scrollTop:carousel?.scrollTop??null,clientHeight:carousel?.clientHeight??null,scrollHeight:carousel?.scrollHeight??null,alignContent:style?.alignContent||null,overflowY:style?.overflowY||null,
      cardTitles:cards.map(card=>card.querySelector('h3')?.textContent||card.textContent?.slice(0,60)||''),
      difficulties:[...document.querySelectorAll('.songDiffBtn')].map(button=>(button.textContent||'').trim()),
      localSongs:window.CircleMixSongRegistry?.localAll?.().map(song=>({id:song.id,order:song.difficultyOrder,levels:Object.fromEntries(Object.entries(song.difficulties||{}).map(([id,meta])=>[id,meta.level??meta.stars??null]))}))||[]
    };
  });
}
(async()=>{
  const server=await startServer(process.cwd());
  const port=server.address().port;
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    for(const testCase of CASES){
      let context,page,stage='create context';
      const errors=[];
      try{
        context=await browser.newContext({viewport:testCase.viewport,isMobile:testCase.isMobile,hasTouch:testCase.hasTouch,deviceScaleFactor:1,serviceWorkers:'block'});
        await context.addInitScript(()=>{try{localStorage.setItem('circleMixLastSeenVersion','0.9.33');}catch(_){}});
        page=await context.newPage();
        page.on('pageerror',error=>errors.push(error.message));
        stage='load page';
        await page.goto(`http://127.0.0.1:${port}/index.html?browserTest=1&tab=local`,{waitUntil:'domcontentloaded'});
        stage='wait for LOCAL runtime';
        await page.waitForFunction(()=>window.CircleMixLocalSongs&&window.CircleMixSongRegistry&&window.CircleMixOpenLocalSong&&window.CircleMixTestApi&&window.CircleMixCmixImportUi,{timeout:10000});
        stage='install LOCAL fixture';
        await dismiss(page);await installFixture(page);await dismiss(page);
        stage='wait for rendered cards and stylesheet';
        await page.waitForFunction(()=>document.querySelectorAll('.songCard').length>=8&&document.querySelector('link[data-circle-mix-song-select-fixes]'),{timeout:7000});
        stage='measure top';
        await page.evaluate(()=>{const carousel=document.getElementById('songCarousel');carousel.scrollTop=0;});
        await page.waitForTimeout(120);
        const top=await snapshot(page);
        assert.equal(top.count,8,`${testCase.name} local card count: ${JSON.stringify(top)}`);
        assert.equal(top.scrollTop,0,`${testCase.name} list does not start at top: ${JSON.stringify(top)}`);
        assert.equal(top.alignContent,'flex-start',`${testCase.name} rows are still vertically centered: ${JSON.stringify(top)}`);
        assert.match(top.overflowY,/auto|scroll/,`${testCase.name} list is not vertically scrollable: ${JSON.stringify(top)}`);
        assert(top.scrollHeight>top.clientHeight,`${testCase.name} fixture should overflow: ${JSON.stringify(top)}`);
        assert(top.first.top>=top.tabs.bottom-2&&top.first.bottom<=top.carousel.bottom+2,`${testCase.name} first song is clipped: ${JSON.stringify(top)}`);
        assert(top.second.top>=top.tabs.bottom-2,`${testCase.name} second song is clipped: ${JSON.stringify(top)}`);
        assert.deepEqual(top.difficulties.map(text=>text.split(/\s+/)[0]),['BASIC','ADVANCED','EXPERT','MASTER'],`${testCase.name} LOCAL difficulties are not ascending: ${JSON.stringify(top)}`);
        stage='measure bottom';
        await page.evaluate(()=>{const carousel=document.getElementById('songCarousel');carousel.scrollTop=carousel.scrollHeight;});
        await page.waitForTimeout(120);
        const bottom=await snapshot(page);
        assert(bottom.scrollTop>0,`${testCase.name} list did not scroll: ${JSON.stringify(bottom)}`);
        assert(bottom.last.bottom<=bottom.carousel.bottom+2&&bottom.last.bottom>bottom.carousel.top,`${testCase.name} last song is unreachable: ${JSON.stringify(bottom)}`);
        assert.deepEqual(errors,[],`${testCase.name} page errors: ${JSON.stringify(errors)}`);
        console.log(`song select overflow passed: ${testCase.name}`);
      }catch(error){
        const report={case:testCase.name,stage,error:{message:error?.message||String(error),stack:error?.stack||null},errors,snapshot:null};
        if(page)try{report.snapshot=await snapshot(page);}catch(snapshotError){report.snapshotError=snapshotError.message;}
        console.error('SONG_SELECT_OVERFLOW_FAILURE',JSON.stringify(report));
        if(artifactDir){
          fs.mkdirSync(artifactDir,{recursive:true});
          fs.writeFileSync(path.join(artifactDir,`song-select-overflow-${testCase.name}.json`),JSON.stringify(report,null,2));
          if(page)await page.screenshot({path:path.join(artifactDir,`song-select-overflow-${testCase.name}.png`),fullPage:true}).catch(()=>{});
        }
        throw error;
      }finally{if(context)await context.close().catch(()=>{});}
    }
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
