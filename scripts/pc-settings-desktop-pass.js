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
  .replace(/summary:"[^"]+"/,'summary:"난이도와 맵·채보·노트 개수의 고정 상한을 제거한 Windows 업데이트입니다."')
  .replace(/changes:\[[\s\S]*?\]\};/,`changes:[
    {category:"DIFFICULTY",text:"표시 난이도 20 상한을 제거해 20보다 높은 레벨도 그대로 가져오고 내보냅니다."},
    {category:"CONTENT LIMITS",text:"LOCAL SONGS와 .cmix의 곡·채보·파일·노트 개수에 고정된 상한을 두지 않습니다."},
    {category:"EDITOR",text:"전체 난이도 내보내기에서 자동 계산 레벨을 20으로 줄이던 처리를 제거했습니다."},
    {category:"SAFETY",text:"개별 파일·전체 압축 해제 용량, 압축률, 경로와 금지 확장자 검사는 그대로 유지됩니다."},
    {category:"DIFFICULTY LIST",text:"난이도 버튼이 많아도 가로 스크롤로 마지막 난이도까지 선택할 수 있습니다."},
    {category:"CMIX OPEN",text:"Windows 탐색기에서 .cmix 맵을 더블클릭하면 CIRCLE MIX 가져오기 창이 바로 열립니다."},
    {category:"POWER",text:"기존 90%·95%·97%·99%·100% 정확도 POWER 예측과 FC·MISS 0 기준 표시는 그대로 유지됩니다."}
  ]};`);
if(!desktopRelease.includes(`version:"${desktopVersion}"`)||!desktopRelease.includes(`WINDOWS ${desktopVersion}`))throw new Error('unable to stamp desktop release metadata');
fs.writeFileSync(releasePath,desktopRelease);

const validator=fs.readFileSync(path.join(out,'src/cmix-validator.js'),'utf8');
for(const removed of ['maxFiles:','maxCharts:','maxNotesPerChart:'])if(validator.includes(removed))throw new Error(`desktop validator still contains ${removed}`);
for(const needle of ['charts must contain at least 1 entry','notes must contain at least 1 entry','Package must contain at least 1 file','Chart level must be a finite number >= 1'])if(!validator.includes(needle))throw new Error(`desktop unlimited-content validator is missing ${needle}`);
const editorPlaytest=fs.readFileSync(path.join(out,'src/editor-playtest.js'),'utf8');
if(!editorPlaytest.includes('mergeLocalDifficulty'))throw new Error('desktop editor playtest lost sibling difficulty preservation');
for(const [,targetRelative] of required)if(!fs.existsSync(path.join(out,targetRelative)))throw new Error(`settings desktop copy failed: ${targetRelative}`);
console.log(`Applied unlimited-content settings and map-open desktop pass v${desktopVersion}.`);
