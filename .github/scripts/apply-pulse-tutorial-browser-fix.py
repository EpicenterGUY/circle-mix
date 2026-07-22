from pathlib import Path

path = Path("tests/browser-regression.test.js")
source = path.read_text()
replacements = [
    (
        "st.tutorialStepIndex >= Math.min(arg.beforeIndex + 2, 17) &&",
        "st.tutorialStepIndex >= arg.beforeIndex + 2 &&",
    ),
    (
        '''async function reachFinalTutorialStep(page, label){
  await page.evaluate(() => window.CircleMixTestApi.startTutorial());
  await waitFor(page, () => window.CircleMixTestApi.state().tutorialMode, `${label} tutorial restart`);
  await clickSkipRapidly(page, 17, 20);
  await waitFor(page, () => {
    const st = window.CircleMixTestApi.state();
    return st.tutorialMode && st.tutorialStepIndex === 17 && st.pendingTutorialSkipCount === 0 && st.tutorialTransitionState === 'IDLE';
  }, `${label} final tutorial step`, 12000);
  const finalState = await page.evaluate(() => window.CircleMixTestApi.state());
  assert.equal(finalState.tutorialStepIndex, 17);
  assert.equal(finalState.currentTutorialTitle, '종합 연습');
  assert.equal(finalState.currentTutorialKind, 'mix');
  assert.equal(finalState.chartLength, 8);
  assert.deepEqual(finalState.chartNoteTypes, ['cut','cut','fx','slideCW','traceCCW','swingCW','scratchCCW','cut']);
  assert.equal(finalState.traceSwingPhase, null);
  assert.equal(finalState.tutorialSuccessCount, 0);
  assert.deepEqual(finalState.consumedNoteIds, []);
  assert.ok(finalState.chartDoneStates.every(n => !n.hold && !n.missed && !n.done && !n.completed), `${label} final notes reset ${JSON.stringify(finalState.chartDoneStates)}`);
  const loop = await measureLoop(page, 650);
  assert.ok(loop.frameDelta > 8 && loop.renderDelta > 8 && loop.timeDelta > 0.3, `${label} final loop ${JSON.stringify(loop)}`);
}''',
        '''async function reachFinalTutorialStep(page, label){
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
}''',
    ),
    (
        '''  await reachFinalTutorialStep(page, `${label} miss`);
  const beforeMiss = await page.evaluate(() => window.CircleMixTestApi.state());''',
        '''  const finalState = await reachFinalTutorialStep(page, `${label} miss`);
  const finalStepIndex = finalState.tutorialStepIndex;
  const beforeMiss = await page.evaluate(() => window.CircleMixTestApi.state());''',
    ),
    (
        "assert.equal(afterOneSecond.tutorialStepIndex, 17);",
        "assert.equal(afterOneSecond.tutorialStepIndex, finalStepIndex);",
    ),
    (
        "return st.tutorialMode && st.tutorialStepIndex === 17 && st.tutorialFinalMixRetryCount === 1 && st.tutorialTimerCount === 0 && st.chartDoneStates.every(n => !n.done && !n.missed);",
        "return st.tutorialMode && st.currentTutorialKind === 'mix' && st.tutorialFinalMixRetryCount === 1 && st.tutorialTimerCount === 0 && st.chartDoneStates.every(n => !n.done && !n.missed);",
    ),
    (
        '''  await reachFinalTutorialStep(page, `${label} consecutive retries`);
  const attempts = [];''',
        '''  const finalState = await reachFinalTutorialStep(page, `${label} consecutive retries`);
  const finalStepIndex = finalState.tutorialStepIndex;
  const attempts = [];''',
    ),
    (
        "assert.equal(after.tutorialStepIndex, 17, `${label} retry ${expectedRetry} remains on final step`);",
        "assert.equal(after.tutorialStepIndex, finalStepIndex, `${label} retry ${expectedRetry} remains on final step`);",
    ),
]

for old, new in replacements:
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"expected exactly one match, found {count}: {old[:100]!r}")
    source = source.replace(old, new)

if "tutorialStepIndex === 17" in source or "tutorialStepIndex, 17" in source:
    raise SystemExit("stale fixed final tutorial index remains")

path.write_text(source)
