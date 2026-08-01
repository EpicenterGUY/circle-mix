#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'android-dist');
const VERSION='0.9.52';
const BUILD_DATE='2026-08-01';
if(!fs.existsSync(path.join(out,'index.html')))throw new Error('android-dist must be prepared before the 0.9.52 release pass');
const sourceCss=path.join(root,'song-select-fixes.css');
const targetCss=path.join(out,'song-select-fixes.css');
if(!fs.existsSync(sourceCss))throw new Error('song-select-fixes.css is missing');
fs.copyFileSync(sourceCss,targetCss);
const release=`(function(){
  "use strict";
  const release={version:"${VERSION}",date:"${BUILD_DATE}",title:"ANDROID 0.9.52",summary:"난이도가 많은 맵에서도 모든 난이도를 끝까지 선택할 수 있도록 곡 선택 화면을 개선했습니다.",changes:[
    {category:"DIFFICULTY LIST",text:"난이도 버튼이 화면 밖에서 잘리지 않고 한 줄 가로 목록으로 유지됩니다."},
    {category:"MOBILE",text:"모바일에서는 난이도 목록을 손가락으로 좌우 스와이프해 마지막 난이도까지 선택할 수 있습니다."},
    {category:"LAYOUT",text:"세로·가로 화면과 폴더블 화면에서 곡 선택 하단 영역이 다른 버튼을 밀어내지 않도록 수정했습니다."},
    {category:"COMPATIBILITY",text:"기존 LOCAL 곡·채보·기록과 설정을 유지하며 0.9.51 위에 서명된 업데이트로 설치할 수 있습니다."}
  ]};
  window.CircleMixVersion=Object.freeze({version:release.version,buildDate:release.date});
  const previous=Array.isArray(window.CircleMixChangelog)?window.CircleMixChangelog:[];
  window.CircleMixChangelog=[release,...previous.filter(entry=>entry?.version!==release.version)];
})();
`;
fs.writeFileSync(path.join(out,'src/android-release.js'),release);
const bootstrap=fs.readFileSync(path.join(out,'src/build-config.js'),'utf8');
if(!bootstrap.includes('song-select-fixes.css'))throw new Error('Android 0.9.52 payload is missing song-select-fixes.css');
const css=fs.readFileSync(targetCss,'utf8');
for(const needle of ['overflow-x:auto','flex-wrap:nowrap','touch-action:pan-x','scroll-snap-type:x proximity']){
  if(!css.includes(needle))throw new Error(`Android 0.9.52 payload is missing ${needle}`);
}
for(const [file,needle] of [
  ['src/cmix-import-ui.js','installDifficultyScroller'],
  ['src/song-record.js','sortDifficultyEntriesByStars'],
  ['src/editor-playtest.js','mergeLocalDifficulty']
]){
  const source=fs.readFileSync(path.join(out,file),'utf8');
  if(!source.includes(needle))throw new Error(`Android 0.9.52 payload is missing ${needle} in ${file}`);
}
console.log(`Applied Android ${VERSION} difficulty overflow release pass.`);
