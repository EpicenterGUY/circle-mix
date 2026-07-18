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
  let lastValue;
  while(Date.now() < deadline){
    lastValue = await page.evaluate(predicate, arg);
    if(lastValue) return lastValue;
    await wait(100);
  }
  const state = await page.evaluate(() => window.CircleMixTestApi?.state?.() || null).catch(error => ({stateReadError:error.message}));
  throw new Error(`Timed out waiting for ${label}; lastValue=${JSON.stringify(lastValue)}; state=${JSON.stringify(state)}`);
}
async function measureLoop(page, ms=700){
  const before = await page.evaluate(() => window.CircleMixTestApi.state());
  await wait(ms);
  const after = await page.evaluate(() => window.CircleMixTestApi.state());
  return {before, after, frameDelta: after.frameCount-before.frameCount, renderDelta: after.renderCount-before.renderCount, timeDelta: after.gameTime-before.gameTime, wallTimeDelta: after.browserNow-before.browserNow};
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
    assert.ok(stillMouseLoop.wallTimeDelta > 500, `still mouse wall time ${stillMouseLoop.wallTimeDelta}`);

    await page.hover('#tutorialSkipStep');
    const hudHoverLoop = await measureLoop(page, 600);
    assert.ok(hudHoverLoop.frameDelta > 8, `HUD hover RAF ${hudHoverLoop.frameDelta}`);
    assert.ok(hudHoverLoop.renderDelta > 8, `HUD hover render ${hudHoverLoop.renderDelta}`);
    assert.ok(hudHoverLoop.wallTimeDelta > 350, `HUD hover wall time ${hudHoverLoop.wallTimeDelta}`);

    for (const [index, lane] of [0, 2, 5].entries()) {
      await moveToLane(page, lane);
      await wait(320);
      await waitFor(page, expected => {
        const st = window.CircleMixTestApi.state();
        return st.tutorialStepIndex >= 1 || st.tutorialTargetProgress >= expected;
      }, `AIM target progress ${index+1}`, 2000, index+1);
    }
    await waitFor(page, () => window.CircleMixTestApi.state().tutorialStepIndex >= 1, 'AIM step progressed by pointer movement');
    await moveToLane(page, 0);
    await waitFor(page, () => window.CircleMixTestApi.state().inputEnabled, 'CUT input enabled');
    const cutBefore = await page.evaluate(() => window.CircleMixTestApi.state());
    await page.mouse.down();
    await page.mouse.up();
    await waitFor(page, before => {
      const st = window.CircleMixTestApi.state();
      return st.tutorialStepIndex >= 2 && st.tutorialStepIndex > before.tutorialStepIndex;
    }, 'CUT explore step progressed by real cut input', 3000, cutBefore);
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
      const cw = window.CircleMixTestApi.magnetProbe('LOW', 99);
      const ccw = window.CircleMixTestApi.magnetProbe('LOW', -99);
      const slow = window.CircleMixTestApi.magnetProbe('LOW', 0);
      const offFast = window.CircleMixTestApi.magnetProbe('OFF', 99);
      return {cw, ccw, slow, offFast, bothDisengaged: cw.disengaged && ccw.disengaged, absEqual: Math.abs(Math.abs(cw.velocity)-Math.abs(ccw.velocity)) < 1e-9};
    });
    assert.ok(symmetry.bothDisengaged && symmetry.absEqual, `CW/CCW magnet disengage symmetry ${JSON.stringify(symmetry)}`);
    assert.equal(symmetry.slow.disengaged, false, 'slow LOW velocity does not force disengage');
    assert.ok(Number.isFinite(symmetry.slow.result), 'slow LOW probe returns a finite aim angle');
    assert.equal(symmetry.offFast.disengaged, true, 'OFF disables magnet regardless of velocity');
    const beforeUiHover = await page.evaluate(() => window.CircleMixTestApi.state());
    await page.hover('#tutorialSkipStep');
    const uiPointer = await page.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(uiPointer.pointerActive, true, 'UI hover keeps pointer tracking active');
    assert.equal(uiPointer.lastPointerSource, 'pointer');
    assert.notEqual(uiPointer.mouseX, beforeUiHover.mouseX, 'UI hover updates mouseX');
    assert.equal(uiPointer.tutorialStepIndex, beforeUiHover.tutorialStepIndex, 'button hover alone does not advance tutorial');
    assert.equal(uiPointer.tutorialSuccessCount, beforeUiHover.tutorialSuccessCount, 'button hover does not add tutorial success');
    assert.equal(uiPointer.tutorialValidUserInputCount, beforeUiHover.tutorialValidUserInputCount, 'button hover does not add valid input');
    const hoverLoop = await measureLoop(page, 500);
    assert.ok(hoverLoop.frameDelta > 5 && hoverLoop.renderDelta > 5 && hoverLoop.wallTimeDelta > 300, `SKIP hover loop ${JSON.stringify(hoverLoop)}`);

    const beforeHudClick = await page.evaluate(() => window.CircleMixTestApi.state());
    const hudBox = await page.locator('#tutorialHud').boundingBox();
    await page.mouse.move(hudBox.x + 12, hudBox.y + 12);
    await page.mouse.down();
    await page.mouse.up();
    await wait(200);
    const afterHudClick = await page.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(afterHudClick.tutorialStepIndex, beforeHudClick.tutorialStepIndex, 'plain HUD click does not advance tutorial');
    assert.equal(afterHudClick.tutorialSuccessCount, beforeHudClick.tutorialSuccessCount, 'plain HUD click does not add success');
    assert.equal(afterHudClick.tutorialValidUserInputCount, beforeHudClick.tutorialValidUserInputCount, 'plain HUD click does not add CUT judgement');
    const hudClickLoop = await measureLoop(page, 500);
    assert.ok(hudClickLoop.frameDelta > 5 && hudClickLoop.renderDelta > 5 && hudClickLoop.wallTimeDelta > 300, `HUD click loop ${JSON.stringify(hudClickLoop)}`);

    const beforeSkipClick = await page.evaluate(() => window.CircleMixTestApi.state());
    await page.click('#tutorialSkipStep');
    await waitFor(page, before => {
      const st = window.CircleMixTestApi.state();
      return st.tutorialStepIndex === before.tutorialStepIndex + 1;
    }, 'SKIP button advances exactly one tutorial step', 3000, beforeSkipClick);
    const afterSkipClick = await page.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(afterSkipClick.tutorialSuccessCount, beforeSkipClick.tutorialSuccessCount, 'SKIP does not add CUT success');
    assert.equal(afterSkipClick.tutorialValidUserInputCount, beforeSkipClick.tutorialValidUserInputCount, 'SKIP does not add valid CUT input');
    assert.equal(afterSkipClick.tutorialLastAdvanceReason, 'SKIP_BUTTON');
    assert.equal(afterSkipClick.tutorialLastAdvanceSource, 'skip');
    const skipLoop = await measureLoop(page, 500);
    assert.ok(skipLoop.frameDelta > 5 && skipLoop.renderDelta > 5 && skipLoop.wallTimeDelta > 300, `SKIP click loop ${JSON.stringify(skipLoop)}`);

    const songResults = {};
    for (const [song, difficulty] of [['anima','tech'], ['ghost-rule','hard']]) {
      const startResult = await page.evaluate(([songId, diff]) => window.CircleMixTestApi.startBuiltIn(songId, diff), [song, difficulty]);
      assert.equal(startResult.songId, song);
      assert.equal(startResult.difficulty, difficulty);
      await waitFor(page, ([songId, diff]) => { const st=window.CircleMixTestApi.state(); return !st.tutorialMode && st.selectedSongId===songId && st.selectedDifficultyId===diff && st.chartLength > 0; }, `${song} chart`, 5000, [song, difficulty]);
      const loop = await measureLoop(page, 900);
      assert.ok(loop.frameDelta > 10, `${song} RAF delta ${loop.frameDelta}`);
      assert.ok(loop.renderDelta > 10, `${song} render delta ${loop.renderDelta}`);
      assert.ok(loop.timeDelta > 0.4, `${song} time delta ${loop.timeDelta}`);
      songResults[song] = {chartLength: loop.after.chartLength, frameDelta: loop.frameDelta, renderDelta: loop.renderDelta, timeDelta: loop.timeDelta};
    }

    const mobile = await browser.newContext({...devices['iPhone 12'], viewport:{width:844,height:390}, screen:{width:844,height:390}});
    const mobilePage = await mobile.newPage();
    const mobileErrors = await collectErrors(mobilePage);
    await mobilePage.goto('http://127.0.0.1:4173/index.html?browserTest=1', {waitUntil:'domcontentloaded'});
    await waitFor(mobilePage, () => !!window.CircleMixTestApi, 'mobile test api');
    await mobilePage.evaluate(() => window.CircleMixTestApi.startTutorial());
    await waitFor(mobilePage, () => window.CircleMixTestApi.state().tutorialMode, 'mobile tutorial');
    await waitFor(mobilePage, () => !document.getElementById('rotateOverlay')?.classList.contains('show'), 'mobile rotate overlay hidden');
    const gameBox = await mobilePage.locator('#game').boundingBox();
    assert.ok(gameBox && gameBox.width > 0 && gameBox.height > 0, `valid mobile canvas box ${JSON.stringify(gameBox)}`);
    await mobilePage.touchscreen.tap(gameBox.x + gameBox.width / 2, gameBox.y + gameBox.height / 2);
    const afterAimTap = await mobilePage.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(afterAimTap.lastPointerSource, 'touch');
    assert.equal(afterAimTap.mobileAimPointerId, null, 'mobile AIM pointer releases after tap');
    await mobilePage.locator('#mobileActionBtn').dispatchEvent('pointerdown', {pointerId:41, pointerType:'touch', isPrimary:true, bubbles:true});
    const actionDown = await mobilePage.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(actionDown.mobileActionPointerId, 41);
    assert.equal(actionDown.actionHeld, true);
    await mobilePage.locator('#mobileActionBtn').dispatchEvent('pointerup', {pointerId:41, pointerType:'touch', isPrimary:true, bubbles:true});
    const actionUp = await mobilePage.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(actionUp.mobileActionPointerId, null);
    assert.equal(actionUp.actionHeld, false);
    await mobilePage.locator('#mobileScratchBtn').dispatchEvent('pointerdown', {pointerId:42, pointerType:'touch', isPrimary:true, bubbles:true});
    const scratchDown = await mobilePage.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(scratchDown.mobileScratchPointerId, 42);
    assert.equal(scratchDown.scratchHeld, true);
    await mobilePage.locator('#mobileScratchBtn').dispatchEvent('pointercancel', {pointerId:42, pointerType:'touch', isPrimary:true, bubbles:true});
    const scratchUp = await mobilePage.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(scratchUp.mobileScratchPointerId, null);
    assert.equal(scratchUp.scratchHeld, false);
    const mobileLoop = await measureLoop(mobilePage, 500);
    assert.ok(mobileLoop.frameDelta > 5 && mobileLoop.renderDelta > 5 && mobileLoop.wallTimeDelta > 300, `mobile loop ${JSON.stringify(mobileLoop)}`);

    await browser.close();
    assert.deepEqual([...errors, ...mobileErrors], []);
    console.log('PASS browser regression', {stillMouseLoop, hudHoverLoop, songResults, mobile:{frameDelta:mobileLoop.frameDelta}});
  } finally {
    server.kill();
  }
})().catch(error => { console.error(error); process.exit(1); });
