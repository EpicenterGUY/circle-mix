'use strict';
const assert=require('node:assert/strict');
const area=require('../src/trackpad-tablet-area');

assert.equal(area.VERSION,'trackpad-tablet-area-v1');
assert.equal(area.TABLET_PRESET,'TABLET_AREA');

const sanitized=area.sanitizeSettings({x:.9,y:-1,width:.4,height:.5,rotation:91,mirrorX:true,deadzone:9});
assert.equal(sanitized.x,.6);
assert.equal(sanitized.y,0);
assert.equal(sanitized.rotation,90);
assert.equal(sanitized.mirrorX,true);
assert.equal(sanitized.deadzone,.22);

const rect=area.areaRect({x:.25,y:.1,width:.5,height:.8},{width:1000,height:500,left:10,top:20});
assert.deepEqual(rect,{left:260,top:70,width:500,height:400,right:760,bottom:470});

const right=area.mapPointToAngle({x:760,y:270},rect,{deadzone:0},0);
assert.ok(Math.abs(right.angle)<1e-9);
const down=area.mapPointToAngle({x:510,y:470},rect,{deadzone:0},0);
assert.ok(Math.abs(down.angle-Math.PI/2)<1e-9);
const rotated=area.mapPointToAngle({x:760,y:270},rect,{deadzone:0,rotation:90},0);
assert.ok(Math.abs(rotated.angle-Math.PI/2)<1e-9);
const mirrored=area.mapPointToAngle({x:760,y:270},rect,{deadzone:0,mirrorX:true},0);
assert.ok(Math.abs(Math.abs(mirrored.angle)-Math.PI)<1e-9);
const held=area.mapPointToAngle({x:510,y:270},rect,{deadzone:.1},1.2);
assert.equal(held.deadzone,true);
assert.ok(Math.abs(held.angle-1.2)<1e-9);
const clamped=area.mapPointToAngle({x:9999,y:270},rect,{deadzone:0},0);
assert.equal(clamped.u,1);

const store=new Map([[area.TRACKPAD_STORAGE_KEY,JSON.stringify({preset:'TABLET_AREA'})]]);
const fakeWindow={localStorage:{getItem:key=>store.get(key)||null}};
assert.equal(area.activePreset(fakeWindow),true);
store.set(area.TRACKPAD_STORAGE_KEY,JSON.stringify({preset:'BALANCED'}));
assert.equal(area.activePreset(fakeWindow),false);

console.log('trackpad tablet area tests passed');
