'use strict';

const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');

function read(file){return fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');}
function write(file,content){fs.writeFileSync(path.join(root,file),content);}
function replaceOrVerify(source,search,replacement,label,marker){
  const next=source.replace(search,replacement);
  if(next!==source)return next;
  if(marker&&source.includes(marker))return source;
  throw new Error(`Unable to ${label}.`);
}

let game=read('src/game.js');
game=replaceOrVerify(game,
`  function nextAimNoteAfterPulse(pulse,notes=chart){
    if(!pulse)return null;
    let best=null;
    for(const n of notes){
      if(!n||n===pulse||n.done||n.missed||n.type==="pulse")continue;
      if(!Number.isFinite(n.hitTime)||n.hitTime<pulse.hitTime-PULSE_SYNC_EPSILON)continue;
      if(!best||n.hitTime<best.hitTime)best=n;
    }
    return best;
  }

  function pulseAimGuideState(t){
    if(tutorialMode)return null;
    let pulse=null,bestDistance=Infinity;
    for(const n of chart){
      if(!n||n.type!=="pulse"||n.missed)continue;
      if(t<n.spawnTime||t>n.hitTime+PULSE_AIM_GUIDE_LINGER)continue;
      const distance=Math.abs(n.hitTime-t);
      if(distance<bestDistance){pulse=n;bestDistance=distance;}
    }
    if(!pulse)return null;
    const target=nextAimNoteAfterPulse(pulse);
    if(!target||!Number.isFinite(target.angle))return null;
    const timeToTarget=target.hitTime-t;
    if(timeToTarget>PULSE_AIM_GUIDE_LOOKAHEAD||timeToTarget<-.05)return null;
    const pulseApproach=pulseInput.approachProgress(t,pulse.hitTime,APPROACH);
    const proximity=clamp(1-timeToTarget/Math.max(APPROACH,.001),0,1);
    const linger=t<=pulse.hitTime?1:clamp(1-(t-pulse.hitTime)/PULSE_AIM_GUIDE_LINGER,0,1);
    const visibility=clamp((.16+.68*Math.max(pulseApproach*.72,proximity))*linger,0,1);
    return {pulse,target,angle:target.angle,proximity,visibility};
  }
`,
`  function nextAimNotesAfterPulse(pulse,notes=chart){
    if(!pulse)return [];
    const candidates=notes.filter(n=>n&&n!==pulse&&!n.done&&!n.missed&&n.type!=="pulse"&&Number.isFinite(n.hitTime)&&Number.isFinite(n.angle)&&n.hitTime>=pulse.hitTime-PULSE_SYNC_EPSILON).sort((a,b)=>a.hitTime-b.hitTime);
    if(!candidates.length)return [];
    const earliest=candidates[0].hitTime;
    return candidates.filter(n=>Math.abs(n.hitTime-earliest)<=PULSE_SYNC_EPSILON);
  }

  function nextAimNoteAfterPulse(pulse,notes=chart){
    return nextAimNotesAfterPulse(pulse,notes)[0]||null;
  }

  function pulseAimGuideState(t){
    if(tutorialMode)return null;
    let pulse=null,bestDistance=Infinity;
    for(const n of chart){
      if(!n||n.type!=="pulse"||n.missed)continue;
      if(t<n.spawnTime||t>n.hitTime+PULSE_AIM_GUIDE_LINGER)continue;
      const distance=Math.abs(n.hitTime-t);
      if(distance<bestDistance){pulse=n;bestDistance=distance;}
    }
    if(!pulse)return null;
    const targets=nextAimNotesAfterPulse(pulse);
    if(!targets.length)return null;
    const target=targets[0];
    const targetTime=Math.min(...targets.map(n=>n.hitTime));
    const timeToTarget=targetTime-t;
    if(timeToTarget>PULSE_AIM_GUIDE_LOOKAHEAD||timeToTarget<-.05)return null;
    const pulseApproach=pulseInput.approachProgress(t,pulse.hitTime,APPROACH);
    const proximity=clamp(1-timeToTarget/Math.max(APPROACH,.001),0,1);
    const linger=t<=pulse.hitTime?1:clamp(1-(t-pulse.hitTime)/PULSE_AIM_GUIDE_LINGER,0,1);
    const visibility=clamp((.16+.68*Math.max(pulseApproach*.72,proximity))*linger,0,1);
    return {pulse,target,targets,angle:target.angle,angles:targets.map(n=>n.angle),count:targets.length,proximity,visibility};
  }
`,
'group simultaneous PULSE aim targets','function nextAimNotesAfterPulse');

game=replaceOrVerify(game,
`  function drawPulseAimGuide(t){
    const guide=pulseAimGuideState(t);
    if(!guide||guide.visibility<=.01)return;
    const compact=isMobileViewport();
    const innerR=baseR*(compact?.18:.20);
    const length=lerp(compact?18:20,compact?28:32,guide.proximity);
    const halfWidth=lerp(compact?6:7,compact?10:11,guide.proximity);
    const tip=innerR+length;
    const neck=innerR+length*.45;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(guide.angle);
    ctx.globalAlpha=guide.visibility;
    ctx.shadowColor=COLORS.pulse;
    ctx.shadowBlur=(5+9*guide.proximity)*visualScale("effect");
    ctx.fillStyle="rgba(255,255,255,.96)";
    ctx.strokeStyle=COLORS.pulse;
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(tip,0);
    ctx.lineTo(neck,-halfWidth);
    ctx.lineTo(neck,-halfWidth*.38);
    ctx.lineTo(innerR,-halfWidth*.38);
    ctx.lineTo(innerR,halfWidth*.38);
    ctx.lineTo(neck,halfWidth*.38);
    ctx.lineTo(neck,halfWidth);
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.restore();
  }
`,
`  function drawPulseAimGuide(t){
    // PULSE_AIM_MULTI_TARGET_GUIDE: show up to two distinct directions and a compact
    // count badge when a chord contains more actions than can stay readable at center.
    const guide=pulseAimGuideState(t);
    if(!guide||guide.visibility<=.01)return;
    const compact=isMobileViewport();
    const targets=Array.isArray(guide.targets)?guide.targets:[guide.target].filter(Boolean);
    const arrowTargets=[];
    for(const target of targets){
      if(!Number.isFinite(target?.angle))continue;
      if(arrowTargets.some(existing=>distAng(existing.angle,target.angle)<Math.PI/90))continue;
      arrowTargets.push(target);
      if(arrowTargets.length>=2)break;
    }
    const innerR=baseR*(compact?.18:.20);
    const length=lerp(compact?18:20,compact?28:32,guide.proximity);
    const halfWidth=lerp(compact?6:7,compact?10:11,guide.proximity);
    const tip=innerR+length;
    const neck=innerR+length*.45;
    for(const target of arrowTargets){
      ctx.save();ctx.translate(cx,cy);ctx.rotate(target.angle);
      ctx.globalAlpha=guide.visibility;
      ctx.shadowColor=COLORS.pulse;
      ctx.shadowBlur=(5+9*guide.proximity)*visualScale("effect");
      ctx.fillStyle="rgba(255,255,255,.96)";
      ctx.strokeStyle=COLORS.pulse;
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(tip,0);
      ctx.lineTo(neck,-halfWidth);
      ctx.lineTo(neck,-halfWidth*.38);
      ctx.lineTo(innerR,-halfWidth*.38);
      ctx.lineTo(innerR,halfWidth*.38);
      ctx.lineTo(neck,halfWidth*.38);
      ctx.lineTo(neck,halfWidth);
      ctx.closePath();ctx.fill();ctx.stroke();
      ctx.restore();
    }
    const showCount=targets.length>2||targets.length>arrowTargets.length;
    if(showCount){
      ctx.save();ctx.translate(cx,cy+baseR*(compact?.11:.12));
      ctx.globalAlpha=guide.visibility;
      const countText="×"+targets.length;
      ctx.font="900 "+(compact?11:12)+"px system-ui";
      ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.lineWidth=4;ctx.strokeStyle="rgba(2,7,18,.88)";ctx.strokeText(countText,0,0);
      ctx.fillStyle=COLORS.pulse;ctx.fillText(countText,0,0);
      ctx.restore();
    }
  }
`,
'render multiple PULSE aim targets','PULSE_AIM_MULTI_TARGET_GUIDE');
write('src/game.js',game);

let smoke=read('tests/smoke.test.js');
smoke=replaceOrVerify(smoke,
'SLIDE_JUDGEMENT_PROFILE, PULSE_SYNC_EPSILON, COLORS, isPulseSynchronizedCut, noteColor, nextAimNoteAfterPulse, PULSE_AIM_GUIDE_LINGER, PULSE_AIM_GUIDE_LOOKAHEAD, updateTraceEndpointCapture, traceEndpointJudgement, traceProfile,',
'SLIDE_JUDGEMENT_PROFILE, PULSE_SYNC_EPSILON, COLORS, isPulseSynchronizedCut, noteColor, nextAimNotesAfterPulse, nextAimNoteAfterPulse, PULSE_AIM_GUIDE_LINGER, PULSE_AIM_GUIDE_LOOKAHEAD, updateTraceEndpointCapture, traceEndpointJudgement, traceProfile,',
'export PULSE multi-target helper','nextAimNotesAfterPulse, nextAimNoteAfterPulse');
smoke=replaceOrVerify(smoke,
`test("PULSE aim guide skips PULSE chains and points to the next aim note", () => {
  const first={type:"pulse",hitTime:1,spawnTime:0};
  const second={type:"pulse",hitTime:1.08,spawnTime:0};
  const simultaneousCut={type:"cut",hitTime:1,angle:.5};
  const laterTrace={type:"traceCW",hitTime:1.25,angle:1.7};
  const oldCut={type:"cut",hitTime:.75,angle:2.4};
  assert.equal(api.nextAimNoteAfterPulse(first,[oldCut,first,second,laterTrace,simultaneousCut]),simultaneousCut);
  simultaneousCut.done=true;
  assert.equal(api.nextAimNoteAfterPulse(first,[oldCut,first,second,laterTrace,simultaneousCut]),laterTrace);
  assert.equal(api.nextAimNoteAfterPulse(first,[first,second]),null);
  assert.equal(api.PULSE_AIM_GUIDE_LINGER,.22);
  assert.ok(api.PULSE_AIM_GUIDE_LOOKAHEAD>0);
  const src=fs.readFileSync("src/game.js","utf8");
  assert.match(src,/function pulseAimGuideState\\(t\\)/);
  assert.match(src,/if\\(tutorialMode\\)return null;/);
  assert.match(src,/n\\.type==="pulse"/);
  assert.match(src,/n\\.hitTime<pulse\\.hitTime-PULSE_SYNC_EPSILON/);
  const renderer=src.match(/  function drawPulseAimGuide\\(t\\)\\{[\\s\\S]*?\\n  \\}/)?.[0]||"";
  assert.ok(renderer,"PULSE next-aim renderer missing");
  assert.match(renderer,/const innerR=baseR\\*\\(compact\\?\\.18:\\.20\\)/);
  assert.doesNotMatch(renderer,/drawDirectedArcSegments|hitR/);
  assert.match(src,/drawArm\\(\\);\\s*drawPulseAimGuide\\(t\\);\\s*drawEffects\\(dt\\);/);
});`,
`test("PULSE aim guide groups simultaneous aim chords without clutter", () => {
  const first={type:"pulse",hitTime:1,spawnTime:0};
  const second={type:"pulse",hitTime:1.08,spawnTime:0};
  const simultaneousCut={type:"cut",hitTime:1,angle:.5};
  const simultaneousSwing={type:"swingCW",hitTime:1,angle:2.4};
  const simultaneousHold={type:"fx",hitTime:1+api.PULSE_SYNC_EPSILON*.5,angle:1.1};
  const laterTrace={type:"traceCW",hitTime:1.25,angle:1.7};
  const oldCut={type:"cut",hitTime:.75,angle:2.4};
  const notes=[oldCut,first,second,laterTrace,simultaneousCut,simultaneousSwing,simultaneousHold];
  const chord=api.nextAimNotesAfterPulse(first,notes);
  assert.equal(chord.length,3);
  assert.ok(chord.includes(simultaneousCut));
  assert.ok(chord.includes(simultaneousSwing));
  assert.ok(chord.includes(simultaneousHold));
  assert.equal(api.nextAimNoteAfterPulse(first,notes),simultaneousCut);
  simultaneousCut.done=simultaneousSwing.done=simultaneousHold.done=true;
  assert.equal(api.nextAimNoteAfterPulse(first,notes),laterTrace);
  assert.equal(api.nextAimNotesAfterPulse(first,[first,second]).length,0);
  assert.equal(api.PULSE_AIM_GUIDE_LINGER,.22);
  assert.ok(api.PULSE_AIM_GUIDE_LOOKAHEAD>0);
  const src=fs.readFileSync("src/game.js","utf8");
  assert.match(src,/function nextAimNotesAfterPulse\\(pulse,notes=chart\\)/);
  assert.match(src,/function pulseAimGuideState\\(t\\)/);
  assert.match(src,/if\\(tutorialMode\\)return null;/);
  assert.match(src,/n\\.type!=="pulse"/);
  assert.match(src,/n\\.hitTime>=pulse\\.hitTime-PULSE_SYNC_EPSILON/);
  const renderer=src.match(/  function drawPulseAimGuide\\(t\\)\\{[\\s\\S]*?\\n  \\}/)?.[0]||"";
  assert.ok(renderer,"PULSE next-aim renderer missing");
  assert.match(renderer,/PULSE_AIM_MULTI_TARGET_GUIDE/);
  assert.match(renderer,/const innerR=baseR\\*\\(compact\\?\\.18:\\.20\\)/);
  assert.match(renderer,/arrowTargets\\.length>=2/);
  assert.match(renderer,/targets\\.length>arrowTargets\\.length/);
  assert.doesNotMatch(renderer,/drawDirectedArcSegments|hitR/);
  assert.match(src,/drawArm\\(\\);\\s*drawPulseAimGuide\\(t\\);\\s*drawEffects\\(dt\\);/);
});`,
'extend PULSE aim guide smoke coverage','groups simultaneous aim chords');
write('tests/smoke.test.js',smoke);

let pkg=read('package.json');
pkg=replaceOrVerify(pkg,'"version": "0.9.38"','"version": "0.9.39"','bump package version','"version": "0.9.39"');
write('package.json',pkg);

let lock=read('package-lock.json');
if(!lock.includes('"version": "0.9.39"')){
  const before=(lock.match(/"version": "0\.9\.38"/g)||[]).length;
  if(before!==2)throw new Error(`Expected two root package-lock versions, found ${before}.`);
  lock=lock.replaceAll('"version": "0.9.38"','"version": "0.9.39"');
}
write('package-lock.json',lock);

let cargo=read('src-tauri/Cargo.toml');
cargo=replaceOrVerify(cargo,'version = "0.9.38"','version = "0.9.39"','bump Cargo version','version = "0.9.39"');
write('src-tauri/Cargo.toml',cargo);

let tauri=read('src-tauri/tauri.conf.json');
tauri=replaceOrVerify(tauri,'"version": "0.9.38"','"version": "0.9.39"','bump Tauri version','"version": "0.9.39"');
write('src-tauri/tauri.conf.json',tauri);

let prepare=read('scripts/prepare-desktop.js');
prepare=replaceOrVerify(prepare,"const DESKTOP_VERSION='0.9.38';","const DESKTOP_VERSION='0.9.39';",'bump desktop distribution version',"const DESKTOP_VERSION='0.9.39';");
prepare=replaceOrVerify(prepare,"const DESKTOP_BUILD_DATE='2026-07-24';","const DESKTOP_BUILD_DATE='2026-07-25';",'bump desktop build date',"const DESKTOP_BUILD_DATE='2026-07-25';");
prepare=replaceOrVerify(prepare,
/  const release=\{version:"\$\{DESKTOP_VERSION\}",date:"\$\{DESKTOP_BUILD_DATE\}",title:"PUNCHIER HIT SOUNDS"[\s\S]*?\n  \]};/,
[
'  const release={version:"${DESKTOP_VERSION}",date:"${DESKTOP_BUILD_DATE}",title:"PULSE MULTI-AIM GUIDANCE",summary:"PULSE와 겹치거나 바로 이어지는 여러 에임 노트를 더 명확하게 안내하고 Windows 업데이트 로그 표시를 안정화했습니다.",changes:[',
'    {category:"PULSE",text:"PULSE 이후 가장 이른 비-PULSE 동시치기 그룹을 찾아 최대 두 방향을 짧은 중앙 화살표로 함께 표시합니다."},',
'    {category:"CHORD",text:"같은 방향의 중복 액션이나 세 개 이상의 동시 노트는 ×2·×3 카운트로 표시해 화면을 복잡하게 만들지 않습니다."},',
'    {category:"DESKTOP",text:"업데이트 뒤 타이틀 초기화 순서 때문에 자동 변경 로그가 누락되던 경우를 한 번 더 안전하게 확인합니다."},',
'    {category:"COMPATIBILITY",text:"판정 시간, 점수, 채보 데이터, PC·모바일 입력, 설정과 LOCAL .cmix 데이터는 그대로 유지됩니다."}',
'  ]};'
].join('\n'),
'publish 0.9.39 desktop release notes','PULSE MULTI-AIM GUIDANCE');
write('scripts/prepare-desktop.js',prepare);

