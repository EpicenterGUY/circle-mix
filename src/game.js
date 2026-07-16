(() => {
  const song = document.getElementById("song");
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreBox = document.getElementById("scoreBox");
  const comboBox = document.getElementById("comboBox");
  const autoBox = document.getElementById("autoBox");
  const mapBox = document.getElementById("mapBox");
  const autoToggle = document.getElementById("autoToggle");
  const mapToggle = document.getElementById("mapToggle");
  const keymapToggle = document.getElementById("keymapToggle");
  const keymapOverlay = document.getElementById("keymapOverlay");
  const closeKeymap = document.getElementById("closeKeymap");
  const startLayer = document.getElementById("startLayer");
  const startBtn = document.getElementById("startBtn");
  const editorStartBtn=document.getElementById("editorStartBtn"), startFullBtn=document.getElementById("startFullBtn");
  const editorToggle=document.getElementById("editorToggle"), fullToggle=document.getElementById("fullToggle");
  const editorPanel=document.getElementById("editorPanel"), laneGrid=document.getElementById("laneGrid");
  const addCutBtn=document.getElementById("addCutBtn"), addSwingCWBtn=document.getElementById("addSwingCWBtn"), addSwingCCWBtn=document.getElementById("addSwingCCWBtn"), addFxBtn=document.getElementById("addFxBtn"), addSlideCWBtn=document.getElementById("addSlideCWBtn"), addSlideCCWBtn=document.getElementById("addSlideCCWBtn"), addScratchCWBtn=document.getElementById("addScratchCWBtn"), addScratchCCWBtn=document.getElementById("addScratchCCWBtn");
  const seekBackBtn=document.getElementById("seekBackBtn"), seekFwdBtn=document.getElementById("seekFwdBtn"), playPauseBtn=document.getElementById("playPauseBtn"), deleteLastBtn=document.getElementById("deleteLastBtn");
  const exportBtn=document.getElementById("exportBtn"), importBtn=document.getElementById("importBtn"), clearChartBtn=document.getElementById("clearChartBtn"), editorStatus=document.getElementById("editorStatus"), chartText=document.getElementById("chartText");
  const speedDown = document.getElementById("speedDown");
  const speedUp = document.getElementById("speedUp");
  const offsetDown = document.getElementById("offsetDown");
  const offsetUp = document.getElementById("offsetUp");
  const speedValue = document.getElementById("speedValue");
  const offsetValue = document.getElementById("offsetValue");
  const sfxDown = document.getElementById("sfxDown");
  const sfxUp = document.getElementById("sfxUp");
  const sfxValue = document.getElementById("sfxValue");
  const musicDown = document.getElementById("musicDown");
  const musicUp = document.getElementById("musicUp");
  const musicValue = document.getElementById("musicValue");

  const TAU = Math.PI * 2;
  const BPM = 184.6;
  const BEAT = 60 / BPM;
  const CHART_STRETCH = 1.00;
  let SONG_OFFSET = -0.04;
  // 사용자가 말한 마지막 음 기준: 약 1:51 지점에서 종료.
  const SONG_END_TIME = 111.450;
  const CHART_END_BEAT = 342.894; // 초 단위. 채보가 빠르면 +, 늦으면 - 로 조정
  let APPROACH = 0.48;
  const HIT_WINDOW = 0.17;
  const SWING_FLICK_SPEED = 0.78;
  const SCRATCH_FLICK_SPEED = 1.30;
  const DIAL_ARC_HALF = Math.PI * 0.075;
  const DIAL_ARC_VISUAL = Math.PI * 0.100;
  const BASE_NOTE_WIDTH = 8;
  const NOTE_WIDTHS = { cut:BASE_NOTE_WIDTH, slide:BASE_NOTE_WIDTH, scratch:BASE_NOTE_WIDTH, swing:BASE_NOTE_WIDTH, trace:4.5, hold:11.5 };

  const COLORS = {
    cut:"#5cfffb", swingCW:"#79ff7d", swingCCW:"#ff72d6", slide:"#ffe15a", fx:"#b77cff",
    trace:"#dffcff", scratch:"#c94b2d", scratchCW:"#c94b2d", scratchCCW:"#d9782a",
    perfect:"#fff36a", great:"#80ffdb", miss:"#ff4567"
  };

  let W=0,H=0,cx=0,cy=0,baseR=0,hitR=0,outerR=0;
  let running=false, startMs=0, lastMs=0, raf=0;
  let audioStartedAt=0;
  let score=0, combo=0, maxCombo=0;
  let chart=[], feedback=[], particles=[], waves=[], ringBursts=[], scratchBursts=[];
  let autoMode=false, mapMode="tech";
  let mouseX=0, mouseY=0;
  let armAngle=-Math.PI/2, targetAngle=-Math.PI/2, prevArmAngle=-Math.PI/2, armVel=0;
  let keyA=false, keyD=false, filterHeld=false, scratchHeld=false, mouseDownRight=false;
  let focusNote=null;
  const keys={};
  let audioCtx=null;
  let sfxEnabled=true;
  let sfxVolume=1.80;
  let musicVolume=0.90;
  let editorMode=false, selectedLane=0, useCustomChart=false;
  let selectedMenuMode="tech";
  let paused=false;
  let settingsVisible=false;
  let customChartData=[];

  function resize(){
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    W=window.innerWidth; H=window.innerHeight;
    cx=W*.5; cy=H*.53;
    baseR=Math.min(W,H)*.287;
    hitR=baseR;
    outerR=baseR*1.86;
  }
  window.addEventListener("resize", resize);
  resize();

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function norm(a){while(a<=-Math.PI)a+=TAU;while(a>Math.PI)a-=TAU;return a;}
  function distAng(a,b){return Math.abs(norm(a-b));}
  function now(){
    if(!running) return 0;
    const audioTime = song.currentTime || 0;
    const fallbackTime = (performance.now() - audioStartedAt) / 1000;
    return Math.max(0, (audioTime > 0.03 ? audioTime : fallbackTime) - SONG_OFFSET);
  }
  function laneAngle(lane){return -Math.PI/2 + lane*TAU/8;}

  function make(type, beat, lane, extra={}){
    const hitTime=beat*BEAT*CHART_STRETCH;
    const n={
      type,lane,angle:laneAngle(lane),
      beat,
      endBeat:beat,
      endLane:extra.endLane,
      endAngle:extra.endLane!==undefined?laneAngle(extra.endLane):extra.endAngle,
      hitTime,spawnTime:hitTime-APPROACH,
      duration:extra.duration||0,done:false,missed:false,hold:0
    };
    if(type.startsWith("slide") || type.startsWith("trace")){
      n.duration=extra.duration||BEAT*(type.startsWith("trace")?1.5:1.7);
      n.endAngle=extra.endAngle!==undefined?extra.endAngle:laneAngle(extra.endLane??lane);

      n.turns = extra.turns || 0;
      let raw = n.endAngle - n.angle;

      if(type==="slideCW"){
        while(raw <= 0) raw += TAU;
        n.slideAmount = raw + TAU * n.turns;
      }else if(type==="slideCCW"){
        while(raw >= 0) raw -= TAU;
        n.slideAmount = raw - TAU * n.turns;
      }else{
        n.slideAmount = norm(raw);
      }

      n.visualEndAngle = n.angle + n.slideAmount;
    }
    if(type.startsWith("scratch")){
      n.duration=extra.duration||BEAT*.55;
      const dir=type==="scratchCW"?1:-1;
      n.slideAmount=dir*(extra.amount||Math.PI*.34);
      n.endAngle=n.angle+n.slideAmount;
      n.visualEndAngle=n.endAngle;
    }
    if(n.duration){
      n.endBeat = beat + n.duration / (BEAT * CHART_STRETCH);
    }

    return n;
  }

  function addCutRun(n,start,step,lanes,types={}){
    lanes.forEach((lane,i)=>n.push(make(types[i]||"cut",start+i*step,lane)));
  }

  function cut(n,b,lane){ n.push(make("cut",b,lane)); }
  function swing(n,b,lane,dir="CW"){ n.push(make(dir==="CW"?"swingCW":"swingCCW",b,lane)); }
  function hold(n,b,lane,dur=4){ n.push(make("fx",b,lane,{duration:BEAT*dur})); }
  function slide(n,b,lane,endLane,dir="CW",dur=4,turns=0){
    n.push(make(dir==="CW"?"slideCW":"slideCCW",b,lane,{endLane,duration:BEAT*dur,turns}));
  }
  function trace(n,b,lane,endLane=lane,dur=1.5){
    n.push(make("trace",b,lane,{endLane,duration:BEAT*dur}));
  }
  function scratch(n,b,lane,endLane=lane,dir="CW",dur=.55){
    n.push(make(dir==="CW"?"scratchCW":"scratchCCW",b,lane,{endLane,duration:BEAT*dur,amount:Math.PI*.34}));
  }

  function motif(n,start,lanes,step=.75){
    // 읽기 쉬운 기본 멜로디 모티프. 과도한 연타 대신 방향 변화 중심.
    lanes.forEach((lane,i)=>{
      const b=start+i*step;
      if(i===4) swing(n,b,lane,"CW");
      else if(i===9) swing(n,b,lane,"CCW");
      else cut(n,b,lane);
    });
  }

  function burst(n,start,lanes,step=.32){
    // 사람 가능한 짧은 러시. 길게 남발하지 않음.
    lanes.forEach((lane,i)=>{
      const b=start+i*step;
      if(i===5) swing(n,b,lane,"CW");
      else if(i===11) swing(n,b,lane,"CCW");
      else cut(n,b,lane);
    });
  }

  function stair(n,start,lanes,step=.5){
    // 1/2박 계단. 읽히는 난이도 상승용.
    lanes.forEach((lane,i)=>cut(n,start+i*step,lane));
  }

  function anchor(n,start,end,step,lanes=[0,4]){
    // 쉬는 구간용 기준 박자. 완전 공백은 피하되, 일부러 밀도 낮춤.
    let i=0;
    for(let b=start;b<=end;b+=step) cut(n,b,lanes[i++%lanes.length]);
  }

  function generateAnimaNormalChart(){
    const n=[];

    // NORMAL: 초견 학습용 구조형 채보.
    // CUT으로 박자/레인 규칙을 먼저 익히고, 중반부터 짧은 HOLD/SLIDE를 추가한다.

    // 0~32 Intro: 4박/2박 CUT 앵커로 기본 박자와 8방향 레인을 설명.
    anchor(n,4,20,4,[0,4,2,6]);
    trace(n,18,6,0,1.4);
    trace(n,22.5,0);
    stair(n,24,[0,2,4,6],1.0);
    stair(n,28,[1,3,5,7],1.0);
    swing(n,32,7,"CW");

    // 32~64 Verse: CUT 모티프 반복. 첫 SLIDE는 짧고 주변 조작을 비워 둔다.
    motif(n,36,[0,2,4,6,7,5,3,1],1.0);
    trace(n,46.5,1,5);
    slide(n,48,1,5,"CW",3.5);
    cut(n,53,5);
    swing(n,56,5,"CCW");
    anchor(n,60,68,4,[0,4]);

    // 72~112 Build: HOLD는 지속음 역할. HOLD 중에는 복잡한 조작 없이 진입/이탈만 배치.
    hold(n,74,6,4.5);
    trace(n,79,6);
    cut(n,80,6);
    motif(n,84,[6,4,2,0,1,3,5,7],.9);
    slide(n,98,7,3,"CCW",3.5);
    scratch(n,105,3,6,"CW");
    stair(n,110,[6,7,0,1],.55);

    // 112~144 Highlight 1: 짧은 CUT 러시 + SWING 마무리 + 포인트 SCRATCH.
    burst(n,116,[0,1,2,3,4,5,6,7],.42);
    trace(n,120,7);
    swing(n,121,7,"CW");
    slide(n,126,4,0,"CCW",3.2);
    cut(n,132,0);
    burst(n,136,[0,2,4,6,1,3,5,7],.44);
    scratch(n,143,7,3,"CCW");

    // 144~176 Break: 밀도 낮춤. 긴 공백은 앵커 CUT으로만 유지.
    hold(n,150,3,4.5);
    cut(n,156,3);
    anchor(n,160,174,4,[0,4,2,6]);

    // 180~224 Build 2: 방향성 있는 CUT에 짧은 SLIDE/SCRATCH 연결을 한 번 소개.
    motif(n,182,[1,3,5,7,0,2,4,6,6,4,2,0],.8);
    slide(n,198,0,5,"CW",3.5);
    scratch(n,205,5,1,"CCW");
    stair(n,212,[1,2,3,4,5,6,7,0],.55);
    swing(n,218,0,"CW");

    // 224~280 Climax: NORMAL 최고 밀도. 러시는 짧게 끊고 SLIDE 중 겹침을 피한다.
    hold(n,224,4,3.5);
    cut(n,229,4);
    burst(n,232,[4,5,6,7,0,1,2,3,3,2,1,0],.40);
    slide(n,244,0,5,"CW",3.5);
    cut(n,250,5);
    scratch(n,253,5,1,"CCW");
    burst(n,260,[1,3,5,7,0,2,4,6],.42);
    slide(n,270,1,6,"CW",3.5);
    swing(n,276,6,"CCW");

    // 280~320 Final drive: 후반 밀도 상승. 동시/복합 조작 대신 CUT 계단을 중심으로 마무리.
    burst(n,284,[6,7,0,1,2,3,4,5],.40);
    scratch(n,294,2,7,"CW");
    stair(n,300,[7,5,3,1,6,4,2,0],.50);
    slide(n,310,0,4,"CW",3.5);
    swing(n,316,4,"CW");
    burst(n,320,[4,6,0,2,5,7,1,3],.42);

    // 320~342 Ending: HOLD로 안정시키고 SCRATCH/SWING/CUT으로 명확하게 종료.
    hold(n,326,3,3.5);
    anchor(n,332,336,2,[0,4,2]);
    scratch(n,337,6,2,"CCW");
    swing(n,340,2,"CW");
    cut(n,342,4);

    return n.sort((a,b)=>a.hitTime-b.hitTime);
  }

  function generateAnimaTechChart(){
    const n=[];

    // TECH: HARD~EXPERT 초입을 목표로 한 구조형 채보.
    // CUT 계단/짧은 러시/SLIDE→SCRATCH/러시→SWING을 사용하지만, HOLD/SLIDE와 복잡 조작은 겹치지 않는다.

    // 0~32 Intro: NORMAL보다 빠른 CUT 계단으로 판정감을 잡되 과밀하게 시작하지 않음.
    anchor(n,4,16,3,[0,4,2,6,1]);
    trace(n,17.5,6,0,1.4);
    trace(n,20.8,0,2);
    stair(n,22,[0,2,4,6,1,3,5,7],.70);
    stair(n,28,[7,5,3,1],.55);
    swing(n,31.5,7,"CW");

    // 32~64 First phrase: 반복 모티프 + 짧은 러시. SLIDE 뒤에만 가벼운 마무리를 둔다.
    motif(n,36,[0,2,4,6,7,5,3,1,0,1,2,3],.62);
    trace(n,45,3,7);
    slide(n,46,3,7,"CW",3.2);
    cut(n,51.5,7);
    swing(n,53,7,"CCW");
    burst(n,56,[7,6,5,4,3,2,1,0],.36);
    anchor(n,62,70,3,[0,4,2]);

    // 72~112 Build-up: HOLD 종료 직후 CUT 재진입, SLIDE→SCRATCH 전환을 명확하게 분리.
    hold(n,74,6,4.5);
    cut(n,80,6);
    motif(n,83,[6,4,2,0,1,3,5,7,7,5,3,1],.60);
    slide(n,96,1,5,"CW",3.5);
    trace(n,102,5);
    scratch(n,103,5,0,"CCW");
    burst(n,108,[0,1,2,3,4,5,6,7],.34);

    // 112~144 Highlight 1: CUT 러시를 2마디 이하로 제한하고 SWING/SCRATCH로 악센트.
    burst(n,116,[0,1,2,3,4,5,6,7,7,6,5,4],.31);
    swing(n,121,4,"CW");
    slide(n,126,0,4,"CW",3.4);
    cut(n,131.5,4);
    burst(n,134,[4,6,0,2,5,7,1,3,4,5,6,7],.32);
    scratch(n,142.5,7,3,"CCW");

    // 144~176 Break: 의도적 저밀도. HOLD와 SLIDE 사이를 비워 체력 회복.
    hold(n,148,3,5.0);
    cut(n,155,3);
    anchor(n,158,172,3.5,[0,4,2,6]);
    slide(n,174,6,2,"CCW",3.5);

    // 180~224 Build 2: 계단과 방향 전환. SCRATCH는 드랍 전 포인트로 1회.
    motif(n,182,[2,4,6,0,1,3,5,7,7,5,3,1,0,2,4,6],.55);
    scratch(n,196,6,1,"CW");
    burst(n,202,[1,2,3,4,5,6,7,0,0,2,4,6],.31);
    trace(n,210,6);
    swing(n,211,6,"CCW");
    burst(n,213,[6,4,2,0,1,3,5,7],.34);
    slide(n,219,7,3,"CCW",3.5);

    // 224~280 Climax: TECH 메인. HOLD 종료→CUT, SLIDE→SCRATCH, 러시→SWING 조합.
    hold(n,224,3,3.5);
    cut(n,229,3);
    burst(n,231,[3,4,5,6,7,0,1,2,2,1,0,7,6,5,4,3],.29);
    swing(n,236,3,"CW");
    slide(n,242,3,0,"CW",3.5);
    scratch(n,248,0,4,"CCW");
    burst(n,256,[4,6,0,2,5,7,1,3,0,1,2,3,4,5,6,7],.28);
    swing(n,262,7,"CCW");
    slide(n,270,7,2,"CCW",3.5);
    stair(n,276,[2,3,4,5,6,7,0,1],.40);

    // 280~320 Final drive: 가장 높은 밀도지만 러시를 끊어 호흡을 준다.
    burst(n,284,[0,1,2,3,4,5,6,7,7,6,5,4],.27);
    swing(n,288,4,"CW");
    scratch(n,294,0,5,"CW");
    burst(n,300,[5,7,1,3,6,0,2,4,7,5,3,1],.28);
    slide(n,312,0,6,"CW",3.5);
    swing(n,318,6,"CW");
    burst(n,320,[6,7,0,1,2,3,4,5,5,3,1,7],.30);

    // 320~342 Ending: 과도한 난사 대신 읽히는 마무리 액션.
    hold(n,326,5,3.5);
    motif(n,332,[5,3,1,7,0,2,4,6],.55);
    scratch(n,337,6,2,"CCW");
    swing(n,340,2,"CW");
    cut(n,342,4);

    return n.sort((a,b)=>a.hitTime-b.hitTime);
  }

  function generateNormalChart(){
    return generateAnimaNormalChart();
  }

  function generateTechChart(){
    return generateAnimaTechChart();
  }

  function fillPlayableGaps(raw, maxGapBeat){
    // 빈 타이밍을 없애되, 하이라이트 밀도 구조는 유지.
    // 긴 공백에만 약한 단일 CUT을 넣어서 리듬이 계속 흐르게 함.
    const base = raw.slice().sort((a,b)=>(a.beat??0)-(b.beat??0));
    const out = base.slice();
    const lanes=[0,4,2,6,1,5,3,7];
    let laneSeed=0;
    let cursor=4;

    for(const note of base){
      const nb = note.beat ?? 0;
      const ne = note.endBeat ?? nb;

      if(nb - cursor > maxGapBeat*1.25){
        let b = cursor + maxGapBeat;
        while(b < nb - maxGapBeat*.45 && b < CHART_END_BEAT){
          const lane = lanes[laneSeed++%lanes.length];
          out.push(make("cut", Math.round(b*4)/4, lane));
          b += maxGapBeat;
        }
      }
      cursor = Math.max(cursor, ne);
    }

    if(CHART_END_BEAT - cursor > maxGapBeat){
      let b = cursor + maxGapBeat;
      while(b < CHART_END_BEAT-.75){
        const lane = lanes[laneSeed++%lanes.length];
        out.push(make("cut", Math.round(b*4)/4, lane));
        b += maxGapBeat;
      }
    }

    return out.sort((a,b)=>(a.beat??0)-(b.beat??0));
  }

  function generateChart(){
    const raw = mapMode==="tech" ? generateTechChart() : generateNormalChart();

    // CLEAN HARD FLOW:
    // 구조형 채보는 유지하되, 긴 빈 구간만 단일 CUT으로 보강.
    // NORMAL은 숨 쉴 틈 있는 연속감, TECH는 거의 계속 손이 움직이게.
    const gapFilled = fillPlayableGaps(raw, mapMode==="tech" ? 1.10 : 1.75);
    const trimmed = gapFilled.filter(n => (n.beat ?? 0) <= CHART_END_BEAT);

    return trimmed
      .map(n => {
        if(n.endBeat && n.endBeat > CHART_END_BEAT){
          const maxDurBeat = Math.max(0.5, CHART_END_BEAT - n.beat);
          n.duration = maxDurBeat * BEAT * CHART_STRETCH;
          n.endBeat = CHART_END_BEAT;
        }
        n.hitTime = n.beat * BEAT * CHART_STRETCH;
        n.spawnTime = n.hitTime - APPROACH;
        return n;
      })
      .sort((a,b)=>a.hitTime-b.hitTime);
  }

  function slideDelta(n){
    if(typeof n.slideAmount === "number") return n.slideAmount;

    // fallback: old chart compatibility
    let d=n.endAngle-n.angle;
    if(n.type==="slideCW"){while(d<=0)d+=TAU;return d;}
    if(n.type==="slideCCW"){while(d>=0)d-=TAU;return d;}
    if(n.type==="traceCW"){while(d<=0)d+=TAU;return d;}
    if(n.type==="traceCCW"){while(d>=0)d-=TAU;return d;}
    if(n.type.startsWith("trace"))return norm(d);
    return d;
  }
  function slideAngle(n,t){
    const duration=Math.max(n.duration||0,.001);
    return n.angle + slideDelta(n) * clamp((t-n.hitTime)/duration,0,1);
  }
  function progress(n,t){return clamp((t-n.spawnTime)/(n.hitTime-n.spawnTime),0,1);}
  function noteR(n,t){return lerp(outerR,hitR,progress(n,t));}
  function notePos(n,t){const r=noteR(n,t); return {x:cx+Math.cos(n.angle)*r,y:cy+Math.sin(n.angle)*r,r};}
  function noteColor(n){
    if(n.type==="cut")return COLORS.cut;
    if(n.type==="swingCW")return COLORS.swingCW;
    if(n.type==="swingCCW")return COLORS.swingCCW;
    if(n.type.startsWith("slide"))return COLORS.slide;
    if(n.type.startsWith("trace"))return COLORS.trace;
    if(n.type==="fx")return COLORS.fx;
    if(n.type==="scratchCW")return COLORS.scratchCW;
    if(n.type==="scratchCCW")return COLORS.scratchCCW;
    if(n.type.startsWith("scratch"))return COLORS.scratch;
    return "#fff";
  }
  function aligned(angle, extra=0){return distAng(armAngle,angle)<DIAL_ARC_HALF+Math.PI*extra;}
  function activeHold(n,t){return (n.type==="fx"||n.type.startsWith("slide"))&&t>=n.hitTime&&t<=n.hitTime+n.duration;}

  function addFeedback(text,x,y,color){feedback.push({text,x,y,color,life:.65});}
  function addParticles(x,y,color,count=12,power=1){
    for(let i=0;i<count;i++){
      const a=Math.random()*TAU, s=(34+Math.random()*112)*power;
      particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.42+Math.random()*.28,color});
    }
  }
  function addWave(angle,color){waves.push({angle,color,life:.38});}
  function addRingBurst(color, power=1, label=""){
    ringBursts.push({color, power, life:.52, label});
  }
  function addScratchBurst(angle,color,dir=1){
    scratchBursts.push({angle,color,dir,life:.48});
  }

  function ensureAudioCtx(){
    try{
      if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if(audioCtx.state === "suspended") audioCtx.resume();
    }catch(e){}
  }

  function playHitSound(type="cut", quality="PERFECT"){
    const effectiveSfxVolume = sfxEnabled ? clamp(sfxVolume, 0, 4) : 0;
    if(effectiveSfxVolume <= 0.001) return;
    ensureAudioCtx();
    if(!audioCtx) return;

    const t=audioCtx.currentTime;
    const gain=audioCtx.createGain();
    gain.connect(audioCtx.destination);

    let freq=680;
    let dur=.045;
    let vol=.075;
    let wave="square";

    if(type.startsWith("swing")){
      freq=quality==="PERFECT"?420:360;
      dur=.085;
      vol=.120;
      wave="sawtooth";
    }else if(type.startsWith("slide")){
      freq=880;
      dur=.060;
      vol=.085;
      wave="triangle";
    }else if(type==="fx"){
      freq=240;
      dur=.090;
      vol=.090;
      wave="sawtooth";
    }else if(type.startsWith("scratch")){
      freq=210;
      dur=.135;
      vol=.145;
      wave="sawtooth";
    }else{
      freq=quality==="PERFECT"?760:620;
      dur=.042;
      vol=.095;
      wave="square";
    }

    const osc=audioCtx.createOscillator();
    osc.type=wave;
    osc.frequency.setValueAtTime(freq,t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80,freq*.55),t+dur);

    const finalVol = clamp(vol * effectiveSfxVolume, 0.001, .55);
    gain.gain.setValueAtTime(0.0001,t);
    gain.gain.exponentialRampToValueAtTime(finalVol,t+.006);
    gain.gain.exponentialRampToValueAtTime(0.0001,t+dur);

    osc.connect(gain);
    osc.start(t);
    osc.stop(t+dur+.02);

    if(type.startsWith("swing")){
      // 스윙 전용 레이어: 긁히는 듯한 상승/하강 사운드
      const g2=audioCtx.createGain();
      g2.connect(audioCtx.destination);
      g2.gain.setValueAtTime(0.0001,t);
      g2.gain.exponentialRampToValueAtTime(clamp(0.080 * effectiveSfxVolume, 0.001, .28),t+.010);
      g2.gain.exponentialRampToValueAtTime(0.0001,t+.12);

      const osc2=audioCtx.createOscillator();
      osc2.type="triangle";
      if(type==="swingCW"){
        osc2.frequency.setValueAtTime(300,t);
        osc2.frequency.exponentialRampToValueAtTime(920,t+.11);
      }else{
        osc2.frequency.setValueAtTime(900,t);
        osc2.frequency.exponentialRampToValueAtTime(260,t+.11);
      }
      osc2.connect(g2);
      osc2.start(t);
      osc2.stop(t+.14);

      const nDur=.050;
      const nBuf=audioCtx.createBuffer(1,Math.floor(audioCtx.sampleRate*nDur),audioCtx.sampleRate);
      const nd=nBuf.getChannelData(0);
      for(let i=0;i<nd.length;i++){
        const fall=1-i/nd.length;
        nd[i]=(Math.random()*2-1)*fall*.75;
      }
      const nb=audioCtx.createBufferSource();
      nb.buffer=nBuf;
      const ng2=audioCtx.createGain();
      const bp=audioCtx.createBiquadFilter();
      bp.type="bandpass";
      bp.frequency.setValueAtTime(type==="swingCW"?1800:1400,t);
      bp.Q.value=2.8;
      ng2.gain.setValueAtTime(clamp(0.040*effectiveSfxVolume,0.001,.12),t);
      ng2.gain.exponentialRampToValueAtTime(0.0001,t+nDur);
      nb.connect(bp); bp.connect(ng2); ng2.connect(audioCtx.destination);
      nb.start(t);
      nb.stop(t+nDur+.01);
    }

    // 아주 짧은 노이즈 클릭 레이어: 타격감
    const noiseDur=.028;
    const buffer=audioCtx.createBuffer(1,Math.floor(audioCtx.sampleRate*noiseDur),audioCtx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){
      data[i]=(Math.random()*2-1)*(1-i/data.length);
    }
    const noise=audioCtx.createBufferSource();
    const ng=audioCtx.createGain();
    noise.buffer=buffer;
    ng.gain.setValueAtTime((type==="cut"?.040:.026) * effectiveSfxVolume,t);
    ng.gain.exponentialRampToValueAtTime(0.0001,t+noiseDur);
    noise.connect(ng);
    ng.connect(audioCtx.destination);
    noise.start(t);
    noise.stop(t+noiseDur);
  }

  function judge(n,label,color){
    if(n.done||n.missed)return;
    n.done=true;
    playHitSound(n.type,label);
    score+=label==="PERFECT"?1200:800;
    combo++; maxCombo=Math.max(maxCombo,combo);

    let a=n.angle;
    if(n.type.startsWith("slide") || n.type.startsWith("scratch")){
      a = n.endAngle ?? n.visualEndAngle ?? a;
    }

    const isScratch=n.type&&n.type.startsWith("scratch");
    const isSwing=n.type&&n.type.startsWith("swing");
    const p={x:cx+Math.cos(a)*hitR,y:cy+Math.sin(a)*hitR};

    addFeedback(label,p.x,p.y-18,color);
    addParticles(p.x,p.y,color,isScratch?28:(isSwing?22:14),isScratch?1.45:(isSwing?1.35:1));
    addWave((isScratch||isSwing)?a:a,color);

    if(isScratch){
      const d=slideDelta(n);
      addScratchBurst(a,color,d>=0?1:-1);
      for(let i=0;i<16;i++){
        const ang=a + (Math.random()-.5)*.9;
        const rr=hitR + (Math.random()-.5)*28;
        addParticles(cx+Math.cos(ang)*rr, cy+Math.sin(ang)*rr, color, 1, .95);
      }
      addFeedback("SCRATCH",p.x,p.y+18,color);
    }

    if(isSwing){
      addRingBurst(color,label==="PERFECT"?1.22:1.0,label);
      // 원 전체에 잔파티클
      for(let i=0;i<10;i++){
        const ang=i/10*TAU;
        addParticles(cx+Math.cos(ang)*hitR, cy+Math.sin(ang)*hitR, color, 1, .45);
      }
      addFeedback(n.type==="swingCW"?"↻":"↺",cx,cy-baseR*.18,color);
    }
  }
  function miss(n){
    if(n.done||n.missed)return;
    n.missed=true; combo=0;
    let a=n.angle;
    if(n.type.startsWith("slide") || n.type.startsWith("scratch"))a=slideAngle(n,now());
    const isScratch=n.type&&n.type.startsWith("scratch");
    const p={x:cx+Math.cos(a)*hitR,y:cy+Math.sin(a)*hitR};
    addFeedback("MISS",p.x,p.y-18,COLORS.miss);
    addParticles(p.x,p.y,COLORS.miss,isScratch?14:8,.65);
    addWave(a,COLORS.miss);
  }

  function checkSwing(n){
    // SWING = Shift 없이 해당 방향으로 조금만 휙 돌려도 인정.
    if(Math.abs(armVel)<SWING_FLICK_SPEED)return false;
    if(n.type==="swingCW")return armVel>0;
    if(n.type==="swingCCW")return armVel<0;
    return true;
  }

  function checkScratch(n, t){
    // SCRATCH = Shift를 누른 채 짧게 좌/우로 긁는 액션. SLIDE처럼 긴 경로를 추적하지 않는다.
    if(!scratchHeld)return false;
    if(!aligned(n.angle,.026))return false;
    const dir=n.type==="scratchCW"?1:-1;
    return Math.abs(armVel)>=SCRATCH_FLICK_SPEED && Math.sign(armVel)===dir;
  }
  function onCut(){
    if(!running||paused)return;
    const t=now();
    const c=chart.filter(n=>!n.done&&!n.missed&&n.type==="cut"&&Math.abs(t-n.hitTime)<=HIT_WINDOW)
                 .sort((a,b)=>Math.abs(t-a.hitTime)-Math.abs(t-b.hitTime));
    const n=c.find(x=>aligned(x.angle,.015));
    if(n)judge(n,Math.abs(t-n.hitTime)<.065?"PERFECT":"GREAT",Math.abs(t-n.hitTime)<.065?COLORS.perfect:COLORS.great);
  }

  function nextNote(t){
    let best=null,bd=999;
    for(const n of chart){
      if(n.done||n.missed)continue;
      if(activeHold(n,t))return n;
      const d=n.hitTime-t;
      if(d>-0.22&&d<bd){best=n;bd=d;}
    }
    return best;
  }

  function updateAuto(t){
    if(!autoMode)return;

    const activePath=chart.find(n=>!n.done&&!n.missed&&n.type.startsWith("slide")&&t>=n.hitTime&&t<=n.hitTime+n.duration);
    if(activePath){
      const a=slideAngle(activePath,t);
      armAngle=a;
      targetAngle=a;
      armVel=slideDelta(activePath)/Math.max(activePath.duration,.001);
    }else{
      const n=nextNote(t);
      if(n)targetAngle=(n.type.startsWith("scratch")||n.type.startsWith("swing"))?n.angle:n.angle;
    }

    for(const n of chart){
      if(n.done||n.missed)continue;
      if(n.type.startsWith("swing") && Math.abs(t-n.hitTime)<.20){
        const dir=n.type==="swingCW"?1:-1;
        armAngle += dir*.08;
        armVel = dir*SCRATCH_FLICK_SPEED*1.5;
      }
      if((n.type==="cut"||n.type.startsWith("swing"))&&Math.abs(t-n.hitTime)<.030){
        judge(n,"PERFECT",noteColor(n));
      }
    }
  }

  function updateArm(dt){
    const tNow = now();
    if(autoMode && chart.some(n=>!n.done&&!n.missed&&n.type.startsWith("slide")&&tNow>=n.hitTime&&tNow<=n.hitTime+n.duration)){
      return;
    }

    prevArmAngle=armAngle;

    if(autoMode){
      const diff=norm(targetAngle-armAngle);
      armAngle+=diff*clamp(1-Math.pow(.0001,dt),0,1);
    }else if(keyA||keyD){
      targetAngle += (keyD-keyA) * 9.5 * dt;
      const diff=norm(targetAngle-armAngle);
      armAngle += diff * clamp(1-Math.pow(.00001,dt),0,1);
    }else{
      targetAngle=Math.atan2(mouseY-cy,mouseX-cx);
      armAngle=targetAngle;
    }

    armAngle=norm(armAngle);
    armVel=norm(armAngle-prevArmAngle)/Math.max(dt,.001);
  }

  function updateNotes(t,dt){
    for(const n of chart){
      if(n.done||n.missed)continue;

      if(n.type==="cut"){
        if(t>n.hitTime+.22)miss(n);
        continue;
      }

      if(n.type.startsWith("trace")){
        const end=n.hitTime+n.duration;
        const a=slideAngle(n,t);
        if(t>=n.hitTime&&t<=end&&(autoMode||aligned(a,.040))){
          n.hold+=dt;
          score+=2;
          if(Math.random()<.45)addParticles(cx+Math.cos(a)*hitR,cy+Math.sin(a)*hitR,COLORS.trace,1,.18);
        }
        if(t>end){
          const ratio=n.hold/Math.max(n.duration,.001);
          if(ratio>=.45){ addWave(slideAngle(n,end),COLORS.trace); judge(n,ratio>.72?"PERFECT":"GREAT",COLORS.trace); }
          else miss(n);
        }
        if(t>n.hitTime+.45&&n.hold<.025&&!autoMode)miss(n);
        continue;
      }

      if(n.type.startsWith("swing")){
        if(t>=n.hitTime-.16&&t<=n.hitTime+.20&&(autoMode||checkSwing(n))){
          judge(n,Math.abs(t-n.hitTime)<.075?"PERFECT":"GREAT",noteColor(n));
        }else if(t>n.hitTime+.26){
          miss(n);
        }
        continue;
      }

      if(n.type==="fx"){
        const end=n.hitTime+n.duration;
        if(t>=n.hitTime&&t<=end){
          if(autoMode||(filterHeld&&aligned(n.angle,.020))){
            n.hold+=dt; score+=3;
            if(Math.random()<.45)addParticles(cx+Math.cos(n.angle)*hitR,cy+Math.sin(n.angle)*hitR,COLORS.fx,1,.25);
          }
        }
        if(t>end){
          const ratio=n.hold/n.duration;
          if(ratio>=.55)judge(n,ratio>.85?"PERFECT":"GREAT",COLORS.fx);
          else miss(n);
        }
        if(t>n.hitTime+.38&&n.hold<.035&&!autoMode)miss(n);
        continue;
      }

      if(n.type.startsWith("slide")){
        const end=n.hitTime+n.duration;
        const a=slideAngle(n,t);
        const held=autoMode || (filterHeld&&aligned(a,.010));
        const color=noteColor(n);
        const isScratch=false;
        if(t>=n.hitTime&&t<=end){
          if(held){
            n.hold+=dt; score+=3;
            if(Math.random()<(isScratch?.72:.60))addParticles(cx+Math.cos(a)*hitR,cy+Math.sin(a)*hitR,color,1,isScratch?.30:.22);
          }
        }
        if(t>end){
          const ratio=n.hold/n.duration;
          if(ratio>=.58)judge(n,ratio>.88?"PERFECT":"GREAT",color);
          else miss(n);
        }
        if(t>n.hitTime+.40&&n.hold<.03&&!autoMode)miss(n);
        continue;
      }

      if(n.type.startsWith("scratch")){
        if(t>=n.hitTime-.16&&t<=n.hitTime+.20&&(autoMode||checkScratch(n,t))){
          judge(n,Math.abs(t-n.hitTime)<.075?"PERFECT":"GREAT",noteColor(n));
        }else if(t>n.hitTime+.26){
          miss(n);
        }
        continue;
      }
    }
  }

  function drawBackground(t){
    ctx.clearRect(0,0,W,H);
    ctx.save(); ctx.translate(cx,cy);
    for(let i=0;i<40;i++){
      const a=i/40*TAU+t*.06, r=baseR*(1.05+Math.sin(t*1.5+i)*.012);
      ctx.strokeStyle=`rgba(255,255,255,${i%5===0?.14:.045})`; ctx.lineWidth=i%5===0?2:1;
      ctx.beginPath(); ctx.moveTo(Math.cos(a)*baseR*.36,Math.sin(a)*baseR*.36); ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); ctx.stroke();
    }
    const grad=ctx.createRadialGradient(0,0,baseR*.12,0,0,baseR*1.15);
    grad.addColorStop(0,"#173a64"); grad.addColorStop(.45,"#101e37"); grad.addColorStop(1,"#050914");
    ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(0,0,baseR*1.1,0,TAU); ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.20)"; ctx.lineWidth=8; ctx.beginPath(); ctx.arc(0,0,hitR,0,TAU); ctx.stroke();
    ctx.strokeStyle="rgba(92,255,251,.28)"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,outerR,0,TAU); ctx.stroke();

    // 8방향 착지 가이드. 노트가 어디로 떨어지는지 먼저 읽게 해줌.
    for(let i=0;i<8;i++){
      const a=laneAngle(i);
      ctx.strokeStyle=i%2===0?"rgba(255,255,255,.16)":"rgba(255,255,255,.09)";
      ctx.lineWidth=i%2===0?3:2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*(hitR-16),Math.sin(a)*(hitR-16));
      ctx.lineTo(Math.cos(a)*(hitR+16),Math.sin(a)*(hitR+16));
      ctx.stroke();

      ctx.fillStyle="rgba(255,255,255,.26)";
      ctx.font="900 11px system-ui";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.fillText(String(i+1),Math.cos(a)*(hitR+30),Math.sin(a)*(hitR+30));
    }

    ctx.strokeStyle="rgba(255,255,255,.08)"; ctx.lineWidth=1;
    for(let r=baseR*.36;r<baseR*.95;r+=baseR*.16){ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();}
    ctx.fillStyle="#071120"; ctx.beginPath(); ctx.arc(0,0,baseR*.36,0,TAU); ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.28)"; ctx.lineWidth=4; ctx.stroke();
    ctx.strokeStyle="rgba(92,255,251,.20)"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,0,baseR*.27,0,TAU); ctx.stroke();
    ctx.restore();
  }

  function drawArm(){
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(armAngle);
    const c=filterHeld?COLORS.fx:"#5cfffb";
    ctx.save(); ctx.shadowBlur=26; ctx.shadowColor=c; ctx.lineCap="round";
    ctx.strokeStyle="rgba(255,255,255,.22)"; ctx.lineWidth=21; ctx.beginPath(); ctx.arc(0,0,hitR,-DIAL_ARC_VISUAL,DIAL_ARC_VISUAL); ctx.stroke();
    ctx.strokeStyle=c; ctx.lineWidth=13; ctx.beginPath(); ctx.arc(0,0,hitR,-DIAL_ARC_HALF,DIAL_ARC_HALF); ctx.stroke();
    ctx.fillStyle=c; ctx.beginPath(); ctx.arc(hitR,0,8,0,TAU); ctx.fill(); ctx.restore();
    ctx.shadowBlur=18; ctx.shadowColor=c; ctx.strokeStyle=c; ctx.lineWidth=5; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(baseR*.33,0); ctx.lineTo(hitR*.93,0); ctx.stroke();
    ctx.restore();
  }

  function currentFocusNote(t){
    let best=null;
    let bestScore=999;
    for(const n of chart){
      if(n.done||n.missed)continue;
      const end=n.hitTime+(n.duration||0);
      if(n.type.startsWith("slide") && t>=n.hitTime && t<=end) return n;
      if(n.type==="fx" && t>=n.hitTime && t<=end) return n;
      const d=Math.abs(n.hitTime-t);
      if(d<bestScore && n.hitTime-t>-0.22){
        best=n;
        bestScore=d;
      }
    }
    return best;
  }

  function drawDirectedArcSegments(r, start, amount, color, width, alpha=1){
    // Canvas arc는 2π 경계/긴 호에서 헷갈릴 수 있으므로
    // 긴 슬라이드는 작은 조각으로 직접 그림.
    const steps = Math.max(10, Math.ceil(Math.abs(amount) / (Math.PI / 18)));
    ctx.save();
    ctx.translate(cx,cy);
    ctx.lineCap="round";
    ctx.strokeStyle=color;
    ctx.globalAlpha=alpha;
    ctx.lineWidth=width;
    ctx.beginPath();
    for(let i=0;i<=steps;i++){
      const a=start + amount * (i/steps);
      const x=Math.cos(a)*r, y=Math.sin(a)*r;
      if(i===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    }
    ctx.stroke();
    ctx.globalAlpha=1;
    ctx.restore();
  }

  function drawLandingGhost(n,t){
    if(n.done||n.missed)return;
    const color=noteColor(n);
    const p=progress(n,t);
    if(p<=0 || p>=1.05)return;

    const isFocus=n===focusNote;
    const alpha=isFocus?.34:.17;
    const width=isFocus?8:5;

    if(n.type.startsWith("slide") || n.type.startsWith("scratch")){
      const isScratch=n.type.startsWith("scratch");
      const d=slideDelta(n);
      const endA=n.angle+d;
      const dir=d>=0?1:-1;
      const mainColor=isScratch?noteColor(n):COLORS.slide;
      const glowColor=isScratch?`rgba(255,96,96,${isFocus?.34:.18})`:`rgba(255,225,90,${isFocus?.34:.18})`;
      drawDirectedArcSegments(hitR,n.angle,d,glowColor,isFocus?9:6,1);

      ctx.save();
      ctx.translate(cx,cy);
      ctx.lineCap="round";
      ctx.shadowBlur=isFocus?18:8;
      ctx.shadowColor=mainColor;

      ctx.fillStyle=`rgba(255,255,255,${isFocus?.95:.55})`;
      ctx.beginPath(); ctx.arc(Math.cos(n.angle)*hitR,Math.sin(n.angle)*hitR,isFocus?8:6,0,TAU); ctx.fill();
      ctx.strokeStyle=mainColor; ctx.lineWidth=3; ctx.stroke();

      ctx.fillStyle=isScratch?`rgba(255,120,120,${isFocus?.95:.70})`:`rgba(255,225,90,${isFocus?.95:.65})`;
      ctx.beginPath(); ctx.arc(Math.cos(endA)*hitR,Math.sin(endA)*hitR,isFocus?9:7,0,TAU); ctx.fill();
      ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.stroke();

      ctx.fillStyle=`rgba(255,255,255,${isFocus?.94:.55})`;
      const arrowCount=Math.max(4,Math.ceil(Math.abs(d)/(Math.PI*.6)));
      for(let i=1;i<=arrowCount;i++){
        const a=n.angle+d*(i/(arrowCount+1));
        const x=Math.cos(a)*hitR,y=Math.sin(a)*hitR;
        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(a+(dir>0?Math.PI*.62:-Math.PI*.38));
        ctx.beginPath();
        ctx.moveTo(11,0);ctx.lineTo(-6,-7);ctx.lineTo(-4,0);ctx.lineTo(-6,7);
        ctx.closePath();ctx.fill();
        ctx.restore();
      }
      if(isScratch){
        ctx.fillStyle="rgba(255,255,255,.78)";
        ctx.font="900 10px system-ui";
        ctx.textAlign="center";ctx.textBaseline="middle";
        const mid=n.angle+d*.5;
        ctx.fillText("SHIFT",Math.cos(mid)*(hitR+22),Math.sin(mid)*(hitR+22));
      }
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(cx,cy);
    ctx.lineCap="round";
    ctx.shadowBlur=isFocus?18:8;
    ctx.shadowColor=color;

    if(n.type==="fx"){
      // HOLD는 실제 몸통만 보이게 한다.
      // 여기서 보라 예고선을 또 그리면 HOLD 위에 선이 중복으로 떠서 가독성이 나빠짐.
      ctx.restore();
      return;
    }else if(n.type.startsWith("swing")){
      ctx.strokeStyle=`rgba(255,255,255,${isFocus?.30:.13})`;
      ctx.lineWidth=isFocus?8:5;
      ctx.beginPath();ctx.arc(0,0,hitR,0,TAU);ctx.stroke();
      ctx.strokeStyle=color;ctx.globalAlpha=isFocus?.38:.18;ctx.lineWidth=isFocus?5:3;
      ctx.beginPath();ctx.arc(0,0,hitR,0,TAU);ctx.stroke();
      ctx.globalAlpha=1;
    }else{
      const half=Math.PI*.055;
      ctx.strokeStyle=`rgba(255,255,255,${alpha})`;
      ctx.lineWidth=width+4;
      ctx.beginPath();ctx.arc(0,0,hitR,n.angle-half,n.angle+half);ctx.stroke();
      ctx.strokeStyle=color;ctx.globalAlpha=isFocus?.46:.25;ctx.lineWidth=width;
      ctx.beginPath();ctx.arc(0,0,hitR,n.angle-half,n.angle+half);ctx.stroke();
      ctx.globalAlpha=1;
    }
    ctx.restore();
  }

  function drawApproachRail(n,t){
    if(n.done||n.missed||t<n.spawnTime||t>n.hitTime+.05)return;
    if(n.type.startsWith("slide"))return;
    if(n.type.startsWith("swing"))return;
    if(n.type.startsWith("scratch"))return;
    if(n.type==="fx")return;
    const color=noteColor(n);
    const r=noteR(n,t);
    const a=n.angle;
    const isFocus=n===focusNote;
    ctx.save();
    ctx.translate(cx,cy);
    ctx.lineCap="round";
    ctx.strokeStyle=isFocus?`rgba(255,255,255,.30)`:`rgba(255,255,255,.12)`;
    ctx.lineWidth=isFocus?4:2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*hitR,Math.sin(a)*hitR);
    ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
    ctx.stroke();
    ctx.strokeStyle=color;
    ctx.globalAlpha=isFocus?.30:.14;
    ctx.lineWidth=isFocus?3:2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*hitR,Math.sin(a)*hitR);
    ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
    ctx.stroke();
    ctx.globalAlpha=1;
    ctx.restore();
  }

  function pointOnRing(angle,r){
    return {x:cx+Math.cos(angle)*r,y:cy+Math.sin(angle)*r};
  }

  function drawRingLabel(text, angle, r, color, size=13){
    const p=pointOnRing(angle,r);
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.rotate(angle+Math.PI/2);
    ctx.fillStyle=color;
    ctx.font=`900 ${size}px system-ui`;
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.shadowBlur=12;
    ctx.shadowColor=color;
    ctx.fillText(text,0,0);
    ctx.restore();
  }

  function drawArcNote(angle, r, halfWidth, color, lineWidth, alpha=1){
    ctx.save();
    ctx.translate(cx,cy);
    ctx.globalAlpha=alpha;
    ctx.lineCap="round";
    ctx.shadowBlur=22;
    ctx.shadowColor=color;
    ctx.strokeStyle=color;
    ctx.lineWidth=lineWidth;
    ctx.beginPath();
    ctx.arc(0,0,r,angle-halfWidth,angle+halfWidth);
    ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,.80)";
    ctx.lineWidth=Math.max(2,lineWidth*.16);
    ctx.beginPath();
    ctx.arc(0,0,r,angle-halfWidth*.78,angle+halfWidth*.78);
    ctx.stroke();
    ctx.restore();
  }

  function drawCut(n,t){
    const r=noteR(n,t), color=COLORS.cut;
    const k=progress(n,t);
    const half=lerp(Math.PI*.030, Math.PI*.060, k);
    const focus = n===focusNote;
    drawArcNote(n.angle,r,half,color,focus?NOTE_WIDTHS.cut+3:NOTE_WIDTHS.cut,focus?1:.92);
    drawRingLabel("CUT",n.angle,r,focus?"#ffffff":color,focus?14:12);
  }

  function drawTrace(n,t){
    const active=t>=n.hitTime;
    const r=active?hitR:noteR(n,t), color=COLORS.trace;
    const k=progress(n,t);
    const focus=n===focusNote;
    const d=slideDelta(n);
    const curr=slideAngle(n,t);
    const remaining=d*clamp(1-(active?((t-n.hitTime)/Math.max(n.duration,.001)):0),0,1);
    const alpha=focus?.75:.62;

    ctx.save();
    ctx.translate(cx,cy);
    ctx.lineCap="round";
    ctx.shadowBlur=focus?18:10;
    ctx.shadowColor=color;
    if(Math.abs(d)>.03){
      const pathStart=active?curr:n.angle;
      const pathDelta=active?remaining:d;
      drawDirectedArcSegments(r,pathStart,pathDelta,`rgba(223,252,255,${alpha})`,focus?NOTE_WIDTHS.trace+1:NOTE_WIDTHS.trace,1);
      drawDirectedArcSegments(r,pathStart,pathDelta,`rgba(255,255,255,${focus?.36:.28})`,focus?2.2:1.6,1);
    }else{
      ctx.strokeStyle=`rgba(223,252,255,${alpha})`;
      ctx.lineWidth=focus?NOTE_WIDTHS.trace+1:NOTE_WIDTHS.trace;
      ctx.setLineDash([6,8]);
      ctx.beginPath();ctx.arc(0,0,r,n.angle-Math.PI*.13,n.angle+Math.PI*.13);ctx.stroke();
      ctx.setLineDash([]);
    }
    const targetAngle=active?curr:n.angle;
    const startA=n.angle, endA=n.angle+d;
    ctx.fillStyle=`rgba(223,252,255,${focus?.34:.24})`;
    ctx.beginPath();ctx.arc(Math.cos(startA)*r,Math.sin(startA)*r,focus?4.5:3.5,0,TAU);ctx.fill();
    ctx.beginPath();ctx.arc(Math.cos(endA)*r,Math.sin(endA)*r,focus?4.5:3.5,0,TAU);ctx.fill();
    ctx.strokeStyle=`rgba(255,255,255,${focus?.42:.30})`;ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle=`rgba(255,255,255,${focus?.94:.82})`;
    ctx.beginPath();ctx.arc(Math.cos(targetAngle)*r,Math.sin(targetAngle)*r,focus?6:4.8,0,TAU);ctx.fill();
    ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
  }

  function drawSwing(n,t){
    const color=noteColor(n), dir=n.type==="swingCW"?1:-1;
    const k=progress(n,t);
    const r=lerp(outerR, hitR, k);
    const span=Math.PI*.52;
    const center=n.angle + dir*.18*Math.sin(k*Math.PI);

    ctx.save();
    ctx.translate(cx,cy);
    ctx.lineCap="round";
    ctx.shadowBlur=n===focusNote?18:8;
    ctx.shadowColor=color;

    ctx.strokeStyle=`rgba(255,255,255,${n===focusNote?.24:.12})`;
    ctx.lineWidth=n===focusNote?NOTE_WIDTHS.swing+4:NOTE_WIDTHS.swing;
    ctx.beginPath();
    ctx.arc(0,0,r,center-span*.62,center+span*.62,dir<0);
    ctx.stroke();

    ctx.strokeStyle=color;
    ctx.globalAlpha=n===focusNote?.78:.58;
    ctx.lineWidth=n===focusNote?NOTE_WIDTHS.swing+1:NOTE_WIDTHS.swing;
    ctx.beginPath();
    ctx.arc(0,0,r,center-span*.5,center+dir*span,dir<0);
    ctx.stroke();
    ctx.globalAlpha=1;

    const arrowA=center+dir*span;
    ctx.save();
    ctx.translate(Math.cos(arrowA)*r,Math.sin(arrowA)*r);
    ctx.rotate(arrowA + (dir>0 ? Math.PI*.62 : -Math.PI*.38));
    ctx.fillStyle="rgba(255,255,255,.92)";
    ctx.beginPath();
    ctx.moveTo(17,0);ctx.lineTo(-9,-9);ctx.lineTo(-5,0);ctx.lineTo(-9,9);ctx.closePath();ctx.fill();
    ctx.restore();

    drawRingLabel(dir>0?"↻":"↺",center,r+24,"rgba(255,255,255,.86)",n===focusNote?18:14);
    ctx.restore();
  }


  function drawSlide(n,t){
    const active=t>=n.hitTime;
    const r=active?hitR:noteR(n,t);
    const start=n.angle;
    const d=slideDelta(n);
    const end=start+d;
    const dir=d>=0?1:-1;

    function drawArrowAt(angle,rad,size=11,alpha=.9){
      ctx.save();
      ctx.translate(cx+Math.cos(angle)*rad, cy+Math.sin(angle)*rad);
      ctx.rotate(angle + (dir>0 ? Math.PI*.62 : -Math.PI*.38));
      ctx.globalAlpha=alpha;
      ctx.fillStyle="#ffffff";
      ctx.beginPath();
      ctx.moveTo(size,0);
      ctx.lineTo(-size*.55,-size*.60);
      ctx.lineTo(-size*.35,0);
      ctx.lineTo(-size*.55,size*.60);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha=1;
      ctx.restore();
    }

    if(!active){
      drawDirectedArcSegments(r,start,d,"rgba(255,225,90,.42)",NOTE_WIDTHS.slide+4,1);
      drawDirectedArcSegments(r,start,d,"rgba(255,255,255,.18)",3,1);

      const arrowCount=Math.max(3,Math.ceil(Math.abs(d)/(Math.PI*.55)));
      for(let i=1;i<=arrowCount;i++) drawArrowAt(start+d*(i/(arrowCount+1)),r,10,.72);

      ctx.save();
      ctx.translate(cx,cy);
      ctx.shadowBlur=18;
      ctx.shadowColor=COLORS.slide;

      ctx.fillStyle="#ffffff";
      ctx.beginPath();
      ctx.arc(Math.cos(start)*r,Math.sin(start)*r,12,0,TAU);
      ctx.fill();
      ctx.strokeStyle=COLORS.slide;
      ctx.lineWidth=4;
      ctx.stroke();

      ctx.fillStyle=COLORS.slide;
      ctx.beginPath();
      ctx.arc(Math.cos(end)*r,Math.sin(end)*r,13,0,TAU);
      ctx.fill();
      ctx.strokeStyle="#fff";
      ctx.lineWidth=3;
      ctx.stroke();

      ctx.fillStyle="#07101f";
      ctx.font="900 10px system-ui";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.fillText("S",Math.cos(start)*r,Math.sin(start)*r);
      ctx.fillText("E",Math.cos(end)*r,Math.sin(end)*r);
      ctx.restore();
      return;
    }

    const k=clamp((t-n.hitTime)/n.duration,0,1);
    const curr=start+d*k;

    if(Math.abs(curr-start)>0.003){
      drawDirectedArcSegments(hitR,start,curr-start,"rgba(255,240,170,.22)",9,1);
      drawDirectedArcSegments(hitR,start,curr-start,"rgba(255,255,255,.10)",4,1);
    }
    if(Math.abs(end-curr)>0.003){
      drawDirectedArcSegments(hitR,curr,end-curr,"rgba(255,225,90,.96)",NOTE_WIDTHS.slide+6,1);
      drawDirectedArcSegments(hitR,curr,end-curr,"rgba(255,255,255,.38)",3.5,1);
    }

    const arrowCount=Math.max(3,Math.ceil(Math.abs(end-curr)/(Math.PI*.55)));
    for(let i=1;i<=arrowCount;i++) drawArrowAt(curr+(end-curr)*(i/(arrowCount+1)),hitR,11,.9);

    const tailSpan=d*Math.min(.16,.05+.11*k);
    if(Math.abs(tailSpan)>0.003) drawDirectedArcSegments(hitR,curr-tailSpan,tailSpan,"rgba(255,255,255,.22)",10,1);

    ctx.save();
    ctx.translate(cx,cy);
    ctx.shadowBlur=24;
    ctx.shadowColor=COLORS.slide;

    ctx.fillStyle="rgba(255,255,255,.70)";
    ctx.beginPath();
    ctx.arc(Math.cos(start)*hitR,Math.sin(start)*hitR,11,0,TAU);
    ctx.fill();
    ctx.strokeStyle=COLORS.slide;
    ctx.lineWidth=4;
    ctx.stroke();

    ctx.fillStyle=COLORS.slide;
    ctx.beginPath();
    ctx.arc(Math.cos(end)*hitR,Math.sin(end)*hitR,14,0,TAU);
    ctx.fill();
    ctx.strokeStyle="#fff";
    ctx.lineWidth=3;
    ctx.stroke();

    ctx.fillStyle="#07101f";
    ctx.font="900 10px system-ui";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText("S",Math.cos(start)*hitR,Math.sin(start)*hitR);
    ctx.fillText("E",Math.cos(end)*hitR,Math.sin(end)*hitR);

    ctx.fillStyle="#fff";
    ctx.beginPath();
    ctx.arc(Math.cos(curr)*hitR,Math.sin(curr)*hitR,n===focusNote?16:12,0,TAU);
    ctx.fill();
    ctx.strokeStyle="rgba(0,0,0,.55)";
    ctx.lineWidth=3;
    ctx.stroke();

    ctx.restore();
  }

  function drawFx(n,t){
    const active=t>=n.hitTime;
    const color=COLORS.fx;
    const focus=n===focusNote;
    const k=progress(n,t);

    const headR = active ? hitR : noteR(n,t);
    const maxOuter = outerR + baseR*.08;
    const maxLen = baseR*.62;
    const startLen = Math.min(maxLen, Math.max(28, maxOuter-headR));
    const holdRatio = active ? clamp(n.hold/n.duration,0,1) : 0;
    const visibleLen = active ? lerp(startLen,0,holdRatio) : startLen;
    const tailR = headR + visibleLen;
    const alpha = active ? (1-holdRatio*.38) : (.22+.78*k);

    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(n.angle);
    ctx.globalAlpha=alpha;
    ctx.shadowBlur=24;
    ctx.shadowColor=color;
    ctx.lineCap="round";

    if(visibleLen>0.5){
      ctx.strokeStyle=active?"rgba(183,124,255,.92)":"rgba(183,124,255,.72)";
      ctx.lineWidth=focus?NOTE_WIDTHS.hold+4:NOTE_WIDTHS.hold;
      ctx.beginPath();ctx.moveTo(headR,0);ctx.lineTo(tailR,0);ctx.stroke();

      ctx.strokeStyle="rgba(255,255,255,.62)";
      ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(headR+12,0);ctx.lineTo(Math.max(headR+12,tailR-12),0);ctx.stroke();

      ctx.fillStyle="#ffffff";
      ctx.beginPath();ctx.arc(headR,0,focus?14:12,0,TAU);ctx.fill();
      ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=3;ctx.stroke();

      ctx.fillStyle=color;
      ctx.beginPath();ctx.arc(tailR,0,focus?11:9,0,TAU);ctx.fill();
      ctx.strokeStyle="#ffffff";ctx.lineWidth=2;ctx.stroke();

      if(visibleLen>34){
        ctx.fillStyle="#fff";
        ctx.font="900 12px system-ui";
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        ctx.fillText("START",headR,-18);
        ctx.fillText("END",tailR,18);
      }
    }else{
      ctx.fillStyle="#ffffff";
      ctx.beginPath();ctx.arc(headR,0,focus?14:12,0,TAU);ctx.fill();
      ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=3;ctx.stroke();
    }

    ctx.globalAlpha=1;
    ctx.restore();
  }

  function drawScratch(n,t){
    const r=t>=n.hitTime?hitR:noteR(n,t);
    const dir=n.type==="scratchCW"?1:-1;
    const color=noteColor(n);
    const focus=n===focusNote;
    const span=Math.PI*.34;
    const start=n.angle-span*.5;
    const end=n.angle+span*.5;

    ctx.save();
    ctx.translate(cx,cy);
    ctx.lineCap="butt";
    ctx.shadowBlur=focus?14:6;
    ctx.shadowColor=color;

    ctx.strokeStyle=`rgba(255,255,255,${focus?.26:.13})`;
    ctx.lineWidth=focus?NOTE_WIDTHS.scratch+4:NOTE_WIDTHS.scratch;
    ctx.beginPath();ctx.arc(0,0,r,start,end);ctx.stroke();

    ctx.strokeStyle=color;
    ctx.lineWidth=focus?NOTE_WIDTHS.scratch+1:NOTE_WIDTHS.scratch;
    ctx.beginPath();ctx.arc(0,0,r,start,end);ctx.stroke();

    ctx.strokeStyle="rgba(255,238,210,.75)";
    ctx.lineWidth=2;
    ctx.setLineDash([4,5]);
    ctx.beginPath();ctx.arc(0,0,r+7,start,end);ctx.stroke();
    ctx.setLineDash([]);

    for(let i=0;i<5;i++){
      const a=start+(end-start)*(i+.5)/5;
      const rr=r+(i%2?9:-2);
      ctx.save();
      ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);
      ctx.rotate(a+Math.PI/2);
      ctx.fillStyle="rgba(255,245,230,.86)";
      ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,3);ctx.lineTo(-5,3);ctx.closePath();ctx.fill();
      ctx.restore();
    }

    const arrowA=n.angle+dir*span*.62;
    ctx.save();
    ctx.translate(Math.cos(arrowA)*(r+18),Math.sin(arrowA)*(r+18));
    ctx.rotate(arrowA + (dir>0 ? Math.PI*.62 : -Math.PI*.38));
    ctx.fillStyle="rgba(255,255,255,.92)";
    ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-7,-7);ctx.lineTo(-3,0);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();
    ctx.restore();

    ctx.fillStyle="rgba(255,245,235,.86)";
    ctx.font="900 10px system-ui";
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText("SHIFT",Math.cos(n.angle)*(r+32),Math.sin(n.angle)*(r+32));
    ctx.restore();
  }


  function focusAngleFor(n,t){
    if(!n)return 0;
    if(n.type.startsWith("slide"))return t>=n.hitTime?slideAngle(n,t):n.angle;
    if(n.type.startsWith("scratch"))return n.angle;
    if(n.type==="fx")return n.angle;
    return n.angle;
  }

  function drawFocusHalo(n,t){
    if(!n || n.done || n.missed)return;
    try{
      const color=noteColor(n);
      const pulse=.5+.5*Math.sin(t*18);
      ctx.save();
      ctx.translate(cx,cy);
      ctx.lineCap="round";
      ctx.shadowBlur=28+18*pulse;
      ctx.shadowColor=color;

      if(n.type.startsWith("swing")){
        ctx.strokeStyle=color;
        ctx.globalAlpha=.50+.22*pulse;
        ctx.lineWidth=8+4*pulse;
        ctx.beginPath();
        ctx.arc(0,0,hitR+10+8*pulse,0,TAU);
        ctx.stroke();

        ctx.fillStyle="rgba(255,255,255,.95)";
        ctx.font=`900 ${Math.max(22,baseR*.14)}px system-ui`;
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        ctx.fillText(n.type==="swingCW"?"↻ NOW":"↺ NOW",0,-baseR*.32);
      }else{
        const a=focusAngleFor(n,t);
        const isScratch=n.type.startsWith("scratch");
        const isSlide=n.type.startsWith("slide");
        const r=(isSlide||n.type==="fx")?hitR:noteR(n,t);

        ctx.strokeStyle="rgba(255,255,255,.42)";
        ctx.lineWidth=18;
        ctx.beginPath();
        ctx.arc(Math.cos(a)*hitR,Math.sin(a)*hitR,18+5*pulse,0,TAU);
        ctx.stroke();

        ctx.strokeStyle=color;
        ctx.globalAlpha=.82;
        ctx.lineWidth=6+3*pulse;
        ctx.beginPath();
        ctx.arc(Math.cos(a)*hitR,Math.sin(a)*hitR,24+8*pulse,0,TAU);
        ctx.stroke();

        if(isScratch){
          ctx.strokeStyle="rgba(255,80,80,.75)";
          ctx.setLineDash([7,7]);
          ctx.beginPath();
          ctx.arc(0,0,hitR+16+5*pulse,a-.42,a+.42);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.fillStyle="rgba(255,255,255,.88)";
        ctx.font="900 10px system-ui";
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        ctx.fillText(isScratch?"SHIFT":(isSlide||n.type==="fx"?"HOLD":"NOW"),Math.cos(a)*(hitR+36),Math.sin(a)*(hitR+36));
      }

      ctx.restore();
      ctx.globalAlpha=1;
    }catch(e){
      try{ctx.restore();}catch(_){}
      ctx.globalAlpha=1;
    }
  }

  function drawNote(n,t){
    if(n.done||n.missed||t<n.spawnTime)return;
    if(n.type.startsWith("slide")){if(t>n.hitTime+n.duration+.30)return; drawSlide(n,t); return;}
    if(n.duration>0&&t>n.hitTime+n.duration+.45)return;
    if(n.duration===0&&t>n.hitTime+.36)return;
    if(n.type==="cut")drawCut(n,t);
    else if(n.type.startsWith("trace"))drawTrace(n,t);
    else if(n.type.startsWith("swing"))drawSwing(n,t);
    else if(n.type.startsWith("scratch"))drawScratch(n,t);
    else if(n.type==="fx")drawFx(n,t);
  }

  function drawEffects(dt){
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i]; p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=.985; p.vy*=.985;
      if(p.life<=0){particles.splice(i,1);continue;}
      ctx.globalAlpha=clamp(p.life/.6,0,1); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,3.5,0,TAU); ctx.fill(); ctx.globalAlpha=1;
    }
    for(let i=waves.length-1;i>=0;i--){
      const w=waves[i]; w.life-=dt; if(w.life<=0){waves.splice(i,1);continue;}
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(w.angle); ctx.globalAlpha=clamp(w.life/.38,0,1);
      ctx.strokeStyle=w.color; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(hitR,0,24+(1-w.life/.38)*36,0,TAU); ctx.stroke(); ctx.restore(); ctx.globalAlpha=1;
    }
    for(let i=ringBursts.length-1;i>=0;i--){
      const r=ringBursts[i];
      r.life-=dt;
      if(r.life<=0){ringBursts.splice(i,1);continue;}
      try{
        const p=1-r.life/.52;
        ctx.save();
        ctx.translate(cx,cy);
        ctx.globalAlpha=clamp(r.life/.52,0,1);

        ctx.strokeStyle=r.color;
        ctx.lineWidth=12*(1-p*.35);
        ctx.beginPath();
        ctx.arc(0,0,hitR + p*70*r.power,0,TAU);
        ctx.stroke();

        ctx.strokeStyle="rgba(255,255,255,.85)";
        ctx.lineWidth=4;
        ctx.beginPath();
        ctx.arc(0,0,baseR*.38 + p*86*r.power,0,TAU);
        ctx.stroke();

        const pulseR = hitR + p*44*r.power;
        const arrowCount=8;
        ctx.fillStyle=r.color;
        for(let k=0;k<arrowCount;k++){
          const a=k/arrowCount*TAU + p*.7;
          const x=Math.cos(a)*pulseR;
          const y=Math.sin(a)*pulseR;
          ctx.save();
          ctx.translate(x,y);
          ctx.rotate(a+Math.PI*.5);
          ctx.beginPath();
          ctx.moveTo(11,0);
          ctx.lineTo(-6,-6);
          ctx.lineTo(-3,0);
          ctx.lineTo(-6,6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        if(r.label){
          ctx.fillStyle="rgba(255,255,255,.95)";
          ctx.font="900 20px system-ui";
          ctx.textAlign="center";
          ctx.textBaseline="middle";
          ctx.fillText(r.label,0,0);
        }
        ctx.restore();
        ctx.globalAlpha=1;
      }catch(e){
        try{ctx.restore();}catch(_){}
        ctx.globalAlpha=1;
        ringBursts.splice(i,1);
      }
    }

    for(let i=scratchBursts.length-1;i>=0;i--){
      const s=scratchBursts[i];
      s.life-=dt;
      if(s.life<=0){scratchBursts.splice(i,1);continue;}
      try{
        const p=1-s.life/.48;
        ctx.save();
        ctx.translate(cx,cy);
        ctx.rotate(s.angle);
        ctx.globalAlpha=clamp(s.life/.48,0,1);
        ctx.shadowBlur=28;
        ctx.shadowColor=s.color;

        // 빨간 전기/톱니 느낌의 짧은 원호
        ctx.strokeStyle=s.color;
        ctx.lineWidth=8;
        ctx.beginPath();
        const span=.88 + p*.45;
        const start=-span*.5*s.dir;
        const end=span*.5*s.dir;
        ctx.arc(0,0,hitR+18+p*24,start,end,s.dir<0);
        ctx.stroke();

        ctx.strokeStyle="rgba(255,255,255,.70)";
        ctx.lineWidth=3;
        ctx.setLineDash([5,6]);
        ctx.beginPath();
        ctx.arc(0,0,hitR+34+p*34,start*1.2,end*1.2,s.dir<0);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle=s.color;
        for(let k=0;k<9;k++){
          const a=(-.55 + k*.14)*s.dir;
          const rr=hitR+18+p*26 + (k%2)*12;
          ctx.save();
          ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);
          ctx.rotate(a + Math.PI*.5*s.dir);
          ctx.beginPath();
          ctx.moveTo(10,0);
          ctx.lineTo(-6,-8);
          ctx.lineTo(-2,0);
          ctx.lineTo(-6,8);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
        ctx.globalAlpha=1;
      }catch(e){
        try{ctx.restore();}catch(_){}
        ctx.globalAlpha=1;
        scratchBursts.splice(i,1);
      }
    }

    for(let i=feedback.length-1;i>=0;i--){
      const f=feedback[i]; f.life-=dt; f.y-=26*dt; if(f.life<=0){feedback.splice(i,1);continue;}
      const big = f.text==="↻" || f.text==="↺";
      ctx.globalAlpha=clamp(f.life/.65,0,1);
      ctx.fillStyle=f.color;
      ctx.font=big ? "900 18px system-ui" : "900 13px system-ui";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.fillText(f.text,f.x,f.y);
      ctx.globalAlpha=1;
    }
  }

  function formatSpeed(){ return "SPEED " + (1/APPROACH).toFixed(2) + "x"; }
  function formatOffset(){ return "OFFSET " + SONG_OFFSET.toFixed(2) + "s"; }
  function formatSfx(){ return "SFX " + Math.round(clamp(sfxVolume,0,4)*100) + "%" + (sfxEnabled ? "" : " OFF"); }
  function formatMusic(){ return "MUSIC " + Math.round(clamp(musicVolume,0,1)*100) + "%"; }
  function refreshSettingsUI(){ updateButtons(); }

  function updateButtons(){
    applyMusicVolume();
    autoBox.textContent=autoMode?"AUTO ON":"AUTO OFF";
    mapBox.textContent=mapMode==="tech"?"MAP TECH":"MAP NORMAL";
    autoToggle.textContent=autoMode?"AUTO ON":"AUTO OFF";
    autoToggle.classList.toggle("on",autoMode);
    mapToggle.textContent=mapMode==="tech"?"MAP TECH":"MAP NORMAL";
    mapToggle.classList.toggle("on",mapMode==="tech");
    if(speedValue) speedValue.textContent = formatSpeed();
    if(offsetValue) offsetValue.textContent = formatOffset();
    if(sfxValue) sfxValue.textContent = formatSfx();
    if(musicValue) musicValue.textContent = formatMusic();
    if(typeof safeRefresh === "function") safeRefresh();
  }

  function endGame(stopAudio=true){
    running=false;
    setCleanGameplay(false);
    if(raf){
      cancelAnimationFrame(raf);
      raf=0;
    }
    if(stopAudio){
      try{ song.pause(); }catch(e){}
    }
    startLayer.style.display="flex";
    updateButtons();
  }

  function showPause(){
    if(!running || paused) return;
    paused=true;
    song.pause();
    if(raf){cancelAnimationFrame(raf);raf=0;}
    if(pauseOverlay) pauseOverlay.classList.add("show");
  }

  function resumeGame(){
    if(!paused) return;
    paused=false;
    if(pauseOverlay) pauseOverlay.classList.remove("show");
    lastMs=performance.now();
    ensureAudioCtx();
    applyMusicVolume();
    song.play().catch(()=>{});
    raf=requestAnimationFrame(frame);
  }

  function retryGame(){
    if(pauseOverlay) pauseOverlay.classList.remove("show");
    paused=false;
    start(editorMode?"editor":"play");
  }

  function exitToMenu(){
    if(pauseOverlay) pauseOverlay.classList.remove("show");
    paused=false;
    endGame(true);
  }

  function frame(ms){
    if(!running)return;
    const dt=Math.min(.033,(ms-lastMs)/1000||.016);
    lastMs=ms; const t=now();
    if(t >= SONG_END_TIME){ endGame(false); return; }

    // Z/X/Space/우클릭을 기본 액션 홀드로 사용. Shift는 SCRATCH 전용.
    filterHeld = autoMode || mouseDownRight || keys.KeyZ || keys.KeyX || keys.Space;
    scratchHeld = keys.ShiftLeft || keys.ShiftRight;
    updateAuto(t);
    updateArm(dt);
    updateNotes(t,dt);

    focusNote=currentFocusNote(t);

    drawBackground(t);

    // 먼저 착지 예정 위치와 접근 라인을 그림.
    // 실제 노트보다 옅게 보여서 채보 방향을 먼저 읽을 수 있음.
    chart.forEach(n=>drawLandingGhost(n,t));
    chart.forEach(n=>drawApproachRail(n,t));

    chart.forEach(n=>{if(n.type.startsWith("trace"))drawNote(n,t);});
    chart.forEach(n=>{if(!n.type.startsWith("trace"))drawNote(n,t);});
    drawFocusHalo(focusNote,t);
    drawArm();
    drawEffects(dt);

    scoreBox.textContent="SCORE "+Math.floor(score);
    comboBox.textContent="COMBO "+combo;
    updateButtons();
    if(editorMode) updateEditorStatus();
    raf=requestAnimationFrame(frame);
  }

  function start(mode="play"){
    if(raf)cancelAnimationFrame(raf);
    ensureAudioCtx();
    requestFullscreenSafe();
    paused=false;
    if(pauseOverlay) pauseOverlay.classList.remove("show");
    if(selectedMenuMode==="normal") mapMode="normal";
    if(selectedMenuMode==="tech") mapMode="tech";
    if(selectedMenuMode==="custom") useCustomChart=customChartData.length>0;
    editorMode=mode==="editor";
    if(editorPanel)editorPanel.classList.toggle("show",editorMode);
    useCustomChart=(selectedMenuMode==="custom" && customChartData.length>0);
    chart=generateChart(); score=0; combo=0; maxCombo=0;
    feedback=[]; particles=[]; waves=[];
    running=true;
    setCleanGameplay(true);
    toggleSettings(false);
    song.pause();
    try{ song.currentTime=0; }catch(e){}
    if(song.ended){ try{ song.load(); song.currentTime=0; }catch(e){} }
    startMs=performance.now();
    audioStartedAt=startMs;
    lastMs=startMs;
    startLayer.style.display="none";
    mouseX=cx; mouseY=cy-hitR;
    armAngle=targetAngle=prevArmAngle=-Math.PI/2; armVel=0;
    filterHeld=false; scratchHeld=false; mouseDownRight=false;
    updateButtons();
    if(editorMode) updateEditorStatus();

    applyMusicVolume();

    song.play().then(()=>{
      if(raf) cancelAnimationFrame(raf);
      raf=requestAnimationFrame(frame);
    }).catch(err=>{
      console.warn("audio play failed", err);
      // 재생 실패해도 화면은 돌리되, 사용자가 P나 에디터 PLAY로 다시 재생 가능.
      if(raf) cancelAnimationFrame(raf);
      raf=requestAnimationFrame(frame);
    });
  }

  function restartIfRunning(){ if(running)start(); else updateButtons(); }
  function toggleKeymap(force){
    const show=force!==undefined?force:!keymapOverlay.classList.contains("show");
    keymapOverlay.classList.toggle("show",show);
  }
  function setCleanGameplay(on){
    document.body.classList.toggle("playingClean", !!on);
    if(!on){
      document.body.classList.remove("showSettings");
      settingsVisible=false;
    }
  }

  function toggleSettings(force){
    settingsVisible = force!==undefined ? force : !settingsVisible;
    document.body.classList.toggle("showSettings", settingsVisible);
    if(quickSettingsBtn) quickSettingsBtn.classList.toggle("on", settingsVisible);
  }

  function updateModeButtons(){
    if(modeNormalBtn) modeNormalBtn.classList.toggle("on",selectedMenuMode==="normal");
    if(modeTechBtn) modeTechBtn.classList.toggle("on",selectedMenuMode==="tech");
    if(modeCustomBtn) modeCustomBtn.classList.toggle("on",selectedMenuMode==="custom");
  }

  function requestFullscreenSafe(){
    const el=document.documentElement;
    if(!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(()=>{});
    else if(document.exitFullscreen) document.exitFullscreen().catch(()=>{});
  }
  function beatNow(){return Math.max(0, now()/(BEAT*CHART_STRETCH));}
  function updateEditorStatus(){
    if(editorStatus) editorStatus.textContent="custom notes: "+customChartData.length+" / beat "+beatNow().toFixed(2)+" / lane "+(selectedLane+1);
    if(playPauseBtn) playPauseBtn.textContent=song.paused?"PLAY":"PAUSE";
    if(editorToggle) editorToggle.classList.toggle("on",editorMode);
  }
  function rebuildCustomChart(){useCustomChart=customChartData.length>0;chart=generateChart();updateEditorStatus();}
  function snapBeat(b,grid=.25){return Math.round(b/grid)*grid;}
  function addEditorNote(type){
    const b=snapBeat(beatNow(),.25), lane=selectedLane;
    const d={type,beat:b,lane};
    if(type==="fx") d.durationBeat=4;
    if(type==="slideCW"||type==="slideCCW"||type==="scratchCW"||type==="scratchCCW"){
      d.durationBeat=4;
      d.endLane=(lane+3)%8;
    }
    customChartData.push(d);customChartData.sort((a,b)=>a.beat-b.beat);rebuildCustomChart();playHitSound(type,"PERFECT");
  }
  function exportChart(){chartText.value=JSON.stringify({title:"ANiMA custom chart",bpm:BPM,offset:SONG_OFFSET,notes:customChartData},null,2);}
  function importChart(){try{const data=JSON.parse(chartText.value);customChartData=Array.isArray(data)?data:(data.notes||[]);if(typeof data.offset==="number")SONG_OFFSET=data.offset;rebuildCustomChart();updateButtons();}catch(e){chartText.value="IMPORT ERROR: "+e.message;}}
  function toggleEditor(force){editorMode=force!==undefined?force:!editorMode;if(editorMode)toggleSettings(true);if(editorPanel)editorPanel.classList.toggle("show",editorMode);updateEditorStatus();}

  function changeSpeed(delta){
    // APPROACH가 작을수록 노트가 빠르게 다가옴.
    APPROACH = clamp(APPROACH + delta, 0.34, 1.10);
    if(running){
      // 현재 속도 변경을 새로 생성되는 노트에 반영하려면 채보 재시작이 가장 안정적.
      // 플레이 중에는 즉시 표시값만 바뀌고, 다음 START/MAP부터 확실히 적용됨.
    }
    updateButtons();
  }

  function changeOffset(delta){
    SONG_OFFSET = clamp(SONG_OFFSET + delta, -1.00, 1.00);
    updateButtons();
  }

  function changeSfx(delta){
    sfxVolume = clamp(sfxVolume + delta, 0.00, 4.00);
    sfxEnabled = sfxVolume > 0.001;
    updateButtons();
    playHitSound("cut","PERFECT");
  }

  function applyMusicVolume(){
    const appliedMusicVolume = clamp(musicVolume,0,1);
    musicVolume = appliedMusicVolume;
    song.volume = appliedMusicVolume;
    song.muted = appliedMusicVolume <= 0.001;
  }

  function changeMusic(delta){
    musicVolume = clamp(musicVolume + delta, 0.00, 1.00);
    applyMusicVolume();
    updateButtons();
  }

  function bindPress(el,fn){
    if(!el)return;
    let last=0;
    const h=e=>{ if(e)e.preventDefault(); const m=performance.now(); if(m-last<180)return; last=m; fn(); };
    if(window.PointerEvent)el.addEventListener("pointerup",h);
    else{el.addEventListener("touchend",h,{passive:false});el.addEventListener("click",h);}
  }

  bindPress(startBtn,()=>start("play"));
  bindPress(editorStartBtn,()=>start("editor"));
  bindPress(startFullBtn,requestFullscreenSafe);
  bindPress(modeNormalBtn,()=>{selectedMenuMode="normal";updateModeButtons();});
  bindPress(modeTechBtn,()=>{selectedMenuMode="tech";updateModeButtons();});
  bindPress(modeCustomBtn,()=>{selectedMenuMode="custom";updateModeButtons();});
  bindPress(autoToggle,()=>{autoMode=!autoMode;updateButtons();});
  bindPress(mapToggle,()=>{mapMode=mapMode==="tech"?"normal":"tech";restartIfRunning();});
  bindPress(keymapToggle,()=>toggleKeymap());
  bindPress(editorToggle,()=>toggleEditor());
  bindPress(fullToggle,requestFullscreenSafe);
  bindPress(quickSettingsBtn,()=>toggleSettings());
  bindPress(quickEditorBtn,()=>{toggleSettings(true); toggleEditor();});
  bindPress(quickFullBtn,requestFullscreenSafe);
  bindPress(resumeBtn,resumeGame);
  bindPress(retryBtn,retryGame);
  bindPress(exitBtn,exitToMenu);
  bindPress(closeKeymap,()=>toggleKeymap(false));
  bindPress(speedDown,()=>changeSpeed(+0.04));
  bindPress(speedUp,()=>changeSpeed(-0.04));
  bindPress(offsetDown,()=>changeOffset(-0.03));
  bindPress(offsetUp,()=>changeOffset(+0.03));
  bindPress(sfxDown,()=>changeSfx(-0.20));
  bindPress(sfxUp,()=>changeSfx(+0.20));
  bindPress(musicDown,()=>changeMusic(-0.10));
  bindPress(musicUp,()=>changeMusic(+0.10));
  bindPress(addCutBtn,()=>addEditorNote("cut"));bindPress(addSwingCWBtn,()=>addEditorNote("swingCW"));bindPress(addSwingCCWBtn,()=>addEditorNote("swingCCW"));bindPress(addFxBtn,()=>addEditorNote("fx"));bindPress(addSlideCWBtn,()=>addEditorNote("slideCW"));bindPress(addSlideCCWBtn,()=>addEditorNote("slideCCW"));bindPress(addScratchCWBtn,()=>addEditorNote("scratchCW"));bindPress(addScratchCCWBtn,()=>addEditorNote("scratchCCW"));
  bindPress(seekBackBtn,()=>{song.currentTime=Math.max(0,song.currentTime-1);updateEditorStatus();});
  bindPress(seekFwdBtn,()=>{song.currentTime=Math.min(song.duration||999,song.currentTime+1);updateEditorStatus();});
  bindPress(playPauseBtn,()=>{ensureAudioCtx();applyMusicVolume();if(song.paused)song.play().catch(()=>{});else song.pause();updateEditorStatus();});
  bindPress(deleteLastBtn,()=>{customChartData.pop();rebuildCustomChart();});
  bindPress(exportBtn,exportChart);bindPress(importBtn,importChart);
  bindPress(clearChartBtn,()=>{customChartData=[];useCustomChart=false;rebuildCustomChart();});
  keymapOverlay.addEventListener("click",e=>{if(e.target===keymapOverlay)toggleKeymap(false);});
  if(laneGrid) laneGrid.addEventListener("click",e=>{const btn=e.target.closest("[data-lane]");if(!btn)return;selectedLane=Number(btn.dataset.lane)||0;laneGrid.querySelectorAll("[data-lane]").forEach(b=>b.classList.toggle("on",b===btn));updateEditorStatus();});

  window.addEventListener("mousemove",e=>{mouseX=e.clientX;mouseY=e.clientY;},{passive:true});
  window.addEventListener("pointermove",e=>{mouseX=e.clientX;mouseY=e.clientY;},{passive:true});
  window.addEventListener("touchmove",e=>{if(e.touches&&e.touches[0]){mouseX=e.touches[0].clientX;mouseY=e.touches[0].clientY;}},{passive:true});
  window.addEventListener("contextmenu",e=>e.preventDefault());
  function isUiInputTarget(target){return !!(target && target.closest && target.closest("button,#safeMenu,#safeOverlay,.keymapOverlay,.pauseOverlay,.tuner,.mobileControls,.quickMenu,.editorPanel,.start"));}
  window.addEventListener("mousedown",e=>{if(isUiInputTarget(e.target))return; if(e.button===0 && running)onCut(); if(e.button===2 && running){mouseDownRight=true;filterHeld=true;}});
  window.addEventListener("mouseup",e=>{if(e.button===2){mouseDownRight=false;filterHeld=false;}});
  window.addEventListener("keydown",e=>{
    keys[e.code]=true;
    if(e.code==="KeyA")keyA=true;
    if(e.code==="KeyD")keyD=true;
    if(e.code==="Space"||e.code==="KeyZ"||e.code==="KeyX"){e.preventDefault(); if(!e.repeat)onCut();}
    if(e.code==="KeyO"&&!e.repeat){autoMode=!autoMode;updateButtons();}
    if(e.code==="KeyP"&&!e.repeat){ ensureAudioCtx(); applyMusicVolume(); if(song.paused) song.play().catch(()=>{}); else song.pause(); }
    if(e.code==="KeyS"&&!e.repeat){ sfxEnabled=!sfxEnabled; updateButtons(); }
    if(e.code==="Minus"&&!e.repeat){ changeSfx(-0.20); }
    if(e.code==="Equal"&&!e.repeat){ changeSfx(+0.20); }
    if(e.code==="Digit9"&&!e.repeat){ changeMusic(-0.10); }
    if(e.code==="Digit0"&&!e.repeat){ changeMusic(+0.10); }
    if(e.code==="BracketLeft"&&!e.repeat){ changeSpeed(+0.04); }
    if(e.code==="BracketRight"&&!e.repeat){ changeSpeed(-0.04); }
    if(e.code==="Comma"&&!e.repeat){ changeOffset(-0.03); }
    if(e.code==="Period"&&!e.repeat){ changeOffset(+0.03); }
    if(editorMode&&!e.repeat){
      if(/^Digit[1-8]$/.test(e.code)){selectedLane=Number(e.code.slice(-1))-1;updateEditorStatus();}
      if(e.code==="KeyC")addEditorNote("cut");
      if(e.code==="KeyX")addEditorNote("swingCW");
      if(e.code==="KeyV")addEditorNote("swingCCW");
      if(e.code==="KeyB")addEditorNote("fx");
      if(e.code==="KeyN")addEditorNote("slideCW");
      if(e.code==="KeyJ")addEditorNote("slideCCW");
      if(e.code==="KeyR")addEditorNote("scratchCW");
      if(e.code==="KeyY")addEditorNote("scratchCCW");
    }
    if(e.code==="KeyM"&&!e.repeat){mapMode=mapMode==="tech"?"normal":"tech";restartIfRunning();}
    if(e.code==="KeyK"&&!e.repeat)toggleKeymap();
    if(e.code==="Escape"&&!e.repeat){ if(keymapOverlay&&keymapOverlay.classList.contains("show")) toggleKeymap(false); else if(paused) resumeGame(); else showPause(); }
    if(e.code==="KeyF"&&!e.repeat)requestFullscreenSafe();
    if(e.code==="KeyH"&&!e.repeat)toggleSettings();
    if(e.code==="KeyE"&&!e.repeat){toggleSettings(true); toggleEditor();}
    if(e.code==="ShiftLeft"||e.code==="ShiftRight")scratchHeld=true;
  });
  window.addEventListener("keyup",e=>{
    keys[e.code]=false;
    if(e.code==="KeyA")keyA=false;
    if(e.code==="KeyD")keyD=false;
    if(e.code==="ShiftLeft"||e.code==="ShiftRight")filterHeld=!!(keys.ShiftLeft||keys.ShiftRight||mouseDownRight||autoMode);
  });

  song.addEventListener("ended", ()=>endGame(false));

  // SAFE MENU PATCH: simple menu on top of stable Polish Final.
  const safeMenu=document.getElementById("safeMenu");
  const safeOverlay=document.getElementById("safeOverlay");
  const safeStart=document.getElementById("safeStart");
  const safeTech=document.getElementById("safeTech");
  const safeNormal=document.getElementById("safeNormal");
  const safeAuto=document.getElementById("safeAuto");
  const safeFull=document.getElementById("safeFull");
  const safeSettingsBtn=document.getElementById("safeSettingsBtn");
  const safeEditor=document.getElementById("safeEditor");
  const safeSetAuto=document.getElementById("safeSetAuto");
  const safeSetMap=document.getElementById("safeSetMap");
  const safeSetSfx=document.getElementById("safeSetSfx");
  const safeSetMusic=document.getElementById("safeSetMusic");
  const safeSetSpdDown=document.getElementById("safeSetSpdDown");
  const safeSetSpdUp=document.getElementById("safeSetSpdUp");
  const safeSetOffDown=document.getElementById("safeSetOffDown");
  const safeSetOffUp=document.getElementById("safeSetOffUp");
  const safeResume=document.getElementById("safeResume");
  const safeExit=document.getElementById("safeExit");

  function safeInputEvent(e){
    if(!e)return;
    if(e.cancelable)e.preventDefault();
    e.stopPropagation();
  }

  function safeBind(el,fn){
    if(!el)return;
    let last=0;
    const run=e=>{
      safeInputEvent(e);
      const m=performance.now();
      if(m-last<180)return;
      last=m;
      try{fn();}catch(err){console.error(err);alert("ERROR: "+err.message);}
    };
    el.addEventListener("pointerdown",safeInputEvent,{passive:false});
    el.addEventListener("pointerup",run,{passive:false});
    el.addEventListener("touchend",run,{passive:false});
    el.addEventListener("click",run,{passive:false});
  }

  function safeSetState(state){
    document.body.classList.toggle("safeTitle", state==="title");
    document.body.classList.toggle("safeSettings", state==="settings");
    document.body.classList.toggle("safeGame", state==="game");
    if(safeMenu)safeMenu.style.display=state==="title"?"flex":"none";
    if(safeOverlay)safeOverlay.classList.toggle("show",state==="settings");
    canvas.style.pointerEvents=state==="game"?"auto":"none";
    settingsVisible=state==="settings";
  }

  function safeSetMenuVisible(v){
    safeSetState(v?"title":(settingsVisible?"settings":"game"));
  }

  function safeSetOverlay(v){
    safeSetState(v?"settings":(running?"game":"title"));
  }

  function safeRefresh(){
    applyMusicVolume();
    if(safeTech)safeTech.classList.toggle("on",selectedMenuMode==="tech");
    if(safeNormal)safeNormal.classList.toggle("on",selectedMenuMode==="normal");
    if(safeAuto){safeAuto.textContent=autoMode?"AUTO ON":"AUTO OFF";safeAuto.classList.toggle("on",autoMode);}
    if(safeSetAuto){safeSetAuto.textContent=autoMode?"AUTO ON":"AUTO OFF";safeSetAuto.classList.toggle("on",autoMode);}
    if(safeSetMap){safeSetMap.textContent=mapMode==="tech"?"MAP TECH":"MAP NORMAL";safeSetMap.classList.toggle("on",mapMode==="tech");}
    if(safeSettingsBtn)safeSettingsBtn.textContent="SETTINGS · " + formatSpeed() + " · " + formatMusic() + " · " + formatSfx() + " · " + formatOffset();
    if(safeSetSfx){safeSetSfx.textContent=formatSfx();safeSetSfx.classList.toggle("on",sfxEnabled);}
    if(safeSetMusic)safeSetMusic.textContent=formatMusic();
    if(safeSetSpdDown)safeSetSpdDown.textContent=formatSpeed() + " −";
    if(safeSetSpdUp)safeSetSpdUp.textContent=formatSpeed() + " ＋";
    if(safeSetOffDown)safeSetOffDown.textContent=formatOffset() + " −";
    if(safeSetOffUp)safeSetOffUp.textContent=formatOffset() + " ＋";
  }

  const originalStart=start;
  start=function(mode="play"){
    safeSetState("game");
    document.body.classList.add("safeClean");
    return originalStart(mode);
  };

  const originalEndGame=endGame;
  endGame=function(stopAudio=true){
    originalEndGame(stopAudio);
    document.body.classList.remove("safeClean");
    safeSetOverlay(false);
    safeSetMenuVisible(true);
    if(safeStart)safeStart.textContent="START";
    safeRefresh();
  };

  const originalToggleSettings=toggleSettings;
  toggleSettings=function(force){
    settingsVisible = force!==undefined ? force : !settingsVisible;
    safeSetOverlay(settingsVisible);
    originalToggleSettings(settingsVisible);
    safeRefresh();
  };

  safeBind(safeStart,()=>{safeStart.textContent="LOADING...";start("play");});
  safeBind(safeEditor,()=>{safeStart.textContent="LOADING...";start("editor");});
  safeBind(safeTech,()=>{selectedMenuMode="tech";mapMode="tech";safeRefresh();updateButtons();});
  safeBind(safeNormal,()=>{selectedMenuMode="normal";mapMode="normal";safeRefresh();updateButtons();});
  safeBind(safeAuto,()=>{autoMode=!autoMode;safeRefresh();updateButtons();});
  safeBind(safeFull,requestFullscreenSafe);
  safeBind(safeSettingsBtn,()=>toggleSettings(true));

  safeBind(safeSetAuto,()=>{autoMode=!autoMode;safeRefresh();updateButtons();});
  safeBind(safeSetMap,()=>{mapMode=mapMode==="tech"?"normal":"tech";selectedMenuMode=mapMode;safeRefresh();restartIfRunning();});
  safeBind(safeSetSfx,()=>{sfxEnabled=!sfxEnabled;refreshSettingsUI();});
  safeBind(safeSetMusic,()=>changeMusic(musicVolume>=.95?-.45:.10));
  safeBind(safeSetSpdDown,()=>changeSpeed(+0.04));
  safeBind(safeSetSpdUp,()=>changeSpeed(-0.04));
  safeBind(safeSetOffDown,()=>changeOffset(-0.03));
  safeBind(safeSetOffUp,()=>changeOffset(+0.03));
  safeBind(safeResume,()=>{safeSetOverlay(false);resumeGame();});
  safeBind(safeExit,exitToMenu);

  safeSetState("title");
  safeRefresh();



  updateModeButtons();
  updateButtons();
})();
