'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const pulse=require('../src/input.js');

assert.equal(fs.existsSync(path.join(__dirname,'../src/pulse-input.js')),false,'PULSE input must keep src/input.js as its single source');
assert.equal(pulse.NOTE_TYPE,'pulse');
assert.equal(pulse.isPulseNote({type:'pulse'}),true);
assert.equal(pulse.isPulseNote({type:'cut'}),false);
assert.deepEqual(pulse.normalizePulseNote({id:' p1 ',beat:'4.5',angle:90,durationBeat:2}),{id:'p1',type:'pulse',beat:4.5});

assert.equal(pulse.judge(0),'perfect');
assert.equal(pulse.judge(-45),'perfect');
assert.equal(pulse.judge(46),'great');
assert.equal(pulse.judge(90),'great');
assert.equal(pulse.judge(91),'miss');
assert.equal(pulse.judge(150),'miss');
assert.equal(pulse.judge(151),null);
assert.equal(pulse.approachProgress(0,1000,1000),0);
assert.equal(pulse.approachProgress(500,1000,1000),.5);
assert.equal(pulse.approachProgress(1000,1000,1000),1);

const events=[];
const gate=pulse.createGate({onPulse:detail=>events.push(detail)});
assert.deepEqual(gate.keydown({code:'KeyZ'}),{handled:false,accepted:false,reason:'OTHER_KEY'});
assert.equal(gate.keydown({code:'ShiftLeft',timeStamp:10}).accepted,true);
assert.equal(events.length,1);
assert.equal(events[0].code,'ShiftLeft');
assert.equal(gate.keydown({code:'ShiftLeft',repeat:true}).reason,'REPEAT');
assert.equal(gate.keydown({code:'ShiftRight'}).reason,'RELEASE_REQUIRED','the other Shift must not bypass the release gate');
assert.equal(events.length,1);
assert.equal(gate.keyup({code:'ShiftLeft'}).released,false,'right Shift is still held');
assert.equal(gate.keydown({code:'ShiftLeft'}).reason,'RELEASE_REQUIRED');
assert.equal(gate.keyup({code:'ShiftRight'}).released,false,'left Shift was pressed again and is still held');
assert.equal(gate.keyup({code:'ShiftLeft'}).released,true,'all Shift keys must be released before rearming');
assert.equal(gate.keydown({code:'ShiftRight',timeStamp:20}).accepted,true);
assert.equal(events.length,2);
gate.reset();
assert.equal(gate.state().latched,false);
assert.deepEqual(gate.state().held,[]);
assert.equal(gate.keydown({code:'ShiftLeft'}).accepted,true,'reset/blur must release the latch');

console.log('pulse input tests passed');
