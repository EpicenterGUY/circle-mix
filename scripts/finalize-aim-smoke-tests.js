'use strict';
const fs=require('fs');
const path=require('path');
const file=path.resolve(__dirname,'../tests/smoke.test.js');
let src=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const startMarker='test("AUTO visual aim flows between targets without changing verifier timing", () => {';
const endMarker='test("PULSE-synchronized CUT uses the shared orange readability language", () => {';
const start=src.indexOf(startMarker);
const end=src.indexOf(endMarker,start);
if(start<0||end<0||end<=start) throw new Error('Unable to locate generated aim smoke-test block.');
const clean=`test("AUTO visual aim flows between targets without changing verifier timing", () => {
  const angularDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
  const target=2.4;
  const first=api.autoVisualAimStep(0,target,1/60,.5);
  assert.ok(first>0 && first<target*.2,"a distant AUTO target must start moving without teleporting");
  let angle=0;
  for(let frame=0;frame<60;frame++) angle=api.autoVisualAimStep(angle,target,1/60,(60-frame)/60);
  assert.ok(angularDistance(angle,target)<1e-9,"deadline interpolation must arrive on the hit frame");
  const wrapped=api.autoVisualAimStep(-2.9,2.9,1/60,.5);
  assert.ok(angularDistance(wrapped,2.9)<angularDistance(-2.9,2.9),"AUTO visual flow must use the shortest circular route");
  const pathStep=api.autoVisualAimStep(0,1.5,1/60,api.AUTO_VISUAL_AIM_PATH_RESPONSE);
  assert.ok(pathStep>0 && pathStep<1.5,"moving SLIDE/TRACE targets must keep a short visual lag instead of snapping");
  const source=fs.readFileSync("src/game.js","utf8");
  const setterStart=source.indexOf("  function setAutoAimAngle(angle,velocity=0){");
  const setterEnd=source.indexOf("\n  function completeAutoNote",setterStart);
  const setter=setterStart>=0&&setterEnd>setterStart?source.slice(setterStart,setterEnd):"";
  assert.ok(setter,"AUTO aim setter missing");
  assert.ok(!setter.includes("visualArmAngle="),"AUTO verifier setter must not teleport the rendered arm");
  assert.ok(source.includes("AUTO_VISUAL_AIM_FLOW"));
  assert.ok(source.includes("autoVisualDeadline=n.hitTime"));
  assert.ok(source.includes("autoVisualPathActive?AUTO_VISUAL_AIM_PATH_RESPONSE"));
  assert.ok(source.includes("return !isAutoActive() && judgementMarkerVisibleFor"));
});

test("mouse aim keeps raw judgement while improving large-angle visual response", () => {
  const angularDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
  assert.equal(api.effectivePcAimMode(),"ABSOLUTE","PC AIM AUTO must remain an ABSOLUTE fallback, never implicit pointer lock");
  assert.ok(api.AIM_VISUAL_SNAP_ERROR.FAST<api.AIM_VISUAL_SNAP_ERROR.NORMAL);
  assert.ok(api.AIM_VISUAL_SNAP_ERROR.NORMAL<api.AIM_VISUAL_SNAP_ERROR.SOFT);
  for(const mode of ["FAST","NORMAL","SOFT"]){
    const jump=api.mouseVisualAimStep(0,Math.PI/2,1/60,mode,0);
    assert.ok(angularDistance(jump,Math.PI/2)<1e-12,mode+" must immediately display a 90 degree jump");
  }
  const small=api.mouseVisualAimStep(0,.12,1/60,"SOFT",0);
  assert.ok(small>0 && small<.12,"small SMOOTH movement should remain visually softened");
  const wrapped=api.mouseVisualAimStep(3.05,-3.05,1/60,"SOFT",0);
  assert.ok(angularDistance(wrapped,-3.05)<angularDistance(3.05,-3.05),"mouse visual smoothing must use the shortest circular path");
  const off=api.aimStabilizerProfile("OFF"), low=api.aimStabilizerProfile("LOW"), medium=api.aimStabilizerProfile("MEDIUM");
  assert.equal(off.centerEnterPx,1); assert.equal(off.centerExitPx,2); assert.equal(off.jumpBypass,0);
  assert.ok(low.centerEnterPx<=6 && low.centerExitPx<=9 && low.jumpBypass<=Math.PI*.28+.000001);
  assert.ok(medium.centerEnterPx<=8 && medium.centerExitPx<=11 && medium.jumpBypass<=Math.PI*.34+.000001);
  const source=fs.readFileSync("src/game.js","utf8");
  assert.ok(source.includes("MOUSE_AIM_LARGE_JUMP_FLOW"));
  assert.ok(source.includes('if(profile.mode==="OFF" || source==="touch"){\n      stabilizedTargetAngle=angle; judgementAimAngle=armAngle=angle;'));
  assert.ok(source.includes('function effectivePcAimMode(){ return inputSettings.pcAimMode==="LOCKED" ? "LOCKED" : "ABSOLUTE"; }'));
  const autoModeLine=source.split("\n").find(line=>line.includes('pcAimMode==="AUTO"'))||"";
  assert.ok(!autoModeLine.includes("LOCKED")&&!autoModeLine.includes("requestPointerLock"));
});

`;
src=src.slice(0,start)+clean+src.slice(end);
fs.writeFileSync(file,src);
console.log('Finalized aim smoke-test block.');
