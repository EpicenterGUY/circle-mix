'use strict';
const assert=require('node:assert/strict');
const analyzer=require('../src/chart-feasibility.js');
const chart=(notes,bpm=120)=>({bpm,notes});
const codes=result=>result.issues.map(issue=>issue.code);

assert.equal(analyzer.signedSweep({type:'traceCW',sweepAngle:1}),1,'authored sweepAngle values are degrees');

{
  const notes=[{type:'pulse',beat:1},{type:'cut',beat:1,angle:90}];
  const snapshot=JSON.stringify(notes),result=analyzer.analyze(chart(notes));
  assert.equal(result.summary.red,0);
  assert.equal(codes(result).includes('SIMULTANEOUS_SPLIT_AIM'),false);
  assert.equal(JSON.stringify(notes),snapshot,'analysis must not mutate chart notes');
}
{
  const result=analyzer.analyze(chart([{type:'cut',beat:1,angle:0},{type:'cut',beat:1,angle:180}]));
  assert.equal(result.issues.find(x=>x.code==='SIMULTANEOUS_SPLIT_AIM')?.severity,'red');
}
{
  const result=analyzer.analyze(chart([{type:'cut',beat:0,angle:0},{type:'cut',beat:.08,angle:180}],120));
  assert.equal(result.issues.find(x=>x.code==='AIM_TRAVEL')?.severity,'red');
}
{
  const result=analyzer.analyze(chart([{type:'cut',beat:0,angle:0},{type:'cut',beat:.8,angle:90}],120));
  assert.equal(codes(result).includes('AIM_TRAVEL'),false);
}
{
  const result=analyzer.analyze(chart([{type:'traceCW',beat:0,angle:0,durationBeat:.5,sweepAngle:720}],120));
  assert.equal(result.issues.find(x=>x.code==='ROTATION_RATE')?.severity,'red');
}
{
  const result=analyzer.analyze(chart([{type:'fx',beat:0,angle:0,durationBeat:2},{type:'cut',beat:1,angle:180}],120));
  assert.equal(result.issues.find(x=>x.code==='SUSTAINED_AIM_CONFLICT')?.severity,'red');
}
{
  const result=analyzer.analyze(chart([{type:'cut',beat:0,angle:0},{type:'cut',beat:.16,angle:100},{type:'cut',beat:.32,angle:0}],120));
  assert.ok(['orange','red'].includes(result.issues.find(x=>x.code==='RAPID_REVERSAL')?.severity));
}
{
  const result=analyzer.analyze(chart([{type:'fx',beat:0,angle:45,durationBeat:2},{type:'slideCW',beat:2,angle:45,durationBeat:1,sweepAngle:90}],120));
  assert.equal(codes(result).includes('SUSTAINED_HANDOFF_AIM'),false,'same-angle HOLD to SLIDE handoff is a valid BLOOM connection');
  assert.equal(result.summary.red,0);
}
{
  const result=analyzer.analyze(chart([{type:'fx',beat:0,angle:45,durationBeat:2},{type:'slideCW',beat:2.06,angle:45,durationBeat:1,sweepAngle:90}],120));
  assert.equal(codes(result).includes('SUSTAINED_HANDOFF_AIM'),false,'same-angle BLOOM handoff stays valid inside the 36ms grace window');
  assert.equal(codes(result).includes('AIM_TRAVEL'),false);
}
{
  const result=analyzer.analyze(chart([{type:'fx',beat:0,angle:0,durationBeat:2},{type:'slideCW',beat:2,angle:120,durationBeat:1,sweepAngle:90}],120));
  assert.equal(result.issues.find(x=>x.code==='SUSTAINED_HANDOFF_AIM')?.severity,'red','off-angle zero-gap handoffs must remain physically invalid');
}
{
  const result=analyzer.analyze(chart([{type:'cut',beat:0,angle:0},{type:'traceCW',beat:.16,angle:100,durationBeat:1,sweepAngle:90},{type:'cut',beat:.32,angle:0}],120));
  assert.equal(codes(result).includes('RAPID_REVERSAL'),false,'sustained path starts must not create instant-reversal warnings');
}
{
  const result=analyzer.analyze(chart([{type:'cut',beat:0,angle:0},{type:'cut',beat:0,angle:180},{type:'traceCW',beat:1,angle:0,durationBeat:.5,sweepAngle:720}],120));
  assert.equal(result.summary.total,result.issues.length);
  assert.equal(result.highestByNote[0],'red');
  assert.equal(result.ok,false);
}
console.log('chart feasibility tests passed');