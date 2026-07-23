'use strict';

const fs = require('node:fs');

function replaceOnce(source, search, replacement, label) {
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`Missing patch target: ${label}`);
  if (source.indexOf(search, first + search.length) >= 0) throw new Error(`Ambiguous patch target: ${label}`);
  return source.slice(0, first) + replacement + source.slice(first + search.length);
}

function patchFile(path, edits) {
  let source = fs.readFileSync(path, 'utf8');
  for (const [search, replacement, label] of edits) source = replaceOnce(source, search, replacement, label);
  fs.writeFileSync(path, source);
}

patchFile('src/game.js', [
  [
`  const TRACE_PROFILES = {
    normal:{...COMMON_TRACE_PROFILE},
    tutorial:{...COMMON_TRACE_PROFILE}
  };
  const TRACE_SWING_LINK_MIN = .15;`,
`  const TRACE_PROFILES = {
    normal:{...COMMON_TRACE_PROFILE},
    tutorial:{...COMMON_TRACE_PROFILE}
  };
  const SLIDE_JUDGEMENT_PROFILE = Object.freeze({
    // DIAL_ARC_HALF is 13.5 degrees; + .025 PI gives an 18 degree total window.
    angleExtra:.025,
    greatHoldRatio:.52,
    perfectHoldRatio:.84
  });
  const TRACE_SWING_LINK_MIN = .15;`,
    'slide judgement profile'
  ],
  [
`  function traceProfile(){ return TRACE_PROFILES.normal; }
  // Kept for diagnostics and guide rendering: TRACE has an angular start gate only.`,
`  function traceProfile(){ return TRACE_PROFILES.normal; }
  function updateTraceEndpointCapture(n,endpointError,t,profile=traceProfile()){
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
  }
  // Kept for diagnostics and guide rendering: TRACE has an angular start gate only.`,
    'trace endpoint helpers'
  ],
  [
`    const extra = family === "slide" ? .010 : (family === "hold" ? .020 : .015);`,
`    const extra = family === "slide" ? SLIDE_JUDGEMENT_PROFILE.angleExtra : (family === "hold" ? .020 : .015);`,
    'slide guide tolerance'
  ],
  [
`    if((n.endpointError||Infinity) > profile.endpointGreatToleranceDeg*Math.PI/180) return "ENDPOINT MISSED";`,
`    if(!n.endpointCaptured) return "ENDPOINT MISSED";`,
    'trace failure latch'
  ],
  [
`        if(n.requiredTravel===undefined) Object.assign(n,{requiredTravel:traceRequiredTravel(n),directedTravel:0,reverseTravel:0,progressRatio:0,startCaptured:false,endpointCaptured:false,completionTime:null,failReason:null,motionTime:0,minimumMotionTime:traceMinimumMotionTime(traceRequiredTravel(n),n.duration)});`,
`        if(n.requiredTravel===undefined) Object.assign(n,{requiredTravel:traceRequiredTravel(n),directedTravel:0,reverseTravel:0,progressRatio:0,startCaptured:false,endpointCaptured:false,endpointCapturedAt:null,bestEndpointError:Infinity,completionTime:null,failReason:null,motionTime:0,minimumMotionTime:traceMinimumMotionTime(traceRequiredTravel(n),n.duration)});`,
    'trace runtime endpoint state'
  ],
  [
`          n.endpointError=distAng(judgementAimAngle,motion.finalAngle);
          n.endpointCaptured=n.endpointError<=profile.endpointGreatToleranceDeg*Math.PI/180;`,
`          const endpointError=distAng(judgementAimAngle,motion.finalAngle);
          updateTraceEndpointCapture(n,endpointError,t,profile);`,
    'sticky trace endpoint capture'
  ],
  [
`          const greatEndpoint=n.endpointError<=profile.endpointGreatToleranceDeg*Math.PI/180;
          const perfectEndpoint=n.endpointError<=profile.endpointPerfectToleranceDeg*Math.PI/180;
          const onTime=Math.abs((n.completionTime||end)-end)<=profile.endpointWindow;`,
`          const endpointJudgement=traceEndpointJudgement(n,end,profile);
          const greatEndpoint=endpointJudgement.great;
          const perfectEndpoint=endpointJudgement.perfect;
          const onTime=endpointJudgement.onTime;`,
    'trace endpoint grading'
  ],
  [
`          if(passed){ const perfect=perfectTravel&&perfectReverse&&perfectEndpoint&&onTime; n.completionTime=t; addWave(motion.finalAngle,COLORS.trace); addRingBurst(COLORS.trace,.42,"END"); judge(n,perfect?"PERFECT":"GREAT",COLORS.trace,{source:isAutoActive()?"auto":(tutorialState.activeInput||"pointer"),reason:isAutoActive()?"AUTO_JUDGEMENT":"USER_JUDGEMENT"}); }`,
`          if(passed){ const perfect=perfectTravel&&perfectReverse&&perfectEndpoint&&onTime; n.completionTime=Number.isFinite(n.endpointCapturedAt)?n.endpointCapturedAt:t; addWave(motion.finalAngle,COLORS.trace); addRingBurst(COLORS.trace,.42,"END"); judge(n,perfect?"PERFECT":"GREAT",COLORS.trace,{source:isAutoActive()?"auto":(tutorialState.activeInput||"pointer"),reason:isAutoActive()?"AUTO_JUDGEMENT":"USER_JUDGEMENT"}); }`,
    'trace completion timestamp'
  ],
  [
`        const held=isAutoActive() || (filterHeld&&aligned(a,.010));`,
`        const held=isAutoActive() || (filterHeld&&aligned(a,SLIDE_JUDGEMENT_PROFILE.angleExtra));`,
    'slide active tolerance'
  ],
  [
`          if(ratio>=.58)judge(n,ratio>.88?"PERFECT":"GREAT",color,{source:tutorialState.activeInput||"keyboard",reason:"USER_JUDGEMENT"});`,
`          if(ratio>=SLIDE_JUDGEMENT_PROFILE.greatHoldRatio)judge(n,ratio>=SLIDE_JUDGEMENT_PROFILE.perfectHoldRatio?"PERFECT":"GREAT",color,{source:tutorialState.activeInput||"keyboard",reason:"USER_JUDGEMENT"});`,
    'slide hold thresholds'
  ]
]);

