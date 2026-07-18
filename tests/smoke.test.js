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
  const exportPatch = `\nwindow.__smoke = {\n  generateAnimaNormalChart, generateAnimaTechChart, chartForDifficulty, calculateChartDifficulty,\n  difficultyViewForSong, getActiveDifficultyLabel, localChartEntries, tutorialSteps, buildTutorialStepRuntime,\n  formatStarValue, formatDifficulty, renderSongSelect, resolveSelectedSong\n};\n`;
  const patched = src.replace(/\n\s*updateModeButtons\(\);\n\s*updateButtons\(\);\n\}\)\(\);\s*$/, `${exportPatch}\n  updateModeButtons();\n  updateButtons();\n})();`);
  const elements = new Map();
  const document = {
    documentElement: makeElement("html"), body: makeElement("body"), fullscreenElement:null,
    getElementById(id){ if(!elements.has(id)) elements.set(id, makeElement(id)); return elements.get(id); },
    createElement(tag){ return makeElement(tag); }, addEventListener(){}, removeEventListener(){}, querySelectorAll(){ return []; }, querySelector(){ return null; }
  };
  const window = { document, location:{search:"", href:"http://localhost/index.html"}, CircleMixSongRegistry:{ all:()=>[{id:"anima",source:"builtin",title:"ANiMA",artist:"xi",bpm:184.6,offset:-0.04,difficulties:{normal:{label:"NORMAL"},tech:{label:"TECH"}}}], localAll:()=>[], refreshLocal:async()=>[], get:()=>({id:"anima",source:"builtin",title:"ANiMA",artist:"xi",bpm:184.6,offset:-0.04,difficulties:{normal:{label:"NORMAL"},tech:{label:"TECH"}}}), hasDifficulty:(s,d)=>!!s?.difficulties?.[d] }, CircleMixChartTools:{calculateStars:()=>1}, CircleMixVersion:{version:"0.0.0"}, CircleMixChangelog:[], history:{replaceState(){}}, addEventListener(){}, removeEventListener(){}, PointerEvent:function PointerEvent(){} };
  const sandbox = { window, document, console, URLSearchParams, URL, setTimeout, clearTimeout, setInterval, clearInterval,
    localStorage:{getItem:()=>null,setItem(){},removeItem(){}}, performance:{now:()=>0}, requestAnimationFrame:()=>0, cancelAnimationFrame(){},
    screen:{orientation:{unlock(){}}}, alert(){}, confirm:()=>false, prompt:()=>null, AudioContext:function(){}, webkitAudioContext:function(){} };
  vm.createContext(sandbox);
  vm.runInContext(patched, sandbox, {filename:"src/game.js"});
  return sandbox.window.__smoke;
}

function normDeg(a){ return ((a % 360) + 360) % 360; }
function shortestDeg(a,b){ return Math.abs(normDeg(a-b+180)-180); }

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
  const s10 = steps[9], n10 = api.buildTutorialStepRuntime(9).chart[0];
  assert.match(s10.name, /45°|45도|TRACE/i); assert.equal(n10.type, "traceCW");
  assert.notEqual(n10.lane, n10.endLane); assert.ok(shortestDeg(n10.angle*180/Math.PI, n10.endAngle*180/Math.PI) >= 40 && shortestDeg(n10.angle*180/Math.PI, n10.endAngle*180/Math.PI) <= 50);
  assert.equal(n10.tutorialStaticTrace, undefined); assert.notEqual(n10.tutorialModeType, "staticTrace"); assert.notEqual(n10.signedSweepAngle, 0);
  const n11 = api.buildTutorialStepRuntime(10).chart[0]; assert.ok(shortestDeg(n11.angle*180/Math.PI, n11.endAngle*180/Math.PI) >= 85 && shortestDeg(n11.angle*180/Math.PI, n11.endAngle*180/Math.PI) <= 95);
  const n12 = api.buildTutorialStepRuntime(11).chart[0]; assert.ok(shortestDeg(n12.angle*180/Math.PI, n12.endAngle*180/Math.PI) >= 175 && shortestDeg(n12.angle*180/Math.PI, n12.endAngle*180/Math.PI) <= 185);
  const r17 = api.buildTutorialStepRuntime(16); assert.ok(r17.chart.length && r17.chart.every(n=>String(n.type).startsWith("trace"))); assert.ok(r17.step.phase === "traceSwing" || r17.step.kind === "traceSwing");
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
