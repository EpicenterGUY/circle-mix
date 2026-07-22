const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, devices } = require('playwright');

const artifactDir = process.env.BROWSER_ARTIFACTS_DIR;
const diagnosticContexts = new Set();
const diagnosticPages = new Set();
const diagnosticLogs = new Map();
let activeBrowser = null;

async function registerDiagnosticContext(context){
  diagnosticContexts.add(context);
  if(artifactDir) await context.tracing.start({screenshots:true, snapshots:true, sources:true});
  return context;
}
function registerDiagnosticPage(page){ diagnosticPages.add(page); return page; }
function unregisterDiagnosticContext(context, page){ diagnosticContexts.delete(context); if(page){ diagnosticPages.delete(page); diagnosticLogs.delete(page); } }
async function captureFailureArtifacts(error){
  if(!artifactDir) return;
  fs.mkdirSync(artifactDir, {recursive:true});
  const report = {error:{message:error?.message || String(error), stack:error?.stack || null}, pages:[]};
  for(const [index, page] of [...diagnosticPages].entries()){
    const prefix = `page-${index + 1}`;
    try{
      await page.screenshot({path:path.join(artifactDir, `${prefix}.png`), fullPage:true});
      const snapshot = await page.evaluate(() => {
        const visible = id => { const element=document.getElementById(id); if(!element) return null; const style=getComputedStyle(element); return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0; };
        return {
          state: window.CircleMixTestApi?.state?.() ?? null,
          url: location.href,
          bodyClass: document.body?.className ?? null,
          overlays: Object.fromEntries(['startLayer','tutorialPrompt','songSelect','updateLogOverlay','tutorialHud','tutorialComplete','rotateOverlay'].map(id => [id, visible(id)]))
        };
      });
      fs.writeFileSync(path.join(artifactDir, `${prefix}-state.json`), JSON.stringify(snapshot, null, 2));
      report.pages.push({prefix, ...snapshot, errors:diagnosticLogs.get(page) || []});
    }catch(captureError){ report.pages.push({prefix, captureError:captureError.message}); }
  }
  for(const [index, context] of [...diagnosticContexts].entries()){
    try{ await context.tracing.stop({path:path.join(artifactDir, `context-${index + 1}-trace.zip`)}); }catch(_){}
  }
  fs.writeFileSync(path.join(artifactDir, 'failure-report.json'), JSON.stringify(report, null, 2));
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
async function measureLoopUntil(page, {timeoutMs=2800, pollMs=100}={}){
  const before = await page.evaluate(() => window.CircleMixTestApi.state());
  const deadline = Date.now() + timeoutMs;
  let loop;
  do {
    await wait(Math.min(pollMs, Math.max(0, deadline - Date.now())));
    const after = await page.evaluate(() => window.CircleMixTestApi.state());
    loop = {before, after, frameDelta: after.frameCount-before.frameCount, renderDelta: after.renderCount-before.renderCount, timeDelta: after.gameTime-before.gameTime, wallTimeDelta: after.browserNow-before.browserNow};
    if(loop.frameDelta >= 6 && loop.renderDelta >= 6 && loop.timeDelta > 0.2 && loop.wallTimeDelta > 500) return loop;
  } while(Date.now() < deadline);
  return loop;
}
async function waitForStableCircleMixPage(page, label){
  for(let attempt=0; attempt<4; attempt++){
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => document.readyState !== 'loading', null, {timeout:10000});
    const serviceWorkerSupported = await page.evaluate(() => 'serviceWorker' in navigator);
    if(serviceWorkerSupported){
      await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
      await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, {timeout:10000});
    }
    await page.waitForFunction(() => {
      const api = window.CircleMixTestApi;
      return document.readyState !== 'loading' &&
        typeof api === 'object' &&
        typeof api.startTutorial === 'function' &&
        (!('serviceWorker' in navigator) || !!navigator.serviceWorker.controller);
    }, null, {timeout:10000});
    const beforeTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    await wait(250);
    const stable = await page.evaluate(timeOrigin => {
      const api = window.CircleMixTestApi;
      return performance.timeOrigin === timeOrigin &&
        document.readyState !== 'loading' &&
        typeof api === 'object' &&
        typeof api.startTutorial === 'function' &&
        (!('serviceWorker' in navigator) || !!navigator.serviceWorker.controller);
    }, beforeTimeOrigin).catch(() => false);
    if(stable){ await assertStateContract(page, label); return; }
  }
  const state = await page.evaluate(() => ({
    readyState: document.readyState,
    hasApi: typeof window.CircleMixTestApi,
    hasStartTutorial: typeof window.CircleMixTestApi?.startTutorial,
    serviceWorkerSupported: 'serviceWorker' in navigator,
    serviceWorkerControlled: !!navigator.serviceWorker?.controller,
    href: location.href,
    timeOrigin: performance.timeOrigin
  })).catch(error => ({stateReadError:error.message}));
  throw new Error(`Timed out waiting for stable CIRCLE MIX page (${label}); state=${JSON.stringify(state)}`);
}
async function assertStateContract(page, label){
  const state = await page.evaluate(() => window.CircleMixTestApi?.state?.());
  assert.ok(state && typeof state === 'object', `${label} exposes CircleMixTestApi.state()`);
  const booleans = ['running','paused','tutorialMode','tutorialPointerMoved','tutorialTransitioning','tutorialFinalMixRetryScheduled','tutorialChartSettled','tutorialHudHidden','tutorialCompleteVisible','inputEnabled','pointerActive','actionHeld','scratchHeld','mouseDownRight'];
  const numbers = ['tutorialStepIndex','tutorialTargetProgress','tutorialInputEnabledAt','tutorialSuccessCount','tutorialValidUserInputCount','pendingTutorialSkipCount','tutorialStepToken','tutorialAttemptId','tutorialTimerCount','tutorialFinalMixRetryCount','tutorialChartFinalizationCount','tutorialCompleteCount','tutorialRafCount','judgedCount','chartLength','gameTime','browserNow','frameCount','renderCount','mouseX','mouseY','armAngle','rawArmVel','rawAngularVelocity','W','H','cx','cy','hitR'];
  for(const key of booleans) assert.equal(typeof state[key], 'boolean', `${label} state.${key} must be an explicit boolean`);
  for(const key of numbers) assert.ok(Number.isFinite(state[key]), `${label} state.${key} must be a finite explicit number`);
  for(const key of ['tutorialExploreInsideSince','mobileAimPointerId','mobileActionPointerId','mobileScratchPointerId']) assert.ok(state[key] === null || typeof state[key] === 'number', `${label} state.${key} must be null or a number`);
  return state;
}
async function assertViewportStateAfter(page, action, label){
  await page.evaluate(action);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const state = await assertStateContract(page, label);
  for(const key of ['W','H','cx','cy','hitR']) assert.ok(Number.isFinite(state[key]), `${label} state.${key} remains finite after viewport event`);
}
async function runViewportResizeRegression(page, label){
  await assertStateContract(page, `${label} initial viewport`);
  await assertViewportStateAfter(page, () => window.dispatchEvent(new Event('resize')), `${label} window resize`);
  await assertViewportStateAfter(page, () => window.CircleMixTestApi.triggerViewportResizeObserverCallback(), `${label} ResizeObserver callback`);
  await assertViewportStateAfter(page, () => window.dispatchEvent(new Event('orientationchange')), `${label} orientationchange`);
}
async function lanePoint(page, lane){ return page.evaluate(l => window.CircleMixTestApi.lanePoint(l), lane); }
async function moveToLane(page, lane){ const p = await lanePoint(page, lane); await page.mouse.move(p.x, p.y); return p; }

