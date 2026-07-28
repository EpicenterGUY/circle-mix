#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'android-dist');
const VERSION='0.9.49';
const BUILD_DATE='2026-07-28';
if(!fs.existsSync(path.join(out,'index.html')))throw new Error('android-dist must be prepared before the 0.9.49 release pass');
const sourceCss=path.join(root,'song-select-fixes.css');
const targetCss=path.join(out,'song-select-fixes.css');
if(!fs.existsSync(sourceCss))throw new Error('song-select-fixes.css is missing');
fs.copyFileSync(sourceCss,targetCss);
const release=`(function(){
  "use strict";
  const release={version:"${VERSION}",date:"${BUILD_DATE}",title:"ANDROID 0.9.49",summary:"곡 목록 스크롤과 LOCAL 난이도 정렬을 수정한 Android 업데이트입니다.",changes:[
    {category:"SONG SELECT",text:"곡이 5개를 넘어도 첫 곡부터 마지막 곡까지 위아래 스크롤로 모두 접근할 수 있습니다."},
    {category:"LOCAL",text:"LOCAL .cmix 난이도를 숫자 레벨 기준 쉬운 순서부터 어려운 순서로 표시합니다."},
    {category:"MOBILE AIM",text:"BALANCED·PRECISION·SPEED 상대 이동 프리셋과 ABSOLUTE 모드를 계속 사용할 수 있습니다."},
    {category:"COMPATIBILITY",text:"판정, 점수, 기록, 채보와 기존 LOCAL .cmix 데이터는 그대로 유지됩니다."}
  ]};
  window.CircleMixVersion=Object.freeze({version:release.version,buildDate:release.date});
  const previous=Array.isArray(window.CircleMixChangelog)?window.CircleMixChangelog:[];
  window.CircleMixChangelog=[release,...previous.filter(entry=>entry?.version!==release.version)];
})();
`;
fs.writeFileSync(path.join(out,'src/android-release.js'),release);
const bootstrap=fs.readFileSync(path.join(out,'src/build-config.js'),'utf8');
for(const needle of ['song-select-fixes.css','sortLocalDifficultyOrder']){
  const file=needle.endsWith('.css')?bootstrap:fs.readFileSync(path.join(out,'src/song-record.js'),'utf8');
  if(!file.includes(needle))throw new Error(`Android 0.9.49 payload is missing ${needle}`);
}
console.log(`Applied Android ${VERSION} song-library release pass.`);
