#!/usr/bin/env node
'use strict'; const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..'),out=path.join(root,'desktop-dist');
if(!fs.existsSync(path.join(out,'index.html')))throw new Error('desktop-dist/index.html is missing');
const all=[]; (function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);e.isDirectory()?walk(p):all.push(p)}})(out);
const rel=all.map(p=>path.relative(out,p).replaceAll(path.sep,'/')); const forbidden=/\.(mp3|ogg|wav|flac|m4a|cmix|osz|osu|map)$/i;
if(rel.some(p=>forbidden.test(p)||/(^|\/)(assets|charts)\//.test(p)||/service-worker|manifest\.webmanifest|\.git|node_modules/.test(p)))throw new Error('desktop distribution contains a forbidden file');
const text=all.filter(p=>/\.(html|js|css)$/i.test(p)).map(p=>fs.readFileSync(p,'utf8')).join('\n');
for(const needle of ['includeBundledSongs:false','service-worker.js','assets/audio/','assets/jackets/','CircleMixGhostRuleBundle','CircleMixRoutingBundle','data:audio/'])if(needle==='includeBundledSongs:false'?!text.includes(needle):text.includes(needle))throw new Error('desktop distribution contains forbidden bundled/PWA content');
console.log(`Desktop distribution audit passed: ${all.length} files, ${all.reduce((n,p)=>n+fs.statSync(p).size,0)} bytes.`);
