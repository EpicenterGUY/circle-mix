'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const M=require('../src/mobile-layout-v2');

test('mobile layout v2 sanitizes and migrates legacy scratch coordinates into pulse',()=>{
  const value=M.sanitizeSettings({mobileControlPreset:'CUSTOM',mobileScratchX:.21,mobileScratchY:.79,mobileScratchSize:104,mobileActionSize:999,mobileButtonOpacity:.1});
  assert.equal(M.VERSION,'mobile-layout-v2');
  assert.equal(M.INPUT_VERSION,'mobile-input-v3');
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

test('Android defaults to balanced relative aim while web preserves absolute aim',()=>{
  assert.equal(M.defaultsFor({CircleMixBuildConfig:{target:'android'}}).mobileAimPreset,'BALANCED');
  assert.equal(M.defaultsFor({CircleMixBuildConfig:{target:'web'}}).mobileAimPreset,'ABSOLUTE');
  assert.deepEqual(M.aimProfile({mobileAimPreset:'PRECISION'}),{mode:'RELATIVE',sensitivity:.82});
  assert.deepEqual(M.aimProfile({mobileAimPreset:'SPEED'}),{mode:'RELATIVE',sensitivity:1.28});
});

test('relative mobile aim uses tangent travel and rejects large recontact jumps',()=>{
  assert.ok(M.tangentMovement(0,0,10)>0,'downward movement advances from the right side of the circle');
  assert.ok(M.tangentMovement(Math.PI/2,-10,0)>0,'left movement advances from the bottom side of the circle');
  assert.equal(M.shouldSuppressJump({x:8,y:5,timeStamp:20},{x:0,y:0,timeStamp:0},900,420),false);
  assert.equal(M.shouldSuppressJump({x:500,y:0,timeStamp:20},{x:0,y:0,timeStamp:0},900,420),true);
  assert.equal(M.shouldSuppressJump({x:8,y:5,timeStamp:140},{x:0,y:0,timeStamp:0},900,420),true);
  const point=M.virtualAimPoint({left:10,top:20,width:900,height:420},0);
  assert.ok(point.x>460&&Math.abs(point.y-230)<.001);
});

test('mobile environment can be forced and assets are wired into all distributions',()=>{
  const make=search=>({location:{search},innerWidth:1200,innerHeight:800,navigator:{maxTouchPoints:0},matchMedia:()=>({matches:false})});
  assert.equal(M.isMobileEnvironment(make('?mobileLayoutV2=1')),true);
  assert.equal(M.isMobileEnvironment(make('?mobileLayoutV2=0')),false);
  const build=fs.readFileSync('src/build-config.js','utf8');
  const serviceWorker=fs.readFileSync('service-worker.js','utf8');
  const desktopPass=fs.readFileSync('scripts/pc-settings-desktop-pass.js','utf8');
  const source=fs.readFileSync('src/mobile-layout-v2.js','utf8');
  for(const asset of ['mobile-layout-v2.css','src/mobile-layout-v2.js']){
    assert.ok(build.includes(asset),`bootstrap loads ${asset}`);
    assert.ok(serviceWorker.includes(asset),`offline cache includes ${asset}`);
    assert.ok(desktopPass.includes(asset),`desktop pass includes ${asset}`);
  }
  for(const marker of ['mobile-input-v3','MOBILE INPUT · AIM / ACTION / PULSE','stopImmediatePropagation','mobileAimRecontactGuard','mobileGestureGuard'])assert.ok(source.includes(marker),`mobile input source contains ${marker}`);
});
