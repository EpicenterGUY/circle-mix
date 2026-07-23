'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const applyDesktopVisualPass=require('../scripts/desktop-visual-pass.js');

// Match prepare-desktop.js: GitHub's Windows checkout can expose CRLF source.
const game=fs.readFileSync(path.resolve(__dirname,'../src/game.js'),'utf8').replace(/\r\n/g,'\n');
const palette=game.match(/const COLORS = \{[\s\S]*?\n  \};/)?.[0] || '';
const color=name=>palette.match(new RegExp(`\\b${name}:"(#[0-9a-fA-F]{6})"`))?.[1];

assert.equal(color('pulse'),'#ff9f43','the shared PULSE palette color must remain the merged orange');
assert.notEqual(color('pulse'),color('swingCCW'),'PULSE and SWING CCW must remain visually distinct');
const transformed=applyDesktopVisualPass(game);
assert.ok(transformed.includes('pulse:"#ff9f43"'),'desktop preparation must preserve the shared PULSE color');
assert.ok(transformed.includes('PULSE_VISUAL_SINGLE_RING'));
assert.ok(transformed.includes('SWING_VISUAL_DIRECTIONAL_ARC'));
assert.equal(applyDesktopVisualPass(transformed),transformed,'desktop visual pass must be idempotent');

console.log('desktop visual pass tests passed');
