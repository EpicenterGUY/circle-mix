#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'desktop-dist');
const pkg=require(path.join(root,'package.json'));
const desktopVersion=String(pkg.version||'').trim();
const required=[
  ['pc-settings.css','pc-settings.css'],
  ['src/pc-settings.js','src/pc-settings.js'],
  ['src/ui.js','src/ui.js'],
  ['trackpad-tablet-area.css','trackpad-tablet-area.css'],
  ['src/trackpad-tablet-area.js','src/trackpad-tablet-area.js'],
  ['mobile-layout-v2.css','mobile-layout-v2.css'],
  ['src/mobile-layout-v2.js','src/mobile-layout-v2.js'],
  ['song-select-fixes.css','song-select-fixes.css'],
  ['src/editor-playtest.js','src/editor-playtest.js']
];
if(!fs.existsSync(path.join(out,'index.html')))throw new Error('desktop-dist must be prepared before the settings asset pass');
if(!/^\d+\.\d+\.\d+$/.test(desktopVersion))throw new Error('package.json must contain a desktop SemVer');
for(const [sourceRelative,targetRelative] of required){
  const source=path.join(root,sourceRelative),target=path.join(out,targetRelative);
  if(!fs.existsSync(source))throw new Error(`missing settings asset: ${sourceRelative}`);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(source,target);
}
const sharedBootstrap=fs.readFileSync(path.join(root,'src/build-config.js'),'utf8');
const desktopSeed="window.CircleMixBuildConfig={target:'desktop',includeBundledSongs:false,enableServiceWorker:false,enablePwaInstallUi:false,enableSignedUpdater:true};\n";
const desktopBootstrap=desktopSeed+sharedBootstrap;
for(const asset of ['pc-settings.css','src/pc-settings.js','trackpad-tablet-area.css','src/trackpad-tablet-area.js','mobile-layout-v2.css','src/mobile-layout-v2.js','song-select-fixes.css'])if(!desktopBootstrap.includes(asset))throw new Error(`settings asset loader is missing ${asset}`);
fs.writeFileSync(path.join(out,'src/build-config.js'),desktopBootstrap);

// TRACKPAD_DESKTOP_RELEASE_PATCH: prepare-desktop owns the legacy base transform,
// while this final allowlist pass stamps the package version and release notes that
// the signed Windows updater publishes.
const releasePath=path.join(out,'src/desktop-release.js');
let desktopRelease=fs.readFileSync(releasePath,'utf8');
desktopRelease=desktopRelease
  .replace(/version:"[^"]+"/,`version:"${desktopVersion}"`)
  .replace(/title:"[^"]+"/,`title:"WINDOWS ${desktopVersion}"`)
  .replace(/summary:"[^"]+"/,'summary:"채보 난이도별 정확도 POWER 예상표를 추가한 Windows 업데이트입니다."')
  .replace(/changes:\[[\s\S]*?\]\};/,`changes:[
    {category:"POWER FORECAST",text:"선택한 채보의 90%·95%·97%·99%·100% 정확도 예상 POWER를 곡 선택 화면에 표시합니다."},
    {category:"CONDITION",text:"예상치는 FC·MISS 0 기준이며 실제 결과 POWER와 같은 공용 산식을 사용합니다."},
    {category:"DIFFICULTY",text:"난이도를 바꾸면 자동 계산 별 난이도에 맞춰 예상 POWER가 즉시 갱신됩니다."},
    {category:"COMPATIBILITY",text:"판정, 기록, 기존 LOCAL .cmix와 Windows 설정은 그대로 유지됩니다."}
  ]};`);
if(!desktopRelease.includes(`version:"${desktopVersion}"`)||!desktopRelease.includes(`WINDOWS ${desktopVersion}`))throw new Error('unable to stamp desktop release metadata');
fs.writeFileSync(releasePath,desktopRelease);

const editorPlaytest=fs.readFileSync(path.join(out,'src/editor-playtest.js'),'utf8');
if(!editorPlaytest.includes('mergeLocalDifficulty'))throw new Error('desktop editor playtest lost sibling difficulty preservation');
for(const [,targetRelative] of required)if(!fs.existsSync(path.join(out,targetRelative)))throw new Error(`settings desktop copy failed: ${targetRelative}`);
console.log(`Applied unified settings and accuracy POWER forecast desktop pass v${desktopVersion}.`);
