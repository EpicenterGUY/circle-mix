const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
function test(name, fn){
try{ fn(); console.log(`PASS ${name}`); }
catch(error){ console.error(`FAIL ${name}`); throw error; }
}
function makeElement(id){
const classes = new Set();
return {
id, hidden:false, disabled:false, value:"", textContent:"", innerHTML:"", dataset:{}, style:{}, children:[],
classList:{ add:c=>classes.add(c), remove:c=>classes.delete(c), toggle:(c,on)=>on?classes.add(c):classes.delete(c), contains:c=>classes.has(c) },
getContext:()=>new Proxy({}, {get:()=>()=>{}}),
addEventListener(){}, removeEventListener(){}, appendChild(child){ this.children.push(child); return child; },
replaceChildren(...kids){ this.children = kids; }, querySelectorAll(){ return []; }, querySelector(){ return null; },
setAttribute(){}, removeAttribute(){}, focus(){}, blur(){}, getBoundingClientRect(){ return {left:0,top:0,width:800,height:600}; }
};
}
function loadGameExports(){
const src = fs.readFileSync("src/game.js", "utf8");
const exportPatch = `\nwindow.__smoke = {\n generateAnimaNormalChart, generateAnimaTechChart, chartForDifficulty,\n difficultyViewForSong, getActiveDifficultyLabel, localChartEntries, tutorialSteps, buildTutorialStepRuntime,\n SLIDE_JUDGEMENT_PROFILE, PULSE_SYNC_EPSILON, COLORS, isPulseSynchronizedCut, noteColor, nextAimNotesAfterPulse, nextAimNoteAfterPulse, PULSE_AIM_GUIDE_LINGER, PULSE_AIM_GUIDE_LOOKAHEAD, AUTO_VISUAL_AIM_PATH_RESPONSE, autoVisualAimStep, AIM_VISUAL_SNAP_ERROR, aimStabilizerProfile, mouseVisualAimStep, effectivePcAimMode, updateTraceEndpointCapture, traceEndpointJudgement, traceProfile,\n formatStarValue, formatDifficulty, renderSongSelect, resolveSelectedSong,\n renderedDifficultyHtml:()=>songDifficulty?.innerHTML||""\n};\n`;
const patched = src.replace(/\r?\n\s*updateModeButtons\(\);\r?\n\s*updateButtons\(\);\r?\n\}\)\(\);\s*$/, `${exportPatch}\n updateModeButtons();\n updateButtons();\n})();`);
const elements = new Map();
const document = {
documentElement: makeElement("html"), body: makeElement("body"), fullscreenElement:null,
getElementById(id){ if(!elements.has(id)) elements.set(id, makeElement(id)); return elements.get(id); },
createElement(tag){ return makeElement(tag); }, addEventListener(){}, removeEventListener(){}, querySelectorAll(){ return []; }, querySelector(){ return null; }
};
const routing=loadRoutingBundle();
const anima={id:"anima",source:"builtin",title:"ANiMA",artist:"xi",bpm:184.6,offset:-0.04,difficulties:{normal:{label:"NORMAL"},tech:{label:"TECH"}}};
const routingSong={...routing.song,difficulties:routing.song.difficulties};
const builtins=[anima,routingSong];
const window = { document, location:{search:"", href:"http://localhost/index.html"}, CircleMixRoutingBundle:routing, CircleMixSongRegistry:{ all:()=>builtins, localAll:()=>[], refreshLocal:async()=>[], refreshBuiltinAudio:async()=>builtins, get:id=>builtins.find(song=>song.id===id)||anima, hasDifficulty:(s,d)=>!!s?.difficulties?.[d] }, CircleMixChartDifficulty:require("../src/chart-difficulty.js"), CircleMixChartTools:{calculateStars:()=>1}, CircleMixVersion:{version:"0.0.0"}, CircleMixChangelog:[], history:{replaceState(){}}, addEventListener(){}, removeEventListener(){}, PointerEvent:function PointerEvent(){} };
const sandbox = { window, document, console, URLSearchParams, URL, setTimeout, clearTimeout, setInterval, clearInterval,
localStorage:{getItem:()=>null,setItem(){},removeItem(){}}, performance:{now:()=>0}, requestAnimationFrame:()=>0, cancelAnimationFrame(){},
screen:{orientation:{unlock(){}}}, alert(){}, confirm:()=>false, prompt:()=>null, AudioContext:function(){}, webkitAudioContext:function(){} };
vm.createContext(sandbox);
vm.runInContext(patched, sandbox, {filename:"src/game.js"});
return sandbox.window.__smoke;
}
function normDeg(a){ return ((a % 360) + 360) % 360; }
function shortestDeg(a,b){ return Math.abs(normDeg(a-b+180)-180); }

