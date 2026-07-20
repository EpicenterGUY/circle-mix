const assert=require('assert');const importer=require('../src/cmix-importer.js');
function crc(d){let c=0xffffffff;for(const x of d){c^=x;for(let i=0;i<8;i++)c=(c&1?0xedb88320^(c>>>1):c>>>1)>>>0}return(c^0xffffffff)>>>0}function zip(files){let parts=[],central=[],offset=0;for(const [name,text] of Object.entries(files)){const d=Buffer.from(text),n=Buffer.from(name);const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50,0);h.writeUInt16LE(20,4);h.writeUInt32LE(crc(d),14);h.writeUInt32LE(d.length,18);h.writeUInt32LE(d.length,22);h.writeUInt16LE(n.length,26);parts.push(h,n,d);const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt32LE(crc(d),16);c.writeUInt32LE(d.length,20);c.writeUInt32LE(d.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);central.push(c,n);offset+=30+n.length+d.length;}const cs=Buffer.concat(central),e=Buffer.alloc(22);e.writeUInt32LE(0x06054b50);e.writeUInt16LE(Object.keys(files).length,8);e.writeUInt16LE(Object.keys(files).length,10);e.writeUInt32LE(cs.length,12);e.writeUInt32LE(offset,16);const out=Buffer.concat([...parts,cs,e]);return out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength);}
const chart={format:'circle-mix-chart',formatVersion:1,id:'easy',notes:[{type:'cut',beat:0,angle:0}]};const manifest={format:'circle-mix-song',formatVersion:1,packageType:'chart',packageVersion:1,id:'test-song',title:'<b>Safe</b>',artist:'Artist',bpm:120,audioMatch:{durationSeconds:1},charts:[{id:'easy',name:'EASY',level:1,file:'charts/easy.json'}]};
(async()=>{let r=await importer.inspect({name:'test.cmix',size:1,arrayBuffer:async()=>zip({'manifest.json':JSON.stringify(manifest),'charts/easy.json':JSON.stringify(chart)})});assert.equal(r.ok,true);r=await importer.inspect({name:'bad.cmix',size:1,arrayBuffer:async()=>zip({'charts/easy.json':'{}'})});assert.equal(r.errors[0].code,'MISSING_MANIFEST');console.log('cmix importer tests passed');})().catch(e=>{console.error(e);process.exit(1)});

const LocalInstall = require('../src/cmix-local-install.js');
(function testLocalInstallRecord(){
  const blob = new Blob(['audio'], {type:'audio/ogg'});
  const pkg={manifest:{id:'install-test',packageType:'full',packageVersion:2,title:'Install Test',artist:'Tester',bpm:120,offset:0,preview:{startSeconds:3,durationSeconds:9},charts:[{id:'normal',name:'NORMAL',level:4,style:'TECH',file:'charts/normal.json'}]},charts:{'charts/normal.json':{notes:[{type:'cut',beat:1,angle:0}]}},audioBlob:blob,jacketBlob:new Blob(['jacket'],{type:'image/png'}),packageHash:'sha256:test',sourceFileName:'install-test.cmix'};
  const record=LocalInstall.recordFromPackage(pkg,'2026-07-20T00:00:00.000Z');
  assert.equal(record.id,'install-test'); assert.equal(record.source,'local'); assert.equal(record.cmixInstalled,true); assert.equal(record.difficulties.normal.level,4); assert.equal(record.charts.normal.notes.length,1); assert.equal(record.previewStart,3); assert.equal(record.packageHash,'sha256:test');
  assert.equal(LocalInstall.replacementInfo({packageVersion:1,charts:{old:{}}},record).kind,'upgrade');
  assert.equal(LocalInstall.replacementInfo({charts:{}},record).kind,'editor-conflict');
})();

(function testChartLinkedAudioRecord(){
 const blob=new Blob(['ID3 linked audio']); const pkg={manifest:{id:'chart-link',packageType:'chart',packageVersion:1,title:'Chart',artist:'Artist',bpm:120,audioMatch:{durationSeconds:10,durationToleranceSeconds:2,sha256:'a'.repeat(64)},charts:[{id:'easy',name:'EASY',level:1,file:'charts/easy.json'}]},charts:{'charts/easy.json':{notes:[{type:'cut'}]}}};
 const r=LocalInstall.recordFromChartPackage(pkg,{blob,fileName:'music.mp3',audioType:'audio/mpeg',duration:10,sha256:'a'.repeat(64),tolerance:2,matchMethod:'exact-hash'}); assert.equal(r.packageType,'chart');assert.equal(r.linkedAudio,true);assert.equal(r.matchMethod,'exact-hash');assert.equal(r.localAudioFileName,'music.mp3');
})();
(async function testHostileZipBoundaries(){
 const exporter=require('../src/cmix-exporter.js');
 const manifestBytes=JSON.stringify(manifest), chartBytes=JSON.stringify(chart);
 const bytes=exporter.createZip([{path:'manifest.json',data:manifestBytes},{path:'charts/easy.json',data:chartBytes}]);
 const corrupted=new Uint8Array(bytes); corrupted[30+Buffer.byteLength('manifest.json')+1]^=1;
 const bad=await importer.inspect(Object.assign(new Blob([corrupted],{type:'application/vnd.circle-mix.cmix'}),{name:'corrupt.cmix'}));
 bad.ok===false&&assert.equal(bad.errors[0].code,'CRC_MISMATCH');
 const controller=new AbortController();controller.abort();
 const aborted=await importer.inspect(Object.assign(new Blob([bytes]),{name:'abort.cmix'}),{signal:controller.signal});
 assert.equal(aborted.ok,false);assert.equal(aborted.errors[0].code,'IMPORT_ABORTED');
 console.log('cmix hostile ZIP tests passed');
})().catch(e=>{console.error(e);process.exit(1)});
