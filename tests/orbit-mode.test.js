'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const O=require('../src/orbit.js');
assert.deepEqual(O.ORBIT_TYPES,['dot','hold','ribbon','stack','bloom','flipCW','flipCCW','roll','pulse']);
assert.equal(O.canonicalType('tap'),'dot');
assert.equal(O.canonicalType('arc'),'ribbon');
assert.equal(O.RING_FACTORS.length,3);
assert.ok(O.RING_FACTORS[0]<O.RING_FACTORS[1]&&O.RING_FACTORS[1]<O.RING_FACTORS[2]);
assert.ok(O.DRAW_HOLD_BEATS>=8);
assert.equal(O.judgementForDelta(0.03),'PERFECT');
assert.equal(O.judgementForDelta(0.1),'GREAT');
assert.equal(O.judgementForDelta(0.2),null);
for(const type of ['dot','hold','ribbon','stack','bloom','roll'])assert.equal(O.inputMatches({type},'KeyZ'),true,`${type} uses action input`);
assert.equal(O.inputMatches({type:'tap'},'KeyX'),true,'legacy TAP remains playable');
assert.equal(O.inputMatches({type:'arc'},'KeyZ'),true,'legacy ARC remains playable');
assert.equal(O.inputMatches({type:'flipCW'},'ArrowRight'),true);
assert.equal(O.inputMatches({type:'flipCCW'},'ArrowLeft'),true);
assert.equal(O.inputMatches({type:'pulse'},'ShiftLeft'),true);
const chart=O.buildOrbitChart([
  {type:'dot',beat:0,ring:0},
  {type:'stack',beat:2,rings:[2,0,1,2]},
  {type:'flipCCW',beat:4},
  {type:'ribbon',beat:6,durationBeat:4,ring:0,points:[{beatOffset:0,ring:0},{beatOffset:2,ring:2},{beatOffset:4,ring:1}]},
  {type:'flipCW',beat:12},
  {type:'bloom',beat:14,ring:2,petals:10}
]);
assert.equal(chart[0].ring,0);
assert.deepEqual(chart[1].stackRings,[0,1,2]);
assert.equal(chart[2].directionAfter,-1);
assert.equal(chart[3].points.length,3);
assert.deepEqual(chart[3].points.map(point=>point.ring),[0,2,1]);
assert.equal(chart[3].endRing,1);
assert.equal(chart[4].directionAfter,1);
assert.equal(chart[5].bloomPetals,10);
assert.ok(chart.every(note=>note.drawUntil>=note.endTime));
const noFlip=O.buildOrbitChart([{type:'dot',beat:0},{type:'dot',beat:4},{type:'dot',beat:8}]);
assert.ok(O.shortestDeg(chart[3].angle,noFlip[2].angle)>0,'flip changes authored path');
const demo=O.makeDemoChart();
for(const type of O.ORBIT_TYPES)assert.ok(demo.some(note=>note.type===type),`picture demo contains ${type}`);
assert.ok(demo.some(note=>note.stackRings.length===3),'picture demo uses three-ring STACK');
assert.ok(demo.some(note=>note.type==='ribbon'&&new Set(note.points.map(point=>point.ring)).size===3),'picture demo crosses all rings');
assert.equal(demo.some(note=>String(note.type).startsWith('trace')),false);
assert.equal(demo.some(note=>String(note.type).startsWith('scratch')),false);
const orbitSource=fs.readFileSync('src/orbit.js','utf8');
assert.doesNotMatch(orbitSource,/coverage\+=dt/,'sustain coverage must not depend on frame rate');
assert.match(orbitSource,/Math\.min\(note\.duration,Math\.max\(0,t-note\.hitTime\)\)/,'sustain coverage uses elapsed gameplay time');
assert.match(orbitSource,/DRAW MODE/,'completed notes remain as a picture memory');
const html=fs.readFileSync('orbit.html','utf8');
assert.match(html,/3 RINGS/);
assert.match(html,/DRAW MODE/);
assert.match(html,/DOT · HOLD · RIBBON · STACK · BLOOM · ROLL/);
const game=fs.readFileSync('src/game.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const desktop=fs.readFileSync('scripts/prepare-desktop.js','utf8');
assert.match(game,/safeOrbit/,'title screen exposes ORBIT mode');
assert.match(game,/window\.location\.href="\.\/orbit\.html"/,'ORBIT button opens the standalone mode');
for(const asset of ['./orbit.html','./orbit.css','./src/orbit.js'])assert.ok(sw.includes(asset),`service worker caches ${asset}`);
assert.match(desktop,/orbit\.html/,'desktop packaging includes ORBIT page');
assert.match(desktop,/src\/orbit\.js/,'desktop packaging includes ORBIT runtime');
console.log('orbit picture chart tests passed');