async function clickSkipRapidly(page, count, intervalMs){
  const steps = [];
  for(let i=0;i<count;i++){
    await page.locator('#tutorialSkipStep').click({timeout:3000});
    steps.push(await page.evaluate(() => window.CircleMixTestApi.state()));
    if(intervalMs) await wait(intervalMs);
  }
  return steps;
}
async function runRapidSkipRegression(page, label){
  await page.evaluate(() => window.CircleMixTestApi.startTutorial());
  await waitFor(page, () => window.CircleMixTestApi.state().tutorialMode, `${label} tutorial mode`);
  const intervals = [20, 50, 80, 120];
  for(const interval of intervals){
    const before = await page.evaluate(() => window.CircleMixTestApi.state());
    await clickSkipRapidly(page, 2, interval);
    await waitFor(page, arg => {
      const st = window.CircleMixTestApi.state();
      return !st.tutorialMode || (
        st.tutorialStepIndex >= arg.beforeIndex + 2 &&
        st.pendingTutorialSkipCount === 0 &&
        st.tutorialTransitioning === false &&
        st.tutorialTransitionState === 'IDLE'
      );
    }, `${label} rapid skip ${interval}ms`, 8000, {beforeIndex:before.tutorialStepIndex});
    const after = await page.evaluate(() => window.CircleMixTestApi.state());
    assert.ok(after.tutorialStepIndex >= before.tutorialStepIndex, `${label} ${interval}ms monotonic ${JSON.stringify({before, after})}`);
    assert.equal(after.pendingTutorialSkipCount, 0, `${label} ${interval}ms queue drained`);
    const loop = await measureLoop(page, 700);
    assert.ok(loop.frameDelta > 5, `${label} ${interval}ms RAF survives ${JSON.stringify(loop)}`);
    assert.ok(loop.renderDelta > 5, `${label} ${interval}ms render survives ${JSON.stringify(loop)}`);
    assert.ok(loop.timeDelta > 0.2, `${label} ${interval}ms game time advances ${JSON.stringify(loop)}`);
    assert.ok(loop.wallTimeDelta > 500, `${label} ${interval}ms wall time advances ${JSON.stringify(loop)}`);
  }
}
async function reachFinalTutorialStep(page, label){
  await page.evaluate(() => window.CircleMixTestApi.startTutorial());
  await waitFor(page, () => window.CircleMixTestApi.state().tutorialMode, `${label} tutorial restart`);
  for(let guard=0; guard<32; guard++){
    const before = await page.evaluate(() => window.CircleMixTestApi.state());
    if(before.currentTutorialKind === 'mix') break;
    assert.equal(before.tutorialMode, true, `${label} remains in tutorial before final step`);
    await page.locator('#tutorialSkipStep').click({timeout:3000});
    await waitFor(page, arg => {
      const st = window.CircleMixTestApi.state();
      return st.tutorialMode && st.tutorialStepIndex > arg.beforeIndex && st.pendingTutorialSkipCount === 0 && st.tutorialTransitionState === 'IDLE';
    }, `${label} advance toward final tutorial step`, 8000, {beforeIndex:before.tutorialStepIndex});
  }
  const finalState = await page.evaluate(() => window.CircleMixTestApi.state());
  assert.equal(finalState.currentTutorialTitle, '종합 연습');
  assert.equal(finalState.currentTutorialKind, 'mix');
  assert.equal(finalState.chartLength, 9);
  assert.deepEqual(finalState.chartNoteTypes, ['cut','cut','fx','slideCW','traceCCW','swingCW','pulse','scratchCCW','cut']);
  assert.equal(finalState.traceSwingPhase, null);
  assert.equal(finalState.tutorialSuccessCount, 0);
  assert.deepEqual(finalState.consumedNoteIds, []);
  assert.ok(finalState.chartDoneStates.every(n => !n.hold && !n.missed && !n.done && !n.completed), `${label} final notes reset ${JSON.stringify(finalState.chartDoneStates)}`);
  const loop = await measureLoop(page, 650);
  assert.ok(loop.frameDelta > 8 && loop.renderDelta > 8 && loop.timeDelta > 0.3, `${label} final loop ${JSON.stringify(loop)}`);
  return finalState;
}
async function runFinalMixMissRegression(page, label){
  const finalState = await reachFinalTutorialStep(page, `${label} miss`);
  const finalStepIndex = finalState.tutorialStepIndex;
  const beforeMiss = await page.evaluate(() => window.CircleMixTestApi.state());
  assert.equal(await page.evaluate(() => window.CircleMixTestApi.markFirstPendingTutorialNoteMissed()), true);
  await wait(1000);
  const afterOneSecond = await page.evaluate(() => window.CircleMixTestApi.state());
  assert.equal(afterOneSecond.tutorialStepIndex, finalStepIndex);
  assert.equal(afterOneSecond.currentTutorialKind, 'mix');
  assert.equal(afterOneSecond.tutorialFinalMixRetryScheduled, false, `${label} final mix must not retry immediately after first miss`);
  assert.equal(afterOneSecond.tutorialSuccessCount, beforeMiss.tutorialSuccessCount, `${label} successCount is not reset mid-chart`);
  const loop = await measureLoop(page, 500);
  assert.ok(loop.frameDelta > 5 && loop.renderDelta > 5 && loop.timeDelta > 0.2, `${label} final mix miss loop ${JSON.stringify(loop)}`);
  await page.evaluate(() => {
    const api = window.CircleMixTestApi;
    const st = api.state();
    for(let i=1;i<st.chartLength;i++) api.markFirstPendingTutorialNoteMissed();
  });
  await waitFor(page, () => window.CircleMixTestApi.state().tutorialFinalMixRetryScheduled, `${label} final mix retry scheduled after chart end`, 3000);
  const scheduled = await page.evaluate(() => window.CircleMixTestApi.state());
  assert.equal(scheduled.tutorialFinalMixRetryCount, 0);
  assert.equal(scheduled.tutorialTimerCount, 1);
  await waitFor(page, () => {
    const st = window.CircleMixTestApi.state();
    return st.tutorialMode && st.currentTutorialKind === 'mix' && st.tutorialFinalMixRetryCount === 1 && st.tutorialTimerCount === 0 && st.chartDoneStates.every(n => !n.done && !n.missed);
  }, `${label} final mix retries once`, 4000);
}
async function runFinalMixConsecutiveRetryRegression(page, label){
  const finalState = await reachFinalTutorialStep(page, `${label} consecutive retries`);
  const finalStepIndex = finalState.tutorialStepIndex;
  const attempts = [];
  for(let expectedRetry=1; expectedRetry<=5; expectedRetry++){
    const before = await page.evaluate(() => window.CircleMixTestApi.state());
    await waitFor(page, () => {
      const st = window.CircleMixTestApi.state();
      return st.tutorialFinalMixRetryScheduled && st.tutorialChartSettled;
    }, `${label} natural final mix chart settles ${expectedRetry}`, 12000);
    const settled = await page.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(settled.tutorialFinalMixRetryCount, expectedRetry - 1, `${label} retry ${expectedRetry} is scheduled once after chart end`);
    assert.ok(settled.chartDoneStates.every(note => note.done || note.missed), `${label} retry ${expectedRetry} leaves no unresolved note ${JSON.stringify(settled.chartDoneStates)}`);
    for(const type of ['fx', 'slideCW', 'traceCCW', 'scratchCCW']){
      const note = settled.chartDoneStates.find(candidate => candidate.type === type);
      assert.ok(note && (note.done || note.missed), `${label} retry ${expectedRetry} finalizes ${type} ${JSON.stringify(note)}`);
      assert.ok(!(note.completed && !note.done && !note.missed), `${label} retry ${expectedRetry} does not retain completed-only ${type} ${JSON.stringify(note)}`);
    }
    await waitFor(page, expected => {
      const st = window.CircleMixTestApi.state();
      return st.tutorialFinalMixRetryCount === expected && st.tutorialTransitionState === 'IDLE' && st.tutorialTimerCount === 0;
    }, `${label} natural final mix retry ${expectedRetry}`, 12000, expectedRetry);
    const after = await page.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(after.tutorialAttemptId, before.tutorialAttemptId + 1, `${label} retry ${expectedRetry} starts a new attempt`);
    assert.equal(after.tutorialStepIndex, finalStepIndex, `${label} retry ${expectedRetry} remains on final step`);
    assert.equal(after.tutorialChartSettled, false, `${label} retry ${expectedRetry} has a fresh chart`);
    assert.equal(after.tutorialChartFinalizationCount, 0, `${label} retry ${expectedRetry} has no carried finalization`);
    assert.deepEqual(after.consumedNoteIds, [], `${label} retry ${expectedRetry} clears consumed note ids`);
    assert.ok(after.chartDoneStates.every(note => !note.done && !note.missed && !note.completed && !note.hold), `${label} retry ${expectedRetry} resets note runtime ${JSON.stringify(after.chartDoneStates)}`);
    attempts.push({retryCount:after.tutorialFinalMixRetryCount, attemptId:after.tutorialAttemptId, frameCount:after.frameCount, renderCount:after.renderCount});
  }
  const loop = await measureLoop(page, 500);
  assert.ok(loop.frameDelta > 5 && loop.renderDelta > 5 && loop.timeDelta > .2, `${label} five retry loop remains live ${JSON.stringify(loop)}`);
  assert.equal((await page.evaluate(() => window.CircleMixTestApi.state())).tutorialTimerCount, 0, `${label} five retries leave no stale timer`);
  return attempts;
}
async function runSuccessfulFinalMixRegression(page, label){
  await reachFinalTutorialStep(page, `${label} success`);
  await page.evaluate(() => window.CircleMixTestApi.clearAndPerfectTutorialChart());
  await waitFor(page, () => {
    const st = window.CircleMixTestApi.state();
    return !st.tutorialMode && st.tutorialCompleteVisible && st.tutorialCompleteCount === 1 && st.activeScene === 'title';
  }, `${label} successful final mix completion`, 5000);
  const completeState = await page.evaluate(() => window.CircleMixTestApi.state());
  assert.equal(completeState.tutorialHudHidden, true);
  assert.equal(completeState.pendingTutorialSkipCount, 0);
  assert.equal(completeState.tutorialTimerCount, 0);
}
async function runFinalSkipCompletionRegression(page, label){
  await reachFinalTutorialStep(page, `${label} skip`);
  await page.locator('#tutorialSkipStep').click({timeout:3000});
  await waitFor(page, () => {
    const st = window.CircleMixTestApi.state();
    return !st.tutorialMode && st.tutorialCompleteVisible && st.activeScene === 'title';
  }, `${label} final skip completion`, 5000);
  const firstComplete = await page.evaluate(() => window.CircleMixTestApi.state());
  assert.equal(firstComplete.tutorialCompleteCount, 1);
  await page.evaluate(() => { window.CircleMixTestApi.skipTutorialStep(); window.CircleMixTestApi.completeTutorial(); window.CircleMixTestApi.completeTutorial(); });
  await wait(200);
  const afterDuplicate = await page.evaluate(() => window.CircleMixTestApi.state());
  assert.equal(afterDuplicate.tutorialCompleteCount, 1);
  assert.equal(afterDuplicate.tutorialCompleteVisible, true);
  assert.equal(afterDuplicate.tutorialMode, false);
  assert.equal(afterDuplicate.pendingTutorialSkipCount, 0);
  assert.equal(afterDuplicate.tutorialTimerCount, 0);
}
async function runFinalTutorialRegression(page, label){
  await runFinalMixMissRegression(page, label);
  await runFinalMixConsecutiveRetryRegression(page, label);
  await runSuccessfulFinalMixRegression(page, label);
  await runFinalSkipCompletionRegression(page, label);
}

