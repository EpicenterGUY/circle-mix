'use strict';

const fs = require('node:fs');
const path = 'scripts/apply-slide-trace-judgement-v1.js';
let source = fs.readFileSync(path, 'utf8');

const edits = [
  [
    '  assert.match(src, /aligned\\(a,SLIDE_JUDGEMENT_PROFILE\\.angleExtra\\)/);',
    '  assert.ok(src.includes("aligned(a,SLIDE_JUDGEMENT_PROFILE.angleExtra)"));'
  ],
  [
    '  assert.match(src, /ratio>=SLIDE_JUDGEMENT_PROFILE\\.greatHoldRatio/);',
    '  assert.ok(src.includes("ratio>=SLIDE_JUDGEMENT_PROFILE.greatHoldRatio"));'
  ],
  [
    '  assert.match(src, /ratio>=SLIDE_JUDGEMENT_PROFILE\\.perfectHoldRatio/);',
    '  assert.ok(src.includes("ratio>=SLIDE_JUDGEMENT_PROFILE.perfectHoldRatio"));'
  ],
  [
    '  assert.doesNotMatch(src, /n\\.endpointCaptured=n\\.endpointError<=/);',
    '  assert.ok(!src.includes("n.endpointCaptured=n.endpointError<="));'
  ],
  [
    '  assert.match(src, /const greatEndpoint=endpointJudgement\\.great/);',
    '  assert.ok(src.includes("const greatEndpoint=endpointJudgement.great"));'
  ]
];

for (const [before, after] of edits) {
  if (!source.includes(before)) throw new Error(`Missing generated assertion target: ${before}`);
  source = source.replace(before, after);
}

fs.writeFileSync(path, source);
console.log('Normalized generated judgement assertions.');
