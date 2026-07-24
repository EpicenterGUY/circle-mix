'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
const write=(file,content)=>fs.writeFileSync(path.join(root,file),content);
function replaceOrVerify(source,search,replacement,label,marker){
  const next=source.replace(search,replacement);
  if(next!==source)return next;
  if(marker&&source.includes(marker))return source;
  throw new Error(`Unable to ${label}.`);
}

let game=read('src/game.js');
game=replaceOrVerify(game,
'  const AIM_VISUAL_SNAP_ERROR={FAST:Math.PI*.38,NORMAL:Math.PI*.46,SOFT:Math.PI*.56};',
'  // 90°+ mouse jumps must never trail behind the real judgement target, even on SOFT.\n  const AIM_VISUAL_SNAP_ERROR={FAST:Math.PI*.25,NORMAL:Math.PI/3,SOFT:Math.PI*5/12};',
'lower the mouse visual large-jump thresholds','90°+ mouse jumps');

game=replaceOrVerify(game,
`  function aimStabilizerProfile(mode=inputSettings.aimStabilizer){
    // Stabilizer modes are deliberately light.  Their deadzone only protects
    // atan2 at the exact centre; it must not swallow large-angle mouse jumps.
    if(mode==="MEDIUM") return {mode, slowTime:.030, slowVel:.85, fastVel:4.4, magnetEnter:5*Math.PI/180, magnetExit:8*Math.PI/180, magnetStrength:.27, disengageVel:4.8, centerEnterRatio:.055, centerExitRatio:.075, centerEnterPx:12, centerExitPx:16, jumpBypass:Math.PI*.40};
    if(mode==="LOW") return {mode, slowTime:.018, slowVel:.75, fastVel:3.8, magnetEnter:3*Math.PI/180, magnetExit:7*Math.PI/180, magnetStrength:.16, disengageVel:4.4, centerEnterRatio:.040, centerExitRatio:.060, centerEnterPx:8, centerExitPx:12, jumpBypass:Math.PI*.34};
    return {mode:"OFF", slowTime:0, slowVel:0, fastVel:0, magnetEnter:0, magnetExit:0, magnetStrength:0, disengageVel:0, centerEnterRatio:0, centerExitRatio:0, centerEnterPx:1, centerExitPx:2, jumpBypass:0};
  }`,
`  function aimStabilizerProfile(mode=inputSettings.aimStabilizer){
    // MOUSE_AIM_LARGE_JUMP_FLOW: optional stabilizers keep a small centre guard,
    // but release early on decisive jumps. OFF remains the raw 1:1 judgement path.
    if(mode==="MEDIUM") return {mode, slowTime:.030, slowVel:.85, fastVel:4.4, magnetEnter:5*Math.PI/180, magnetExit:8*Math.PI/180, magnetStrength:.27, disengageVel:4.8, centerEnterRatio:.035, centerExitRatio:.050, centerEnterPx:8, centerExitPx:11, jumpBypass:Math.PI*.34};
    if(mode==="LOW") return {mode, slowTime:.018, slowVel:.75, fastVel:3.8, magnetEnter:3*Math.PI/180, magnetExit:7*Math.PI/180, magnetStrength:.16, disengageVel:4.4, centerEnterRatio:.025, centerExitRatio:.040, centerEnterPx:6, centerExitPx:9, jumpBypass:Math.PI*.28};
    return {mode:"OFF", slowTime:0, slowVel:0, fastVel:0, magnetEnter:0, magnetExit:0, magnetStrength:0, disengageVel:0, centerEnterRatio:0, centerExitRatio:0, centerEnterPx:1, centerExitPx:2, jumpBypass:0};
  }`,
'lighten mouse stabilizer deadzones and jump bypass','MOUSE_AIM_LARGE_JUMP_FLOW');

