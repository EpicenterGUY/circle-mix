'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'../src/game.js'),'utf8');

assert.match(source,/pulseGate\s*=\s*pulseInput\.createGate/,'production game must use the shared PULSE gate');
assert.match(source,/if\(e\.code==="ShiftLeft"\|\|e\.code==="ShiftRight"\)\{ e\.preventDefault\(\); pulseGate\?\.keydown\(e\); \}/,'Shift keydown must enter the PULSE gate');
assert.doesNotMatch(source,/scratchHeld\s*=\s*mouseDownRight\s*\|\|\s*keys\.Shift/,'Shift must never arm SCRATCH from the render loop');
assert.doesNotMatch(source,/setScratchHeld\([^\n]*keys\.Shift/,'Shift must never re-arm SCRATCH from release handlers');

console.log('PULSE production input separation tests passed');
