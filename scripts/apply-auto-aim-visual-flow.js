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
`  function judgementMarkerVisible(){
    return judgementMarkerVisibleFor(visualArmAngle,judgementAimAngle,magnetTarget);
  }`,
`  function judgementMarkerVisible(){
    // AUTO uses a deliberately smoothed display arm while its deterministic judgement
    // target stays immediate. Do not render that hidden verifier target as a second cursor.
    return !isAutoActive() && judgementMarkerVisibleFor(visualArmAngle,judgementAimAngle,magnetTarget);
  }`,
'suppress the AUTO judgement marker','hidden verifier target');

game=replaceOrVerify(game,
`  function setAutoAimAngle(angle,velocity=0){
    if(!Number.isFinite(angle))return;
    const a=norm(angle);
    prevArmAngle=armAngle;
    targetAngle=armAngle=judgementAimAngle=visualArmAngle=rawInputAngle=rawTargetAngle=stabilizedTargetAngle=lastValidTargetAngle=a;
    rawArmVel=armVel=rawAngularVelocity=Number.isFinite(velocity)?velocity:0;
    aimInput.rawAngle=a; aimInput.unwrappedAngle=a; aimInput.previousSampleAngle=a;
    aimInput.sampleAngularVelocity=rawAngularVelocity; aimInput.lastSampleDelta=0;
  }`,
`  const AUTO_VISUAL_AIM_PATH_RESPONSE=.045;
  let autoVisualTargetAngle=-Math.PI/2,autoVisualDeadline=null,autoVisualPathActive=false;

  function autoVisualAimStep(current,target,dt,timeToTarget=null){
    // AUTO_VISUAL_AIM_FLOW: judgement remains frame-perfect, while only the rendered
    // arm follows the shortest arc. Static jumps use the time until the next hit so
    // they arrive exactly on beat; moving paths use a short frame-rate-independent lag.
    if(!Number.isFinite(target))return Number.isFinite(current)?norm(current):0;
    const normalizedTarget=norm(target);
    if(!Number.isFinite(current))return normalizedTarget;
    const safeDt=clamp(Number(dt)||0,0,.1);
    if(safeDt<=0)return norm(current);
    const hasDeadline=timeToTarget!==null&&timeToTarget!==undefined&&Number.isFinite(Number(timeToTarget));
    if(hasDeadline){
      const remaining=Number(timeToTarget);
      if(remaining<=safeDt)return normalizedTarget;
      return norm(current+norm(normalizedTarget-current)*clamp(safeDt/remaining,0,1));
    }
    const error=Math.abs(norm(normalizedTarget-current));
    const tau=lerp(.07,.022,clamp(error/Math.PI,0,1));
    return norm(current+norm(normalizedTarget-current)*(1-Math.exp(-safeDt/Math.max(tau,.001))));
  }

  function setAutoAimAngle(angle,velocity=0){
    if(!Number.isFinite(angle))return;
    const a=norm(angle);
    prevArmAngle=armAngle;
    // Keep the deterministic verifier target immediate. visualArmAngle is advanced
    // separately in updateArm so AUTO no longer teleports between note angles.
    targetAngle=armAngle=judgementAimAngle=rawInputAngle=rawTargetAngle=stabilizedTargetAngle=lastValidTargetAngle=a;
    rawArmVel=armVel=rawAngularVelocity=Number.isFinite(velocity)?velocity:0;
    aimInput.rawAngle=a; aimInput.unwrappedAngle=a; aimInput.previousSampleAngle=a;
    aimInput.sampleAngularVelocity=rawAngularVelocity; aimInput.lastSampleDelta=0;
  }`,
'separate AUTO visual aim from judgement','AUTO_VISUAL_AIM_FLOW');

game=replaceOrVerify(game,
`    if(activePath){
      const a=slideAngle(activePath,t);
      setAutoAimAngle(a,slideDelta(activePath)/Math.max(activePath.duration,.001));`,
`    if(activePath){
      const a=slideAngle(activePath,t);
      autoVisualTargetAngle=norm(a); autoVisualDeadline=null; autoVisualPathActive=true;
      setAutoAimAngle(a,slideDelta(activePath)/Math.max(activePath.duration,.001));`,
'assign the active AUTO path visual target','autoVisualPathActive=true');

