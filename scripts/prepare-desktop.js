#!/usr/bin/env node
'use strict';
const fs=require('fs'), path=require('path');
const root=path.resolve(__dirname,'..'), out=path.join(root,'desktop-dist');
const DESKTOP_VERSION='0.9.50';
const DESKTOP_BUILD_DATE='2026-07-29';
const files=['style.css','orbit.css','icons/circle-mix-icon-192.png','icons/circle-mix-icon-512.png','src/version.js','src/changelog.js','src/song-record.js','src/song-package-adapter.js','src/local-library.js','src/player-profile.js','src/player-profile-ui.js','src/power.js','src/chart-difficulty.js','src/songs.js','src/chart.js','src/audio.js','src/effects.js','src/ui.js','src/input.js','src/cmix-validator.js','src/cmix-audio.js','src/cmix-zip.js','src/cmix-exporter.js','src/cmix-importer.js','src/cmix-local-install.js','src/editor-playtest.js','src/game.js','src/orbit.js','src/cmix-import-ui.js','src/pwa.js','src/desktop-updater.js'];
function replaceOrThrow(source,search,replacement,label){const next=source.replace(search,replacement);if(next===source)throw new Error(`Unable to ${label}.`);return next;}
fs.rmSync(out,{recursive:true,force:true});
for(const file of files){const from=path.join(root,file), to=path.join(out,file); fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);}
let index=fs.readFileSync(path.join(root,'index.html'),'utf8')
 .replace(/\s*<link rel="manifest"[^>]*>\s*/,'\n')
 .replace(/\s*<audio id="song"[\s\S]*?<\/audio>\s*/,'\n<audio id="song" preload="auto"></audio>\n')
 .replace(/\s*<script src="\.\/src\/charts\/(ghost-rule|routing)\.js[^>]*><\/script>/g,'')
 .replace(/<script src="\.\/src\/build-config\.js[^>]*><\/script>/,'<script src="./src/build-config.js"></script>')
 .replace(/(<script src="\.\/src\/changelog\.js[^>]*><\/script>)/,'$1\n<script src="./src/desktop-release.js"></script>\n<script src="./src/desktop-updater.js"></script>');
if(!index.includes('./src/desktop-release.js')||!index.includes('./src/desktop-updater.js')) throw new Error('Unable to inject desktop release and updater metadata.');
if(!index.includes('./src/editor-playtest.js'))throw new Error('Desktop index does not load the editor playtest runtime.');
fs.writeFileSync(path.join(out,'index.html'),index);
let orbit=fs.readFileSync(path.join(root,'orbit.html'),'utf8').replace('src="./assets/audio/ghost-rule.mp3"','src=""');
fs.writeFileSync(path.join(out,'orbit.html'),orbit);
const desktopGame=path.join(out,'src/game.js');
let game=fs.readFileSync(desktopGame,'utf8').replace(/\r\n/g,'\n');
const animaStart=game.indexOf('  // ANiMA osu! reference rechart');
const animaEnd=game.indexOf('  function fillPlayableGaps', animaStart);
if(animaStart<0 || animaEnd<0) throw new Error('Unable to isolate bundled ANiMA chart data.');
game=game.slice(0,animaStart)+game.slice(animaEnd);
game=game.replace(/    if\(songId==="anima"[\s\S]*?    if\(songId==="ghost-rule"/, '    if(songId==="ghost-rule"');
game=game.replace(/    if\(songId==="ghost-rule"[\s\S]*?    throw new Error/, '    throw new Error');
game=replaceOrThrow(game,
'    const controls=document.querySelector(".mobileGameplayControls");',
'    const controls=document.querySelector(".mobileGameplayControls");\n    const legacyScratchButton=document.getElementById("mobileScratchBtn"); if(legacyScratchButton){legacyScratchButton.hidden=true;legacyScratchButton.disabled=true;legacyScratchButton.setAttribute?.("aria-hidden","true");}',
'hide the legacy mobile SCRATCH control');
game=replaceOrThrow(game,
'    if(scratchEditor&&!document.getElementById("addPulseBtn")){ const button=document.createElement("button"); button.className="editBtn editFull"; button.id="addPulseBtn"; button.type="button"; button.textContent="PULSE (SHIFT)"; scratchEditor.parentElement?.insertBefore(button,scratchEditor); }',
'    if(scratchEditor&&!document.getElementById("addPulseBtn")){ const button=document.createElement("button"); button.className="editBtn editFull"; button.id="addPulseBtn"; button.type="button"; button.textContent="PULSE (SHIFT)"; scratchEditor.parentElement?.insertBefore(button,scratchEditor); }\n    for(const id of ["addScratchCWBtn","addScratchCCWBtn"]){const el=document.getElementById(id);if(el){el.hidden=true;el.disabled=true;el.setAttribute?.("aria-hidden","true");}}',
'retire SCRATCH editor controls');
game=replaceOrThrow(game,
'    if(hint) hint.textContent="현재 음악 위치에 노트 찍기. PULSE는 각도 없이 Shift로 치는 전역 탭이며, SCRATCH는 레거시 우클릭 방향 액션입니다.";',
'    if(hint) hint.textContent="현재 음악 위치에 노트 찍기. PULSE는 각도 없이 Shift로 치는 전역 탭입니다.";',
'remove SCRATCH from the editor hint');
game=replaceOrThrow(game,
'    const keyGrid=document.querySelector("#keymapOverlay .keyGrid");',
'    const keyGrid=document.querySelector("#keymapOverlay .keyGrid");\n    if(keyGrid){const keyCells=[...keyGrid.children];const scratchIndex=keyCells.findIndex(cell=>String(cell.textContent||"").trim().toUpperCase()==="SCRATCH");if(scratchIndex>=0)for(const cell of keyCells.slice(scratchIndex,scratchIndex+3)){if(typeof cell.remove==="function")cell.remove();else cell.hidden=true;}}',
'remove SCRATCH from the keymap');
game=replaceOrThrow(game,',scratch:"두 손가락을 누른 채 짧게 긁기"','', 'remove the mobile SCRATCH tutorial hint');
game=replaceOrThrow(game,',scratch:"마우스 오른쪽을 누른 채 짧게 긁기"','', 'remove the desktop SCRATCH tutorial hint');
game=replaceOrThrow(game,
'    {name:"SCRATCH · 가이드",kind:"scratch",phase:"guided",desc:"레거시 SCRATCH는 마우스 오른쪽을 누른 채 표시 방향으로 짧게 긁으세요.",notes:[{type:"scratchCW",beat:4,lane:1,endLane:2,durationBeat:.55},{type:"scratchCCW",beat:6,lane:5,endLane:4,durationBeat:.55}]},\n',
'',
'remove the SCRATCH tutorial step');
game=replaceOrThrow(game,'{type:"scratchCCW",beat:18,lane:5,endLane:4,durationBeat:.55}','{type:"pulse",beat:18}','replace SCRATCH in the final tutorial mix');
game=replaceOrThrow(game,
'  function tutorialNoteFinalDeadline(n){\n    if(n.type==="cut" || n.type==="pulse") return n.hitTime+.22;\n    if(n.type.startsWith("swing") || n.type.startsWith("scratch")) return n.hitTime+.26;\n    return n.hitTime+(n.duration||0);\n  }',
'  function tutorialNoteFinalDeadline(n){\n    if(n.type==="cut" || n.type==="pulse") return n.hitTime+.22;\n    if(n.type.startsWith("swing") || n.type.startsWith("scratch")) return n.hitTime+.26;\n    if(n.type.startsWith("trace")) return n.hitTime+(n.duration||0)+TRACE_PROFILES.tutorial.endpointGrace+.05;\n    return n.hitTime+(n.duration||0);\n  }',
'preserve the TRACE endpoint grace before tutorial finalization');
game=require('./desktop-visual-pass.js')(game);
if(!game.includes('function checkScratch')) throw new Error('Legacy SCRATCH playback compatibility was removed unexpectedly.');
if(game.includes('name:"SCRATCH · 가이드"')||game.includes('{type:"scratchCCW",beat:18')) throw new Error('Desktop tutorial still exposes SCRATCH.');
fs.writeFileSync(desktopGame,game);
const desktopSongs=path.join(out,'src/songs.js');
let songs=fs.readFileSync(desktopSongs,'utf8');
songs=songs.replaceAll('CircleMixGhostRuleBundle','ExcludedBundle').replaceAll('CircleMixRoutingBundle','ExcludedBundle').replaceAll('./assets/audio/ghost-rule.mp3','').replaceAll('./assets/jackets/ghost-rule.jpg','');
fs.writeFileSync(desktopSongs,songs);
const desktopRelease=`(function(){
  "use strict";
  const release={version:"${DESKTOP_VERSION}",date:"${DESKTOP_BUILD_DATE}",title:"WINDOWS 0.9.50",summary:"LOCAL 난이도 정렬과 에디터 플레이테스트 저장 안전성을 반영한 Windows 업데이트입니다.",changes:[
    {category:"LOCAL ORDER",text:"LOCAL 난이도를 화면에 표시되는 자동 계산 별 기준으로 쉬운 순서부터 정렬합니다."},
    {category:"EDITOR",text:"한 난이도를 저장하거나 플레이테스트해도 같은 곡의 다른 난이도와 채보를 보존합니다."},
    {category:"PLAYTEST",text:"에디터에서 현재 채보를 공식 게임 판정으로 바로 열어 테스트할 수 있습니다."},
    {category:"COMPATIBILITY",text:"기존 LOCAL 곡·채보·기록과 Windows 설정은 그대로 유지됩니다."}
  ]};
  window.CircleMixVersion=Object.freeze({version:release.version,buildDate:release.date});
  const previous=Array.isArray(window.CircleMixChangelog)?window.CircleMixChangelog:[];
  window.CircleMixChangelog=[release,...previous.filter(entry=>entry?.version!==release.version)];
  // DESKTOP_UPDATE_LOG_RETRY: game startup initializes the update-log check before
  // the title scene is finalized. Retry once after DOM/title startup so an updated
  // installed app cannot silently skip its release notes.
  function showDesktopReleaseLogAfterTitle(){
    if(typeof document==="undefined")return;
    let lastSeen="";
    try{lastSeen=window.localStorage?.getItem("circleMixLastSeenVersion")||"";}catch(_){}
    if(lastSeen===release.version)return;
    setTimeout(()=>{
      const overlay=document.getElementById("updateLogOverlay");
      if(overlay&&!overlay.hidden&&overlay.classList?.contains("show"))return;
      const button=document.getElementById("safeUpdateLogBtn");
      if(button&&!button.hidden&&typeof button.click==="function")button.click();
    },320);
  }
  if(typeof document!=="undefined"){
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",showDesktopReleaseLogAfterTitle,{once:true});
    else showDesktopReleaseLogAfterTitle();
  }
})();
`;
fs.writeFileSync(path.join(out,'src/desktop-release.js'),desktopRelease);
const desktopPwa=`(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  const setText=(id,text)=>{const el=$(id);if(el)el.textContent=text;};
  function syncDesktopOfflineUi(){
    setText("pwaNetworkState","DESKTOP · READY");
    setText("offlineDataStatus","READY");
    setText("offlineDataProgress","100%");
    const offlineBtn=$("offlineDataBtn");
    if(offlineBtn){offlineBtn.disabled=true;offlineBtn.setAttribute("aria-disabled","true");offlineBtn.title="Windows 설치판의 앱 데이터는 이미 로컬에 설치되어 있습니다.";}
    const installBtn=$("installAppBtn");if(installBtn)installBtn.hidden=true;
    const updateRow=$("pwaUpdateRow");if(updateRow)updateRow.hidden=true;
  }
  window.CircleMixPWA=Object.freeze({setGameplayState(){},canApplyUpdate(){return true;},isOfflineDownloadActive(){return false;},isDesktopOfflineReady(){return true;}});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",syncDesktopOfflineUi,{once:true});else syncDesktopOfflineUi();
})();
`;
fs.writeFileSync(path.join(out,'src/pwa.js'),desktopPwa);
fs.writeFileSync(path.join(out,'src/build-config.js'),`window.CircleMixBuildConfig=Object.freeze({target:'desktop',includeBundledSongs:false,enableServiceWorker:false,enablePwaInstallUi:false,enableSignedUpdater:true});\n`);
console.log(`Prepared desktop-dist v${DESKTOP_VERSION} with ${files.length+3} allowlisted files.`);
