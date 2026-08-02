#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'android-dist');
const VERSION='0.9.53';
const BUILD_DATE='2026-08-02';
if(!fs.existsSync(path.join(out,'index.html')))throw new Error('android-dist must be prepared before the 0.9.53 release pass');
const sourceCss=path.join(root,'song-select-fixes.css');
const targetCss=path.join(out,'song-select-fixes.css');
if(!fs.existsSync(sourceCss))throw new Error('song-select-fixes.css is missing');
fs.copyFileSync(sourceCss,targetCss);
const release=`(function(){
  "use strict";
  const release={version:"${VERSION}",date:"${BUILD_DATE}",title:"ANDROID 0.9.53",summary:"난이도와 맵·채보·노트 개수의 고정 상한을 제거한 Android 업데이트입니다.",changes:[
    {category:"DIFFICULTY",text:"20보다 높은 표시 난이도도 가져오고 내보낼 수 있으며 에디터가 레벨을 20으로 줄이지 않습니다."},
    {category:"CONTENT LIMITS",text:"LOCAL SONGS와 .cmix의 곡·채보·파일·노트 개수에 고정된 상한을 두지 않습니다."},
    {category:"LARGE PACKAGES",text:"300개 이상의 채보와 100,000개를 넘는 노트도 파일 용량 범위 안에서 검증할 수 있습니다."},
    {category:"SAFETY",text:"개별 파일·전체 압축 해제 용량, 압축률, 경로 이동과 금지 확장자 방어는 그대로 유지됩니다."},
    {category:"COMPATIBILITY",text:"기존 LOCAL 곡·채보·기록과 설정을 유지하며 0.9.52 위에 서명된 업데이트로 설치할 수 있습니다."}
  ]};
  window.CircleMixVersion=Object.freeze({version:release.version,buildDate:release.date});
  const previous=Array.isArray(window.CircleMixChangelog)?window.CircleMixChangelog:[];
  window.CircleMixChangelog=[release,...previous.filter(entry=>entry?.version!==release.version)];
})();
`;
fs.writeFileSync(path.join(out,'src/android-release.js'),release);
const validator=fs.readFileSync(path.join(out,'src/cmix-validator.js'),'utf8');
for(const removed of ['maxFiles:','maxCharts:','maxNotesPerChart:']){
  if(validator.includes(removed))throw new Error(`Android 0.9.53 payload still contains ${removed}`);
}
for(const needle of ['charts must contain at least 1 entry','notes must contain at least 1 entry','Package must contain at least 1 file','Chart level must be a finite number >= 1']){
  if(!validator.includes(needle))throw new Error(`Android 0.9.53 payload is missing ${needle}`);
}
const editorHtml=fs.readFileSync(path.join(out,'editor.html'),'utf8');
if(/id="cmixLevel"[^>]*max="20"/.test(editorHtml))throw new Error('Android 0.9.53 editor still caps levels at 20');
const editor=fs.readFileSync(path.join(out,'src/editor.js'),'utf8');
if(editor.includes('Math.min(20'))throw new Error('Android 0.9.53 editor still clamps exported levels to 20');
if(!editor.includes('mergeLocalDifficulty')&&!fs.readFileSync(path.join(out,'src/editor-playtest.js'),'utf8').includes('mergeLocalDifficulty'))throw new Error('Android 0.9.53 payload lost sibling difficulty preservation');
const css=fs.readFileSync(targetCss,'utf8');
for(const needle of ['overflow-x:auto','flex-wrap:nowrap','touch-action:pan-x','scroll-snap-type:x proximity']){
  if(!css.includes(needle))throw new Error(`Android 0.9.53 payload is missing ${needle}`);
}
console.log(`Applied Android ${VERSION} unlimited-content release pass.`);