patchFile('tests/smoke.test.js', [
  [
` difficultyViewForSong, getActiveDifficultyLabel, localChartEntries, tutorialSteps, buildTutorialStepRuntime,
 formatStarValue, formatDifficulty, renderSongSelect, resolveSelectedSong,`,
` difficultyViewForSong, getActiveDifficultyLabel, localChartEntries, tutorialSteps, buildTutorialStepRuntime,
 SLIDE_JUDGEMENT_PROFILE, updateTraceEndpointCapture, traceEndpointJudgement, traceProfile,
 formatStarValue, formatDifficulty, renderSongSelect, resolveSelectedSong,`,
    'smoke judgement exports'
  ],
  [
`test("input mapping and pointer fallback policies stay static", () => {`,
`test("SLIDE judgement profile keeps sustained tracking humanly achievable", () => {
  assert.equal(api.SLIDE_JUDGEMENT_PROFILE.angleExtra, .025);
  assert.equal(api.SLIDE_JUDGEMENT_PROFILE.greatHoldRatio, .52);
  assert.equal(api.SLIDE_JUDGEMENT_PROFILE.perfectHoldRatio, .84);
  const totalToleranceDeg = 13.5 + api.SLIDE_JUDGEMENT_PROFILE.angleExtra * 180;
  assert.equal(totalToleranceDeg, 18);
  const src = fs.readFileSync("src/game.js", "utf8");
  assert.match(src, /aligned\(a,SLIDE_JUDGEMENT_PROFILE\.angleExtra\)/);
  assert.match(src, /ratio>=SLIDE_JUDGEMENT_PROFILE\.greatHoldRatio/);
  assert.match(src, /ratio>=SLIDE_JUDGEMENT_PROFILE\.perfectHoldRatio/);
});

test("TRACE endpoint capture remains latched after first valid arrival", () => {
  const profile = {endpointGreatToleranceDeg:30, endpointPerfectToleranceDeg:15, endpointWindow:.25};
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
  const missed = api.traceEndpointJudgement({endpointCaptured:false,endpointCapturedAt:null,bestEndpointError:Infinity}, 2, profile);
  assert.equal(missed.great, false);
  assert.equal(missed.perfect, false);
  assert.equal(missed.onTime, false);
  const src = fs.readFileSync("src/game.js", "utf8");
  assert.doesNotMatch(src, /n\.endpointCaptured=n\.endpointError<=/);
  assert.match(src, /const greatEndpoint=endpointJudgement\.great/);
});

test("input mapping and pointer fallback policies stay static", () => {`,
    'judgement regression tests'
  ]
]);

fs.writeFileSync('docs/slide-trace-judgement-v1.md', `# SLIDE and TRACE judgement v1

This pass follows the PC aim-input rebuild and changes judgement only. Rendering, scoring values, chart data, touch routing and AUTO routing remain separate.

## SLIDE

- Uses the existing 13.5 degree dial arc plus a 4.5 degree extension, for an 18 degree total angular window.
- GREAT requires 52% sustained path coverage instead of 58%.
- PERFECT requires 84% sustained path coverage instead of 88%.
- The moving target still has to be followed while the hold input is active; this is not endpoint-only forgiveness.

## TRACE

- Start, travel, reverse-motion and endpoint tolerance values are unchanged.
- The first valid endpoint arrival is latched.
- Small aim movement after that arrival cannot erase a valid endpoint capture before evaluation.
- PERFECT still requires a best endpoint error within 15 degrees and an endpoint arrival within the authored timing window.

## Regression coverage

Smoke tests verify the SLIDE profile and exercise TRACE endpoint capture, post-capture drift, best-error preservation, timing and uncaptured failure.
`);

for (const temporaryPath of [
  'scripts/apply-slide-trace-judgement-v1.js',
  '.github/workflows/apply-slide-trace-judgement-v1.yml'
]) {
  if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath);
}

console.log('Applied SLIDE and TRACE judgement v1 patch.');