game=replaceOrVerify(game,
`  function visualSnapThreshold(){ return AIM_VISUAL_SNAP_ERROR[inputSettings.aimVisualResponse] || AIM_VISUAL_SNAP_ERROR.FAST; }
  function shouldSnapVisualAim(visualTarget){ return Math.abs(norm(visualTarget-visualArmAngle))>=visualSnapThreshold(); }
  function updateVisualArmAngle(visualTarget,dt){
    if(inputSettings.aimVisual==="DIRECT" || lastPointerSource==="touch" || shouldSnapVisualAim(visualTarget)){ visualArmAngle=visualTarget; return; }
    const response={FAST:{base:.016,min:.0035},NORMAL:{base:.032,min:.007},SOFT:{base:.055,min:.012}}[inputSettings.aimVisualResponse] || {base:.016,min:.0035};
    const error=Math.abs(norm(visualTarget-visualArmAngle));
    const velocity=Math.abs(aimInput.sampleAngularVelocity)||0;
    const urgency=Math.max(1-Math.exp(-velocity/3.6),1-Math.exp(-error/(Math.PI/6)));
    const tau=response.base+(response.min-response.base)*urgency;
    visualArmAngle=norm(visualArmAngle+norm(visualTarget-visualArmAngle)*(1-Math.exp(-dt/Math.max(tau,.001))));
  }`,
`  function visualSnapThreshold(responseMode=inputSettings.aimVisualResponse){ return AIM_VISUAL_SNAP_ERROR[responseMode] || AIM_VISUAL_SNAP_ERROR.FAST; }
  function shouldSnapVisualAim(visualTarget,responseMode=inputSettings.aimVisualResponse,currentAngle=visualArmAngle){ return Math.abs(norm(visualTarget-currentAngle))>=visualSnapThreshold(responseMode); }
  function mouseVisualAimStep(currentAngle,visualTarget,dt,responseMode=inputSettings.aimVisualResponse,angularVelocity=aimInput.sampleAngularVelocity){
    if(!Number.isFinite(visualTarget))return Number.isFinite(currentAngle)?norm(currentAngle):0;
    const target=norm(visualTarget);
    if(!Number.isFinite(currentAngle)||shouldSnapVisualAim(target,responseMode,currentAngle))return target;
    const response={FAST:{base:.014,min:.003},NORMAL:{base:.028,min:.006},SOFT:{base:.048,min:.010}}[responseMode] || {base:.014,min:.003};
    const safeDt=clamp(Number(dt)||0,0,.1);
    if(safeDt<=0)return norm(currentAngle);
    const error=Math.abs(norm(target-currentAngle));
    const velocity=Math.abs(Number(angularVelocity)||0);
    const urgency=Math.max(1-Math.exp(-velocity/3.4),1-Math.exp(-error/(Math.PI/7)));
    const tau=response.base+(response.min-response.base)*urgency;
    return norm(currentAngle+norm(target-currentAngle)*(1-Math.exp(-safeDt/Math.max(tau,.001))));
  }
  function updateVisualArmAngle(visualTarget,dt){
    if(inputSettings.aimVisual==="DIRECT" || lastPointerSource==="touch"){ visualArmAngle=visualTarget; return; }
    visualArmAngle=mouseVisualAimStep(visualArmAngle,visualTarget,dt,inputSettings.aimVisualResponse,aimInput.sampleAngularVelocity);
  }`,
'apply event-responsive mouse visual aim','function mouseVisualAimStep');
write('src/game.js',game);

