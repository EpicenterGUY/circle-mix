'use strict';

const fs = require('node:fs');

function replaceOrThrow(source, search, replacement, label){
  const next = source.replace(search, replacement);
  if(next === source) throw new Error(`Unable to ${label}.`);
  return next;
}

const gamePath = 'src/game.js';
let game = fs.readFileSync(gamePath, 'utf8').replace(/\r\n/g, '\n');

if(!game.includes('PULSE_AIM_GUIDE_LINGER')){
  const marker = `  function nextAimNote(t){\n    let best=null,bd=999;\n    for(const n of chart){\n      if(n.done||n.missed||n.type==="pulse")continue;\n      if(activeHold(n,t))return n;\n      const d=n.hitTime-t;\n      if(d>-0.22&&d<bd){best=n;bd=d;}\n    }\n    return best;\n  }\n`;
  const addition = `${marker}\n  const PULSE_AIM_GUIDE_LINGER=.22;\n  const PULSE_AIM_GUIDE_LOOKAHEAD=APPROACH+.45;\n\n  function nextAimNoteAfterPulse(pulse,notes=chart){\n    if(!pulse)return null;\n    let best=null;\n    for(const n of notes){\n      if(!n||n===pulse||n.done||n.missed||n.type==="pulse")continue;\n      if(!Number.isFinite(n.hitTime)||n.hitTime<pulse.hitTime-PULSE_SYNC_EPSILON)continue;\n      if(!best||n.hitTime<best.hitTime)best=n;\n    }\n    return best;\n  }\n\n  function pulseAimGuideState(t){\n    if(tutorialMode)return null;\n    let pulse=null,bestDistance=Infinity;\n    for(const n of chart){\n      if(!n||n.type!=="pulse"||n.missed)continue;\n      if(t<n.spawnTime||t>n.hitTime+PULSE_AIM_GUIDE_LINGER)continue;\n      const distance=Math.abs(n.hitTime-t);\n      if(distance<bestDistance){pulse=n;bestDistance=distance;}\n    }\n    if(!pulse)return null;\n    const target=nextAimNoteAfterPulse(pulse);\n    if(!target||!Number.isFinite(target.angle))return null;\n    const timeToTarget=target.hitTime-t;\n    if(timeToTarget>PULSE_AIM_GUIDE_LOOKAHEAD||timeToTarget<-.05)return null;\n    const pulseApproach=pulseInput.approachProgress(t,pulse.hitTime,APPROACH);\n    const proximity=clamp(1-timeToTarget/Math.max(APPROACH,.001),0,1);\n    const linger=t<=pulse.hitTime?1:clamp(1-(t-pulse.hitTime)/PULSE_AIM_GUIDE_LINGER,0,1);\n    const visibility=clamp((.16+.68*Math.max(pulseApproach*.72,proximity))*linger,0,1);\n    return {pulse,target,angle:target.angle,proximity,visibility};\n  }\n`;
  game = replaceOrThrow(game, marker, addition, 'insert PULSE next-aim selection');
}

if(!game.includes('function drawPulseAimGuide(t)')){
  const marker = '  function drawPulse(n,t){';
  const addition = `  function drawPulseAimGuide(t){\n    const guide=pulseAimGuideState(t);\n    if(!guide||guide.visibility<=.01)return;\n    const compact=isMobileViewport();\n    const innerR=baseR*(compact?.18:.20);\n    const length=lerp(compact?18:20,compact?28:32,guide.proximity);\n    const halfWidth=lerp(compact?6:7,compact?10:11,guide.proximity);\n    const tip=innerR+length;\n    const neck=innerR+length*.45;\n    ctx.save();ctx.translate(cx,cy);ctx.rotate(guide.angle);\n    ctx.globalAlpha=guide.visibility;\n    ctx.shadowColor=COLORS.pulse;\n    ctx.shadowBlur=(5+9*guide.proximity)*visualScale("effect");\n    ctx.fillStyle="rgba(255,255,255,.96)";\n    ctx.strokeStyle=COLORS.pulse;\n    ctx.lineWidth=2;\n    ctx.beginPath();\n    ctx.moveTo(tip,0);\n    ctx.lineTo(neck,-halfWidth);\n    ctx.lineTo(neck,-halfWidth*.38);\n    ctx.lineTo(innerR,-halfWidth*.38);\n    ctx.lineTo(innerR,halfWidth*.38);\n    ctx.lineTo(neck,halfWidth*.38);\n    ctx.lineTo(neck,halfWidth);\n    ctx.closePath();ctx.fill();ctx.stroke();\n    ctx.restore();\n  }\n\n${marker}`;
  game = replaceOrThrow(game, marker, addition, 'insert PULSE next-aim renderer');
}

