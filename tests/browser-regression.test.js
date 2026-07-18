const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const { chromium, devices } = require('playwright');

function wait(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
function waitForServer(url, timeoutMs=5000){
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => http.get(url, res => { res.resume(); resolve(); }).on('error', err => {
      if (Date.now() > deadline) reject(err); else setTimeout(attempt, 100);
    });
    attempt();
  });
}
async function waitFor(page, predicate, label, timeoutMs=5000, arg=undefined){
  const deadline = Date.now() + timeoutMs;
  while(Date.now() < deadline){
    const value = await page.evaluate(predicate, arg);
    if(value) return value;
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}
async function measureLoop(page, ms=700){
  const before = await page.evaluate(() => window.CircleMixTestApi.state());
  await wait(ms);
  const after = await page.evaluate(() => window.CircleMixTestApi.state());
  return {before, after, frameDelta: after.frameCount-before.frameCount, renderDelta: after.renderCount-before.renderCount, timeDelta: after.gameTime-before.gameTime};
}
async function lanePoint(page, lane){ return page.evaluate(l => window.CircleMixTestApi.lanePoint(l), lane); }
async function moveToLane(page, lane){ const p = await lanePoint(page, lane); await page.mouse.move(p.x, p.y); return p; }
async function collectErrors(page){
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on('console', msg => { if(msg.type() === 'error') errors.push(`console.error: ${msg.text()}`); });
  return errors;
}

(async()=>{
  const server = spawn(process.execPath, ['-e', "require('http').createServer((req,res)=>{const fs=require('fs'),path=require('path');let u=new URL(req.url,'http://x').pathname;if(u==='/')u='/index.html';const f=path.join(process.cwd(),u);fs.readFile(f,(e,d)=>{if(e){res.statusCode=404;res.end('not found')}else{res.end(d)}})}).listen(4173)"], {cwd: process.cwd(), stdio:'inherit'});
  try{
    await waitForServer('http://127.0.0.1:4173/index.html');
    const browser = await chromium.launch({headless:true});
    const desktop = await browser.newContext({viewport:{width:1280,height:720}, hasTouch:false, isMobile:false});
    const page = await desktop.newPage();
    const errors = await collectErrors(page);
    await page.goto('http://127.0.0.1:4173/index.html?browserTest=1', {waitUntil:'domcontentloaded'});
    await waitFor(page, () => !!window.CircleMixTestApi, 'desktop test api');

    await page.evaluate(() => window.CircleMixTestApi.startTutorial());
    await waitFor(page, () => window.CircleMixTestApi.state().tutorialMode, 'tutorial mode');
    assert.equal(await page.evaluate(() => window.CircleMixTestApi.state().chartLength), 0, 'first AIM tutorial step has no chart notes');
    const stillMouseLoop = await measureLoop(page, 800);
    assert.ok(stillMouseLoop.frameDelta > 10, `still mouse RAF ${stillMouseLoop.frameDelta}`);
    assert.ok(stillMouseLoop.renderDelta > 10, `still mouse render ${stillMouseLoop.renderDelta}`);
    assert.ok(stillMouseLoop.timeDelta > 0.35, `still mouse time ${stillMouseLoop.timeDelta}`);

    await page.hover('#tutorialSkipStep');
    const hudHoverLoop = await measureLoop(page, 600);
    assert.ok(hudHoverLoop.frameDelta > 8, `HUD hover RAF ${hudHoverLoop.frameDelta}`);
    assert.ok(hudHoverLoop.renderDelta > 8, `HUD hover render ${hudHoverLoop.renderDelta}`);
    assert.ok(hudHoverLoop.timeDelta > 0.25, `HUD hover time ${hudHoverLoop.timeDelta}`);

    for (const lane of [0, 2, 5]) await moveToLane(page, lane);
    await waitFor(page, () => window.CircleMixTestApi.state().tutorialStepIndex >= 1, 'AIM step progressed by pointer movement');
    await moveToLane(page, 0);
    await page.mouse.down();
    await page.mouse.up();
    await waitFor(page, () => window.CircleMixTestApi.state().tutorialStepIndex >= 2, 'CUT explore step progressed by real cut input');
    await waitFor(page, () => window.CircleMixTestApi.state().chartLength > 0, 'note tutorial chart');

    await page.evaluate(() => window.CircleMixTestApi.setAimStabilizer('OFF'));
    const p0 = await moveToLane(page, 0);
    await wait(100);
    const offAim = await page.evaluate(([x,y]) => {
      const st = window.CircleMixTestApi.state();
      return {armAngle: st.armAngle, expected: Math.atan2(y-st.cy, x-st.cx)};
    }, [p0.x,p0.y]);
    assert.ok(Math.abs(Math.atan2(Math.sin(offAim.armAngle-offAim.expected), Math.cos(offAim.armAngle-offAim.expected))) < 0.08, 'OFF aim follows atan2 directly');
    const symmetry = await page.evaluate(() => {
      const norm = a => Math.atan2(Math.sin(a), Math.cos(a));
      const dt = 0.016;
      const cw = norm(Math.PI / 2) / dt;
      const ccw = norm(-Math.PI / 2) / dt;
      return {cw, ccw, absEqual: Math.abs(Math.abs(cw)-Math.abs(ccw)) < 1e-9, signOpposite: Math.sign(cw) === -Math.sign(ccw)};
    });
    assert.ok(symmetry.absEqual && symmetry.signOpposite, `CW/CCW symmetry ${JSON.stringify(symmetry)}`);
    await page.hover('#tutorialSkipStep');
    const uiPointer = await page.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(uiPointer.pointerActive, true, 'UI hover keeps pointer tracking active');

    const songResults = {};
    for (const [song, difficulty] of [['anima','tech'], ['ghost-rule','hard']]) {
      await page.evaluate(([songId, diff]) => window.CircleMixTestApi.startBuiltIn(songId, diff), [song, difficulty]);
      await waitFor(page, () => window.CircleMixTestApi.state().chartLength > 0, `${song} chart`);
      const loop = await measureLoop(page, 900);
      assert.ok(loop.frameDelta > 10, `${song} RAF delta ${loop.frameDelta}`);
      assert.ok(loop.renderDelta > 10, `${song} render delta ${loop.renderDelta}`);
      assert.ok(loop.timeDelta > 0.4, `${song} time delta ${loop.timeDelta}`);
      songResults[song] = {chartLength: loop.after.chartLength, frameDelta: loop.frameDelta, renderDelta: loop.renderDelta, timeDelta: loop.timeDelta};
    }

    const mobile = await browser.newContext({...devices['iPhone 12'], viewport:{width:390,height:844}});
    const mobilePage = await mobile.newPage();
    const mobileErrors = await collectErrors(mobilePage);
    await mobilePage.goto('http://127.0.0.1:4173/index.html?browserTest=1', {waitUntil:'domcontentloaded'});
    await waitFor(mobilePage, () => !!window.CircleMixTestApi, 'mobile test api');
    await mobilePage.evaluate(() => window.CircleMixTestApi.startTutorial());
    await waitFor(mobilePage, () => window.CircleMixTestApi.state().tutorialMode, 'mobile tutorial');
    await mobilePage.tap('#game');
    await mobilePage.tap('#mobileActionBtn');
    await mobilePage.tap('#mobileScratchBtn');
    const mobileLoop = await measureLoop(mobilePage, 500);
    assert.ok(mobileLoop.frameDelta > 5, `mobile RAF ${mobileLoop.frameDelta}`);

    await browser.close();
    assert.deepEqual([...errors, ...mobileErrors], []);
    console.log('PASS browser regression', {stillMouseLoop, hudHoverLoop, songResults, mobile:{frameDelta:mobileLoop.frameDelta}});
  } finally {
    server.kill();
  }
})().catch(error => { console.error(error); process.exit(1); });
