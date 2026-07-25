'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const tests=[
  'tests/browser-regression.test.js',
  'tests/local-auto-browser.test.js',
  'tests/mobile-song-select-layout.test.js',
  'tests/mobile-viewport-browser.test.js',
  'tests/player-profile-browser.test.js',
  'tests/player-profile-ui-browser.test.js',
  'tests/editor-feasibility-browser.test.js'
];
const dir=process.env.BROWSER_ARTIFACTS_DIR||'artifacts/browser-regression';
fs.mkdirSync(dir,{recursive:true});
let failed=0;
for(const file of tests){
  const name=path.basename(file,'.test.js');
  const result=spawnSync(process.execPath,[file],{encoding:'utf8',env:process.env,timeout:240000,maxBuffer:16*1024*1024});
  const output=[`file=${file}`,`status=${result.status}`,`signal=${result.signal||''}`,`error=${result.error?.stack||''}`,'--- stdout ---',result.stdout||'','--- stderr ---',result.stderr||''].join('\n');
  fs.writeFileSync(path.join(dir,`${name}.log`),output);
  if(result.status!==0){failed++;console.error(`FAIL ${file} status=${result.status} signal=${result.signal||''}`);}else console.log(`PASS ${file}`);
}
if(failed){console.error(`${failed} browser regression file(s) failed`);process.exitCode=1;}else console.log('all browser regression files passed');
