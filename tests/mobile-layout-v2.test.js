'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const M=require('../src/mobile-layout-v2');

test('mobile layout v2 sanitizes and migrates legacy scratch coordinates into pulse',()=>{
  const value=M.sanitizeSettings({mobileControlPreset:'CUSTOM',mobileScratchX:.21,mobileScratchY:.79,mobileScratchSize:104,mobileActionSize:999,mobileButtonOpacity:.1});
  assert.equal(M.VERSION,'mobile-layout-v2');
  assert.equal(value.mobilePulseX,.21);
  assert.equal(value.mobilePulseY,.79);
  assert.equal(value.mobilePulseSize,104);
  assert.equal(value.mobileActionSize,132);
  assert.equal(value.mobileButtonOpacity,.35);
});

test('mobile layout presets keep ACTION and PULSE separated',()=>{
  const standard=M.layoutPixels({mobileControlPreset:'STANDARD'},900,420);
  const left=M.layoutPixels({mobileControlPreset:'LEFT_HANDED'},900,420);
  const right=M.layoutPixels({mobileControlPreset:'RIGHT_HANDED'},900,420);
  assert.ok(standard.action.x>.5&&standard.pulse.x<.5);
  assert.ok(left.action.x<.5&&left.pulse.x>.5);
  assert.ok(right.action.x>.5&&right.pulse.x>.5&&right.pulse.y<right.action.y);
});

test('custom coordinates clamp inside the mobile safe area',()=>{
  const result=M.layoutPixels({mobileControlPreset:'CUSTOM',mobileActionX:0,mobileActionY:0,mobilePulseX:1,mobilePulseY:1,mobileActionSize:100,mobilePulseSize:120,mobileControlGap:20},800,400);
  assert.ok(result.actionPx.x>=70&&result.actionPx.y>=108);
  assert.ok(result.pulsePx.x<=720&&result.pulsePx.y<=320);
});

test('mobile environment can be forced and assets are wired into distributions',()=>{
  const make=search=>({location:{search},innerWidth:1200,innerHeight:800,navigator:{maxTouchPoints:0},matchMedia:()=>({matches:false})});
  assert.equal(M.isMobileEnvironment(make('?mobileLayoutV2=1')),true);
  assert.equal(M.isMobileEnvironment(make('?mobileLayoutV2=0')),false);
  const build=fs.readFileSync('src/build-config.js','utf8');
  assert.match(build,/mobile-layout-v2\.css/);
  assert.match(build,/src\/mobile-layout-v2\.js/);
});