async function runFreshDirectPlayRegression(browser, contextOptions, label, {promptAnswered=false}={}){
  const context = await registerDiagnosticContext(await browser.newContext(contextOptions));
  if(promptAnswered){
    await context.addInitScript(() => localStorage.setItem('circleMixTutorialPromptAnswered', 'true'));
  }
  const page = await context.newPage();
  const errors = await collectErrors(page);
  let completed=false;
  try{
    await page.goto('http://127.0.0.1:4173/index.html?browserTest=1', {waitUntil:'domcontentloaded'});
    await waitForStableCircleMixPage(page, `${label} direct play`);
    await runViewportResizeRegression(page, `${label} direct play`);
    await dismissStartupOverlays(page);
    if(!promptAnswered){
      await page.locator('#tutorialPromptSkip').click();
      await page.waitForFunction(() => document.getElementById('tutorialPrompt')?.hidden === true);
    }
    const tutorialStorage = await page.evaluate(() => ({
      promptAnswered: localStorage.getItem('circleMixTutorialPromptAnswered'),
      completed: localStorage.getItem('circleMixTutorialCompleted')
    }));
    assert.equal(tutorialStorage.promptAnswered, 'true', `${label} tutorial prompt is answered without starting it`);
    assert.equal(tutorialStorage.completed, null, `${label} tutorial remains incomplete`);
    const selfTestInitial = await page.evaluate(() => {
      const overlay=document.getElementById('selfTestOverlay'), button=document.getElementById('safeSelfTestBtn');
      const start=document.getElementById('safeStart').getBoundingClientRect();
      const hit=document.elementFromPoint(start.x+start.width/2,start.y+start.height/2);
      return {state:window.CircleMixTestApi.selfTestState(), ariaHidden:overlay?.getAttribute('aria-hidden'), intercepts:hit===overlay || !!hit?.closest?.('#selfTestOverlay')};
    });
    assert.deepEqual(selfTestInitial.state, {active:false, overlayHidden:true, overlayDisplay:'none', buttonHidden:true, pointerLockActive:false, actionHeld:false, scratchHeld:false}, `${label} self test is inert for regular users ${JSON.stringify(selfTestInitial)}`);
    assert.equal(selfTestInitial.ariaHidden, 'true', `${label} self test aria hidden`);
    assert.equal(selfTestInitial.intercepts, false, `${label} self test does not intercept START`);
    const startButton = page.locator('#safeStart');
    await startButton.waitFor({state:'visible'});
    assert.equal(await startButton.isEnabled(), true, `${label} START is enabled`);
    const startBox = await startButton.boundingBox();
    assert.ok(
      startBox && startBox.width > 0 && startBox.height > 0,
      `${label} START has a visible hit box ${JSON.stringify(startBox)}`
    );
    await startButton.click({force:true});
    await page.waitForFunction(() => !document.getElementById('songSelect')?.hidden);
    await page.locator('#songPlayBtn').click();
    await waitFor(page, () => {
      const st = window.CircleMixTestApi.state();
      return st.activeScene === 'game' && st.running && !st.tutorialMode && st.chartLength > 0;
    }, `${label} direct built-in game start`, 8000);
    const display = await page.evaluate(() => {
      const visible = id => {
        const element = document.getElementById(id);
        if(!element) return false;
        const style = getComputedStyle(element);
        return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;
      };
      const canvas = document.getElementById('game').getBoundingClientRect();
      const root = document.getElementById('gameRoot').getBoundingClientRect();
      return {
        classes: [...document.body.classList],
        canvas: {width:canvas.width, height:canvas.height},
        root: {width:root.width, height:root.height},
        overlays: ['startLayer', 'tutorialPrompt', 'songSelect', 'updateLogOverlay'].map(id => [id, visible(id)])
      };
    });
    assert.ok(display.classes.includes('safeGame'), `${label} has safeGame ${JSON.stringify(display)}`);
    assert.ok(!display.classes.includes('safeTitle') && !display.classes.includes('safeSongSelect'), `${label} clears title and song-select scenes ${JSON.stringify(display)}`);
    assert.ok(display.canvas.width > 0 && display.canvas.height > 0 && display.root.width > 0 && display.root.height > 0, `${label} game canvas/root are visible ${JSON.stringify(display)}`);
    assert.deepEqual(display.overlays.filter(([, visible]) => visible), [], `${label} gameplay has no covering startup overlays ${JSON.stringify(display)}`);
    const loop = await measureLoopUntil(page);
    assert.ok(Number.isFinite(loop.frameDelta), `${label} direct RAF delta is finite ${JSON.stringify(loop)}`);
    assert.ok(Number.isFinite(loop.renderDelta), `${label} direct render delta is finite ${JSON.stringify(loop)}`);
    assert.ok(loop.frameDelta > 0, `${label} direct RAF survives ${JSON.stringify(loop)}`);
    assert.ok(loop.renderDelta > 0, `${label} direct render survives ${JSON.stringify(loop)}`);
    assert.ok(loop.frameDelta >= 3, `${label} direct RAF makes sufficient progress ${JSON.stringify(loop)}`);
    assert.ok(loop.renderDelta >= 3, `${label} direct render makes sufficient progress ${JSON.stringify(loop)}`);
    assert.ok(loop.timeDelta > 0.2, `${label} direct game time advances ${JSON.stringify(loop)}`);
    assert.ok(loop.wallTimeDelta > 500, `${label} direct wall time advances ${JSON.stringify(loop)}`);
    assert.deepEqual(errors, [], `${label} direct startup errors`);
    completed=true;
    return loop;
  } finally {
    if(completed){
      unregisterDiagnosticContext(context, page);
      await context.close();
    }
  }
}

async function runPublicCmixImportRegression(browser){
  const cmixState=async page=>page.evaluate(()=>{
    const visible=id=>{const el=document.getElementById(id);if(!el||el.hidden)return false;const style=getComputedStyle(el);return style.display!=="none"&&style.visibility!=="hidden"&&style.visibility!=="collapse"&&el.getClientRects().length>0;};
    const start=document.getElementById('safeStart')?.getBoundingClientRect();
    const hit=start&&document.elementFromPoint(start.x+start.width/2,start.y+start.height/2);
    return {scene:window.CircleMixTestApi?.state?.().activeScene||null,button:{count:document.querySelectorAll('#cmixImportBtn').length,hidden:document.getElementById('cmixImportBtn')?.hidden,visible:visible('cmixImportBtn'),songSelectHidden:document.getElementById('songSelect')?.hidden},modal:{hidden:document.getElementById('cmixImportModal')?.hidden,display:getComputedStyle(document.getElementById('cmixImportModal')).display,visible:visible('cmixImportModal')},drop:{hidden:document.getElementById('cmixDropOverlay')?.hidden,display:getComputedStyle(document.getElementById('cmixDropOverlay')).display,visible:visible('cmixDropOverlay')},startIntercepted:!!hit?.closest?.('#cmixImportModal,#cmixDropOverlay')};
  });
  const assertClosed=async(page,label)=>{const state=await cmixState(page);assert.deepEqual(state.modal,{hidden:true,display:'none',visible:false},`${label} modal is fully closed ${JSON.stringify(state)}`);assert.deepEqual(state.drop,{hidden:true,display:'none',visible:false},`${label} drop overlay is fully closed ${JSON.stringify(state)}`);assert.equal(state.startIntercepted,false,`${label} import layers do not intercept START ${JSON.stringify(state)}`);};
  const openSongSelect=async(page,label)=>{await page.locator('#tutorialPromptSkip').click();await page.locator('#safeStart').click();await page.waitForFunction(()=>!document.getElementById('songSelect').hidden);await page.locator('#cmixImportBtn').waitFor({state:'visible'});assert.equal((await cmixState(page)).button.visible,true,`${label} public import is visible in song select ${JSON.stringify(await cmixState(page))}`);};
  const regular=await registerDiagnosticContext(await browser.newContext({viewport:{width:1280,height:720}})); const page=await regular.newPage(); const errors=await collectErrors(page);
  try{
    await page.goto('http://127.0.0.1:4173/index.html?browserTest=1',{waitUntil:'domcontentloaded'});await waitForStableCircleMixPage(page,'public cmix regular');await dismissStartupOverlays(page);
    await page.evaluate(()=>localStorage.removeItem('circleMixCmixImportNotice'));
    let state=await cmixState(page);assert.equal(state.button.hidden,false,`regular users enable import ${JSON.stringify(state)}`);assert.equal(state.button.songSelectHidden,true,`title keeps public import inside hidden song select ${JSON.stringify(state)}`);assert.equal(state.button.visible,false,`title does not show import over START ${JSON.stringify(state)}`);await assertClosed(page,'regular title');
    await openSongSelect(page,'regular');
    await page.locator('#cmixImportBtn').click();await page.locator('#cmixImportModal').waitFor({state:'visible'});await page.locator('#cmixImportContent').getByRole('button',{name:'CONTINUE'}).click();await page.locator('#cmixImportClose').click();await assertClosed(page,'regular close after first-use notice');
    const webView2DragOver=await page.evaluate(()=>{const event=new Event('dragover',{bubbles:true,cancelable:true}),dataTransfer={types:['Files'],items:[],files:[],dropEffect:'none'};Object.defineProperty(event,'dataTransfer',{value:dataTransfer});window.dispatchEvent(event);return {defaultPrevented:event.defaultPrevented,dropEffect:dataTransfer.dropEffect,overlayHidden:document.getElementById('cmixDropOverlay').hidden};});assert.deepEqual(webView2DragOver,{defaultPrevented:true,dropEffect:'copy',overlayHidden:false},`WebView2-style Files dragover is accepted ${JSON.stringify(webView2DragOver)}`);await page.locator('#cmixDropOverlay').waitFor({state:'visible'});
    const nonFileDrag=await page.evaluate(()=>{const event=new Event('dragover',{bubbles:true,cancelable:true}),dataTransfer={types:['text/plain'],items:[],files:[],dropEffect:'none'};Object.defineProperty(event,'dataTransfer',{value:dataTransfer});window.dispatchEvent(event);return event.defaultPrevented;});assert.equal(nonFileDrag,false,'non-file drag is not intercepted');
    await page.evaluate(()=>window.dispatchEvent(new DragEvent('dragleave',{bubbles:true,cancelable:true})));await assertClosed(page,'song-select dragleave');
    const webView2Drop=await page.evaluate(()=>{const dt=new DataTransfer();dt.items.add(new File(['not a zip'],'sample.cmix',{type:''}));const event=new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;});assert.equal(webView2Drop,true,'file drop is intercepted after WebView2-style dragover');await page.locator('#cmixImportModal').waitFor({state:'visible'});await waitFor(page,()=>document.getElementById('cmixImportStatus').textContent==='PACKAGE CHECK FAILED','public invalid cmix inspection');await page.locator('#cmixImportClose').click();await assertClosed(page,'song-select invalid package close');
    await page.evaluate(()=>{const dt=new DataTransfer();dt.items.add(new File(['one'],'one.cmix',{type:''}));dt.items.add(new File(['two'],'two.cmix',{type:''}));window.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true}));});await page.locator('#cmixImportModal').waitFor({state:'visible'});assert.equal(await page.locator('#cmixImportStatus').textContent(),'SELECT ONE .CMIX PACKAGE AT A TIME');await page.locator('#cmixImportClose').click();await assertClosed(page,'multi-file drop close');
    await page.locator('#songPlayBtn').click();await waitFor(page,()=>window.CircleMixTestApi.state().running,'public gameplay begins',8000);const before=await page.evaluate(()=>window.CircleMixTestApi.state());const dropped=await page.evaluate(()=>{const dt=new DataTransfer();dt.items.add(new File(['not a zip'],'during-game.cmix',{type:''}));const event=new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;});assert.equal(dropped,false,'gameplay drop is not intercepted');await assertClosed(page,'gameplay drop');const after=await page.evaluate(()=>window.CircleMixTestApi.state());assert.equal(after.running,true,`gameplay remains active ${JSON.stringify({before,after})}`);const loop=await measureLoop(page,700);assert.ok(loop.frameDelta>5&&loop.renderDelta>5&&loop.timeDelta>.2,`gameplay loop survives drop ${JSON.stringify(loop)}`);
    assert.deepEqual(errors,[],`public cmix errors ${JSON.stringify(errors)}`);
  } finally {unregisterDiagnosticContext(regular,page);await regular.close();}
  const dev=await registerDiagnosticContext(await browser.newContext({viewport:{width:1280,height:720}}));const devPage=await dev.newPage();const devErrors=await collectErrors(devPage);
  try{
    await devPage.goto('http://127.0.0.1:4173/index.html?browserTest=1&dev=1',{waitUntil:'domcontentloaded'});await waitForStableCircleMixPage(devPage,'public cmix developer');await dismissStartupOverlays(devPage);const state=await cmixState(devPage);assert.equal(state.button.count,1,`developer mode creates one public import button ${JSON.stringify(state)}`);assert.equal(state.button.hidden,false,`developer button remains enabled ${JSON.stringify(state)}`);assert.equal(state.button.songSelectHidden,true,`developer title keeps import in song select ${JSON.stringify(state)}`);await assertClosed(devPage,'developer title');await openSongSelect(devPage,'developer');assert.equal((await cmixState(devPage)).button.count,1,'developer song select still has one import button');assert.deepEqual(devErrors,[],`developer public cmix errors ${JSON.stringify(devErrors)}`);
  } finally {unregisterDiagnosticContext(dev,devPage);await dev.close();}
}

