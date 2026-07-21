'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const artifactDir=process.env.BROWSER_ARTIFACTS_DIR;
const MIME={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8',
  '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'
};
const VIEWPORTS=[
  {name:'folded-landscape',width:844,height:390},
  {name:'unfolded-square-landscape',width:720,height:680},
  {name:'unfolded-square-portrait',width:680,height:720}
];

function startServer(root){
  const base=path.resolve(root);
  const server=http.createServer((req,res)=>{
    try{
      const requestPath=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
      const relative=requestPath==='/'?'index.html':requestPath.replace(/^\/+/, '');
      const file=path.resolve(base,relative);
      if(file!==base&&!file.startsWith(base+path.sep)){res.writeHead(403);res.end('forbidden');return;}
      fs.stat(file,(error,stat)=>{
        if(error||!stat.isFile()){res.writeHead(404);res.end('not found');return;}
        res.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
        fs.createReadStream(file).pipe(res);
      });
    }catch(error){res.writeHead(500);res.end(error.message);}
  });
  return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server));});
}

function assertInside(inner,outer,label,tolerance=2){
  assert(inner,`${label} missing`);
  assert(outer,`${label} outer missing`);
  assert(inner.left>=outer.left-tolerance,`${label} left ${inner.left} < ${outer.left}`);
  assert(inner.top>=outer.top-tolerance,`${label} top ${inner.top} < ${outer.top}`);
  assert(inner.right<=outer.right+tolerance,`${label} right ${inner.right} > ${outer.right}`);
  assert(inner.bottom<=outer.bottom+tolerance,`${label} bottom ${inner.bottom} > ${outer.bottom}`);
}

async function dismissBlockingOverlays(page){
  await page.evaluate(()=>{
    const update=document.getElementById('updateLogOverlay');
    if(update){update.classList.remove('show');update.hidden=true;}
    document.body.classList.remove('updateLogOpen');
    const prompt=document.getElementById('tutorialPrompt');
    if(prompt)prompt.hidden=true;
  });
}

async function installFixture(page){
  await page.evaluate(async()=>{
    const chartIds=['beginner','normal','advanced','expert','master'];
    const now=new Date().toISOString();
    for(let index=0;index<7;index++){
      const id=`mobile-layout-${index}`;
      const old=await window.CircleMixLocalSongs.get(id).catch(()=>null);
      if(old)await window.CircleMixLocalSongs.delete(id,{withBackup:true});
      const ids=index===0?chartIds:['normal'];
      const charts={},difficulties={};
      for(const [chartIndex,chartId] of ids.entries()){
        charts[chartId]={format:'circle-mix-chart',formatVersion:1,id:chartId,bpm:120+index,offset:0,notes:[{id:`cut-${index}-${chartIndex}`,type:'cut',beat:1,angle:(index*37+chartIndex*41)%360}]};
        difficulties[chartId]={id:chartId,label:chartId.toUpperCase()};
      }
      await window.CircleMixLocalSongs.put({
        id,source:'local',title:`MOBILE LOCAL TRACK ${index+1}`,artist:'CIRCLE MIX TEST',bpm:120+index,offset:0,
        audioBlob:new Blob([new Uint8Array([82,73,70,70,0,0,0,0,87,65,86,69])],{type:'audio/wav'}),
        packageType:'full',packageVersion:1,charts,difficultyOrder:ids,difficulties,installedAt:now,updatedAt:now
      });
    }
    await window.CircleMixSongRegistry.refreshLocal();
    await window.CircleMixOpenLocalSong('mobile-layout-0');
  });
}

async function snapshot(page){
  return page.evaluate(()=>{
    const rect=element=>{
      if(!element)return null;
      const box=element.getBoundingClientRect();
      return {left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height};
    };
    const tabs=[...document.querySelectorAll('.songTab')];
    const localTab=tabs.find(button=>/LOCAL/i.test(button.textContent||''))||null;
    const carousel=document.getElementById('songCarousel');
    const cards=[...document.querySelectorAll('.songCard')];
    return {
      viewport:{width:innerWidth,height:innerHeight},
      coarse:matchMedia('(pointer:coarse)').matches,
      styleInstalled:!!document.getElementById('circleMixMobileSongSelectLayout'),
      bodyClass:document.body.className,
      updateLogVisible:!!document.getElementById('updateLogOverlay')?.classList.contains('show'),
      shell:rect(document.querySelector('.songSelectShell')),
      header:rect(document.querySelector('.songSelectHeader')),
      carousel:rect(carousel),
      tabs:rect(document.querySelector('.songTabs')),
      localTab:rect(localTab),
      footer:rect(document.querySelector('.songSelectFooter')),
      play:rect(document.getElementById('songPlayBtn')),
      firstCard:rect(cards[0]),
      lastCard:rect(cards.at(-1)),
      cardCount:cards.length,
      carouselClientHeight:carousel?.clientHeight||0,
      carouselScrollHeight:carousel?.scrollHeight||0,
      carouselScrollTop:carousel?.scrollTop||0,
      localTabText:localTab?.textContent||null,
      songSelectHidden:document.getElementById('songSelect')?.hidden
    };
  });
}

