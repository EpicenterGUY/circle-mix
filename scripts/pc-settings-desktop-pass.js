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
  ['song-select-fixes.css','song-select-fixes.css']
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
  .replace(/title:"[^"]+"/,`title:"LIBRARY FIXES ${desktopVersion}"`)
  .replace(/summary:"[^"]+"/,'summary:"곡 목록 스크롤과 LOCAL 난이도 정렬을 수정하고 트랙패드 TABLET AREA를 포함한 최신 Windows판입니다."')
  .replace(/changes:\[[\s\S]*?\]\};/,`changes:[
    {category:"SONG SELECT",text:"곡이 많아져도 첫 곡부터 마지막 곡까지 위아래 스크롤로 모두 접근할 수 있습니다."},
    {category:"LOCAL",text:"LOCAL .cmix의 난이도 버튼을 숫자 레벨 기준 쉬운 순서부터 어려운 순서로 정렬합니다."},
    {category:"TRACKPAD",text:"BALANCED·PRECISION·SPEED와 TABLET AREA 입력 모드를 Windows 설정에서 사용할 수 있습니다."},
    {category:"COMPATIBILITY",text:"판정, 점수, 기록, 채보와 기존 LOCAL .cmix 저장 데이터는 그대로 유지됩니다."}
  ]};`);
if(!desktopRelease.includes(`version:"${desktopVersion}"`)||!desktopRelease.includes(`LIBRARY FIXES ${desktopVersion}`))throw new Error('unable to stamp desktop release metadata');
fs.writeFileSync(releasePath,desktopRelease);

for(const [,targetRelative] of required)if(!fs.existsSync(path.join(out,targetRelative)))throw new Error(`settings desktop copy failed: ${targetRelative}`);
console.log(`Applied unified settings, library and trackpad desktop pass v${desktopVersion}.`);
