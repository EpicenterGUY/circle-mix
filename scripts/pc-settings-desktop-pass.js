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
  .replace(/summary:"[^"]+"/,'summary:"LOCAL 난이도를 실제 표시 별 기준으로 정렬하고 에디터 플레이테스트 저장 안전성을 반영한 Windows 업데이트입니다."')
  .replace(/changes:\[[\s\S]*?\]\};/,`changes:[
    {category:"LOCAL ORDER",text:"LOCAL 난이도를 화면에 표시되는 자동 계산 별 기준으로 쉬운 순서부터 어려운 순서로 정렬합니다."},
    {category:"EDITOR",text:"한 난이도를 저장하거나 플레이테스트해도 같은 곡의 다른 난이도와 채보를 그대로 보존합니다."},
    {category:"PLAYTEST",text:"에디터에서 현재 채보를 공식 게임 판정으로 바로 열고 테스트 전용 설정을 사용할 수 있습니다."},
    {category:"COMPATIBILITY",text:"판정, 점수, 기록, 기존 LOCAL .cmix와 Windows 설정은 그대로 유지됩니다."}
  ]};`);
if(!desktopRelease.includes(`version:"${desktopVersion}"`)||!desktopRelease.includes(`WINDOWS ${desktopVersion}`))throw new Error('unable to stamp desktop release metadata');
fs.writeFileSync(releasePath,desktopRelease);

const editorPlaytest=fs.readFileSync(path.join(out,'src/editor-playtest.js'),'utf8');
if(!editorPlaytest.includes('mergeLocalDifficulty'))throw new Error('desktop editor playtest lost sibling difficulty preservation');
for(const [,targetRelative] of required)if(!fs.existsSync(path.join(out,targetRelative)))throw new Error(`settings desktop copy failed: ${targetRelative}`);
console.log(`Applied unified settings, LOCAL difficulty and editor playtest desktop pass v${desktopVersion}.`);
