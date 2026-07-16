(() => {
  const song = document.getElementById("song");
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreBox = document.getElementById("scoreBox");
  const comboBox = document.getElementById("comboBox");
  const accuracyBox = document.getElementById("accuracyBox");
  const autoBox = document.getElementById("autoBox");
  const mapBox = document.getElementById("mapBox");
  const autoToggle = document.getElementById("autoToggle");
  const mapToggle = document.getElementById("mapToggle");
  const debugToggle = document.getElementById("debugToggle");
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
  const difficultyBox = document.getElementById("difficultyBox");
  const debugMode = new URLSearchParams(window.location.search).get("debug")==="1";
  document.body.classList.toggle("debugMode", debugMode);
  const modeNormalStar = document.getElementById("modeNormalStar");
  const modeTechStar = document.getElementById("modeTechStar");
  const modeNormalBtn = document.getElementById("modeNormalBtn");
  const modeTechBtn = document.getElementById("modeTechBtn");
  const modeCustomBtn = document.getElementById("modeCustomBtn");
  const pauseOverlay = document.getElementById("pauseOverlay");
  const pauseResume = document.getElementById("pauseResume");
  const pauseRetry = document.getElementById("pauseRetry");
  const pauseMenu = document.getElementById("pauseMenu");
  const resultOverlay = document.getElementById("resultOverlay");
  const resultScore = document.getElementById("resultScore");
  const resultRank = document.getElementById("resultRank");
  const resultAccuracy = document.getElementById("resultAccuracy");
  const resultPerfect = document.getElementById("resultPerfect");
  const resultGreat = document.getElementById("resultGreat");
  const resultMiss = document.getElementById("resultMiss");
  const resultMaxCombo = document.getElementById("resultMaxCombo");
  const resultTotalNotes = document.getElementById("resultTotalNotes");
  const resultMapLevel = document.getElementById("resultMapLevel");
  const resultRetry = document.getElementById("resultRetry");
  const resultBackTitle = document.getElementById("resultBackTitle");
  const rotateOverlay = document.getElementById("rotateOverlay");

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
  let judgedCount=0, perfectCount=0, greatCount=0, missCount=0;
  let actualHitValue=0, maxHitValue=0;
  let chart=[], feedback=[], particles=[], waves=[], ringBursts=[], scratchBursts=[];
  let autoMode=false, mapMode="tech";
  let mouseX=0, mouseY=0;
  let armAngle=-Math.PI/2, targetAngle=-Math.PI/2, prevArmAngle=-Math.PI/2, armVel=0;
  let keyA=false, keyD=false, filterHeld=false, scratchHeld=false, mouseDownRight=false;
  let debugOverlayVisible=false;
  let debugOverlay=null;
  let pointerActive=false;
  let lastPointerMs=0;
  let scratchMoveAmount=0;
  let scratchSpeed=0;
  let scratchCandidate=false;
  let scratchThresholdMet=false;
  let lastScratchResult="READY";
  let autoInputDebug={
    z:false,x:false,space:false,lmb:false,rmb:false,shiftFallback:false,
    action:"NONE",targetAngle:null,targetDistance:null,scratchDirection:"NONE",
    scratchMoveAmount:0,scratchSpeed:0,scratchResult:"READY",noteId:"-",noteType:"-"
  };
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
  const difficultyCache={normal:null,tech:null};

  function resize(){
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    W=window.innerWidth; H=window.innerHeight;
    cx=W*.5;
    const isMobileLandscape = window.matchMedia && window.matchMedia("(max-width: 932px) and (orientation: landscape)").matches;
    const hudReserve = isMobileLandscape ? 58 : 0;
    const safeBottom = isMobileLandscape ? 10 : 0;
    const usableH = Math.max(180, H - hudReserve - safeBottom);
    cy = isMobileLandscape ? hudReserve + usableH * .5 : H*.53;
    baseR = isMobileLandscape ? Math.min(W * .30, usableH * .39, 176) : Math.min(W,H)*.287;
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

      if(type==="slideCW" || type==="traceCW"){
        while(raw <= 0) raw += TAU;
        n.slideAmount = raw + TAU * n.turns;
      }else if(type==="slideCCW" || type==="traceCCW"){
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


  function noteFamily(type){
    if(type === "cut") return "cut";
    if(type === "fx") return "hold";
    if(type.startsWith("trace")) return "trace";
    if(type.startsWith("slide")) return "slide";
    if(type.startsWith("swing")) return "swing";
    if(type.startsWith("scratch")) return "scratch";
    return "cut";
  }


  function noteWeight(note){
    const weights={cut:1.0, trace:0.5, hold:1.2, slide:1.3, swing:1.4, scratch:1.4};
    return weights[noteFamily(note.type)] || 1.0;
  }

  function judgeValue(label){
    if(label === "PERFECT") return 1.0;
    if(label === "GREAT") return 0.65;
    return 0.0;
  }

  function calculateScoreStats(){
    const totalNotes = chart.length;
    const accuracy = maxHitValue > 0 ? clamp(actualHitValue / maxHitValue, 0, 1) : 1;
    const comboRatio = totalNotes > 0 ? clamp(maxCombo / totalNotes, 0, 1) : 0;
    const totalScore = Math.round(accuracy * 900000 + comboRatio * 100000);
    return {accuracy, comboRatio, score:totalScore, totalNotes};
  }

  function calculateRank(accuracy){
    if(accuracy >= 0.995 && missCount === 0) return "SSS";
    if(accuracy >= 0.98) return "SS";
    if(accuracy >= 0.95) return "S";
    if(accuracy >= 0.92) return "A+";
    if(accuracy >= 0.88) return "A";
    if(accuracy >= 0.80) return "B";
    if(accuracy >= 0.70) return "C";
    return "D";
  }

  function inputGroup(type){
    const family=noteFamily(type);
    if(family === "hold" || family === "slide") return "hold";
    if(family === "trace") return "move";
    if(family === "swing") return "flick";
    if(family === "scratch") return "right-click flick";
    return "tap";
  }

  function difficultyTypeSet(notes, centerTime, range=2){
    const set=new Set();
    for(const n of notes){
      if(Math.abs(n.hitTime-centerTime)<=range) set.add(noteFamily(n.type));
    }
    return set.size;
  }

  function calculateChartDifficulty(notes){
    if(!notes.length) return {stars:1, raw:0};
    const baseValue={cut:1.00,trace:0.55,hold:1.15,slide:1.35,swing:1.45,scratch:1.50};
    const ordered=notes.slice().sort((a,b)=>a.hitTime-b.hitTime);
    let raw=0;
    let previous=null;

    for(const note of ordered){
      const family=noteFamily(note.type);
      let weight=baseValue[family] || 1;

      if(previous){
        const gap=Math.max(0.04,note.hitTime-previous.hitTime);
        weight += clamp((0.55-gap)/0.55,0,1)*0.95;
        weight += (distAng(note.angle, previous.angle)/Math.PI)*0.55;
        if(inputGroup(note.type)!==inputGroup(previous.type)) weight += 0.34;
      }

      if(family === "slide" || family === "trace" || family === "scratch"){
        const length=Math.abs(note.slideAmount ?? norm((note.endAngle??note.angle)-note.angle));
        const duration=Math.max(note.duration||BEAT*.5, BEAT*.25);
        weight += clamp(length/TAU,0,1.5)*0.62 + clamp((length/duration)/8,0,1)*0.52;
      }

      if(family === "hold" || family === "slide"){
        const end=(note.hitTime||0)+(note.duration||0);
        const overlap=ordered.filter(other => other!==note && other.hitTime>note.hitTime+.03 && other.hitTime<end-.03).length;
        weight += Math.min(1.45, overlap*0.24);
      }

      weight += Math.max(0,difficultyTypeSet(ordered,note.hitTime,2)-1)*0.16;
      raw += weight;
      previous=note;
    }

    const duration=Math.max(1, ordered[ordered.length-1].hitTime-ordered[0].hitTime);
    const density=ordered.length/duration;
    const normalized=1 + (raw/duration)*0.50 + Math.sqrt(density)*0.10;
    return {stars:Math.round(clamp(normalized,1,10)*10)/10, raw};
  }

  function chartForDifficulty(mode){
    const raw=mode==="tech" ? generateTechChart() : generateNormalChart();
    const gapFilled=fillPlayableGaps(raw, mode==="tech" ? 1.10 : 1.75);
    return gapFilled.filter(n => (n.beat ?? 0) <= CHART_END_BEAT).map(n => ({
      ...n,
      hitTime:(n.beat ?? 0)*BEAT*CHART_STRETCH,
      duration:n.duration||0
    })).sort((a,b)=>a.hitTime-b.hitTime);
  }

  function getDifficulty(mode=mapMode){
    if(mode!=="normal" && mode!=="tech") return null;
    if(!difficultyCache[mode]) difficultyCache[mode]=calculateChartDifficulty(chartForDifficulty(mode));
    return difficultyCache[mode];
  }

  function formatDifficulty(mode=mapMode){
    const d=getDifficulty(mode);
    return d ? d.stars.toFixed(1)+"★" : "-";
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
  function trace(n,b,lane,endLane=lane,dur=1.5,dir="auto"){
    const type = dir==="CW" ? "traceCW" : (dir==="CCW" ? "traceCCW" : "trace");
    n.push(make(type,b,lane,{endLane,duration:BEAT*dur}));
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


  function guidedCut(n,b,lane,fromLane=lane,lead=.9,dir="auto"){
    trace(n,b-lead,fromLane,lane,Math.max(.55,lead*.85),dir);
    cut(n,b,lane);
  }

  function guidedSwing(n,b,lane,fromLane=lane,dir="CW",lead=.9){
    trace(n,b-lead,fromLane,lane,Math.max(.55,lead*.85),dir);
    swing(n,b,lane,dir);
  }

  function slideCatch(n,b,lane,endLane,dir="CW",dur=3.0,catchDelay=1.0){
    slide(n,b,lane,endLane,dir,dur);
    trace(n,b+dur+.25,endLane,endLane,.7);
    cut(n,b+dur+catchDelay,endLane);
  }

  function generateAnimaNormalChart(){
    const n=[];

    // NORMAL: 조작법을 익히는 입문 채보.
    // CUT 중심으로 손 위치를 익히고, TRACE가 다음 위치를 먼저 보여 주도록 구성한다.

    // 0~32 Intro: TRACE→CUT 기본 이동과 예측 가능한 마디 끝 SWING.
    anchor(n,4,12,4,[0,4,2]);
    guidedCut(n,16,6,2,1.2,"CW");
    guidedCut(n,20,0,6,1.2,"CW");
    stair(n,24,[0,1,2,3],1.0);
    guidedSwing(n,31.5,4,3,"CW",1.0);

    // 32~64 Verse: 한 박 CUT 모티프, 짧은 SLIDE 끝점 회수만 소개.
    motif(n,36,[4,2,0,6,7,5,3,1],1.0);
    guidedCut(n,46,5,1,1.1,"CW");
    slideCatch(n,48,5,1,"CCW",2.5,1.0);
    guidedSwing(n,56,1,1,"CCW",.8);
    anchor(n,60,68,4,[0,4]);

    // 72~112 Build: HOLD 중 복잡한 입력 금지. 종료 후 CUT으로 회수.
    hold(n,74,6,4.0);
    trace(n,78.7,6,6,.8);
    cut(n,79.5,6);
    motif(n,84,[6,4,2,0,1,3,5,7],.95);
    guidedCut(n,94,3,7,1.0,"CCW");
    slideCatch(n,98,3,7,"CW",2.75,1.05);
    stair(n,108,[7,0,1,2],.65);

    // 112~144 Highlight 1: 짧은 CUT 러시 뒤 SWING. SCRATCH는 쉬운 한 지점만.
    burst(n,116,[2,3,4,5,6,7,0,1],.44);
    guidedSwing(n,121,1,1,"CW",.75);
    slideCatch(n,126,4,0,"CCW",2.75,1.0);
    guidedCut(n,134,2,0,1.0,"CW");
    burst(n,136,[2,4,6,0,1,3,5,7],.46);
    trace(n,142.1,7,7,.6);
    scratch(n,143,7,7,"CCW",.45);

    // 144~176 Break: 회복 구간. HOLD와 앵커 CUT만 두고 멀리 점프하지 않게 TRACE 제공.
    hold(n,150,3,4.0);
    trace(n,154.5,3,3,.8);
    cut(n,155.5,3);
    anchor(n,160,174,4,[0,4,2,6]);

    // 180~224 Build 2: 방향성 CUT과 짧은 SLIDE. SCRATCH는 제외해 피로도를 낮춤.
    motif(n,182,[1,3,5,7,0,2,4,6],.9);
    guidedCut(n,194,0,6,1.0,"CW");
    slideCatch(n,198,0,5,"CW",2.75,1.1);
    stair(n,210,[5,6,7,0,1,2],.60);
    guidedSwing(n,218,2,2,"CW",.8);

    // 224~280 Climax: NORMAL 최고 밀도지만 복합 조작 없이 CUT/TRACE/SLIDE 순서로 분리.
    hold(n,224,4,3.5);
    trace(n,227.8,4,4,.7);
    cut(n,228.8,4);
    burst(n,232,[4,5,6,7,0,1,2,3],.42);
    slideCatch(n,244,3,7,"CW",2.75,1.05);
    guidedCut(n,254,1,7,1.0,"CW");
    burst(n,260,[1,3,5,7,0,2,4,6],.44);
    slide(n,270,6,2,"CCW",2.75);
    guidedSwing(n,276,2,2,"CCW",.8);

    // 280~320 Final drive: 짧은 계단과 예측 가능한 마디 끝 SWING.
    burst(n,284,[2,3,4,5,6,7,0,1],.42);
    guidedCut(n,294,5,1,1.0,"CW");
    stair(n,300,[5,3,1,7,6,4,2,0],.55);
    slideCatch(n,310,0,4,"CW",2.75,1.0);
    guidedSwing(n,316,4,4,"CW",.8);
    burst(n,320,[4,6,0,2,5,7,1,3],.45);

    // 320~342 Ending: HOLD로 안정시키고 한 번의 쉬운 SCRATCH와 종료 CUT.
    hold(n,326,3,3.5);
    anchor(n,332,336,2,[0,4,2]);
    trace(n,336.3,2,2,.55);
    scratch(n,337,2,2,"CCW",.45);
    guidedSwing(n,340,2,2,"CW",.7);
    cut(n,342,4);

    return n.sort((a,b)=>a.hitTime-b.hitTime);
  }

  function generateAnimaTechChart(){
    const n=[];

    // TECH: 복잡해 보이지만 처리 순서를 알면 가능한 테크맵.
    // TRACE→CUT/SWING, SLIDE 끝→CUT/SCRATCH, HOLD 끝→회수 입력을 분리해서 배치한다.

    // 0~32 Intro: TRACE로 이동을 먼저 보여 주고 계단→SWING으로 방향 전환.
    anchor(n,4,14,2.5,[0,4,2,6,1]);
    guidedCut(n,17,5,1,1.0,"CW");
    guidedCut(n,20,0,5,1.0,"CW");
    stair(n,22,[0,2,4,6,1,3,5,7],.62);
    guidedSwing(n,31.5,7,7,"CW",.75);

    // 32~64 First phrase: TRACE→CUT 모티프와 SLIDE 끝점 회수.
    motif(n,36,[0,2,4,6,7,5,3,1,0,1,2,3],.62);
    guidedCut(n,44,7,3,.9,"CW");
    slideCatch(n,46,7,3,"CCW",2.9,.95);
    guidedSwing(n,53,3,3,"CCW",.7);
    burst(n,56,[3,2,1,0,7,6,5,4],.34);
    anchor(n,62,70,3,[0,4,2]);

    // 72~112 Build-up: HOLD 종료 후 CUT, SLIDE 끝 후 짧은 SCRATCH를 명확히 분리.
    hold(n,74,6,4.25);
    trace(n,78.7,6,6,.8);
    cut(n,79.7,6);
    motif(n,83,[6,4,2,0,1,3,5,7,7,5,3,1],.58);
    slide(n,96,1,5,"CW",3.0);
    trace(n,99.4,5,5,.65);
    cut(n,100.3,5);
    scratch(n,102.2,5,5,"CCW",.42);
    burst(n,108,[0,1,2,3,4,5,6,7],.32);

    // 112~144 Highlight 1: CUT 계단/러시를 SWING으로 접고, SCRATCH는 전환점 한 번만.
    burst(n,116,[0,1,2,3,4,5,6,7,7,6,5,4],.30);
    guidedSwing(n,121,4,4,"CW",.65);
    slideCatch(n,126,4,0,"CCW",3.0,.9);
    burst(n,134,[0,2,4,6,1,3,5,7,4,5,6,7],.31);
    trace(n,141.8,7,7,.55);
    scratch(n,142.5,7,7,"CCW",.42);

    // 144~176 Break: 저밀도 테크 회복. HOLD/SLIDE 사이를 비운다.
    hold(n,148,3,4.75);
    trace(n,153.1,3,3,.75);
    cut(n,154.2,3);
    anchor(n,158,170,3,[0,4,2,6]);
    slideCatch(n,174,6,2,"CCW",2.8,.95);

    // 180~224 Build 2: TRACE→SWING, CUT 계단→SWING, 짧은 SCRATCH 포인트.
    motif(n,182,[2,4,6,0,1,3,5,7,7,5,3,1,0,2,4,6],.54);
    trace(n,195.2,6,6,.55);
    scratch(n,196,6,6,"CW",.42);
    burst(n,202,[1,2,3,4,5,6,7,0,0,2,4,6],.30);
    guidedSwing(n,211,6,6,"CCW",.7);
    burst(n,213,[6,4,2,0,1,3,5,7],.33);
    slideCatch(n,219,7,3,"CCW",2.9,.9);

    // 224~280 Climax: 메인 테크 패턴. 복합 겹침 대신 순차 처리로 난이도 상승.
    hold(n,224,3,3.4);
    trace(n,227.8,3,3,.65);
    cut(n,228.7,3);
    burst(n,231,[3,4,5,6,7,0,1,2,2,1,0,7,6,5,4,3],.285);
    guidedSwing(n,236,3,3,"CW",.6);
    slide(n,242,3,0,"CW",3.0);
    trace(n,245.35,0,0,.55);
    cut(n,246.1,0);
    scratch(n,248,0,0,"CCW",.42);
    burst(n,256,[4,6,0,2,5,7,1,3,0,1,2,3,4,5,6,7],.275);
    guidedSwing(n,262,7,7,"CCW",.6);
    slideCatch(n,270,7,2,"CCW",2.9,.9);
    stair(n,276,[2,3,4,5,6,7,0,1],.38);

    // 280~320 Final drive: 높은 밀도는 짧게 끊고, 마디 끝 플릭으로 방향을 정리.
    burst(n,284,[0,1,2,3,4,5,6,7,7,6,5,4],.265);
    guidedSwing(n,288,4,4,"CW",.55);
    trace(n,293.2,0,0,.55);
    scratch(n,294,0,0,"CW",.42);
    burst(n,300,[5,7,1,3,6,0,2,4,7,5,3,1],.275);
    slideCatch(n,312,0,6,"CW",2.9,.9);
    guidedSwing(n,318,6,6,"CW",.6);
    burst(n,320,[6,7,0,1,2,3,4,5,5,3,1,7],.29);

    // 320~342 Ending: HOLD 끝 회수 후 TRACE가 보이는 마무리 SCRATCH/SWING/CUT.
    hold(n,326,5,3.4);
    motif(n,332,[5,3,1,7,0,2,4,6],.54);
    trace(n,336.2,6,6,.55);
    scratch(n,337,6,6,"CCW",.42);
    guidedSwing(n,340,2,6,"CW",.7);
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

  function addFeedback(text,x,y,color){feedback.push({text,x,y,color,life:.28});}
  function addParticles(x,y,color,count=12,power=1){
    for(let i=0;i<count;i++){
      const a=Math.random()*TAU, s=(34+Math.random()*112)*power;
      particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.16+Math.random()*.12,color});
    }
  }
  function addWave(angle,color){waves.push({angle,color,life:.24});}
  function addRingBurst(color, power=1, label=""){
    ringBursts.push({color, power, life:.30, label});
  }
  function addScratchBurst(angle,color,dir=1){
    scratchBursts.push({angle,color,dir,life:.24});
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
    actualHitValue += noteWeight(n) * judgeValue(label);
    judgedCount++;
    if(label==="PERFECT") perfectCount++; else greatCount++;
    combo++; maxCombo=Math.max(maxCombo,combo);

    let a=n.angle;
    if(n.type.startsWith("slide") || n.type.startsWith("scratch")){
      a = n.endAngle ?? n.visualEndAngle ?? a;
    }

    const isScratch=n.type&&n.type.startsWith("scratch");
    const isSwing=n.type&&n.type.startsWith("swing");
    const p={x:cx+Math.cos(a)*hitR,y:cy+Math.sin(a)*hitR};

    addFeedback(label,p.x,p.y-18,color);
    addParticles(p.x,p.y,color,isScratch?16:(isSwing?22:14),isScratch?.85:(isSwing?1.35:1));
    addWave((isScratch||isSwing)?a:a,color);

    if(isScratch){
      const d=slideDelta(n);
      addScratchBurst(a,color,d>=0?1:-1);
      for(let i=0;i<8;i++){
        const ang=a + (Math.random()-.5)*.7;
        const rr=hitR + (Math.random()-.5)*20;
        addParticles(cx+Math.cos(ang)*rr, cy+Math.sin(ang)*rr, color, 1, .62);
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
    n.missed=true; combo=0; judgedCount++; missCount++;
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
    // SCRATCH = 우클릭을 누른 채 짧게 좌/우 또는 시계/반시계로 긁는 마찰 액션.
    // Shift는 보조 입력/fallback으로만 허용하며, SLIDE처럼 긴 경로를 추적하지 않는다.
    const dir=n.type==="scratchCW"?1:-1;
    scratchCandidate=!!(scratchHeld&&aligned(n.angle,.026));
    scratchMoveAmount=Math.abs(norm(armAngle-prevArmAngle));
    scratchSpeed=Math.abs(armVel);
    scratchThresholdMet=scratchSpeed>=SCRATCH_FLICK_SPEED;
    if(!scratchHeld){lastScratchResult="READY";return false;}
    if(!aligned(n.angle,.026)){lastScratchResult="MISS";return false;}
    if(!scratchThresholdMet){lastScratchResult="TOO SLOW";return false;}
    const ok=Math.sign(armVel)===dir;
    lastScratchResult=ok?"HIT":"MISS";
    return ok;
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

  function noteDebugId(n){
    if(!n)return "-";
    const idx=chart.indexOf(n);
    return (idx>=0?idx:"?")+"/b"+Number(n.beat||0).toFixed(2);
  }

  function autoActionForNote(n){
    if(!n)return "NONE";
    if(n.type==="cut")return "CUT";
    if(n.type==="fx")return "HOLD";
    if(n.type.startsWith("slide"))return "SLIDE";
    if(n.type.startsWith("trace"))return "TRACE";
    if(n.type.startsWith("swing"))return "SWING";
    if(n.type.startsWith("scratch"))return "SCRATCH";
    return "NONE";
  }

  function updateAutoDebug(t){
    const n=autoMode?nextNote(t):null;
    const action=autoActionForNote(n);
    const isScratch=!!(n&&n.type.startsWith("scratch"));
    const isHold=action==="HOLD"||action==="SLIDE";
    const isCut=action==="CUT";
    autoInputDebug={
      z:autoMode&&(isCut||isHold),
      x:autoMode&&isHold,
      space:autoMode&&isCut,
      lmb:autoMode&&isCut,
      rmb:autoMode&&isScratch,
      shiftFallback:false,
      action,
      targetAngle:n?((n.type.startsWith("slide")||n.type.startsWith("trace")||n.type.startsWith("scratch"))?slideAngle(n,t):n.angle):null,
      targetDistance:autoMode&&n?hitR:null,
      scratchDirection:isScratch?(n.type==="scratchCW"?"CW":"CCW"):"NONE",
      scratchMoveAmount:isScratch?Math.abs(n.slideAmount||0):0,
      scratchSpeed:isScratch?SCRATCH_FLICK_SPEED*1.5:0,
      scratchResult:isScratch?"HIT":lastScratchResult,
      noteId:noteDebugId(n),
      noteType:n?n.type:"-"
    };
  }

  function updateAuto(t){
    updateAutoDebug(t);
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
            n.hold+=dt;
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
            n.hold+=dt;
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

    const bg=ctx.createRadialGradient(cx,cy,baseR*.10,cx,cy,Math.max(W,H)*.78);
    bg.addColorStop(0,"#02050e");
    bg.addColorStop(.24,"#06142a");
    bg.addColorStop(.56,"#071126");
    bg.addColorStop(.78,"#030713");
    bg.addColorStop(1,"#010209");
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,W,H);

    const edge=ctx.createRadialGradient(cx,cy,baseR*.62,cx,cy,Math.max(W,H)*.62);
    edge.addColorStop(0,"rgba(0,0,0,0)");
    edge.addColorStop(.52,"rgba(92,255,251,.055)");
    edge.addColorStop(.74,"rgba(141,107,255,.07)");
    edge.addColorStop(1,"rgba(0,0,0,.22)");
    ctx.fillStyle=edge; ctx.fillRect(0,0,W,H);

    ctx.save();
    ctx.globalAlpha=.46;
    ctx.lineWidth=1;
    const grid=58;
    for(let x=((t*8)%grid)-grid;x<W+grid;x+=grid){
      ctx.strokeStyle="rgba(92,255,251,.052)";
      ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
    }
    for(let y=((t*5)%grid)-grid;y<H+grid;y+=grid){
      ctx.strokeStyle="rgba(141,107,255,.046)";
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation="screen";
    for(let i=0;i<44;i++){
      const seed=i*97.13;
      const px=((Math.sin(seed)*43758.5453)%1+1)%1*W;
      const py=(((Math.sin(seed*1.7)*24634.6345)%1+1)%1*H + t*(10+i%5*3))%(H+80)-40;
      const pulse=.35+.35*Math.sin(t*.9+i);
      ctx.fillStyle=`rgba(${i%3===0?141:92},${i%3===0?107:255},255,${.055+pulse*.055})`;
      ctx.beginPath();ctx.arc(px,py,1.1+(i%4)*.35,0,TAU);ctx.fill();
    }
    ctx.restore();

    ctx.save(); ctx.translate(cx,cy);
    for(let r=baseR*.55;r<baseR*1.72;r+=baseR*.18){
      const cyan=(Math.round(r/baseR*10)%2)===0;
      ctx.strokeStyle=`rgba(${cyan?92:141},${cyan?255:107},${cyan?251:255},${r<hitR?.095:.052})`;
      ctx.lineWidth=r<hitR?1.4:1; ctx.beginPath(); ctx.arc(0,0,r+Math.sin(t*1.25+r)*2.4,0,TAU); ctx.stroke();
    }
    for(let i=0;i<40;i++){
      const a=i/40*TAU+t*.026, r1=baseR*.50, r2=baseR*(1.12+Math.sin(t*.9+i)*.012);
      ctx.strokeStyle=`rgba(255,255,255,${i%5===0?.105:.026})`; ctx.lineWidth=i%5===0?1.35:1;
      ctx.beginPath(); ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1); ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2); ctx.stroke();
    }
    const center=ctx.createRadialGradient(0,0,baseR*.08,0,0,baseR*.70);
    center.addColorStop(0,"rgba(0,0,0,.96)"); center.addColorStop(.56,"rgba(2,6,15,.90)"); center.addColorStop(.82,"rgba(3,8,18,.48)"); center.addColorStop(1,"rgba(3,8,18,.18)");
    ctx.fillStyle=center; ctx.beginPath(); ctx.arc(0,0,baseR*.78,0,TAU); ctx.fill();

    ctx.strokeStyle="rgba(255,255,255,.20)"; ctx.lineWidth=7; ctx.beginPath(); ctx.arc(0,0,hitR,0,TAU); ctx.stroke();
    ctx.strokeStyle="rgba(92,255,251,.30)"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,outerR,0,TAU); ctx.stroke();
    for(let i=0;i<8;i++){
      const a=laneAngle(i);
      ctx.strokeStyle=i%2===0?"rgba(255,255,255,.16)":"rgba(255,255,255,.08)";
      ctx.lineWidth=i%2===0?3:2; ctx.beginPath(); ctx.moveTo(Math.cos(a)*(hitR-14),Math.sin(a)*(hitR-14)); ctx.lineTo(Math.cos(a)*(hitR+14),Math.sin(a)*(hitR+14)); ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,.25)"; ctx.font="800 10px system-ui"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(String(i+1),Math.cos(a)*(hitR+30),Math.sin(a)*(hitR+30));
    }
    ctx.fillStyle="#030711"; ctx.beginPath(); ctx.arc(0,0,baseR*.35,0,TAU); ctx.fill();
    ctx.strokeStyle="rgba(92,255,251,.22)"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,baseR*.28,0,TAU); ctx.stroke();
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

  function drawDirectedArcSegments(r, start, amount, color, width, alpha=1, shadowColor=null, shadowBlur=0){
    // Canvas arc는 2π 경계/긴 호에서 헷갈릴 수 있으므로
    // 긴 슬라이드는 작은 조각으로 직접 그림. 모든 호출은 화면 좌표 기준으로
    // 새 path를 만들고 원형 플레이 영역 안에서만 stroke한다.
    if(!Number.isFinite(r)||!Number.isFinite(start)||!Number.isFinite(amount)||Math.abs(amount)<0.001)return;
    const safeR=clamp(r,hitR,outerR);
    const steps = Math.max(10, Math.ceil(Math.abs(amount) / (Math.PI / 18)));
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx,cy,outerR+Math.max(24,width*2),0,TAU);
    ctx.clip();
    ctx.translate(cx,cy);
    ctx.lineCap="round";
    ctx.strokeStyle=color;
    ctx.globalAlpha=alpha;
    ctx.lineWidth=width;
    if(shadowColor && shadowBlur>0){
      ctx.shadowColor=shadowColor;
      ctx.shadowBlur=shadowBlur;
    }
    ctx.beginPath();
    for(let i=0;i<=steps;i++){
      const a=start + amount * (i/steps);
      const x=Math.cos(a)*safeR, y=Math.sin(a)*safeR;
      if(i===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawLandingGhost(n,t){
    if(n.done||n.missed)return;
    if(n.type.startsWith("trace"))return;
    const color=noteColor(n);
    const p=progress(n,t);
    if(p<=0 || p>=1.05)return;

    const isFocus=n===focusNote;
    const alpha=isFocus?.34:.17;
    const width=isFocus?8:5;

    if(n.type.startsWith("scratch")){
      const dir=n.type==="scratchCW"?1:-1;
      const d=dir*Math.PI*.26;
      const start=n.angle-d*.5;
      const end=n.angle+d*.5;
      const mainColor=noteColor(n);
      drawDirectedArcSegments(hitR,start,d,`rgba(255,96,96,${isFocus?.26:.14})`,isFocus?7:5,1);

      ctx.save();
      ctx.translate(cx,cy);
      ctx.lineCap="butt";
      ctx.shadowBlur=isFocus?14:7;
      ctx.shadowColor=mainColor;
      ctx.strokeStyle=mainColor;
      ctx.lineWidth=isFocus?7:5;
      ctx.beginPath(); ctx.arc(0,0,hitR,start,end,dir<0); ctx.stroke();
      ctx.strokeStyle="rgba(255,245,230,.70)";
      ctx.lineWidth=2;
      ctx.setLineDash([4,5]);
      ctx.beginPath(); ctx.arc(0,0,hitR+7,start,end,dir<0); ctx.stroke();
      ctx.setLineDash([]);
      for(let i=0;i<4;i++){
        const a=start+(end-start)*(i+.5)/4;
        ctx.save();
        ctx.translate(Math.cos(a)*(hitR+5),Math.sin(a)*(hitR+5));
        ctx.rotate(a+Math.PI/2);
        ctx.fillStyle="rgba(255,245,230,.82)";
        ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(4,3);ctx.lineTo(-4,3);ctx.closePath();ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle="rgba(255,255,255,.78)";
      ctx.font="900 10px system-ui";
      ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText("RMB",Math.cos(n.angle)*(hitR+24),Math.sin(n.angle)*(hitR+24));
      ctx.restore();
      return;
    }

    if(n.type.startsWith("slide")){
      const d=slideDelta(n);
      const endA=n.angle+d;
      const dir=d>=0?1:-1;
      const mainColor=COLORS.slide;
      const glowColor=`rgba(255,225,90,${isFocus?.34:.18})`;
      drawDirectedArcSegments(hitR,n.angle,d,glowColor,isFocus?9:6,1);

      ctx.save();
      ctx.translate(cx,cy);
      ctx.lineCap="round";
      ctx.shadowBlur=isFocus?18:8;
      ctx.shadowColor=mainColor;

      ctx.fillStyle=`rgba(255,255,255,${isFocus?.95:.55})`;
      ctx.beginPath(); ctx.arc(Math.cos(n.angle)*hitR,Math.sin(n.angle)*hitR,isFocus?8:6,0,TAU); ctx.fill();
      ctx.strokeStyle=mainColor; ctx.lineWidth=3; ctx.stroke();

      ctx.fillStyle=`rgba(255,225,90,${isFocus?.95:.65})`;
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
      const dir=n.type==="swingCW"?1:-1;
      const span=Math.PI*.34;
      const start=n.angle-dir*span*.55;
      const end=n.angle+dir*span*.55;
      ctx.strokeStyle=`rgba(255,255,255,${isFocus?.26:.12})`;
      ctx.lineWidth=isFocus?7:5;
      ctx.beginPath();ctx.arc(0,0,hitR,start,end,dir<0);ctx.stroke();
      ctx.strokeStyle=color;ctx.globalAlpha=isFocus?.48:.24;ctx.lineWidth=isFocus?5:3;
      ctx.beginPath();ctx.arc(0,0,hitR,start,end,dir<0);ctx.stroke();
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
    const r=clamp(noteR(n,t),hitR,outerR);
    const a=n.angle;
    const isFocus=n===focusNote;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx,cy,outerR+12,0,TAU);
    ctx.clip();
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
    const r=clamp(active?hitR:noteR(n,t),hitR,outerR), color=COLORS.trace;
    const k=progress(n,t);
    const focus=n===focusNote;
    const d=slideDelta(n);
    const curr=slideAngle(n,t);
    const remaining=d*clamp(1-(active?((t-n.hitTime)/Math.max(n.duration,.001)):0),0,1);
    const alpha=focus?.56:.38;
    const traceWidth=focus?Math.min(4,NOTE_WIDTHS.trace):Math.max(2.5,NOTE_WIDTHS.trace-.9);
    const traceGlow=focus?10:5;
    const pathStart=active?curr:n.angle;
    const pathDelta=Math.abs(d)>.03 ? (active?remaining:d) : Math.PI*.26;

    drawDirectedArcSegments(r,pathStart,pathDelta,`rgba(120,226,255,${alpha})`,traceWidth,1,color,traceGlow);
    ctx.save();
    ctx.translate(cx,cy);
    ctx.lineCap="round";
    ctx.shadowBlur=focus?12:7;
    ctx.shadowColor=color;
    const targetAngle=active?curr:n.angle;
    const startA=n.angle, endA=n.angle+d;
    ctx.fillStyle=`rgba(120,226,255,${focus?.18:.11})`;
    ctx.font=`800 ${focus?8:7}px system-ui`;
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText("START",Math.cos(startA)*r,Math.sin(startA)*r-10);
    ctx.fillText("END",Math.cos(endA)*r,Math.sin(endA)*r+10);
    ctx.fillStyle=`rgba(255,255,255,${focus?.96:.88})`;
    ctx.beginPath();ctx.arc(Math.cos(targetAngle)*r,Math.sin(targetAngle)*r,focus?5.6:4.4,0,TAU);ctx.fill();
    ctx.strokeStyle=`rgba(120,226,255,${focus?.86:.70})`;ctx.lineWidth=1.4;ctx.stroke();
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
    ctx.fillText("RMB",Math.cos(n.angle)*(r+32),Math.sin(n.angle)*(r+32));
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
        const dir=n.type==="swingCW"?1:-1;
        const span=Math.PI*.42;
        ctx.strokeStyle=color;
        ctx.globalAlpha=.50+.20*pulse;
        ctx.lineWidth=6+3*pulse;
        ctx.beginPath();
        ctx.arc(0,0,hitR+6+4*pulse,n.angle-dir*span*.5,n.angle+dir*span*.5,dir<0);
        ctx.stroke();

        const labelA=n.angle+dir*span*.58;
        ctx.fillStyle="rgba(255,255,255,.92)";
        ctx.font="900 18px system-ui";
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        ctx.fillText(n.type==="swingCW"?"↻":"↺",Math.cos(labelA)*(hitR+28),Math.sin(labelA)*(hitR+28));
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
        ctx.fillText(isScratch?"RMB":(isSlide||n.type==="fx"?"HOLD":"NOW"),Math.cos(a)*(hitR+36),Math.sin(a)*(hitR+36));
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
    mapBox.textContent=(mapMode==="tech"?"TECH":"NORMAL") + " " + formatDifficulty(mapMode);
    autoToggle.textContent=autoMode?"AUTO ON":"AUTO OFF";
    autoToggle.classList.toggle("on",autoMode);
    mapToggle.textContent=mapMode==="tech"?"MAP TECH":"MAP NORMAL";
    mapToggle.classList.toggle("on",mapMode==="tech");
    if(speedValue) speedValue.textContent = formatSpeed();
    if(offsetValue) offsetValue.textContent = formatOffset();
    if(sfxValue) sfxValue.textContent = formatSfx();
    if(musicValue) musicValue.textContent = formatMusic();
    if(difficultyBox) difficultyBox.textContent=(mapMode==="tech"?"TECH ":"NORMAL ") + formatDifficulty(mapMode);
    if(typeof safeRefresh === "function") safeRefresh();
  }


  function hideResult(){
    if(resultOverlay) resultOverlay.classList.remove("show");
  }

  function finalizeRemainingMisses(){
    for(const note of chart){
      if(!note.done && !note.missed) miss(note);
    }
  }

  function showResult(){
    finalizeRemainingMisses();
    const stats=calculateScoreStats();
    const rank=calculateRank(stats.accuracy);
    score=stats.score;
    if(resultScore) resultScore.textContent=String(stats.score).padStart(7,"0");
    if(resultRank) resultRank.textContent=rank;
    if(resultAccuracy) resultAccuracy.textContent=(stats.accuracy*100).toFixed(2)+"%";
    if(resultPerfect) resultPerfect.textContent=perfectCount;
    if(resultGreat) resultGreat.textContent=greatCount;
    if(resultMiss) resultMiss.textContent=missCount;
    if(resultMaxCombo) resultMaxCombo.textContent=maxCombo;
    if(resultTotalNotes) resultTotalNotes.textContent=stats.totalNotes;
    if(resultMapLevel) resultMapLevel.textContent=(mapMode==="tech"?"TECH ":"NORMAL ")+formatDifficulty(mapMode);
    if(resultOverlay) resultOverlay.classList.add("show");
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
    if(!stopAudio && judgedCount > 0){
      showResult();
    }else{
      hideResult();
      startLayer.style.display="flex";
    }
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
    hideResult();
    paused=false;
    start(editorMode?"editor":"play");
  }

  function exitToMenu(){
    if(pauseOverlay) pauseOverlay.classList.remove("show");
    hideResult();
    paused=false;
    endGame(true);
  }

  function frame(ms){
    if(!running)return;
    const dt=Math.min(.033,(ms-lastMs)/1000||.016);
    lastMs=ms; const t=now();
    if(t >= SONG_END_TIME){ endGame(false); return; }

    // Z/X/Space/우클릭을 기본 액션 홀드로 사용. SCRATCH는 우클릭이 기본, Shift는 보조 입력.
    filterHeld = autoMode || mouseDownRight || keys.KeyZ || keys.KeyX || keys.Space;
    scratchHeld = mouseDownRight || keys.ShiftLeft || keys.ShiftRight;
    scratchMoveAmount=Math.abs(norm(armAngle-prevArmAngle));
    scratchSpeed=Math.abs(armVel);
    scratchThresholdMet=scratchSpeed>=SCRATCH_FLICK_SPEED;
    scratchCandidate=!!scratchHeld;
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
    updateDebugOverlay(t);

    const liveStats = calculateScoreStats();
    score = liveStats.score;
    scoreBox.textContent=Math.floor(score);
    comboBox.textContent=combo;
    if(accuracyBox){
      accuracyBox.textContent = (liveStats.accuracy * 100).toFixed(2) + "%";
    }
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
    hideResult();
    if(selectedMenuMode==="normal") mapMode="normal";
    if(selectedMenuMode==="tech") mapMode="tech";
    if(selectedMenuMode==="custom") useCustomChart=customChartData.length>0;
    editorMode=mode==="editor";
    if(editorPanel)editorPanel.classList.toggle("show",editorMode);
    useCustomChart=(selectedMenuMode==="custom" && customChartData.length>0);
    chart=generateChart(); score=0; combo=0; maxCombo=0; judgedCount=0; perfectCount=0; greatCount=0; missCount=0; actualHitValue=0; maxHitValue=chart.reduce((sum,n)=>sum+noteWeight(n),0);
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
    lastScratchResult="READY";
    updateAutoDebug(0);
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

  function formatBool(v){return v?"ON":"OFF";}
  function formatAngle(a){return a===null||a===undefined?"-":(norm(a)*180/Math.PI).toFixed(1)+"°";}
  function formatNum(v,d=2){return v===null||v===undefined?"-":Number(v).toFixed(d);}
  function ensureDebugOverlay(){
    if(debugOverlay)return debugOverlay;
    debugOverlay=document.createElement("div");
    debugOverlay.id="inputDebugOverlay";
    debugOverlay.setAttribute("aria-live","off");
    document.body.appendChild(debugOverlay);
    return debugOverlay;
  }
  function setDebugOverlayVisible(visible){
    debugOverlayVisible=!!visible;
    const el=ensureDebugOverlay();
    el.classList.toggle("show",debugOverlayVisible);
    if(debugToggle){
      debugToggle.classList.toggle("on",debugOverlayVisible);
      debugToggle.setAttribute("aria-pressed", debugOverlayVisible?"true":"false");
    }
    if(debugOverlayVisible)updateDebugOverlay(now());
  }
  function toggleDebugOverlay(){
    setDebugOverlayVisible(!debugOverlayVisible);
  }
  function updateDebugOverlay(t){
    if(!debugOverlayVisible)return;
    const el=ensureDebugOverlay();
    const dx=mouseX-cx, dy=mouseY-cy;
    const mouseAngle=Math.atan2(dy,dx);
    const mouseDist=Math.hypot(dx,dy);
    pointerActive=(performance.now()-lastPointerMs)<1600 || mouseDownRight || !!keys.Space;
    el.innerHTML=`<div class="debugTitle">INPUT DEBUG <span>${autoMode?"AUTO":"MANUAL"}</span></div>
      <div class="debugGrid"><b>REAL INPUT</b><b></b>
        <span>Z</span><strong>${formatBool(keys.KeyZ)}</strong><span>X</span><strong>${formatBool(keys.KeyX)}</strong>
        <span>Space</span><strong>${formatBool(keys.Space)}</strong><span>LMB</span><strong>${formatBool(!!keys.MouseLeft)}</strong>
        <span>RMB</span><strong>${formatBool(mouseDownRight)}</strong><span>Shift</span><strong>${formatBool(keys.ShiftLeft||keys.ShiftRight)}</strong>
        <span>Mouse X/Y</span><strong>${mouseX.toFixed(0)}, ${mouseY.toFixed(0)}</strong>
        <span>Mouse/touch angle</span><strong>${formatAngle(mouseAngle)}</strong>
        <span>Distance from center</span><strong>${mouseDist.toFixed(1)}</strong>
        <span>Pointer active</span><strong>${formatBool(pointerActive)}</strong>
      </div>
      <div class="debugGrid"><b>AUTO INPUT</b><b></b>
        <span>AUTO Z</span><strong>${formatBool(autoInputDebug.z)}</strong><span>AUTO X</span><strong>${formatBool(autoInputDebug.x)}</strong>
        <span>AUTO Space</span><strong>${formatBool(autoInputDebug.space)}</strong><span>AUTO LMB</span><strong>${formatBool(autoInputDebug.lmb)}</strong>
        <span>AUTO RMB</span><strong>${formatBool(autoInputDebug.rmb)}</strong><span>AUTO Shift fallback</span><strong>${formatBool(autoInputDebug.shiftFallback)}</strong>
        <span>AUTO ACTION</span><strong>${autoInputDebug.action}</strong>
        <span>Target angle</span><strong>${formatAngle(autoInputDebug.targetAngle)}</strong>
        <span>Target distance</span><strong>${formatNum(autoInputDebug.targetDistance,1)}</strong>
        <span>Scratch direction</span><strong>${autoInputDebug.scratchDirection}</strong>
        <span>Scratch movement amount</span><strong>${formatNum(autoInputDebug.scratchMoveAmount,2)}</strong>
        <span>Scratch speed</span><strong>${formatNum(autoInputDebug.scratchSpeed,2)}</strong>
        <span>Scratch result</span><strong>${autoInputDebug.scratchResult}</strong>
        <span>Note target</span><strong>${autoInputDebug.noteId} ${autoInputDebug.noteType}</strong>
      </div>
      <div class="debugGrid"><b>SCRATCH DEBUG</b><b></b>
        <span>RMB pressed</span><strong>${formatBool(mouseDownRight)}</strong><span>Candidate</span><strong>${formatBool(scratchCandidate)}</strong>
        <span>Movement amount</span><strong>${formatNum(scratchMoveAmount,3)}</strong><span>Speed</span><strong>${formatNum(scratchSpeed,2)}</strong>
        <span>Threshold</span><strong>${SCRATCH_FLICK_SPEED.toFixed(2)}</strong><span>Over threshold</span><strong>${formatBool(scratchThresholdMet)}</strong>
        <span>Recent result</span><strong>${lastScratchResult}</strong>
      </div>`;
  }

  function updateModeButtons(){
    if(modeNormalBtn) modeNormalBtn.classList.toggle("on",selectedMenuMode==="normal");
    if(modeTechBtn) modeTechBtn.classList.toggle("on",selectedMenuMode==="tech");
    if(modeNormalStar) modeNormalStar.textContent=formatDifficulty("normal");
    if(modeTechStar) modeTechStar.textContent=formatDifficulty("tech");
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
    if(type==="slideCW"||type==="slideCCW"){
      d.durationBeat=4;
      d.endLane=(lane+3)%8;
    }
    if(type==="scratchCW"||type==="scratchCCW"){
      d.durationBeat=.55;
      d.endLane=(lane+(type==="scratchCW"?1:7))%8;
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
  bindPress(mapToggle,()=>{if(running && !debugMode)return; mapMode=mapMode==="tech"?"normal":"tech";restartIfRunning();});
  bindPress(debugToggle,()=>toggleDebugOverlay());
  bindPress(keymapToggle,()=>toggleKeymap());
  bindPress(editorToggle,()=>toggleEditor());
  bindPress(fullToggle,requestFullscreenSafe);
  bindPress(quickSettingsBtn,()=>toggleSettings());
  bindPress(quickEditorBtn,()=>{toggleSettings(true); toggleEditor();});
  bindPress(quickFullBtn,requestFullscreenSafe);
  bindPress(resumeBtn,resumeGame);
  bindPress(retryBtn,retryGame);
  bindPress(exitBtn,exitToMenu);
  bindPress(resultRetry,retryGame);
  bindPress(resultBackTitle,exitToMenu);
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
  if(debugMode)setDebugOverlayVisible(true);
  if(laneGrid) laneGrid.addEventListener("click",e=>{const btn=e.target.closest("[data-lane]");if(!btn)return;selectedLane=Number(btn.dataset.lane)||0;laneGrid.querySelectorAll("[data-lane]").forEach(b=>b.classList.toggle("on",b===btn));updateEditorStatus();});

  window.addEventListener("mousemove",e=>{mouseX=e.clientX;mouseY=e.clientY;lastPointerMs=performance.now();},{passive:true});
  window.addEventListener("pointermove",e=>{mouseX=e.clientX;mouseY=e.clientY;lastPointerMs=performance.now();pointerActive=true;},{passive:true});
  window.addEventListener("touchmove",e=>{if(e.touches&&e.touches[0]){mouseX=e.touches[0].clientX;mouseY=e.touches[0].clientY;lastPointerMs=performance.now();pointerActive=true;}},{passive:true});
  canvas.addEventListener("contextmenu",e=>e.preventDefault());
  function isUiInputTarget(target){return !!(target && target.closest && target.closest("button,#safeMenu,#safeOverlay,.keymapOverlay,.pauseOverlay,.tuner,.mobileControls,.quickMenu,.editorPanel,.start"));}
  window.addEventListener("mousedown",e=>{if(isUiInputTarget(e.target))return; lastPointerMs=performance.now(); pointerActive=true; if(e.button===0){keys.MouseLeft=true; if(running)onCut();} if(e.button===2){mouseDownRight=true;filterHeld=true;}});
  window.addEventListener("mouseup",e=>{if(e.button===0)keys.MouseLeft=false; if(e.button===2){mouseDownRight=false;filterHeld=false;}});
  window.addEventListener("keydown",e=>{
    keys[e.code]=true;
    if(e.code==="KeyA")keyA=true;
    if(e.code==="KeyD")keyD=true;
    if(e.code==="Space"||e.code==="KeyZ"||e.code==="KeyX"){e.preventDefault(); if(!e.repeat)onCut();}
    if((e.code==="KeyD"||e.code==="F3")&&!e.repeat){e.preventDefault();toggleDebugOverlay();}
    if(e.code==="KeyO"&&!e.repeat&&(!running||debugMode)){autoMode=!autoMode;updateButtons();updateDebugOverlay(now());}
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
    if(e.code==="KeyM"&&!e.repeat&&(!running||debugMode)){mapMode=mapMode==="tech"?"normal":"tech";restartIfRunning();}
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
    if(e.code==="ShiftLeft"||e.code==="ShiftRight")scratchHeld=!!(mouseDownRight||keys.ShiftLeft||keys.ShiftRight);
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
  const safeSetKeymap=document.getElementById("safeSetKeymap");
  const safeSetFull=document.getElementById("safeSetFull");
  const safeSetSfx=document.getElementById("safeSetSfx");
  const safeSetMusic=document.getElementById("safeSetMusic");
  const safeSetSpdDown=document.getElementById("safeSetSpdDown");
  const safeSetSpdUp=document.getElementById("safeSetSpdUp");
  const safeSetOffDown=document.getElementById("safeSetOffDown");
  const safeSetOffUp=document.getElementById("safeSetOffUp");
  const safeResume=document.getElementById("safeResume");
  const safeExit=document.getElementById("safeExit");
  let pendingMobileStartMode = null;
  let orientationPaused = false;

  function isMobileViewport(){
    return !!(window.matchMedia && window.matchMedia("(max-width: 768px), (pointer: coarse)").matches);
  }

  function isMobilePortraitPlayBlocked(){
    return isMobileViewport() && window.innerHeight > window.innerWidth;
  }

  function setRotateOverlay(show){
    if(rotateOverlay) rotateOverlay.classList.toggle("show", !!show);
    document.body.classList.toggle("needsLandscape", !!show);
  }

  function handlePlayOrientation(){
    resize();
    if(isMobilePortraitPlayBlocked()){
      if(running && !paused){
        orientationPaused = true;
        paused = true;
        try{ song.pause(); }catch(e){}
        if(raf){ cancelAnimationFrame(raf); raf = 0; }
      }
      if(running || pendingMobileStartMode) setRotateOverlay(true);
      return false;
    }
    setRotateOverlay(false);
    if(pendingMobileStartMode){
      const mode = pendingMobileStartMode;
      pendingMobileStartMode = null;
      start(mode);
      return true;
    }
    if(running && paused && orientationPaused){
      orientationPaused = false;
      resumeGame();
    }
    return true;
  }

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
    if(safeTech){safeTech.classList.toggle("on",selectedMenuMode==="tech");safeTech.textContent="TECH " + formatDifficulty("tech");}
    if(safeNormal){safeNormal.classList.toggle("on",selectedMenuMode==="normal");safeNormal.textContent="NORMAL " + formatDifficulty("normal");}
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
    if(isMobilePortraitPlayBlocked()){
      pendingMobileStartMode = mode;
      safeSetState("game");
      document.body.classList.add("safeClean");
      setRotateOverlay(true);
      try{ song.pause(); }catch(e){}
      return;
    }
    pendingMobileStartMode = null;
    setRotateOverlay(false);
    safeSetState("game");
    document.body.classList.add("safeClean");
    return originalStart(mode);
  };

  const originalEndGame=endGame;
  endGame=function(stopAudio=true){
    originalEndGame(stopAudio);
    document.body.classList.remove("safeClean");
    if(resultOverlay && resultOverlay.classList.contains("show")){
      safeSetState("game");
    }else{
      safeSetOverlay(false);
      safeSetMenuVisible(true);
      if(safeStart)safeStart.textContent="START";
    }
    safeRefresh();
  };

  const originalToggleKeymap = toggleKeymap;
  toggleKeymap=function(force){
    const show = force!==undefined ? force : !keymapOverlay.classList.contains("show");
    if(show && isMobileViewport()) toggleSettings(false);
    originalToggleKeymap(show);
  };

  const originalToggleSettings=toggleSettings;
  toggleSettings=function(force){
    settingsVisible = force!==undefined ? force : !settingsVisible;
    if(settingsVisible && isMobileViewport()) originalToggleKeymap(false);
    safeSetOverlay(settingsVisible);
    originalToggleSettings(settingsVisible);
    safeRefresh();
  };

  safeBind(safeStart,()=>{safeStart.textContent="LOADING...";start("play");});
  safeBind(safeEditor,()=>{if(debugMode)start("editor"); else toggleKeymap(true);});
  safeBind(safeTech,()=>{selectedMenuMode="tech";mapMode="tech";safeRefresh();updateButtons();});
  safeBind(safeNormal,()=>{selectedMenuMode="normal";mapMode="normal";safeRefresh();updateButtons();});
  safeBind(safeAuto,()=>{autoMode=!autoMode;safeRefresh();updateButtons();});
  safeBind(safeFull,requestFullscreenSafe);
  safeBind(safeSettingsBtn,()=>toggleSettings(true));

  safeBind(safeSetAuto,()=>{autoMode=!autoMode;safeRefresh();updateButtons();});
  safeBind(safeSetMap,()=>{if(running && !debugMode)return; mapMode=mapMode==="tech"?"normal":"tech";selectedMenuMode=mapMode;safeRefresh();restartIfRunning();});
  safeBind(safeSetKeymap,()=>toggleKeymap(true));
  safeBind(safeSetFull,requestFullscreenSafe);
  safeBind(safeSetSfx,()=>{sfxEnabled=!sfxEnabled;refreshSettingsUI();});
  safeBind(safeSetMusic,()=>changeMusic(musicVolume>=.95?-.45:.10));
  safeBind(safeSetSpdDown,()=>changeSpeed(+0.04));
  safeBind(safeSetSpdUp,()=>changeSpeed(-0.04));
  safeBind(safeSetOffDown,()=>changeOffset(-0.03));
  safeBind(safeSetOffUp,()=>changeOffset(+0.03));
  safeBind(safeResume,()=>{safeSetOverlay(false);resumeGame();});
  safeBind(safeExit,exitToMenu);

  window.addEventListener("resize", handlePlayOrientation);
  window.addEventListener("orientationchange", () => setTimeout(handlePlayOrientation, 80));

  safeSetState("title");
  safeRefresh();



  updateModeButtons();
  updateButtons();
})();