game=replaceOrVerify(game,
`    }else{
      const n=nextAimNote(t);
      if(n)setAutoAimAngle(n.angle,0);
    }`,
`    }else{
      const n=nextAimNote(t);
      autoVisualPathActive=false;
      if(n){ autoVisualTargetAngle=norm(n.angle); autoVisualDeadline=n.hitTime; setAutoAimAngle(n.angle,0); }
      else autoVisualDeadline=null;
    }`,
'assign the static AUTO visual deadline','autoVisualDeadline=n.hitTime');

game=replaceOrVerify(game,
`  function resetAimInput(angle=-Math.PI/2){
    Object.assign(aimInput,{rawAngle:angle,unwrappedAngle:angle,previousSampleAngle:null,sampleAngularVelocity:0,accumulatedCWTravel:0,accumulatedCCWTravel:0,pointerRadius:0,sampleCount:0,lastSampleTimestamp:0,sampleInterval:0,centerDeadzoneActive:false,rebasePending:true,pendingSamples:0,lastSampleDelta:0});
    rawInputAngle=judgementAimAngle=visualArmAngle=rawTargetAngle=stabilizedTargetAngle=lastValidTargetAngle=angle; rawAngularVelocity=0; centerDeadzoneActive=false; magnetTarget=null; magnetAngleError=0;
  }`,
`  function resetAimInput(angle=-Math.PI/2){
    Object.assign(aimInput,{rawAngle:angle,unwrappedAngle:angle,previousSampleAngle:null,sampleAngularVelocity:0,accumulatedCWTravel:0,accumulatedCCWTravel:0,pointerRadius:0,sampleCount:0,lastSampleTimestamp:0,sampleInterval:0,centerDeadzoneActive:false,rebasePending:true,pendingSamples:0,lastSampleDelta:0});
    rawInputAngle=judgementAimAngle=visualArmAngle=rawTargetAngle=stabilizedTargetAngle=lastValidTargetAngle=angle; rawAngularVelocity=0; centerDeadzoneActive=false; magnetTarget=null; magnetAngleError=0;
    autoVisualTargetAngle=angle; autoVisualDeadline=null; autoVisualPathActive=false;
  }`,
'reset AUTO visual flow state','autoVisualTargetAngle=angle');

game=replaceOrVerify(game,
`  function updateArm(dt){
    const tNow=now(); prevArmAngle=armAngle;
    if(isAutoActive() && chart.some(n=>!n.done&&!n.missed&&(n.type.startsWith("slide")||n.type.startsWith("trace"))&&tNow>=n.hitTime&&tNow<=n.hitTime+n.duration)) return;
    if(isAutoActive()||keyA||keyD){
      if(keyA||keyD){
        const delta=(keyD-keyA)*9.5*dt;
        targetAngle+=delta; rawInputAngle=rawTargetAngle=norm(targetAngle);
        aimInput.unwrappedAngle+=delta; aimInput.lastSampleDelta=delta; aimInput.sampleInterval=dt; aimInput.sampleAngularVelocity=delta/Math.max(dt,.001);
        if(delta>0) aimInput.accumulatedCWTravel+=delta; else aimInput.accumulatedCCWTravel-=delta;
        aimInput.sampleCount++; aimInput.lastSampleTimestamp=performance.now(); magnetTarget=null;
      }
      const diff=norm(targetAngle-armAngle); armAngle=norm(armAngle+diff*clamp(1-Math.pow(.0001,dt),0,1));
      judgementAimAngle=rawInputAngle=rawTargetAngle=armAngle; visualArmAngle=armAngle; rawArmVel=armVel=aimInput.sampleAngularVelocity||norm(armAngle-prevArmAngle)/Math.max(dt,.001); return;
    }`,
`  function updateArm(dt){
    const tNow=now(); prevArmAngle=armAngle;
    if(isAutoActive()){
      // Deterministic AUTO judgement remains immediate; only drawArm's visual angle flows.
      armAngle=judgementAimAngle;
      const timeToTarget=autoVisualPathActive?AUTO_VISUAL_AIM_PATH_RESPONSE:(Number.isFinite(autoVisualDeadline)?autoVisualDeadline-tNow:null);
      visualArmAngle=autoVisualAimStep(visualArmAngle,autoVisualTargetAngle,dt,timeToTarget);
      rawArmVel=rawAngularVelocity=aimInput.sampleAngularVelocity;
      armVel=norm(armAngle-prevArmAngle)/Math.max(dt,.001);
      return;
    }
    if(keyA||keyD){
      const delta=(keyD-keyA)*9.5*dt;
      targetAngle+=delta; rawInputAngle=rawTargetAngle=norm(targetAngle);
      aimInput.unwrappedAngle+=delta; aimInput.lastSampleDelta=delta; aimInput.sampleInterval=dt; aimInput.sampleAngularVelocity=delta/Math.max(dt,.001);
      if(delta>0) aimInput.accumulatedCWTravel+=delta; else aimInput.accumulatedCCWTravel-=delta;
      aimInput.sampleCount++; aimInput.lastSampleTimestamp=performance.now(); magnetTarget=null;
      const diff=norm(targetAngle-armAngle); armAngle=norm(armAngle+diff*clamp(1-Math.pow(.0001,dt),0,1));
      judgementAimAngle=rawInputAngle=rawTargetAngle=armAngle; visualArmAngle=armAngle; rawArmVel=armVel=aimInput.sampleAngularVelocity||norm(armAngle-prevArmAngle)/Math.max(dt,.001); return;
    }`,
'smooth AUTO visual arm movement','Deterministic AUTO judgement remains immediate');
write('src/game.js',game);

