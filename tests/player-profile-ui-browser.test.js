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

async function dismissBlockingUi(page){
  await page.evaluate(()=>{
    const update=document.getElementById('updateLogOverlay');
    if(update){update.classList.remove('show');update.hidden=true;}
    document.body.classList.remove('updateLogOpen');
    const prompt=document.getElementById('tutorialPrompt');
    if(prompt)prompt.hidden=true;
  });
}

async function snapshot(page){
  return page.evaluate(()=>({
    bodyClass:document.body.className,
    profileButton:!!document.getElementById('circleMixProfileBtn'),
    profileVisible:!document.getElementById('circleMixProfileOverlay')?.hidden,
    nickname:document.getElementById('circleMixProfileNickname')?.value||null,
    stats:[...document.querySelectorAll('.circleMixProfileStat strong')].map(node=>node.textContent),
    recent:[...document.querySelectorAll('.circleMixProfileRecord')].map(node=>node.textContent)
  }));
}

(async()=>{
  const server=await startServer(process.cwd());
  const port=server.address().port;
  let browser,context,page;
  let stage='launch';
  const errors=[];
  try{
    browser=await chromium.launch({headless:true});
    context=await browser.newContext({viewport:{width:960,height:720},serviceWorkers:'block'});
    page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    stage='load profile screen';
    await page.goto(`http://127.0.0.1:${port}/index.html?browserTest=1`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.CircleMixPlayerProfile&&window.CircleMixPlayerProfileUi&&document.getElementById('circleMixProfileBtn'),{timeout:10000});
    await dismissBlockingUi(page);

    stage='seed profile records';
    await page.evaluate(async()=>{
      localStorage.removeItem('circleMixProfileNickname');
      await window.CircleMixPlayerProfile.clearAll();
      const base={source:'local',songId:'test-song',songTitle:'TEST SONG',artist:'TEST ARTIST',appVersion:'0.9.30',autoPlay:false,totalNotes:100};
      await window.CircleMixPlayerProfile.recordPlay({...base,chartId:'expert',difficultyLabel:'EXPERT',starLevel:'7.0★',score:950000,power:4321,rank:'SS',accuracyRatio:.9875,perfectCount:99,greatCount:1,missCount:0,maxCombo:100,playedAt:'2026-07-22T01:00:00.000Z'});
      await window.CircleMixPlayerProfile.recordPlay({...base,source:'builtin',songId:'anima',songTitle:'ANiMA',chartId:'normal',difficultyLabel:'NORMAL',starLevel:'2.9★',score:880000,power:3800,rank:'S',accuracyRatio:.95,perfectCount:95,greatCount:4,missCount:1,maxCombo:70,playedAt:'2026-07-22T01:01:00.000Z'});
      await window.CircleMixPlayerProfile.recordPlay({...base,chartId:'auto',autoPlay:true,score:1000000,power:9999,missCount:0});
    });

    stage='open and verify profile';
    await page.click('#circleMixProfileBtn');
    await page.waitForFunction(()=>!document.getElementById('circleMixProfileOverlay').hidden);
    await page.waitForFunction(()=>document.getElementById('circleMixProfilePlayCount')?.textContent==='2'&&document.querySelectorAll('.circleMixProfileRecord').length===2,{timeout:5000});
    assert.equal(await page.textContent('#circleMixProfilePlayCount'),'2');
    assert.equal(await page.textContent('#circleMixProfileFcCount'),'1');
    assert.equal(await page.textContent('#circleMixProfileAccuracy'),'96.88%');
    assert.equal(await page.textContent('#circleMixProfilePower'),'4,321');
    assert.equal(await page.textContent('#circleMixProfileChartCount'),'2');
    assert.equal(await page.locator('.circleMixProfileRecord').count(),2);
    assert.match(await page.locator('.circleMixProfileRecord').first().textContent(),/ANiMA/);

    stage='save nickname';
    await page.fill('#circleMixProfileNickname','RHYTHM TESTER');
    await page.click('.circleMixProfileSave');
    assert.equal(await page.textContent('#circleMixProfileAvatar'),'R');
    assert.equal(await page.evaluate(()=>localStorage.getItem('circleMixProfileNickname')),'RHYTHM TESTER');

    stage='mobile layout';
    await page.setViewportSize({width:390,height:844});
    const bounds=await page.evaluate(()=>{
      const overlay=document.getElementById('circleMixProfileOverlay').getBoundingClientRect();
      const panel=document.querySelector('.circleMixProfilePanel').getBoundingClientRect();
      return {overlay:{left:overlay.left,top:overlay.top,right:overlay.right,bottom:overlay.bottom},panel:{left:panel.left,top:panel.top,right:panel.right,bottom:panel.bottom},viewport:{width:innerWidth,height:innerHeight}};
    });
    assert.ok(bounds.panel.left>=0&&bounds.panel.right<=bounds.viewport.width+1,'profile panel must fit mobile width');
    assert.ok(bounds.panel.top>=0&&bounds.panel.bottom<=bounds.viewport.height+1,'profile panel must fit mobile height');

    stage='persist nickname after reload';
    await page.keyboard.press('Escape');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.CircleMixPlayerProfileUi&&document.getElementById('circleMixProfileBtn'),{timeout:10000});
    await dismissBlockingUi(page);
    await page.click('#circleMixProfileBtn');
    await page.waitForFunction(()=>!document.getElementById('circleMixProfileOverlay').hidden);
    assert.equal(await page.inputValue('#circleMixProfileNickname'),'RHYTHM TESTER');
    assert.equal(await page.textContent('#circleMixProfileAvatar'),'R');
    assert.deepEqual(errors,[],`profile UI page errors: ${JSON.stringify(errors)}`);
    console.log('player profile UI browser regression passed');
  }catch(error){
    const report={stage,error:{message:error?.message||String(error),stack:error?.stack||null},errors,snapshot:null};
    if(page){try{report.snapshot=await snapshot(page);}catch(snapshotError){report.snapshotError=snapshotError.message;}}
    console.error('PLAYER_PROFILE_UI_BROWSER_FAILURE',JSON.stringify(report));
    if(artifactDir){
      fs.mkdirSync(artifactDir,{recursive:true});
      fs.writeFileSync(path.join(artifactDir,'player-profile-ui-browser-failure.json'),JSON.stringify(report,null,2));
      if(page)await page.screenshot({path:path.join(artifactDir,'player-profile-ui-browser-failure.png'),fullPage:true}).catch(()=>{});
    }
    throw error;
  }finally{
    if(context)await context.close().catch(()=>{});
    if(browser)await browser.close().catch(()=>{});
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
