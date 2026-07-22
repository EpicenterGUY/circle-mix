'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'../src/game.js'),'utf8');

assert.match(source,/pulseGate\s*=\s*pulseInput\.createGate/,'production game must use the shared PULSE gate');
assert.match(source,/if\(\(e\.code==="ShiftLeft"\|\|e\.code==="ShiftRight"\)\&\&running\&\&!paused\)\{ e\.preventDefault\(\); pulseGate\?\.keydown\(e\); \}/,'Shift keydown must enter PULSE only during active play');
assert.match(source,/window\.addEventListener\("blur",\(\)=>\{ keys\.ShiftLeft=false; keys\.ShiftRight=false; pulseGate\?\.reset\(\); \}\);/,'window blur must reset the shared PULSE gate');
assert.match(source,/function nextAimNote\(t\)[\s\S]*?n\.type==="pulse"[\s\S]*?const n=nextAimNote\(t\);/,'AUTO aim selection must skip global PULSE notes');
assert.doesNotMatch(source,/scratchHeld\s*=\s*mouseDownRight\s*\|\|\s*keys\.Shift/,'Shift must never arm SCRATCH from the render loop');
assert.doesNotMatch(source,/setScratchHeld\([^\n]*keys\.Shift/,'Shift must never re-arm SCRATCH from release handlers');
assert.match(source,/pulse:"PULSE 버튼을 박자에 맞춰 탭하기"/,'mobile tutorial must explain the dedicated PULSE button');
assert.match(source,/pulse:"왼쪽 또는 오른쪽 Shift를 짧게 누르기"/,'desktop tutorial must explain the shared Shift input');
assert.match(source,/\{name:"PULSE · 기본 입력",kind:"pulse"[\s\S]*?notes:\[\{type:"pulse",beat:4\},\{type:"pulse",beat:6\},\{type:"pulse",beat:8\}\]\}/,'tutorial must include angle-free PULSE release-gate practice');
assert.match(source,/\{name:"CUT \+ PULSE · 동시 입력",kind:"pulseCombo"[\s\S]*?\{type:"cut",beat:4,lane:0\},\{type:"pulse",beat:4\}[\s\S]*?\{type:"cut",beat:7,lane:4\},\{type:"pulse",beat:7\}/,'tutorial must include simultaneous aimed and global input practice');
assert.match(source,/\(st\.kind==="mix"\|\|st\.kind==="pulseCombo"\)\?pendingKind:st\.kind/,'combined PULSE tutorial must show the next note family input hint');
assert.match(source,/if\(n\.type==="cut" \|\| n\.type==="pulse"\) return n\.hitTime\+\.22;/,'tutorial PULSE must keep the same late grace period as CUT');

console.log('PULSE production input separation tests passed');
