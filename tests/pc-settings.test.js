'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const P=require('../src/pc-settings');

test('PC settings taxonomy is complete and mobile-only controls stay excluded',()=>{
  assert.equal(P.VERSION,'pc-settings-v1');
  assert.deepEqual(P.GROUPS.map(group=>group.id),['play','input','audio','display','accessibility','advanced']);
  for(const id of ['speed','offset','pcAim','music','sfx','noteContrast','judgeGuide','auto','debug','orbit'])assert.ok(P.SETTINGS.some(setting=>setting.id===id),`contains ${id}`);
  assert.equal(P.SETTINGS.some(setting=>/mobile/i.test(`${setting.id} ${setting.target||''}`)),false);
  assert.equal(new Set(P.SETTINGS.map(setting=>setting.id)).size,P.SETTINGS.length);
});

test('search metadata supports Korean and English settings terms',()=>{
  const aim=P.SETTINGS.find(setting=>setting.id==='pcAim');
  const audio=P.SETTINGS.find(setting=>setting.id==='sfx');
  assert.match(P.settingSearchText(aim),/마우스/);
  assert.match(P.settingSearchText(aim),/absolute/);
  assert.match(P.settingSearchText(audio),/타격음/);
  assert.equal(P.normalizeText('  FULL   Screen  '),'full screen');
});

test('desktop environment detection is forceable and rejects compact coarse layouts',()=>{
  const make=({search='',width=1280,fine=true,coarse=false}={})=>({innerWidth:width,location:{search},matchMedia:q=>({matches:q.includes('fine')?fine:coarse})});
  assert.equal(P.isPcEnvironment(make()),true);
  assert.equal(P.isPcEnvironment(make({width:600,fine:false,coarse:true})),false);
  assert.equal(P.isPcEnvironment(make({search:'?pcSettings=1',width:360,fine:false,coarse:true})),true);
  assert.equal(P.isPcEnvironment(make({search:'?pcSettings=0'})),false);
});

test('loader and distributions include unified settings assets',()=>{
  const build=fs.readFileSync('src/build-config.js','utf8');
  const sw=fs.readFileSync('service-worker.js','utf8');
  const desktop=fs.readFileSync('scripts/prepare-desktop.js','utf8');
  assert.match(build,/pc-settings\.css/);
  assert.match(build,/src\/pc-settings\.js/);
  for(const asset of ['./pc-settings.css','./src/pc-settings.js'])assert.ok(sw.includes(asset),`service worker caches ${asset}`);
  assert.match(desktop,/pc-settings\.css/);
  assert.match(desktop,/src\/pc-settings\.js/);
  assert.match(desktop,/CircleMixBuildConfig=.*target:'desktop'/);
});
