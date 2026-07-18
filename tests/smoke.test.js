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
const exportPatch = `\nwindow.__smoke = {\n generateAnimaNormalChart, generateAnimaTechChart, chartForDifficulty, calculateChartDifficulty,\n difficultyViewForSong, getActiveDifficultyLabel, localChartEntries, tutorialSteps, buildTutorialStepRuntime,\n formatStarValue, formatDifficulty, renderSongSelect, resolveSelectedSong\n};\n`;
const patched = src.replace(/\n\s*updateModeButtons\(\);\n\s*updateButtons\(\);\n\}\)\(\);\s*$/, `${exportPatch}\n updateModeButtons();\n updateButtons();\n})();`);
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

function loadGhostRuleBundle(){
const context = {window:{}}; vm.createContext(context);
vm.runInContext(fs.readFileSync("src/charts/ghost-rule.js", "utf8"), context, {filename:"src/charts/ghost-rule.js"});
return context.window.CircleMixGhostRuleBundle;
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

test("index and service worker use the same PWA cache query", () => {
const index = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("service-worker.js", "utf8");
assert.match(index, /20260718-mobile-update-log-hotfix-1/);
assert.match(sw, /20260718-mobile-update-log-hotfix-1/);
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


test("mobile hotfix versions are synchronized at 0.9.5", () => {
const version = fs.readFileSync("src/version.js", "utf8");
const pwa = fs.readFileSync("src/pwa.js", "utf8");
const sw = fs.readFileSync("service-worker.js", "utf8");
const changelog = fs.readFileSync("src/changelog.js", "utf8");
assert.match(version, /version:\s*"0\.9\.5"/);
assert.match(pwa, /const VERSION="0\.9\.5"/);
assert.match(sw, /const VERSION = "0\.9\.5"/);
assert.match(changelog, /version:\s*"0\.9\.5"/);
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
assert.match(game, /const devOffBtn=document\.getElementById\("updateLogDevOff"\);\n    if\(devOffBtn\) devOffBtn\.hidden=!circleMixDevMode;/);
assert.doesNotMatch(game, /safeUpdateLogBtn[\s\S]{0,140}hidden=!circleMixDevMode/);
assert.match(fs.readFileSync("index.html", "utf8"), /id="safeSetUpdateLog"[\s\S]*UPDATE LOG[\s\S]*id="pauseSetUpdateLog"/);
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