async function runDeveloperSelfTestOverlayRegression(browser){
  const context=await registerDiagnosticContext(await browser.newContext({viewport:{width:1280,height:720},hasTouch:false,isMobile:false}));
  const page=await context.newPage(); const errors=await collectErrors(page);
  try{
    await page.goto('http://127.0.0.1:4173/index.html?browserTest=1&dev=1',{waitUntil:'domcontentloaded'});
    await waitForStableCircleMixPage(page,'developer self test'); await dismissStartupOverlays(page);
    await page.locator('#tutorialPromptSkip').click();
    await page.waitForFunction(()=>document.getElementById('tutorialPrompt')?.hidden===true);
    assert.deepEqual(await page.evaluate(()=>window.CircleMixTestApi.selfTestState()), {active:false,overlayHidden:true,overlayDisplay:'none',buttonHidden:false,pointerLockActive:false,actionHeld:false,scratchHeld:false}, 'developer mode exposes only the entry button');
    await page.keyboard.press('KeyH'); await page.locator('#safeSelfTestBtn').waitFor({state:'visible'});
    await page.locator('#safeSelfTestBtn').click();
    await waitFor(page,()=>window.CircleMixTestApi.selfTestState().active,'self test opens');
    assert.equal(await page.locator('#selfTestOverlay').getAttribute('aria-hidden'),'false');
    assert.equal(await page.evaluate(()=>{document.getElementById('cmixImportBtn').click();return document.getElementById('cmixImportModal').hidden;}),true,'SELF TEST blocks the public import transaction');
    await page.locator('#selfTestExit').click();
    await waitFor(page,()=>!window.CircleMixTestApi.selfTestState().active && window.CircleMixTestApi.selfTestState().overlayHidden,'self test exits');
    const after=await page.evaluate(()=>window.CircleMixTestApi.selfTestState());
    assert.equal(after.overlayDisplay,'none'); assert.equal(after.actionHeld,false); assert.equal(after.scratchHeld,false); assert.equal(after.pointerLockActive,false);
    await page.locator('#safeStart').click(); await page.waitForFunction(()=>!document.getElementById('songSelect')?.hidden);
    assert.deepEqual(errors,[]);
  } finally { await context.close(); }
}

async function collectErrors(page){
  registerDiagnosticPage(page);
  const errors = [];
  diagnosticLogs.set(page, errors);
  page.on('pageerror', error => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on('console', msg => { if(msg.type() === 'error') errors.push(`console.error: ${msg.text()}`); });
  return errors;
}
function contentTypeFor(filePath){
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.mp3': 'audio/mpeg'
  }[ext] || 'application/octet-stream';
}
function startStaticServer(rootDir, port=4173){
  const root = path.resolve(rootDir);
  const sendText = (res, statusCode, text) => {
    res.writeHead(statusCode, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Length': Buffer.byteLength(text)
    });
    res.end(text);
  };
  const server = http.createServer((req, res) => {
    try{
      if(req.method !== 'GET' && req.method !== 'HEAD'){
        res.writeHead(405, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Length': 18,
          'Allow': 'GET, HEAD'
        });
        res.end(req.method === 'HEAD' ? undefined : 'method not allowed');
        return;
      }
      const url = new URL(req.url, 'http://127.0.0.1');
      const pathname = decodeURIComponent(url.pathname);
      const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const filePath = path.resolve(root, relativePath);
      if(filePath !== root && !filePath.startsWith(root + path.sep)){
        sendText(res, 403, 'forbidden');
        return;
      }
      fs.readFile(filePath, (error, data) => {
        if(error){
          sendText(res, 404, 'not found');
          return;
        }
        const headers = {
          'Accept-Ranges': 'bytes',
          'Content-Type': contentTypeFor(filePath)
        };
        const range = req.headers.range;
        if(range){
          const match = /^bytes=(\d*)-(\d*)$/.exec(range);
          const size = data.byteLength;
          if(match && size > 0){
            let start = match[1] ? Number(match[1]) : 0;
            let end = match[2] ? Number(match[2]) : size - 1;
            if(!match[1] && match[2]){
              const suffix = Number(match[2]);
              start = Math.max(0, size - suffix);
              end = size - 1;
            }
            if(Number.isInteger(start) && Number.isInteger(end) && start <= end && start < size){
              end = Math.min(end, size - 1);
              const body = data.subarray(start, end + 1);
              res.writeHead(206, {
                ...headers,
                'Content-Range': `bytes ${start}-${end}/${size}`,
                'Content-Length': body.byteLength
              });
              res.end(req.method === 'HEAD' ? undefined : body);
              return;
            }
          }
          res.writeHead(416, {
            ...headers,
            'Content-Range': `bytes */${data.byteLength}`,
            'Content-Length': 0
          });
          res.end();
          return;
        }
        res.writeHead(200, {...headers, 'Content-Length': data.byteLength});
        res.end(req.method === 'HEAD' ? undefined : data);
      });
    }catch(error){
      sendText(res, 400, 'bad request');
    }
  });
  server.listen(port, '127.0.0.1');
  return server;
}

async function dismissStartupOverlays(page){
  const updateLog = page.locator('#updateLogOverlay');
  if(await updateLog.isVisible().catch(() => false)){
    await page.locator('#updateLogClose').click();
    await page.waitForFunction(() => {
      const overlay = document.getElementById('updateLogOverlay');
      return !overlay || overlay.hidden || !overlay.classList.contains('show');
    });
  }
  assert.equal(await page.evaluate(() => {
    const overlay = document.getElementById('updateLogOverlay');
    return !!overlay && !overlay.hidden && overlay.classList.contains('show');
  }), false, 'startup update log overlay is dismissed');
}

