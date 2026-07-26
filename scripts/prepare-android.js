#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');

const root=path.resolve(__dirname,'..');
const desktopOut=path.join(root,'desktop-dist');
const out=path.join(root,'android-dist');
const ANDROID_VERSION='0.9.43';
const ANDROID_BUILD_DATE='2026-07-27';

function run(script){execFileSync(process.execPath,[path.join(root,script)],{cwd:root,stdio:'inherit'});}
function replaceOrThrow(source,search,replacement,label){const next=source.replace(search,replacement);if(next===source)throw new Error(`Unable to ${label}.`);return next;}

run('scripts/prepare-desktop.js');
run('scripts/pc-settings-desktop-pass.js');
fs.rmSync(out,{recursive:true,force:true});
fs.cpSync(desktopOut,out,{recursive:true});

for(const file of ['src/desktop-release.js','src/desktop-updater.js'])fs.rmSync(path.join(out,file),{force:true});
fs.copyFileSync(path.join(root,'src/android-platform.js'),path.join(out,'src/android-platform.js'));

let index=fs.readFileSync(path.join(out,'index.html'),'utf8').replace(/\r\n/g,'\n');
index=replaceOrThrow(index,'<script src="./src/desktop-release.js"></script>','<script src="./src/android-release.js"></script>','replace desktop release metadata');
index=replaceOrThrow(index,'<script src="./src/desktop-updater.js"></script>','<script src="./src/android-platform.js"></script>','inject the Android platform bridge');
if(index.includes('desktop-updater.js')||index.includes('desktop-release.js'))throw new Error('Android index still loads desktop-only scripts.');
fs.writeFileSync(path.join(out,'index.html'),index);

const sharedBootstrap=fs.readFileSync(path.join(root,'src/build-config.js'),'utf8');
const androidSeed="window.CircleMixBuildConfig={target:'android',includeBundledSongs:false,enableServiceWorker:false,enablePwaInstallUi:false,enableSignedUpdater:false,nativeAndroid:true};\n";
fs.writeFileSync(path.join(out,'src/build-config.js'),androidSeed+sharedBootstrap);

const androidRelease=`(function(){
  "use strict";
  const release={version:"${ANDROID_VERSION}",date:"${ANDROID_BUILD_DATE}",title:"ANDROID LANDSCAPE HOTFIX",summary:"폴더를 접거나 펼친 상태 모두에서 앱이 안전하게 자동 가로 화면으로 실행되도록 수정했습니다.",changes:[
    {category:"ORIENTATION",text:"접힌 외부 화면과 펼친 내부 화면 모두 sensor landscape를 사용합니다."},
    {category:"STABILITY",text:"실행 중 requestedOrientation을 호출하지 않아 시작 크래시 방지 구조를 유지합니다."},
    {category:"FOLD",text:"회전·접힘·펼침 후 화면 크기에 맞춰 게임 UI와 모바일 버튼을 다시 배치합니다."},
    {category:"NATIVE",text:"전체 화면, 화면 꺼짐 방지와 Android 뒤로가기를 각각 독립적으로 적용합니다."}
  ]};
  window.CircleMixVersion=Object.freeze({version:release.version,buildDate:release.date});
  const previous=Array.isArray(window.CircleMixChangelog)?window.CircleMixChangelog:[];
  window.CircleMixChangelog=[release,...previous.filter(entry=>entry?.version!==release.version)];
})();
`;
fs.writeFileSync(path.join(out,'src/android-release.js'),androidRelease);

const androidPwa=`(function(){
  "use strict";
  const doc=document;
  const setText=(id,text)=>{const el=doc.getElementById(id);if(el)el.textContent=text;};
  function ready(){
    setText("pwaNetworkState","ANDROID · READY");
    setText("offlineDataStatus","READY");
    setText("offlineDataProgress","100%");
    for(const id of ["offlineDataBtn","installAppBtn","installHelp","pwaUpdateRow"]){const el=doc.getElementById(id);if(el){el.hidden=true;el.disabled=true;el.setAttribute?.("aria-hidden","true");}}
  }
  const fallback=Object.freeze({setGameplayState(){},canApplyUpdate(){return true;},isOfflineDownloadActive(){return false;},isDesktopOfflineReady(){return true;},isAndroidApp(){return true;}});
  window.CircleMixPWA=window.CircleMixAndroidPlatform?.pwaApi||window.CircleMixPWA||fallback;
  if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",ready,{once:true});else ready();
})();
`;
fs.writeFileSync(path.join(out,'src/pwa.js'),androidPwa);

const forbidden=['src/desktop-release.js','src/desktop-updater.js','service-worker.js','manifest.webmanifest'];
for(const relative of forbidden)if(fs.existsSync(path.join(out,relative)))throw new Error(`Android distribution contains forbidden file: ${relative}`);
for(const required of ['index.html','src/android-release.js','src/android-platform.js','src/build-config.js','src/pwa.js','src/mobile-layout-v2.js','mobile-layout-v2.css'])if(!fs.existsSync(path.join(out,required)))throw new Error(`Android distribution is missing ${required}`);
console.log(`Prepared copyright-safe android-dist v${ANDROID_VERSION}.`);