let smoke=read('tests/smoke.test.js');
smoke=replaceOrVerify(smoke,
'SLIDE_JUDGEMENT_PROFILE, PULSE_SYNC_EPSILON, COLORS, isPulseSynchronizedCut, noteColor, nextAimNotesAfterPulse, nextAimNoteAfterPulse, PULSE_AIM_GUIDE_LINGER, PULSE_AIM_GUIDE_LOOKAHEAD, AUTO_VISUAL_AIM_PATH_RESPONSE, autoVisualAimStep, updateTraceEndpointCapture, traceEndpointJudgement, traceProfile,',
'SLIDE_JUDGEMENT_PROFILE, PULSE_SYNC_EPSILON, COLORS, isPulseSynchronizedCut, noteColor, nextAimNotesAfterPulse, nextAimNoteAfterPulse, PULSE_AIM_GUIDE_LINGER, PULSE_AIM_GUIDE_LOOKAHEAD, AUTO_VISUAL_AIM_PATH_RESPONSE, autoVisualAimStep, AIM_VISUAL_SNAP_ERROR, aimStabilizerProfile, mouseVisualAimStep, effectivePcAimMode, updateTraceEndpointCapture, traceEndpointJudgement, traceProfile,',
'export mouse aim feel helpers','AIM_VISUAL_SNAP_ERROR, aimStabilizerProfile, mouseVisualAimStep');

const mouseTest=`test("mouse aim keeps raw judgement while improving large-angle visual response", () => {
  const angularDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
  assert.equal(api.effectivePcAimMode(),"ABSOLUTE","PC AIM AUTO must remain an ABSOLUTE fallback, never implicit pointer lock");
  assert.ok(api.AIM_VISUAL_SNAP_ERROR.FAST<api.AIM_VISUAL_SNAP_ERROR.NORMAL);
  assert.ok(api.AIM_VISUAL_SNAP_ERROR.NORMAL<api.AIM_VISUAL_SNAP_ERROR.SOFT);
  for(const mode of ["FAST","NORMAL","SOFT"]){
    const jump=api.mouseVisualAimStep(0,Math.PI/2,1/60,mode,0);
    assert.ok(angularDistance(jump,Math.PI/2)<1e-12,\`${mode} must immediately display a 90 degree jump\`);
  }
  const small=api.mouseVisualAimStep(0,.12,1/60,"SOFT",0);
  assert.ok(small>0 && small<.12,"small SMOOTH movement should remain visually softened");
  const wrapped=api.mouseVisualAimStep(3.05,-3.05,1/60,"SOFT",0);
  assert.ok(angularDistance(wrapped,-3.05)<angularDistance(3.05,-3.05),"mouse visual smoothing must use the shortest circular path");
  const off=api.aimStabilizerProfile("OFF"), low=api.aimStabilizerProfile("LOW"), medium=api.aimStabilizerProfile("MEDIUM");
  assert.equal(off.centerEnterPx,1); assert.equal(off.centerExitPx,2); assert.equal(off.jumpBypass,0);
  assert.ok(low.centerEnterPx<=6 && low.centerExitPx<=9 && low.jumpBypass<=Math.PI*.28+.000001);
  assert.ok(medium.centerEnterPx<=8 && medium.centerExitPx<=11 && medium.jumpBypass<=Math.PI*.34+.000001);
  const src=fs.readFileSync("src/game.js","utf8");
  assert.match(src,/MOUSE_AIM_LARGE_JUMP_FLOW/);
  assert.match(src,/if\(profile\.mode==="OFF" \|\| source==="touch"\)\{\s*stabilizedTargetAngle=angle; judgementAimAngle=armAngle=angle;/);
  assert.match(src,/function effectivePcAimMode\(\)\{ return inputSettings\.pcAimMode==="LOCKED" \? "LOCKED" : "ABSOLUTE"; \}/);
  assert.doesNotMatch(src,/pcAimMode==="AUTO"[^\n]*(LOCKED|requestPointerLock)/);
});\n\n`;
smoke=replaceOrVerify(smoke,
`test("PULSE-synchronized CUT uses the shared orange readability language", () => {`,
mouseTest+`test("PULSE-synchronized CUT uses the shared orange readability language", () => {`,
'add mouse aim feel smoke coverage','mouse aim keeps raw judgement');
write('tests/smoke.test.js',smoke);
console.log('Applied mouse aim feel transform.');
