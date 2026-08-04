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
async function prepareFixture(page){
  return page.evaluate(()=>{
    const update=document.getElementById('updateLogOverlay');if(update){update.classList.remove('show');update.hidden=true;}
    document.body.classList.remove('updateLogOpen');document.body.classList.add('safeSongSelect');
    const select=document.getElementById('songSelect');if(select)select.hidden=false;
    const carousel=document.getElementById('songCarousel');
    if(!carousel)throw new Error('songCarousel missing');
    [...carousel.children].filter(node=>!node.classList.contains('songTabs')).forEach(node=>node.remove());
    for(let index=0;index<8;index++){
      const card=document.createElement('article');card.className='songCard';card.dataset.testSong=String(index);
      card.style.minHeight='180px';card.innerHTML=`<button class="songCardPick" type="button"><span class="songMeta"><strong>OVERFLOW TRACK ${index+1}</strong><em>CIRCLE MIX TEST</em></span></button>`;
      carousel.appendChild(card);
    }
    let difficulty=document.querySelector('.songDifficulty');
    if(!difficulty){
      difficulty=document.createElement('div');difficulty.className='songDifficulty';
      const footer=document.querySelector('.songSelectFooter')||document.getElementById('songSelectShell')||document.body;
      footer.prepend(difficulty);
    }
    difficulty.replaceChildren();
    for(let index=0;index<18;index++){
      const button=document.createElement('button');button.type='button';button.className='songDiffBtn';button.dataset.testDifficulty=String(index);button.textContent=`DIFFICULTY ${String(index+1).padStart(2,'0')}`;
      difficulty.appendChild(button);
    }
    window.CircleMixCmixImportUi.installDifficultyScroller(document);
    const local=window.CircleMixSongRecord.normalize({id:'sort-test',source:'local',difficultyOrder:['master','basic','expert','advanced'],difficulties:{master:{label:'MASTER',level:12},basic:{label:'BASIC',level:3},expert:{label:'EXPERT',level:9.5},advanced:{label:'ADVANCED',level:6}},charts:{}},'local');
    carousel.scrollTop=0;difficulty.scrollLeft=0;
    return local.difficultyOrder;
  });
}
async function snapshot(page){
  return page.evaluate(()=>{
    const box=element=>{if(!element)return null;const rect=element.getBoundingClientRect();return {top:rect.top,bottom:rect.bottom,left:rect.left,right:rect.right,width:rect.width,height:rect.height};};
    const carousel=document.getElementById('songCarousel'),tabs=document.querySelector('.songTabs'),cards=[...document.querySelectorAll('.songCard[data-test-song]')],style=getComputedStyle(carousel);
    const difficulty=document.querySelector('.songDifficulty'),difficultyButtons=[...document.querySelectorAll('.songDiffBtn[data-test-difficulty]')],difficultyStyle=getComputedStyle(difficulty);
    return {carousel:box(carousel),tabs:box(tabs),first:box(cards[0]),second:box(cards[1]),last:box(cards.at(-1)),count:cards.length,scrollTop:carousel.scrollTop,clientHeight:carousel.clientHeight,scrollHeight:carousel.scrollHeight,alignContent:style.alignContent,overflowY:style.overflowY,difficulty:{box:box(difficulty),first:box(difficultyButtons[0]),last:box(difficultyButtons.at(-1)),count:difficultyButtons.length,scrollLeft:difficulty.scrollLeft,clientWidth:difficulty.clientWidth,scrollWidth:difficulty.scrollWidth,overflowX:difficultyStyle.overflowX,flexWrap:difficultyStyle.flexWrap}};
  });
}
(async()=>{
  const server=await startServer(process.cwd());
  const port=server.address().port;
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    for(const testCase of CASES){
      const context=await browser.newContext({viewport:testCase.viewport,isMobile:testCase.isMobile,hasTouch:testCase.hasTouch,deviceScaleFactor:1,serviceWorkers:'block'});
      await context.addInitScript(()=>{try{localStorage.setItem('circleMixLastSeenVersion','0.9.35');}catch(_){}});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      try{
        await page.goto(`http://127.0.0.1:${port}/index.html?browserTest=1`,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.CircleMixSongRecord&&window.CircleMixCmixImportUi&&document.getElementById('songCarousel')&&document.querySelector('link[data-circle-mix-song-select-fixes]'),{timeout:10000});
        const order=await prepareFixture(page);
        assert.deepEqual(order,['basic','advanced','expert','master'],`${testCase.name} LOCAL difficulty order`);
        await page.waitForTimeout(100);
        const top=await snapshot(page);
        const visibleTop=top.tabs?.bottom??top.carousel.top;
        assert.equal(top.count,8,`${testCase.name} card count`);
        assert.equal(top.scrollTop,0,`${testCase.name} list does not start at top`);
        assert.equal(top.alignContent,'flex-start',`${testCase.name} rows are still vertically centered`);
        assert.match(top.overflowY,/auto|scroll/,`${testCase.name} list is not vertically scrollable`);
        assert(top.scrollHeight>top.clientHeight,`${testCase.name} fixture should overflow: ${JSON.stringify(top)}`);
        assert(top.first.top>=visibleTop-2,`${testCase.name} first song is clipped: ${JSON.stringify(top)}`);
        assert(top.second.top>=visibleTop-2,`${testCase.name} second song is clipped: ${JSON.stringify(top)}`);
        assert.equal(top.difficulty.count,18,`${testCase.name} difficulty count`);
        assert.equal(top.difficulty.flexWrap,'nowrap',`${testCase.name} difficulty row wrapped`);
        assert.match(top.difficulty.overflowX,/auto|scroll/,`${testCase.name} difficulty row is not horizontally scrollable`);
        assert(top.difficulty.scrollWidth>top.difficulty.clientWidth,`${testCase.name} difficulty fixture should overflow: ${JSON.stringify(top.difficulty)}`);
        assert(top.difficulty.first.left>=top.difficulty.box.left-2,`${testCase.name} first difficulty is clipped`);
        const wheelMoved=await page.evaluate(async()=>{
          const row=document.querySelector('.songDifficulty');
          row.scrollLeft=0;
          row.dispatchEvent(new WheelEvent('wheel',{deltaY:480,bubbles:true,cancelable:true}));
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          return row.scrollLeft;
        });
        assert(wheelMoved>0,`${testCase.name} vertical wheel did not move the difficulty row`);
        await page.evaluate(()=>{const carousel=document.getElementById('songCarousel');carousel.scrollTop=carousel.scrollHeight;const row=document.querySelector('.songDifficulty');row.scrollLeft=row.scrollWidth;});
        await page.waitForTimeout(100);
        const bottom=await snapshot(page);
        assert(bottom.scrollTop>0,`${testCase.name} list did not scroll`);
        assert(bottom.last.bottom<=bottom.carousel.bottom+2&&bottom.last.bottom>bottom.carousel.top,`${testCase.name} last song is unreachable: ${JSON.stringify(bottom)}`);
        assert(bottom.difficulty.scrollLeft>0,`${testCase.name} difficulty row did not scroll`);
        assert(bottom.difficulty.last.right<=bottom.difficulty.box.right+2&&bottom.difficulty.last.right>bottom.difficulty.box.left,`${testCase.name} last difficulty is unreachable: ${JSON.stringify(bottom.difficulty)}`);
        assert.deepEqual(errors,[],`${testCase.name} page errors: ${JSON.stringify(errors)}`);
        console.log(`song select overflow passed: ${testCase.name}`);
      }finally{await context.close();}
    }
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
