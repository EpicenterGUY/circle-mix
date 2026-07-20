const assert=require('assert/strict');
const L=require('../src/local-library.js');
const record={id:'local-test',source:'local',title:'Test',artist:'Tester',bpm:120,updatedAt:new Date().toISOString(),audioBlob:new Blob(['audio']),difficulties:{normal:{label:'NORMAL'}},charts:{normal:{notes:[{type:'cut',beat:1,angle:0}]}}};
assert.equal(L.VERSION,3);assert.equal(L.validateStoredRecord(record).ok,true);assert.equal(L.validateStoredRecord({...record,audioBlob:null}).status,'broken');assert(L.estimateRecordBytes(record)>=record.audioBlob.size);assert.equal(L.normalizeError({name:'QuotaExceededError'}).code,'QUOTA_EXCEEDED');console.log('local library pure logic tests passed');