function loadGhostRuleBundle(){
const context = {window:{}}; vm.createContext(context);
vm.runInContext(fs.readFileSync("src/charts/ghost-rule.js", "utf8"), context, {filename:"src/charts/ghost-rule.js"});
return context.window.CircleMixGhostRuleBundle;
}
function loadRoutingBundle(){
const context = {window:{}}; vm.createContext(context);
vm.runInContext(fs.readFileSync("src/charts/routing.js", "utf8"), context, {filename:"src/charts/routing.js"});
return context.window.CircleMixRoutingBundle;
}
function traceEndAngle(note){
if(note.signedSweepAngle !== undefined) return normDeg(Number(note.angle) + Number(note.signedSweepAngle));
if(note.endAngle !== undefined) return normDeg(Number(note.endAngle));
return normDeg(Number(note.angle));
}
function signedDelta(from, to){
let delta = normDeg(Number(to)) - normDeg(Number(from));
if(delta > 180) delta -= 360;
if(delta <= -180) delta += 360;
return delta;
}
function pointerDirection(note, previousEndAngle){
if(!note) return 0;
if(note.signedSweepAngle !== undefined && Number(note.signedSweepAngle) !== 0) return Math.sign(Number(note.signedSweepAngle));
if(/CCW/.test(note.type) || String(note.direction).toUpperCase() === "CCW") return -1;
if(/CW/.test(note.type) || String(note.direction).toUpperCase() === "CW") return 1;
if(previousEndAngle !== undefined && note.angle !== undefined){
const delta = signedDelta(previousEndAngle, note.angle);
if(Math.abs(delta) > 1) return Math.sign(delta);
}
return 0;
}
function auditTraceTransitions(chart, bpm){
const notes = chart.notes.map((note, index)=>({...note, index})).sort((a,b)=>a.beat-b.beat);
const issues = [];
let previous = null;
let beforePrevious = null;
for(const note of notes){
if(String(note.type).startsWith("trace") && previous){
const previousEndAngle = traceEndAngle(previous);
const gapSeconds = (Number(note.beat) - (Number(previous.beat) + Number(previous.durationBeat || 0))) * 60 / bpm;
const startJumpDeg = shortestDeg(previousEndAngle, Number(note.angle));
const previousDirection = pointerDirection(previous, beforePrevious ? traceEndAngle(beforePrevious) : undefined);
const traceDirection = pointerDirection(note, previousEndAngle);
const reversed = previousDirection && traceDirection && previousDirection !== traceDirection;
const pushIssue = issueType => issues.push({
difficulty: chart.difficulty,
previousNoteIndex: previous.index,
traceNoteIndex: note.index,
previousBeat: previous.beat,
traceBeat: note.beat,
gapSeconds,
previousEndAngle,
traceStartAngle: note.angle,
startJumpDeg,
previousDirection,
traceDirection,
issueType
});
if(gapSeconds < 0.50 && startJumpDeg > 90) pushIssue("TRACE_START_JUMP");
if(gapSeconds < 0.30 && startJumpDeg > 120) pushIssue("SEVERE_TRACE_START_JUMP");
if(reversed && gapSeconds < 0.20) pushIssue("ABRUPT_TRACE_REVERSAL");
if(startJumpDeg > 90 && reversed && gapSeconds < 0.35) pushIssue("BLIND_REVERSE_JUMP");
}
beforePrevious = previous;
previous = note;
}
return issues;
}


const api = loadGameExports();
test("version.js and changelog latest version match", () => {
const context = {window:{}}; vm.createContext(context);
vm.runInContext(fs.readFileSync("src/version.js", "utf8"), context);
vm.runInContext(fs.readFileSync("src/changelog.js", "utf8"), context);
assert.equal(context.window.CircleMixVersion.version, context.window.CircleMixChangelog[0].version);
});
test("ANiMA NORMAL/TECH charts generate valid runtime notes", () => {
for(const [name, chart] of [["NORMAL", api.chartForDifficulty("normal")], ["TECH", api.chartForDifficulty("tech")]]){
assert.ok(chart.length > 0, `${name} chart is empty`);
let prev = -Infinity;
for(const n of chart){
assert.ok(Number.isFinite(n.hitTime), `${name} hitTime`);
assert.ok(Number.isFinite(n.angle), `${name} angle`);
if(["fx","slideCW","slideCCW","trace","traceCW","traceCCW","scratchCW","scratchCCW"].includes(n.type)) assert.ok(n.duration > 0, `${name} duration`);
assert.ok(n.hitTime >= prev, `${name} sorted`); prev = n.hitTime;
if((n.type === "slideCW" || n.type === "slideCCW") && n.duration <= 1.5 * (60/184.6)) assert.ok(shortestDeg(n.angle*180/Math.PI, (n.endAngle ?? n.angle)*180/Math.PI) >= 1 || n.signedSweepAngle !== undefined, `${name} short zero-sweep slide`);
}
}
});
test("tutorial TRACE regression invariants", () => {
const steps = api.tutorialSteps;
assert.ok(Array.isArray(steps) && steps.length >= 17);
const findStepIndex = matcher => steps.findIndex(matcher);
const trace45Index = findStepIndex(step => step.kind === "trace" && /45°|45도/.test(step.name));
const trace90Index = findStepIndex(step => step.kind === "trace" && /90°|90도/.test(step.name));
const trace180Index = findStepIndex(step => step.kind === "trace" && /180°|180도/.test(step.name) && step.phase === "guided");
const traceSwingIndex = findStepIndex(step => step.kind === "traceSwing");
for(const [label,index] of [["45° TRACE",trace45Index],["90° TRACE",trace90Index],["180° TRACE",trace180Index],["TRACE → SWING",traceSwingIndex]]) assert.ok(index >= 0, `${label} tutorial step`);
const s45 = steps[trace45Index], n45 = api.buildTutorialStepRuntime(trace45Index).chart[0];
assert.match(s45.name, /45°|45도|TRACE/i); assert.equal(n45.type, "traceCW");
assert.notEqual(n45.lane, n45.endLane); assert.ok(shortestDeg(n45.angle*180/Math.PI, n45.endAngle*180/Math.PI) >= 40 && shortestDeg(n45.angle*180/Math.PI, n45.endAngle*180/Math.PI) <= 50);
assert.equal(n45.tutorialStaticTrace, undefined); assert.notEqual(n45.tutorialModeType, "staticTrace"); assert.notEqual(n45.signedSweepAngle, 0);
const n90 = api.buildTutorialStepRuntime(trace90Index).chart[0]; assert.ok(shortestDeg(n90.angle*180/Math.PI, n90.endAngle*180/Math.PI) >= 85 && shortestDeg(n90.angle*180/Math.PI, n90.endAngle*180/Math.PI) <= 95);
const n180 = api.buildTutorialStepRuntime(trace180Index).chart[0]; assert.ok(shortestDeg(n180.angle*180/Math.PI, n180.endAngle*180/Math.PI) >= 175 && shortestDeg(n180.angle*180/Math.PI, n180.endAngle*180/Math.PI) <= 185);
const traceSwing = api.buildTutorialStepRuntime(traceSwingIndex); assert.ok(traceSwing.chart.length && traceSwing.chart.every(n=>String(n.type).startsWith("trace"))); assert.equal(traceSwing.step.kind, "traceSwing");
});
test("SLIDE judgement profile keeps sustained tracking humanly achievable", () => {
  assert.equal(api.SLIDE_JUDGEMENT_PROFILE.angleExtra, .025);
  assert.equal(api.SLIDE_JUDGEMENT_PROFILE.greatHoldRatio, .52);
  assert.equal(api.SLIDE_JUDGEMENT_PROFILE.perfectHoldRatio, .84);
  const totalToleranceDeg = 13.5 + api.SLIDE_JUDGEMENT_PROFILE.angleExtra * 180;
  assert.equal(totalToleranceDeg, 18);
  const src = fs.readFileSync("src/game.js", "utf8");
  assert.ok(src.includes("aligned(a,SLIDE_JUDGEMENT_PROFILE.angleExtra)"));
  assert.ok(src.includes("ratio>=SLIDE_JUDGEMENT_PROFILE.greatHoldRatio"));
  assert.ok(src.includes("ratio>=SLIDE_JUDGEMENT_PROFILE.perfectHoldRatio"));
});

