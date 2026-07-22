#!/usr/bin/env node
'use strict';
const fs=require('fs'), path=require('path');
const root=path.resolve(__dirname,'..'), out=path.join(root,'desktop-dist');
const DESKTOP_VERSION='0.9.31';
const DESKTOP_BUILD_DATE='2026-07-23';
const files=['style.css','icons/circle-mix-icon-192.png','icons/circle-mix-icon-512.png','src/version.js','src/changelog.js','src/song-record.js','src/song-package-adapter.js','src/local-library.js','src/player-profile.js','src/player-profile-ui.js','src/chart-difficulty.js','src/songs.js','src/chart.js','src/audio.js','src/effects.js','src/ui.js','src/input.js','src/cmix-validator.js','src/cmix-audio.js','src/cmix-zip.js','src/cmix-exporter.js','src/cmix-importer.js','src/cmix-local-install.js','src/game.js','src/cmix-import-ui.js','src/pwa.js'];
fs.rmSync(out,{recursive:true,force:true});
for(const file of files){const from=path.join(root,file), to=path.join(out,file); fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);}
let index=fs.readFileSync(path.join(root,'index.html'),'utf8')
 .replace(/\s*<link rel="manifest"[^>]*>\s*/,'\n')
 .replace(/\s*<audio id="song"[\s\S]*?<\/audio>\s*/,'\n<audio id="song" preload="auto"></audio>\n')
 .replace(/\s*<script src="\.\/src\/charts\/(ghost-rule|routing)\.js[^>]*><\/script>/g,'')
 .replace(/<script src="\.\/src\/build-config\.js[^>]*><\/script>/,'<script src="./src/build-config.js"></script>')
 .replace(/(<script src="\.\/src\/changelog\.js[^>]*><\/script>)/,'$1\n<script src="./src/desktop-release.js"></script>');
if(!index.includes('./src/desktop-release.js')) throw new Error('Unable to inject desktop release metadata.');
fs.writeFileSync(path.join(out,'index.html'),index);
const desktopGame=path.join(out,'src/game.js');
let game=fs.readFileSync(desktopGame,'utf8');
const animaStart=game.indexOf('  // ANiMA osu! reference rechart');
const animaEnd=game.indexOf('  function fillPlayableGaps', animaStart);
if(animaStart<0 || animaEnd<0) throw new Error('Unable to isolate bundled ANiMA chart data.');
game=game.slice(0,animaStart)+game.slice(animaEnd);
game=game.replace(/    if\(songId==="anima"[\s\S]*?    if\(songId==="ghost-rule"/, '    if(songId==="ghost-rule"');
game=game.replace(/    if\(songId==="ghost-rule"[\s\S]*?    throw new Error/, '    throw new Error');
fs.writeFileSync(desktopGame,game);
const desktopSongs=path.join(out,'src/songs.js');
let songs=fs.readFileSync(desktopSongs,'utf8');
songs=songs.replaceAll('CircleMixGhostRuleBundle','ExcludedBundle').replaceAll('CircleMixRoutingBundle','ExcludedBundle').replaceAll('./assets/audio/ghost-rule.mp3','').replaceAll('./assets/jackets/ghost-rule.jpg','');
fs.writeFileSync(desktopSongs,songs);
const desktopRelease=`(function(){\n  "use strict";\n  const release={version:"${DESKTOP_VERSION}",date:"${DESKTOP_BUILD_DATE}",title:"PULSE & WINDOWS INSTALLER",summary:"PULSE 노트와 Windows 설치형 테스트판을 추가하고 데스크톱 오프라인 상태 표시를 수정했습니다.",changes:[\n    {category:"PULSE",text:"에임 위치와 무관하게 좌·우 Shift로 치는 전역 탭 노트를 추가했습니다."},\n    {category:"INPUT",text:"양쪽 Shift를 모두 놓아야 다음 PULSE가 입력되는 공용 릴리즈 게이트를 적용했습니다."},\n    {category:"TUTORIAL",text:"단독 PULSE와 CUT + PULSE 동시 입력을 튜토리얼에서 연습할 수 있습니다."},\n    {category:"DESKTOP",text:"관리자 권한 없이 설치 가능한 Windows NSIS 테스트 설치판을 제공합니다."},\n    {category:"OFFLINE",text:"Windows 설치판은 앱 파일이 이미 로컬에 있으므로 OFFLINE DATA를 READY로 표시합니다."}\n  ]};\n  window.CircleMixVersion=Object.freeze({version:release.version,buildDate:release.date});\n  const previous=Array.isArray(window.CircleMixChangelog)?window.CircleMixChangelog:[];\n  window.CircleMixChangelog=[release,...previous.filter(entry=>entry?.version!==release.version)];\n})();\n`;
fs.writeFileSync(path.join(out,'src/desktop-release.js'),desktopRelease);
const desktopPwa=`(function(){\n  "use strict";\n  const $=id=>document.getElementById(id);\n  const setText=(id,text)=>{const el=$(id);if(el)el.textContent=text;};\n  function syncDesktopOfflineUi(){\n    setText("pwaNetworkState","DESKTOP · READY");\n    setText("offlineDataStatus","READY");\n    setText("offlineDataProgress","100%");\n    const offlineBtn=$("offlineDataBtn");\n    if(offlineBtn){offlineBtn.disabled=true;offlineBtn.setAttribute("aria-disabled","true");offlineBtn.title="Windows 설치판의 앱 데이터는 이미 로컬에 설치되어 있습니다.";}\n    const installBtn=$("installAppBtn");if(installBtn)installBtn.hidden=true;\n    const updateRow=$("pwaUpdateRow");if(updateRow)updateRow.hidden=true;\n  }\n  window.CircleMixPWA=Object.freeze({setGameplayState(){},canApplyUpdate(){return true;},isOfflineDownloadActive(){return false;},isDesktopOfflineReady(){return true;}});\n  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",syncDesktopOfflineUi,{once:true});else syncDesktopOfflineUi();\n})();\n`;
fs.writeFileSync(path.join(out,'src/pwa.js'),desktopPwa);
fs.writeFileSync(path.join(out,'src/build-config.js'),`window.CircleMixBuildConfig=Object.freeze({target:'desktop',includeBundledSongs:false,enableServiceWorker:false,enablePwaInstallUi:false});\n`);
console.log(`Prepared desktop-dist v${DESKTOP_VERSION} with ${files.length+3} allowlisted files.`);
