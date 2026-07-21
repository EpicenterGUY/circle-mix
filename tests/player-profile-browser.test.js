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

async function snapshot(page){
  return page.evaluate(async()=>({
    url:location.href,
    activeScene:window.CircleMixTestApi?.state?.().activeScene||null,
    resultVisible:document.getElementById('resultOverlay')?.classList.contains('show')||false,
    resultAuto:document.getElementById('resultAuto')?.textContent||null,
    resultScore:document.getElementById('resultScore')?.textContent||null,
    profileLoaded:!!window.CircleMixPlayerProfile,
    summary:window.CircleMixPlayerProfile?await window.CircleMixPlayerProfile.getSummary().catch(error=>({error:error.message})):null,
    recent:window.CircleMixPlayerProfile?await window.CircleMixPlayerProfile.listRecent(5).catch(error=>[{error:error.message}]):null
  }));
}

async function waitForPlayCount(page,expected,timeout=5000){
  const deadline=Date.now()+timeout;
  let summary=null;
  while(Date.now()<deadline){
    summary=await page.evaluate(()=>window.CircleMixPlayerProfile.getSummary());
    if(summary.playCount===expected)return summary;
    await page.waitForTimeout(100);
  }
  throw new Error(`Timed out waiting for profile playCount ${expected}; last summary ${JSON.stringify(summary)}`);
}

(async()=>{
  const server=await startServer(process.cwd());
  const port=server.address().port;
  let browser,context,page;
  let stage='launch';
  const errors=[];
  try{
    browser=await chromium.launch({headless:true});
    context=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
    page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    stage='load profile module';
    await page.goto(`http://127.0.0.1:${port}/index.html?browserTest=1&song=anima&difficulty=normal`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.CircleMixTestApi&&window.CircleMixPlayerProfile,{timeout:10000});
    await page.evaluate(()=>{
      const update=document.getElementById('updateLogOverlay');
      if(update){update.classList.remove('show');update.hidden=true;}
      document.body.classList.remove('updateLogOpen');
      const prompt=document.getElementById('tutorialPrompt');
      if(prompt)prompt.hidden=true;
    });
    stage='clear profile';
    await page.evaluate(()=>window.CircleMixPlayerProfile.clearAll());

    stage='complete player result';
    await page.evaluate(()=>{
      window.CircleMixTestApi.startBuiltInChartTest('anima','normal');
      window.CircleMixTestApi.completeChartTestAsPlayer();
    });
    stage='wait for saved player result';
    await waitForPlayCount(page,1);

    stage='verify player result';
    const playerState=await page.evaluate(async()=>({
      summary:await window.CircleMixPlayerProfile.getSummary(),
      recent:await window.CircleMixPlayerProfile.listRecent(5)
    }));
    assert.equal(playerState.summary.playCount,1);
    assert.equal(playerState.summary.fullComboCount,1);
    assert.equal(playerState.recent.length,1);
    assert.equal(playerState.recent[0].chartKey,'builtin:anima:normal');
    assert.equal(playerState.recent[0].autoPlay,false);
    assert.equal(playerState.recent[0].fullCombo,true);
    assert.ok(playerState.recent[0].score>0);

    stage='complete AUTO result';
    await page.evaluate(()=>{
      window.CircleMixTestApi.startBuiltInChartTest('anima','normal');
      window.CircleMixTestApi.advanceTestClock(130,.05);
    });
    await page.waitForTimeout(1200);
    stage='verify AUTO exclusion';
    const afterAuto=await page.evaluate(()=>window.CircleMixPlayerProfile.getSummary());
    assert.equal(afterAuto.playCount,1,'AUTO result must not be saved to profile history');
    assert.deepEqual(errors,[],`profile browser page errors: ${JSON.stringify(errors)}`);
    console.log('player profile browser regression passed');
  }catch(error){
    const report={stage,error:{message:error?.message||String(error),stack:error?.stack||null},errors,snapshot:null};
    if(page){try{report.snapshot=await snapshot(page);}catch(snapshotError){report.snapshotError=snapshotError.message;}}
    console.error('PLAYER_PROFILE_BROWSER_FAILURE',JSON.stringify(report));
    if(artifactDir){
      fs.mkdirSync(artifactDir,{recursive:true});
      fs.writeFileSync(path.join(artifactDir,'player-profile-browser-failure.json'),JSON.stringify(report,null,2));
      if(page)await page.screenshot({path:path.join(artifactDir,'player-profile-browser-failure.png'),fullPage:true}).catch(()=>{});
    }
    throw error;
  }finally{
    if(context)await context.close().catch(()=>{});
    if(browser)await browser.close().catch(()=>{});
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
