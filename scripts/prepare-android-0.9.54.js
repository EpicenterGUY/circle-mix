#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'android-dist');
const VERSION='0.9.54';
const BUILD_DATE='2026-08-02';
if(!fs.existsSync(path.join(out,'index.html')))throw new Error('android-dist must be prepared before the 0.9.54 release pass');
const sourceCss=path.join(root,'song-select-fixes.css');
const targetCss=path.join(out,'song-select-fixes.css');
if(!fs.existsSync(sourceCss))throw new Error('song-select-fixes.css is missing');
fs.copyFileSync(sourceCss,targetCss);
const release=`(function(){
  "use strict";
  const release={version:"${VERSION}",date:"${BUILD_DATE}",title:"ANDROID 0.9.54",summary:"난이도와 맵·채보·노트 개수의 고정 상한을 제거한 Android 업데이트입니다.",changes:[
    {category:"LEVEL",text:"LOCAL 난이도 버튼과 곡 목록에 작성 LEVEL을 그대로 표시합니다."},
    {category:"AUTO",text:"자동 난이도를 별도 AUTO 값으로 표시하며 15★ 이상의 결과도 자르지 않습니다."},
    {category:"POWER",text:"정렬과 POWER는 자동 별을 계속 사용해 작성 LEVEL 조작의 영향을 받지 않습니다."},
    {category:"CONTENT LIMITS",text:"곡·채보·파일·노트 개수의 고정 상한 해제와 보안 용량 검사는 그대로 유지됩니다."},
    {category:"COMPATIBILITY",text:"기존 LOCAL 곡·채보·기록과 설정을 유지하며 0.9.53 위에 서명된 업데이트로 설치할 수 있습니다."}
  ]};
  window.CircleMixVersion=Object.freeze({version:release.version,buildDate:release.date});
  const previous=Array.isArray(window.CircleMixChangelog)?window.CircleMixChangelog:[];
  window.CircleMixChangelog=[release,...previous.filter(entry=>entry?.version!==release.version)];
})();
`;
fs.writeFileSync(path.join(out,'src/android-release.js'),release);
const difficulty=fs.readFileSync(path.join(out,'src/chart-difficulty.js'),'utf8');
if(!difficulty.includes('MAX_STARS=Number.POSITIVE_INFINITY'))throw new Error('Android 0.9.54 automatic difficulty is still capped');
const game=fs.readFileSync(path.join(out,'src/game.js'),'utf8');
for(const needle of ['declaredDifficultyLevel','formatDifficultyView'])if(!game.includes(needle))throw new Error(`Android 0.9.54 payload is missing ${needle}`);
const validator=fs.readFileSync(path.join(out,'src/cmix-validator.js'),'utf8');
for(const removed of ['maxFiles:','maxCharts:','maxNotesPerChart:']){
  if(validator.includes(removed))throw new Error(`Android 0.9.54 payload still contains ${removed}`);
}
for(const needle of ['charts must contain at least 1 entry','notes must contain at least 1 entry','Package must contain at least 1 file','Chart level must be a finite number >= 1']){
  if(!validator.includes(needle))throw new Error(`Android 0.9.54 payload is missing ${needle}`);
}
const editorHtml=fs.readFileSync(path.join(root,'editor.html'),'utf8');
if(/id="cmixLevel"[^>]*max="20"/.test(editorHtml))throw new Error('CIRCLE MIX editor still caps levels at 20');
const editor=fs.readFileSync(path.join(root,'src/editor.js'),'utf8');
if(editor.includes('Math.min(20'))throw new Error('CIRCLE MIX editor still clamps exported levels to 20');
const editorPlaytest=fs.readFileSync(path.join(out,'src/editor-playtest.js'),'utf8');
if(!editorPlaytest.includes('mergeLocalDifficulty'))throw new Error('Android 0.9.54 payload lost sibling difficulty preservation');
const css=fs.readFileSync(targetCss,'utf8');
for(const needle of ['overflow-x:auto','flex-wrap:nowrap','touch-action:pan-x','scroll-snap-type:x proximity']){
  if(!css.includes(needle))throw new Error(`Android 0.9.54 payload is missing ${needle}`);
}
console.log(`Applied Android ${VERSION} unlimited-content release pass.`);
