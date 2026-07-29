'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const trackpad=require('../src/ui.js');
const source=fs.readFileSync(path.join(__dirname,'../src/ui.js'),'utf8');

assert.deepEqual(trackpad.PRESET_ORDER,['OFF','BALANCED','PRECISION','TABLET_AREA','SPEED']);
assert.equal(trackpad.normalizePreset('balanced'),'BALANCED');
assert.equal(trackpad.normalizePreset('tablet_area'),'TABLET_AREA');
assert.equal(trackpad.displayPreset('TABLET_AREA'),'TABLET AREA');
assert.equal(trackpad.normalizePreset('unknown'),'OFF');

const balanced=trackpad.inputPatchForPreset('BALANCED');
assert.deepEqual(balanced,{pcAimMode:'LOCKED',lockedAimSensitivity:1,aimStabilizer:'LOW',aimVisual:'SMOOTH',aimVisualResponse:'FAST'});
const tablet=trackpad.inputPatchForPreset('TABLET_AREA');
assert.deepEqual(tablet,{pcAimMode:'ABSOLUTE',lockedAimSensitivity:1,aimStabilizer:'OFF',aimVisual:'DIRECT',aimVisualResponse:'FAST'});
assert.equal(trackpad.PRESETS.TABLET_AREA.keyboardOnly,true);
assert.equal(trackpad.PRESETS.TABLET_AREA.jumpGuard,false);

const existing={mobileQuality:'AUTO',haptic:true};
assert.deepEqual(trackpad.mergePresetIntoInputSettings(existing,'PRECISION'),{mobileQuality:'AUTO',haptic:true,pcAimMode:'ABSOLUTE',lockedAimSensitivity:1,aimStabilizer:'LOW',aimVisual:'DIRECT',aimVisualResponse:'FAST'});
assert.deepEqual(trackpad.mergePresetIntoInputSettings(existing,'OFF'),existing);

const store=new Map([[trackpad.STORAGE_KEY,JSON.stringify({preset:'TABLET_AREA'})],[trackpad.INPUT_SETTINGS_KEY,JSON.stringify(existing)]]);
const fakeWindow={localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)}};
const state=trackpad.seedStoredPreset(fakeWindow);
assert.equal(state.preset,'TABLET_AREA');
const seeded=JSON.parse(store.get(trackpad.INPUT_SETTINGS_KEY));
assert.equal(seeded.pcAimMode,'ABSOLUTE');
assert.equal(seeded.aimStabilizer,'OFF');
assert.equal(seeded.mobileQuality,'AUTO');

assert.equal(trackpad.jumpThreshold({width:1280,height:720}),158.4);
assert.equal(trackpad.isRecontactJump({x:100,y:100,time:0},{x:300,y:100,time:100},{width:1280,height:720}),true);
assert.equal(trackpad.isRecontactJump({x:100,y:100,time:0},{x:300,y:100,time:30},{width:1280,height:720}),false);
assert.equal(trackpad.isRecontactJump({x:100,y:100,time:0},{x:180,y:100,time:100},{width:1280,height:720}),false);

assert.match(source,/hub\.dataset\.platform==="mobile"/,'trackpad cards must remain hidden from the mobile settings hub');
assert.match(source,/트랙패드 태블릿 영역/,'desktop settings must expose the tablet-area editor');
assert.match(source,/Windows 업데이트 확인/,'desktop settings must expose the updater entry');
assert.match(source,/CircleMixDesktopUpdater/,'desktop settings must call the signed updater API');
assert.match(source,/stopImmediatePropagation\(\)/,'keyboard-only mode must block the existing click judgement listener');

console.log('trackpad settings tests passed');
