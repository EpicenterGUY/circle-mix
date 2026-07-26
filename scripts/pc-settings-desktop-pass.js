#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'desktop-dist');
const required=[
  ['pc-settings.css','pc-settings.css'],
  ['src/pc-settings.js','src/pc-settings.js'],
  ['mobile-layout-v2.css','mobile-layout-v2.css'],
  ['src/mobile-layout-v2.js','src/mobile-layout-v2.js']
];
if(!fs.existsSync(path.join(out,'index.html')))throw new Error('desktop-dist must be prepared before the settings asset pass');
for(const [sourceRelative,targetRelative] of required){
  const source=path.join(root,sourceRelative),target=path.join(out,targetRelative);
  if(!fs.existsSync(source))throw new Error(`missing settings asset: ${sourceRelative}`);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(source,target);
}
const sharedBootstrap=fs.readFileSync(path.join(root,'src/build-config.js'),'utf8');
const desktopSeed="window.CircleMixBuildConfig={target:'desktop',includeBundledSongs:false,enableServiceWorker:false,enablePwaInstallUi:false,enableSignedUpdater:true};\n";
const desktopBootstrap=desktopSeed+sharedBootstrap;
for(const asset of ['pc-settings.css','src/pc-settings.js','mobile-layout-v2.css','src/mobile-layout-v2.js'])if(!desktopBootstrap.includes(asset))throw new Error(`settings asset loader is missing ${asset}`);
fs.writeFileSync(path.join(out,'src/build-config.js'),desktopBootstrap);
for(const [,targetRelative] of required)if(!fs.existsSync(path.join(out,targetRelative)))throw new Error(`settings desktop copy failed: ${targetRelative}`);
console.log('Applied unified PC and mobile settings desktop pass.');