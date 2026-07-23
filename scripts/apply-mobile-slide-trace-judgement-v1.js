'use strict';

const fs = require('node:fs');

function replaceOnce(source, search, replacement, label) {
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`Missing patch target: ${label}`);
  if (source.indexOf(search, first + search.length) >= 0) throw new Error(`Ambiguous patch target: ${label}`);
  return source.slice(0, first) + replacement + source.slice(first + search.length);
}

function patchFile(path, edits) {
  let source = fs.readFileSync(path, 'utf8');
  for (const [search, replacement, label] of edits) source = replaceOnce(source, search, replacement, label);
  fs.writeFileSync(path, source);
}

patchFile('src/game.js', [
  [
`  function frame(ms){`,
`  function isActionHoldActive(){
    return isAutoActive() || mouseDownRight || mobileActionPointerId!==null || keys.KeyZ || keys.KeyX || keys.Space;
  }

  function frame(ms){`,
    'shared action hold helper'
  ],
  [
`    filterHeld = isAutoActive() || mouseDownRight || keys.KeyZ || keys.KeyX || keys.Space;`,
`    filterHeld = isActionHoldActive();`,
    'runtime action hold refresh'
  ],
  [
`if(role==="action"&&mobileActionPointerId===null){ mobileActionPointerId=e.pointerId; keys.MouseLeft=true; btn.classList.add("mobileActionActive"); tutorialState.activeInput="touch"; tutorialState.lastSource="touch"; if(running)onCut(); }`,
`if(role==="action"&&mobileActionPointerId===null){ mobileActionPointerId=e.pointerId; keys.MouseLeft=true; filterHeld=true; btn.classList.add("mobileActionActive"); tutorialState.activeInput="touch"; tutorialState.lastSource="touch"; if(running)onCut(); }`,
    'mobile action press hold'
  ],
  [
`if(role==="action"&&e.pointerId===mobileActionPointerId){ keys.MouseLeft=false; mobileActionPointerId=null; btn.classList.remove("mobileActionActive"); }`,
`if(role==="action"&&e.pointerId===mobileActionPointerId){ keys.MouseLeft=false; mobileActionPointerId=null; filterHeld=isActionHoldActive(); btn.classList.remove("mobileActionActive"); }`,
    'mobile action release hold'
  ],
  [
`while(browserTestClock<target){ const delta=Math.min(dt,target-browserTestClock); browserTestClock+=delta; filterHeld=mouseDownRight||keys.KeyZ||keys.KeyX||keys.Space; scratchHeld=mouseDownRight;`,
`while(browserTestClock<target){ const delta=Math.min(dt,target-browserTestClock); browserTestClock+=delta; filterHeld=isActionHoldActive(); scratchHeld=mouseDownRight;`,
    'test clock action hold refresh'
  ],
  [
`actionHeld:!!keys.MouseLeft, scratchHeld:!!scratchHeld,`,
`actionHeld:!!keys.MouseLeft, holdInputActive:!!filterHeld, scratchHeld:!!scratchHeld,`,
    'mobile hold test state'
  ]
]);

