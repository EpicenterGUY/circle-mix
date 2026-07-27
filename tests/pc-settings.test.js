'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const P=require('../src/pc-settings');

function makeEnvironment({search='',width=1280,fine=true,coarse=false}={}){
  return {innerWidth:width,location:{search},matchMedia:q=>({matches:q.includes('fine')?fine:coarse})};
}

function makeDocument(ids=[]){
  const nodes=new Map(ids.map(id=>[id,{id,textContent:id,getAttribute:()=>null}]));
  return {getElementById:id=>nodes.get(id)||null,fullscreenElement:null,webkitFullscreenElement:null};
}

test('unified settings taxonomy covers desktop and mobile categories',()=>{
  assert.equal(P.VERSION,'settings-hub-v2');
  assert.deepEqual(P.GROUPS.map(group=>group.id),['play','input','audio','display','accessibility','system']);
  for(const id of ['speed','offset','auto','fullscreen','pcAim','music','sfx','noteContrast','judgeGuide','mobileQuality','mobileHaptic','mobileLayout','mobileInputTest','debug','orbit']){
    assert.ok(P.SETTINGS.some(setting=>setting.id===id),`contains ${id}`);
  }
  assert.equal(new Set(P.SETTINGS.map(setting=>setting.id)).size,P.SETTINGS.length);
  assert.ok(P.SETTINGS.some(setting=>setting.platform==='pc'));
  assert.ok(P.SETTINGS.some(setting=>setting.platform==='mobile'));
  for(const id of ['speed','offset','auto','fullscreen','music','sfx','noteContrast']){
    assert.equal(P.SETTINGS.find(setting=>setting.id===id).quick,true,`${id} is available in pause quick settings`);
  }
});

test('search metadata supports Korean and English settings terms',()=>{
  const aim=P.SETTINGS.find(setting=>setting.id==='pcAim');
  const audio=P.SETTINGS.find(setting=>setting.id==='sfx');
  const mobile=P.SETTINGS.find(setting=>setting.id==='mobileQuality');
  assert.match(P.settingSearchText(aim),/마우스/);
  assert.match(P.settingSearchText(aim),/absolute/);
  assert.match(P.settingSearchText(audio),/타격음/);
  assert.match(P.settingSearchText(mobile),/performance/);
  assert.equal(P.normalizeText('  FULL   Screen  '),'full screen');
});

test('platform detection keeps foldable touch layouts mobile and remains forceable',()=>{
  assert.equal(P.isPcEnvironment(makeEnvironment()),true);
  assert.equal(P.platformFor(makeEnvironment()),'pc');
  assert.equal(P.isPcEnvironment(makeEnvironment({width:1104,fine:false,coarse:true})),false,'expanded foldable remains mobile');
  assert.equal(P.platformFor(makeEnvironment({width:1104,fine:false,coarse:true})),'mobile');
  assert.equal(P.isPcEnvironment(makeEnvironment({width:600,fine:false,coarse:true})),false);
  assert.equal(P.isPcEnvironment(makeEnvironment({search:'?pcSettings=1',width:360,fine:false,coarse:true})),true);
  assert.equal(P.isPcEnvironment(makeEnvironment({search:'?settingsPlatform=mobile'})),false);
});

test('platform filters exclude irrelevant controls without removing shared settings',()=>{
  const pcAim=P.SETTINGS.find(setting=>setting.id==='pcAim');
  const mobileQuality=P.SETTINGS.find(setting=>setting.id==='mobileQuality');
  const contrast=P.SETTINGS.find(setting=>setting.id==='noteContrast');
  assert.equal(P.settingAllowed(pcAim,'pc'),true);
  assert.equal(P.settingAllowed(pcAim,'mobile'),false);
  assert.equal(P.settingAllowed(mobileQuality,'mobile'),true);
  assert.equal(P.settingAllowed(mobileQuality,'pc'),false);
  assert.equal(P.settingAllowed(contrast,'pc'),true);
  assert.equal(P.settingAllowed(contrast,'mobile'),true);
  const doc=makeDocument(['pauseSetPcAim','pauseSetMobileQuality','pauseSetNoteContrast']);
  assert.equal(P.availableSetting(doc,pcAim,'mobile'),false);
  assert.equal(P.availableSetting(doc,mobileQuality,'mobile'),true);
  assert.equal(P.availableSetting(doc,contrast,'mobile'),true);
});

test('settings source binds title full settings and pause quick settings',()=>{
  const source=fs.readFileSync('src/pc-settings.js','utf8');
  assert.match(source,/bindOpenTrigger\('safeSettingsBtn','title'\)/);
  assert.match(source,/bindOpenTrigger\('settingsBtn','pause'\)/);
  assert.match(source,/origin==='pause'\?'quick':'full'/);
  assert.match(source,/전체 설정은 타이틀 SETTINGS/);
  assert.match(source,/pauseSettingsOverlay/);
});

test('mobile settings sheet keeps navigation fixed and content independently scrollable',()=>{
  const css=fs.readFileSync('pc-settings.css','utf8');
  assert.match(css,/\.pcSettingsContent[\s\S]*overflow-y:auto/);
  assert.match(css,/-webkit-overflow-scrolling:touch/);
  assert.match(css,/touch-action:pan-y/);
  assert.match(css,/@media\(max-width:900px\),\(pointer:coarse\)/);
  assert.match(css,/\.pcSettingsLayout[\s\S]*flex-direction:column/);
  assert.match(css,/\.pcSettingsNav[\s\S]*overflow-x:auto/);
  assert.doesNotMatch(css,/\.pcSettingsHub\{display:none!important\}/);
});

test('loader and distributions include unified settings assets',()=>{
  const build=fs.readFileSync('src/build-config.js','utf8');
  const sw=fs.readFileSync('service-worker.js','utf8');
  const desktopPass=fs.readFileSync('scripts/pc-settings-desktop-pass.js','utf8');
  const pkg=fs.readFileSync('package.json','utf8');
  assert.match(build,/pc-settings\.css/);
  assert.match(build,/src\/pc-settings\.js/);
  for(const asset of ['./pc-settings.css','./src/pc-settings.js'])assert.ok(sw.includes(asset),`service worker caches ${asset}`);
  assert.match(desktopPass,/pc-settings\.css/);
  assert.match(desktopPass,/src\/pc-settings\.js/);
  assert.match(desktopPass,/target:'desktop'/);
  assert.match(pkg,/pc-settings-desktop-pass\.js/);
});