let audit=read('scripts/audit-desktop-dist.js');
if(!audit.includes('version:"0.9.39"'))audit=audit.replaceAll('0.9.38','0.9.39').replaceAll('PUNCHIER HIT SOUNDS','PULSE MULTI-AIM GUIDANCE').replaceAll('desktop 0.9.38 release metadata is missing','desktop 0.9.39 release metadata is missing').replaceAll('desktop release metadata override did not expose 0.9.38','desktop release metadata override did not expose 0.9.39');
audit=replaceOrVerify(audit,
"if(!desktopGame.includes('PULSE_VISUAL_SINGLE_RING')||!desktopGame.includes('PULSE_HIT_SINGLE_RING'))throw new Error('PULSE single-ring visual pass is missing');",
"if(!desktopGame.includes('PULSE_VISUAL_SINGLE_RING')||!desktopGame.includes('PULSE_HIT_SINGLE_RING'))throw new Error('PULSE single-ring visual pass is missing');\nif(!desktopGame.includes('PULSE_AIM_MULTI_TARGET_GUIDE')||!desktopGame.includes('function nextAimNotesAfterPulse')||!desktopGame.includes('arrowTargets.length>=2')||!desktopGame.includes('targets.length>arrowTargets.length'))throw new Error('desktop PULSE multi-aim guide is missing');",
'audit desktop PULSE multi-aim guide','desktop PULSE multi-aim guide is missing');
write('scripts/audit-desktop-dist.js',audit);