let smoke=read('tests/smoke.test.js');
smoke=replaceOrVerify(smoke,
'SLIDE_JUDGEMENT_PROFILE, PULSE_SYNC_EPSILON, COLORS, isPulseSynchronizedCut, noteColor, nextAimNotesAfterPulse, nextAimNoteAfterPulse, PULSE_AIM_GUIDE_LINGER, PULSE_AIM_GUIDE_LOOKAHEAD, updateTraceEndpointCapture, traceEndpointJudgement, traceProfile,',
'SLIDE_JUDGEMENT_PROFILE, PULSE_SYNC_EPSILON, COLORS, isPulseSynchronizedCut, noteColor, nextAimNotesAfterPulse, nextAimNoteAfterPulse, PULSE_AIM_GUIDE_LINGER, PULSE_AIM_GUIDE_LOOKAHEAD, AUTO_VISUAL_AIM_PATH_RESPONSE, autoVisualAimStep, updateTraceEndpointCapture, traceEndpointJudgement, traceProfile,',
'export AUTO visual aim helpers','AUTO_VISUAL_AIM_PATH_RESPONSE, autoVisualAimStep');

const autoTest=`test("AUTO visual aim flows between targets without changing verifier timing", () => {
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
  const src=fs.readFileSync("src/game.js","utf8");
  const setter=src.match(/  function setAutoAimAngle\(angle,velocity=0\)\{[\s\S]*?\n  \}/)?.[0]||"";
  assert.ok(setter,"AUTO aim setter missing");
  assert.doesNotMatch(setter,/judgementAimAngle=visualArmAngle|visualArmAngle=rawInputAngle/);
  assert.match(src,/AUTO_VISUAL_AIM_FLOW/);
  assert.match(src,/autoVisualDeadline=n\.hitTime/);
  assert.match(src,/autoVisualPathActive\?AUTO_VISUAL_AIM_PATH_RESPONSE/);
  assert.match(src,/return !isAutoActive\(\) && judgementMarkerVisibleFor/);
});\n\n`;
smoke=replaceOrVerify(smoke,
`test("PULSE-synchronized CUT uses the shared orange readability language", () => {`,
autoTest+`test("PULSE-synchronized CUT uses the shared orange readability language", () => {`,
'add AUTO visual flow smoke coverage','AUTO visual aim flows between targets');
write('tests/smoke.test.js',smoke);
console.log('Applied AUTO visual aim flow transform.');
