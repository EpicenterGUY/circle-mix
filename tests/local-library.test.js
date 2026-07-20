const assert=require('assert/strict');
const {spawnSync}=require('child_process');
const L=require('../src/local-library.js');
const record={id:'local-test',source:'local',title:'Test',artist:'Tester',bpm:120,updatedAt:new Date().toISOString(),audioBlob:new Blob(['audio']),difficulties:{normal:{label:'NORMAL'}},charts:{normal:{notes:[{type:'cut',beat:1,angle:0}]}}};
assert.equal(L.VERSION,3);assert.equal(L.validateStoredRecord(record).ok,true);assert.equal(L.validateStoredRecord({...record,audioBlob:null}).status,'broken');assert(L.estimateRecordBytes(record)>=record.audioBlob.size);assert.equal(L.normalizeError({name:'QuotaExceededError'}).code,'QUOTA_EXCEEDED');
// Node supplies BroadcastChannel, but merely requiring this browser library must not retain its handle.
const child=spawnSync(process.execPath,['-e',"require('./src/local-library.js'); console.log('exited')"],{cwd:process.cwd(),timeout:2000,encoding:'utf8'});
assert.equal(child.status,0,child.stderr||child.error?.message);assert.equal(child.stdout.trim(),'exited');
L.dispose().then(()=>console.log('local library pure logic and handle cleanup tests passed'));
