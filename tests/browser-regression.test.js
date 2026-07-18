const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');

let playwright;
try { playwright = require('playwright'); }
catch (error) {
  if (process.env.CI_BROWSER_REQUIRED === '1') throw error;
  console.log('SKIP browser regression: install playwright to run this test');
  process.exit(0);
}

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

(async()=>{
  const server = spawn(process.execPath, ['-e', "require('http').createServer((req,res)=>{const fs=require('fs'),path=require('path');let u=new URL(req.url,'http://x').pathname;if(u==='/')u='/index.html';const f=path.join(process.cwd(),u);fs.readFile(f,(e,d)=>{if(e){res.statusCode=404;res.end('not found')}else{res.end(d)}})}).listen(4173)"], {cwd: process.cwd(), stdio:'inherit'});
  try{
    await waitForServer('http://127.0.0.1:4173/index.html');
    const browser = await playwright.chromium.launch({headless:true});
    const context = await browser.newContext({viewport:{width:1280,height:720}, hasTouch:false, isMobile:false});
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.stack || error.message));
    page.on('console', msg => { if(msg.type() === 'error') pageErrors.push(msg.text()); });
    await page.goto('http://127.0.0.1:4173/index.html?browserTest=1', {waitUntil:'domcontentloaded'});
    await waitFor(page, () => !!window.CircleMixTestApi, 'test api');

    await page.evaluate(() => window.CircleMixTestApi.startTutorial());
    await waitFor(page, () => window.CircleMixTestApi.state().chartLength > 0, 'tutorial chart');
    const tutorialLoop = await measureLoop(page, 900);
    assert.ok(tutorialLoop.frameDelta > 10, `tutorial RAF delta ${tutorialLoop.frameDelta}`);
    assert.ok(tutorialLoop.renderDelta > 10, `tutorial render delta ${tutorialLoop.renderDelta}`);
    assert.ok(tutorialLoop.timeDelta > 0.4, `tutorial time delta ${tutorialLoop.timeDelta}`);
    const stepBefore = await page.evaluate(() => window.CircleMixTestApi.state().tutorialStepIndex);
    await page.click('#tutorialSkipStep');
    await waitFor(page, step => window.CircleMixTestApi.state().tutorialStepIndex > step, 'tutorial step advance', 3000, stepBefore);

    for (const [song, difficulty] of [['anima','tech'], ['ghost-rule','hard']]) {
      await page.evaluate(([songId, diff]) => window.CircleMixTestApi.startBuiltIn(songId, diff), [song, difficulty]);
      await waitFor(page, () => window.CircleMixTestApi.state().chartLength > 0, `${song} chart`);
      const loop = await measureLoop(page, 900);
      assert.ok(loop.frameDelta > 10, `${song} RAF delta ${loop.frameDelta}`);
      assert.ok(loop.renderDelta > 10, `${song} render delta ${loop.renderDelta}`);
      assert.ok(loop.timeDelta > 0.4, `${song} time delta ${loop.timeDelta}`);
    }

    await browser.close();
    assert.deepEqual(pageErrors, []);
    console.log('PASS browser regression', {pageErrors: pageErrors.length, tutorialLoop});
  } finally {
    server.kill();
  }
})().catch(error => { console.error(error); process.exit(1); });
