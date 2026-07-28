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
  ['src/mobile-layout-v2.js','src/mobile-layout-v2.js']
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
for(const asset of ['pc-settings.css','src/pc-settings.js','trackpad-tablet-area.css','src/trackpad-tablet-area.js','mobile-layout-v2.css','src/mobile-layout-v2.js'])if(!desktopBootstrap.includes(asset))throw new Error(`settings asset loader is missing ${asset}`);
fs.writeFileSync(path.join(out,'src/build-config.js'),desktopBootstrap);

// TRACKPAD_DESKTOP_RELEASE_PATCH: prepare-desktop owns the legacy base transform,
// while this final allowlist pass stamps the package version and release notes that
// the signed Windows updater publishes.
const releasePath=path.join(out,'src/desktop-release.js');
let desktopRelease=fs.readFileSync(releasePath,'utf8');
desktopRelease=desktopRelease
  .replace(/version:"[^"]+"/,`version:"${desktopVersion}"`)
  .replace(/title:"[^"]+"/,`title:"TRACKPAD INPUT ${desktopVersion}"`)
  .replace(/summary:"[^"]+"/,'summary:"트랙패드 프리셋과 오입력 방지, Windows 설정 내 업데이트 확인을 추가했습니다."')
  .replace(/changes:\[[\s\S]*?\]\};/,`changes:[
    {category:"TRACKPAD",text:"BALANCED·PRECISION·SPEED와 TABLET AREA로 상대 이동 또는 지정 영역 절대 에임을 선택할 수 있습니다."},
    {category:"INPUT",text:"키보드 판정 전용, 재접촉 튐 방지와 브라우저 제스처 차단을 설정에서 켜고 끌 수 있습니다."},
    {category:"UPDATE",text:"설정의 Windows 업데이트 확인에서 서명된 최신 설치판을 바로 확인하고 설치할 수 있습니다."},
    {category:"COMPATIBILITY",text:"판정, 점수, 기록, 채보와 LOCAL .cmix 라이브러리는 그대로 유지됩니다."}
  ]};`);
if(!desktopRelease.includes(`version:"${desktopVersion}"`)||!desktopRelease.includes(`TRACKPAD INPUT ${desktopVersion}`))throw new Error('unable to stamp trackpad desktop release metadata');
fs.writeFileSync(releasePath,desktopRelease);

for(const [,targetRelative] of required)if(!fs.existsSync(path.join(out,targetRelative)))throw new Error(`settings desktop copy failed: ${targetRelative}`);
console.log(`Applied unified settings and trackpad desktop pass v${desktopVersion}.`);
