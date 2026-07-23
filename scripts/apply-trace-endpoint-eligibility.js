'use strict';

const fs = require('node:fs');

function replaceOnce(source, search, replacement, label) {
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`Missing patch target: ${label}`);
  if (source.indexOf(search, first + search.length) >= 0) throw new Error(`Ambiguous patch target: ${label}`);
  return source.slice(0, first) + replacement + source.slice(first + search.length);
}

function patch(path, edits) {
  let source = fs.readFileSync(path, 'utf8');
  for (const [search, replacement, label] of edits) source = replaceOnce(source, search, replacement, label);
  fs.writeFileSync(path, source);
}

patch('src/game.js', [
  [
`  function updateTraceEndpointCapture(n,endpointError,t,profile=traceProfile()){
    n.endpointError=endpointError;
    const previousBest=Number.isFinite(n.bestEndpointError)?n.bestEndpointError:Infinity;
    n.bestEndpointError=Math.min(previousBest,endpointError);
    if(!n.endpointCaptured && endpointError<=profile.endpointGreatToleranceDeg*Math.PI/180){
      n.endpointCaptured=true;
      n.endpointCapturedAt=t;
    }
    return n.endpointCaptured;
  }
  function traceEndpointJudgement(n,end,profile=traceProfile()){
    const best=Number.isFinite(n.bestEndpointError)?n.bestEndpointError:Infinity;
    const capturedAt=Number.isFinite(n.endpointCapturedAt)?n.endpointCapturedAt:null;
    return {
      great:n.endpointCaptured===true,
      perfect:best<=profile.endpointPerfectToleranceDeg*Math.PI/180,
      onTime:capturedAt!==null && Math.abs(capturedAt-end)<=profile.endpointWindow
    };
  }`,
`  function traceEndpointCaptureEligible(n,profile=traceProfile()){
    return Number.isFinite(n.requiredTravel)
      && n.directedTravel>=n.requiredTravel*profile.greatTravelRatio
      && n.motionTime>=n.minimumMotionTime;
  }
  function updateTraceEndpointCapture(n,endpointError,t,end,profile=traceProfile()){
    n.endpointError=endpointError;
    if(!traceEndpointCaptureEligible(n,profile)) return n.endpointCaptured;
    const previousBest=Number.isFinite(n.bestEndpointError)?n.bestEndpointError:Infinity;
    n.bestEndpointError=Math.min(previousBest,endpointError);
    const greatTolerance=profile.endpointGreatToleranceDeg*Math.PI/180;
    const perfectTolerance=profile.endpointPerfectToleranceDeg*Math.PI/180;
    if(endpointError<=greatTolerance){
      if(!n.endpointCaptured){
        n.endpointCaptured=true;
        n.endpointCapturedAt=t;
      }
      if(endpointError<=perfectTolerance){
        const timingError=Math.abs(t-end);
        const previousTiming=Number.isFinite(n.bestPerfectEndpointTimingError)?n.bestPerfectEndpointTimingError:Infinity;
        n.bestPerfectEndpointTimingError=Math.min(previousTiming,timingError);
      }
    }
    return n.endpointCaptured;
  }
  function traceEndpointJudgement(n,end,profile=traceProfile()){
    const best=Number.isFinite(n.bestEndpointError)?n.bestEndpointError:Infinity;
    const perfectTiming=Number.isFinite(n.bestPerfectEndpointTimingError)?n.bestPerfectEndpointTimingError:Infinity;
    return {
      great:n.endpointCaptured===true,
      perfect:best<=profile.endpointPerfectToleranceDeg*Math.PI/180,
      onTime:perfectTiming<=profile.endpointWindow
    };
  }`,
    'TRACE endpoint eligibility helpers'
  ],
  [
`endpointCaptured:false,endpointCapturedAt:null,bestEndpointError:Infinity,completionTime:null`,
`endpointCaptured:false,endpointCapturedAt:null,bestEndpointError:Infinity,bestPerfectEndpointTimingError:Infinity,completionTime:null`,
    'TRACE endpoint timing state'
  ],
  [
`          updateTraceEndpointCapture(n,endpointError,t,profile);`,
`          updateTraceEndpointCapture(n,endpointError,t,end,profile);`,
    'TRACE endpoint update call'
  ],
  [
`        // Evaluation waits until the authored endpoint (or its small grace), so early turns must hold the endpoint.`,
`        // Evaluation waits until the authored endpoint (or its grace), while an eligible endpoint arrival stays latched.`,
    'TRACE endpoint evaluation comment'
  ]
]);