function shortestAngleDifference(a, b){ return Math.atan2(Math.sin(a-b), Math.cos(a-b)); }
async function runDeterministicAimAndCutRegression(browser){
  const context = await registerDiagnosticContext(await browser.newContext({viewport:{width:1280,height:720}, hasTouch:false, isMobile:false}));
  const page = await context.newPage();
  const errors = await collectErrors(page);
  try {
    await page.goto('http://127.0.0.1:4173/index.html?browserTest=1', {waitUntil:'domcontentloaded'});
    await waitForStableCircleMixPage(page, 'deterministic gameplay');
    await dismissStartupOverlays(page);
    const initial = await page.evaluate(() => window.CircleMixTestApi.startDeterministicChart());
    assert.equal(initial.chartLength, 9, 'test-only deterministic chart has every supported gesture family');
    assert.deepEqual(initial.chartDoneStates.map(note => note.id), ['test-cut-0','test-fx-0','test-swing-cw-0','test-swing-ccw-0','test-slide-cw-0','test-slide-ccw-0','test-trace-0','test-scratch-cw-0','test-scratch-ccw-0']);
    const pcAimModes = await page.evaluate(() => {
      const api=window.CircleMixTestApi;
      api.setPcAimMode('AUTO'); const auto=api.pcAimModeState();
      api.setPcAimMode('ABSOLUTE'); const absolute=api.pcAimModeState();
      api.setPcAimMode('LOCKED'); const locked=api.pcAimModeState();
      return {auto,absolute,locked};
    });
    assert.deepEqual(pcAimModes.auto, {selected:'AUTO',effective:'ABSOLUTE',wantsLockedMouse:false,pointerLockRequested:false,pointerLockActive:false}, `AUTO keeps desktop mouse absolute ${JSON.stringify(pcAimModes)}`);
    assert.deepEqual(pcAimModes.absolute, {selected:'ABSOLUTE',effective:'ABSOLUTE',wantsLockedMouse:false,pointerLockRequested:false,pointerLockActive:false}, `ABSOLUTE does not request pointer lock ${JSON.stringify(pcAimModes)}`);
    assert.equal(pcAimModes.locked.selected, 'LOCKED');
    assert.equal(pcAimModes.locked.effective, 'LOCKED');
    assert.equal(pcAimModes.locked.wantsLockedMouse, true, `only explicit LOCKED enables pointer lock ${JSON.stringify(pcAimModes)}`);
    for(const degrees of [0,45,90,135,180,225,270,315]){
      const sample = await page.evaluate(deg => {
        const st=window.CircleMixTestApi.state(), a=deg*Math.PI/180;
        window.CircleMixTestApi.testInput.aim(st.cx+Math.cos(a)*st.hitR, st.cy+Math.sin(a)*st.hitR, performance.now(), 'mouse');
        window.CircleMixTestApi.advanceTestClock(.02);
        return window.CircleMixTestApi.state();
      }, degrees);
      assert.ok(Number.isFinite(sample.rawInputAngle) && Number.isFinite(sample.judgementAimAngle) && Number.isFinite(sample.visualArmAngle), `absolute ${degrees}° reports finite aim angles`);
      assert.ok(Math.abs(shortestAngleDifference(sample.rawInputAngle, degrees*Math.PI/180)) < .02, `absolute ${degrees}° reaches raw input angle`);
      assert.ok(Math.abs(shortestAngleDifference(sample.judgementAimAngle, degrees*Math.PI/180)) < .02, `absolute ${degrees}° reaches judgement angle`);
    }
    const aimVisual = await page.evaluate(() => {
      const api=window.CircleMixTestApi, st=api.state(), point=(a)=>[st.cx+Math.cos(a)*st.hitR,st.cy+Math.sin(a)*st.hitR];
      api.setPcAimMode('ABSOLUTE'); api.setAimStabilizer('OFF'); api.setAimVisual('SMOOTH');
      api.setVisualResponse('FAST');
      api.testInput.aim(...point(0),performance.now(),'mouse'); api.advanceTestClock(.02);
      api.testInput.aim(...point(.12),performance.now()+200,'mouse'); api.advanceTestClock(.005); const fine=api.state();
      const slow=[]; for(let i=1;i<=4;i++){ api.testInput.aim(...point(.12+i*.03),performance.now()+220+i*80,'mouse'); api.advanceTestClock(.016); slow.push(api.state().visualArmAngle); }
      const threshold=[]; for(let i=0;i<6;i++){ api.testInput.aim(...point(.30+(i%2?.082:.078)),performance.now()+600+i*20,'mouse'); api.advanceTestClock(.016); threshold.push(api.state()); }
      const responses={}; for(const response of ['FAST','NORMAL','SOFT']){ api.setVisualResponse(response); api.testInput.aim(...point(.4),performance.now()+800,'mouse'); api.testInput.aim(...point(.8),performance.now()+820,'mouse'); api.advanceTestClock(.016); responses[response]=api.state(); }
      api.setVisualResponse('FAST'); api.testInput.aim(...point(Math.PI/2),performance.now()+900,'mouse'); api.advanceTestClock(.02); const quarterTurn=api.state();
      api.testInput.aim(...point(-Math.PI/2),performance.now()+1000,'mouse'); const halfTurn=api.state();
      api.setAimVisual('DIRECT'); api.testInput.aim(...point(-Math.PI/2),performance.now()+600,'mouse'); const direct=api.state();
      return {fine,slow,threshold,responses,quarterTurn,halfTurn,direct};
    });
    assert.ok(Math.abs(shortestAngleDifference(aimVisual.fine.rawInputAngle,.12))<.02 && Math.abs(shortestAngleDifference(aimVisual.fine.judgementAimAngle,.12))<.02, `SMOOTH does not delay raw or judgement ${JSON.stringify(aimVisual.fine)}`);
    assert.ok(Math.abs(shortestAngleDifference(aimVisual.fine.visualArmAngle,.12))>.001, `SMOOTH only interpolates visual arm ${JSON.stringify(aimVisual.fine)}`);
    assert.ok(aimVisual.slow.every((angle,index)=>index===0 || shortestAngleDifference(angle,aimVisual.slow[index-1])>0), `slow constant movement remains frame-continuous ${JSON.stringify(aimVisual.slow)}`);
    assert.ok(aimVisual.threshold.every(sample=>Math.abs(shortestAngleDifference(sample.visualArmAngle,sample.judgementAimAngle))>.0001), `near-threshold movement never alternates into velocity snaps ${JSON.stringify(aimVisual.threshold)}`);
    for(const [response,sample] of Object.entries(aimVisual.responses)) assert.ok(Math.abs(shortestAngleDifference(sample.rawInputAngle,.8))<.02 && Math.abs(shortestAngleDifference(sample.judgementAimAngle,.8))<.02, `${response} response leaves judgement immediate ${JSON.stringify(sample)}`);
    assert.ok(Math.abs(shortestAngleDifference(aimVisual.quarterTurn.visualArmAngle,Math.PI/2))<.08, `FAST response avoids excessive 90° trail ${JSON.stringify(aimVisual.quarterTurn)}`);
    assert.ok(Math.abs(shortestAngleDifference(aimVisual.halfTurn.visualArmAngle,-Math.PI/2))<.02 && Math.abs(shortestAngleDifference(aimVisual.halfTurn.judgementAimAngle,-Math.PI/2))<.02, `SMOOTH catches up on half turn ${JSON.stringify(aimVisual.halfTurn)}`);
    assert.ok(Math.abs(shortestAngleDifference(aimVisual.direct.visualArmAngle,-Math.PI/2))<.02 && Math.abs(shortestAngleDifference(aimVisual.direct.judgementAimAngle,-Math.PI/2))<.02, `DIRECT visual remains immediate ${JSON.stringify(aimVisual.direct)}`);
    const aimEventPipeline = await page.evaluate(() => {
      const api=window.CircleMixTestApi, st=api.state();
      api.startDeterministicChart();
      api.setPcAimMode('ABSOLUTE'); api.setAimVisual('SMOOTH'); api.setVisualResponse('FAST'); api.setAimStabilizer('LOW');
      const baseline=api.injectImmediateAimSample(0,st.hitR,1000);
      const slow=api.injectImmediateAimSample(.08,st.hitR,1100);
      const large=api.injectImmediateAimSample(Math.PI*.75,st.hitR,1110);
      const backwards=api.injectImmediateAimSample(Math.PI*.78,st.hitR,1000);
      const lowProfile=api.aimInputState();
      const fastCW=api.magnetProbe('LOW',5.1), fastCCW=api.magnetProbe('LOW',-5.1);
      api.setAimStabilizer('MEDIUM'); const mediumProfile=api.aimInputState();
      api.setAimStabilizer('OFF'); api.setAimVisual('SMOOTH'); api.setVisualResponse('FAST');
      api.injectImmediateAimSample(0,st.hitR,2000);
      const visualJump=api.injectImmediateAimSample(Math.PI*.72,st.hitR,2010);
      return {hitR:st.hitR,baseline,slow,large,backwards,lowProfile,mediumProfile,fastCW,fastCCW,visualJump};
    });
    assert.ok(Math.abs(shortestAngleDifference(aimEventPipeline.slow.rawInputAngle,.08))<.01, `LOW keeps raw target exact ${JSON.stringify(aimEventPipeline)}`);
    assert.ok(Math.abs(shortestAngleDifference(aimEventPipeline.slow.judgementAimAngle,aimEventPipeline.baseline.judgementAimAngle))>.001, `LOW updates judgement inside the pointer event ${JSON.stringify(aimEventPipeline)}`);
    assert.ok(Math.abs(shortestAngleDifference(aimEventPipeline.large.judgementAimAngle,Math.PI*.75))<.02, `LOW bypasses smoothing for a large jump ${JSON.stringify(aimEventPipeline.large)}`);
    assert.ok(Number.isFinite(aimEventPipeline.backwards.sampleAngularVelocity) && aimEventPipeline.backwards.sampleInterval>=.0005 && aimEventPipeline.backwards.sampleInterval<=.05, `non-monotonic timestamps stay finite and bounded ${JSON.stringify(aimEventPipeline.backwards)}`);
    assert.ok(aimEventPipeline.lowProfile.centerDeadzone.enter<aimEventPipeline.hitR*.08 && aimEventPipeline.mediumProfile.centerDeadzone.enter<aimEventPipeline.hitR*.09, `stabilizer center guard stays small ${JSON.stringify(aimEventPipeline)}`);
    assert.equal(aimEventPipeline.fastCW.disengaged,true,`LOW fast CW releases magnet ${JSON.stringify(aimEventPipeline.fastCW)}`);
    assert.equal(aimEventPipeline.fastCCW.disengaged,true,`LOW fast CCW releases magnet ${JSON.stringify(aimEventPipeline.fastCCW)}`);
    assert.ok(Math.abs(shortestAngleDifference(aimEventPipeline.visualJump.visualArmAngle,Math.PI*.72))<.02 && Math.abs(shortestAngleDifference(aimEventPipeline.visualJump.judgementAimAngle,Math.PI*.72))<.02, `SMOOTH visual catches up immediately on large jumps ${JSON.stringify(aimEventPipeline.visualJump)}`);
    const locked = await page.evaluate(() => {
      const setup=()=>{
        const api=window.CircleMixTestApi; api.startDeterministicChart(); api.setPcAimMode('LOCKED');
        // Complete the production relative-input rebase before measuring.
        api.testInput.locked(0, 0, performance.now()); api.advanceTestClock(.02);
        return api;
      };
      const api=setup(); let timestamp=performance.now();
      // At every virtual-ring angle, only the tangent component rotates aim:
      // tangent = (-sin(theta), cos(theta)).  A vertical delta at 12 o'clock
      // is radial and must therefore remain harmless.
      const radialBefore=api.state(), radialTheta=radialBefore.lockedVirtualAngle; api.testInput.locked(Math.cos(radialTheta)*40, Math.sin(radialTheta)*40, timestamp+=20); api.advanceTestClock(.02);
      const radialAfter=api.state();
      const tangent=(sign, repeats=1)=>{ const input=setup(); let stamp=performance.now(), baseline=input.state(), after=baseline; for(let i=0;i<repeats;i++){ const theta=input.state().lockedVirtualAngle, magnitude=40*sign; input.testInput.locked(-Math.sin(theta)*magnitude, Math.cos(theta)*magnitude, stamp+=20); input.advanceTestClock(.02); after=input.state(); } return {baseline,after}; };
      return {radialBefore, radialAfter, cw:tangent(1), ccw:tangent(-1), continued:tangent(1,2)};
    });
    const lockedDelta=(after,before)=>shortestAngleDifference(after.judgementAimAngle,before.judgementAimAngle);
    const radialDelta=lockedDelta(locked.radialAfter,locked.radialBefore), radialVirtualDelta=shortestAngleDifference(locked.radialAfter.lockedVirtualAngle,locked.radialBefore.lockedVirtualAngle), cwDelta=lockedDelta(locked.cw.after,locked.cw.baseline), ccwDelta=lockedDelta(locked.ccw.after,locked.ccw.baseline), continuedDelta=lockedDelta(locked.continued.after,locked.continued.baseline);
    for(const state of [locked.radialBefore,locked.radialAfter,locked.cw.baseline,locked.cw.after,locked.ccw.baseline,locked.ccw.after,locked.continued.after]) for(const key of ['rawInputAngle','judgementAimAngle','visualArmAngle','lockedVirtualAngle','sampleAngularVelocity']) assert.ok(Number.isFinite(state[key]), `locked ${key} is finite ${JSON.stringify(state)}`);
    for(const state of [locked.radialBefore,locked.cw.baseline,locked.ccw.baseline]) assert.ok(Math.abs(shortestAngleDifference(state.rawInputAngle,state.lockedVirtualAngle))<.001 && Math.abs(shortestAngleDifference(state.judgementAimAngle,state.lockedVirtualAngle))<.001 && Math.abs(shortestAngleDifference(state.visualArmAngle,state.lockedVirtualAngle))<.001, `locked rebase aligns aim state ${JSON.stringify(state)}`);
    assert.ok(Math.abs(radialDelta)<.02, `locked radial-only movement does not rotate aim ${JSON.stringify(locked)}`);
    assert.ok(Math.abs(radialVirtualDelta)<.02, `locked radial-only movement does not rotate virtual angle ${JSON.stringify(locked)}`);
    assert.ok(Math.abs(cwDelta)>.01 && Math.abs(cwDelta)<1, `locked tangent movement rotates aim by a bounded amount ${JSON.stringify(locked)}`);
    assert.ok(Math.sign(cwDelta)===-Math.sign(ccwDelta), `locked tangent directions are opposite ${JSON.stringify(locked)}`);
    assert.ok(Math.abs(continuedDelta)>Math.abs(cwDelta), `locked repeated tangent samples continue rotation ${JSON.stringify(locked)}`);
    const cut = await page.evaluate(() => {
      const api=window.CircleMixTestApi; api.startDeterministicChart(); api.setPcAimMode('ABSOLUTE'); api.advanceTestClock(.8);
      const st=api.state(), note=st.chartDoneStates.find(n=>n.id==='test-cut-0');
      api.testInput.aim(st.cx+Math.cos(-Math.PI/2)*st.hitR, st.cy+Math.sin(-Math.PI/2)*st.hitR, performance.now(), 'mouse');
      api.testInput.action(); return api.state();
    });
    assert.equal(cut.judgedCount, 1, `ACTION uses onCut production path ${JSON.stringify(cut)}`);
    assert.equal(cut.combo, 1, 'successful CUT increments combo');
    assert.equal(cut.chartDoneStates.find(n=>n.id==='test-cut-0').done, true, 'successful CUT completes its chart note');
    const pulse = await page.evaluate(() => {
      const api=window.CircleMixTestApi; api.startPulseTestChart(); api.advanceTestClock(.8);
      const first=api.testInput.pulseKeyDown('ShiftLeft',false);
      const heldOther=api.testInput.pulseKeyDown('ShiftRight',false);
      const afterFirst=api.state();
      const releaseLeft=api.testInput.pulseKeyUp('ShiftLeft');
      const releaseRight=api.testInput.pulseKeyUp('ShiftRight');
      api.startPulseTestChart(); api.advanceTestClock(.8); api.testInput.pulseKeyDown('ShiftLeft',false);
      window.dispatchEvent(new Event('blur'));
      const afterBlur=api.testInput.pulseKeyDown('ShiftRight',false); api.testInput.pulseKeyUp('ShiftRight');
      api.startPulseTestChart(); api.setAuto(true); api.advanceTestClock(.2);
      const autoLead=api.state(); autoLead.autoTargetAngle=api.autoTargetAngle(); api.advanceTestClock(.62);
      const auto=api.state(); api.setAuto(false);
      return {first,heldOther,afterFirst,releaseLeft,releaseRight,afterBlur,autoLead,auto};
    });
    assert.equal(pulse.first.accepted,true,`first Shift accepts PULSE ${JSON.stringify(pulse)}`);
    assert.equal(pulse.heldOther.reason,'RELEASE_REQUIRED',`other Shift cannot bypass shared release gate ${JSON.stringify(pulse)}`);
    assert.equal(pulse.afterFirst.judgedCount,1,`PULSE uses normal judgement path ${JSON.stringify(pulse.afterFirst)}`);
    assert.equal(pulse.afterFirst.chartDoneStates.find(n=>n.id==='test-pulse-0').done,true,'manual PULSE completes the global note');
    assert.equal(pulse.afterFirst.scratchHeld,false,'Shift PULSE does not activate legacy SCRATCH');
    assert.equal(pulse.releaseLeft.released,false,'one held Shift keeps the gate latched');
    assert.equal(pulse.releaseRight.released,true,'all Shift keys released rearms PULSE');
    assert.equal(pulse.afterBlur.accepted,true,'window blur resets the shared PULSE gate');
    const autoAimNote=pulse.autoLead.chartDoneStates.find(n=>n.id==='test-cut-after-pulse');
    const autoAimError=Math.abs(Math.atan2(Math.sin(pulse.autoLead.autoTargetAngle-autoAimNote.angle),Math.cos(pulse.autoLead.autoTargetAngle-autoAimNote.angle)));
    assert.ok(autoAimError<1e-6,`pending PULSE must not block AUTO aim targeting ${JSON.stringify(pulse.autoLead)}`);
    assert.equal(pulse.auto.chartDoneStates.find(n=>n.id==='test-pulse-0').done,true,'AUTO completes PULSE at hit time');
    assert.equal(pulse.auto.perfectCount,1,'AUTO PULSE is PERFECT');
    assert.deepEqual(errors, [], `deterministic gameplay errors ${JSON.stringify(errors)}`);
  } finally { unregisterDiagnosticContext(context, page); await context.close(); }
}

