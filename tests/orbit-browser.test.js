'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
  const relative=pathname==='/'?'orbit.html':pathname.replace(/^\/+/, '');
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404);response.end('not found');return;}
  response.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream'});
  fs.createReadStream(file).pipe(response);
});

(async()=>{
  let browser;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const {port}=server.address();
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    const pageErrors=[];
    page.on('pageerror',error=>pageErrors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/orbit.html`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof window.CircleMixOrbitTestApi==='object');
    const initial=await page.evaluate(()=>({
      canvas:{width:document.getElementById('orbitCanvas').width,height:document.getElementById('orbitCanvas').height},
      types:[...new Set(window.CircleMixOrbitTestApi.chart.map(note=>note.type))],
      rings:[...new Set(window.CircleMixOrbitTestApi.chart.flatMap(note=>note.stackRings||[note.ring]))],
      ribbonRings:[...new Set(window.CircleMixOrbitTestApi.chart.filter(note=>note.type==='ribbon').flatMap(note=>note.points.map(point=>point.ring)))],
      state:window.CircleMixOrbitTestApi.state(),
      shortcuts:document.getElementById('orbitCanvas').getAttribute('aria-keyshortcuts'),
      badges:document.querySelector('.orbitModeBadges')?.textContent||''
    }));
    assert.ok(initial.canvas.width>300&&initial.canvas.height>300,'ORBIT canvas is sized');
    assert.deepEqual(initial.types.sort(),['bloom','dot','flipCCW','flipCW','hold','pulse','ribbon','roll','stack']);
    assert.deepEqual(initial.rings.sort(),[0,1,2]);
    assert.deepEqual(initial.ribbonRings.sort(),[0,1,2]);
    assert.equal(initial.state.ringCount,3);
    assert.equal(initial.state.drawMode,true);
    assert.match(initial.badges,/3 RINGS/);
    assert.match(initial.badges,/DRAW MODE/);
    assert.equal(initial.types.some(type=>type.startsWith('trace')||type.startsWith('scratch')),false);
    assert.match(initial.shortcuts,/ArrowLeft/);
    await page.locator('#orbitStart').click();
    await page.waitForFunction(()=>window.CircleMixOrbitTestApi.state().running===true);
    await page.waitForFunction(()=>window.CircleMixOrbitTestApi.state().frameCount>2);
    const playing=await page.evaluate(()=>window.CircleMixOrbitTestApi.state());
    assert.equal(playing.running,true);
    assert.ok(Number.isFinite(playing.judgeLineAngle));
    assert.equal(playing.ringCount,3);
    assert.equal(pageErrors.length,0,pageErrors.join('\n'));
    console.log('orbit picture browser regression passed');
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