(async()=>{
  const server=await startServer(process.cwd());
  const port=server.address().port;
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    for(const viewport of VIEWPORTS){
      const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
      await context.addInitScript(()=>{try{localStorage.setItem('circleMixLastSeenVersion','0.9.30');}catch(_){}});
      const page=await context.newPage();
      const errors=[];
      let stage='load';
      page.on('pageerror',error=>errors.push(error.message));
      try{
        await page.goto(`http://127.0.0.1:${port}/index.html?browserTest=1&tab=local`,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.CircleMixLocalSongs&&window.CircleMixSongRegistry&&window.CircleMixTestApi&&window.CircleMixCmixImportUi,{timeout:10000});
        await dismissBlockingOverlays(page);
        stage='install local fixtures';
        await installFixture(page);
        await dismissBlockingOverlays(page);
        await page.locator('.songSelectShell').waitFor({state:'visible',timeout:5000});
        await page.waitForFunction(()=>document.querySelectorAll('.songCard').length>=7&&[...document.querySelectorAll('.songTab')].some(button=>/LOCAL/i.test(button.textContent||'')),{timeout:5000});

        stage='verify initial layout';
        let state=await snapshot(page);
        const viewportRect={left:0,top:0,right:viewport.width,bottom:viewport.height,width:viewport.width,height:viewport.height};
        assert.equal(state.songSelectHidden,false,`${viewport.name} song select hidden ${JSON.stringify(state)}`);
        assert.equal(state.updateLogVisible,false,`${viewport.name} update log blocks song select ${JSON.stringify(state)}`);
        assert.equal(state.styleInstalled,true,`${viewport.name} responsive style missing`);
        assert.equal(state.coarse,true,`${viewport.name} coarse pointer media query missing`);
        assert.equal(state.cardCount,7,`${viewport.name} LOCAL cards ${JSON.stringify(state)}`);
        assert.match(state.localTabText||'',/LOCAL/i,`${viewport.name} LOCAL tab missing`);
        assertInside(state.shell,viewportRect,`${viewport.name} shell`);
        assertInside(state.header,state.shell,`${viewport.name} header`);
        assertInside(state.carousel,state.shell,`${viewport.name} carousel`);
        assertInside(state.tabs,state.carousel,`${viewport.name} tabs`);
        assertInside(state.localTab,state.tabs,`${viewport.name} LOCAL tab`);
        assertInside(state.footer,state.shell,`${viewport.name} footer`);
        assertInside(state.play,state.footer,`${viewport.name} PLAY`);
        assert(state.header.bottom<=state.carousel.top+2,`${viewport.name} header overlaps carousel ${JSON.stringify(state)}`);
        assert(state.carousel.bottom<=state.footer.top+2,`${viewport.name} carousel overlaps footer ${JSON.stringify(state)}`);
        assert(state.carouselClientHeight>0,`${viewport.name} carousel has no height`);
        if(viewport.name==='folded-landscape')assert(state.carouselScrollHeight>state.carouselClientHeight,`${viewport.name} expected scrollable song list ${JSON.stringify(state)}`);

        stage='verify bottom of song list';
        await page.evaluate(()=>{const carousel=document.getElementById('songCarousel');carousel.scrollTop=carousel.scrollHeight;});
        await page.waitForTimeout(80);
        state=await snapshot(page);
        assertInside(state.tabs,state.carousel,`${viewport.name} sticky tabs after scroll`);
        assertInside(state.localTab,state.tabs,`${viewport.name} sticky LOCAL tab after scroll`);
        assert(state.lastCard&&state.lastCard.bottom<=state.carousel.bottom+2&&state.lastCard.bottom>state.carousel.top,`${viewport.name} last card not reachable ${JSON.stringify(state)}`);
        assert(state.lastCard.top<state.carousel.bottom-8,`${viewport.name} last card not visible after scroll ${JSON.stringify(state)}`);

        stage='verify tab interaction';
        await page.evaluate(()=>{const carousel=document.getElementById('songCarousel');carousel.scrollTop=0;});
        await dismissBlockingOverlays(page);
        const bundled=page.locator('.songTab').filter({hasText:/BUNDLED/i}).first();
        const local=page.locator('.songTab').filter({hasText:/LOCAL/i}).first();
        await bundled.click();
        await local.click();
        await page.waitForFunction(()=>document.querySelectorAll('.songCard').length>=7,{timeout:3000});
        assert.deepEqual(errors,[],`${viewport.name} page errors: ${JSON.stringify(errors)}`);
        console.log(`mobile song select layout passed: ${viewport.name}`);
      }catch(error){
        const report={viewport,stage,error:{message:error?.message||String(error),stack:error?.stack||null},errors,snapshot:null};
        try{report.snapshot=await snapshot(page);}catch(snapshotError){report.snapshotError=snapshotError.message;}
        console.error('MOBILE_SONG_SELECT_LAYOUT_FAILURE',JSON.stringify(report));
        if(artifactDir){
          fs.mkdirSync(artifactDir,{recursive:true});
          fs.writeFileSync(path.join(artifactDir,`mobile-song-select-${viewport.name}.json`),JSON.stringify(report,null,2));
          await page.screenshot({path:path.join(artifactDir,`mobile-song-select-${viewport.name}.png`),fullPage:true}).catch(()=>{});
        }
        throw error;
      }finally{
        await context.close().catch(()=>{});
      }
    }
  }finally{
    if(browser)await browser.close().catch(()=>{});
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
