'use strict';
const assert=require('node:assert/strict');
const trackpad=require('../src/ui.js');

assert.deepEqual(trackpad.PRESET_ORDER,['OFF','BALANCED','PRECISION','SPEED']);
assert.equal(trackpad.normalizePreset('balanced'),'BALANCED');
assert.equal(trackpad.normalizePreset('unknown'),'OFF');

const balanced=trackpad.inputPatchForPreset('BALANCED');
assert.deepEqual(balanced,{
  pcAimMode:'LOCKED',
  lockedAimSensitivity:1,
  aimStabilizer:'LOW',
  aimVisual:'SMOOTH',
  aimVisualResponse:'FAST'
});

const existing={mobileQuality:'AUTO',haptic:true};
assert.deepEqual(trackpad.mergePresetIntoInputSettings(existing,'PRECISION'),{
  mobileQuality:'AUTO',
  haptic:true,
  pcAimMode:'ABSOLUTE',
  lockedAimSensitivity:1,
  aimStabilizer:'LOW',
  aimVisual:'DIRECT',
  aimVisualResponse:'FAST'
});
assert.deepEqual(trackpad.mergePresetIntoInputSettings(existing,'OFF'),existing);

const store=new Map([[trackpad.STORAGE_KEY,JSON.stringify({preset:'SPEED'})],[trackpad.INPUT_SETTINGS_KEY,JSON.stringify(existing)]]);
const fakeWindow={localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)}};
const state=trackpad.seedStoredPreset(fakeWindow);
assert.equal(state.preset,'SPEED');
const seeded=JSON.parse(store.get(trackpad.INPUT_SETTINGS_KEY));
assert.equal(seeded.pcAimMode,'LOCKED');
assert.equal(seeded.lockedAimSensitivity,1.25);
assert.equal(seeded.aimStabilizer,'OFF');
assert.equal(seeded.mobileQuality,'AUTO');

assert.equal(trackpad.jumpThreshold({width:1280,height:720}),158.4);
assert.equal(trackpad.isRecontactJump({x:100,y:100,time:0},{x:300,y:100,time:100},{width:1280,height:720}),true);
assert.equal(trackpad.isRecontactJump({x:100,y:100,time:0},{x:300,y:100,time:30},{width:1280,height:720}),false);
assert.equal(trackpad.isRecontactJump({x:100,y:100,time:0},{x:180,y:100,time:100},{width:1280,height:720}),false);

console.log('trackpad settings tests passed');
