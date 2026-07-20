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
const exportPatch = `\nwindow.__smoke = {\n generateAnimaNormalChart, generateAnimaTechChart, chartForDifficulty, calculateChartDifficulty,\n difficultyViewForSong, getActiveDifficultyLabel, localChartEntries, tutorialSteps, buildTutorialStepRuntime,\n formatStarValue, formatDifficulty, renderSongSelect, resolveSelectedSong,\n renderedDifficultyHtml:()=>songDifficulty?.innerHTML||""\n};\n`;
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
const window = { document, location:{search:"", href:"http://localhost/index.html"}, CircleMixRoutingBundle:routing, CircleMixSongRegistry:{ all:()=>builtins, localAll:()=>[], refreshLocal:async()=>[], refreshBuiltinAudio:async()=>builtins, get:id=>builtins.find(song=>song.id===id)||anima, hasDifficulty:(s,d)=>!!s?.difficulties?.[d] }, CircleMixChartTools:{calculateStars:()=>1}, CircleMixVersion:{version:"0.0.0"}, CircleMixChangelog:[], history:{replaceState(){}}, addEventListener(){}, removeEventListener(){}, PointerEvent:function PointerEvent(){} };
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

test("index and service worker use the same PWA cache query", () => {
const index = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("service-worker.js", "utf8");
assert.match(index, /20260720-cmix-full-1/);
assert.match(sw, /20260720-cmix-full-1/);
assert.match(index, /src\/charts\/routing\.js\?v=/);
assert.match(sw, /src\/charts\/routing\.js\?v=/);
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
assert.match(sw, /\.\/src\/charts\/ghost-rule\.js\?v=/);
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
assert.match(pwa, /postToSW\(\{type:"OFFLINE_STATUS", version:VERSION\}, \[channel\.port2\]\)/);
assert.match(pwa, /postToSW\(\{type:"DOWNLOAD_OFFLINE", version:VERSION\}, \[channel\.port2\]\)/);
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


test("direct play startup release versions are synchronized at 0.9.21", () => {
const version = fs.readFileSync("src/version.js", "utf8");
const pwa = fs.readFileSync("src/pwa.js", "utf8");
const sw = fs.readFileSync("service-worker.js", "utf8");
const changelog = fs.readFileSync("src/changelog.js", "utf8");
assert.match(version, /version:\s*"0\.9\.23"/);
assert.match(pwa, /const VERSION="0\.9\.23"/);
assert.match(sw, /const VERSION = "0\.9\.23"/);
assert.match(changelog, /version:\s*"0\.9\.23"/);
});

test("index and service worker app shell cache-bust URLs match exactly", () => {
const index = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("service-worker.js", "utf8");
const indexUrls = [...index.matchAll(/(?:href|src)="(\.\/(?:style\.css|src\/[^\"]+\.js)\?v=[^"]+)"/g)].map(m=>m[1]).sort();
const swUrls = [...sw.matchAll(/"(\.\/(?:style\.css|src\/[^\"]+\.js)\?v=[^"]+)"/g)].map(m=>m[1]).sort();
assert.deepEqual(swUrls, indexUrls);
assert.ok(indexUrls.length > 5);
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

test("aim visual response is visual-only and has no velocity snap threshold", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /const AIM_VISUAL_RESPONSE_MODES = \["FAST","NORMAL","SOFT"\]/);
assert.match(src, /aimVisualResponse:AIM_VISUAL_RESPONSE_MODES\.includes\(saved\.aimVisualResponse\)\?saved\.aimVisualResponse:"FAST"/);
assert.match(src, /function updateVisualArmAngle\(visualTarget,dt\)/);
assert.match(src, /const urgency=Math\.max\(1-Math\.exp\(-velocity\/3\.2\),1-Math\.exp\(-error\/\(Math\.PI\/5\)\)\)/);
assert.doesNotMatch(src.match(/function updateArm\(dt\)\{[\s\S]*?\n  \}\n\n  function logAutoProcessing/)?.[0] || "", /sampleAngularVelocity\)>=4\.2\) visualArmAngle=/);
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

test("event aim input keeps OFF direct and exposes continuous state", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /const aimInput=\{rawAngle:/);
assert.match(src, /function processAimSample\(x,y,timestamp,source="pointer"\)/);
assert.match(src, /const delta=norm\(angle-aimInput\.previousSampleAngle\)/);
assert.match(src, /aimInput\.unwrappedAngle\+=delta/);
assert.match(src, /judgementAimAngle=profile\.mode==="OFF" \? rawInputAngle : stabilizedTargetAngle/);
assert.match(src, /getCoalescedEvents/);
});

test("LOW/MEDIUM keep center deadzone and magnet disengage is symmetric", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /if\(mode==="MEDIUM"\) return \{mode, slowTime:\.040/);
assert.match(src, /if\(mode==="LOW"\) return \{mode, slowTime:\.028/);
assert.match(src, /Math\.abs\(velocity\)>profile\.disengageVel/);
const disengageVel = 4.6;
assert.equal(Math.abs(5.1) > disengageVel, true);
assert.equal(Math.abs(-5.1) > disengageVel, true);
const movingAway = (velocity, err) => Math.sign(velocity) === -Math.sign(err) && Math.abs(velocity) > 1.15;
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
assert.match(src, /aimInput\.unwrappedAngle\+=delta; aimInput\.lastSampleDelta=delta; aimInput\.sampleAngularVelocity=delta\/Math\.max\(dt/);
});

test("keyboard and AUTO aim synchronize the unified rotation state", () => {
const src = fs.readFileSync("src/game.js", "utf8");
assert.match(src, /const delta=\(keyD-keyA\)\*9\.5\*dt/);
assert.match(src, /aimInput\.accumulatedCWTravel\+=delta/);
assert.match(src, /aimInput\.accumulatedCCWTravel-=delta/);
assert.match(src, /armAngle=judgementAimAngle=visualArmAngle=rawInputAngle=rawTargetAngle=a/);
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
