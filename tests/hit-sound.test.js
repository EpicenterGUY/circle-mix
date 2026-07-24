'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const game = fs.readFileSync('src/game.js', 'utf8').replace(/\r\n/g, '\n');
const soundStart = game.indexOf('  const HIT_SOUND_CHORD_WINDOW=.036;');
const soundEnd = game.indexOf('\n  function judge(n,label,color,event={}){', soundStart);
assert.ok(soundStart >= 0 && soundEnd > soundStart, 'layered hit-sound section must exist before judgement');
const sound = game.slice(soundStart, soundEnd);

assert.match(sound, /createDynamicsCompressor\(\)/, 'shared limiter must protect dense patterns from clipping');
assert.match(sound, /threshold\.value=-12/);
assert.match(sound, /ratio\.value=10/);
assert.match(sound, /recentHitTimes=recentHitTimes\.filter/, 'simultaneous hits must receive adaptive headroom');
assert.match(sound, /1\/Math\.sqrt\(recentHitTimes\.length\)/);
assert.match(sound, /hitNoiseBuffer&&hitNoiseBuffer\.sampleRate===audioCtx\.sampleRate/, 'noise should be cached instead of allocated for every note');

for (const family of ['cut', 'pulse', 'swing', 'slide', 'trace', 'hold']) {
  assert.ok(sound.includes(`family==="${family}"`), `${family} must have a dedicated sound recipe`);
}
assert.match(sound, /type\.startsWith\("scratch"\)\?"scratch":"cut"/, 'legacy SCRATCH must retain a distinct recipe');
assert.match(sound, /type\.endsWith\("CCW"\)\?-1:\(type\.endsWith\("CW"\)\?1:0\)/, 'directional notes must pan their pitch sweep by direction');
assert.match(sound, /quality==="PERFECT"\?1:\.88/, 'GREAT must be audibly lower than PERFECT');
assert.match(sound, /if\(quality==="PERFECT"\)/, 'PERFECT must add a high-frequency sparkle layer');

assert.match(sound, /family==="pulse"[\s\S]*from:112,to:48/, 'PULSE needs a centered low-frequency impact');
assert.match(sound, /family==="swing"[\s\S]*type:"bandpass"/, 'SWING needs a directional whip-noise layer');
assert.match(sound, /family==="slide"[\s\S]*from:direction<0\?1320:560/, 'SLIDE needs a directional completion sweep');
assert.match(sound, /family==="trace"[\s\S]*frequency:2450/, 'TRACE needs a clean endpoint shimmer');
assert.match(sound, /family==="hold"[\s\S]*type:"lowpass"/, 'HOLD completion needs a low thump');

assert.match(game, /playHitSound\(n\.type,label\);/, 'judgement must route the note type and quality into the sound engine');
console.log('layered gameplay hit-sound tests passed');