(async()=>{
  const server = startStaticServer(process.cwd());
  try{
    await waitForServer('http://127.0.0.1:4173/index.html');
    const browser = await chromium.launch({headless:true});
    activeBrowser = browser;
    await runDeterministicAimAndCutRegression(browser);
    const freshDesktopLoop = await runFreshDirectPlayRegression(
      browser,
      {viewport:{width:1280,height:720}, hasTouch:false, isMobile:false},
      'fresh desktop'
    );
    await runPublicCmixImportRegression(browser);
    await runDeveloperSelfTestOverlayRegression(browser);
    const answeredDesktopLoop = await runFreshDirectPlayRegression(
      browser,
      {viewport:{width:1280,height:720}, hasTouch:false, isMobile:false},
      'prompt-answered desktop',
      {promptAnswered:true}
    );
    const freshMobileLoop = await runFreshDirectPlayRegression(
      browser,
      {...devices['iPhone 12'], viewport:{width:844,height:390}, screen:{width:844,height:390}},
      'fresh mobile'
    );
    const desktop = await registerDiagnosticContext(await browser.newContext({viewport:{width:1280,height:720}, hasTouch:false, isMobile:false}));
    const page = await desktop.newPage();
    const errors = await collectErrors(page);
    await page.goto('http://127.0.0.1:4173/index.html?browserTest=1', {waitUntil:'domcontentloaded'});
    await waitForStableCircleMixPage(page, 'desktop');
    const releaseMetadata = await page.evaluate(async () => ({
      version: window.CircleMixVersion?.version,
      changelogVersion: window.CircleMixChangelog?.[0]?.version,
      updateLogVisible: (() => { const overlay=document.getElementById('updateLogOverlay'); return !!overlay && !overlay.hidden && overlay.classList.contains('show'); })(),
      cacheNames: await caches.keys()
    }));
    assert.match(releaseMetadata.version || '', /^\d+\.\d+\.\d+$/, `CircleMixVersion ${JSON.stringify(releaseMetadata)}`);
    assert.equal(releaseMetadata.changelogVersion, releaseMetadata.version, `latest changelog ${JSON.stringify(releaseMetadata)}`);
    assert.equal(releaseMetadata.updateLogVisible, true, `new release auto-opens UPDATE LOG ${JSON.stringify(releaseMetadata)}`);
    assert.ok(releaseMetadata.cacheNames.includes(`circle-mix-v${releaseMetadata.version}-app`), `PWA app cache version ${JSON.stringify(releaseMetadata)}`);
    await dismissStartupOverlays(page);

    await page.evaluate(() => {
      const api = window.CircleMixTestApi;
      if(!api || typeof api.startTutorial !== 'function') throw new Error('CircleMixTestApi.startTutorial is not ready');
      api.startTutorial();
    });
    await waitFor(page, () => window.CircleMixTestApi.state().tutorialMode, 'tutorial mode');
    assert.equal(await page.evaluate(() => window.CircleMixTestApi.state().chartLength), 0, 'first AIM tutorial step has no chart notes');
    const stillMouseLoop = await measureLoop(page, 800);
    const stillMouseState = await page.evaluate(() => window.CircleMixTestApi.state());
    const stillMouseDiagnostics = {stillMouseLoop, errors, state: stillMouseState};
    if(stillMouseLoop.frameDelta <= 10 || stillMouseLoop.renderDelta <= 10 || stillMouseLoop.wallTimeDelta <= 500){
      console.error('STILL_MOUSE_DIAGNOSTICS', JSON.stringify(stillMouseDiagnostics));
    }
    assert.ok(stillMouseLoop.frameDelta > 10, `still mouse RAF ${stillMouseLoop.frameDelta}; diagnostics=${JSON.stringify(stillMouseDiagnostics)}`);
    assert.ok(stillMouseLoop.renderDelta > 10, `still mouse render ${stillMouseLoop.renderDelta}; diagnostics=${JSON.stringify(stillMouseDiagnostics)}`);
    assert.ok(stillMouseLoop.wallTimeDelta > 500, `still mouse wall time ${stillMouseLoop.wallTimeDelta}; diagnostics=${JSON.stringify(stillMouseDiagnostics)}`);

    await page.hover('#tutorialSkipStep');
    const hudHoverLoop = await measureLoop(page, 600);
    assert.ok(hudHoverLoop.frameDelta > 8, `HUD hover RAF ${hudHoverLoop.frameDelta}`);
    assert.ok(hudHoverLoop.renderDelta > 8, `HUD hover render ${hudHoverLoop.renderDelta}`);
    assert.ok(hudHoverLoop.wallTimeDelta > 350, `HUD hover wall time ${hudHoverLoop.wallTimeDelta}`);

    await waitFor(page, () => window.CircleMixTestApi.state().inputEnabled, 'AIM input enabled');
    await moveToLane(page, 7);
    await wait(100);
    for (const [index, lane] of [0, 2, 5].entries()) {
      await moveToLane(page, lane);
      await wait(320);
      await waitFor(page, expected => {
        const st = window.CircleMixTestApi.state();
        return st.tutorialStepIndex >= 1 || st.tutorialTargetProgress >= expected;
      }, `AIM target progress ${index+1}`, 2000, index+1);
      if(index === 0){
        const st = await page.evaluate(() => window.CircleMixTestApi.state());
        assert.equal(st.inputEnabled, true);
        assert.equal(st.tutorialPointerMoved, true);
        assert.ok(Math.abs(Math.atan2(Math.sin(st.armAngle - (-Math.PI/2)), Math.cos(st.armAngle - (-Math.PI/2)))) < 0.08, `lane 0 aligned ${JSON.stringify(st)}`);
      }
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
    const skipBox = await page.locator('#tutorialSkipStep').boundingBox();
    assert.ok(skipBox, 'SKIP button has a bounding box');
    const expectedSkipX = skipBox.x + skipBox.width / 2;
    const expectedSkipY = skipBox.y + skipBox.height / 2;
    await page.mouse.move(expectedSkipX, expectedSkipY);
    const uiPointer = await page.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(uiPointer.pointerActive, true, 'UI hover keeps pointer tracking active');
    assert.equal(uiPointer.lastPointerSource, 'pointer');
    assert.ok(
      Math.abs(uiPointer.mouseX - expectedSkipX) < 3,
      `UI hover mouseX ${uiPointer.mouseX}, expected ${expectedSkipX}; before=${JSON.stringify({x: beforeUiHover.mouseX, y: beforeUiHover.mouseY})}`
    );
    assert.ok(
      Math.abs(uiPointer.mouseY - expectedSkipY) < 3,
      `UI hover mouseY ${uiPointer.mouseY}, expected ${expectedSkipY}; before=${JSON.stringify({x: beforeUiHover.mouseX, y: beforeUiHover.mouseY})}`
    );
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

    await runRapidSkipRegression(page, 'desktop');
    await runFinalTutorialRegression(page, 'desktop');

    await page.evaluate(() => window.CircleMixTestApi.openSongSelect());
    await waitFor(page, () => !document.getElementById('songSelect')?.hidden, 'Routing song select');
    await page.click('.songCardPick[data-song-id="routing"]');
    const routingSelect = await page.evaluate(() => ({
      difficulties:[...document.querySelectorAll('#songDifficulty .songDiffBtn[data-difficulty]')].map(button=>button.dataset.difficulty),
      audioLink:document.querySelector('.songManage button[data-song-id="routing"]')?.textContent || ''
    }));
    assert.deepEqual(routingSelect.difficulties,['beginner','normal','advanced','hyper','another','lasses-extra','reverb']);
    assert.match(routingSelect.audioLink,/LINK LOCAL AUDIO|UNLINK LOCAL AUDIO/);

    const routingExpected={beginner:119,normal:195,advanced:241,hyper:334,another:520,'lasses-extra':518,reverb:553};
    const routingAutoResults={};
    for(const [difficulty,expectedCount] of Object.entries(routingExpected)){
      const initial=await page.evaluate(diff=>window.CircleMixTestApi.startBuiltInChartTest('routing',diff),difficulty);
      assert.equal(initial.chartLength,expectedCount,`${difficulty} runtime chart count`);
      assert.equal(initial.selectedDifficultyId,difficulty,`${difficulty} selected`);
      assert.ok(initial.chartDoneStates.every(note=>String(note.id).startsWith(`routing-${difficulty}-`)),`${difficulty} has no prior chart notes`);
      const finished=await page.evaluate(end=>window.CircleMixTestApi.advanceTestClock(end+1,.04),initial.chartEndTime);
      assert.equal(finished.judgedCount,expectedCount,`${difficulty} AUTO judged every note`);
      assert.equal(finished.missCount,0,`${difficulty} AUTO has no misses`);
      assert.equal(finished.resultVisible,true,`${difficulty} AUTO reaches results`);
      routingAutoResults[difficulty]={chartLength:finished.chartLength,perfectCount:finished.perfectCount,missCount:finished.missCount};
    }

    const playerInitial=await page.evaluate(()=>window.CircleMixTestApi.startBuiltInChartTest('routing','beginner'));
    const playerFinished=await page.evaluate(()=>window.CircleMixTestApi.completeChartTestAsPlayer());
    assert.equal(playerFinished.judgedCount,playerInitial.chartLength,'normal-play result judges the full chart');
    assert.equal(playerFinished.missCount,0,'normal-play result has no forced misses');
    assert.equal(playerFinished.resultVisible,true,'normal-play completion shows results');
    assert.equal(await page.locator('#resultAuto').textContent(),'PLAYER RESULT');

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

    const readability = await page.evaluate(() => ({
      arm: window.CircleMixTestApi.visualArmProfile(),
      trace: window.CircleMixTestApi.traceVisualProfile(),
      markerAtMatch: window.CircleMixTestApi.judgementMarkerVisible()
    }));
    assert.ok(readability.trace.activeOuterWidth <= 24, `TRACE visual outer width ${JSON.stringify(readability)}`);
    assert.equal(readability.markerAtMatch, false, `OFF matching arm has no duplicate marker ${JSON.stringify(readability)}`);
    const separatedMarker = await page.evaluate(() => window.CircleMixTestApi.judgementMarkerVisibleFor(0, Math.PI/18));
    assert.equal(separatedMarker, true, 'separated visual and judgement angles show the outline marker');

    const mobile = await registerDiagnosticContext(await browser.newContext({...devices['iPhone 12'], viewport:{width:844,height:390}, screen:{width:844,height:390}}));
    const mobilePage = await mobile.newPage();
    const mobileErrors = await collectErrors(mobilePage);
    await mobilePage.goto('http://127.0.0.1:4173/index.html?browserTest=1', {waitUntil:'domcontentloaded'});
    await waitForStableCircleMixPage(mobilePage, 'mobile');
    await dismissStartupOverlays(mobilePage);
    await mobilePage.evaluate(() => {
      const api = window.CircleMixTestApi;
      if(!api || typeof api.startTutorial !== 'function') throw new Error('CircleMixTestApi.startTutorial is not ready');
      api.startTutorial();
    });
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
    const controlBoxes = await Promise.all(['#mobilePulseBtn','#mobileActionBtn','#mobileScratchBtn'].map(selector=>mobilePage.locator(selector).boundingBox()));
    assert.ok(controlBoxes.every(Boolean),`all mobile controls are reachable ${JSON.stringify(controlBoxes)}`);
    const overlaps=(a,b)=>a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;
    assert.equal(overlaps(controlBoxes[0],controlBoxes[1]),false,`PULSE does not overlap ACTION ${JSON.stringify(controlBoxes)}`);
    assert.equal(overlaps(controlBoxes[0],controlBoxes[2]),false,`PULSE does not overlap SCRATCH ${JSON.stringify(controlBoxes)}`);
    await mobilePage.locator('#mobilePulseBtn').dispatchEvent('pointerdown', {pointerId:40, pointerType:'touch', isPrimary:true, bubbles:true});
    await mobilePage.locator('#mobilePulseBtn').dispatchEvent('pointerdown', {pointerId:43, pointerType:'touch', isPrimary:false, bubbles:true});
    const pulseDown = await mobilePage.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(pulseDown.mobilePulsePointerId,40,'holding mobile PULSE does not accept another pointer');
    assert.equal(pulseDown.scratchHeld,false,'mobile PULSE does not hold legacy SCRATCH');
    await mobilePage.locator('#mobilePulseBtn').dispatchEvent('pointerup', {pointerId:40, pointerType:'touch', isPrimary:true, bubbles:true});
    const pulseUp = await mobilePage.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(pulseUp.mobilePulsePointerId,null,'mobile PULSE releases cleanly');
    await mobilePage.locator('#mobileScratchBtn').dispatchEvent('pointerdown', {pointerId:42, pointerType:'touch', isPrimary:true, bubbles:true});
    const scratchDown = await mobilePage.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(scratchDown.mobileScratchPointerId, 42);
    assert.equal(scratchDown.scratchHeld, true);
    await mobilePage.locator('#mobileScratchBtn').dispatchEvent('pointercancel', {pointerId:42, pointerType:'touch', isPrimary:true, bubbles:true});
    const scratchUp = await mobilePage.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(scratchUp.mobileScratchPointerId, null, `mobile SCRATCH pointercancel clears pointer ${JSON.stringify({scratchDown, scratchUp})}`);
    assert.equal(scratchUp.scratchHeld, false, `mobile SCRATCH pointercancel releases hold ${JSON.stringify({scratchDown, scratchUp})}`);
    assert.equal(scratchUp.mouseDownRight, false, `mobile SCRATCH pointercancel releases right input ${JSON.stringify({scratchDown, scratchUp})}`);
    const mobileLoop = await measureLoop(mobilePage, 500);
    assert.ok(mobileLoop.frameDelta > 5 && mobileLoop.renderDelta > 5 && mobileLoop.wallTimeDelta > 300, `mobile loop ${JSON.stringify(mobileLoop)}`);
    await runRapidSkipRegression(mobilePage, 'mobile');
    await runFinalTutorialRegression(mobilePage, 'mobile');

    const aimDiagnostics = await page.evaluate(() => {
      const api=window.CircleMixTestApi, rad=Math.PI/180;
      const seq=(degrees, radius=180) => api.injectAimSamples(degrees.map((d,i)=>({angle:d*rad,radius,timestamp:1000+i*10})), 'OFF');
      const cw360=seq(Array.from({length:17},(_,i)=>i*22.5));
      const cw540=seq(Array.from({length:25},(_,i)=>i*22.5));
      const cw720=seq(Array.from({length:33},(_,i)=>i*22.5));
      const ccw360=seq(Array.from({length:17},(_,i)=>-i*22.5));
      const ccw540=seq(Array.from({length:25},(_,i)=>-i*22.5));
      const ccw720=seq(Array.from({length:33},(_,i)=>-i*22.5));
      const wrapCW=seq([359,1]), wrapCCW=seq([1,359]);
      const jump=seq([0,180]);
      api.injectAimSamples([{angle:0,radius:180,timestamp:1}], 'OFF');
      const immediateJump=api.injectImmediateAimSample(Math.PI,180,2);
      const crossing=api.injectAimSamples([{angle:0,radius:180,timestamp:1},{angle:Math.PI,radius:.5,timestamp:2},{angle:Math.PI/2,radius:.5,timestamp:3},{angle:Math.PI,radius:180,timestamp:4},{angle:Math.PI+.1,radius:180,timestamp:5}], 'OFF');
      const stale=api.expireAimInput();
      const keyCW=api.injectKeyboardRotation(1), keyCCW=api.injectKeyboardRotation(-1);
      api.setPcAimMode("LOCKED"); api.injectAimSamples([{angle:-Math.PI/2,radius:180,timestamp:100}], "OFF");
      const lockedStart=api.aimInputState(); const lockedCW=api.injectLockedMovement(40,0,110); const lockedCCW=api.injectLockedMovement(-80,0,120); const pointerLockState=api.state();
      return {lockedStart,lockedCW,lockedCCW,pointerLockState,cw360,cw540,cw720,ccw360,ccw540,ccw720,wrapCW,wrapCCW,jump,immediateJump,crossing,stale,keyCW,keyCCW};
    });
    const near=(a,b,e=.03)=>Math.abs(a-b)<e;
    assert.ok(near(aimDiagnostics.cw360.accumulatedCWTravel,2*Math.PI,.05), `CW 360 ${JSON.stringify(aimDiagnostics.cw360)}`);
    assert.ok(near(aimDiagnostics.cw540.accumulatedCWTravel,3*Math.PI,.05), `CW 540 ${JSON.stringify(aimDiagnostics.cw540)}`);
    assert.ok(near(aimDiagnostics.cw720.accumulatedCWTravel,4*Math.PI,.05), `CW 720 ${JSON.stringify(aimDiagnostics.cw720)}`);
    assert.ok(near(aimDiagnostics.ccw360.accumulatedCCWTravel,2*Math.PI,.05), `CCW 360 ${JSON.stringify(aimDiagnostics.ccw360)}`);
    assert.ok(near(aimDiagnostics.ccw540.accumulatedCCWTravel,3*Math.PI,.05), `CCW 540 ${JSON.stringify(aimDiagnostics.ccw540)}`);
    assert.ok(near(aimDiagnostics.ccw720.accumulatedCCWTravel,4*Math.PI,.05), `CCW 720 ${JSON.stringify(aimDiagnostics.ccw720)}`);
    assert.ok(near(aimDiagnostics.wrapCW.accumulatedCWTravel,2*Math.PI/180,.01), `359 -> 1 ${JSON.stringify(aimDiagnostics.wrapCW)}`);
    assert.ok(near(aimDiagnostics.wrapCCW.accumulatedCCWTravel,2*Math.PI/180,.01), `1 -> 359 ${JSON.stringify(aimDiagnostics.wrapCCW)}`);
    assert.ok(near(aimDiagnostics.jump.judgementAimAngle,Math.PI,.01) && !aimDiagnostics.jump.magnetTarget, `OFF jump ${JSON.stringify(aimDiagnostics.jump)}`);
    assert.ok(near(aimDiagnostics.immediateJump.judgementAimAngle,Math.PI,.01), `immediate OFF jump ${JSON.stringify(aimDiagnostics.immediateJump)}`);
    assert.ok(aimDiagnostics.crossing.accumulatedCWTravel<.2, `deadzone rebase ${JSON.stringify(aimDiagnostics.crossing)}`);
    assert.equal(aimDiagnostics.stale.sampleAngularVelocity, 0, `stale velocity ${JSON.stringify(aimDiagnostics.stale)}`);
    assert.ok(aimDiagnostics.keyCW.accumulatedCWTravel>0 && aimDiagnostics.keyCCW.accumulatedCCWTravel>0, `keyboard travel ${JSON.stringify({keyCW:aimDiagnostics.keyCW,keyCCW:aimDiagnostics.keyCCW})}`);
    assert.notEqual(aimDiagnostics.lockedStart.unwrappedAngle, aimDiagnostics.lockedCW.unwrappedAngle, `locked relative CW movement changes aim ${JSON.stringify(aimDiagnostics)}`);
    assert.notEqual(aimDiagnostics.lockedCW.unwrappedAngle, aimDiagnostics.lockedCCW.unwrappedAngle, `locked relative CCW movement changes aim ${JSON.stringify(aimDiagnostics)}`);
    assert.equal(aimDiagnostics.pointerLockState.pointerLockMode, "LOCKED");
    assert.ok(Number.isFinite(aimDiagnostics.pointerLockState.lockedVirtualAngle) && Number.isFinite(aimDiagnostics.pointerLockState.lockedSensitivity), `pointer lock diagnostics finite ${JSON.stringify(aimDiagnostics.pointerLockState)}`);

    assert.deepEqual([...errors, ...mobileErrors], []);
    console.log('PASS browser regression', {freshDesktopLoop, answeredDesktopLoop, freshMobileLoop, stillMouseLoop, hudHoverLoop, routingAutoResults, songResults, mobile:{frameDelta:mobileLoop.frameDelta}});
    await browser.close();
    activeBrowser = null;
  } finally {
    server.close();
  }
})().catch(async error => {
  console.error(error);
  await captureFailureArtifacts(error);
  await activeBrowser?.close().catch(() => {});
  process.exit(1);
});
