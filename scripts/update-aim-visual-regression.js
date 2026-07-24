'use strict';
const fs=require('fs');
const path=require('path');
const file=path.resolve(__dirname,'../tests/smoke.test.js');
let src=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
function replaceBlock(startMarker,endMarker,replacement,label){
  const start=src.indexOf(startMarker);
  const end=src.indexOf(endMarker,start);
  if(start<0||end<0||end<=start) throw new Error(`Unable to locate ${label}.`);
  src=src.slice(0,start)+replacement+src.slice(end);
}
replaceBlock(
  'test("aim visual response is visual-only with deterministic large-error catch-up", () => {',
  'test("PC input runtime has no broad updateArm exception suppression", () => {',
  String.raw`test("aim visual response is visual-only with deterministic large-error catch-up", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.ok(src.includes('const AIM_VISUAL_RESPONSE_MODES = ["FAST","NORMAL","SOFT"]'));
assert.ok(src.includes('aimVisualResponse:AIM_VISUAL_RESPONSE_MODES.includes(saved.aimVisualResponse)?saved.aimVisualResponse:"FAST"'));
assert.ok(src.includes('const AIM_VISUAL_SNAP_ERROR={FAST:Math.PI*.25,NORMAL:Math.PI/3,SOFT:Math.PI*5/12}'));
assert.ok(src.includes('function shouldSnapVisualAim(visualTarget,responseMode=inputSettings.aimVisualResponse,currentAngle=visualArmAngle)'));
assert.ok(src.includes('function mouseVisualAimStep(currentAngle,visualTarget,dt,responseMode=inputSettings.aimVisualResponse,angularVelocity=aimInput.sampleAngularVelocity)'));
const visualUpdateStart=src.indexOf('  function updateVisualArmAngle(visualTarget,dt){');
const visualUpdateEnd=src.indexOf('\n  function normalizedAimTimestamp',visualUpdateStart);
const visualUpdate=visualUpdateStart>=0&&visualUpdateEnd>visualUpdateStart?src.slice(visualUpdateStart,visualUpdateEnd):'';
assert.ok(visualUpdate.includes('inputSettings.aimVisual==="DIRECT" || lastPointerSource==="touch"'));
assert.ok(visualUpdate.includes('mouseVisualAimStep(visualArmAngle,visualTarget,dt'));
assert.ok(!visualUpdate.includes('judgementAimAngle='));
assert.match(fs.readFileSync("index.html", "utf8"), /VISUAL RESPONSE FAST/);
});

`,
  'the aim visual regression block'
);
replaceBlock(
  'test("LOW/MEDIUM use a small center guard and symmetric magnet disengage", () => {',
  'test("PC pointermove aim tracking is separate from click blocking over UI", () => {',
  String.raw`test("LOW/MEDIUM use a small center guard and symmetric magnet disengage", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.ok(src.includes('if(mode==="MEDIUM") return {mode, slowTime:.030'));
assert.ok(src.includes('centerEnterRatio:.035, centerExitRatio:.050, centerEnterPx:8, centerExitPx:11, jumpBypass:Math.PI*.34'));
assert.ok(src.includes('if(mode==="LOW") return {mode, slowTime:.018'));
assert.ok(src.includes('centerEnterRatio:.025, centerExitRatio:.040, centerEnterPx:6, centerExitPx:9, jumpBypass:Math.PI*.28'));
assert.match(src, /function centerDeadzoneForProfile\(profile\)/);
assert.match(src, /speed>=profile\.disengageVel/);
assert.match(src, /const movingAway=velocity\*err<0 && speed>1\.15/);
const disengageVel = 4.4;
assert.equal(Math.abs(5.1) >= disengageVel, true);
assert.equal(Math.abs(-5.1) >= disengageVel, true);
const movingAway = (velocity, err) => velocity * err < 0 && Math.abs(velocity) > 1.15;
assert.equal(movingAway(1.2, -0.1), true);
assert.equal(movingAway(-1.2, 0.1), true);
assert.equal(movingAway(1.2, 0.1), false);
assert.equal(movingAway(-1.2, -0.1), false);
});

`,
  'the stabilizer regression block'
);
replaceBlock(
  'test("keyboard and AUTO aim synchronize the unified rotation state", () => {',
  'test("playfield readability keeps TRACE visual widths independent of judgement tolerance", () => {',
  String.raw`test("keyboard and AUTO aim keep judgement unified while AUTO rendering stays independent", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /const delta=\(keyD-keyA\)\*9\.5\*dt/);
assert.match(src, /aimInput\.accumulatedCWTravel\+=delta/);
assert.match(src, /aimInput\.accumulatedCCWTravel-=delta/);
const setterStart=src.indexOf('  function setAutoAimAngle(angle,velocity=0){');
const setterEnd=src.indexOf('\n  function completeAutoNote',setterStart);
const setter=setterStart>=0&&setterEnd>setterStart?src.slice(setterStart,setterEnd):'';
assert.ok(setter.includes('targetAngle=armAngle=judgementAimAngle=rawInputAngle=rawTargetAngle=stabilizedTargetAngle=lastValidTargetAngle=a'));
assert.ok(!setter.includes('visualArmAngle='));
const armStart=src.indexOf('  function updateArm(dt){');
const armEnd=src.indexOf('\n  function logAutoProcessing',armStart);
const armBody=armStart>=0&&armEnd>armStart?src.slice(armStart,armEnd):'';
assert.ok(armBody.includes('visualArmAngle=autoVisualAimStep'));
});

`,
  'the keyboard and AUTO synchronization block'
);
replaceBlock(
  'test("playfield readability only renders a separate judgement marker when needed", () => {',
  'test("foldable mobile viewports retry landscape safely", () => {',
  String.raw`test("playfield readability hides AUTO verifier marker and keeps user marker conditional", () => {
const src = fs.readFileSync("src/game.js", "utf8");
const markerStart=src.indexOf('  function judgementMarkerVisible(){');
const markerEnd=src.indexOf('\n  function drawArm',markerStart);
const marker=markerStart>=0&&markerEnd>markerStart?src.slice(markerStart,markerEnd):'';
assert.ok(marker.includes('return !isAutoActive() && judgementMarkerVisibleFor'));
assert.match(src, /if\(judgementMarkerVisible\(\)\)\{/);
assert.match(src, /ctx\.arc\(hitR,0,5\.5,0,TAU\); ctx\.stroke\(\)/);
assert.doesNotMatch(src, /ctx\.arc\(hitR,0,4\.5,0,TAU\); ctx\.fill\(\)/);
});

`,
  'the judgement marker readability block'
);
fs.writeFileSync(file,src);
console.log('Updated aim visual, stabilizer, AUTO, and marker regression contracts.');