patch('tests/smoke.test.js', [
  [
`  const profile = {endpointGreatToleranceDeg:30, endpointPerfectToleranceDeg:15, endpointWindow:.25};
  const note = {endpointCaptured:false, endpointCapturedAt:null, bestEndpointError:Infinity};
  const rad = Math.PI / 180;
  assert.equal(api.updateTraceEndpointCapture(note, 10 * rad, 2.05, profile), true);
  assert.equal(note.endpointCapturedAt, 2.05);
  assert.ok(Math.abs(note.bestEndpointError - 10 * rad) < 1e-12);
  assert.equal(api.updateTraceEndpointCapture(note, 80 * rad, 2.25, profile), true);
  assert.equal(note.endpointCapturedAt, 2.05);
  assert.ok(Math.abs(note.bestEndpointError - 10 * rad) < 1e-12);
  const judgement = api.traceEndpointJudgement(note, 2, profile);
  assert.equal(judgement.great, true);
  assert.equal(judgement.perfect, true);
  assert.equal(judgement.onTime, true);
  const missed = api.traceEndpointJudgement({endpointCaptured:false,endpointCapturedAt:null,bestEndpointError:Infinity}, 2, profile);`,
`  const profile = {greatTravelRatio:.85, endpointGreatToleranceDeg:30, endpointPerfectToleranceDeg:15, endpointWindow:.25};
  const note = {requiredTravel:Math.PI*2,directedTravel:Math.PI*.4,motionTime:.2,minimumMotionTime:.12,endpointCaptured:false,endpointCapturedAt:null,bestEndpointError:Infinity,bestPerfectEndpointTimingError:Infinity};
  const rad = Math.PI / 180;
  assert.equal(api.updateTraceEndpointCapture(note, 0, 1, 2, profile), false, "a full-turn TRACE must not capture its shared start/end angle before enough travel");
  assert.equal(note.endpointCapturedAt, null);
  assert.equal(note.bestEndpointError, Infinity);
  note.directedTravel=Math.PI*2*.9;
  note.motionTime=.5;
  assert.equal(api.updateTraceEndpointCapture(note, 10 * rad, 1.6, 2, profile), true);
  assert.equal(note.endpointCapturedAt, 1.6);
  assert.ok(Math.abs(note.bestEndpointError - 10 * rad) < 1e-12);
  assert.equal(api.updateTraceEndpointCapture(note, 8 * rad, 1.95, 2, profile), true);
  assert.equal(note.endpointCapturedAt, 1.6, "the first eligible endpoint arrival stays latched");
  assert.ok(Math.abs(note.bestEndpointError - 8 * rad) < 1e-12);
  assert.ok(Math.abs(note.bestPerfectEndpointTimingError - .05) < 1e-12);
  assert.equal(api.updateTraceEndpointCapture(note, 80 * rad, 2.25, 2, profile), true);
  assert.equal(note.endpointCapturedAt, 1.6);
  assert.ok(Math.abs(note.bestEndpointError - 8 * rad) < 1e-12);
  const judgement = api.traceEndpointJudgement(note, 2, profile);
  assert.equal(judgement.great, true);
  assert.equal(judgement.perfect, true);
  assert.equal(judgement.onTime, true);
  const missed = api.traceEndpointJudgement({endpointCaptured:false,bestEndpointError:Infinity,bestPerfectEndpointTimingError:Infinity}, 2, profile);`,
    'TRACE endpoint regression scenario'
  ]
]);

patch('docs/slide-trace-judgement-v1.md', [
  [
`- The first valid endpoint arrival is latched.
- Small aim movement after that arrival cannot erase a valid endpoint capture before evaluation.
- PERFECT still requires a best endpoint error within 15 degrees and an endpoint arrival within the authored timing window.`,
`- Endpoint capture only opens after GREAT-level directed travel and the minimum motion time are satisfied, so full-turn paths cannot capture their shared start/end angle immediately.
- The first eligible endpoint arrival is latched, and small aim movement after that arrival cannot erase it before evaluation.
- PERFECT still requires a 15-degree endpoint sample inside the authored timing window; arriving early and holding the endpoint remains valid.` ,
    'TRACE judgement documentation'
  ]
]);

console.log('Applied TRACE endpoint eligibility patch.');