let installer=read('tests/desktop-installer.test.js');
if(!installer.includes("tauri.version,'0.9.39'"))installer=installer.replaceAll('0.9.38','0.9.39').replaceAll('0\\.9\\.38','0\\.9\\.39').replaceAll('punchier hit-sound version','PULSE multi-aim guidance version').replaceAll('PUNCHIER HIT SOUNDS','PULSE MULTI-AIM GUIDANCE').replaceAll('0.9.38 sound release','0.9.39 PULSE guidance release');
installer=replaceOrVerify(installer,
"assert.match(audit,/PULSE single-ring visual pass is missing/,'desktop audit must verify PULSE simplification');",
"assert.match(audit,/PULSE single-ring visual pass is missing/,'desktop audit must verify PULSE simplification');\nassert.match(audit,/desktop PULSE multi-aim guide is missing/,'desktop audit must verify simultaneous PULSE aim guidance');",
'require desktop PULSE multi-aim audit','simultaneous PULSE aim guidance');
write('tests/desktop-installer.test.js',installer);

let updater=read('tests/desktop-updater.test.js');
updater=replaceOrVerify(updater,"assert.equal(tauri.version,'0.9.38');","assert.equal(tauri.version,'0.9.39');",'bump updater test version',"assert.equal(tauri.version,'0.9.39');");
write('tests/desktop-updater.test.js',updater);

console.log('Applied CIRCLE MIX 0.9.39 PULSE multi-guide release transform.');