if(!game.includes('    drawArm();\n    drawPulseAimGuide(t);\n    drawEffects(dt);')){
  game = replaceOrThrow(
    game,
    '    drawArm();\n    drawEffects(dt);',
    '    drawArm();\n    drawPulseAimGuide(t);\n    drawEffects(dt);',
    'render PULSE next-aim guide above the arm'
  );
}

fs.writeFileSync(gamePath, game);

const smokePath = 'tests/smoke.test.js';
let smoke = fs.readFileSync(smokePath, 'utf8').replace(/\r\n/g, '\n');

if(!smoke.includes('nextAimNoteAfterPulse, PULSE_AIM_GUIDE_LINGER')){
  smoke = replaceOrThrow(
    smoke,
    ' SLIDE_JUDGEMENT_PROFILE, PULSE_SYNC_EPSILON, COLORS, isPulseSynchronizedCut, noteColor, updateTraceEndpointCapture, traceEndpointJudgement, traceProfile,',
    ' SLIDE_JUDGEMENT_PROFILE, PULSE_SYNC_EPSILON, COLORS, isPulseSynchronizedCut, noteColor, nextAimNoteAfterPulse, PULSE_AIM_GUIDE_LINGER, PULSE_AIM_GUIDE_LOOKAHEAD, updateTraceEndpointCapture, traceEndpointJudgement, traceProfile,',
    'export PULSE aim-guide smoke helpers'
  );
}

if(!smoke.includes('PULSE aim guide skips PULSE chains')){
  const marker = 'test("TRACE endpoint capture remains latched after first valid arrival", () => {';
  const testBlock = `test("PULSE aim guide skips PULSE chains and points to the next aim note", () => {\n  const first={type:"pulse",hitTime:1,spawnTime:0};\n  const second={type:"pulse",hitTime:1.08,spawnTime:0};\n  const simultaneousCut={type:"cut",hitTime:1,angle:.5};\n  const laterTrace={type:"traceCW",hitTime:1.25,angle:1.7};\n  const oldCut={type:"cut",hitTime:.75,angle:2.4};\n  assert.equal(api.nextAimNoteAfterPulse(first,[oldCut,first,second,laterTrace,simultaneousCut]),simultaneousCut);\n  simultaneousCut.done=true;\n  assert.equal(api.nextAimNoteAfterPulse(first,[oldCut,first,second,laterTrace,simultaneousCut]),laterTrace);\n  assert.equal(api.nextAimNoteAfterPulse(first,[first,second]),null);\n  assert.equal(api.PULSE_AIM_GUIDE_LINGER,.22);\n  assert.ok(api.PULSE_AIM_GUIDE_LOOKAHEAD>0);\n  const src=fs.readFileSync("src/game.js","utf8");\n  assert.match(src,/function pulseAimGuideState\\(t\\)/);\n  assert.match(src,/if\\(tutorialMode\\)return null;/);\n  assert.match(src,/n\\.type==="pulse"/);\n  assert.match(src,/n\\.hitTime<pulse\\.hitTime-PULSE_SYNC_EPSILON/);\n  const renderer=src.match(/  function drawPulseAimGuide\\(t\\)\\{[\\s\\S]*?\\n  \\}/)?.[0]||"";\n  assert.ok(renderer,"PULSE next-aim renderer missing");\n  assert.match(renderer,/const innerR=baseR\\*\\(compact\\?\\.18:\\.20\\)/);\n  assert.doesNotMatch(renderer,/drawDirectedArcSegments|hitR/);\n  assert.match(src,/drawArm\\(\\);\\s*drawPulseAimGuide\\(t\\);\\s*drawEffects\\(dt\\);/);\n});\n\n${marker}`;
  smoke = replaceOrThrow(smoke, marker, testBlock, 'add PULSE aim-guide smoke coverage');
}

fs.writeFileSync(smokePath, smoke);
console.log('Applied PULSE next-aim guide and regression coverage.');