patchFile('tests/browser-regression.test.js', [
  [
`const booleans = ['running','paused','tutorialMode','tutorialPointerMoved','tutorialTransitioning','tutorialFinalMixRetryScheduled','tutorialChartSettled','tutorialHudHidden','tutorialCompleteVisible','inputEnabled','pointerActive','actionHeld','scratchHeld','mouseDownRight'];`,
`const booleans = ['running','paused','tutorialMode','tutorialPointerMoved','tutorialTransitioning','tutorialFinalMixRetryScheduled','tutorialChartSettled','tutorialHudHidden','tutorialCompleteVisible','inputEnabled','pointerActive','actionHeld','holdInputActive','scratchHeld','mouseDownRight'];`,
    'browser state contract'
  ],
  [
`    assert.equal(actionDown.mobileActionPointerId, 41);
    assert.equal(actionDown.actionHeld, true);
    await mobilePage.locator('#mobileActionBtn').dispatchEvent('pointerup', {pointerId:41, pointerType:'touch', isPrimary:true, bubbles:true});
    const actionUp = await mobilePage.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(actionUp.mobileActionPointerId, null);
    assert.equal(actionUp.actionHeld, false);`,
`    assert.equal(actionDown.mobileActionPointerId, 41);
    assert.equal(actionDown.actionHeld, true);
    assert.equal(actionDown.holdInputActive, true, 'mobile ACTION immediately enters the shared SLIDE/HOLD input path');
    const sustainedActionLoop = await measureLoop(mobilePage, 180);
    assert.ok(sustainedActionLoop.frameDelta > 1, 'mobile ACTION hold survives multiple gameplay frames');
    assert.equal(sustainedActionLoop.after.mobileActionPointerId, 41);
    assert.equal(sustainedActionLoop.after.actionHeld, true);
    assert.equal(sustainedActionLoop.after.holdInputActive, true, 'mobile ACTION is not cleared by the per-frame hold refresh');
    const simultaneousAimPoint = await mobilePage.evaluate(() => { const st=window.CircleMixTestApi.state(); return {x:st.cx+st.hitR*.7,y:st.cy-st.hitR*.7}; });
    await mobilePage.locator('#game').dispatchEvent('pointerdown', {pointerId:44, pointerType:'touch', isPrimary:false, bubbles:true, clientX:simultaneousAimPoint.x, clientY:simultaneousAimPoint.y});
    await mobilePage.locator('#game').dispatchEvent('pointermove', {pointerId:44, pointerType:'touch', isPrimary:false, bubbles:true, clientX:simultaneousAimPoint.x+12, clientY:simultaneousAimPoint.y+8});
    await mobilePage.locator('#game').dispatchEvent('pointerup', {pointerId:44, pointerType:'touch', isPrimary:false, bubbles:true, clientX:simultaneousAimPoint.x+12, clientY:simultaneousAimPoint.y+8});
    const actionWithAim = await mobilePage.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(actionWithAim.mobileActionPointerId, 41, 'AIM finger release does not release the ACTION finger');
    assert.equal(actionWithAim.holdInputActive, true, 'ACTION remains valid while another finger moves the aim');
    assert.equal(actionWithAim.lastPointerSource, 'touch');
    await mobilePage.locator('#mobileActionBtn').dispatchEvent('pointerup', {pointerId:41, pointerType:'touch', isPrimary:true, bubbles:true});
    const actionUp = await mobilePage.evaluate(() => window.CircleMixTestApi.state());
    assert.equal(actionUp.mobileActionPointerId, null);
    assert.equal(actionUp.actionHeld, false);
    assert.equal(actionUp.holdInputActive, false);`,
    'mobile sustained action regression'
  ]
]);

fs.writeFileSync('docs/mobile-slide-trace-judgement-v1.md', `# Mobile SLIDE and TRACE judgement v1

The SLIDE and TRACE judgement rules merged in PR #120 are shared by desktop and touch aim. This follow-up fixes the missing mobile ACTION hold route so those rules are usable on coarse-pointer devices.

## Mobile ACTION

- A held mobile ACTION button now remains part of the production SLIDE/HOLD input state across animation frames.
- Releasing the AIM finger does not release a separately held ACTION finger.
- Releasing ACTION recomputes the shared hold state so keyboard, AUTO or legacy SCRATCH sources are not cleared incorrectly.

## TRACE

- Touch aim already uses the direct shared judgement angle and directed-travel accumulator.
- No separate mobile TRACE tolerance is introduced; start, travel, reverse and endpoint rules remain identical across devices.

## Regression coverage

The mobile browser regression now holds ACTION over multiple frames, moves a second AIM pointer, verifies the ACTION pointer remains active, and checks clean release of the shared hold state.
`);

for (const temporaryPath of [
  'scripts/apply-mobile-slide-trace-judgement-v1.js',
  '.github/workflows/apply-mobile-slide-trace-judgement-v1.yml'
]) {
  if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath);
}

console.log('Applied mobile SLIDE and TRACE judgement v1 patch.');
