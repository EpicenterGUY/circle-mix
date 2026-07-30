#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'android-dist');
const VERSION='0.9.51';
const BUILD_DATE='2026-07-31';
if(!fs.existsSync(path.join(out,'index.html')))throw new Error('android-dist must be prepared before the 0.9.51 release pass');
const sourceCss=path.join(root,'song-select-fixes.css');
const targetCss=path.join(out,'song-select-fixes.css');
if(!fs.existsSync(sourceCss))throw new Error('song-select-fixes.css is missing');
fs.copyFileSync(sourceCss,targetCss);
const release=`(function(){
  "use strict";
  const release={version:"${VERSION}",date:"${BUILD_DATE}",title:"ANDROID 0.9.51",summary:"채보 난이도를 선택하면 정확도별 예상 POWER를 바로 확인할 수 있는 업데이트입니다.",changes:[
    {category:"POWER FORECAST",text:"선택한 채보의 90%·95%·97%·99%·100% 정확도 예상 POWER를 곡 선택 화면에 표시합니다."},
    {category:"CONDITION",text:"예상치는 FC·MISS 0 기준이며 실제 결과 POWER와 완전히 같은 산식을 사용합니다."},
    {category:"DIFFICULTY",text:"난이도를 변경하면 해당 채보의 자동 계산 별 난이도에 맞춰 POWER 표가 즉시 갱신됩니다."},
    {category:"COMPATIBILITY",text:"기존 LOCAL 곡·채보·기록과 설정을 유지하며 0.9.50 위에 서명된 업데이트로 설치할 수 있습니다."}
  ]};
  window.CircleMixVersion=Object.freeze({version:release.version,buildDate:release.date});
  const previous=Array.isArray(window.CircleMixChangelog)?window.CircleMixChangelog:[];
  window.CircleMixChangelog=[release,...previous.filter(entry=>entry?.version!==release.version)];
})();
`;
fs.writeFileSync(path.join(out,'src/android-release.js'),release);
const bootstrap=fs.readFileSync(path.join(out,'src/build-config.js'),'utf8');
if(!bootstrap.includes('song-select-fixes.css'))throw new Error('Android 0.9.51 payload is missing song-select-fixes.css');
for(const [file,needle] of [
  ['src/power.js','previewForStars'],
  ['src/game.js','powerPreviewHtml'],
  ['src/game.js','FC · MISS 0 기준'],
  ['src/song-record.js','sortDifficultyEntriesByStars'],
  ['src/editor-playtest.js','mergeLocalDifficulty']
]){
  const source=fs.readFileSync(path.join(out,file),'utf8');
  if(!source.includes(needle))throw new Error(`Android 0.9.51 payload is missing ${needle} in ${file}`);
}
console.log(`Applied Android ${VERSION} accuracy POWER forecast release pass.`);
