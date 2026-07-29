#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'android-dist');
const VERSION='0.9.50';
const BUILD_DATE='2026-07-29';
if(!fs.existsSync(path.join(out,'index.html')))throw new Error('android-dist must be prepared before the 0.9.50 release pass');
const sourceCss=path.join(root,'song-select-fixes.css');
const targetCss=path.join(out,'song-select-fixes.css');
if(!fs.existsSync(sourceCss))throw new Error('song-select-fixes.css is missing');
fs.copyFileSync(sourceCss,targetCss);
const release=`(function(){
  "use strict";
  const release={version:"${VERSION}",date:"${BUILD_DATE}",title:"ANDROID 0.9.50",summary:"LOCAL 난이도를 실제 표시 별 기준으로 정렬하고 에디터 플레이테스트 저장 안전성을 보강한 Android 업데이트입니다.",changes:[
    {category:"LOCAL ORDER",text:"LOCAL 난이도를 화면에 표시되는 자동 계산 별 기준으로 쉬운 순서부터 어려운 순서로 표시합니다."},
    {category:"EDITOR",text:"한 난이도를 저장하거나 플레이테스트해도 같은 곡의 다른 난이도와 채보를 그대로 보존합니다."},
    {category:"PLAYTEST",text:"에디터에서 현재 채보를 공식 게임 판정으로 바로 열고 테스트 전용 판정·노트·접근 설정을 사용할 수 있습니다."},
    {category:"COMPATIBILITY",text:"기존 LOCAL 곡·채보·기록을 유지하며 0.9.49 위에 서명된 업데이트로 설치할 수 있습니다."}
  ]};
  window.CircleMixVersion=Object.freeze({version:release.version,buildDate:release.date});
  const previous=Array.isArray(window.CircleMixChangelog)?window.CircleMixChangelog:[];
  window.CircleMixChangelog=[release,...previous.filter(entry=>entry?.version!==release.version)];
})();
`;
fs.writeFileSync(path.join(out,'src/android-release.js'),release);
const bootstrap=fs.readFileSync(path.join(out,'src/build-config.js'),'utf8');
if(!bootstrap.includes('song-select-fixes.css'))throw new Error('Android 0.9.50 payload is missing song-select-fixes.css');
for(const [file,needle] of [
  ['src/song-record.js','sortDifficultyEntriesByStars'],
  ['src/game.js','sortDifficultyEntriesByStars'],
  ['src/editor-playtest.js','mergeLocalDifficulty'],
  ['src/game.js','editorPlaytestSession']
]){
  const source=fs.readFileSync(path.join(out,file),'utf8');
  if(!source.includes(needle))throw new Error(`Android 0.9.50 payload is missing ${needle} in ${file}`);
}
console.log(`Applied Android ${VERSION} LOCAL difficulty and editor playtest release pass.`);
