#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');

const root=path.resolve(__dirname,'..');
const desktopOut=path.join(root,'desktop-dist');
const out=path.join(root,'android-dist');
const ANDROID_VERSION='0.9.45';
const ANDROID_BUILD_DATE='2026-07-27';

function run(script){execFileSync(process.execPath,[path.join(root,script)],{cwd:root,stdio:'inherit'});}
function replaceOrThrow(source,search,replacement,label){const next=source.replace(search,replacement);if(next===source)throw new Error(`Unable to ${label}.`);return next;}

run('scripts/prepare-desktop.js');
run('scripts/pc-settings-desktop-pass.js');
fs.rmSync(out,{recursive:true,force:true});
fs.cpSync(desktopOut,out,{recursive:true});

for(const file of ['src/desktop-release.js','src/desktop-updater.js'])fs.rmSync(path.join(out,file),{force:true});
for(const file of ['src/android-platform.js','src/android-updater.js'])fs.copyFileSync(path.join(root,file),path.join(out,file));

let index=fs.readFileSync(path.join(out,'index.html'),'utf8').replace(/\r\n/g,'\n');
index=replaceOrThrow(index,'<script src="./src/desktop-release.js"></script>','<script src="./src/android-release.js"></script>','replace desktop release metadata');
index=replaceOrThrow(index,'<script src="./src/desktop-updater.js"></script>','<script src="./src/android-platform.js"></script>\n<script src="./src/android-updater.js"></script>','inject the Android platform and updater bridges');
if(index.includes('desktop-updater.js')||index.includes('desktop-release.js'))throw new Error('Android index still loads desktop-only scripts.');
fs.writeFileSync(path.join(out,'index.html'),index);

const sharedBootstrap=fs.readFileSync(path.join(root,'src/build-config.js'),'utf8');
const androidSeed="window.CircleMixBuildConfig={target:'android',includeBundledSongs:false,enableServiceWorker:false,enablePwaInstallUi:false,enableSignedUpdater:true,enableAndroidUpdater:true,nativeAndroid:true};\n";
fs.writeFileSync(path.join(out,'src/build-config.js'),androidSeed+sharedBootstrap);

const androidRelease=`(function(){
  "use strict";
  const release={version:"${ANDROID_VERSION}",date:"${ANDROID_BUILD_DATE}",title:"ANDROID AUTO UPDATE",summary:"GitHub Releases 기반 Android 앱 업데이트 확인과 안전한 APK 설치 흐름을 추가했습니다.",changes:[
    {category:"UPDATE",text:"앱 실행 시 최신 Android Release를 확인하고 설정의 시스템 카테고리에서도 수동 확인할 수 있습니다."},
    {category:"VERIFY",text:"GitHub Release asset의 SHA-256 digest와 다운로드한 APK를 대조한 뒤에만 설치를 진행합니다."},
    {category:"INSTALL",text:"Android PackageInstaller를 사용하며 최초 한 번은 ‘이 출처의 앱 설치 허용’ 승인이 필요합니다."},
    {category:"SIGNING",text:"정식 업데이트 Release는 GitHub Secrets에 저장된 동일한 영구 서명키로만 게시합니다."}
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
for(const required of ['index.html','src/android-release.js','src/android-platform.js','src/android-updater.js','src/build-config.js','src/pwa.js','src/mobile-layout-v2.js','mobile-layout-v2.css'])if(!fs.existsSync(path.join(out,required)))throw new Error(`Android distribution is missing ${required}`);
console.log(`Prepared copyright-safe android-dist v${ANDROID_VERSION}.`);