test("AUTO visual aim flows between targets without changing verifier timing", () => {
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
  const setterEnd=source.indexOf("
  function completeAutoNote",setterStart);
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
  assert.ok(source.includes('if(profile.mode==="OFF" || source==="touch"){
      stabilizedTargetAngle=angle; judgementAimAngle=armAngle=angle;'));
  assert.ok(source.includes('function effectivePcAimMode(){ return inputSettings.pcAimMode==="LOCKED" ? "LOCKED" : "ABSOLUTE"; }'));
  const autoModeLine=source.split("
").find(line=>line.includes('pcAimMode==="AUTO"'))||"";
  assert.ok(!autoModeLine.includes("LOCKED")&&!autoModeLine.includes("requestPointerLock"));
});

test("PULSE-synchronized CUT uses the shared orange readability language", () => {
  const cut={type:"cut",hitTime:1}, pulse={type:"pulse",hitTime:1}, nearPulse={type:"pulse",hitTime:1+api.PULSE_SYNC_EPSILON*.5};
  assert.equal(api.COLORS.pulse,"#ff9f43");
  assert.equal(api.isPulseSynchronizedCut(cut,[cut,pulse]),true);
  assert.equal(api.isPulseSynchronizedCut(cut,[cut,nearPulse]),true);
  assert.equal(api.isPulseSynchronizedCut(cut,[cut,{type:"pulse",hitTime:1+api.PULSE_SYNC_EPSILON*2}]),false);
  assert.equal(api.noteColor(cut,[cut,pulse]),api.COLORS.pulse);
  assert.equal(api.noteColor(cut,[cut]),api.COLORS.cut);
});

test("PULSE aim guide groups simultaneous aim chords without clutter", () => {
  const first={type:"pulse",hitTime:1,spawnTime:0};
  const second={type:"pulse",hitTime:1.08,spawnTime:0};
  const simultaneousCut={type:"cut",hitTime:1,angle:.5};
  const simultaneousSwing={type:"swingCW",hitTime:1,angle:2.4};
  const simultaneousHold={type:"fx",hitTime:1+api.PULSE_SYNC_EPSILON*.5,angle:1.1};
  const laterTrace={type:"traceCW",hitTime:1.25,angle:1.7};
  const oldCut={type:"cut",hitTime:.75,angle:2.4};
  const notes=[oldCut,first,second,laterTrace,simultaneousCut,simultaneousSwing,simultaneousHold];
  const chord=api.nextAimNotesAfterPulse(first,notes);
  assert.equal(chord.length,3);
  assert.ok(chord.includes(simultaneousCut));
  assert.ok(chord.includes(simultaneousSwing));
  assert.ok(chord.includes(simultaneousHold));
  assert.equal(api.nextAimNoteAfterPulse(first,notes),simultaneousCut);
  simultaneousCut.done=simultaneousSwing.done=simultaneousHold.done=true;
  assert.equal(api.nextAimNoteAfterPulse(first,notes),laterTrace);
  assert.equal(api.nextAimNotesAfterPulse(first,[first,second]).length,0);
  assert.equal(api.PULSE_AIM_GUIDE_LINGER,.22);
  assert.ok(api.PULSE_AIM_GUIDE_LOOKAHEAD>0);
  const src=fs.readFileSync("src/game.js","utf8");
  assert.match(src,/function nextAimNotesAfterPulse\(pulse,notes=chart\)/);
  assert.match(src,/function pulseAimGuideState\(t\)/);
  assert.match(src,/if\(tutorialMode\)return null;/);
  assert.match(src,/n\.type!=="pulse"/);
  assert.match(src,/n\.hitTime>=pulse\.hitTime-PULSE_SYNC_EPSILON/);
  const renderer=src.match(/  function drawPulseAimGuide\(t\)\{[\s\S]*?\n  \}/)?.[0]||"";
  assert.ok(renderer,"PULSE next-aim renderer missing");
  assert.match(renderer,/PULSE_AIM_MULTI_TARGET_GUIDE/);
  assert.match(renderer,/const innerR=baseR\*\(compact\?\.18:\.20\)/);
  assert.match(renderer,/arrowTargets\.length>=2/);
  assert.match(renderer,/targets\.length>arrowTargets\.length/);
  assert.doesNotMatch(renderer,/drawDirectedArcSegments|hitR/);
  assert.match(src,/drawArm\(\);\s*drawPulseAimGuide\(t\);\s*drawEffects\(dt\);/);
});

test("TRACE endpoint capture remains latched after first valid arrival", () => {
  const profile = {greatTravelRatio:.85, endpointGreatToleranceDeg:30, endpointPerfectToleranceDeg:15, endpointWindow:.25};
  const note = {requiredTravel:Math.PI*2,directedTravel:Math.PI*.4,motionTime:.2,minimumMotionTime:.12,endpointCaptured:false,endpointCapturedAt:null,bestEndpointError:Infinity,bestPerfectEndpointTimingError:Infinity};
  const rad = Math.PI / 180;
  assert.equal(api.updateTraceEndpointCapture(note, 0, 1, 2, profile), false, "a full-turn TRACE must not capture its shared start/end angle before enough travel");
  assert.equal(note.endpointCapturedAt, null);
  assert.equal(note.bestEndpointError, Infinity);
  note.directedTravel=Math.PI*2*.9;
  note.motionTime=.5;
  assert.equal(api.updateTraceEndpointCapture(note, 10 * rad, 1.6, 2, profile), true);
  assert.equal(note.endpointCapturedAt, 1.6);
  assert.ok(Math.abs(note.bestEndpointError - 10 * rad) < 1e-12);
  assert.equal(api.updateTraceEndpointCapture(note, 8 * rad, 1.95, 2, profile), true);
  assert.equal(note.endpointCapturedAt, 1.6, "the first eligible endpoint arrival stays latched");
  assert.ok(Math.abs(note.bestEndpointError - 8 * rad) < 1e-12);
  assert.ok(Math.abs(note.bestPerfectEndpointTimingError - .05) < 1e-12);
  assert.equal(api.updateTraceEndpointCapture(note, 80 * rad, 2.25, 2, profile), true);
  assert.equal(note.endpointCapturedAt, 1.6);
  assert.ok(Math.abs(note.bestEndpointError - 8 * rad) < 1e-12);
  const judgement = api.traceEndpointJudgement(note, 2, profile);
  assert.equal(judgement.great, true);
  assert.equal(judgement.perfect, true);
  assert.equal(judgement.onTime, true);
  const missed = api.traceEndpointJudgement({endpointCaptured:false,bestEndpointError:Infinity,bestPerfectEndpointTimingError:Infinity}, 2, profile);
  assert.equal(missed.great, false);
  assert.equal(missed.perfect, false);
  assert.equal(missed.onTime, false);
  const src = fs.readFileSync("src/game.js", "utf8");
  assert.ok(!src.includes("n.endpointCaptured=n.endpointError<="));
  assert.ok(src.includes("const greatEndpoint=endpointJudgement.great"));
});

test("input mapping and pointer fallback policies stay static", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /e\.code==="KeyA"\)keyA=true/); assert.match(src, /e\.code==="KeyD"\)keyD=true/);
assert.match(src, /e\.code==="F3"[^\n]*toggleDebugOverlay/); assert.doesNotMatch(src, /e\.code==="KeyD"[^\n]*toggleDebugOverlay/);
assert.match(src, /if\(window\.PointerEvent\)/); assert.match(src, /addEventListener\("pointermove"/); assert.match(src, /else\{[\s\S]*addEventListener\("mousemove"[\s\S]*addEventListener\("touchmove"/);
});
test("START data path builds song select and difficulty data", () => {
const builtin = {id:"anima",source:"builtin",title:"ANiMA <>& \"",artist:"xi & co",difficulties:{normal:{label:"NORMAL"},tech:{label:"TECH"}}};
const local = {id:"local-1",source:"local",title:"LOCAL ♫ <script>",artist:"Me & You",difficulties:{custom:{}},charts:{custom:{notes:[{type:"cut",beat:0,angle:0}]}}};
assert.doesNotThrow(()=>api.difficultyViewForSong(builtin,"normal")); assert.doesNotThrow(()=>api.difficultyViewForSong(builtin,"tech"));
assert.equal(api.getActiveDifficultyLabel(local,"custom"), "CUSTOM");
assert.doesNotThrow(()=>api.difficultyViewForSong(local,"custom"));
assert.doesNotThrow(()=>api.renderSongSelect());
});



test("Ghost Rule TRACE transition audit rejects severe and blind start jumps", () => {
const bundle = loadGhostRuleBundle();
const expectedTraceCounts = {hard: 53, expert: 35, master: 47};
for(const difficulty of ["hard", "expert", "master"]){
const chart = bundle.charts[difficulty];
assert.equal(chart.notes.filter(note=>String(note.type).startsWith("trace")).length, expectedTraceCounts[difficulty], `${difficulty} trace count`);
const issues = auditTraceTransitions(chart, chart.bpm || bundle.song.bpm);
assert.equal(issues.filter(issue=>issue.issueType === "BLIND_REVERSE_JUMP").length, 0, `${difficulty} blind reverse jump`);
if(difficulty !== "master") assert.equal(issues.filter(issue=>issue.issueType === "SEVERE_TRACE_START_JUMP").length, 0, `${difficulty} severe trace jump`);
if(difficulty === "master") assert.equal(issues.filter(issue=>issue.issueType === "SEVERE_TRACE_START_JUMP").length, 0, "master severe trace jump");
}
});

test("Ghost Rule chart JSON mirrors the runtime bundle notes", () => {
const bundle = loadGhostRuleBundle();
const mirror = JSON.parse(fs.readFileSync("data/ghost-rule-charts.json", "utf8"));
for(const difficulty of ["hard", "expert", "master"]){
assert.equal(JSON.stringify(mirror.charts[difficulty].notes), JSON.stringify(bundle.charts[difficulty].notes), `${difficulty} notes mirror`);
}
});

test("Routing bundle exposes seven valid, strictly sorted adapted charts", () => {
const bundle=loadRoutingBundle();
const expected={beginner:119,normal:195,advanced:241,hyper:334,another:520,"lasses-extra":518,reverb:553};
assert.deepEqual(Object.keys(bundle.charts),Object.keys(expected));
assert.equal(bundle.song.audio,null); assert.equal(bundle.song.audioRequired,true);
for(const [difficulty,count] of Object.entries(expected)){
const chart=bundle.charts[difficulty];
assert.equal(chart.notes.length,count,`${difficulty} note count`);
let previousBeat=-Infinity;
for(const [index,note] of chart.notes.entries()){
assert.ok(Number.isFinite(note.beat)&&note.beat>=0,`${difficulty} #${index} beat`);
assert.ok(note.beat>previousBeat,`${difficulty} #${index} strictly sorted and unique`);
assert.ok(Number.isFinite(note.angle)&&note.angle>=0&&note.angle<360,`${difficulty} #${index} angle`);
if(note.durationBeat!==undefined) assert.ok(Number.isFinite(note.durationBeat)&&note.durationBeat>0,`${difficulty} #${index} duration`);
if(note.endAngle!==undefined) assert.ok(Number.isFinite(note.endAngle)&&note.endAngle>=0&&note.endAngle<360,`${difficulty} #${index} end angle`);
if(String(note.type).startsWith("trace")){
assert.ok(Number.isFinite(note.signedSweepAngle)&&note.signedSweepAngle!==0,`${difficulty} #${index} required travel`);
const seconds=note.durationBeat*60/chart.bpm, required=Math.abs(note.signedSweepAngle);
const minimum=Math.min(Math.max(required/180*.30,.12),.40);
assert.ok(seconds+1e-6>=Math.min(minimum,Math.max(.06,seconds*.72)),`${difficulty} #${index} achievable TRACE duration`);
}
if(index+1<chart.notes.length&&note.durationBeat!==undefined) assert.ok(note.beat+note.durationBeat<=chart.notes[index+1].beat-.07,`${difficulty} #${index} no held-input overlap`);
previousBeat=note.beat;
}
assert.equal(auditTraceTransitions(chart,chart.bpm).filter(issue=>issue.issueType==="SEVERE_TRACE_START_JUMP"||issue.issueType==="BLIND_REVERSE_JUMP").length,0,`${difficulty} readable TRACE entries`);
}
assert.ok(bundle.charts.reverb.notes.some(note=>String(note.type).startsWith("scratch")),"Reverb keeps rare friction accents");
assert.ok(bundle.charts.reverb.notes.filter(note=>String(note.type).startsWith("trace")).length>=25,"Reverb keeps authored rotational travel");
assert.ok(bundle.charts.reverb.notes.filter(note=>String(note.type).startsWith("swing")).length>=80,"Reverb keeps technical direction changes");
});

test("Routing chart JSON mirrors runtime and original media stays excluded", () => {
const bundle=loadRoutingBundle();
const mirror=JSON.parse(fs.readFileSync("data/routing-charts.json","utf8"));
assert.equal(JSON.stringify(mirror),JSON.stringify(bundle));
assert.equal(fs.readFileSync("service-worker.js","utf8").includes("routing.mp3"),false);
assert.equal(fs.readFileSync("src/charts/routing.js","utf8").includes("audio.mp3"),false);
});

test("song selection renders exactly seven Routing difficulties and clears them on switch", () => {
api.resolveSelectedSong("routing","builtin"); api.renderSongSelect();
const routingHtml=api.renderedDifficultyHtml();
assert.equal((routingHtml.match(/data-difficulty=/g)||[]).length,7);
for(const id of ["beginner","normal","advanced","hyper","another","lasses-extra","reverb"]) assert.match(routingHtml,new RegExp(`data-difficulty="${id}"`));
api.resolveSelectedSong("anima","builtin"); api.renderSongSelect();
const animaHtml=api.renderedDifficultyHtml();
assert.equal((animaHtml.match(/data-difficulty=/g)||[]).length,2);
assert.doesNotMatch(animaHtml,/data-difficulty="reverb"/);
});

test("index and service worker use shared PWA release metadata", () => {
const index = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("service-worker.js", "utf8");
const version = fs.readFileSync("src/version.js", "utf8");
assert.match(index, /src\/charts\/routing\.js\?v=/);
assert.match(sw, /versioned\("\.\/src\/charts\/routing\.js"\)/);
const cacheRevision=/cacheRevision:\s*"([^"]+)"/.exec(version)?.[1];
assert.ok(cacheRevision,"release cache revision exists");
assert.match(sw, /encodeURIComponent\(CACHE_REVISION\)/);
assert.match(sw, /networkFirstStatic/);
assert.doesNotMatch(sw, /20260721-local-difficulty-930/);
assert.doesNotMatch(index, /20260718-pwa-offline-port-fix-1/);
assert.doesNotMatch(sw, /20260718-pwa-offline-port-fix-1/);
assert.doesNotMatch(index, /20260718-mobile-play-hotfix-1/);
assert.doesNotMatch(sw, /20260718-mobile-play-hotfix-1/);
});

test("service worker offline integrity contract", () => {
const sw = fs.readFileSync("service-worker.js", "utf8");
assert.match(sw, /const APP_SHELL_URLS = \[/);
assert.match(sw, /\.\/assets\/audio\/ghost-rule\.mp3/);
assert.match(sw, /\.\/assets\/jackets\/ghost-rule\.jpg/);
assert.match(sw, /versioned\("\.\/src\/charts\/ghost-rule\.js"\)/);
assert.match(sw, /requiredCount/);
assert.match(sw, /cachedCount/);
assert.match(sw, /missing/);
assert.match(sw, /OFFLINE_VERIFYING/);
assert.match(sw, /OFFLINE_FAILED[\s\S]*failures/);
assert.match(sw, /Content-Range/);
assert.match(sw, /status:206/);
assert.doesNotMatch(sw, /cacheExisting\([\s\S]*catch\(\)=>/);
});

test("PWA offline messages transfer MessagePort and clean status timeout", () => {
const pwa = fs.readFileSync("src/pwa.js", "utf8");
assert.match(pwa, /postToSW\(\{type:"OFFLINE_STATUS", version:VERSION, revision:CACHE_REVISION\}, \[channel\.port2\]\)/);
assert.match(pwa, /postToSW\(\{type:"DOWNLOAD_OFFLINE", version:VERSION, revision:CACHE_REVISION\}, \[channel\.port2\]\)/);
assert.match(pwa, /clearTimeout\(timeoutId\)/);
assert.match(pwa, /closePort\(channel\.port1\)/);
assert.match(pwa, /closePort\(channel\.port2\)|finishOfflineDownload\(session\)/);
});

test("service worker responds over event.ports[0] and emits offline lifecycle messages", () => {
const sw = fs.readFileSync("service-worker.js", "utf8");
assert.match(sw, /const port=event\.ports\?\.\[0\]/);
assert.doesNotMatch(sw, /data\.port/);
assert.match(sw, /safePost\(port,\{type:"OFFLINE_PROGRESS"|port\.postMessage\(\{type:"OFFLINE_PROGRESS"/);
assert.match(sw, /OFFLINE_VERIFYING/);
assert.match(sw, /safePost\(port,\{type:"OFFLINE_COMPLETE"/);
});

test("PWA offline postMessage failures and duplicate clicks are handled", () => {
const pwa = fs.readFileSync("src/pwa.js", "utf8");
assert.match(pwa, /catch\(error\)\{ console\.warn\("OFFLINE_STATUS postMessage failed"/);
assert.match(pwa, /catch\(error\)\{ console\.warn\("DOWNLOAD_OFFLINE postMessage failed"/);
assert.match(pwa, /setOfflineState\("FAILED"\)/);
assert.match(pwa, /if\(offlineDownloadSession\) return/);
assert.match(pwa, /offlineDownloadSession=session/);
assert.match(pwa, /finishOfflineDownload\(session\)/);
});

test("service worker records missing response ports as handled errors", () => {
const sw = fs.readFileSync("service-worker.js", "utf8");
assert.match(sw, /missingPortStatus/);
assert.match(sw, /missing-message-port/);
assert.match(sw, /DOWNLOAD_OFFLINE missing MessagePort/);
assert.match(sw, /OFFLINE_STATUS missing MessagePort/);
});


test("manifest references installable PNG and SVG icons", () => {
const manifest = JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8"));
assert.deepEqual(manifest.icons, [
{src:"./icons/circle-mix-icon-192.png", sizes:"192x192", type:"image/png", purpose:"any"},
{src:"./icons/circle-mix-icon-512.png", sizes:"512x512", type:"image/png", purpose:"any"},
{src:"./icons/circle-mix-icon-maskable-512.png", sizes:"512x512", type:"image/png", purpose:"maskable"},
{src:"./icons/circle-mix-icon.svg", sizes:"any", type:"image/svg+xml", purpose:"any"}
]);
for(const icon of manifest.icons) assert.ok(fs.existsSync(icon.src.replace(/^\.\//, "")), `${icon.src} exists`);
});

test("mobile title screen locks page and card scrolling with compact breakpoints", () => {
const css = fs.readFileSync("style.css", "utf8");
assert.match(css, /body\.safeTitle\{[^}]*height:var\(--app-height,100dvh\)[^}]*overflow:hidden[^}]*touch-action:none/);
assert.match(css, /body\.safeTitle #safeMenu\{[^}]*height:var\(--app-height,100dvh\)[^}]*overflow:hidden[^}]*overscroll-behavior:none[^}]*touch-action:none/);
assert.match(css, /body\.safeTitle \.safeMenuCard\{[^}]*max-height:calc\(var\(--app-height,100dvh\)[^}]*overflow:hidden/);
assert.match(css, /@media \(max-width:768px\) and \(max-height:700px\)/);
assert.match(css, /@media \(max-width:768px\) and \(max-height:560px\)/);
assert.doesNotMatch(css, /body\.safeTitle #safeMenu,body\.safeSettings #safeOverlay,body\.safeSongSelect \.songSelect\{align-items:flex-start;overflow:auto/);
});


test("web release metadata is shared without duplicate hard-coded versions", () => {
const version = fs.readFileSync("src/version.js", "utf8");
const pwa = fs.readFileSync("src/pwa.js", "utf8");
const sw = fs.readFileSync("service-worker.js", "utf8");
const changelog = fs.readFileSync("src/changelog.js", "utf8");
assert.match(version, /version:\s*"0\.9\.31"/);
assert.match(version, /cacheRevision:/);
assert.match(pwa, /const RELEASE=window\.CircleMixVersion/);
assert.match(sw, /^importScripts\("\.\/src\/version\.js"\);/);
assert.doesNotMatch(pwa, /const VERSION="0\.9\.31"/);
assert.doesNotMatch(sw, /const VERSION = "0\.9\.31"/);
assert.match(changelog, /version:\s*"0\.9\.31"/);
});

test("service worker derives app shell cache-bust URLs from cache revision", () => {
const index = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("service-worker.js", "utf8");
const indexUrls = [...index.matchAll(/(?:href|src)="(\.\/(?:style\.css|src\/[^\"]+\.js)\?v=[^"]+)"/g)].map(m=>m[1]);
assert.ok(indexUrls.length > 5);
assert.match(sw, /const versioned = path =>/);
assert.match(sw, /encodeURIComponent\(CACHE_REVISION\)/);
for(const asset of ["./style.css","./src/version.js","./src/charts/routing.js","./src/game.js","./src/pwa.js"]) assert.ok(sw.includes(`versioned("${asset}")`), asset);
});

test("old mobile PWA cache-bust token is fully removed", () => {
for(const file of ["index.html", "service-worker.js", "src/version.js", "src/pwa.js", "src/changelog.js"]){
const text = fs.readFileSync(file, "utf8");
assert.doesNotMatch(text, /20260718-pwa-offline-port-fix-1/, file);
}
});

test("update log is available to regular users", () => {
const game = fs.readFileSync("src/game.js", "utf8");
const openBody = game.match(/function openUpdateLog\(options=\{\}\)\{([\s\S]*?)\n  \}/)[1];
assert.doesNotMatch(openBody, /circleMixDevMode\) return/);
assert.match(game, /if\(updateBtn\)\{ updateBtn\.hidden=false; safeBind\(updateBtn,\(\)=>openUpdateLog/);
const index = fs.readFileSync("index.html", "utf8");
assert.doesNotMatch(index, /id="safeUpdateLogBtn"[^>]*hidden/);
});

test("update log buttons are not dev-mode-only except DEV MODE OFF", () => {
const game = fs.readFileSync("src/game.js", "utf8");
assert.match(game, /const devOffBtn=document\.getElementById\("updateLogDevOff"\);\r?\n    if\(devOffBtn\) devOffBtn\.hidden=!circleMixDevMode;/);
assert.doesNotMatch(game, /safeUpdateLogBtn[\s\S]{0,140}hidden=!circleMixDevMode/);
assert.match(fs.readFileSync("index.html", "utf8"), /id="safeSetUpdateLog"[\s\S]*UPDATE LOG[\s\S]*id="pauseSetUpdateLog"/);
});


test("turning off dev mode immediately hides only DEV MODE OFF", () => {
const game = fs.readFileSync("src/game.js", "utf8");
const disableBody = game.match(/function disableCircleMixDevMode\(\)\{([\s\S]*?)\n  \}/)[1];
assert.match(disableBody, /circleMixDevMode=false/);
assert.match(disableBody, /const btn=document\.getElementById\("safeUpdateLogBtn"\);\r?\n    if\(btn\) btn\.hidden=false;/);
assert.match(disableBody, /const devOffBtn=document\.getElementById\("updateLogDevOff"\);\r?\n    if\(devOffBtn\) devOffBtn\.hidden=true;/);
assert.doesNotMatch(disableBody, /safeUpdateLogBtn[\s\S]{0,120}hidden=true/);
});

test("automatic update log only opens on the title screen", () => {
const game = fs.readFileSync("src/game.js", "utf8");
assert.match(game, /currentVersionString\(\) !== lastSeen && activeSceneName\(\) === "title"/);
assert.match(game, /setTimeout\(\(\)=>\{ if\(activeSceneName\(\) === "title"\) openUpdateLog\(\{index:0, auto:true\}\); \}, 120\)/);
});

test("mobile title final safeTitle CSS keeps overflow hidden", () => {
const css = fs.readFileSync("style.css", "utf8");
const safeTitleRules = [...css.matchAll(/body\.safeTitle(?:\s+#safeMenu)?\{([^}]*)\}/g)];
assert.ok(safeTitleRules.length >= 2);
const lastBodyRule = [...css.matchAll(/body\.safeTitle\{([^}]*)\}/g)].at(-1)[1];
assert.match(lastBodyRule, /overflow:hidden/);
assert.doesNotMatch(css.slice(css.lastIndexOf("body.safeTitle{")), /body\.safeTitle\{[^}]*overflow:auto/);
assert.doesNotMatch(css.slice(css.lastIndexOf("body.safeTitle #safeMenu{")), /body\.safeTitle #safeMenu\{[^}]*overflow:auto/);
});
test("AUTO PC aim resolves to ABSOLUTE and LOCKED remains explicit", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /function effectivePcAimMode\(\)\{ return inputSettings\.pcAimMode==="LOCKED" \? "LOCKED" : "ABSOLUTE"; \}/);
assert.match(src, /function wantsLockedAim\(pointerType="mouse"\)\{ return pointerType==="mouse" && !isCoarsePointerMobile\(\) && inputSettings\.pcAimMode==="LOCKED" && !pointerLockFallback; \}/);
assert.match(src, /PC AIM " \+ inputSettings\.pcAimMode \+ \(inputSettings\.pcAimMode==="AUTO" \? " · ABSOLUTE" : ""\)/);
});

test("aim visual response is visual-only with deterministic large-error catch-up", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /const AIM_VISUAL_RESPONSE_MODES = \["FAST","NORMAL","SOFT"\]/);
assert.match(src, /aimVisualResponse:AIM_VISUAL_RESPONSE_MODES\.includes\(saved\.aimVisualResponse\)\?saved\.aimVisualResponse:"FAST"/);
assert.match(src, /const AIM_VISUAL_SNAP_ERROR=\{FAST:Math\.PI\*\.38,NORMAL:Math\.PI\*\.46,SOFT:Math\.PI\*\.56\}/);
assert.match(src, /function shouldSnapVisualAim\(visualTarget\)/);
assert.match(src, /if\(inputSettings\.aimVisual==="DIRECT" \|\| lastPointerSource==="touch" \|\| shouldSnapVisualAim\(visualTarget\)\)/);
assert.match(src, /const urgency=Math\.max\(1-Math\.exp\(-velocity\/3\.6\),1-Math\.exp\(-error\/\(Math\.PI\/6\)\)\)/);
assert.doesNotMatch(src.match(/function updateVisualArmAngle\(visualTarget,dt\)\{[\s\S]*?\n  \}/)?.[0] || "", /velocity\s*[><=]+\s*\d[^;]*visualArmAngle/);
assert.match(fs.readFileSync("index.html", "utf8"), /VISUAL RESPONSE FAST/);
});

test("PC input runtime has no broad updateArm exception suppression", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.doesNotMatch(src, /function updateArmSafely/);
assert.match(src,/updateAuto\(t\);\r?\n    updateArm\(dt\);\r?\n    updateNotes\(t,dt\);/);
});


test("PC aim stabilizer defaults to OFF while preserving saved LOW/MEDIUM", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /aimStabilizer:AIM_STABILIZER_MODES\.includes\(saved\.aimStabilizer\)\?saved\.aimStabilizer:"OFF"/);
assert.match(src, /catch\(e\)\{ return sanitizeInputSettings\(\{aimStabilizer:"OFF"/);
assert.match(src, /const aimStabilizer=AIM_STABILIZER_MODES\.includes\(settings\.aimStabilizer\)\?settings\.aimStabilizer:"OFF"/);
for(const saved of ["LOW", "MEDIUM"]){
const AIM_STABILIZER_MODES = ["OFF", "LOW", "MEDIUM"];
const sanitized = AIM_STABILIZER_MODES.includes(saved) ? saved : "OFF";
assert.equal(sanitized, saved);
}
});

test("event aim input keeps OFF direct and updates stabilization before RAF", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /const aimInput=\{rawAngle:/);
assert.match(src, /function processAimSample\(x,y,timestamp,source="pointer"\)/);
assert.match(src, /function applyPointerAimJudgement\(angle,delta,sampleDt,profile,source\)/);
assert.match(src, /const delta=norm\(angle-aimInput\.previousSampleAngle\)/);
assert.match(src, /aimInput\.unwrappedAngle\+=delta/);
assert.match(src, /judgementAimAngle=armAngle=stabilizedTargetAngle=angle/);
assert.match(src, /applyPointerAimJudgement\(angle,delta,sampleDt,profile,source\)/);
assert.match(src, /const samples=\(coalesced\.length\?coalesced:\[fallbackPoint\]\)\.slice\(\)\.sort/);
assert.match(src, /function clientPointToAimPoint\(clientX,clientY\)/);
assert.match(src, /e\.pointerType==="pen"\?"pen":"pointer"/);
});

test("LOW/MEDIUM use a small center guard and symmetric magnet disengage", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /if\(mode==="MEDIUM"\) return \{mode, slowTime:\.030[\s\S]*centerEnterRatio:\.055[\s\S]*jumpBypass:Math\.PI\*\.40\}/);
assert.match(src, /if\(mode==="LOW"\) return \{mode, slowTime:\.018[\s\S]*centerEnterRatio:\.040[\s\S]*jumpBypass:Math\.PI\*\.34\}/);
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

test("PC pointermove aim tracking is separate from click blocking over UI", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /function isAimPointerBlockedTarget/);
assert.match(src, /function isUiInputTarget/);
assert.match(src, /updateGameplayPointerFromEvent\(e,source\)\{\s*if\(isAimPointerBlockedTarget\(e\.target\)\)return/);
assert.doesNotMatch(src.match(/function isAimPointerBlockedTarget[\s\S]*?\n  function isUiInputTarget/)?.[0] || "", /\.quickMenu|button,#safeMenu|\.tutorialHud,/);
assert.match(src, /function isUiInputTarget[\s\S]*button,#safeMenu[\s\S]*\.quickMenu/);
for(const blocked of [".updateLogOverlay", ".pauseOverlay", "#safeOverlay", ".tutorialPrompt"]){
assert.ok(src.match(/function isAimPointerBlockedTarget[\s\S]*?\n  function isUiInputTarget/)?.[0].includes(blocked), `${blocked} blocks aim tracking`);
}
});

test("fast CW and CCW raw angular velocity remain symmetric for gestures", () => {
const norm = a => Math.atan2(Math.sin(a), Math.cos(a));
const dt = 0.016;
const cw = norm(Math.PI / 2 - 0) / dt;
const ccw = norm(-Math.PI / 2 - 0) / dt;
assert.equal(Math.abs(cw), Math.abs(ccw));
assert.equal(Math.sign(cw), -Math.sign(ccw));
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /n\.swingStartCW=aimInput\.accumulatedCWTravel/);
assert.match(src, /scratchSpeed=Math\.abs\(aimInput\.sampleAngularVelocity\)/);

});


test("aim input resets and freshness cover session boundaries and fallback", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /function resetAimInput\(angle=-Math\.PI\/2\)/);
assert.match(src, /resetAimInput\(-Math\.PI\/2\); armAngle=targetAngle=prevArmAngle=-Math\.PI\/2/);
assert.match(src, /resetAimInput\(-Math\.PI\/2\);[\s\S]*if\(runtime\.step\.kind==="traceSwing"\)/);
assert.match(src, /function resetTraceSwingCarryover\(\)\{[\s\S]*resetAimInput\(rawInputAngle\)/);
assert.match(src, /function freshAimSample\(\)/);
assert.match(src, /AIM_SAMPLE_FRESH_MS=120/);
assert.match(src, /e\.touches\?\.\[0\] \|\| e\.changedTouches\?\.\[0\] \|\| e/);
assert.match(src, /aimInput\.unwrappedAngle\+=delta; aimInput\.lastSampleDelta=delta/);
assert.match(src, /aimInput\.unwrappedAngle\+=delta; aimInput\.lastSampleDelta=delta; aimInput\.sampleInterval=dt; aimInput\.sampleAngularVelocity=delta\/Math\.max\(dt/);
});

test("keyboard and AUTO aim synchronize the unified rotation state", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /const delta=\(keyD-keyA\)\*9\.5\*dt/);
assert.match(src, /aimInput\.accumulatedCWTravel\+=delta/);
assert.match(src, /aimInput\.accumulatedCCWTravel-=delta/);
assert.match(src, /function setAutoAimAngle\(angle,velocity=0\)/);
assert.match(src, /targetAngle=armAngle=judgementAimAngle=visualArmAngle=rawInputAngle=rawTargetAngle=stabilizedTargetAngle=lastValidTargetAngle=a/);
});


test("playfield readability keeps TRACE visual widths independent of judgement tolerance", () => {
const src = fs.readFileSync("src/game.js", "utf8");
const traceStart = src.indexOf("function drawTrace(n,t){");
const traceBody = src.slice(traceStart, src.indexOf("function linkedTraceForSwing", traceStart));
assert.match(src, /function traceVisualProfile\(\)\{/);
assert.match(src, /activeOuterWidth:compact\?18:21/);
assert.match(src, /activeInnerWidth:compact\?6:8/);
assert.doesNotMatch(traceBody, /outerRadialTolerance\*2/);
assert.doesNotMatch(traceBody, /innerRadialTolerance\*2/);
assert.match(traceBody, /const visual=traceVisualProfile\(\)/);
assert.match(src, /function getTraceJudgementRegion\(n,t,profile=traceProfile\(\)\)/);
});

test("playfield readability only renders a separate judgement marker when needed", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /function judgementMarkerVisible\(\)\{\s*return judgementMarkerVisibleFor\(visualArmAngle,judgementAimAngle,magnetTarget\);/);
assert.match(src, /if\(judgementMarkerVisible\(\)\)\{/);
assert.match(src, /ctx\.arc\(hitR,0,5\.5,0,TAU\); ctx\.stroke\(\)/);
assert.doesNotMatch(src, /ctx\.arc\(hitR,0,4\.5,0,TAU\); ctx\.fill\(\)/);
});


test("foldable mobile viewports retry landscape safely", () => {
  const src=fs.readFileSync("src/game.js","utf8");
  assert.match(src,/function mobileViewportMetrics\(\)/);
  assert.match(src,/metrics\.shortSide>=600 && metrics\.longSide>=700/);
  assert.match(src,/function handleAdaptiveMobileViewport\(reason="resize",forceRelock=false\)/);
  assert.match(src,/state\.expanded && \(state\.changed \|\| forceRelock\) && canRelockLandscape\(\)/);
  assert.match(src,/if\(isStandaloneDisplay\(\)\)\{ await lockLandscapeSafe\("standalone"\)/);
  assert.match(src,/button\.textContent="가로 화면으로 전환"/);
  assert.match(src,/await requestGameFullscreen\(\);[\s\S]{0,120}await lockLandscapeSafe\("rotate-button"\)/);
  assert.match(src,/handleAdaptiveMobileViewport\("initial",true\)/);
});
