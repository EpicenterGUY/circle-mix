(() => {
  const song = document.getElementById("song");
  const embeddedAnimaSrc = (song && typeof song.getAttribute === "function") ? (song.getAttribute("src") || "") : (song?.src || "");
  const canvas = document.getElementById("game");
  const gameRoot = document.getElementById("gameRoot") || document.documentElement;
  const fullscreenTarget = document.documentElement;
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
  const angleSnapSelect=document.getElementById("angleSnapSelect"), editorAngleInput=document.getElementById("editorAngleInput");
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
  const debugParams = new URLSearchParams(window.location.search);
  const debugMode = debugParams.get("debug")==="1";
  const mobileDebug = debugParams.get("pwaDebug")==="1" || debugParams.get("mobileDebug")==="1";
  const audioDebugStats = {play:0,pause:0,load:0,currentTimeSet:0,previewStart:0,previewStop:0};
  let mobileAudioDebugPanel=null, mobileAudioDebugLastPaint=0;
  document.body.classList.toggle("debugMode", debugMode);
  function setSongCurrentTime(value, source="unknown"){ audioDebugStats.currentTimeSet++; if(mobileDebug) console.log(`[AudioDebug] currentTime=${value} source=${source}`); song.currentTime=value; }
  function playSong(source="unknown"){ audioDebugStats.play++; if(mobileDebug) console.log(`[AudioDebug] play source=${source}`); return song.play(); }
  function pauseSong(source="unknown"){ audioDebugStats.pause++; if(mobileDebug) console.log(`[AudioDebug] pause source=${source}`); return song.pause(); }
  function loadSong(source="unknown"){ audioDebugStats.load++; if(mobileDebug) console.log(`[AudioDebug] load source=${source}`); return song.load(); }
  const modeNormalStar = document.getElementById("modeNormalStar");
  const modeTechStar = document.getElementById("modeTechStar");
  const modeNormalBtn = document.getElementById("modeNormalBtn");
  const modeTechBtn = document.getElementById("modeTechBtn");
  const modeCustomBtn = document.getElementById("modeCustomBtn");
  const pauseOverlay = document.getElementById("pauseOverlay");
  const pauseResume = document.getElementById("resumeBtn");
  const pauseRetry = document.getElementById("retryBtn");
  const pauseMenu = document.getElementById("exitBtn");
  const mobilePauseBtn = document.getElementById("mobilePauseBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const enterFullscreenBtn = document.getElementById("enterFullscreenBtn");
  const fullscreenRetryBtn = document.getElementById("fullscreenRetryBtn");
  const pauseMessage = document.getElementById("pauseMessage");
  const pauseSettingsOverlay = document.getElementById("pauseSettingsOverlay");
  const pauseSettingsBack = document.getElementById("pauseSettingsBack");
  const pauseSetSpdDown = document.getElementById("pauseSetSpdDown");
  const pauseSetSpdUp = document.getElementById("pauseSetSpdUp");
  const pauseSetOffDown = document.getElementById("pauseSetOffDown");
  const pauseSetOffUp = document.getElementById("pauseSetOffUp");
  const pauseSetMusic = document.getElementById("pauseSetMusic");
  const pauseSetSfx = document.getElementById("pauseSetSfx");
  const pauseSetAuto = document.getElementById("pauseSetAuto");
  const pauseSetFull = document.getElementById("pauseSetFull");
  const pauseSetNoteContrast = document.getElementById("pauseSetNoteContrast");
  const pauseSetPathBrightness = document.getElementById("pauseSetPathBrightness");
  const pauseSetEffectIntensity = document.getElementById("pauseSetEffectIntensity");
  const pauseSetJudgeGuide = document.getElementById("pauseSetJudgeGuide");
  const pauseSetAimStabilizer = document.getElementById("pauseSetAimStabilizer");
  const pauseSetAimVisual = document.getElementById("pauseSetAimVisual");
  const pauseSetVisualResponse = document.getElementById("pauseSetVisualResponse");
  const pauseSetPcAim = document.getElementById("pauseSetPcAim");
  const pauseSetLockedSensitivity = document.getElementById("pauseSetLockedSensitivity");
  const pauseSetMobileQuality = document.getElementById("pauseSetMobileQuality");
  const pauseSetHaptic = document.getElementById("pauseSetHaptic");
  const mobileActionBtn = document.getElementById("mobileActionBtn");
  const mobileScratchBtn = document.getElementById("mobileScratchBtn");
  const pauseSetMobileLayout = document.getElementById("pauseSetMobileLayout");
  const pauseSetMobileInputTest = document.getElementById("pauseSetMobileInputTest");
  const pauseSetMobileExport = document.getElementById("pauseSetMobileExport");
  const pauseSetMobileReset = document.getElementById("pauseSetMobileReset");
  const mobileLayoutOverlay = document.getElementById("mobileLayoutOverlay");
  const mobileLayoutPreview = document.getElementById("mobileLayoutPreview");
  const mobileLayoutAction = document.getElementById("mobileLayoutAction");
  const mobileLayoutScratch = document.getElementById("mobileLayoutScratch");
  const mobileLayoutWarning = document.getElementById("mobileLayoutWarning");
  const mobileLayoutCoord = document.getElementById("mobileLayoutCoord");
  const mobileLayoutResolution = document.getElementById("mobileLayoutResolution");
  const mobileLayoutExport = document.getElementById("mobileLayoutExport");
  const mobileSafeArea = document.getElementById("mobileSafeArea");
  const mobileJudgeGhost = document.getElementById("mobileJudgeGhost");
  const mobileInputTestOverlay = document.getElementById("mobileInputTestOverlay");
  const mobileInputTestCanvas = document.getElementById("mobileInputTestCanvas");
  const mobileInputTestStats = document.getElementById("mobileInputTestStats");
  const mobileInputTestSteps = document.getElementById("mobileInputTestSteps");
  const resultOverlay = document.getElementById("resultOverlay");
  const resultScore = document.getElementById("resultScore");
  const resultPower = document.getElementById("resultPower");
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
  const resultSongTitle = document.getElementById("resultSongTitle");
  const resultAuto = document.getElementById("resultAuto");
  const resultNewRecord = document.getElementById("resultNewRecord");
  const resultBest = document.getElementById("resultBest");
  const rotateOverlay = document.getElementById("rotateOverlay");
  const songSelect = document.getElementById("songSelect");
  const songCarousel = document.getElementById("songCarousel");
  const songDifficulty = document.getElementById("songDifficulty");
  const songPlayBtn = document.getElementById("songPlayBtn");
  const songSelectBack = document.getElementById("songSelectBack");
  const quickSettingsBtn = document.getElementById("quickSettingsBtn");
  const quickEditorBtn = document.getElementById("quickEditorBtn");
  const quickFullBtn = document.getElementById("quickFullBtn");
  const resumeBtn = document.getElementById("resumeBtn");
  const retryBtn = document.getElementById("retryBtn");
  const exitBtn = document.getElementById("exitBtn");
  const safeTutorial = document.getElementById("safeTutorial");
  const safeRestartStep = document.getElementById("safeRestartStep");
  const tutorialPrompt = document.getElementById("tutorialPrompt");
  const tutorialPromptStart = document.getElementById("tutorialPromptStart");
  const tutorialPromptSkip = document.getElementById("tutorialPromptSkip");
  const tutorialHud = document.getElementById("tutorialHud");
  const tutorialStepLabel = document.getElementById("tutorialStepLabel");
  const tutorialProgress = document.getElementById("tutorialProgress");
  const tutorialTitle = document.getElementById("tutorialTitle");
  const tutorialDesc = document.getElementById("tutorialDesc");
  const tutorialInputHint = document.getElementById("tutorialInputHint");
  const tutorialCountdown = document.getElementById("tutorialCountdown");
  const tutorialSkipStep = document.getElementById("tutorialSkipStep");
  const tutorialExit = document.getElementById("tutorialExit");
  const tutorialComplete = document.getElementById("tutorialComplete");
  const tutorialPlayNow = document.getElementById("tutorialPlayNow");
  const tutorialBackTitle = document.getElementById("tutorialBackTitle");
  const tutorialReplay = document.getElementById("tutorialReplay");

  const TAU = Math.PI * 2;
  const songs = window.CircleMixSongRegistry || { all:()=>[], localAll:()=>[], refreshLocal:async()=>[], get:()=>null, hasDifficulty:()=>false };
  const chartTools = window.CircleMixChartTools || { validateChart:()=>({ok:true,errors:[]}), calculateStars:()=>1 };
  const initialParams = new URLSearchParams(window.location.search);
  const versionInfo = window.CircleMixVersion || {version:"0.0.0", buildDate:""};
  const changelogEntries = Array.isArray(window.CircleMixChangelog) ? [...window.CircleMixChangelog] : [];
  const devModeFromQuery = initialParams.get("dev") === "1";
  if(devModeFromQuery){ try{ localStorage.setItem("circleMixDevMode", "true"); }catch(e){} }
  let circleMixDevMode = devModeFromQuery || (()=>{ try{return localStorage.getItem("circleMixDevMode") === "true";}catch(e){return false;} })();
  const LAST_SEEN_VERSION_KEY = "circleMixLastSeenVersion";
  let selectedSource = initialParams.get("tab")==="local" ? "local" : "builtin";
  let selectedSongId = selectedSource==="builtin" ? (initialParams.get("song") || "anima") : (initialParams.get("song") || null);
  let selectedDifficultyId = selectedSource==="builtin" ? ((initialParams.get("difficulty") || "tech").toLowerCase()) : (initialParams.get("chart") || null);
  let selectedSong = selectedSource==="builtin" ? songs.get(selectedSongId || "anima") : null;
  let BPM = selectedSong?.bpm || 184.6;
  let BEAT = 60 / BPM;
  const CHART_STRETCH = 1.00;
  let SONG_OFFSET = typeof selectedSong?.offset === "number" ? selectedSong.offset : -0.04;
  // 사용자가 말한 마지막 음 기준: 약 1:51 지점에서 종료.
  const SONG_END_TIME = 111.450;
  const CHART_END_BEAT = 342.894; // beat 단위. 채보가 빠르면 +, 늦으면 - 로 조정
  let APPROACH = 0.60;
  const HIT_WINDOW = 0.17;
  const SWING_FLICK_SPEED = 0.78;
  const SCRATCH_FLICK_SPEED = 1.30;
  const DIAL_ARC_HALF = Math.PI * 0.075;
  const DIAL_ARC_VISUAL = Math.PI * 0.100;
  // Tutorial and normal play intentionally share the exact same TRACE judgement.
  // The tutorial only adds visual guidance, slower/simple charts and immediate retries.
  const COMMON_TRACE_PROFILE = {
    // TRACE is judged by directed angular travel, not by tracking a moving dot.
    startToleranceDeg:30,
    endpointGreatToleranceDeg:30,
    endpointPerfectToleranceDeg:15,
    startGrace:.25,
    endpointWindow:.25,
    endpointGrace:.14,
    greatTravelRatio:.85,
    perfectTravelRatio:.95,
    reverseGreatRatio:.25,
    reversePerfectRatio:.12,
    maxReverseGreatDeg:90,
    maxReversePerfectDeg:45
  };
  const TRACE_PROFILES = {
    normal:{...COMMON_TRACE_PROFILE},
    tutorial:{...COMMON_TRACE_PROFILE}
  };
  const TRACE_SWING_LINK_MIN = .15;
  const TRACE_SWING_LINK_MAX = .25;
  const BASE_NOTE_WIDTH = 8;
  const NOTE_WIDTHS = { cut:BASE_NOTE_WIDTH, slide:BASE_NOTE_WIDTH, scratch:BASE_NOTE_WIDTH, swing:BASE_NOTE_WIDTH, trace:3.0, hold:11.5 };
  const VISUAL_SETTINGS_KEY = "circleMixVisualSettings.v1";
  const INPUT_SETTINGS_KEY = "circleMixInputSettings.v1";
  const MOBILE_CONTROL_PRESETS = ["STANDARD","LEFT_HANDED","RIGHT_HANDED","CUSTOM"];
  const MOBILE_CONTROL_DEFAULTS = {mobileControlPreset:"STANDARD",mobileActionSize:88,mobileScratchSize:88,mobileButtonOpacity:.68,mobileActionX:null,mobileActionY:null,mobileScratchX:null,mobileScratchY:null,mobileControlGap:18};
  const MOBILE_QUALITY_MODES = ["AUTO","HIGH","PERFORMANCE"];
  const AIM_STABILIZER_MODES = ["OFF","LOW","MEDIUM"];
  const AIM_VISUAL_MODES = ["DIRECT","SMOOTH"];
  const AIM_VISUAL_RESPONSE_MODES = ["FAST","NORMAL","SOFT"];
  const PC_AIM_MODES = ["AUTO","ABSOLUTE","LOCKED"];
  const VISUAL_CHOICES = { noteContrast:["NORMAL","HIGH"], pathBrightness:["LOW","NORMAL","HIGH"], effectIntensity:["LOW","NORMAL","HIGH"], judgeGuide:["OFF","BEGINNER","ALWAYS"] };
  const visualSettings = loadVisualSettings();
  const inputSettings = loadInputSettings();

  const COLORS = {
    cut:"#5cfffb", swingCW:"#79ff7d", swingCCW:"#ff72d6", slide:"#ffe15a", fx:"#b77cff",
    trace:"#4388ff", traceSoft:"#2466d9", scratch:"#ee3d9a", scratchCW:"#ee3d9a", scratchCCW:"#ff5aa8",
    perfect:"#fff36a", great:"#80ffdb", miss:"#ff4567"
  };

  function loadVisualSettings(){
    try{
      const saved=JSON.parse(localStorage.getItem(VISUAL_SETTINGS_KEY)||"{}");
      return {
        noteContrast:VISUAL_CHOICES.noteContrast.includes(saved.noteContrast)?saved.noteContrast:"HIGH",
        pathBrightness:VISUAL_CHOICES.pathBrightness.includes(saved.pathBrightness)?saved.pathBrightness:"NORMAL",
        effectIntensity:VISUAL_CHOICES.effectIntensity.includes(saved.effectIntensity)?saved.effectIntensity:"NORMAL",
        judgeGuide:VISUAL_CHOICES.judgeGuide.includes(saved.judgeGuide)?saved.judgeGuide:"BEGINNER"
      };
    }catch(e){ return {noteContrast:"HIGH",pathBrightness:"NORMAL",effectIntensity:"NORMAL",judgeGuide:"BEGINNER"}; }
  }
  function saveVisualSettings(){ try{ localStorage.setItem(VISUAL_SETTINGS_KEY, JSON.stringify(visualSettings)); }catch(e){} }
  function loadInputSettings(){
    try{
      const saved=JSON.parse(localStorage.getItem(INPUT_SETTINGS_KEY)||"{}");
      return sanitizeInputSettings({...saved, aimStabilizer:AIM_STABILIZER_MODES.includes(saved.aimStabilizer)?saved.aimStabilizer:"OFF", aimVisual:AIM_VISUAL_MODES.includes(saved.aimVisual)?saved.aimVisual:"DIRECT", aimVisualResponse:AIM_VISUAL_RESPONSE_MODES.includes(saved.aimVisualResponse)?saved.aimVisualResponse:"FAST", pcAimMode:PC_AIM_MODES.includes(saved.pcAimMode)?saved.pcAimMode:"AUTO", lockedAimSensitivity:saved.lockedAimSensitivity, mobileQuality:MOBILE_QUALITY_MODES.includes(saved.mobileQuality)?saved.mobileQuality:"AUTO", haptic:!!saved.haptic});
    }catch(e){ return sanitizeInputSettings({aimStabilizer:"OFF", aimVisual:"DIRECT", aimVisualResponse:"FAST", pcAimMode:"AUTO", lockedAimSensitivity:1, mobileQuality:"AUTO", haptic:false}); }
  }
  function finiteRange(v,min,max,fallback){ v=Number(v); return Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback; }
  function finite01(v,fallback){ v=Number(v); return Number.isFinite(v)?Math.min(1,Math.max(0,v)):fallback; }
  function sanitizeInputSettings(settings){
    const preset=MOBILE_CONTROL_PRESETS.includes(settings.mobileControlPreset)?settings.mobileControlPreset:"STANDARD";
    const aimStabilizer=AIM_STABILIZER_MODES.includes(settings.aimStabilizer)?settings.aimStabilizer:"OFF", aimVisual=AIM_VISUAL_MODES.includes(settings.aimVisual)?settings.aimVisual:"DIRECT", aimVisualResponse=AIM_VISUAL_RESPONSE_MODES.includes(settings.aimVisualResponse)?settings.aimVisualResponse:"FAST";
    return {...settings, aimStabilizer, aimVisual, aimVisualResponse, pcAimMode:PC_AIM_MODES.includes(settings.pcAimMode)?settings.pcAimMode:"AUTO", lockedAimSensitivity:finiteRange(settings.lockedAimSensitivity,.5,2,1), mobileControlPreset:preset, mobileActionSize:finiteRange(settings.mobileActionSize,64,124,88), mobileScratchSize:finiteRange(settings.mobileScratchSize,64,124,88), mobileButtonOpacity:finiteRange(settings.mobileButtonOpacity,.35,1,.68), mobileActionX:finite01(settings.mobileActionX,null), mobileActionY:finite01(settings.mobileActionY,null), mobileScratchX:finite01(settings.mobileScratchX,null), mobileScratchY:finite01(settings.mobileScratchY,null), mobileControlGap:finiteRange(settings.mobileControlGap,4,32,18)};
  }
  function saveInputSettings(){ try{ localStorage.setItem(INPUT_SETTINGS_KEY, JSON.stringify(inputSettings)); }catch(e){} }
  function effectiveEffectMode(){
    if(isCoarsePointerMobile() && (getMobileQuality()==="PERFORMANCE" || SESSION_QUALITY.effectMode==="PERFORMANCE")) return "PERFORMANCE";
    return visualSettings.effectIntensity;
  }
  function visualScale(kind){
    if(kind==="effect"){
      const mode=effectiveEffectMode();
      if(mode==="PERFORMANCE") return .42;
      return mode==="LOW"?.55:(mode==="HIGH"?1.15:.82);
    }
    if(kind==="path") return visualSettings.pathBrightness==="LOW"?.72:(visualSettings.pathBrightness==="HIGH"?1.22:1);
    return visualSettings.noteContrast==="HIGH"?1.12:1;
  }

  let W=0,H=0,cx=0,cy=0,baseR=0,hitR=0,outerR=0;
  let running=false, startMs=0, lastMs=0, raf=0;
  let testFrameCount=0, testRenderCount=0;
  // Kept completely opt-in: browser regression can advance gameplay without
  // depending on media scheduling or the host's RAF cadence.
  let browserTestClock=null;
  let tutorialMode=false, tutorialStepIndex=0, tutorialAttempts=0, tutorialCountdownUntil=0;
  let tutorialSessionId=0, tutorialStepToken=0, tutorialAttemptId=0, tutorialTransitionGeneration=0;
  let tutorialLastAdvanceReason=null, tutorialLastAdvanceSource=null;
  const tutorialState={successCount:0,successStreak:0,failCount:0,phaseCompleted:false,transitioning:false,transitionState:"IDLE",completing:false,currentJudgement:null,coverageRatio:0,trackedQualityTime:0,endpointCaptured:false,activeInput:null,autoSuppressed:false,previousAutoEnabled:false,timers:[],rafIds:[],pendingSkipQueue:[],mixRetryScheduled:false,mixRetryCount:0,completeCount:0,chartFinalizationCount:0,lastChartFinalization:null,inputEnabledAt:0,pointerMoved:false,lastSource:null,validUserInputCount:0,consumedNoteIds:new Set(),lastExploreCompletionAt:0,exploreInsideSince:0,traceSwingPhase:null,traceCompletedAt:0,swingArmedAt:0,swingVisible:false};
  let audioStartedAt=0;
  let score=0, combo=0, maxCombo=0;
  let judgedCount=0, perfectCount=0, greatCount=0, missCount=0;
  let actualHitValue=0, maxHitValue=0;
  let chart=[], chartLastHitEnd=0, feedback=[], particles=[], waves=[], ringBursts=[], scratchBursts=[];
  const gameState={autoEnabled:false};
  let mapMode="tech";
  let mouseX=0, mouseY=0;
  let lastPointerSource="pointer";
  let armAngle=-Math.PI/2, targetAngle=-Math.PI/2, prevArmAngle=-Math.PI/2, armVel=0, rawArmVel=0;
  let rawTargetAngle=-Math.PI/2, stabilizedTargetAngle=-Math.PI/2, lastValidTargetAngle=-Math.PI/2;
  let centerDeadzoneActive=false, cursorRadius=hitR, lastRawAngleForVelocity=-Math.PI/2;
  let rawAngularVelocity=0, magnetTarget=null, magnetAngleError=0;
  let lockedVirtualAngle=-Math.PI/2, pointerLockRequested=false, pointerLockFallback=false, lastRelativeMovement={x:0,y:0};
  // Pointer samples, not RAF cadence, are the authoritative aim input stream.
  const AIM_SAMPLE_FRESH_MS=120;
  const aimInput={rawAngle:-Math.PI/2, unwrappedAngle:-Math.PI/2, previousSampleAngle:null, sampleAngularVelocity:0, accumulatedCWTravel:0, accumulatedCCWTravel:0, pointerRadius:0, sampleCount:0, lastSampleTimestamp:0, centerDeadzoneActive:false, rebasePending:true, pendingSamples:0, lastSampleDelta:0};
  let rawInputAngle=-Math.PI/2, judgementAimAngle=-Math.PI/2, visualArmAngle=-Math.PI/2;
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
  let scratchHoldEpoch=0, scratchHoldCW=0, scratchHoldCCW=0, scratchHoldWasActive=false;
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
  let editorMode=false, selectedLane=0, selectedEditorAngle=0, editorAngleSnap=8, useCustomChart=false;
  const initialDifficultyParam = initialParams.get("difficulty");
  let selectedMenuMode=(selectedDifficultyId || initialDifficultyParam || "tech").toLowerCase();
  let songTab=selectedSource==="local" ? "local" : "built-in";
  let activeLocalBlobUrl=null;
  const localJacketUrls=new Map();
  function localJacketUrl(songData){ if(!songData?.jacketBlob) return songData?.jacket || ""; if(!localJacketUrls.has(songData.id)) localJacketUrls.set(songData.id,URL.createObjectURL(songData.jacketBlob)); return localJacketUrls.get(songData.id); }
  function revokeLocalJacketUrl(id){ const url=localJacketUrls.get(id); if(url){ URL.revokeObjectURL(url); localJacketUrls.delete(id); } }
  window.addEventListener("beforeunload",()=>{ for(const url of localJacketUrls.values()) URL.revokeObjectURL(url); });
  let previewTimer=0;
  let previewActive=false;
  let previewSessionId=0;
  let previewMetadataHandler=null;
  let activePlaySource="builtin";
  let activeChartId=null;
  let paused=false;
  let completionPending=false, completionTimer=0, resultShown=false, abortingRun=false;
  let settingsVisible=false;
  let settingsOrigin="title";
  let playSessionToken=0;
  let fullscreenInterrupted=false;
  let fullscreenTransitioning=false;
  let stableResizeTimer=0;
  let gameplayScrollLocked=false;
  let gameplayScrollX=0, gameplayScrollY=0;
  let pauseSettingsOpen=false;
  let customChartData=[];
  const difficultyCache={};
  let lastTraceSwingRuntimeLogAt=0, lastTraceSwingRuntimeLogState="";
  let mobileAimPointerId = null;
  let mobileActionPointerId = null;
  let mobileScratchPointerId = null;
  let currentRenderDpr = 1;
  const MOBILE_EFFECT_LIMITS={particles:120,feedback:32,waves:20,ringBursts:12,scratchBursts:10};
  const DESKTOP_EFFECT_LIMITS={particles:360,feedback:96,waves:64,ringBursts:40,scratchBursts:32};
  const hudCache={lastAt:0,score:null,combo:null,accuracy:null};
  const SESSION_QUALITY={autoDprCap:1.5,effectMode:"NORMAL",lastDropAt:0,startedAt:0};
  const perfEnabled=new URLSearchParams(window.location.search).get("perf")==="1";
  const perfStats={el:null,lastMs:0,lastPaint:0,samples:0,totalFrame:0,maxFrame:0,longFrames:0,fpsFrames:0,fpsAt:0,fps:0,visibleNotes:0};
  const autoQualityStats={windowAt:0,samples:0,totalFrame:0,longFrames:0};
  const renderWindow={start:0,end:0,notes:[]};
  const domCache={songAutoBtn:null,songAutoState:null,hudSongTitle:null};


  function sourceKey(songData=selectedSong){ return (songData?.source==="local" || selectedSource==="local") ? "local" : "builtin"; }
  function difficultyIds(songData=selectedSong){
    const available=new Set([...Object.keys(songData?.difficulties||{}),...Object.keys(songData?.charts||{})]), ids=[], seen=new Set();
    for(const id of [...(Array.isArray(songData?.difficultyOrder)?songData.difficultyOrder:[]),...Object.keys(songData?.difficulties||{}),...Object.keys(songData?.charts||{})]){
      if(typeof id==="string"&&available.has(id)&&!seen.has(id)){ seen.add(id); ids.push(id); }
    }
    return ids;
  }
  function localChartEntries(songData=selectedSong){
    const charts=songData?.charts||{};
    return difficultyIds(songData).filter(id=>charts[id]?.notes?.length).map(id=>({id,chart:charts[id],meta:songData?.difficulties?.[id]||charts[id]?.meta||{}}));
  }
  function getActiveDifficultyLabel(songData=selectedSong, difficultyId=selectedDifficultyId || selectedMenuMode){
    if(!difficultyId) return "UNKNOWN";
    if(songData?.source==="builtin") return songData?.difficulties?.[difficultyId]?.label || String(difficultyId).toUpperCase();
    const diffMeta=songData?.difficulties?.[difficultyId];
    if(diffMeta?.label) return String(diffMeta.label);
    const chartMeta=songData?.charts?.[difficultyId]?.meta || songData?.charts?.[difficultyId]?.metadata || songData?.charts?.[difficultyId];
    if(chartMeta?.label) return String(chartMeta.label);
    if(difficultyId) return String(difficultyId).toUpperCase();
    return "UNKNOWN";
  }
  function getSelectedChartId(){ return selectedSource==="local" ? selectedDifficultyId : selectedMenuMode; }
  function clearPreviewTimer(){
    if(previewTimer){ clearTimeout(previewTimer); previewTimer=0; }
  }

  function canRunSongPreview(sessionId=previewSessionId){
    return sessionId===previewSessionId && !running && !paused && !resultOverlay?.classList.contains("show") && songSelect && !songSelect.hidden && selectedSong;
  }

  function stopSongPreview(){
    previewSessionId++;
    audioDebugStats.previewStop++;
    previewActive=false;
    clearPreviewTimer();
    if(previewMetadataHandler){ song.removeEventListener("loadedmetadata", previewMetadataHandler); previewMetadataHandler=null; }
    try{ pauseSong("preview-stop"); }catch(e){}
  }

  function loadPreviewAudio(songData, sessionId=previewSessionId){
    if(!canRunSongPreview(sessionId)) return false;
    if(activeLocalBlobUrl){ URL.revokeObjectURL(activeLocalBlobUrl); activeLocalBlobUrl=null; }
    if(songData?.audioBlob){
      activeLocalBlobUrl=URL.createObjectURL(songData.audioBlob); song.src=activeLocalBlobUrl;
    }else if(songData?.source==="local"){
      return false;
    }else if(songData?.audio && String(songData.audio).startsWith("#")){
      song.src=embeddedAnimaSrc;
    }else if(songData?.audio){
      song.src=songData.audio;
    }else return false;
    try{ loadSong("preview-load"); }catch(e){}
    applyMusicVolume();
    return true;
  }

  function startSongPreview(){
    if(running || paused || !songSelect || songSelect.hidden || !selectedSong || resultOverlay?.classList.contains("show")) return;
    stopSongPreview();
    const sessionId=++previewSessionId;
    audioDebugStats.previewStart++;
    previewActive=true;
    if(!loadPreviewAudio(selectedSong, sessionId)){ previewActive=false; return; }
    const previewStart=Number(selectedSong.previewStart)||0;
    const previewDuration=Math.max(1, Number(selectedSong.previewDuration)||15);
    const play=()=>{
      if(!canRunSongPreview(sessionId) || !previewActive) return;
      try{ setSongCurrentTime(previewStart, "preview-start"); }catch(e){}
      const playPromise=playSong("preview-start");
      if(playPromise?.catch) playPromise.catch(()=>{}).finally(()=>{ if(!canRunSongPreview(sessionId)) return; });
      clearPreviewTimer();
      previewTimer=setTimeout(()=>{ if(canRunSongPreview(sessionId) && previewActive) startSongPreview(); }, previewDuration*1000);
    };
    if(Number.isFinite(song.duration) || song.readyState>=1) play();
    else{
      previewMetadataHandler=()=>{ previewMetadataHandler=null; play(); };
      song.addEventListener("loadedmetadata", previewMetadataHandler, {once:true});
    }
  }

  function syncSongUrl(){
    const url = new URL(window.location.href);
    url.searchParams.set("tab", selectedSource==="local" ? "local" : "builtin");
    url.searchParams.delete("song"); url.searchParams.delete("difficulty"); url.searchParams.delete("chart");
    if(selectedSource==="builtin"){
      if(selectedSongId) url.searchParams.set("song", selectedSongId);
      if(selectedDifficultyId || selectedMenuMode) url.searchParams.set("difficulty", selectedDifficultyId || selectedMenuMode);
    }else{
      if(selectedSongId) url.searchParams.set("song", selectedSongId);
      if(selectedDifficultyId) url.searchParams.set("chart", selectedDifficultyId);
    }
    window.history.replaceState({}, "", url);
  }

  function resolveSelectedSong(songId, source=selectedSource){
    selectedSource = source==="local" ? "local" : "builtin";
    selectedSongId = songId || (selectedSource==="builtin" ? songs.all()[0]?.id || null : null);
    selectedSong = selectedSource==="local" ? songs.localAll().find(s=>s.id===selectedSongId) : (songs.getByKey ? songs.getByKey(`bundled:${selectedSongId}`) : songs.get(selectedSongId));

    BPM = selectedSong?.bpm || 184.6;
    BEAT = 60 / BPM;
    SONG_OFFSET = typeof selectedSong?.offset === "number" ? selectedSong.offset : -0.04;
    Object.keys(difficultyCache).forEach(k=>delete difficultyCache[k]);
    return selectedSong;
  }

  let resizeRetryPending=false;
  function isCoarsePointerMobile(){
    const coarse=!!(window.matchMedia&&window.matchMedia("(pointer: coarse)").matches);
    const touch=(typeof navigator!=="undefined" && (navigator.maxTouchPoints||0)>0);
    const compact=Math.min(window.innerWidth||0,window.innerHeight||0)<=900;
    return (coarse&&touch)||(touch&&compact);
  }
  function getMobileQuality(){ return MOBILE_QUALITY_MODES.includes(inputSettings.mobileQuality)?inputSettings.mobileQuality:"AUTO"; }
  function getRenderDpr(){
    const nativeDpr = window.devicePixelRatio || 1;
    if(isCoarsePointerMobile()){
      const quality=getMobileQuality();
      if(quality==="HIGH") return Math.min(nativeDpr,2);
      if(quality==="PERFORMANCE") return 1;
      return Math.min(nativeDpr,SESSION_QUALITY.autoDprCap);
    }
    return Math.min(nativeDpr,2);
  }
  function syncMobilePerformanceClass(){
    const mobile=isCoarsePointerMobile();
    document.body.classList.toggle("mobileStandalone", mobile);
    document.body.classList.toggle("mobileQualityPerformance", mobile&&getMobileQuality()==="PERFORMANCE");
    document.body.classList.toggle("mobileQualityHigh", mobile&&getMobileQuality()==="HIGH");
    document.body.classList.toggle("mobileQualityAutoDegraded", mobile&&getMobileQuality()==="AUTO"&&(SESSION_QUALITY.autoDprCap<1.5||SESSION_QUALITY.effectMode==="PERFORMANCE"));
  }

  function validViewportSize(value){
    return !!value &&
      Number.isFinite(Number(value.width)) &&
      Number.isFinite(Number(value.height)) &&
      Number(value.width)>0 &&
      Number(value.height)>0;
  }
  function resize(forcedSize=null){
    const dpr = getRenderDpr();
    currentRenderDpr = dpr;
    syncMobilePerformanceClass();
    const rectSource = document.fullscreenElement ? (gameRoot || document.documentElement) : null;
    const rect = rectSource ? rectSource.getBoundingClientRect() : null;
    const viewport = validViewportSize(forcedSize)
      ? {width:Number(forcedSize.width), height:Number(forcedSize.height)}
      : getViewportSize();
    W=Math.floor(rect && rect.width ? rect.width : viewport.width);
    H=Math.floor(rect && rect.height ? rect.height : viewport.height);
    if(W<=0 || H<=0){
      if(!resizeRetryPending){
        resizeRetryPending=true;
        requestAnimationFrame(()=>{ resizeRetryPending=false; resize(); });
      }
      return;
    }
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(1,0,0,1,0,0);
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const outerGlowSize = 26;
    const outerLineWidth = 2;
    const safeMargin = Math.max(isCoarsePointerMobile()?44:32, outerGlowSize + outerLineWidth);
    const tutorialSidePanel = tutorialMode && W >= 1180 && H >= 620;
    const tutorialTopPanel = tutorialMode && !tutorialSidePanel && W > H;
    document.body.classList.toggle("tutorialSidePanel", tutorialSidePanel);
    document.body.classList.toggle("tutorialTopPanel", tutorialTopPanel);

    // The tutorial playfield must stay in the true center of the screen.
    // The HUD is an overlay and never reserves asymmetric canvas space.
    if(tutorialMode){
      const tutorialMargin = tutorialTopPanel ? 78 : 54;
      const playfieldSize = Math.min(W,H);
      cx = W * .5;
      cy = H * .5;
      outerR = Math.max(96, playfieldSize * .5 - Math.max(safeMargin,tutorialMargin));
      baseR = outerR / 1.86;
      hitR = baseR;
      return;
    }

    const playfieldSize = Math.min(W,H);

    cx = W * .5;
    cy = H * .5;
    outerR = Math.max(96, playfieldSize * .5 - safeMargin);
    baseR = outerR / 1.86;
    hitR = baseR;
  }
  const handleViewportResize=()=>resize();
  window.addEventListener("resize", handleViewportResize);
  window.addEventListener("orientationchange", handleViewportResize);
  if(window.ResizeObserver){
    new ResizeObserver(handleViewportResize).observe(document.documentElement);
  }
  resize();

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function lerp(a,b,t){return a+(b-a)*t;}
  function norm(a){while(a<=-Math.PI)a+=TAU;while(a>Math.PI)a-=TAU;return a;}
  function distAng(a,b){return Math.abs(norm(a-b));}
  function now(){
    if(!running) return 0;
    if(browserTestClock!==null) return browserTestClock;
    const audioTime = song.currentTime || 0;
    const fallbackTime = (performance.now() - audioStartedAt) / 1000;
    return Math.max(0, (audioTime > 0.03 ? audioTime : fallbackTime) - SONG_OFFSET);
  }
  function laneAngle(lane){return -Math.PI/2 + lane*TAU/8;}
  function normalizeAngleDeg(angle){return ((Number(angle||0)%360)+360)%360;}
  function snapAngleToDivisions(angleDeg, divisions){
    const step = 360 / divisions;
    return normalizeAngleDeg(Math.round(normalizeAngleDeg(angleDeg) / step) * step);
  }
  function chartAngleToRad(angle){return -Math.PI/2 + normalizeAngleDeg(angle)*Math.PI/180;}
  function legacyLaneToAngle(lane){return normalizeAngleDeg((Number(lane)||0)*45);}
  function noteAngleDeg(n){
    const raw = n.angle ?? n.directionIndex ?? n.lane ?? 0;
    return n.angle !== undefined ? normalizeAngleDeg(raw) : legacyLaneToAngle(raw);
  }
  function noteEndAngleDeg(n){
    const raw = n.endAngle ?? n.endDirectionIndex ?? n.endLane;
    return raw !== undefined ? (n.endAngle !== undefined ? normalizeAngleDeg(raw) : legacyLaneToAngle(raw)) : undefined;
  }
  function roundAngleForJson(angle){ return Number(normalizeAngleDeg(angle).toFixed(3)); }
  function directionSign(value){
    const v=String(value||"").toUpperCase();
    if(v==="CW")return 1;
    if(v==="CCW")return -1;
    return 0;
  }
  function signedSweepRad(type, extra, rawDelta){
    if(extra.signedSweepAngle !== undefined && Number.isFinite(Number(extra.signedSweepAngle))) return Number(extra.signedSweepAngle) * Math.PI / 180;
    if(extra.sweepAngle !== undefined && Number.isFinite(Number(extra.sweepAngle))) return Number(extra.sweepAngle) * Math.PI / 180;
    if(extra.turns !== undefined && Number.isFinite(Number(extra.turns)) && Number(extra.turns)!==0){
      const dir=directionSign(extra.direction) || (type.endsWith("CW")&&!type.endsWith("CCW")?1:(type.endsWith("CCW")?-1:Math.sign(rawDelta)||1));
      return dir * Math.abs(Number(extra.turns)) * TAU;
    }
    return null;
  }

  function make(type, beat, lane, extra={}){
    const angleDeg = extra.angleDeg !== undefined ? normalizeAngleDeg(extra.angleDeg) : legacyLaneToAngle(lane);
    const endAngleDeg = extra.endAngleDeg !== undefined ? normalizeAngleDeg(extra.endAngleDeg) : (extra.endLane!==undefined ? legacyLaneToAngle(extra.endLane) : undefined);
    const hitTime=beat*BEAT*CHART_STRETCH;
    const n={
      type,lane,angle:chartAngleToRad(angleDeg), angleDeg,
      beat,
      endBeat:beat,
      endLane:extra.endLane,
      endAngle:endAngleDeg!==undefined?chartAngleToRad(endAngleDeg):extra.endAngle,
      endAngleDeg,
      hitTime,spawnTime:hitTime-APPROACH,
      duration:extra.duration||0,done:false,missed:false,hold:0
    };
    if(type.startsWith("slide") || type.startsWith("trace")){
      n.duration=extra.duration||BEAT*(type.startsWith("trace")?1.5:1.7);
      n.endAngle=extra.endAngle!==undefined?extra.endAngle:chartAngleToRad(endAngleDeg ?? angleDeg);

      n.turns = extra.turns || 0;
      let raw = n.endAngle - n.angle;
      const explicitSweep = type.startsWith("trace") ? signedSweepRad(type, extra, raw) : null;

      if(explicitSweep !== null){
        n.slideAmount = explicitSweep;
        n.signedSweepAngle = Number((explicitSweep * 180 / Math.PI).toFixed(3));
      }else if(type==="slideCW" || type==="traceCW"){
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
    if(totalNotes <= 0 || maxHitValue <= 0){
      return {ok:false, error:"EMPTY_CHART", accuracy:0, comboRatio:0, score:0, totalNotes:0};
    }
    const accuracy = clamp(actualHitValue / maxHitValue, 0, 1);
    const comboRatio = clamp(maxCombo / totalNotes, 0, 1);
    const totalScore = clamp(Math.round(accuracy * 900000 + comboRatio * 100000), 0, 1000000);
    return {ok:true, accuracy, comboRatio, score:totalScore, totalNotes};
  }

  const RECORD_STORAGE_KEY = "circleMix.bestRecords.v1";
  function songRecordId(songData=selectedSong){ const source=songData?.source==="local" ? "local" : "builtin"; return `${source}:${songData?.id || "unknown"}`; }
  function recordKey(diff=mapMode, songData=selectedSong){ return `${songRecordId(songData)}:${diff}`; }
  function readRecords(){ try{ return JSON.parse(localStorage.getItem(RECORD_STORAGE_KEY) || "{}"); }catch(e){ return {}; } }
  function writeRecords(records){ try{ localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(records)); }catch(e){ console.warn("record save failed", e); } }
  function isBetterRecord(next, prev){
    if(!prev) return true;
    if(next.bestScore !== prev.bestScore) return next.bestScore > prev.bestScore;
    if(next.bestAccuracy !== prev.bestAccuracy) return next.bestAccuracy > prev.bestAccuracy;
    return next.missCount < prev.missCount;
  }
  function isBetterPowerRecord(next, prev){
    if(!Number.isFinite(next.bestPower)) return false;
    if(!prev || !Number.isFinite(prev.bestPower)) return true;
    if(next.bestPower !== prev.bestPower) return next.bestPower > prev.bestPower;
    if(next.bestPowerAccuracy !== prev.bestPowerAccuracy) return next.bestPowerAccuracy > prev.bestPowerAccuracy;
    if(next.bestPowerMissCount !== prev.bestPowerMissCount) return next.bestPowerMissCount < prev.bestPowerMissCount;
    return next.bestPowerScore > prev.bestPowerScore;
  }
  function calculatePower({stars, accuracyRatio, comboRatio, missCount, totalNotes}){
    const starValue=Number(stars);
    const noteCount=Number(totalNotes);
    if(!Number.isFinite(starValue) || starValue <= 0 || !Number.isFinite(noteCount) || noteCount <= 0) return null;
    const accuracy=clamp(Number.isFinite(accuracyRatio) ? accuracyRatio : 0, 0, 1);
    const combo=clamp(Number.isFinite(comboRatio) ? comboRatio : 0, 0, 1);
    const misses=Math.max(0, Number.isFinite(missCount) ? Math.trunc(missCount) : 0);
    const missPenalty=Math.pow(0.97, misses);
    const power=Math.pow(starValue, 2.15) * 18 * Math.pow(accuracy, 2.4) * (0.75 + 0.25 * combo) * missPenalty;
    if(!Number.isFinite(power)) return null;
    return Math.max(0, Math.round(power));
  }
  function migrateBestRecord(record){
    if(!record) return null;
    return {
      ...record,
      bestPower:Number.isFinite(record.bestPower) ? record.bestPower : undefined,
      bestPowerAccuracy:Number.isFinite(record.bestPowerAccuracy) ? record.bestPowerAccuracy : undefined,
      bestPowerScore:Number.isFinite(record.bestPowerScore) ? record.bestPowerScore : undefined,
      bestPowerMissCount:Number.isFinite(record.bestPowerMissCount) ? record.bestPowerMissCount : undefined,
      bestPowerAchievedAt:record.bestPowerAchievedAt || undefined
    };
  }
  function saveBestRecord(result){
    if(tutorialMode) return {saved:false, newRecord:false, newPowerRecord:false, previous:null, tutorial:true};
    if(result.autoPlay) return {saved:false, newRecord:false, newPowerRecord:false, previous:null};
    const records=readRecords();
    const key=recordKey(result.difficulty);
    const previous=migrateBestRecord(records[key] || null);
    const nowIso=new Date().toISOString();
    const scoreEntry={bestScore:result.finalScore, bestAccuracy:result.accuracyRatio, bestRank:result.rank, maxCombo:result.maxCombo, missCount:result.missCount, playedAt:nowIso};
    const powerEntry={bestPower:result.power, bestPowerAccuracy:result.accuracyRatio, bestPowerScore:result.finalScore, bestPowerMissCount:result.missCount, bestPowerAchievedAt:nowIso};
    const newRecord=isBetterRecord(scoreEntry, previous);
    const newPowerRecord=result.power !== null && isBetterPowerRecord(powerEntry, previous);
    if(newRecord || newPowerRecord){
      records[key]={...(previous || {}), ...(newRecord ? scoreEntry : {}), ...(newPowerRecord ? powerEntry : {})};
      writeRecords(records);
      return {saved:true, newRecord, newPowerRecord, previous};
    }
    return {saved:false, newRecord:false, newPowerRecord:false, previous};
  }
  function getBestRecord(diff=selectedMenuMode, songData=selectedSong){ return migrateBestRecord(readRecords()[recordKey(diff, songData)] || null); }

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

  function getBuiltinChartSource(songId, difficultyId){
    if(songId==="anima" && difficultyId==="normal") return {kind:"generator", notes:generateNormalChart(), gap:1.75, trimBeat:CHART_END_BEAT};
    if(songId==="anima" && difficultyId==="tech") return {kind:"generator", notes:generateTechChart(), gap:1.10, trimBeat:CHART_END_BEAT};
    if(songId==="ghost-rule"){
      const bundle=window.CircleMixGhostRuleBundle;
      const chartData=bundle?.charts?.[difficultyId];
      if(chartData?.notes?.length) return {kind:"bundle", notes:chartData.notes, chart:chartData};
    }
    if(songId==="routing"){
      const bundle=window.CircleMixRoutingBundle;
      const chartData=bundle?.charts?.[difficultyId];
      if(chartData?.notes?.length) return {kind:"bundle", notes:chartData.notes, chart:chartData};
    }
    throw new Error(`지원하지 않는 내장 채보입니다: ${songId}/${difficultyId}`);
  }

  function chartForDifficulty(mode){
    const source=getBuiltinChartSource(selectedSong?.id || "anima", mode);
    if(source.kind==="generator"){
      const raw=fillPlayableGaps(source.notes, source.gap).filter(n => (n.beat ?? 0) <= source.trimBeat);
      return raw.map(n => {
        const note={...n};
        if(note.endBeat && note.endBeat > source.trimBeat){
          const maxDurBeat = Math.max(0.5, source.trimBeat - note.beat);
          note.duration = maxDurBeat * BEAT * CHART_STRETCH;
          note.endBeat = source.trimBeat;
        }
        note.hitTime = note.beat * BEAT * CHART_STRETCH;
        note.spawnTime = note.hitTime - APPROACH;
        return note;
      }).sort((a,b)=>a.hitTime-b.hitTime);
    }
    return source.notes.map(localNoteToGame).sort((a,b)=>a.hitTime-b.hitTime);
  }

  function getDifficulty(mode=mapMode){
    if(selectedSong?.source==="local"){ const c=selectedSong.charts?.[mode]; return c ? {stars:chartTools.calculateStars(c), raw:0} : null; }
    const meta=selectedSong?.difficulties?.[mode];
    if(meta && Number.isFinite(Number(meta.stars))) return {stars:Number(meta.stars), raw:null, bundleStars:true};
    if(!songs.hasDifficulty(selectedSong, mode)) return null;
    if(!difficultyCache[mode]) difficultyCache[mode]=calculateChartDifficulty(chartForDifficulty(mode));
    return difficultyCache[mode];
  }

  function formatStarValue(stars){
    const value=Number(stars);
    return Number.isFinite(value) ? value.toFixed(1)+"★" : "—";
  }

  function getDifficultySafe(mode=mapMode){
    try{
      return getDifficulty(mode);
    }catch(error){
      console.error("[Difficulty Calculation Failed]", error);
      return null;
    }
  }

  function formatDifficulty(mode=mapMode){
    const d=getDifficultySafe(mode);
    return d ? formatStarValue(d.stars) : "—";
  }

  function difficultyViewForSong(songData, difficultyId){
    if(!songData || !difficultyId) return null;
    const meta=songData.difficulties?.[difficultyId];
    const label=getActiveDifficultyLabel(songData,difficultyId);
    if(songData.source==="builtin") return {id:difficultyId, label, stars:getDifficultySafe(difficultyId)?.stars};
    const chart=songData.charts?.[difficultyId];
    const metaStars=Number(meta?.stars);
    let stars=metaStars;
    if(!Number.isFinite(stars) && chart){
      try{
        stars=chartTools.calculateStars(chart);
      }catch(error){
        console.error("[Difficulty Calculation Failed]", error);
        stars=undefined;
      }
    }
    return {id:difficultyId, label, stars};
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

  // ANiMA osu! reference rechart
  // NORMAL follows Kalindraz [Hard]: slider-heavy phrasing, readable 1/1 and 1/2 rhythm,
  // and restrained CIRCLE MIX gestures. TECH follows [Oberum Primus]: its timing,
  // angular flow, long slider motion and dense stream accents, downsampled so the dial
  // remains physically playable instead of copying all 804 osu! objects one-for-one.
  // Source timing is stored as exact song-time-derived beats for the current 184.6 BPM runtime;
  // songs.js BPM/offset are intentionally left unchanged.
  function isAnimaSnapNoteType(type){ return type==="cut" || type==="fx" || type==="swingCW" || type==="swingCCW" || type==="scratchCW" || type==="scratchCCW"; }
  function isZeroSweepAnimaSlide(type, angleDeg, endAngleDeg, signedSweepAngle, durationBeat){
    if(type!=="slideCW" && type!=="slideCCW") return false;
    if(endAngleDeg===undefined || endAngleDeg===null) return false;
    if(signedSweepAngle!==undefined && signedSweepAngle!==null) return false;
    const diff=normalizeAngleDeg(Number(endAngleDeg)-Number(angleDeg));
    const shortest=Math.min(diff, 360-diff);
    return Number.isFinite(shortest) && shortest < 1 && Number(durationBeat) <= 1.5;
  }

  function buildAnimaOsuReferenceChart(rows, divisions){
    return rows.map(([type,beat,angleDeg,endAngleDeg,durationBeat,signedSweepAngle])=>{
      const zeroSweepSlide=isZeroSweepAnimaSlide(type, angleDeg, endAngleDeg, signedSweepAngle, durationBeat);
      const gameType=zeroSweepSlide ? "fx" : type;
      const snappedStart = isAnimaSnapNoteType(gameType) ? snapAngleToDivisions(angleDeg, divisions) : angleDeg;
      const extra={angleDeg:snappedStart};
      if(!zeroSweepSlide && endAngleDeg!==undefined && endAngleDeg!==null) extra.endAngleDeg=endAngleDeg;
      if(durationBeat!==undefined && durationBeat!==null) extra.duration=BEAT*durationBeat;
      if(!zeroSweepSlide && signedSweepAngle!==undefined && signedSweepAngle!==null) extra.signedSweepAngle=signedSweepAngle;
      return make(gameType,beat,0,extra);
    }).sort((a,b)=>a.hitTime-b.hitTime);
  }

  const ANIMA_NORMAL_OSU_REFERENCE = [
    ["cut", 4.067, 341.57],
    ["cut", 8.089, 222.58],
    ["cut", 12.113, 101.53],
    ["fx", 17.143, 101.53, null, 2.012],
    ["cut", 20.161, 0],
    ["cut", 24.186, 45],
    ["cut", 26.198, 94.76],
    ["slideCCW", 28.21, 0, 287.53, 2.012],
    ["slideCCW", 32.234, 262.87, 241.7, 1.006],
    ["slideCCW", 34.246, 221.99, 201.8, 1.006],
    ["slideCCW", 36.259, 176.19, 117.65, 1.006],
    ["cut", 37.766, 102.09],
    ["slideCCW", 38.271, 102.09, 66.8, 1.006],
    ["cut", 39.778, 46.52],
    ["slideCCW", 40.283, 46.52, 32.25, 0.503],
    ["cut", 41.289, 48.81],
    ["slideCW", 42.295, 278.75, 329.04, 1.006],
    ["cut", 43.803, 0],
    ["slideCW", 44.307, 33.78, 81.25, 1.006],
    ["cut", 45.815, 141.34],
    ["slideCW", 46.316, 141.34, 225, 1.006],
    ["cut", 47.827, 263.66],
    ["slideCW", 48.328, 263.66, 296.57, 1.006],
    ["cut", 49.839, 315],
    ["slideCCW", 50.34, 36.87, 6.71, 1.006],
    ["cut", 51.851, 332.65],
    ["slideCCW", 52.353, 321.34, 293.09, 1.006],
    ["cut", 53.863, 273.81],
    ["cut", 54.365, 273.81],
    ["cut", 55.371, 253.61],
    ["slideCCW", 56.377, 197.53, 145.62, 1.006],
    ["cut", 57.887, 119.74],
    ["cut", 58.389, 119.74],
    ["cut", 59.395, 68.96],
    ["slideCW", 60.401, 47.73, 73.5, 1.006],
    ["cut", 61.912, 94.97],
    ["slideCCW", 62.413, 68.96, 309.81, 1.006],
    ["cut", 63.924, 262.41],
    ["slideCW", 64.425, 294.09, 318.18, 1.006],
    ["cut", 65.933, 334.98],
    ["slideCW", 66.438, 15.95, 39.47, 1.509],
    ["cut", 68.45, 53.13],
    ["cut", 69.456, 53.13],
    ["cut", 70.462, 53.13],
    ["cut", 71.468, 53.13],
    ["slideCW", 72.474, 53.13, 97.43, 1.006],
    ["cut", 73.982, 117.65],
    ["cut", 74.486, 145.62],
    ["cut", 75.492, 205.94],
    ["cut", 75.994, 205.94],
    ["slideCCW", 76.498, 208.07, 128.16, 0.503],
    ["cut", 77.504, 61.19],
    ["slideCCW", 78.51, 355.91, 313.53, 1.006],
    ["cut", 80.018, 284.5],
    ["cut", 80.27, 284.5],
    ["slideCCW", 80.523, 284.5, 245.3, 1.006],
    ["cut", 82.03, 220.36],
    ["cut", 82.535, 196.39],
    ["slideCCW", 83.541, 139.9, 90, 1.006],
    ["cut", 85.048, 45],
    ["cut", 85.553, 236.31],
    ["cut", 86.556, 122.12],
    ["cut", 87.562, 67.75],
    ["slideCW", 88.568, 94.87, 244.44, 1.006],
    ["cut", 90.079, 283.79],
    ["cut", 91.085, 346.55],
    ["slideCCW", 91.586, 346.55, 217.69, 1.006],
    ["cut", 93.097, 180],
    ["cut", 93.598, 124.85],
    ["cut", 94.604, 58.57],
    ["cut", 95.61, 88.21],
    ["cut", 96.617, 78.57],
    ["cut", 98.127, 123.69],
    ["cut", 99.635, 130.1],
    ["cut", 101.145, 104.53],
    ["cut", 101.647, 104.53],
    ["cut", 102.653, 59.74],
    ["cut", 103.659, 40.6],
    ["slideCCW", 104.665, 321.34, 278.97, 1.006],
    ["cut", 106.176, 258.69],
    ["slideCCW", 106.677, 243.59, 208.81, 1.006],
    ["cut", 108.185, 180],
    ["slideCCW", 108.689, 151.19, 135, 0.503],
    ["cut", 109.695, 107.24],
    ["cut", 110.702, 141.34],
    ["cut", 111.708, 76.76],
    ["slideCCW", 112.714, 20.85, 329.93, 1.006],
    ["cut", 114.221, 301.43],
    ["cut", 114.726, 301.43],
    ["cut", 115.732, 270],
    ["slideCCW", 116.738, 169.38, 132.27, 1.006],
    ["cut", 118.246, 90],
    ["cut", 118.75, 76.76],
    ["cut", 119.756, 61.26],
    ["slideCCW", 120.762, 35.54, 23.5, 0.503],
    ["cut", 121.768, 45],
    ["cut", 122.774, 122.01],
    ["cut", 123.78, 284.53],
    ["cut", 124.03, 284.53],
    ["cut", 124.282, 284.53],
    ["slideCCW", 124.79, 250.82, 231.71, 0.503],
    ["cut", 125.793, 229.76],
    ["cut", 126.799, 213.69],
    ["cut", 127.802, 97.13],
    ["slideCCW", 128.808, 127.41, 68.2, 1.006],
    ["cut", 130.318, 37.87],
    ["slideCCW", 130.82, 68.63, 15.95, 1.006],
    ["cut", 132.331, 323.97],
    ["cut", 132.583, 323.97],
    ["slideCCW", 132.832, 323.97, 296.57, 0.503],
    ["cut", 133.838, 274.76],
    ["cut", 134.844, 228.01],
    ["cut", 135.85, 187.13],
    ["slideCCW", 136.856, 150.64, 95.71, 0.754],
    ["cut", 137.862, 60.26],
    ["cut", 138.868, 9.46],
    ["cut", 139.874, 32.28],
    ["slideCCW", 140.881, 357.4, 332.35, 0.503],
    ["cut", 141.887, 289.09],
    ["cut", 142.893, 263.88],
    ["cut", 143.899, 238.67],
    ["slideCCW", 144.905, 180, 145.49, 0.503],
    ["cut", 145.911, 123.02],
    ["cut", 146.415, 123.02],
    ["cut", 146.917, 100.12],
    ["cut", 147.923, 58.67],
    ["cut", 148.425, 26.57],
    ["slideCCW", 148.929, 350.54, 317.49, 0.503],
    ["cut", 149.935, 283.74],
    ["cut", 150.437, 267.27],
    ["slideCW", 150.941, 56.31, 81.25, 0.503],
    ["cut", 151.947, 72.35],
    ["cut", 152.449, 120.96],
    ["slideCW", 152.953, 149.93, 192.53, 0.754],
    ["cut", 153.959, 229.76],
    ["cut", 154.966, 188.13],
    ["cut", 155.972, 270],
    ["slideCCW", 156.978, 14.04, 12.09, 0.503],
    ["cut", 157.984, 30.96],
    ["cut", 158.99, 67.52],
    ["cut", 159.996, 102.53],
    ["slideCCW", 161.002, 315, 272.73, 1.006],
    ["cut", 162.51, 252.76],
    ["slideCCW", 163.014, 226.47, 185.89, 1.006],
    ["cut", 164.522, 145.3],
    ["slideCCW", 165.026, 104.04, 75.96, 0.503],
    ["cut", 166.032, 43.21],
    ["cut", 166.282, 43.21],
    ["cut", 166.534, 43.21],
    ["cut", 167.038, 49.57],
    ["slideCCW", 168.044, 63.43, 347.47, 0.503],
    ["slideCCW", 169.047, 290.1, 253.78, 1.006],
    ["cut", 170.558, 227.73],
    ["slideCW", 171.06, 202.62, 237.99, 1.006],
    ["cut", 172.57, 310.6],
    ["slideCW", 173.072, 347.47, 19.44, 0.503],
    ["cut", 174.078, 70.56],
    ["cut", 175.084, 122.01],
    ["cut", 176.09, 120.38],
    ["slideCW", 177.096, 154.65, 215.84, 1.006],
    ["cut", 178.607, 236.31],
    ["slideCCW", 179.108, 259.51, 240.95, 1.006],
    ["cut", 180.619, 180],
    ["slideCCW", 181.12, 111.8, 56.31, 0.503],
    ["cut", 182.126, 354.81],
    ["cut", 183.132, 59.15],
    ["cut", 184.138, 63.43],
    ["slideCCW", 185.145, 32.47, 344.05, 1.006],
    ["cut", 186.655, 317.64],
    ["slideCCW", 187.157, 308.4, 286.22, 1.006],
    ["cut", 188.664, 265.76],
    ["slideCCW", 189.169, 249.44, 241.39, 0.503],
    ["cut", 190.175, 250.91],
    ["cut", 191.181, 172.41],
    ["cut", 192.187, 109.65],
    ["slideCCW", 193.193, 128.04, 107.32, 0.503],
    ["cut", 194.199, 80.73],
    ["cut", 194.701, 48.72],
    ["slideCCW", 195.205, 51.34, 15.52, 0.503],
    ["cut", 196.211, 331.82],
    ["cut", 196.713, 214.99],
    ["slideCCW", 197.217, 148.57, 77.47, 0.503],
    ["cut", 198.223, 318.01],
    ["cut", 198.725, 262.06],
    ["cut", 199.23, 277.99],
    ["cut", 200.236, 322.22],
    ["slideCW", 201.242, 322.22, 7.5, 1.006],
    ["cut", 202.749, 38.45],
    ["cut", 203.254, 66.04],
    ["cut", 204.26, 114.3],
    ["slideCW", 205.266, 126.3, 163.01, 1.006],
    ["cut", 206.774, 189.04],
    ["cut", 207.278, 216.87],
    ["cut", 208.284, 270],
    ["slideCW", 209.287, 258.11, 332.02, 1.006],
    ["cut", 210.798, 1.19],
    ["slideCW", 211.299, 29.54, 101.17, 1.006],
    ["cut", 212.81, 114.78],
    ["cut", 213.311, 92.01],
    ["cut", 213.816, 72.03],
    ["cut", 214.068, 72.03],
    ["cut", 214.318, 72.03],
    ["cut", 215.324, 15.9],
    ["slideCW", 216.33, 128.66, 254.05, 1.006],
    ["slideCW", 233.433, 235.71, 280.3, 1.006],
    ["cut", 234.94, 307.87],
    ["slideCW", 235.445, 315, 39.81, 1.006],
    ["cut", 236.953, 48.69],
    ["slideCW", 237.457, 64.29, 101.31, 1.006],
    ["cut", 238.965, 129.81],
    ["slideCW", 239.469, 135, 225, 1.006],
    ["cut", 240.977, 230.19],
    ["slideCW", 241.481, 261.47, 295.71, 1.006],
    ["cut", 242.989, 311.19],
    ["slideCW", 243.494, 345.26, 14.74, 0.503],
    ["cut", 244.5, 63.43],
    ["slideCCW", 245.506, 319.4, 231.34, 0.503],
    ["cut", 246.512, 98.13],
    ["cut", 247.518, 150.95],
    ["cut", 248.524, 125.75],
    ["slideCCW", 249.53, 85.76, 48.81, 1.006],
    ["cut", 251.038, 23.75],
    ["cut", 251.539, 319.4],
    ["slideCCW", 253.551, 265.14, 249.74, 0.503],
    ["cut", 254.557, 241.1],
    ["cut", 255.563, 215.82],
    ["cut", 256.569, 154.89],
    ["cut", 257.074, 123.07],
    ["cut", 257.326, 123.07],
    ["slideCCW", 257.575, 123.07, 29.54, 1.006],
    ["cut", 259.086, 38.5],
    ["cut", 259.588, 62.45],
    ["slideCW", 261.6, 94.89, 134.06, 0.503],
    ["cut", 262.606, 123.07],
    ["cut", 263.612, 282.53],
    ["cut", 264.618, 322.9],
    ["slideCCW", 265.624, 12.8, 274.97, 1.006],
    ["cut", 267.135, 270],
    ["cut", 267.384, 270],
    ["cut", 267.636, 270],
    ["cut", 268.642, 230.53],
    ["slideCCW", 269.648, 191.73, 136.12, 1.006],
    ["cut", 271.156, 118.07],
    ["cut", 271.405, 118.07],
    ["cut", 271.657, 118.07],
    ["cut", 272.667, 76.46],
    ["slideCCW", 273.673, 21.04, 338.96, 0.503],
    ["cut", 274.679, 285.42],
    ["cut", 275.18, 261.8],
    ["cut", 275.429, 261.8],
    ["slideCCW", 275.682, 261.8, 186.34, 0.503],
    ["cut", 276.691, 238.17],
    ["slideCCW", 277.697, 225, 210.83, 0.503],
    ["cut", 278.703, 201.8],
    ["cut", 279.709, 74.05],
    ["cut", 280.715, 109.18],
    ["cut", 281.721, 145.71],
    ["cut", 282.223, 178.72],
    ["cut", 282.727, 178.72],
    ["swingCW", 283.733, 348.69],
    ["cut", 284.235, 327.09],
    ["cut", 284.739, 327.09],
    ["cut", 285.745, 287.82],
    ["cut", 286.247, 296.28],
    ["cut", 286.751, 296.28],
    ["slideCW", 287.758, 48.01, 57.72, 0.503],
    ["cut", 288.764, 90],
    ["cut", 289.77, 120.26],
    ["cut", 290.271, 180],
    ["cut", 290.776, 180],
    ["cut", 291.779, 231.71],
    ["cut", 292.283, 213.69],
    ["cut", 292.785, 213.69],
    ["swingCW", 293.791, 4.4],
    ["cut", 294.295, 45],
    ["cut", 294.797, 45],
    ["slideCW", 295.803, 93.58, 128.16, 0.503],
    ["cut", 296.809, 108.8],
    ["cut", 297.815, 70.91],
    ["traceCW", 298.067, 99.78, 99.78, 5.568, 360],
    ["scratchCW", 304.043, 99.78],
    ["slideCCW", 305.864, 128.66, 97.13, 1.006],
    ["cut", 307.374, 80.54],
    ["cut", 307.876, 57.77],
    ["cut", 308.882, 32.01],
    ["slideCW", 309.888, 304.33, 336.37, 1.006],
    ["cut", 311.399, 0],
    ["cut", 311.9, 32.01],
    ["cut", 312.906, 201.04],
    ["cut", 313.159, 201.04],
    ["cut", 313.408, 201.04],
    ["cut", 313.912, 241.19],
    ["cut", 314.918, 304.33],
    ["cut", 315.924, 292.31],
    ["slideCCW", 317.937, 300.58, 210.29, 1.006],
    ["cut", 319.444, 160.56],
    ["slideCCW", 319.949, 146.31, 102.92, 1.006],
    ["cut", 321.456, 15.95],
    ["slideCW", 321.961, 21.37, 53.13, 1.006],
    ["cut", 323.468, 71.03],
    ["slideCW", 323.973, 88.98, 98.64, 1.006],
    ["cut", 325.481, 169.22],
    ["slideCW", 325.985, 198, 231.04, 1.006],
    ["cut", 327.493, 251.27],
    ["cut", 327.997, 251.27],
    ["cut", 329.003, 289.44],
    ["slideCW", 330.009, 304.7, 337.62, 1.006],
    ["cut", 331.517, 0],
    ["slideCW", 332.022, 25.02, 55.3, 1.006],
    ["cut", 333.529, 71.57],
    ["slideCCW", 334.031, 25.02, 351.29, 0.503],
    ["cut", 335.037, 36.42],
    ["cut", 336.043, 96.5],
    ["cut", 337.049, 105.19],
    ["cut", 338.055, 95.91],
    ["cut", 339.061, 139.9],
    ["slideCCW", 341.073, 229.9, 139.9, 1.006],
    ["scratchCW", 342.25, 229.9],
  ];

  const ANIMA_TECH_OSU_REFERENCE = [
    ["traceCCW", 4.067, 300.58, 120.58, 8.048, -180],
    ["cut", 17.143, 153.88],
    ["cut", 18.149, 213.69],
    ["cut", 19.155, 316.81],
    ["traceCW", 20.161, 239.93, 239.93, 4.024, 360],
    ["cut", 26.198, 285.64],
    ["cut", 28.21, 309.82],
    ["slideCW", 30.222, 334, 18, 1.509],
    ["cut", 32.234, 50.3],
    ["cut", 32.487, 51.6],
    ["cut", 32.988, 54.28],
    ["cut", 33.24, 56.78],
    ["cut", 33.742, 64.27],
    ["cut", 33.994, 68.66],
    ["cut", 34.246, 75.11],
    ["cut", 34.499, 81.92],
    ["cut", 35, 97.78],
    ["cut", 35.252, 108.56],
    ["cut", 35.754, 129.31],
    ["cut", 36.006, 137.49],
    ["slideCW", 36.259, 147.72, 178.36, 0.503],
    ["slideCW", 37.265, 280.3, 283.57, 0.503],
    ["cut", 38.271, 36.38],
    ["cut", 38.772, 229.09],
    ["cut", 39.277, 328.17],
    ["cut", 39.526, 328.17],
    ["cut", 39.778, 328.17],
    ["slideCW", 40.283, 112.04, 112.04, 0.503],
    ["cut", 41.289, 256.47],
    ["cut", 41.538, 256.47],
    ["cut", 41.79, 256.47],
    ["slideCW", 42.295, 39.97, 39.97, 0.503],
    ["cut", 43.301, 184.21],
    ["cut", 43.55, 184.21],
    ["cut", 43.803, 184.21],
    ["slideCW", 44.307, 328.39, 328.39, 0.503],
    ["cut", 45.31, 112.04],
    ["cut", 45.559, 112.04],
    ["cut", 45.812, 112.04],
    ["slideCW", 46.316, 256.47, 256.47, 0.503],
    ["cut", 47.322, 39.97],
    ["cut", 47.824, 39.97],
    ["swingCW", 48.328, 219.47],
    ["cut", 48.833, 146.31],
    ["cut", 49.334, 294.78],
    ["cut", 49.839, 219.47],
    ["cut", 50.34, 109.54],
    ["cut", 50.845, 341.57],
    ["cut", 51.346, 219.47],
    ["cut", 51.851, 127.18],
    ["cut", 52.353, 61.61],
    ["cut", 52.605, 51.12],
    ["cut", 53.109, 29.05],
    ["cut", 53.863, 6.34],
    ["cut", 54.115, 70.67],
    ["cut", 54.617, 150.26],
    ["cut", 55.122, 177.95],
    ["cut", 55.875, 216.25],
    ["cut", 56.377, 295.56],
    ["cut", 56.629, 304.48],
    ["cut", 57.131, 317.73],
    ["cut", 57.887, 18.85],
    ["cut", 58.137, 41.7],
    ["cut", 58.641, 36.47],
    ["cut", 59.143, 15.9],
    ["cut", 59.395, 4.66],
    ["cut", 59.9, 332.02],
    ["cut", 60.401, 321.71],
    ["cut", 60.653, 321.34],
    ["cut", 61.155, 57.26],
    ["cut", 61.912, 137.05],
    ["cut", 62.413, 219.81],
    ["cut", 62.666, 231.34],
    ["cut", 63.167, 251.18],
    ["swingCCW", 64.425, 98.95],
    ["cut", 64.678, 94.09],
    ["cut", 65.431, 313.03],
    ["cut", 66.939, 202.62],
    ["cut", 67.444, 65.46],
    ["cut", 67.945, 218.88],
    ["swingCCW", 68.45, 63.43],
    ["cut", 69.456, 92.34],
    ["traceCCW", 70.462, 124.56, 124.56, 1.76, -720],
    ["cut", 72.474, 125.68],
    ["cut", 72.975, 131.01],
    ["cut", 73.982, 237.45],
    ["cut", 74.486, 254.62],
    ["cut", 74.988, 279.46],
    ["cut", 75.492, 341.97],
    ["cut", 75.744, 352.69],
    ["cut", 75.994, 7.7],
    ["cut", 77, 33.27],
    ["cut", 78.51, 11.31],
    ["cut", 79.516, 253.22],
    ["cut", 80.523, 158.46],
    ["cut", 81.024, 129.29],
    ["cut", 82.03, 293.03],
    ["cut", 82.535, 266.42],
    ["cut", 83.036, 239.66],
    ["cut", 84.045, 78.37],
    ["cut", 85.048, 21.8],
    ["cut", 86.054, 162.42],
    ["cut", 87.06, 317.82],
    ["cut", 88.067, 242.1],
    ["cut", 88.568, 242.1],
    ["cut", 89.073, 219.04],
    ["cut", 90.079, 10.44],
    ["cut", 90.583, 30.26],
    ["cut", 91.586, 116.57],
    ["cut", 91.838, 127.09],
    ["cut", 92.091, 135],
    ["cut", 92.592, 108.43],
    ["cut", 94.103, 0.42],
    ["slideCCW", 94.604, 106.7, 96.34, 0.503],
    ["slideCCW", 95.61, 286.7, 276.34, 0.503],
    ["cut", 96.617, 254.65],
    ["cut", 97.121, 191.81],
    ["cut", 97.623, 321.6],
    ["cut", 98.127, 239.17],
    ["cut", 98.632, 174.66],
    ["cut", 99.133, 302.91],
    ["cut", 99.635, 223.33],
    ["cut", 100.139, 154.92],
    ["cut", 100.641, 286.7],
    ["fx", 101.145, 195.26, null, 0.377],
    ["slideCCW", 101.647, 178.45, 147.34, 0.503],
    ["cut", 102.653, 118.24],
    ["cut", 103.158, 110.56],
    ["cut", 103.911, 98.67],
    ["cut", 104.164, 94.76],
    ["cut", 104.665, 87.23],
    ["cut", 105.17, 93.81],
    ["cut", 105.923, 66.8],
    ["swingCCW", 106.677, 271.27],
    ["cut", 107.179, 280.56],
    ["cut", 107.936, 304.19],
    ["cut", 108.689, 233.86],
    ["cut", 109.191, 159.44],
    ["cut", 109.695, 180],
    ["cut", 109.948, 190.44],
    ["cut", 110.449, 214.05],
    ["cut", 110.702, 225],
    ["cut", 110.954, 240.95],
    ["cut", 111.708, 293.2],
    ["cut", 111.96, 17.86],
    ["cut", 112.714, 59.32],
    ["cut", 112.966, 48.94],
    ["swingCW", 114.221, 187.13],
    ["cut", 114.474, 187.13],
    ["cut", 115.227, 207.6],
    ["cut", 115.732, 105.52],
    ["cut", 116.233, 207.6],
    ["cut", 117.239, 126.87],
    ["cut", 117.744, 158.46],
    ["cut", 117.993, 175.24],
    ["cut", 118.498, 210.96],
    ["scratchCCW", 118.75, 243.43],
    ["cut", 120.258, 301.9],
    ["cut", 120.507, 317.47],
    ["cut", 120.762, 332.76],
    ["swingCCW", 121.264, 181.7],
    ["cut", 121.765, 212.7],
    ["cut", 122.27, 61.31],
    ["cut", 122.519, 77.01],
    ["slideCW", 122.774, 92.05, 92.05, 0.503],
    ["cut", 123.78, 273.43],
    ["cut", 124.282, 1.36],
    ["cut", 124.531, 16.96],
    ["swingCW", 125.288, 121.32],
    ["cut", 125.793, 151.84],
    ["cut", 126.294, 241.61],
    ["cut", 126.543, 257.09],
    ["cut", 127.802, 233.31],
    ["cut", 128.054, 237.18],
    ["cut", 128.559, 244.53],
    ["slideCW", 128.808, 248.16, 270, 0.503],
    ["cut", 129.814, 309.52],
    ["cut", 130.066, 320.19],
    ["cut", 130.571, 346.61],
    ["slideCW", 130.82, 358.73, 29.05, 0.503],
    ["cut", 131.826, 92.77],
    ["cut", 132.078, 102.48],
    ["cut", 132.583, 122.61],
    ["cut", 133.838, 158.2],
    ["cut", 134.09, 223.93],
    ["cut", 134.595, 277.85],
    ["cut", 135.85, 328.08],
    ["cut", 136.355, 123.59],
    ["slideCCW", 136.856, 65.06, 25.35, 0.754],
    ["slideCW", 137.862, 353.4, 353.4, 0.671],
    ["slideCW", 138.868, 70.77, 70.77, 0.671],
    ["slideCW", 139.874, 278.43, 278.43, 0.671],
    ["slideCCW", 140.881, 325.98, 282.38, 0.754],
    ["slideCW", 141.887, 226.08, 291.04, 0.754],
    ["slideCW", 142.893, 34.02, 77.62, 0.754],
    ["slideCCW", 143.899, 133.92, 68.96, 0.754],
    ["swingCCW", 144.905, 0],
    ["cut", 145.157, 337.38],
    ["cut", 145.911, 261.03],
    ["cut", 146.163, 209.05],
    ["cut", 146.665, 181.59],
    ["cut", 147.169, 212.47],
    ["cut", 147.923, 248.2],
    ["cut", 148.175, 222.27],
    ["cut", 148.425, 177.4],
    ["swingCCW", 148.929, 73.18],
    ["cut", 149.181, 72.76],
    ["cut", 149.935, 30.34],
    ["cut", 150.187, 44.27],
    ["cut", 150.689, 73.18],
    ["cut", 151.695, 119.29],
    ["slideCW", 152.953, 271.02, 272.73, 0.754],
    ["slideCCW", 153.959, 335.27, 271.02, 0.671],
    ["slideCW", 154.966, 39.52, 39.52, 0.671],
    ["slideCW", 155.972, 340.97, 340.97, 0.671],
    ["slideCW", 156.978, 50.19, 103.63, 0.754],
    ["slideCW", 157.984, 204.9, 204.9, 0.754],
    ["slideCCW", 158.99, 309.81, 256.37, 0.754],
    ["slideCW", 159.996, 156.8, 156.8, 0.754],
    ["swingCW", 161.002, 328.11],
    ["cut", 161.756, 287.74],
    ["cut", 162.008, 276.95],
    ["cut", 163.014, 318.18],
    ["cut", 163.768, 255.62],
    ["cut", 164.02, 235.01],
    ["swingCW", 165.026, 191.31],
    ["cut", 165.78, 135.83],
    ["cut", 166.032, 133.73],
    ["cut", 166.534, 112.83],
    ["cut", 167.038, 77.35],
    ["cut", 167.54, 50.31],
    ["cut", 168.044, 50.19],
    ["cut", 168.546, 13.63],
    ["slideCCW", 169.047, 294.06, 266.05, 0.503],
    ["cut", 170.054, 249.68],
    ["cut", 171.06, 180],
    ["cut", 171.816, 140.79],
    ["cut", 172.069, 127.07],
    ["cut", 173.072, 38.24],
    ["swingCCW", 173.576, 267.8],
    ["cut", 173.829, 268.85],
    ["cut", 174.081, 270.49],
    ["cut", 174.582, 113.36],
    ["cut", 175.087, 127.02],
    ["cut", 175.588, 232.77],
    ["cut", 175.841, 228.72],
    ["cut", 176.093, 223.6],
    ["cut", 176.595, 159.08],
    ["slideCCW", 177.096, 159.08, 119.74, 0.503],
    ["swingCCW", 178.102, 345.96],
    ["cut", 179.108, 159.08],
    ["cut", 179.862, 94.9],
    ["cut", 180.114, 69.68],
    ["cut", 181.625, 12.6],
    ["cut", 181.874, 16.74],
    ["cut", 182.631, 248.96],
    ["cut", 183.637, 127],
    ["cut", 184.138, 276.58],
    ["slideCW", 185.145, 33.69, 59.04, 0.503],
    ["cut", 186.151, 95.14],
    ["cut", 186.486, 45],
    ["cut", 186.821, 248.96],
    ["cut", 187.157, 215.36],
    ["cut", 187.91, 163.81],
    ["cut", 188.664, 248.96],
    ["swingCCW", 189.169, 122.32],
    ["cut", 189.67, 30.96],
    ["cut", 189.923, 40.82],
    ["cut", 190.175, 55.01],
    ["cut", 190.676, 207.65],
    ["cut", 191.181, 248.96],
    ["cut", 191.682, 310.7],
    ["cut", 191.935, 305.54],
    ["cut", 192.187, 299.36],
    ["cut", 192.689, 268.41],
    ["cut", 194.199, 287.35],
    ["scratchCW", 195.205, 19.98],
    ["cut", 195.707, 195.59],
    ["swingCCW", 197.217, 71.92],
    ["cut", 197.719, 39.41],
    ["cut", 197.971, 24.61],
    ["cut", 198.476, 1.76],
    ["cut", 198.977, 109.92],
    ["traceCW", 199.23, 104.24, 284.24, 0.754, 540],
    ["cut", 200.236, 71.92],
    ["cut", 200.485, 68.2],
    ["cut", 200.989, 60.02],
    ["cut", 201.242, 56.56],
    ["cut", 201.743, 53.13],
    ["cut", 201.995, 30.26],
    ["cut", 202.497, 333.43],
    ["cut", 203.002, 180],
    ["cut", 203.755, 0],
    ["cut", 204.008, 329.74],
    ["cut", 204.512, 300.76],
    ["cut", 204.761, 303.44],
    ["cut", 205.266, 261.87],
    ["cut", 205.767, 183.95],
    ["cut", 206.02, 196.7],
    ["cut", 206.521, 225],
    ["cut", 207.026, 214.22],
    ["cut", 207.78, 147.34],
    ["cut", 208.032, 130.1],
    ["cut", 208.533, 97.13],
    ["cut", 208.786, 83.88],
    ["swingCW", 209.287, 249.78],
    ["cut", 209.792, 207.22],
    ["cut", 210.044, 185.71],
    ["cut", 210.798, 97.31],
    ["cut", 211.299, 7.85],
    ["cut", 211.804, 315],
    ["cut", 212.056, 315.83],
    ["cut", 212.81, 260.87],
    ["cut", 214.318, 66.16],
    ["cut", 214.822, 102.09],
    ["cut", 215.324, 138.47],
    ["cut", 215.828, 303.9],
    ["slideCW", 216.33, 230.96, 264.99, 0.754],
    ["cut", 217.336, 223.45],
    ["fx", 218.342, 223.45, null, 0.754],
    ["traceCCW", 219.348, 180.59, 180.59, 0.754, -360],
    ["fx", 220.354, 137.73, null, 0.754],
    ["fx", 221.36, 105.95, null, 0.754],
    ["traceCCW", 222.366, 58.86, 260.76, 0.754, -158.1],
    ["fx", 223.372, 67.46, null, 0.754],
    ["cut", 224.378, 24.78],
    ["cut", 224.631, 11],
    ["cut", 224.883, 353.09],
    ["cut", 225.132, 333.43],
    ["fx", 225.384, 317.2, null, 0.754],
    ["fx", 226.39, 285.02, null, 0.754],
    ["traceCCW", 227.396, 258.69, 348.69, 0.754, -270],
    ["traceCW", 228.403, 320.71, 138.51, 0.754, 177.8],
    ["fx", 229.409, 301.65, null, 0.754],
    ["fx", 230.415, 269.61, null, 0.754],
    ["traceCCW", 231.421, 268.96, 83.66, 0.754, -185.3],
    ["traceCW", 232.427, 328.57, 238.57, 0.754, 270],
    ["cut", 233.433, 269.61],
    ["cut", 233.934, 260.38],
    ["cut", 234.187, 296.57],
    ["swingCW", 234.439, 37.41],
    ["cut", 234.691, 49.9],
    ["fx", 235.445, 90, null, 0.754],
    ["fx", 236.451, 118.3, null, 0.754],
    ["cut", 237.457, 162.72],
    ["cut", 237.709, 176.01],
    ["cut", 237.959, 191.04],
    ["cut", 238.463, 226.55],
    ["cut", 238.965, 167.91],
    ["fx", 239.469, 93.37, null, 0.754],
    ["fx", 240.475, 40.91, null, 0.754],
    ["swingCCW", 241.481, 270],
    ["cut", 241.731, 279.46],
    ["cut", 241.983, 271.97],
    ["cut", 242.487, 230.96],
    ["cut", 242.992, 204.23],
    ["fx", 243.494, 160.77, null, 0.754],
    ["traceCW", 244.5, 218.66, 128.66, 0.754, 270],
    ["fx", 245.506, 124.88, null, 0.754],
    ["traceCCW", 246.512, 50.19, 161.09, 0.754, -249.1],
    ["fx", 247.518, 92.39, null, 0.754],
    ["fx", 248.524, 40.24, null, 0.754],
    ["slideCW", 249.53, 92.39, 123.07, 0.503],
    ["cut", 250.533, 150.83],
    ["cut", 251.038, 170.54],
    ["slideCW", 251.539, 40.24, 90, 0.503],
    ["slideCW", 252.545, 205.46, 233.53, 0.503],
    ["cut", 253.551, 274.09],
    ["cut", 254.056, 90],
    ["cut", 254.557, 302.97],
    ["cut", 255.062, 51.07],
    ["cut", 256.569, 359.29],
    ["cut", 257.074, 339.78],
    ["slideCCW", 257.575, 257.01, 198.97, 0.503],
    ["cut", 258.582, 154.65],
    ["cut", 259.086, 223.21],
    ["slideCW", 259.588, 276.98, 298.89, 0.503],
    ["slideCW", 260.594, 61.11, 83.02, 0.503],
    ["cut", 261.6, 106.7],
    ["cut", 262.104, 138.58],
    ["cut", 262.606, 140.19],
    ["cut", 263.11, 197.88],
    ["cut", 263.612, 255.53],
    ["cut", 264.116, 242.1],
    ["traceCCW", 264.618, 276.12, 96.12, 0.754, -540],
    ["cut", 265.624, 293.51],
    ["cut", 265.876, 303.12],
    ["cut", 266.129, 311.83],
    ["cut", 266.63, 325.62],
    ["cut", 267.135, 246.8],
    ["cut", 267.636, 180],
    ["cut", 267.888, 163.3],
    ["cut", 268.141, 148.5],
    ["cut", 268.642, 120.96],
    ["cut", 269.147, 91.68],
    ["cut", 269.648, 60.95],
    ["cut", 269.901, 52.22],
    ["cut", 270.153, 19.18],
    ["swingCCW", 270.654, 285],
    ["cut", 271.159, 284.93],
    ["cut", 272.667, 148.96],
    ["cut", 273.673, 4.65],
    ["cut", 273.925, 20.03],
    ["cut", 274.679, 102.85],
    ["swingCCW", 275.685, 346.61],
    ["cut", 275.937, 335.98],
    ["cut", 276.186, 327.84],
    ["cut", 276.691, 312.54],
    ["cut", 276.943, 318.21],
    ["cut", 277.697, 327.53],
    ["cut", 277.949, 317.6],
    ["cut", 278.451, 293.96],
    ["cut", 278.955, 272.2],
    ["scratchCCW", 279.709, 303.69],
    ["cut", 281.217, 128.25],
    ["cut", 281.721, 65.06],
    ["cut", 282.223, 249.44],
    ["cut", 282.727, 310.22],
    ["cut", 282.976, 318.78],
    ["cut", 283.733, 40.34],
    ["cut", 284.235, 266.42],
    ["swingCCW", 284.739, 147.8],
    ["cut", 284.992, 174.47],
    ["cut", 285.745, 222.21],
    ["cut", 286.247, 106.7],
    ["cut", 286.751, 197.45],
    ["cut", 287.001, 210.53],
    ["cut", 287.758, 334.54],
    ["cut", 288.259, 243.43],
    ["cut", 288.764, 135],
    ["cut", 289.265, 344.57],
    ["cut", 289.77, 271.33],
    ["cut", 290.271, 121.48],
    ["swingCCW", 290.776, 303.69],
    ["cut", 291.025, 303.96],
    ["cut", 291.779, 121.48],
    ["cut", 292.283, 0],
    ["cut", 292.785, 242.8],
    ["cut", 293.037, 243.43],
    ["cut", 293.791, 61.08],
    ["cut", 294.295, 271.33],
    ["swingCCW", 294.797, 180.95],
    ["cut", 295.049, 181.97],
    ["cut", 295.803, 0],
    ["cut", 296.308, 228.09],
    ["cut", 296.809, 131.91],
    ["slideCW", 297.815, 0, 0, 0.754],
    ["slideCW", 298.821, 180, 180, 0.503],
    ["cut", 299.827, 282.02],
    ["cut", 300.08, 282.02],
    ["cut", 300.332, 282.02],
    ["cut", 301.839, 130.03],
    ["cut", 302.092, 111.25],
    ["cut", 302.593, 104.47],
    ["cut", 303.098, 80.18],
    ["traceCCW", 303.852, 51.6, 51.6, 1.76, -720],
    ["slideCCW", 305.864, 47.23, 20.22, 0.503],
    ["cut", 306.618, 326.31],
    ["slideCCW", 306.87, 326.31, 291.8, 0.503],
    ["cut", 307.624, 213.69],
    ["cut", 307.876, 198.43],
    ["cut", 308.128, 163.61],
    ["cut", 308.63, 140.6],
    ["cut", 309.134, 123.39],
    ["slideCW", 309.888, 71.03, 109.44, 0.503],
    ["cut", 310.642, 180],
    ["cut", 311.146, 206.57],
    ["cut", 311.9, 242.85],
    ["cut", 312.152, 254.05],
    ["cut", 312.654, 266.19],
    ["cut", 312.906, 213.69],
    ["cut", 313.159, 121.61],
    ["cut", 313.912, 39.47],
    ["cut", 314.918, 58.28],
    ["cut", 315.589, 98.91],
    ["slideCW", 315.924, 120.62, 120.62, 1.341],
    ["cut", 317.937, 208.81],
    ["cut", 318.189, 223.09],
    ["cut", 318.69, 248.96],
    ["cut", 318.943, 260.54],
    ["cut", 319.696, 322.13],
    ["cut", 319.949, 312.18],
    ["cut", 320.45, 286.59],
    ["cut", 320.955, 262.69],
    ["cut", 321.456, 255.96],
    ["swingCCW", 321.961, 88.26],
    ["cut", 322.462, 103.76],
    ["cut", 322.967, 127.78],
    ["cut", 323.973, 131.42],
    ["cut", 324.474, 88.09],
    ["cut", 324.979, 68.43],
    ["cut", 325.733, 29.74],
    ["cut", 326.991, 26.57],
    ["cut", 327.493, 259.51],
    ["swingCCW", 327.997, 80.22],
    ["cut", 328.499, 302.83],
    ["cut", 329.003, 71.57],
    ["cut", 329.505, 274.48],
    ["cut", 330.009, 45],
    ["cut", 330.511, 45],
    ["cut", 331.015, 355.24],
    ["cut", 331.769, 310.16],
    ["cut", 332.022, 294.78],
    ["cut", 332.523, 261.63],
    ["cut", 333.025, 233.97],
    ["cut", 334.031, 108.43],
    ["cut", 334.535, 144.21],
    ["cut", 335.037, 171.57],
    ["cut", 335.794, 90],
    ["cut", 336.043, 79.99],
    ["cut", 336.547, 45.71],
    ["cut", 337.049, 28.44],
    ["swingCW", 338.055, 274.76],
    ["cut", 339.061, 274.76],
    ["cut", 339.815, 205.82],
    ["fx", 340.067, 180, null, 0.503],
    ["cut", 341.073, 85.24],
    ["cut", 341.827, 154.18],
    ["cut", 342.079, 180],
    ["scratchCCW", 342.25, 270],
  ];

  function generateAnimaNormalChart(){
    return buildAnimaOsuReferenceChart(ANIMA_NORMAL_OSU_REFERENCE, 8);
  }

  function generateAnimaTechChart(){
    return buildAnimaOsuReferenceChart(ANIMA_TECH_OSU_REFERENCE, 16);
  }

  function generateNormalChart(){
    if(selectedSong?.id === "anima") return generateAnimaNormalChart();
    return generateAnimaNormalChart();
  }

  function generateTechChart(){
    if(selectedSong?.id === "anima") return generateAnimaTechChart();
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

  function localNoteToGame(n){ const durBeat=Number(n.durationBeat ?? (n.duration ? n.duration/BEAT : 0))||0; const runtime=make(n.type, Number(n.beat)||0, Number(n.lane ?? n.directionIndex ?? 0)||0, { angleDeg:noteAngleDeg(n), endAngleDeg:noteEndAngleDeg(n), endLane:n.endLane, direction:n.direction, duration:durBeat*BEAT*CHART_STRETCH, amount:n.amount, turns:n.turns, sweepAngle:n.sweepAngle, signedSweepAngle:n.signedSweepAngle }); if(n.id!==undefined) runtime.id=String(n.id); return runtime; }

  function generateChart(){
    if(useCustomChart){
      const data={notes:customChartData};
      const checked=chartTools.validateChart(data);
      if(!checked.ok){ alert("채보 오류로 플레이를 시작할 수 없습니다.\n"+checked.errors.join("\n")); return []; }
      return (customChartData||[]).map(localNoteToGame).map(n=>{ n.hitTime=n.beat*BEAT*CHART_STRETCH; n.spawnTime=n.hitTime-APPROACH; return n; }).sort((a,b)=>a.hitTime-b.hitTime);
    }
    if(selectedSong?.source==="local"){
      const data=selectedSong.charts?.[mapMode];
      const checked=chartTools.validateChart(data);
      if(!checked.ok){ alert("채보 오류로 플레이를 시작할 수 없습니다.\n"+checked.errors.join("\n")); return []; }
      return (data.notes||[]).map(localNoteToGame).map(n=>{ n.hitTime=n.beat*BEAT*CHART_STRETCH; n.spawnTime=n.hitTime-APPROACH; return n; }).sort((a,b)=>a.hitTime-b.hitTime);
    }
    try{ return chartForDifficulty(mapMode); }
    catch(err){ alert(err.message); return []; }
  }

  function resolveTraceMotion(n){
    const startAngle=n.angle;
    let signedSweepAngle;
    if(typeof n.signedSweepAngle === "number" && Number.isFinite(n.signedSweepAngle)){
      signedSweepAngle=n.signedSweepAngle*Math.PI/180;
    }else if(typeof n.slideAmount === "number" && Number.isFinite(n.slideAmount)){
      signedSweepAngle=n.slideAmount;
    }else{
      // Legacy chart compatibility: only derive sweep from endAngle when no
      // normalized signed sweep exists. Direction is interpreted exactly once.
      let d=(n.endAngle ?? n.angle)-n.angle;
      if(n.type==="traceCW"){while(d<=0)d+=TAU;}
      else if(n.type==="traceCCW"){while(d>=0)d-=TAU;}
      else d=norm(d);
      signedSweepAngle=d;
    }
    const finalUnwrappedAngle=startAngle+signedSweepAngle;
    return {startAngle,signedSweepAngle,finalUnwrappedAngle,finalAngle:norm(finalUnwrappedAngle)};
  }
  function traceAngleAtProgress(n,progress){
    const motion=resolveTraceMotion(n);
    return norm(motion.startAngle + motion.signedSweepAngle * clamp(progress,0,1));
  }
  function slideDelta(n){
    if(n.type?.startsWith("trace")) return resolveTraceMotion(n).signedSweepAngle;
    if(typeof n.slideAmount === "number") return n.slideAmount;

    // fallback: old chart compatibility
    let d=n.endAngle-n.angle;
    if(n.type==="slideCW"){while(d<=0)d+=TAU;return d;}
    if(n.type==="slideCCW"){while(d>=0)d-=TAU;return d;}
    return d;
  }
  function traceProgress(n,t){
    return clamp((t-n.hitTime)/Math.max(n.duration||0,.001),0,1);
  }
  function slideAngle(n,t){
    const duration=Math.max(n.duration||0,.001);
    return n.angle + slideDelta(n) * clamp((t-n.hitTime)/duration,0,1);
  }
  function traceTargetAngle(n,t){
    return traceAngleAtProgress(n,traceProgress(n,t));
  }
  function traceEndpointRegion(n,profile=traceProfile()){
    const motion=resolveTraceMotion(n), angleError=distAng(judgementAimAngle,motion.finalAngle);
    return {targetAngle:motion.finalAngle,targetRadius:hitR,pointerAngle:judgementAimAngle,pointerRadius:hitR,angleError,radiusError:0,inside:angleError<=profile.endpointGreatToleranceDeg*Math.PI/180,motion};
  }
  function traceProfile(){ return TRACE_PROFILES.normal; }
  // Kept for diagnostics and guide rendering: TRACE has an angular start gate only.
  function getTraceJudgementRegion(n,t,profile=traceProfile()){
    const targetAngle=traceTargetAngle(n,t), angleError=Math.abs(norm(judgementAimAngle-targetAngle));
    const tolerance=profile.startToleranceDeg*Math.PI/180;
    return {targetAngle,targetRadius:hitR,pointerAngle:judgementAimAngle,pointerRadius:hitR,angleError,radiusError:0,angularTolerance:tolerance,radialTolerance:0,innerAngularTolerance:tolerance,innerRadialTolerance:0,outerAngularTolerance:tolerance,outerRadialTolerance:0,inner:angleError<=tolerance,outer:angleError<=tolerance,inside:angleError<=tolerance,trackingWeight:0};
  }
  function traceTolerance(profile=traceProfile()){ return {angular:profile.startToleranceDeg*Math.PI/180,radial:0}; }
  function pointerPolar(){ return {angle:judgementAimAngle, radius:hitR}; }
  function insideTraceTarget(n,t){
    const region=getTraceJudgementRegion(n,t,traceProfile());
    return {inside:region.inside,angleError:region.angleError,radiusError:0,target:region.targetAngle,pointerAngle:region.pointerAngle,pointerRadius:hitR,trackingWeight:0,region,tol:{angular:region.angularTolerance,radial:0}};
  }
  function traceRequiredTravel(n){ return Math.abs(resolveTraceMotion(n).signedSweepAngle); }
  function traceMinimumMotionTime(required,duration){
    const seconds=clamp(required/Math.PI*.30,.12,.40);
    return Math.min(seconds,Math.max(.06,duration*.72));
  }
  function updateTraceTravel(n){
    const dir=resolveTraceMotion(n).signedSweepAngle>=0?1:-1;
    const forward=dir>0 ? aimInput.accumulatedCWTravel-n.traceStartCW : aimInput.accumulatedCCWTravel-n.traceStartCCW;
    const reverse=dir>0 ? aimInput.accumulatedCCWTravel-n.traceStartCCW : aimInput.accumulatedCWTravel-n.traceStartCW;
    n.reverseTravel=Math.max(0,reverse);
    n.directedTravel=Math.max(0,forward-n.reverseTravel*.75);
    n.progressRatio=clamp(n.directedTravel/Math.max(n.requiredTravel,.001),0,1);
  }
  function traceFailureReason(n,profile){
    if(!n.startCaptured) return "START MISSED";
    if(n.directedTravel < n.requiredTravel*profile.greatTravelRatio) return "NOT ENOUGH TURN";
    if(n.reverseTravel > Math.min(n.requiredTravel*profile.reverseGreatRatio,profile.maxReverseGreatDeg*Math.PI/180)) return "TOO MUCH REVERSE";
    if((n.endpointError||Infinity) > profile.endpointGreatToleranceDeg*Math.PI/180) return "ENDPOINT MISSED";
    if(n.motionTime < n.minimumMotionTime) return "TURN TOO INSTANT";
    return "TRACE TIMEOUT";
  }

  function baseJudgementTolerance(note, profile=traceProfile()){
    const family=noteFamily(note.type);
    if(family === "trace") return traceTolerance(profile);
    if(family === "swing") return {angular:DIAL_ARC_HALF + Math.PI*.12, radial:Math.max(18, hitR*.05), directionCone:Math.PI*.42, minSpeed:SWING_FLICK_SPEED};
    if(family === "scratch") return {angular:DIAL_ARC_HALF + Math.PI*.026, radial:Math.max(18, hitR*.05), directionCone:Math.PI*.34, minSpeed:SCRATCH_FLICK_SPEED};
    const extra = family === "slide" ? .010 : (family === "hold" ? .020 : .015);
    return {angular:DIAL_ARC_HALF + Math.PI*extra, radial:Math.max(16, hitR*.045)};
  }

  function timingStateFor(note, songTime){
    const start=note.hitTime, end=start+(note.duration||0);
    const dt=songTime-start;
    const abs=Math.abs(dt);
    if(noteFamily(note.type)==="trace" || (note.duration && songTime>=start && songTime<=end)) return "PERFECT";
    if(abs<=.065 || (note.type!=="cut" && abs<=.075)) return "PERFECT";
    if(abs<=HIT_WINDOW || (note.type!=="cut" && songTime>=start-.16 && songTime<=start+.20)) return "GREAT";
    if(songTime<start) return "EARLY";
    return "LATE";
  }

  function getJudgementRegion(note, songTime, judgementProfile=traceProfile()){
    const family=noteFamily(note.type);
    const end=note.hitTime+(note.duration||0);
    const timingState=timingStateFor(note,songTime);
    const active = family==="trace" ? songTime>=note.hitTime && songTime<=end : (note.duration ? songTime>=note.hitTime && songTime<=end : Math.abs(songTime-note.hitTime)<=HIT_WINDOW);
    if(family==="trace") return {...getTraceJudgementRegion(note,songTime,judgementProfile),timingState,active};
    const tol=baseJudgementTolerance(note, judgementProfile);
    const targetAngle = family==="slide" ? slideAngle(note,songTime) : note.angle;
    const targetRadius = hitR;
    const p=pointerPolar();
    const angleError=Math.abs(norm(p.angle-targetAngle));
    const radiusError=Math.abs(p.radius-targetRadius);
    return {targetAngle,targetRadius,angularTolerance:tol.angular,radialTolerance:tol.radial,timingState,active,angleError,radiusError,inside:angleError<=tol.angular && radiusError<=tol.radial,directionCone:tol.directionCone,minSpeed:tol.minSpeed};
  }

  function shouldShowJudgeGuide(note,t){
    if(visualSettings.judgeGuide==="OFF") return tutorialMode && note?.tutorialGuideForce;
    if(visualSettings.judgeGuide==="ALWAYS") return true;
    if(tutorialMode) return true;
    const plays=Number(localStorage.getItem("circleMixPlayCount.v1")||0);
    return plays<3 && note===focusNote && t>=note.spawnTime && t<=note.hitTime+(note.duration||0)+.18;
  }

  function drawJudgementBand(region,color,alpha=1){
    const width=Math.max(8,region.radialTolerance*2);
    drawDirectedArcSegments(region.targetRadius,region.targetAngle-region.angularTolerance,region.angularTolerance*2,color,width,alpha,null,0);
  }

  function drawJudgeGuideForNote(n,t,rank=0){
    if(!shouldShowJudgeGuide(n,t))return;
    const region=getJudgementRegion(n,t,traceProfile());
    const family=noteFamily(n.type);
    const focus=n===focusNote || rank===0;
    const dim=focus?1:.42;
    let a=.10*dim;
    if(region.timingState==="GREAT") a=.20*dim;
    if(region.timingState==="PERFECT") a=.34*dim;
    if(t>n.hitTime+(n.duration||0)) a*=clamp(1-(t-(n.hitTime+(n.duration||0)))/.22,0,1);
    if(tutorialMode){
      const st=tutorialSteps[tutorialStepIndex];
      if(st?.phase==="faded") a*=.42;
      if(st?.phase==="standard" || st?.name==="MIX TEST") return;
      if(st?.repeatMisses>=2) a*=1.45;
    }
    const inside=region.inside;
    const edge=inside && (region.angleError>region.angularTolerance*.72 || region.radiusError>region.radialTolerance*.72);
    const guideColor=edge?`rgba(255,225,90,${a+.12})`:(inside?`rgba(128,255,219,${a+.10})`:`rgba(53,240,197,${a})`);
    if(family==="trace"){
      // drawTrace() already renders the real path, target and both judgement
      // zones. Rendering another TRACE guide here caused doubled arcs and dots.
      return;
    }else if(family==="slide"){
      const d=slideDelta(n), curr=region.targetAngle, end=n.angle+d;
      drawDirectedArcSegments(hitR,curr,end-curr,`rgba(255,225,90,${.18*dim})`,NOTE_WIDTHS.slide+4,1);
      drawJudgementBand(region,guideColor,1);
      ctx.save();ctx.translate(cx,cy);ctx.fillStyle=filterHeld?`rgba(255,225,90,${.42*dim})`:`rgba(255,225,90,${.10*dim})`;ctx.beginPath();ctx.arc(Math.cos(curr)*hitR,Math.sin(curr)*hitR,region.radialTolerance*.55,0,TAU);ctx.fill();ctx.restore();
    }else if(family==="swing"){
      drawJudgementBand(region,`rgba(121,255,125,${a})`,1);
      const dir=n.type==="swingCW"?1:-1; drawDirectedArcSegments(hitR+22,n.angle-dir*region.directionCone*.5,dir*region.directionCone,`rgba(255,255,255,${.22*dim})`,5,1);
    }else if(family==="scratch"){
      drawJudgementBand(region,`rgba(255,90,168,${a})`,1);
      const dir=n.type==="scratchCW"?1:-1; drawDirectedArcSegments(hitR+18,n.angle-dir*.34,dir*.68,`rgba(255,245,230,${.24*dim})`,4,1);
    }else{
      drawJudgementBand(region,guideColor,1);
      if(family==="hold"){
        ctx.save();ctx.translate(cx,cy);ctx.fillStyle=filterHeld?`rgba(183,124,255,${.30*dim})`:`rgba(183,124,255,${.08*dim})`;ctx.beginPath();ctx.arc(Math.cos(region.targetAngle)*hitR,Math.sin(region.targetAngle)*hitR,region.radialTolerance*.55,0,TAU);ctx.fill();ctx.restore();
      }
    }
    if(debugMode && focus){ ctx.save();ctx.fillStyle="rgba(255,255,255,.7)";ctx.font="800 10px system-ui";ctx.textAlign="center";ctx.fillText(`${Math.round(region.angularTolerance*180/Math.PI)}° / ${Math.round(region.radialTolerance)}px / ${region.timingState}`,cx,cy-baseR*.52);ctx.restore(); }
  }

  function drawJudgeGuides(t){
    const limit=tutorialMode?1:2;
    const candidates=chart.filter(n=>!n.done&&!n.missed&&t>=n.spawnTime-.05&&t<=n.hitTime+(n.duration||0)+.25).sort((a,b)=>a.hitTime-b.hitTime).slice(0,limit);
    candidates.forEach((n,i)=>drawJudgeGuideForNote(n,t,i));
  }

  function drawTutorialExploreTarget(t){
    if(!tutorialMode || tutorialState.transitioning)return;
    const st=tutorialSteps[tutorialStepIndex];
    if(!st?.targets || st.phase!=="explore")return;
    const target=st.targets[st._hit||0];
    if(target===undefined)return;
    const a=laneAngle(target);
    const pulse=.5+.5*Math.sin(t*5.5);

    if(st.kind==="trace"){
      const profile=traceProfile();
      const outerHalf=profile.outerAngularToleranceDeg*Math.PI/180;
      const innerHalf=profile.innerAngularToleranceDeg*Math.PI/180;
      const outerRad=Math.max(profile.outerRadialTolerancePx,hitR*profile.outerRadialToleranceRatio);
      const innerRad=Math.max(profile.innerRadialTolerancePx,hitR*profile.innerRadialToleranceRatio);
      drawDirectedArcSegments(hitR,a-outerHalf,outerHalf*2,`rgba(53,240,197,${.24+pulse*.08})`,Math.max(NOTE_WIDTHS.trace+8,outerRad*2),1,null,0);
      drawDirectedArcSegments(hitR,a-innerHalf,innerHalf*2,`rgba(255,255,255,${.38+pulse*.10})`,Math.max(NOTE_WIDTHS.trace+6,innerRad*2),1,COLORS.trace,4);
      ctx.save();ctx.translate(cx,cy);
      const x=Math.cos(a)*hitR,y=Math.sin(a)*hitR;
      ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x,y,4.5,0,TAU);ctx.fill();
      ctx.strokeStyle=aligned(a,.055)?"rgba(215,255,247,.98)":"rgba(53,240,197,.92)";
      ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(x,y,11+pulse*2,0,TAU);ctx.stroke();
      ctx.restore();
      return;
    }

    if(st.kind==="cut"){
      drawArcNote(a,hitR,Math.PI*.06,COLORS.cut,NOTE_WIDTHS.cut+4,.96);
      ctx.save();ctx.translate(cx,cy);ctx.rotate(a);ctx.strokeStyle="rgba(3,7,17,.82)";ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(hitR-7,-7);ctx.lineTo(hitR+7,7);ctx.stroke();ctx.restore();
      drawRingLabel("CUT",a,hitR,"#fff",11);
      return;
    }

    // AIM uses a simple target only; no particles are emitted every frame.
    ctx.save();ctx.translate(cx,cy);
    const x=Math.cos(a)*hitR,y=Math.sin(a)*hitR;
    ctx.fillStyle="rgba(255,243,106,.92)";ctx.beginPath();ctx.arc(x,y,6,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(255,243,106,.68)";ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,15+pulse*3,0,TAU);ctx.stroke();
    ctx.restore();
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
  function aligned(angle, extra=0){return distAng(judgementAimAngle,angle)<DIAL_ARC_HALF+Math.PI*extra;}
  function isAimMagnetNote(n){ return !!n && (n.type==="cut"||n.type==="fx"||n.type.startsWith("swing")||n.type.startsWith("scratch")); }
  function aimStabilizerProfile(){
    const mode=inputSettings.aimStabilizer;
    if(mode==="MEDIUM") return {mode, slowTime:.040, slowVel:1.15, fastVel:4.8, magnetEnter:6*Math.PI/180, magnetExit:7*Math.PI/180, magnetStrength:.35, disengageVel:5.0};
    if(mode==="LOW") return {mode, slowTime:.028, slowVel:.95, fastVel:4.2, magnetEnter:4*Math.PI/180, magnetExit:7*Math.PI/180, magnetStrength:.24, disengageVel:4.6};
    return {mode, slowTime:0, slowVel:0, fastVel:0, magnetEnter:0, magnetExit:0, magnetStrength:0, disengageVel:4.4};
  }
  function updateAimMagnet(baseAngle, velocity){
    const profile=aimStabilizerProfile();
    const t=now();
    if(profile.mode==="OFF" || Math.abs(velocity)>profile.disengageVel){ magnetTarget=null; magnetAngleError=0; return baseAngle; }
    if(magnetTarget && (magnetTarget.done||magnetTarget.missed||magnetTarget!==focusNote||t>magnetTarget.hitTime+HIT_WINDOW)){ magnetTarget=null; }
    const n=magnetTarget || focusNote;
    if(!isAimMagnetNote(n) || t<n.spawnTime || Math.abs(t-n.hitTime)>HIT_WINDOW+.10){ magnetTarget=null; magnetAngleError=0; return baseAngle; }
    const err=norm(n.angle-baseAngle);
    magnetAngleError=Math.abs(err);
    if(magnetTarget){
      const movingAway=Math.sign(velocity)===-Math.sign(err) && Math.abs(velocity)>1.15;
      if(magnetAngleError>profile.magnetExit || movingAway){ magnetTarget=null; return baseAngle; }
    }else if(magnetAngleError<=profile.magnetEnter){
      magnetTarget=n;
    }else return baseAngle;
    return norm(baseAngle + err*profile.magnetStrength);
  }
  function activeHold(n,t){return (n.type==="fx"||n.type.startsWith("slide"))&&t>=n.hitTime&&t<=n.hitTime+n.duration;}

  function trimVisualArray(arr,limit){ while(arr.length>limit) arr.shift(); }
  function visualLimits(){
    if(!isCoarsePointerMobile()) return DESKTOP_EFFECT_LIMITS;
    const quality=getMobileQuality();
    if(quality==="HIGH" && SESSION_QUALITY.effectMode!=="PERFORMANCE") return MOBILE_EFFECT_LIMITS;
    if(quality==="PERFORMANCE" || SESSION_QUALITY.effectMode==="PERFORMANCE") return {particles:60,feedback:20,waves:8,ringBursts:5,scratchBursts:4};
    return {particles:90,feedback:26,waves:14,ringBursts:8,scratchBursts:6};
  }
  function addFeedback(text,x,y,color){feedback.push({text,x,y,color,life:.28});trimVisualArray(feedback,visualLimits().feedback);}
  function addParticles(x,y,color,count=12,power=1){
    for(let i=0;i<count;i++){
      const a=Math.random()*TAU, s=(34+Math.random()*112)*power;
      particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.16+Math.random()*.12,color});
    }
    trimVisualArray(particles,visualLimits().particles);
  }
  function addWave(angle,color){waves.push({angle,color,life:.24});trimVisualArray(waves,visualLimits().waves);}
  function addRingBurst(color, power=1, label=""){
    ringBursts.push({color, power, life:.30, label});trimVisualArray(ringBursts,visualLimits().ringBursts);
  }
  function addScratchBurst(angle,color,dir=1){
    scratchBursts.push({angle,color,dir,life:.24});trimVisualArray(scratchBursts,visualLimits().scratchBursts);
  }
  function mobileHaptic(result){
    if(!inputSettings.haptic || gameState.autoEnabled || !isCoarsePointerMobile() || typeof navigator==="undefined" || typeof navigator.vibrate!=="function") return;
    const ms=result==="MISS"?20:(result==="PERFECT"?10:8);
    try{ navigator.vibrate(ms); }catch(e){}
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

  function judge(n,label,color,event={}){
    if(n.done||n.missed)return;
    const judgeEvent={source:event.source||tutorialState.activeInput||"system", judgement:label, noteId:noteDebugId(n), noteType:n.type, reason:event.reason||"USER_JUDGEMENT", stepToken:tutorialStepToken, sessionId:tutorialSessionId};
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
    mobileHaptic(label);
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

    if(tutorialMode) tutorialHandleJudgement(judgeEvent);

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
  function inferMissReason(n,t){
    const family=noteFamily(n.type);
    if(family==="hold") return filterHeld ? "MOVE CLOSER TO THE PATH" : "HOLD THE BUTTON";
    if(family==="slide") return filterHeld ? "FOLLOW THE CURRENT TARGET" : "HOLD THE BUTTON";
    if(family==="trace") return n.enteredTrace ? "FOLLOW THE CURRENT TARGET" : "MOVE CLOSER TO THE PATH";
    if(family==="swing") return Math.abs(armVel)<SWING_FLICK_SPEED ? "WRONG DIRECTION" : "WRONG DIRECTION";
    if(family==="scratch") return scratchHeld ? "WRONG DIRECTION" : "HOLD THE BUTTON";
    if(t<n.hitTime-HIT_WINDOW) return "TOO EARLY";
    if(t>n.hitTime+HIT_WINDOW) return "TOO LATE";
    return "MOVE CLOSER TO THE PATH";
  }

  function tutorialFailureText(reason){
    return ({
      "TOO EARLY":"너무 빨랐어요",
      "TOO LATE":"너무 늦었어요",
      "MOVE CLOSER TO THE PATH":"판정 호에 에임을 맞추세요",
      "FOLLOW THE CURRENT TARGET":"현재 목표를 따라가세요",
      "HOLD THE BUTTON":"버튼을 계속 누르세요",
      "RELEASED EARLY":"버튼을 너무 일찍 놓았어요",
      "WRONG DIRECTION":"표시된 방향으로 움직이세요",
      "STAY ON THE PATH LONGER":"경로를 더 오래 따라가세요",
      "REACH THE END POINT":"끝 지점까지 따라가세요"
    })[reason] || "다시 시도하세요";
  }

  function miss(n,reason){
    if(n.done||n.missed)return;
    n.missed=true; n.failReason=reason || inferMissReason(n, now()); combo=0; judgedCount++; missCount++;
    let a=n.angle;
    if(n.type.startsWith("slide") || n.type.startsWith("scratch"))a=slideAngle(n,now());
    if(n.type?.startsWith("trace")) a=resolveTraceMotion(n).finalAngle;
    const isScratch=n.type&&n.type.startsWith("scratch");
    const p={x:cx+Math.cos(a)*hitR,y:cy+Math.sin(a)*hitR};
    addFeedback(tutorialMode ? tutorialFailureText(n.failReason) : "MISS",p.x,p.y-18,COLORS.miss);
    mobileHaptic("MISS");
    addParticles(p.x,p.y,COLORS.miss,isScratch?14:8,.65);
    addWave(a,COLORS.miss);
  }

  function updateSwingGesture(n){
    // Arm after the judgement window opens: only later travel contributes.
    if(n.tutorialTraceSwingRuntime && performance.now() < (n.swingArmedAt||0)) return;
    if(!n.swingGestureArmed){ n.swingGestureArmed=true; n.swingStartCW=aimInput.accumulatedCWTravel; n.swingStartCCW=aimInput.accumulatedCCWTravel; n.swingDirectedTravel=0; n.swingReverseTravel=0; return; }
    const dir=n.type==="swingCW"?1:-1;
    const forward=dir>0 ? aimInput.accumulatedCWTravel-n.swingStartCW : aimInput.accumulatedCCWTravel-n.swingStartCCW;
    const reverse=dir>0 ? aimInput.accumulatedCCWTravel-n.swingStartCCW : aimInput.accumulatedCWTravel-n.swingStartCW;
    n.swingReverseTravel=reverse;
    n.swingDirectedTravel=Math.max(0,forward-reverse*.75);
  }

  function checkSwing(n){
    const dir=n.type==="swingCW"?1:-1;
    const enoughTravel=(n.swingDirectedTravel||0)>=Math.PI*.035;
    const freshInput=!n.tutorialTraceSwingRuntime || performance.now()>=(n.swingArmedAt||0);
    return freshInput && freshAimSample() && enoughTravel && (n.swingReverseTravel||0)<Math.PI*.16 && Math.abs(aimInput.sampleAngularVelocity)>=SWING_FLICK_SPEED && Math.sign(aimInput.sampleAngularVelocity)===dir;
  }
  function setScratchHeld(held){ scratchHeld=!!held; syncScratchHoldState(); }
  function forceReleaseScratch(){
    setScratchHeld(false);
    scratchHoldWasActive=false;
    for(const note of chart){ delete note.scratchGestureEpoch; delete note.scratchGestureArmed; delete note.scratchDirectedTravel; delete note.scratchReverseTravel; }
  }
  function syncScratchHoldState(){
    if(scratchHeld===scratchHoldWasActive)return;
    scratchHoldWasActive=scratchHeld; scratchHoldEpoch++;
    scratchHoldCW=aimInput.accumulatedCWTravel; scratchHoldCCW=aimInput.accumulatedCCWTravel;
    if(!scratchHeld){
      for(const note of chart){ delete note.scratchGestureEpoch; delete note.scratchGestureArmed; delete note.scratchDirectedTravel; delete note.scratchReverseTravel; }
    }
  }
  function updateScratchGesture(n){
    if(!scratchHeld)return false;
    if(n.scratchGestureEpoch!==scratchHoldEpoch){
      n.scratchGestureEpoch=scratchHoldEpoch; n.scratchGestureArmed=true;
      // Baseline is captured on the false -> true hold transition, never before it.
      n.scratchStartCW=scratchHoldCW; n.scratchStartCCW=scratchHoldCCW;
      n.scratchDirectedTravel=0; n.scratchReverseTravel=0; return false;
    }
    const dir=n.type==="scratchCW"?1:-1;
    const forward=dir>0 ? aimInput.accumulatedCWTravel-n.scratchStartCW : aimInput.accumulatedCCWTravel-n.scratchStartCCW;
    const reverse=dir>0 ? aimInput.accumulatedCCWTravel-n.scratchStartCCW : aimInput.accumulatedCWTravel-n.scratchStartCW;
    n.scratchReverseTravel=reverse;
    n.scratchDirectedTravel=Math.max(0,forward-reverse*.75);
    return true;
  }

  function checkScratch(n, t){
    // SCRATCH = 우클릭을 누른 채 짧게 좌/우 또는 시계/반시계로 긁는 마찰 액션.
    // Shift는 보조 입력/fallback으로만 허용하며, SLIDE처럼 긴 경로를 추적하지 않는다.
    const dir=n.type==="scratchCW"?1:-1;
    scratchCandidate=!!(scratchHeld&&aligned(n.angle,.026));
    if(!scratchHeld){ lastScratchResult="READY"; return false; }
    const armed=updateScratchGesture(n);
    scratchMoveAmount=Math.abs(aimInput.lastSampleDelta);
    scratchSpeed=Math.abs(aimInput.sampleAngularVelocity);
    scratchThresholdMet=freshAimSample() && scratchSpeed>=SCRATCH_FLICK_SPEED;
    if(!armed){lastScratchResult="ARMING";return false;}
    if(!aligned(n.angle,.026)){lastScratchResult="MISS";return false;}
    if(!scratchThresholdMet || (n.scratchDirectedTravel||0)<Math.PI*.035){lastScratchResult="TOO SLOW";return false;}
    if((n.scratchReverseTravel||0)>=Math.PI*.16){lastScratchResult="MISS";return false;}
    const ok=Math.sign(rawArmVel)===dir;
    lastScratchResult=ok?"HIT":"MISS";
    return ok;
  }
  function onCut(){
    if(!running||paused)return;
    const t=now();
    const c=chart.filter(n=>!n.done&&!n.missed&&n.type==="cut"&&Math.abs(t-n.hitTime)<=HIT_WINDOW)
                 .sort((a,b)=>Math.abs(t-a.hitTime)-Math.abs(t-b.hitTime));
    const n=c.find(x=>aligned(x.angle,.015));
    const source=tutorialState.activeInput || "pointer";
    const st=tutorialMode?tutorialSteps[tutorialStepIndex]:null;
    if(tutorialMode && st?.kind==="cut" && st.phase==="explore" && st.targets){
      const target=st.targets[st._hit||0];
      if(performance.now()>=tutorialState.inputEnabledAt && aligned(laneAngle(target),.055)){
        tutorialCompleteExploreTarget("USER_JUDGEMENT", source);
      }
      return;
    }
    if(n)judge(n,Math.abs(t-n.hitTime)<.065?"PERFECT":"GREAT",Math.abs(t-n.hitTime)<.065?COLORS.perfect:COLORS.great,{source,reason:"USER_JUDGEMENT"});
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

  function isAutoActive(){ return gameState.autoEnabled && !(tutorialMode && tutorialState.autoSuppressed); }

  function updateAutoDebug(t){
    const n=isAutoActive()?nextNote(t):null;
    const action=autoActionForNote(n);
    const isScratch=!!(n&&n.type.startsWith("scratch"));
    const isHold=action==="HOLD"||action==="SLIDE";
    const isCut=action==="CUT";
    autoInputDebug={
      z:isAutoActive()&&(isCut||isHold),
      x:isAutoActive()&&isHold,
      space:isAutoActive()&&isCut,
      lmb:isAutoActive()&&isCut,
      rmb:isAutoActive()&&isScratch,
      shiftFallback:false,
      action,
      targetAngle:n?((n.type.startsWith("slide")||n.type.startsWith("trace")||n.type.startsWith("scratch"))?slideAngle(n,t):n.angle):null,
      targetDistance:isAutoActive()&&n?hitR:null,
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
    if(!isAutoActive())return;

    const activePath=chart.find(n=>!n.done&&!n.missed&&(n.type.startsWith("slide")||n.type.startsWith("trace"))&&t>=n.hitTime&&t<=n.hitTime+n.duration+(n.type.startsWith("trace")?traceProfile().endpointGrace:0));
    if(activePath){
      const a=slideAngle(activePath,t);
      armAngle=judgementAimAngle=visualArmAngle=rawInputAngle=rawTargetAngle=a;
      targetAngle=a;
      armVel=slideDelta(activePath)/Math.max(activePath.duration,.001);
      if(activePath.type.startsWith("trace")){
        const progress=traceProgress(activePath,t);
        if(activePath.startCaptured){
          const previousProgress=Number(activePath.autoTraceProgress)||0;
          const travel=resolveTraceMotion(activePath).signedSweepAngle*Math.max(0,progress-previousProgress);
          if(travel>0) aimInput.accumulatedCWTravel+=travel;
          else aimInput.accumulatedCCWTravel+=-travel;
          activePath.autoTraceProgress=progress;
        }else{
          activePath.autoTraceProgress=0;
        }
      }
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
        if(isAutoActive())logAutoProcessing(n);
        judge(n,"PERFECT",noteColor(n),{source:"auto",reason:"AUTO_JUDGEMENT"});
      }
    }
  }

  function resetAimInput(angle=-Math.PI/2){
    Object.assign(aimInput,{rawAngle:angle,unwrappedAngle:angle,previousSampleAngle:null,sampleAngularVelocity:0,accumulatedCWTravel:0,accumulatedCCWTravel:0,pointerRadius:0,sampleCount:0,lastSampleTimestamp:0,centerDeadzoneActive:false,rebasePending:true,pendingSamples:0,lastSampleDelta:0});
    rawInputAngle=judgementAimAngle=visualArmAngle=rawTargetAngle=stabilizedTargetAngle=lastValidTargetAngle=angle; rawAngularVelocity=0; centerDeadzoneActive=false;
  }
  function updateVisualArmAngle(visualTarget,dt){
    if(inputSettings.aimVisual==="DIRECT" || lastPointerSource==="touch"){ visualArmAngle=visualTarget; return; }
    const response={FAST:{base:.024,min:.006},NORMAL:{base:.046,min:.012},SOFT:{base:.080,min:.020}}[inputSettings.aimVisualResponse] || {base:.024,min:.006};
    const error=Math.abs(norm(visualTarget-visualArmAngle));
    const velocity=Math.abs(aimInput.sampleAngularVelocity)||0;
    // Both speed and visible error continuously shorten the response time. This
    // deliberately has no velocity snap threshold, so it cannot flap between
    // interpolation and snapping on adjacent samples.
    const urgency=Math.max(1-Math.exp(-velocity/3.2),1-Math.exp(-error/(Math.PI/5)));
    const tau=response.base+(response.min-response.base)*urgency;
    visualArmAngle=norm(visualArmAngle+norm(visualTarget-visualArmAngle)*(1-Math.exp(-dt/Math.max(tau,.001))));
  }
  function processAimSample(x,y,timestamp,source="pointer"){
    mouseX=x; mouseY=y; lastPointerSource=source;
    const dx=x-cx, dy=y-cy, radius=Math.hypot(dx,dy);
    const profile=source!=="touch"?aimStabilizerProfile():{mode:"OFF"};
    const enter=profile.mode==="OFF" ? 1 : Math.max(24,hitR*.18);
    const exit=profile.mode==="OFF" ? 2 : Math.max(24,hitR*.23);
    aimInput.pointerRadius=cursorRadius=radius;
    if(aimInput.centerDeadzoneActive ? radius<exit : radius<enter){
      aimInput.centerDeadzoneActive=centerDeadzoneActive=true; aimInput.rebasePending=true;
      aimInput.sampleAngularVelocity=aimInput.lastSampleDelta=rawAngularVelocity=0; magnetTarget=null; magnetAngleError=0;
      visualArmAngle=judgementAimAngle;
      return;
    }
    const angle=Math.atan2(dy,dx);
    rawInputAngle=rawTargetAngle=angle;
    // Direct modes must be usable by an input action before the next RAF.
    if(profile.mode==="OFF" || source==="touch"){ judgementAimAngle=armAngle=angle; if(source==="touch" || inputSettings.aimVisual==="DIRECT") visualArmAngle=angle; }
    if(aimInput.rebasePending || aimInput.previousSampleAngle===null){
      aimInput.previousSampleAngle=angle; aimInput.rawAngle=aimInput.unwrappedAngle=angle; aimInput.rebasePending=false;
      aimInput.sampleAngularVelocity=aimInput.lastSampleDelta=0; aimInput.lastSampleTimestamp=timestamp; aimInput.centerDeadzoneActive=centerDeadzoneActive=false;
      visualArmAngle=judgementAimAngle; lastValidTargetAngle=angle; return;
    }
    const delta=norm(angle-aimInput.previousSampleAngle);
    const dt=Math.max((timestamp-aimInput.lastSampleTimestamp)/1000,.001);
    aimInput.rawAngle=angle; aimInput.previousSampleAngle=angle; aimInput.unwrappedAngle+=delta;
    aimInput.lastSampleDelta=delta; aimInput.sampleAngularVelocity=delta/dt; rawAngularVelocity=aimInput.sampleAngularVelocity;
    // A near-half-turn sample is a discontinuity, not motion to trail behind.
    if(Math.abs(delta)>=Math.PI*.9) visualArmAngle=angle;
    if(delta>0) aimInput.accumulatedCWTravel+=delta; else aimInput.accumulatedCCWTravel+=-delta;
    aimInput.sampleCount++; aimInput.pendingSamples++; aimInput.lastSampleTimestamp=timestamp;
    aimInput.centerDeadzoneActive=centerDeadzoneActive=false; centerDeadzoneActive=false; lastValidTargetAngle=angle;
  }
  function freshAimSample(){
    const fresh=aimInput.lastSampleTimestamp>0 && performance.now()-aimInput.lastSampleTimestamp<=AIM_SAMPLE_FRESH_MS;
    if(!fresh){ aimInput.sampleAngularVelocity=0; aimInput.lastSampleDelta=0; rawAngularVelocity=0; }
    return fresh;
  }
  function updateArm(dt){
    const tNow=now(); prevArmAngle=armAngle;
    if(isAutoActive() && chart.some(n=>!n.done&&!n.missed&&(n.type.startsWith("slide")||n.type.startsWith("trace"))&&tNow>=n.hitTime&&tNow<=n.hitTime+n.duration)) return;
    if(isAutoActive()||keyA||keyD){
      if(keyA||keyD){
        const delta=(keyD-keyA)*9.5*dt;
        targetAngle+=delta; rawInputAngle=rawTargetAngle=norm(targetAngle);
        aimInput.unwrappedAngle+=delta; aimInput.lastSampleDelta=delta; aimInput.sampleAngularVelocity=delta/Math.max(dt,.001);
        if(delta>0) aimInput.accumulatedCWTravel+=delta; else aimInput.accumulatedCCWTravel-=delta;
        aimInput.sampleCount++; aimInput.lastSampleTimestamp=performance.now(); magnetTarget=null;
      }
      const diff=norm(targetAngle-armAngle); armAngle=norm(armAngle+diff*clamp(1-Math.pow(.0001,dt),0,1));
      judgementAimAngle=rawInputAngle=rawTargetAngle=armAngle; visualArmAngle=armAngle; rawArmVel=armVel=aimInput.sampleAngularVelocity||norm(armAngle-prevArmAngle)/Math.max(dt,.001); return;
    }
    const sampleFresh=freshAimSample();
    const profile=lastPointerSource!=="touch"?aimStabilizerProfile():{mode:"OFF"};
    targetAngle=rawInputAngle;
    let desired=rawInputAngle;
    if(lastPointerSource!=="touch" && profile.mode!=="OFF"){
      desired=updateAimMagnet(desired,sampleFresh?aimInput.sampleAngularVelocity:0);
      if(sampleFresh && Math.abs(aimInput.sampleAngularVelocity)<profile.fastVel && aimInput.pendingSamples){
        const slowFactor=clamp((profile.fastVel-Math.abs(aimInput.sampleAngularVelocity))/Math.max(profile.fastVel-profile.slowVel,.001),0,1);
        const alpha=1-Math.exp(-dt/Math.max(profile.slowTime*slowFactor,.001));
        stabilizedTargetAngle=norm(stabilizedTargetAngle+norm(desired-stabilizedTargetAngle)*alpha);
      } else stabilizedTargetAngle=desired;
    } else { magnetTarget=null; stabilizedTargetAngle=desired; }
    // OFF is deliberately direct outside its tiny crossing safety zone.
    judgementAimAngle=profile.mode==="OFF" ? rawInputAngle : stabilizedTargetAngle;
    armAngle=judgementAimAngle;
    const visualTarget=profile.mode==="OFF" ? rawInputAngle : stabilizedTargetAngle;
    updateVisualArmAngle(visualTarget,dt);
    rawArmVel=rawAngularVelocity=aimInput.sampleAngularVelocity;
    armVel=norm(armAngle-prevArmAngle)/Math.max(dt,.001); aimInput.pendingSamples=0;
  }

  function logAutoProcessing(n){
    if(!debugMode || !isAutoActive() || n.autoProcessingLogged)return;
    n.autoProcessingLogged=true;
    console.log(`[Auto] processing note type=${autoActionForNote(n)}`);
  }

  function traceFailureFeedback(n,needed){
    // CIRCLE MIX's dial input is angular-only. Radial distance belongs to the
    // projected visual arm and must never be used as a hidden failure reason.
    if(!n.enteredTrace) return "FOLLOW THE CURRENT TARGET";
    if((n.traceQuality||0) < needed) return "STAY ON THE PATH LONGER";
    return "FOLLOW THE CURRENT TARGET";
  }

  function updateNotes(t,dt){
    for(const n of chart){
      if(n.done||n.missed)continue;

      if(n.type==="cut"){
        if(t>n.hitTime+.22)miss(n,"TOO LATE");
        continue;
      }

      if(n.type.startsWith("trace")){
        const end=n.hitTime+n.duration, profile=traceProfile(), motion=resolveTraceMotion(n);
        if(n.requiredTravel===undefined) Object.assign(n,{requiredTravel:traceRequiredTravel(n),directedTravel:0,reverseTravel:0,progressRatio:0,startCaptured:false,endpointCaptured:false,completionTime:null,failReason:null,motionTime:0,minimumMotionTime:traceMinimumMotionTime(traceRequiredTravel(n),n.duration)});
        if(t>=n.hitTime && !n.startCaptured && t<=n.hitTime+profile.startGrace){
          const startError=distAng(judgementAimAngle,motion.startAngle);
          if(isAutoActive() || startError<=profile.startToleranceDeg*Math.PI/180){
            Object.assign(n,{startCaptured:true,traceStartCW:aimInput.accumulatedCWTravel,traceStartCCW:aimInput.accumulatedCCWTravel,traceStartedAt:t,startAngleError:startError});
          }
        }
        if(n.startCaptured && t>=n.hitTime && t<=end+profile.endpointGrace){
          updateTraceTravel(n);
          n.motionTime=t-n.traceStartedAt;
          n.endpointError=distAng(judgementAimAngle,motion.finalAngle);
          n.endpointCaptured=n.endpointError<=profile.endpointGreatToleranceDeg*Math.PI/180;
        }
        // Evaluation waits until the authored endpoint (or its small grace), so early turns must hold the endpoint.
        if(t>end+profile.endpointGrace){
          const greatTravel=n.directedTravel>=n.requiredTravel*profile.greatTravelRatio;
          const perfectTravel=n.directedTravel>=n.requiredTravel*profile.perfectTravelRatio;
          const greatReverse=n.reverseTravel<=Math.min(n.requiredTravel*profile.reverseGreatRatio,profile.maxReverseGreatDeg*Math.PI/180);
          const perfectReverse=n.reverseTravel<=Math.min(n.requiredTravel*profile.reversePerfectRatio,profile.maxReversePerfectDeg*Math.PI/180);
          const greatEndpoint=n.endpointError<=profile.endpointGreatToleranceDeg*Math.PI/180;
          const perfectEndpoint=n.endpointError<=profile.endpointPerfectToleranceDeg*Math.PI/180;
          const onTime=Math.abs((n.completionTime||end)-end)<=profile.endpointWindow;
          const passed=n.startCaptured && greatTravel && greatReverse && greatEndpoint && n.motionTime>=n.minimumMotionTime;
          n.completed=passed; n.failReason=passed?null:traceFailureReason(n,profile);
          if(passed){ const perfect=perfectTravel&&perfectReverse&&perfectEndpoint&&onTime; n.completionTime=t; addWave(motion.finalAngle,COLORS.trace); addRingBurst(COLORS.trace,.42,"END"); judge(n,perfect?"PERFECT":"GREAT",COLORS.trace,{source:isAutoActive()?"auto":(tutorialState.activeInput||"pointer"),reason:isAutoActive()?"AUTO_JUDGEMENT":"USER_JUDGEMENT"}); }
          else miss(n,n.failReason);
        }
        continue;
      }

      if(n.type.startsWith("swing")){
        if(n.tutorialTraceSwingRuntime && t<n.spawnTime) continue;
        if(t>=n.hitTime-.20 && t<=n.hitTime+.26 && !isAutoActive()) updateSwingGesture(n);
        const link=linkedTraceForSwing(n);
        const needsTrace=chart.some(p=>p.type?.startsWith("trace") && p.hitTime+p.duration<=n.hitTime && n.hitTime-(p.hitTime+p.duration)>=TRACE_SWING_LINK_MIN && n.hitTime-(p.hitTime+p.duration)<=TRACE_SWING_LINK_MAX && distAng(traceTargetAngle(p,p.hitTime+p.duration),n.angle)<Math.PI*.12);
        if(needsTrace && !link){ if(t>n.hitTime+.26) miss(n,"WRONG DIRECTION"); continue; }
        if(debugMode && n.tutorialTraceSwingRuntime){
          const logNow=performance.now();
          const phase=tutorialState.traceSwingPhase||"-";
          const resultState=n.done?"DONE":(n.missed?"MISS":"PENDING");
          const logState=`${phase}:${resultState}`;
          const important=new Set(["TRACE_ACTIVE","TRACE_COMPLETE","SWING_ARMING","SWING_ACTIVE","DONE","MISS"]).has(phase) || resultState==="DONE" || resultState==="MISS";
          if((important && logState!==lastTraceSwingRuntimeLogState) || logNow-lastTraceSwingRuntimeLogAt>=250){
            lastTraceSwingRuntimeLogAt=logNow;
            lastTraceSwingRuntimeLogState=logState;
            console.log(`[Tutorial Trace Swing]\nphase=${phase}\ntracePassed=${tutorialState.successCount>=1}\ntraceCompletedAt=${tutorialState.traceCompletedAt||0}\nswingArmedAt=${n.swingArmedAt||0}\nswingVisible=${tutorialState.swingVisible===true}\nrawArmVel=${rawArmVel.toFixed(3)}\ndirectedTravel=${(n.swingDirectedTravel||0).toFixed(3)}\nfreshInput=${performance.now()>=(n.swingArmedAt||0)}\nresult=${resultState}`);
          }
        }
        if(t>=n.hitTime-.16&&t<=n.hitTime+.20&&(isAutoActive()||checkSwing(n))){
          if(isAutoActive())logAutoProcessing(n);
          judge(n,Math.abs(t-n.hitTime)<.075?"PERFECT":"GREAT",noteColor(n),{source:isAutoActive()?"auto":(tutorialState.activeInput||"pointer"),reason:isAutoActive()?"AUTO_JUDGEMENT":"USER_JUDGEMENT"});
        }else if(t>n.hitTime+.26){
          miss(n,"WRONG DIRECTION");
        }
        continue;
      }

      if(n.type==="fx"){
        const end=n.hitTime+n.duration;
        if(t>=n.hitTime&&t<=end){
          if(isAutoActive()||(filterHeld&&aligned(n.angle,.020))){
            if(isAutoActive())logAutoProcessing(n);
            n.hold+=dt;
            if(Math.random()<.45)addParticles(cx+Math.cos(n.angle)*hitR,cy+Math.sin(n.angle)*hitR,COLORS.fx,1,.25);
          }
        }
        if(t>end){
          const ratio=n.hold/n.duration;
          if(ratio>=.55)judge(n,ratio>.85?"PERFECT":"GREAT",COLORS.fx,{source:tutorialState.activeInput||"keyboard",reason:"USER_JUDGEMENT"});
          else miss(n,filterHeld?"MOVE CLOSER TO THE PATH":"HOLD THE BUTTON");
        }
        if(t>n.hitTime+.38&&n.hold<.035&&!isAutoActive())miss(n,filterHeld?"MOVE CLOSER TO THE PATH":"HOLD THE BUTTON");
        continue;
      }

      if(n.type.startsWith("slide")){
        const end=n.hitTime+n.duration;
        const a=slideAngle(n,t);
        const held=isAutoActive() || (filterHeld&&aligned(a,.010));
        const color=noteColor(n);
        const isScratch=false;
        if(t>=n.hitTime&&t<=end){
          if(held){
            if(isAutoActive())logAutoProcessing(n);
            n.hold+=dt;
            if(Math.random()<(isScratch?.72:.60))addParticles(cx+Math.cos(a)*hitR,cy+Math.sin(a)*hitR,color,1,isScratch?.30:.22);
          }
        }
        if(t>end){
          const ratio=n.hold/n.duration;
          if(ratio>=.58)judge(n,ratio>.88?"PERFECT":"GREAT",color,{source:tutorialState.activeInput||"keyboard",reason:"USER_JUDGEMENT"});
          else miss(n,filterHeld?"FOLLOW THE CURRENT TARGET":"HOLD THE BUTTON");
        }
        if(t>n.hitTime+.40&&n.hold<.03&&!isAutoActive())miss(n,filterHeld?"FOLLOW THE CURRENT TARGET":"HOLD THE BUTTON");
        continue;
      }

      if(n.type.startsWith("scratch")){
        if(t>=n.hitTime-.16&&t<=n.hitTime+.20&&(isAutoActive()||checkScratch(n,t))){
          if(isAutoActive())logAutoProcessing(n);
          judge(n,Math.abs(t-n.hitTime)<.075?"PERFECT":"GREAT",noteColor(n),{source:isAutoActive()?"auto":(tutorialState.activeInput||"pointer"),reason:isAutoActive()?"AUTO_JUDGEMENT":"USER_JUDGEMENT"});
        }else if(t>n.hitTime+.26){
          miss(n,scratchHeld?"WRONG DIRECTION":"HOLD THE BUTTON");
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

    if(tutorialMode){
      // A quiet tutorial background: one play ring, one outer boundary and
      // small lane ticks. The normal decorative grid/radials are intentionally
      // hidden so the note and judgement guide do not overlap visual noise.
      ctx.save();ctx.translate(cx,cy);
      const center=ctx.createRadialGradient(0,0,baseR*.06,0,0,baseR*.78);
      center.addColorStop(0,"rgba(0,0,0,.97)");
      center.addColorStop(.7,"rgba(2,7,17,.88)");
      center.addColorStop(1,"rgba(3,8,18,.28)");
      ctx.fillStyle=center;ctx.beginPath();ctx.arc(0,0,baseR*.80,0,TAU);ctx.fill();
      ctx.strokeStyle="rgba(92,255,251,.24)";ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,hitR,0,TAU);ctx.stroke();
      ctx.strokeStyle="rgba(141,107,255,.10)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,outerR,0,TAU);ctx.stroke();
      for(let i=0;i<8;i++){
        const a=laneAngle(i);
        ctx.strokeStyle=i%2===0?"rgba(255,255,255,.14)":"rgba(255,255,255,.08)";
        ctx.lineWidth=i%2===0?2:1.5;
        ctx.beginPath();ctx.moveTo(Math.cos(a)*(hitR-10),Math.sin(a)*(hitR-10));ctx.lineTo(Math.cos(a)*(hitR+10),Math.sin(a)*(hitR+10));ctx.stroke();
      }
      ctx.fillStyle="#030711";ctx.beginPath();ctx.arc(0,0,baseR*.34,0,TAU);ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save(); ctx.translate(cx,cy);
    const center=ctx.createRadialGradient(0,0,baseR*.08,0,0,baseR*.62);
    center.addColorStop(0,"rgba(0,0,0,.97)");
    center.addColorStop(.64,"rgba(2,6,15,.91)");
    center.addColorStop(1,"rgba(3,8,18,.18)");
    ctx.fillStyle=center; ctx.beginPath(); ctx.arc(0,0,baseR*.64,0,TAU); ctx.fill();

    // Clean default playfield: one clear judgement ring, one faint helper ring,
    // and eight short direction ticks. Dense radials, moving grids, labels and
    // oversized decorative circles are removed so notes and TRACE paths stay first.
    ctx.strokeStyle="rgba(92,255,251,.34)"; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,hitR,0,TAU); ctx.stroke();
    ctx.strokeStyle="rgba(141,107,255,.075)"; ctx.lineWidth=1.25; ctx.beginPath(); ctx.arc(0,0,baseR*.62,0,TAU); ctx.stroke();
    const tickDivisions=mapMode==="tech"?16:8;
    for(let i=0;i<tickDivisions;i++){
      const a=-Math.PI/2 + i*TAU/tickDivisions;
      const primary=i%2===0 || tickDivisions===8;
      ctx.strokeStyle=primary?"rgba(210,230,245,.17)":"rgba(210,230,245,.055)";
      ctx.lineWidth=primary?2:1;
      const inner=primary?11:7, outer=primary?11:7;
      ctx.beginPath(); ctx.moveTo(Math.cos(a)*(hitR-inner),Math.sin(a)*(hitR-inner)); ctx.lineTo(Math.cos(a)*(hitR+outer),Math.sin(a)*(hitR+outer)); ctx.stroke();
    }
    ctx.fillStyle="#030711"; ctx.beginPath(); ctx.arc(0,0,baseR*.30,0,TAU); ctx.fill();
    ctx.strokeStyle="rgba(92,255,251,.10)"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(0,0,baseR*.30,0,TAU); ctx.stroke();
    ctx.restore();
  }

  function visualArmProfile(){
    return {arcWidth:9, centerLineWidth:2.75, endpointRadius:6, underlayWidth:14, markerThresholdDegrees:2};
  }

  function judgementMarkerVisibleFor(visualAngle, judgementAngle, hasMagnet=false){
    return !!hasMagnet || distAng(visualAngle,judgementAngle)>=visualArmProfile().markerThresholdDegrees*Math.PI/180;
  }

  function judgementMarkerVisible(){
    return judgementMarkerVisibleFor(visualArmAngle,judgementAimAngle,magnetTarget);
  }

  function drawArm(){
    const profile=visualArmProfile();
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(visualArmAngle);
    const c=filterHeld?COLORS.fx:"#5cfffb";
    ctx.save(); ctx.shadowBlur=5*visualScale("effect"); ctx.shadowColor=c; ctx.lineCap="round";
    // A restrained underlay keeps the arm legible without becoming a second ring.
    ctx.strokeStyle="rgba(255,255,255,.055)"; ctx.lineWidth=profile.underlayWidth; ctx.beginPath(); ctx.arc(0,0,hitR,-DIAL_ARC_VISUAL,DIAL_ARC_VISUAL); ctx.stroke();
    ctx.strokeStyle=c; ctx.lineWidth=profile.arcWidth; ctx.beginPath(); ctx.arc(0,0,hitR,-DIAL_ARC_HALF,DIAL_ARC_HALF); ctx.stroke();
    if(magnetTarget){ ctx.strokeStyle="rgba(255,255,255,.48)"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,hitR+9,-DIAL_ARC_HALF*.62,DIAL_ARC_HALF*.62); ctx.stroke(); }
    ctx.fillStyle=c; ctx.beginPath(); ctx.arc(hitR,0,profile.endpointRadius,0,TAU); ctx.fill(); ctx.restore();
    ctx.shadowBlur=4*visualScale("effect"); ctx.shadowColor=c; ctx.strokeStyle=c; ctx.lineWidth=profile.centerLineWidth; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(baseR*.33,0); ctx.lineTo(hitR*.93,0); ctx.stroke();
    ctx.restore();
    // Only distinguish the real judgement angle when it is meaningfully separate from the visible arm.
    if(judgementMarkerVisible()){
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(judgementAimAngle); ctx.strokeStyle="rgba(255,255,255,.92)"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(hitR,0,5.5,0,TAU); ctx.stroke(); ctx.restore();
    }
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
    // drawDirectedArcSegments expects the canvas transform to be at identity.
    // It clips with absolute cx/cy, then applies the cx/cy translation internally.
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
    ctx.shadowBlur=8*visualScale("effect");
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
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(n.angle); ctx.strokeStyle="rgba(3,7,17,.82)"; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(r-7,-7); ctx.lineTo(r+7,7); ctx.stroke(); ctx.restore();
    drawRingLabel("CUT",n.angle,r,focus?"#ffffff":color,focus?12:10);
  }

  function traceVisualProfile(){
    const compact=isMobileViewport();
    return {futureWidth:compact?4:5, pastWidth:3, activeOuterWidth:compact?18:21, activeInnerWidth:compact?6:8, targetDotRadius:6, targetRingRadius:12};
  }

  function drawTrace(n,t){
    const active=t>=n.hitTime, focus=n===focusNote, motion=resolveTraceMotion(n), full=motion.signedSweepAngle;
    const r=active?hitR:clamp(noteR(n,t)-10,hitR-14,outerR-18), progress=active?(n.progressRatio||0):0;
    const dir=full>=0?1:-1;
    const visual=traceVisualProfile();
    const pathScale=visualScale("path");
    // A thin blue future route and a bright completed arc communicate travel, not target chasing.
    drawDirectedArcSegments(r,motion.startAngle,full,`rgba(67,136,255,${.28*pathScale})`,visual.futureWidth,1,null,0);
    if(progress>0) drawDirectedArcSegments(r,motion.startAngle,full*progress,"rgba(104,181,255,.98)",visual.pastWidth+1,1,COLORS.trace,4);
    ctx.save(); ctx.translate(cx,cy); ctx.lineCap="round";
    const marker=(a,color,label,size)=>{ const x=Math.cos(a)*r,y=Math.sin(a)*r; ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,size,0,TAU);ctx.fill();ctx.fillStyle="#071326";ctx.font="900 9px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(label,x,y+.5); };
    marker(motion.startAngle,"#fff","S",7); marker(motion.finalAngle,"#ffe15a","E",8);
    const arrows=Math.max(1,Math.ceil(Math.abs(full)/(Math.PI*.55)));
    for(let i=1;i<=arrows;i++){ const a=motion.startAngle+full*(i/(arrows+1));ctx.save();ctx.translate(Math.cos(a)*r,Math.sin(a)*r);ctx.rotate(a+(dir>0?Math.PI/2:-Math.PI/2));ctx.fillStyle="rgba(139,188,255,.92)";ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-5,-4);ctx.lineTo(-2,0);ctx.lineTo(-5,4);ctx.closePath();ctx.fill();ctx.restore(); }
    if(focus&&active){ const turns=n.requiredTravel ? n.directedTravel/n.requiredTravel : 0;ctx.fillStyle="#d9e9ff";ctx.font="800 11px system-ui";ctx.textAlign="center";ctx.fillText(n.requiredTravel>=TAU?`${turns.toFixed(1)} / ${(n.requiredTravel/TAU).toFixed(1)} TURN`:`TRACE ${Math.round(progress*100)}%`,0,-Math.max(34,r*.26)); if((n.reverseTravel||0)>.08){ctx.fillStyle="#ff6c80";ctx.fillText("↶",0,-Math.max(18,r*.15));} }
    ctx.restore();
  }

  function linkedTraceForSwing(n){
    return chart.find(p=>p.type?.startsWith("trace") && p.completed && p.endpointCaptured && !p.missed && p.hitTime+p.duration<=n.hitTime && n.hitTime-(p.hitTime+p.duration)>=TRACE_SWING_LINK_MIN && n.hitTime-(p.hitTime+p.duration)<=TRACE_SWING_LINK_MAX && distAng(traceTargetAngle(p,p.hitTime+p.duration),n.angle)<Math.PI*.12);
  }
  function drawSwing(n,t){
    const link=linkedTraceForSwing(n);
    if(link){
      const ratio=clamp((t-link.hitTime)/Math.max(link.duration,.001),0,1);
      if(ratio<.78)return;
      ctx.globalAlpha=ratio<1?lerp(.22,.55,clamp((ratio-.78)/.22,0,1)):1;
    }
    const color=noteColor(n), dir=n.type==="swingCW"?1:-1;
    const k=progress(n,t);
    const r=lerp(outerR, hitR, k);
    const center=n.angle;
    const span=Math.PI*.24;
    const startA=center-dir*span*.5;
    const amount=dir*span;
    const linkDir=link?Math.sign(slideDelta(link)||dir):0;
    const isReversal=!!(link && linkDir && linkDir!==dir);

    drawDirectedArcSegments(r,startA,amount,`rgba(255,255,255,${n===focusNote?.22:.12})`,n===focusNote?NOTE_WIDTHS.swing+4:NOTE_WIDTHS.swing,1,color,n===focusNote?12:6);
    drawDirectedArcSegments(r,startA,amount,color,n===focusNote?NOTE_WIDTHS.swing+1:NOTE_WIDTHS.swing,n===focusNote?.82:.64,color,n===focusNote?14:7);

    const arrowA=startA+amount;
    ctx.save();
    ctx.translate(cx+Math.cos(arrowA)*r,cy+Math.sin(arrowA)*r);
    ctx.rotate(arrowA + (dir>0 ? Math.PI/2 : -Math.PI/2));
    ctx.fillStyle="rgba(255,255,255,.94)";
    ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-8,-8);ctx.lineTo(-4,0);ctx.lineTo(-8,8);ctx.closePath();ctx.fill();
    ctx.restore();

    drawRingLabel(isReversal?"REV":(link?"EXIT":(dir>0?"↻":"↺")),center,r+24,isReversal?"rgba(255,114,214,.9)":"rgba(255,255,255,.86)",n===focusNote?18:14);
    ctx.globalAlpha=1;
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
      ctx.shadowBlur=9*visualScale("effect");
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
      ctx.shadowBlur=(10+8*pulse)*visualScale("effect");
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
      ctx.globalAlpha=clamp(p.life/.45,0,1)*visualScale("effect"); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,2.4,0,TAU); ctx.fill(); ctx.globalAlpha=1;
    }
    for(let i=waves.length-1;i>=0;i--){
      const w=waves[i]; w.life-=dt; if(w.life<=0){waves.splice(i,1);continue;}
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(w.angle); ctx.globalAlpha=clamp(w.life/.28,0,1)*visualScale("effect");
      ctx.strokeStyle=w.color; ctx.lineWidth=3.5; ctx.beginPath(); ctx.arc(hitR,0,18+(1-w.life/.38)*28,0,TAU); ctx.stroke(); ctx.restore(); ctx.globalAlpha=1;
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
  function formatNoteContrast(){ return "NOTE CONTRAST " + visualSettings.noteContrast; }
  function formatPathBrightness(){ return "PATH BRIGHTNESS " + visualSettings.pathBrightness; }
  function formatEffectIntensity(){ return "EFFECT INTENSITY " + visualSettings.effectIntensity; }
  function formatJudgeGuide(){ return "JUDGE GUIDE " + visualSettings.judgeGuide; }
  function formatAimStabilizer(){ return "AIM STABILIZER " + inputSettings.aimStabilizer; }
  function formatAimVisual(){ return "AIM VISUAL " + inputSettings.aimVisual; }
  function formatVisualResponse(){ return "VISUAL RESPONSE " + inputSettings.aimVisualResponse; }
  function effectivePcAimMode(){ return inputSettings.pcAimMode==="LOCKED" ? "LOCKED" : "ABSOLUTE"; }
  function formatPcAim(){ return "PC AIM " + inputSettings.pcAimMode + (inputSettings.pcAimMode==="AUTO" ? " · ABSOLUTE" : ""); }
  function formatLockedSensitivity(){ return "LOCKED AIM SENSITIVITY " + inputSettings.lockedAimSensitivity.toFixed(2)+"x"; }
  function cyclePcAim(){ const i=PC_AIM_MODES.indexOf(inputSettings.pcAimMode); inputSettings.pcAimMode=PC_AIM_MODES[(i+1)%PC_AIM_MODES.length]; pointerLockFallback=false; if(inputSettings.pcAimMode!=="LOCKED") releasePointerLock(); saveInputSettings(); updateButtons(); }
  function cycleLockedSensitivity(){ inputSettings.lockedAimSensitivity=finiteRange(Math.round((inputSettings.lockedAimSensitivity+.05)*20)/20,.5,2,1); if(inputSettings.lockedAimSensitivity>=2) inputSettings.lockedAimSensitivity=.5; saveInputSettings(); updateButtons(); }
  function cycleAimStabilizer(){ const idx=AIM_STABILIZER_MODES.indexOf(inputSettings.aimStabilizer); inputSettings.aimStabilizer=AIM_STABILIZER_MODES[(idx+1)%AIM_STABILIZER_MODES.length]; saveInputSettings(); updateButtons(); }
  function cycleAimVisual(){ const idx=AIM_VISUAL_MODES.indexOf(inputSettings.aimVisual); inputSettings.aimVisual=AIM_VISUAL_MODES[(idx+1)%AIM_VISUAL_MODES.length]; visualArmAngle=judgementAimAngle; saveInputSettings(); updateButtons(); }
  function cycleVisualResponse(){ const idx=AIM_VISUAL_RESPONSE_MODES.indexOf(inputSettings.aimVisualResponse); inputSettings.aimVisualResponse=AIM_VISUAL_RESPONSE_MODES[(idx+1)%AIM_VISUAL_RESPONSE_MODES.length]; visualArmAngle=judgementAimAngle; saveInputSettings(); updateButtons(); }
  function cycleVisualSetting(key){ const list=VISUAL_CHOICES[key]; const idx=list.indexOf(visualSettings[key]); visualSettings[key]=list[(idx+1)%list.length]; saveVisualSettings(); updateButtons(); }
  function refreshSettingsUI(){ updateButtons(); }

  function setAutoPlayEnabled(enabled, source="unknown"){
    const next=!!enabled;
    if(gameState.autoEnabled===next){
      updateButtons();
      safeRefresh();
      updateDebugOverlay(now());
      return;
    }
    gameState.autoEnabled=next;
    if(mobileDebug || debugMode) console.log(`[Auto] source=${source} enabled=${gameState.autoEnabled}`);
    updateButtons();
    safeRefresh();
    updateDebugOverlay(now());
  }

  function toggleAuto(source="unknown"){
    setAutoPlayEnabled(!gameState.autoEnabled, source);
  }

  function formatMobileQuality(){ return "MOBILE QUALITY " + getMobileQuality(); }
  function formatHaptic(){ return "HAPTIC " + (inputSettings.haptic?"ON":"OFF"); }
  function cycleMobileQuality(){ const i=MOBILE_QUALITY_MODES.indexOf(getMobileQuality()); inputSettings.mobileQuality=MOBILE_QUALITY_MODES[(i+1)%MOBILE_QUALITY_MODES.length]; SESSION_QUALITY.autoDprCap=1.5; SESSION_QUALITY.effectMode="NORMAL"; saveInputSettings(); resize(); refreshStaticUi(); }
  function toggleHaptic(){ inputSettings.haptic=!inputSettings.haptic; saveInputSettings(); refreshStaticUi(); }

  function setTextIfChanged(el,value){ if(!el) return; const v=String(value); if(el.textContent!==v) el.textContent=v; }
  function cacheDynamicDomRefs(root=document){
    domCache.songAutoBtn=root.querySelector ? root.querySelector("[data-auto-play]") : null;
    domCache.songAutoState=domCache.songAutoBtn ? domCache.songAutoBtn.querySelector("span") : null;
    domCache.hudSongTitle=document.querySelector(".hudSong span");
  }
  function updateLiveHud(liveStats){
    score = tutorialMode ? 0 : liveStats.score;
    const hudNow=performance.now();
    const nextScore=Math.floor(score);
    const nextAccuracy=(liveStats.accuracy*100).toFixed(2)+"%";
    if(hudNow-hudCache.lastAt<=66 && hudCache.score===nextScore && hudCache.combo===combo && hudCache.accuracy===nextAccuracy) return;
    hudCache.lastAt=hudNow;
    hudCache.score=nextScore; hudCache.combo=combo; hudCache.accuracy=nextAccuracy;
    setTextIfChanged(scoreBox,hudCache.score);
    setTextIfChanged(comboBox,hudCache.combo);
    setTextIfChanged(accuracyBox,hudCache.accuracy);
    if(tutorialMode){
      const st=tutorialSteps[tutorialStepIndex];
      if(domCache.hudSongTitle) setTextIfChanged(domCache.hudSongTitle,"TUTORIAL");
      setTextIfChanged(mapBox, st ? `STEP ${tutorialStepIndex+1} / ${tutorialSteps.length}` : "STEP");
      if(difficultyBox) setTextIfChanged(difficultyBox, st?.name || "");
    }
  }
  function refreshStaticUi(){
    applyMusicVolume();
    autoBox.textContent=gameState.autoEnabled?"AUTO ON":"AUTO OFF";
    if(domCache.songAutoBtn){
      domCache.songAutoBtn.classList.toggle("on",gameState.autoEnabled);
      if(domCache.songAutoState) setTextIfChanged(domCache.songAutoState,gameState.autoEnabled ? "ON" : "OFF");
    }
    if(tutorialMode){
      const st=tutorialSteps[tutorialStepIndex];
      if(domCache.hudSongTitle) setTextIfChanged(domCache.hudSongTitle,"TUTORIAL");
      mapBox.textContent = st ? `STEP ${tutorialStepIndex+1} / ${tutorialSteps.length}` : "STEP";
      if(difficultyBox) difficultyBox.textContent = st?.name || "";
    }else{
      const difficultyLabel=getActiveDifficultyLabel(selectedSong,mapMode);
      const hudModeLabel = difficultyLabel + " " + formatDifficulty(mapMode);
      mapBox.textContent=((selectedSong?.title || "") + " · " + hudModeLabel).trim();
      if(domCache.hudSongTitle) domCache.hudSongTitle.textContent = "";
      if(difficultyBox) difficultyBox.textContent=difficultyLabel + " " + formatDifficulty(mapMode);
    }
    autoToggle.textContent=gameState.autoEnabled?"AUTO ON":"AUTO OFF";
    autoToggle.classList.toggle("on",gameState.autoEnabled);
    mapToggle.textContent=mapMode==="tech"?"MAP TECH":"MAP NORMAL";
    mapToggle.classList.toggle("on",mapMode==="tech");
    if(speedValue) speedValue.textContent = formatSpeed();
    if(offsetValue) offsetValue.textContent = formatOffset();
    if(sfxValue) sfxValue.textContent = formatSfx();
    if(musicValue) musicValue.textContent = formatMusic();
    if(pauseSetNoteContrast) pauseSetNoteContrast.textContent = formatNoteContrast();
    if(pauseSetPathBrightness) pauseSetPathBrightness.textContent = formatPathBrightness();
    if(pauseSetEffectIntensity) pauseSetEffectIntensity.textContent = formatEffectIntensity();
    if(pauseSetJudgeGuide) pauseSetJudgeGuide.textContent = formatJudgeGuide();
    if(pauseSetAimStabilizer) pauseSetAimStabilizer.textContent = formatAimStabilizer();
    if(pauseSetAimVisual) pauseSetAimVisual.textContent = formatAimVisual();
    if(pauseSetVisualResponse){ pauseSetVisualResponse.textContent=formatVisualResponse(); pauseSetVisualResponse.hidden=inputSettings.aimVisual!=="SMOOTH"; }
    if(pauseSetPcAim) pauseSetPcAim.textContent=formatPcAim(); if(pauseSetLockedSensitivity) pauseSetLockedSensitivity.textContent=formatLockedSensitivity();
    if(pauseSetMobileQuality) pauseSetMobileQuality.textContent = formatMobileQuality();
    if(pauseSetHaptic) pauseSetHaptic.textContent = formatHaptic();
    if(typeof safeRefresh === "function") safeRefresh();
  }
  const updateButtons=refreshStaticUi;


  function hideResult(){
    if(resultOverlay) resultOverlay.classList.remove("show","newRecord");
  }


  function updateAppHeight(){
    const h=Math.max(1, Math.floor(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || H || 1));
    document.documentElement.style.setProperty("--app-height", `${h}px`);
  }
  function setGameplayScrollLocked(locked){
    if(locked===gameplayScrollLocked) return;
    gameplayScrollLocked=locked;
    if(locked){
      gameplayScrollX=window.scrollX||0; gameplayScrollY=window.scrollY||0; updateAppHeight(); window.scrollTo(0,0);
      document.documentElement.classList.add("gameplayScrollLocked"); document.body.classList.add("gameplayScrollLocked");
    }else{
      document.documentElement.classList.remove("gameplayScrollLocked"); document.body.classList.remove("gameplayScrollLocked");
      window.scrollTo(gameplayScrollX||0, gameplayScrollY||0);
    }
  }
  function handleGameplayTouchMove(e){
    if(!gameplayScrollLocked) return;
    const target=e.target;
    if(target===canvas || target===gameRoot || gameRoot.contains(target)){ if(e.cancelable) e.preventDefault(); }
  }

  function cleanupPlaySession({stopAudio=true, hideResultOverlay=true, abort=true}={}){
    // A normal session transition must never leave a diagnostic surface above
    // the title/start controls, including direct-play startup.
    deactivateSelfTestSurface?.({releaseInputs:true});
    releasePointerLock();
    if(abort) abortingRun=true;
    completionPending=false;
    if(completionTimer){ clearTimeout(completionTimer); completionTimer=0; }
    running=false;
    paused=false;
    pauseSettingsOpen=false;
    fullscreenInterrupted=false;
    Object.keys(keys).forEach(k=>{ keys[k]=false; });
    keyA=false; keyD=false; filterHeld=false; forceReleaseScratch(); mouseDownRight=false;
    if(raf){ cancelAnimationFrame(raf); raf=0; }
    if(pauseOverlay) pauseOverlay.classList.remove("show");
    if(pauseRetry) pauseRetry.textContent="RETRY";
    if(pauseSettingsOverlay) pauseSettingsOverlay.classList.remove("show");
    document.body.classList.remove("pausedInputBlocked", "pauseSettingsOpen", "showSettings");
    settingsVisible=false;
    setPauseMessage("");
    if(stopAudio){ stopSongPreview(); try{ pauseSong("pause"); }catch(e){} }
    if(hideResultOverlay) hideResult();
    setCleanGameplay(false);
    setGameplayScrollLocked(false);
  }

  function finalizeRemainingMisses(){
    for(const note of chart){
      if(!note.done && !note.missed) miss(note);
    }
  }

  function buildResultData(){
    finalizeRemainingMisses();
    const stats=calculateScoreStats();
    if(!stats.ok) return null;
    const rank=calculateRank(stats.accuracy);
    const difficulty=getDifficulty(mapMode);
    const power=calculatePower({stars:difficulty?.stars, accuracyRatio:stats.accuracy, comboRatio:stats.comboRatio, missCount, totalNotes:stats.totalNotes});
    return {
      songTitle:selectedSong?.title || "UNKNOWN",
      difficulty:mapMode,
      difficultyLabel:getActiveDifficultyLabel(selectedSong,mapMode),
      starLevel:formatDifficulty(mapMode),
      stars:difficulty?.stars,
      finalScore:stats.score,
      power,
      accuracyRatio:stats.accuracy,
      perfectCount, greatCount, missCount, maxCombo,
      totalNotes:stats.totalNotes,
      rank,
      autoPlay:!!gameState.autoEnabled
    };
  }

  function animateResultScore(finalScore){
    if(!resultScore) return;
    const start=performance.now();
    const duration=650;
    function tick(ms){
      if(!resultOverlay?.classList.contains("show")) return;
      const p=clamp((ms-start)/duration,0,1);
      const eased=1-Math.pow(1-p,3);
      resultScore.textContent=String(Math.round(finalScore*eased)).padStart(7,"0");
      if(p<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }



  const TUTORIAL_COMPLETED_KEY="circleMixTutorialCompleted";
  const TUTORIAL_PROMPT_KEY="circleMixTutorialPromptAnswered";
  function keyLabel(code){ return ({KeyZ:"Z",KeyX:"X",Space:"SPACE",MouseLeft:"LMB",MouseRight:"RMB"})[code] || code.replace(/^Key/,""); }
  function isMobileInput(){ return isMobileViewport && isMobileViewport(); }
  function tutorialInputFor(kind){
    if(isMobileInput()) return ({aim:"터치해서 에임 이동",cut:"화면 탭",hold:"화면을 길게 누르기",slide:"누른 채 목표를 따라가기",trace:"누르지 말고 목표를 따라가기",traceSwing:"TRACE 후 표시 방향으로 짧게 밀기",swing:"표시 방향으로 짧고 빠르게 밀기",scratch:"두 손가락을 누른 채 짧게 긁기",mix:"탭 · 홀드 · 추적 · 스와이프"})[kind] || "화면 터치";
    return ({aim:"마우스 이동 / A·D로 에임 조작",cut:`${keyLabel("KeyZ")} / ${keyLabel("KeyX")} / 마우스 왼쪽`,hold:`${keyLabel("KeyZ")} / ${keyLabel("KeyX")} / 마우스 오른쪽을 길게 누르기`,slide:`${keyLabel("KeyZ")} 또는 ${keyLabel("KeyX")}를 누른 채 따라가기`,trace:"시작점에 맞춘 뒤 표시 방향으로 필요한 만큼 회전하기",traceSwing:"TRACE 완료 후 같은 방향으로 에임을 짧게 튕기기",swing:"표시 방향으로 에임을 짧고 빠르게 움직이기",scratch:"마우스 오른쪽을 누른 채 짧게 긁기",mix:"Z / X / 마우스 입력 + 에임 조작"})[kind] || "입력";
  }
  const tutorialSteps=[
    {name:"에임 · 위치 익히기",kind:"aim",phase:"explore",desc:"노란 목표 안으로 에임을 옮겨 판정 위치를 익혀보세요.",targets:[0,2,5],notes:[]},
    {name:"CUT · 판정 범위",kind:"cut",phase:"explore",desc:"청록색 CUT 영역에 에임을 맞춘 뒤 CUT 입력을 해보세요.",notes:[],targets:[0]},
    {name:"CUT · 가이드",kind:"cut",phase:"guided",desc:"실제 판정 범위를 보며 느린 CUT 두 개를 처리하세요.",notes:[{type:"cut",beat:4,lane:0},{type:"cut",beat:6,lane:2}]},
    {name:"CUT · 흐린 가이드",kind:"cut",phase:"faded",desc:"흐려진 가이드를 참고해 일반 노트 모양에 맞춰 입력하세요.",notes:[{type:"cut",beat:4,lane:5},{type:"cut",beat:5.5,lane:7}]},
    {name:"CUT · 실전 표시",kind:"cut",phase:"standard",desc:"상세 가이드 없이 일반 CUT 두 개를 처리하세요.",notes:[{type:"cut",beat:4,lane:0},{type:"cut",beat:5.5,lane:2}]},
    {name:"HOLD · 가이드",kind:"hold",phase:"guided",desc:"바깥 호는 위치, 채워지는 중심은 버튼 유지 상태를 뜻합니다.",notes:[{type:"fx",beat:4,lane:1,durationBeat:3},{type:"fx",beat:8,lane:3,durationBeat:2.5}]},
    {name:"HOLD · 실전 표시",kind:"hold",phase:"standard",desc:"일반 표시 상태에서 HOLD 두 개를 끝까지 유지하세요.",notes:[{type:"fx",beat:4,lane:1,durationBeat:2.5},{type:"fx",beat:8,lane:3,durationBeat:2.5}]},
    {name:"SLIDE · 가이드",kind:"slide",phase:"guided",desc:"버튼을 누른 상태와 현재 목표 위치를 따로 확인하며 따라가세요.",notes:[{type:"slideCW",beat:4,lane:6,endLane:2,durationBeat:4},{type:"slideCCW",beat:10,lane:2,endLane:6,durationBeat:4}]},
    {name:"SLIDE · 흐린 가이드",kind:"slide",phase:"faded",desc:"버튼을 누른 채 흐린 목표를 끝까지 따라가세요.",notes:[{type:"slideCW",beat:4,lane:6,endLane:2,durationBeat:3.2},{type:"slideCCW",beat:9,lane:2,endLane:6,durationBeat:3.2}]},
    {name:"TRACE · 45° 입문",kind:"trace",phase:"guided",desc:"시작점에 에임을 맞춘 뒤 표시 방향으로 45° 회전하세요.",notes:[{type:"traceCW",beat:4,lane:7,endLane:0,durationBeat:3.2}]},
    {name:"TRACE · 90° 가이드",kind:"trace",phase:"guided",desc:"시작점에서 표시 방향으로 90° 회전하고 끝점에 도달하세요.",notes:[{type:"traceCW",beat:4,lane:7,endLane:1,durationBeat:3}]},
    {name:"TRACE · 180° 가이드",kind:"trace",phase:"guided",desc:"진행 원호를 보며 표시 방향으로 180° 회전하세요.",notes:[{type:"traceCCW",beat:4,lane:3,endLane:7,durationBeat:3.4}]},
    {name:"TRACE · 180° 흐린 가이드",kind:"trace",phase:"faded",desc:"밝은 진행 원호를 채워 끝점까지 회전하세요.",notes:[{type:"traceCW",beat:4,lane:6,endLane:2,durationBeat:2.8}]},
    {name:"TRACE · 실전 표시",kind:"trace",phase:"standard",desc:"일반 플레이와 같은 방식으로 필요한 회전량을 채우세요.",notes:[{type:"traceCCW",beat:4,lane:2,endLane:6,durationBeat:2.5}]},
    {name:"SWING · 가이드",kind:"swing",phase:"guided",desc:"접선 화살표가 가리키는 방향으로 에임을 짧고 빠르게 움직이세요.",notes:[{type:"swingCW",beat:4,lane:2},{type:"swingCCW",beat:6,lane:6}]},
    {name:"SCRATCH · 가이드",kind:"scratch",phase:"guided",desc:"마우스 오른쪽을 누른 채 표시 방향으로 짧게 긁으세요.",notes:[{type:"scratchCW",beat:4,lane:1,endLane:2,durationBeat:.55},{type:"scratchCCW",beat:6,lane:5,endLane:4,durationBeat:.55}]},
    {name:"360° TRACE → SWING",kind:"traceSwing",phase:"TRACE_ACTIVE",desc:"시작점에서 한 바퀴 회전해 끝점에 도달한 뒤 SWING 하세요.",notes:[{type:"traceCW",beat:4,lane:0,endLane:0,durationBeat:2.5,signedSweepAngle:360}]},
    {name:"종합 연습",kind:"mix",phase:"standard",desc:"상세 가이드 없이 배운 노트를 순서대로 처리하세요.",notes:[{type:"cut",beat:4,lane:0},{type:"cut",beat:5,lane:2},{type:"fx",beat:6,lane:4,durationBeat:2},{type:"slideCW",beat:9,lane:6,endLane:1,durationBeat:3},{type:"traceCCW",beat:13,lane:2,endLane:7,durationBeat:2},{type:"swingCW",beat:16,lane:3},{type:"scratchCCW",beat:18,lane:5,endLane:4,durationBeat:.55},{type:"cut",beat:20,lane:7}]}
  ];
  function buildTutorialStepRuntime(idx){
    const nextIndex=clamp(idx,0,tutorialSteps.length-1);
    const step=tutorialSteps[nextIndex];
    if(!step) return {valid:false,error:"MISSING_STEP",index:nextIndex};
    const nextToken=tutorialStepToken + 1;
    if(step.kind==="traceSwing") tutorialState.traceSwingPhase="TRACE_ACTIVE";
    const notes=(step.notes||[]).map(localNoteToGame).map(n=>{
      n.hitTime=n.beat*BEAT;
      n.spawnTime=n.hitTime-APPROACH;
      n.done=false; n.missed=false; n.completed=false; n.hold=0;
      n.tutorialStepToken=nextToken;
      return n;
    }).sort((a,b)=>a.hitTime-b.hitTime);
    return {valid:true,index:nextIndex,step,chart:notes,token:nextToken};
  }
  function buildTutorialChart(step){ return buildTutorialStepRuntime(tutorialSteps.indexOf(step)).chart || []; }
  function showTutorialPrompt(){ if(localStorage.getItem(TUTORIAL_COMPLETED_KEY)==="true"||localStorage.getItem(TUTORIAL_PROMPT_KEY)==="true")return; if(tutorialPrompt)tutorialPrompt.hidden=false; }
  function setTutorialHud(runtime=null){
    const st=runtime?.step || tutorialSteps[tutorialStepIndex];
    const displayIndex=runtime?.index ?? tutorialStepIndex;
    const displayChart=runtime?.chart || chart;
    if(!st)return;
    tutorialHud.hidden=false;
    tutorialStepLabel.textContent=`단계 ${displayIndex+1} / ${tutorialSteps.length}`;
    tutorialTitle.textContent=st.name;
    const nextPending=displayChart.find(n=>!n.done&&!n.missed);
    const pendingKind=nextPending?noteFamily(nextPending.type):st.kind;
    if(st.kind==="traceSwing" && (tutorialState.traceSwingPhase==="SWING_ARMING" || tutorialState.traceSwingPhase==="SWING_ACTIVE" || pendingKind==="swing")) tutorialDesc.textContent="이제 같은 방향으로 에임을 새로 짧게 튕기세요.";
    else if(st.kind==="traceSwing") tutorialDesc.textContent="시작점에서 한 바퀴 회전해 끝점에 도달한 뒤 SWING 하세요.";
    else tutorialDesc.textContent=st.desc;
    const hintKind=(st.kind==="traceSwing"?pendingKind:(st.kind==="mix"?pendingKind:st.kind));
    tutorialInputHint.textContent=(tutorialState.autoSuppressed&&tutorialState.previousAutoEnabled?"튜토리얼에서는 AUTO 비활성 · ":"")+tutorialInputFor(hintKind);
    const requiredTotal=st.kind==="traceSwing"?2:displayChart.length;
    tutorialProgress.textContent=st.targets?`완료 ${st._hit||0} / ${st.targets.length}`:`성공 ${tutorialState.successCount||0} / ${requiredTotal}`;
    updateButtons();
  }

  function resetTraceSwingCarryover(){
    resetAimInput(rawInputAngle);
    // Preserve a baseline so the first post-TRACE movement is not consumed as a rebase.
    aimInput.previousSampleAngle=aimInput.rawAngle=aimInput.unwrappedAngle=rawInputAngle;
    aimInput.rebasePending=false; aimInput.lastSampleTimestamp=performance.now();
    rawArmVel=0; armVel=0; rawAngularVelocity=0; lastRawAngleForVelocity=rawTargetAngle; prevArmAngle=armAngle; magnetTarget=null;
    for(const n of chart){ delete n.swingGestureArmed; delete n.swingDirectedTravel; n.swingLastAngle=rawTargetAngle; }
  }
  function spawnTutorialTraceSwingNote(){
    const st=tutorialSteps[tutorialStepIndex];
    if(!tutorialMode || st?.kind!=="traceSwing") return;
    const tutorialNow=now();
    const activationTime=tutorialNow+.45;
    const hitTime=tutorialNow+.85;
    const n=make("swingCW", hitTime/BEAT, 0, {angleDeg:0});
    n.hitTime=hitTime; n.spawnTime=activationTime; n.done=false; n.missed=false; n.tutorialStepToken=tutorialStepToken; n.tutorialTraceSwingRuntime=true;
    n.swingArmedAt=performance.now()+450; n.swingGestureArmed=false; n.swingDirectedTravel=0; n.swingLastAngle=rawTargetAngle;
    chart=chart.filter(x=>!x.type?.startsWith("swing"));
    chart.push(n); chart.sort((a,b)=>a.hitTime-b.hitTime);
    tutorialState.traceSwingPhase="SWING_ARMING"; tutorialState.swingArmedAt=n.swingArmedAt; tutorialState.swingVisible=false;
    setTutorialHud();
    tutorialSetTimeout(()=>{ tutorialState.traceSwingPhase="SWING_ACTIVE"; tutorialState.swingVisible=true; resetTraceSwingCarryover(); setTutorialHud(); },450);
  }

  function beep(freq=660,dur=.07){ ensureAudioCtx(); const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.frequency.value=freq; o.type="square"; g.gain.value=.035*(sfxEnabled ? clamp(sfxVolume,0,4) : 0); o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+dur); }
  function clearTutorialTimers(){ for(const id of tutorialState.timers) clearTimeout(id); tutorialState.timers=[]; for(const id of tutorialState.rafIds) cancelAnimationFrame(id); tutorialState.rafIds=[]; }
  function tutorialSetTimeout(fn,delay){
    const token=tutorialStepToken, session=tutorialSessionId, attempt=tutorialAttemptId, generation=tutorialTransitionGeneration;
    const id=setTimeout(()=>{
      tutorialState.timers=tutorialState.timers.filter(timerId=>timerId!==id);
      if(!tutorialMode || token!==tutorialStepToken || session!==tutorialSessionId || attempt!==tutorialAttemptId || generation!==tutorialTransitionGeneration) return;
      fn();
    },delay);
    tutorialState.timers.push(id); return id;
  }
  function resetTraceRuntimeState(){
    for(const n of chart){
      if(!n?.type?.startsWith("trace")) continue;
      delete n.validTrackedTime; delete n.traceQualityTime; delete n.activeTraceDuration; delete n.endpointInsideTime;
      delete n.endpointCaptured; delete n.enteredTrace; delete n.lateTraceStart; delete n.lastTraceRegion; delete n.lastTraceEndpointRegion;
      delete n.coverageRatio; delete n.traceQuality; delete n.failReason; delete n.lastTraceReason; delete n.autoProcessingLogged; delete n.autoTraceProgress;
      delete n.swingGestureArmed; delete n.swingLastAngle; delete n.swingDirectedTravel; delete n.swingReverseTravel;
      delete n.scratchGestureArmed; delete n.scratchDirectedTravel; delete n.scratchReverseTravel;
    }
  }
  function resetTutorialRuntimeState(){ tutorialState.successCount=0; tutorialState.mixRetryScheduled=false; tutorialState.chartFinalizationCount=0; tutorialState.lastChartFinalization=null; tutorialState.successStreak=0; tutorialState.failCount=0; tutorialState.phaseCompleted=false; tutorialState.currentJudgement=null; tutorialState.coverageRatio=0; tutorialState.trackedQualityTime=0; tutorialState.endpointCaptured=false; tutorialState.activeInput=null; tutorialState.pointerMoved=false; tutorialState.lastSource=null; tutorialState.validUserInputCount=0; tutorialState.consumedNoteIds.clear(); tutorialState.lastExploreCompletionAt=0; tutorialState.exploreInsideSince=0; tutorialState.traceSwingPhase=null; tutorialState.traceCompletedAt=0; tutorialState.swingArmedAt=0; tutorialState.swingVisible=false; resetTraceRuntimeState(); feedback=[]; particles=[]; waves=[]; ringBursts=[]; scratchBursts=[]; filterHeld=scratchHeld=mouseDownRight=keyA=keyD=false; pointerActive=false; scratchMoveAmount=0; scratchSpeed=0; scratchCandidate=false; scratchThresholdMet=false; lastScratchResult="READY"; scratchHoldEpoch=0; scratchHoldCW=scratchHoldCCW=0; scratchHoldWasActive=false; for(const k of Object.keys(keys)) keys[k]=false; }
  function resetRenderWindow(){ renderWindow.start=0; renderWindow.end=0; renderWindow.notes.length=0; }
  function logTutorialAdvance(reason,extra={}){ if(!debugMode)return; const st=tutorialSteps[tutorialStepIndex]; console.log(`[Tutorial Advance]\nstep=${st?.kind||"-"}\nphase=${st?.phase||"-"}\nreason=${reason}\nsource=${extra.source||tutorialState.lastSource||"-"}\nsuccessCount=${tutorialState.successCount}\nsessionId=${tutorialSessionId}\nstepToken=${tutorialStepToken}\nattemptId=${tutorialAttemptId}\nfunction=${extra.fn||"-"}\ntimer=${!!extra.timer}\nnoteId=${extra.noteId||"-"}\npreviousStepToken=${extra.previousStepToken??tutorialStepToken}\ncurrentStepToken=${tutorialStepToken}`); }
  function tutorialHandleJudgement(ev){
    if(!tutorialMode || tutorialState.transitioning) return;
    if(ev.stepToken!==tutorialStepToken || ev.sessionId!==tutorialSessionId) return;
    if(performance.now()<tutorialState.inputEnabledAt) return;
    tutorialState.currentJudgement=ev.judgement;
    tutorialState.lastSource=ev.source;
    const validSources=new Set(["keyboard","pointer","touch"]);
    if(!validSources.has(ev.source)){ if(ev.source==="auto") logTutorialAdvance("AUTO_JUDGEMENT_BLOCKED",ev); return; }
    if(ev.reason!=="USER_JUDGEMENT") return;
    if(tutorialState.consumedNoteIds.has(ev.noteId)) return;
    tutorialState.consumedNoteIds.add(ev.noteId);
    tutorialState.validUserInputCount++;
    tutorialState.successCount++;
    tutorialState.successStreak++;
    const st=tutorialSteps[tutorialStepIndex];
    if(st?.kind==="traceSwing" && ev.noteType && String(ev.noteType).startsWith("trace")){
      tutorialState.traceSwingPhase="TRACE_COMPLETE"; tutorialState.traceCompletedAt=performance.now();
      resetTraceSwingCarryover(); addFeedback("TRACE 완료",cx,cy-baseR*.34,COLORS.trace); setTutorialHud();
      spawnTutorialTraceSwingNote();
      return;
    }
    if(st?.kind==="traceSwing" && ev.noteType && String(ev.noteType).startsWith("swing")) tutorialState.traceSwingPhase="DONE";
    const required=st?.kind==="traceSwing"?2:Math.max(1,chart.length);
    if(tutorialState.successCount>=required) requestTutorialTransition(tutorialStepIndex+1,{source:"success", reason:"USER_JUDGEMENT", extra:ev});
    else handleFinalMixCompletion();
  }
  function tutorialCompleteExploreTarget(reason,source="pointer"){
    const st=tutorialSteps[tutorialStepIndex]; const nowMs=performance.now();
    if(!tutorialMode||tutorialState.transitioning||!st?.targets||nowMs<tutorialState.inputEnabledAt)return;
    if(nowMs-tutorialState.lastExploreCompletionAt<160)return;
    tutorialState.lastExploreCompletionAt=nowMs; st._hit=(st._hit||0)+1; tutorialState.successCount=st._hit; tutorialState.successStreak++; tutorialState.validUserInputCount++; tutorialState.lastSource=source;
    addWave(laneAngle(st.targets[Math.max(0,st._hit-1)]),COLORS.perfect); beep(780,.05); tutorialState.exploreInsideSince=0;
    if(st._hit>=st.targets.length) requestTutorialTransition(tutorialStepIndex+1,{source:"success", reason, extra:{source,fn:"tutorialCompleteExploreTarget"}});
  }
  function maxPendingTutorialSkips(){ return Math.max(0, tutorialSteps.length - 1 - tutorialStepIndex) + (tutorialStepIndex>=tutorialSteps.length-1 ? 1 : 0); }
  function queueTutorialSkip(extra={}){
    if(!tutorialMode || tutorialState.completing) return;
    const cap=maxPendingTutorialSkips();
    if(tutorialState.pendingSkipQueue.length>=cap) return;
    tutorialState.pendingSkipQueue.push({reason:"SKIP_BUTTON", source:"skip", extra, queuedAt:performance.now()});
  }
  function drainTutorialSkipQueue(){
    if(!tutorialMode || tutorialState.transitionState!=="IDLE" || tutorialState.completing) return;
    const item=tutorialState.pendingSkipQueue.shift();
    if(!item) return;
    requestTutorialTransition(tutorialStepIndex+1,{source:"skip",reason:"SKIP_BUTTON",skipCountdown:true,extra:item.extra});
  }
  function requestTutorialTransition(nextIndex,{source="success",reason="USER_JUDGEMENT",skipCountdown=false,extra={}}={}){
    if(!tutorialMode || tutorialState.completing)return;
    if(tutorialState.transitionState!=="IDLE"){
      if(source==="skip" || reason==="SKIP_BUTTON") queueTutorialSkip(extra);
      return;
    }
    if(source!=="skip" && reason!=="SKIP_BUTTON" && tutorialState.validUserInputCount<=0){ if(debugMode) console.warn("[Tutorial] blocked advance without valid user input", {reason,step:tutorialSteps[tutorialStepIndex]?.name}); return; }
    if(nextIndex<=tutorialStepIndex && nextIndex<tutorialSteps.length) return;
    if(nextIndex>=tutorialSteps.length) return completeTutorial();
    tutorialLastAdvanceReason=reason; tutorialLastAdvanceSource=source;
    logTutorialAdvance(reason,extra);
    enterTutorialStep(nextIndex,{source,skipCountdown});
  }
  function advanceTutorialPhase(reason="USER_JUDGEMENT",extra={}){ requestTutorialTransition(tutorialStepIndex+1,{source:reason==="SKIP_BUTTON"?"skip":"success",reason,skipCountdown:reason==="SKIP_BUTTON",extra}); }
  function enterTutorialStep(idx,{source="success",skipCountdown=false}={}){
    const runtime=buildTutorialStepRuntime(idx);
    if(!runtime.valid){ console.error("[Tutorial] invalid step", runtime); return; }
    tutorialTransitionGeneration++; tutorialState.transitionState="PREPARING"; tutorialState.transitioning=true; tutorialState.phaseCompleted=true;
    clearTutorialTimers(); tutorialAttemptId++;
    tutorialStepToken=runtime.token;
    chart=[]; resetRenderWindow(); chartLastHitEnd=0; feedback=[]; particles=[]; waves=[]; ringBursts=[]; scratchBursts=[];
    tutorialStepIndex=runtime.index;
    const st=runtime.step; st._hit=0; st._done=false;
    resetTutorialRuntimeState();
    resetAimInput(-Math.PI/2);
    if(runtime.step.kind==="traceSwing") tutorialState.traceSwingPhase="TRACE_ACTIVE";
    const fullSessionStart=source==="replay" || !running || activeSceneName()!=="game";
    if(fullSessionStart) cleanupPlaySession({stopAudio:true,hideResultOverlay:true,abort:true});
    tutorialMode=true; tutorialState.autoSuppressed=true; tutorialState.transitionState="READY"; tutorialState.transitioning=true;
    document.body.classList.add("tutorialMode","tutorialIntro"); if(fullSessionStart) resize();
    abortingRun=false; resultShown=false; completionPending=false; paused=false; running=true; setGameplayScrollLocked(true); if(fullSessionStart) notifyPwaGameplay();
    // Tutorial retries replace the chart while preserving the gameplay RAF.
    // Reset the chart-indexed render cache in the same lifecycle operation.
    chart=runtime.chart; resetRenderWindow();
    score=combo=maxCombo=judgedCount=perfectCount=greatCount=missCount=actualHitValue=0; maxHitValue=chart.reduce((sum,n)=>sum+noteWeight(n),0)||1;
    setCleanGameplay(true); if(fullSessionStart || activeSceneName()!=="game") safeSetState("game"); startLayer.style.display="none";
    mouseX=cx; mouseY=cy-hitR; armAngle=targetAngle=prevArmAngle=rawTargetAngle=stabilizedTargetAngle=lastValidTargetAngle=lastRawAngleForVelocity=-Math.PI/2; magnetTarget=null; centerDeadzoneActive=false;
    const leadMs=source==="replay"?3000:(skipCountdown?120:(source==="retry"?650:560));
    tutorialCountdownUntil=performance.now()+leadMs; tutorialState.inputEnabledAt=performance.now()+leadMs+60; audioStartedAt=performance.now()+leadMs; startMs=audioStartedAt; lastMs=performance.now();
    setTutorialHud(runtime);
    if(source==="replay"){ ["3","2","1","시작"].forEach((txt,i)=>tutorialSetTimeout(()=>{ tutorialCountdown.textContent=txt; beep(520+i*110,.06); },i*720)); }
    else tutorialCountdown.textContent=skipCountdown?"다음 단계":"준비";
    tutorialSetTimeout(()=>{ tutorialCountdown.textContent=""; document.body.classList.remove("tutorialIntro"); if(fullSessionStart) resize(); tutorialState.transitionState="IDLE"; tutorialState.transitioning=false; drainTutorialSkipQueue(); },leadMs);
    if(!raf) raf=requestAnimationFrame(frame);
  }
  function startTutorialStep(idx=tutorialStepIndex,{startMode="initial"}={}){ enterTutorialStep(idx,{source:startMode==="initial"?"replay":(startMode==="restart"?"retry":startMode),skipCountdown:startMode==="skip"}); }
  function startTutorial(){ deactivateSelfTestSurface?.({releaseInputs:true}); localStorage.setItem(TUTORIAL_PROMPT_KEY,"true"); if(tutorialPrompt)tutorialPrompt.hidden=true; if(tutorialComplete)tutorialComplete.hidden=true; tutorialSessionId++; tutorialState.completing=false; tutorialState.pendingSkipQueue=[]; tutorialState.mixRetryCount=0; tutorialState.completeCount=0; tutorialState.previousAutoEnabled=gameState.autoEnabled; tutorialState.autoSuppressed=true; enterTutorialStep(0,{source:"replay",skipCountdown:false}); }
  function nextTutorialStep(event){
    if(!tutorialMode)return;
    // The final pointerdown used to replace the HUD before pointerup, allowing
    // that release to activate the replay button underneath on touch layouts.
    // Finish on the matching release so the original skip button owns the full
    // gesture; direct/test calls without an event remain synchronous.
    if(event?.type==="pointerdown" && tutorialStepIndex>=tutorialSteps.length-1){
      const pointerId=event.pointerId;
      const finish=release=>{
        if(release.pointerId!==pointerId)return;
        window.removeEventListener("pointerup",finish,true);
        window.removeEventListener("pointercancel",finish,true);
        nextTutorialStep();
      };
      window.addEventListener("pointerup",finish,true);
      window.addEventListener("pointercancel",finish,true);
      return;
    }
    requestTutorialTransition(tutorialStepIndex+1,{source:"skip",reason:"SKIP_BUTTON",skipCountdown:true,extra:{source:"button",fn:"nextTutorialStep"}});
  }
  function restartTutorialStep(){ if(!tutorialMode)return; enterTutorialStep(tutorialStepIndex,{source:"retry",skipCountdown:false}); }
  function restoreTutorialAuto(){ tutorialState.autoSuppressed=false; setAutoPlayEnabled(!!tutorialState.previousAutoEnabled, "tutorial-restore"); }
  function exitTutorial(toTitle=true){ clearTutorialTimers(); resetAimInput(-Math.PI/2); tutorialMode=false; restoreTutorialAuto(); document.body.classList.remove("tutorialMode","tutorialIntro","tutorialSidePanel","tutorialTopPanel"); resize(); if(tutorialHud)tutorialHud.hidden=true; cleanupPlaySession({stopAudio:true,hideResultOverlay:true,abort:true}); notifyPwaGameplay(); chart=[]; resetRenderWindow(); chartLastHitEnd=0; startLayer.style.display="flex"; if(toTitle) showTitleMenu(); }
  function completeTutorial(){
    if(tutorialState.completing) return;
    resetAimInput(-Math.PI/2);
    tutorialState.completing=true; tutorialState.completeCount++; tutorialState.pendingSkipQueue=[]; tutorialTransitionGeneration++; tutorialState.transitionState="IDLE"; tutorialState.transitioning=false;
    clearTutorialTimers(); localStorage.setItem(TUTORIAL_COMPLETED_KEY,"true"); tutorialMode=false; restoreTutorialAuto(); document.body.classList.remove("tutorialMode","tutorialIntro","tutorialSidePanel","tutorialTopPanel"); resize(); if(tutorialHud)tutorialHud.hidden=true; cleanupPlaySession({stopAudio:true,hideResultOverlay:true,abort:true}); if(tutorialComplete)tutorialComplete.hidden=false; safeSetState("title"); startLayer.style.display="none";
  }
  function updateTutorialAim(){
    const st=tutorialSteps[tutorialStepIndex];
    if(!tutorialMode||!st?.targets||tutorialState.transitioning)return;
    // AIM explore and the press-free TRACE still-target exercise may complete by
    // pointer movement. CUT explore must wait for an actual CUT input in onCut().
    const movementCompletes = st.kind==="aim" || (st.kind==="trace" && st.phase==="explore");
    if(!movementCompletes)return;
    const target=st.targets[st._hit||0];
    if(target===undefined)return;
    const a=laneAngle(target);
    const inside=tutorialState.pointerMoved && aligned(a,.055);
    if(inside){
      if(!tutorialState.exploreInsideSince) tutorialState.exploreInsideSince=performance.now();
      // Require a short dwell so simply crossing a target while moving toward
      // the right-side UI cannot accidentally finish or skip an explore step.
      if(performance.now()-tutorialState.exploreInsideSince>=220){
        tutorialCompleteExploreTarget("USER_JUDGEMENT",tutorialState.lastSource||"pointer");
      }
    }else{
      tutorialState.exploreInsideSince=0;
    }
  }
  function tutorialNoteFinalDeadline(n){
    if(n.type==="cut") return n.hitTime+.22;
    if(n.type.startsWith("swing") || n.type.startsWith("scratch")) return n.hitTime+.26;
    return n.hitTime+(n.duration||0);
  }
  function tutorialChartFinalDeadline(){ return chart.reduce((latest,n)=>Math.max(latest,tutorialNoteFinalDeadline(n)),0); }
  function finalizeExpiredTutorialNotes(t){
    if(!tutorialMode || !chart.length || t<tutorialChartFinalDeadline()) return false;
    const unresolved=chart.filter(n=>!n.done&&!n.missed);
    if(!unresolved.length) return false;
    for(const n of unresolved) miss(n,"CHART_END_UNRESOLVED");
    tutorialState.chartFinalizationCount+=unresolved.length;
    tutorialState.lastChartFinalization={attemptId:tutorialAttemptId,gameTime:t,noteTypes:unresolved.map(n=>n.type)};
    return true;
  }
  function tutorialChartSettled(){ return chart.length>0 && chart.every(n=>n.done||n.missed); }
  function scheduleTutorialRetry(delay=700){
    if(tutorialState.mixRetryScheduled) return;
    tutorialState.mixRetryScheduled=true; tutorialState.failCount++; tutorialAttempts++;
    addFeedback("다시 시도",cx,cy-baseR*.42,COLORS.miss);
    tutorialSetTimeout(()=>{ if(tutorialMode){ tutorialState.mixRetryCount++; restartTutorialStep(); } },delay);
  }
  function handleFinalMixCompletion(){
    const st=tutorialSteps[tutorialStepIndex];
    if(!tutorialMode || st?.kind!=="mix" || !tutorialChartSettled()) return false;
    if(chart.some(n=>n.missed)){ scheduleTutorialRetry(700); return false; }
    requestTutorialTransition(tutorialSteps.length,{source:"success", reason:"USER_JUDGEMENT", extra:{source:"system",fn:"handleFinalMixCompletion"}});
    return true;
  }
  function tutorialFailed(){
    if(!tutorialMode)return false;
    const st=tutorialSteps[tutorialStepIndex];
    if(st?.kind==="mix") return handleFinalMixCompletion();
    if(chart.some(n=>n.missed)){ scheduleTutorialRetry(700); return true; }
    return false;
  }

  function notifyPwaGameplay(){ try{ window.CircleMixPWA?.setGameplayState({running, paused, scene:activeSceneName()}); }catch(e){} }

  function showResult(result, recordInfo){
    releasePointerLock();
    score=result.finalScore;
    if(resultSongTitle) resultSongTitle.textContent=`${result.songTitle} / ${result.difficultyLabel || getActiveDifficultyLabel(selectedSong,result.difficulty)} / ${result.starLevel}`;
    if(resultRank){ resultRank.textContent=""; setTimeout(()=>{ if(resultOverlay?.classList.contains("show")) resultRank.textContent=result.rank; }, 280); }
    if(resultAccuracy) resultAccuracy.textContent=(result.accuracyRatio*100).toFixed(2)+"%";
    if(resultPerfect) resultPerfect.textContent=result.perfectCount;
    if(resultGreat) resultGreat.textContent=result.greatCount;
    if(resultMiss) resultMiss.textContent=result.missCount;
    if(resultMaxCombo) resultMaxCombo.textContent=result.maxCombo;
    if(resultTotalNotes) resultTotalNotes.textContent=result.totalNotes;
    if(resultMapLevel) resultMapLevel.textContent=`${result.difficultyLabel || getActiveDifficultyLabel(selectedSong,result.difficulty)} ${result.starLevel}`;
    if(resultPower) resultPower.textContent=result.autoPlay ? "AUTO — NO POWER" : (result.power !== null ? `POWER ${result.power}` : "POWER ---");
    if(resultAuto) resultAuto.textContent=result.autoPlay ? "AUTO PLAY RESULT" : "PLAYER RESULT";
    if(resultNewRecord) resultNewRecord.textContent=recordInfo?.newPowerRecord ? "NEW POWER RECORD" : (recordInfo?.newRecord ? "NEW RECORD" : "");
    if(resultBest){
      const best=recordInfo?.newRecord ? {bestScore:result.finalScore,bestRank:result.rank,bestAccuracy:result.accuracyRatio,bestPower:recordInfo?.newPowerRecord ? result.power : recordInfo?.previous?.bestPower} : (recordInfo?.newPowerRecord ? {...(recordInfo?.previous||{}), bestPower:result.power} : recordInfo?.previous);
      resultBest.textContent=best ? `BEST SCORE ${String(best.bestScore || 0).padStart(7,"0")} / POWER ${Number.isFinite(best.bestPower) ? best.bestPower : "---"} / ${best.bestRank || "---"} / ${Number.isFinite(best.bestAccuracy) ? (best.bestAccuracy*100).toFixed(2)+"%" : "---"}` : (result.autoPlay ? "AUTO PLAY is not saved" : "NO RECORD");
    }
    if(resultOverlay){ resultOverlay.classList.toggle("newRecord", !!(recordInfo?.newRecord || recordInfo?.newPowerRecord)); resultOverlay.classList.add("show"); }
    notifyPwaGameplay();
    animateResultScore(result.finalScore);
  }

  function completeRun(){
    if(tutorialMode) return completeTutorial();
    if(resultShown || abortingRun) return;
    resultShown=true;
    cleanupPlaySession({stopAudio:true, hideResultOverlay:true, abort:false});
    notifyPwaGameplay();
    const result=buildResultData();
    if(!result){ alert("결과를 계산할 수 없습니다. 채보가 비어 있거나 잘못되었습니다."); exitToMenu(); return; }
    const recordInfo=saveBestRecord(result);
    showResult(result, recordInfo);
    try{ localStorage.setItem("circleMixPlayCount.v1", String(Number(localStorage.getItem("circleMixPlayCount.v1")||0)+1)); }catch(e){}
    updateButtons();
  }

  function scheduleCompletion(){
    if(resultShown || completionPending || abortingRun) return;
    completionPending=true;
    completionTimer=setTimeout(completeRun, 1000);
  }

  function endGame(stopAudio=true){
    resetAimInput(-Math.PI/2);
    cleanupPlaySession({stopAudio, hideResultOverlay:true, abort:true});
    notifyPwaGameplay();
    if(stopAudio && activeLocalBlobUrl){ URL.revokeObjectURL(activeLocalBlobUrl); activeLocalBlobUrl=null; }
    startLayer.style.display="flex";
    updateButtons();
  }

  function showPause(message=""){
    releasePointerLock();
    releaseMobilePointers();
    resetAimInput(rawInputAngle);
    if(!running) return;
    if(!paused){
      paused=true;
      pauseSong("pause");
      notifyPwaGameplay();
      if(raf){cancelAnimationFrame(raf);raf=0;}
    }
    if(pauseOverlay) pauseOverlay.classList.add("show");
    if(tutorialMode && pauseRetry) pauseRetry.textContent="RESTART STEP";
    document.body.classList.add("pausedInputBlocked");
    setPauseMessage(message);
  }

  function resumeGame(){
    releaseMobilePointers(); resetAimInput(rawInputAngle);
    if(!paused) return;
    paused=false;
    notifyPwaGameplay();
    if(pauseOverlay) pauseOverlay.classList.remove("show");
    if(pauseRetry) pauseRetry.textContent="RETRY";
    document.body.classList.remove("pausedInputBlocked");
    fullscreenInterrupted=false;
    closePauseSettings();
    setPauseMessage("");
    lastMs=performance.now();
    ensureAudioCtx();
    applyMusicVolume();
    playSong("play").catch(()=>{});
    raf=requestAnimationFrame(frame);
  }

  function retryGame(){
    if(tutorialMode) return restartTutorialStep();
    cleanupPlaySession({stopAudio:true, hideResultOverlay:true, abort:true});
    start(editorMode?"editor":"play");
  }

  function exitToMenu(){
    if(tutorialMode) return exitTutorial(false), showTitleMenu();
    cleanupPlaySession({stopAudio:true, hideResultOverlay:true, abort:true});
    endGame(true);
    showSongSelect();
  }

  function exitToTitle(){
    pauseSettingsOpen=false;
    settingsVisible=false;
    if(pauseSettingsOverlay) pauseSettingsOverlay.classList.remove("show");
    if(pauseOverlay) pauseOverlay.classList.remove("show");
    document.body.classList.remove("pausedInputBlocked", "pauseSettingsOpen", "showSettings");
    if(tutorialMode) return exitTutorial(true);
    showTitleMenu();
  }

  function currentSettingsOrigin(){
    if(running || paused || document.body.classList.contains("safeGame")) return "gameplay";
    if(songSelect && !songSelect.hidden) return "songSelect";
    return "title";
  }

  function handleSettingsResume(){
    const origin=settingsOrigin;
    settingsVisible=false;
    document.body.classList.remove("showSettings");
    if(origin==="gameplay"){
      safeSetState("game", "settings resume gameplay");
      if(paused) resumeGame();
      else originalToggleSettings(false);
    }else if(origin==="songSelect"){
      safeSetState("songSelect", "settings resume songSelect");
      if(songSelect) songSelect.hidden=false;
      originalToggleSettings(false);
    }else{
      safeSetState("title", "settings resume title");
      originalToggleSettings(false);
    }
    safeRefresh();
  }

  function visibleEndTime(n){
    if(n.type.startsWith("slide")) return n.hitTime+(n.duration||0)+.30;
    if(n.duration>0 || n.type.startsWith("trace")) return n.hitTime+(n.duration||0)+.45;
    return n.hitTime+.36;
  }
  function getVisibleNotes(t){
    const startTime=t-0.50;
    const endTime=t+APPROACH+0.08;
    while(renderWindow.start<chart.length && visibleEndTime(chart[renderWindow.start])<startTime) renderWindow.start++;
    let end=renderWindow.start;
    while(end<chart.length && chart[end].spawnTime<=endTime) end++;
    renderWindow.end=end;
    const out=renderWindow.notes; out.length=0;
    for(let i=renderWindow.start;i<end;i++){
      const n=chart[i];
      if(!n.done && !n.missed && t>=n.spawnTime-.02 && t<=visibleEndTime(n)) out.push(n);
    }
    perfStats.visibleNotes=out.length;
    return out;
  }
  function ensurePerfOverlay(){
    if(!perfEnabled || perfStats.el) return;
    const el=document.createElement("div");
    el.id="perfOverlay";
    el.style.cssText="position:fixed;right:8px;bottom:8px;z-index:130000;background:rgba(0,0,0,.72);color:#8dfaff;font:11px/1.35 monospace;padding:8px;border:1px solid rgba(92,255,251,.45);border-radius:8px;pointer-events:none;white-space:pre";
    document.body.appendChild(el); perfStats.el=el;
  }
  function updateMobileAudioDebug(){
    if(!mobileDebug) return;
    const data={...audioDebugStats, previewSessionId, running, paused, autoPlay:gameState.autoEnabled, selectedSongId, selectedDifficultyId};
    window.CircleMixMobileDebug=data;
    const t=performance.now();
    if(t-mobileAudioDebugLastPaint<250) return;
    mobileAudioDebugLastPaint=t;
    if(!mobileAudioDebugPanel){
      mobileAudioDebugPanel=document.createElement("pre");
      mobileAudioDebugPanel.id="mobileAudioDebugPanel";
      mobileAudioDebugPanel.style.cssText="position:fixed;left:8px;top:8px;z-index:140000;max-width:min(92vw,520px);margin:0;padding:8px;border:1px solid #5cfffb;background:rgba(0,0,0,.78);color:#dffcff;font:11px/1.35 monospace;white-space:pre-wrap;pointer-events:none";
      document.body.appendChild(mobileAudioDebugPanel);
    }
    mobileAudioDebugPanel.textContent=JSON.stringify(data,null,2);
  }

  function updatePerfStats(ms,t){ updateMobileAudioDebug();
    const ft=Math.max(0,ms-(perfStats.lastMs||ms)); perfStats.lastMs=ms;
    perfStats.samples++; perfStats.totalFrame+=ft; if(ft>perfStats.maxFrame) perfStats.maxFrame=ft; if(ft>=24) perfStats.longFrames++;
    if(!autoQualityStats.windowAt) autoQualityStats.windowAt=ms;
    autoQualityStats.samples++; autoQualityStats.totalFrame+=ft; if(ft>=24) autoQualityStats.longFrames++;
    perfStats.fpsFrames++; if(!perfStats.fpsAt) perfStats.fpsAt=ms;
    if(ms-perfStats.fpsAt>=1000){ perfStats.fps=Math.round(perfStats.fpsFrames*1000/(ms-perfStats.fpsAt)); perfStats.fpsFrames=0; perfStats.fpsAt=ms; }
    maybeAutoDegrade(ms);
    if(!perfEnabled || ms-perfStats.lastPaint<300) return;
    ensurePerfOverlay(); perfStats.lastPaint=ms;
    const avg=perfStats.samples ? perfStats.totalFrame/perfStats.samples : 0;
    perfStats.el.textContent=`FPS ${perfStats.fps}\navg ${avg.toFixed(1)}ms max ${perfStats.maxFrame.toFixed(1)}ms long ${perfStats.longFrames}\nDPR ${currentRenderDpr} quality ${getMobileQuality()} ${SESSION_QUALITY.effectMode}\nnotes ${chart.length} visible ${perfStats.visibleNotes}\nparticles ${particles.length} feedback ${feedback.length}\nwaves ${waves.length} rings ${ringBursts.length} scratch ${scratchBursts.length}`;
    perfStats.samples=0; perfStats.totalFrame=0; perfStats.maxFrame=0; perfStats.longFrames=0;
  }
  function maybeAutoDegrade(ms){
    if(getMobileQuality()!=="AUTO" || !isCoarsePointerMobile() || ms-SESSION_QUALITY.startedAt<3000 || ms-SESSION_QUALITY.lastDropAt<10000) return;
    if(ms-autoQualityStats.windowAt<3000) return;
    const avg=autoQualityStats.samples ? autoQualityStats.totalFrame/autoQualityStats.samples : 0;
    const longFrames=autoQualityStats.longFrames;
    autoQualityStats.windowAt=ms; autoQualityStats.samples=0; autoQualityStats.totalFrame=0; autoQualityStats.longFrames=0;
    if(avg<22 && longFrames<18) return;
    if(SESSION_QUALITY.autoDprCap>1.25) SESSION_QUALITY.autoDprCap=1.25;
    else if(SESSION_QUALITY.autoDprCap>1) SESSION_QUALITY.autoDprCap=1;
    else SESSION_QUALITY.effectMode="PERFORMANCE";
    SESSION_QUALITY.lastDropAt=ms;
    resize();
  }

  function songEndTime(){
    if(selectedSong?.id==="anima" && selectedSong?.source==="builtin") return SONG_END_TIME;
    const audioEnd=Number.isFinite(song.duration) ? song.duration - SONG_OFFSET : 0;
    return Math.max(audioEnd || 0, chartLastHitEnd || 0) + 1.5;
  }

  function frame(ms){
    if(!running)return;
    testFrameCount++;
    const dt=Math.min(.033,(ms-lastMs)/1000||.016);
    lastMs=ms; const t=now();
    if(tutorialMode){ updateTutorialAim(); setTutorialHud(); }
    const notesSettled = judgedCount >= chart.length || song.ended || t >= chartLastHitEnd + HIT_WINDOW + 0.25;
    if(!tutorialMode && (song.ended || t >= songEndTime()) && notesSettled){ scheduleCompletion(); }
    // Tutorial progression is event-driven by tutorialHandleJudgement().
    // Do not also advance from the render loop; that duplicate path caused
    // intermittent stage skips when a late frame raced the next step.

    // Z/X/Space/우클릭을 기본 액션 홀드로 사용. SCRATCH는 우클릭이 기본, Shift는 보조 입력.
    filterHeld = isAutoActive() || mouseDownRight || keys.KeyZ || keys.KeyX || keys.Space;
    scratchHeld = mouseDownRight || keys.ShiftLeft || keys.ShiftRight;
    syncScratchHoldState();
    scratchMoveAmount=Math.abs(aimInput.lastSampleDelta);
    scratchSpeed=Math.abs(aimInput.sampleAngularVelocity);
    scratchThresholdMet=freshAimSample() && scratchSpeed>=SCRATCH_FLICK_SPEED;
    scratchCandidate=!!scratchHeld;
    updateAuto(t);
    updateArm(dt);
    updateNotes(t,dt);
    if(tutorialMode){ finalizeExpiredTutorialNotes(t); tutorialFailed(); }

    focusNote=currentFocusNote(t);

    testRenderCount++;
    drawBackground(t);

    // Tutorial uses only the note and its real guide. Landing ghosts, approach
    // rails and the focus halo are normal-play reading aids and caused several
    // translucent shapes to overlap in the lesson screen.
    const visibleNotes=getVisibleNotes(t);
    if(!tutorialMode){
      for(let i=0;i<visibleNotes.length;i++) drawLandingGhost(visibleNotes[i],t);
      for(let i=0;i<visibleNotes.length;i++) drawApproachRail(visibleNotes[i],t);
    }
    drawJudgeGuides(t);
    drawTutorialExploreTarget(t);

    for(let i=0;i<visibleNotes.length;i++){ const n=visibleNotes[i]; if(n.type.startsWith("trace"))drawNote(n,t); }
    for(let i=0;i<visibleNotes.length;i++){ const n=visibleNotes[i]; if(!n.type.startsWith("trace"))drawNote(n,t); }
    if(!tutorialMode)drawFocusHalo(focusNote,t);
    drawArm();
    drawEffects(dt);
    updateDebugOverlay(t);

    updateLiveHud(calculateScoreStats());
    updatePerfStats(ms,t);
    if(editorMode) updateEditorStatus();
    raf=requestAnimationFrame(frame);
  }

  async function prepareSelectedAudio(){
    stopSongPreview();
    try{ pauseSong("reset"); setSongCurrentTime(0,"reset"); }catch(e){}
    if(activeLocalBlobUrl){ URL.revokeObjectURL(activeLocalBlobUrl); activeLocalBlobUrl=null; }
    BPM = selectedSong?.bpm || 184.6; BEAT = 60 / BPM; SONG_OFFSET = typeof selectedSong?.offset === "number" ? selectedSong.offset : -0.04;
    if(selectedSong?.audioBlob){
      activeLocalBlobUrl=URL.createObjectURL(selectedSong.audioBlob); song.src=activeLocalBlobUrl;
    }else if(activePlaySource==="local"){
      throw new Error("로컬 오디오 Blob을 찾을 수 없습니다.");
    }else if(selectedSong?.audio && String(selectedSong.audio).startsWith("#")){
      song.src=embeddedAnimaSrc;
    }else if(selectedSong?.audio){
      song.src=selectedSong.audio;
    }else if(selectedSong?.audioRequired) throw new Error(selectedSong.audioNotice || "Link a local audio file before playing this chart.");
    try{ loadSong("load"); }catch(e){}
    applyMusicVolume();
  }

  async function start(mode="play"){
    if(raf)cancelAnimationFrame(raf);
    ensureAudioCtx();
    const startToken = ++playSessionToken;
    try{ await prepareSelectedAudio(); }catch(err){ alert(err.message); return false; }
    if(startToken !== playSessionToken) return false;
    cleanupPlaySession({stopAudio:true, hideResultOverlay:true, abort:true});
    paused=false;
    abortingRun=false; completionPending=false; resultShown=false;
    browserTestClock=null;
    if(selectedMenuMode) mapMode=selectedMenuMode;
    if(selectedMenuMode==="custom") useCustomChart=customChartData.length>0;
    editorMode=mode==="editor";
    if(editorPanel)editorPanel.classList.toggle("show",editorMode);
    useCustomChart=(selectedMenuMode==="custom" && customChartData.length>0);
    chart=generateChart();
    chartLastHitEnd=0;
    for(let i=0;i<chart.length;i++) chartLastHitEnd=Math.max(chartLastHitEnd,chart[i].hitTime+(chart[i].duration||0));
    resetRenderWindow();
    perfStats.lastMs=0; perfStats.lastPaint=0; perfStats.samples=0; perfStats.totalFrame=0; perfStats.maxFrame=0; perfStats.longFrames=0; perfStats.fpsFrames=0; perfStats.fpsAt=0; perfStats.visibleNotes=0;
    autoQualityStats.windowAt=0; autoQualityStats.samples=0; autoQualityStats.totalFrame=0; autoQualityStats.longFrames=0;
    SESSION_QUALITY.autoDprCap=1.5; SESSION_QUALITY.effectMode="NORMAL"; SESSION_QUALITY.lastDropAt=0; SESSION_QUALITY.startedAt=performance.now();
    if(debugMode) console.log(`[Start Chart]
source=${activePlaySource}
songId=${selectedSong?.id || "-"}
difficulty=${activeChartId || selectedDifficultyId || selectedMenuMode}
difficultyLabel=${getActiveDifficultyLabel(selectedSong, activeChartId || selectedDifficultyId || selectedMenuMode)}
chartLength=${chart.length}
scene=${activeSceneName()}
settingsOrigin=${settingsOrigin}`);
    if(!chart.length){ alert("채보가 비어 있어 플레이를 시작할 수 없습니다. 선택한 곡/난이도의 chartLength=0 입니다."); if(debugMode) console.warn("[Start Failed] empty chart", {source:activePlaySource, songId:selectedSong?.id, difficulty:activeChartId || selectedDifficultyId || selectedMenuMode}); endGame(true); return false; }
    resetTraceRuntimeState();
    score=0; combo=0; maxCombo=0; judgedCount=0; perfectCount=0; greatCount=0; missCount=0; actualHitValue=0; maxHitValue=chart.reduce((sum,n)=>sum+noteWeight(n),0);
    feedback=[]; particles=[]; waves=[]; ringBursts=[]; scratchBursts=[];
    running=true;
    closeSettingsOverlayOnly();
    safeSetState("game", "start runtime init");
    setCleanGameplay(true);
    if(tutorialPrompt) tutorialPrompt.hidden=true;
    if(tutorialComplete) tutorialComplete.hidden=true;
    if(songSelect) songSelect.hidden=true;
    startLayer.style.display="none";
    resize();
    setGameplayScrollLocked(true);
    notifyPwaGameplay();
    pauseSong("pause");
    try{ setSongCurrentTime(0,"reset"); }catch(e){}
    if(song.ended){ try{ loadSong("load"); setSongCurrentTime(0,"reset"); }catch(e){} }
    startMs=performance.now();
    audioStartedAt=startMs;
    lastMs=startMs;
    mouseX=cx; mouseY=cy-hitR;
    resetAimInput(-Math.PI/2); armAngle=targetAngle=prevArmAngle=-Math.PI/2; armVel=rawArmVel=0; magnetTarget=null;
    filterHeld=false; forceReleaseScratch(); mouseDownRight=false;
    lastScratchResult="READY";
    updateAutoDebug(0);
    updateButtons();
    if(editorMode) updateEditorStatus();

    applyMusicVolume();
    raf=requestAnimationFrame(frame);

    const keepGameScene = () => {
      if(startToken !== playSessionToken) return false;
      closeSettingsOverlayOnly();
      safeSetState("game", "start async guard");
      if(songSelect) songSelect.hidden = true;
      if(safeMenu) safeMenu.style.display = "none";
      return true;
    };
    playSong("start-game").then(()=>{
      if(!keepGameScene()) return;
    }).catch(err=>{
      console.warn("audio play failed", err);
      // 재생 실패해도 화면은 돌리되, 사용자가 P나 에디터 PLAY로 다시 재생 가능.
      if(!keepGameScene()) return;
    });
    keepGameScene();
    return true;
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
    const traceNote=chart.find(n=>n.type?.startsWith("trace")&&!n.done&&!n.missed&&t>=n.hitTime&&t<=n.hitTime+(n.duration||0)) || chart.find(n=>n.type?.startsWith("trace")&&!n.done&&!n.missed);
    const tr=traceNote?getTraceJudgementRegion(traceNote,t,traceProfile()):null;
    const traceDebug=traceNote?`<div class="debugGrid"><b>TRACE DEBUG</b><b></b>
        <span>targetAngle</span><strong>${formatAngle(tr.targetAngle)}</strong><span>pointerAngle</span><strong>${formatAngle(tr.pointerAngle)}</strong>
        <span>angleError</span><strong>${(tr.angleError*180/Math.PI).toFixed(1)}°</strong><span>angularTolerance</span><strong>${(tr.angularTolerance*180/Math.PI).toFixed(1)}°</strong>
        <span>pointerRadius</span><strong>${tr.pointerRadius.toFixed(1)}</strong><span>traceRadius</span><strong>${tr.targetRadius.toFixed(1)}</strong>
        <span>radiusError</span><strong>${tr.radiusError.toFixed(1)}</strong><span>radialTolerance</span><strong>${tr.radialTolerance.toFixed(1)}</strong>
        <span>insideTraceTarget</span><strong>${formatBool(tr.inside)}</strong><span>coverageRatio</span><strong>${formatNum(traceNote.coverageRatio,2)}</strong>
        <span>validTrackedTime</span><strong>${formatNum(traceNote.validTrackedTime,2)}</strong><span>activeTraceDuration</span><strong>${formatNum(traceNote.activeTraceDuration,2)}</strong>
        <span>endpointCaptured</span><strong>${formatBool(traceNote.endpointCaptured)}</strong><span>fail reason</span><strong>${traceNote.failReason||traceNote.lastTraceReason||"-"}</strong>
      </div>`:"";
    el.innerHTML=`<div class="debugTitle">INPUT DEBUG <span>${gameState.autoEnabled?"AUTO":"MANUAL"}</span></div>
      <div class="debugGrid"><b>VERSION</b><b></b>
        <span>CircleMixVersion</span><strong>v${currentVersionString()}</strong><span>buildDate</span><strong>${versionInfo.buildDate || "-"}</strong>
      </div>
      <div class="debugGrid"><b>REAL INPUT</b><b></b>
        <span>Z</span><strong>${formatBool(keys.KeyZ)}</strong><span>X</span><strong>${formatBool(keys.KeyX)}</strong>
        <span>Space</span><strong>${formatBool(keys.Space)}</strong><span>LMB</span><strong>${formatBool(!!keys.MouseLeft)}</strong>
        <span>RMB</span><strong>${formatBool(mouseDownRight)}</strong><span>Shift</span><strong>${formatBool(keys.ShiftLeft||keys.ShiftRight)}</strong>
        <span>Mouse X/Y</span><strong>${mouseX.toFixed(0)}, ${mouseY.toFixed(0)}</strong>
        <span>Mouse/touch angle</span><strong>${formatAngle(mouseAngle)}</strong>
        <span>Distance from center</span><strong>${mouseDist.toFixed(1)}</strong>
        <span>rawInputAngle</span><strong>${formatAngle(rawInputAngle)}</strong>
        <span>judgementAimAngle</span><strong>${formatAngle(judgementAimAngle)}</strong>
        <span>visualArmAngle</span><strong>${formatAngle(visualArmAngle)}</strong>
        <span>unwrappedAngle</span><strong>${formatNum(aimInput.unwrappedAngle,2)}</strong>
        <span>pointerRadius</span><strong>${aimInput.pointerRadius.toFixed(1)}</strong>
        <span>deadzone / rebase</span><strong>${formatBool(aimInput.centerDeadzoneActive)} / ${formatBool(aimInput.rebasePending)}</strong>
        <span>sampleAngularVelocity</span><strong>${formatNum(aimInput.sampleAngularVelocity,2)}</strong>
        <span>CW / CCW travel</span><strong>${formatNum(aimInput.accumulatedCWTravel,2)} / ${formatNum(aimInput.accumulatedCCWTravel,2)}</strong>
        <span>magnetTarget noteId</span><strong>${noteDebugId(magnetTarget)}</strong>
        <span>magnetAngleError</span><strong>${(magnetAngleError*180/Math.PI).toFixed(1)}°</strong>
        <span>stabilizer mode</span><strong>${inputSettings.aimStabilizer}</strong>
        <span>PC AIM selected / active / lock</span><strong>${inputSettings.pcAimMode} / ${effectivePcAimMode()} / ${formatBool(pointerLockActive())}</strong>
        <span>locked virtual / sensitivity</span><strong>${formatAngle(lockedVirtualAngle)} / ${inputSettings.lockedAimSensitivity.toFixed(2)}x</strong>
        <span>relative movement</span><strong>${lastRelativeMovement.x}, ${lastRelativeMovement.y}</strong>
        <span>raw ↔ judgement / judgement ↔ visual</span><strong>${formatAngle(norm(rawInputAngle-judgementAimAngle))} / ${formatAngle(norm(judgementAimAngle-visualArmAngle))}</strong>
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
      ${traceDebug}
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

  function setPauseMessage(message){
    if(pauseMessage){
      pauseMessage.textContent=message||"";
      pauseMessage.classList.toggle("show", !!message);
    }
    if(enterFullscreenBtn) enterFullscreenBtn.hidden=!fullscreenInterrupted;
    if(resumeBtn) resumeBtn.textContent=fullscreenInterrupted ? "RESUME WINDOWED" : "RESUME";
    if(exitBtn) exitBtn.textContent=fullscreenInterrupted ? "EXIT TO SONG SELECT" : "EXIT";
  }

  function syncPauseSettingsUI(){
    if(pauseSetSpdDown) pauseSetSpdDown.textContent = formatSpeed() + " −";
    if(pauseSetSpdUp) pauseSetSpdUp.textContent = formatSpeed() + " ＋";
    if(pauseSetOffDown) pauseSetOffDown.textContent = formatOffset() + " −";
    if(pauseSetOffUp) pauseSetOffUp.textContent = formatOffset() + " ＋";
    if(pauseSetMusic) pauseSetMusic.textContent = formatMusic();
    if(pauseSetSfx){
      pauseSetSfx.textContent = formatSfx();
      pauseSetSfx.classList.toggle("on", sfxEnabled);
    }
    if(pauseSetNoteContrast) pauseSetNoteContrast.textContent = formatNoteContrast();
    if(pauseSetPathBrightness) pauseSetPathBrightness.textContent = formatPathBrightness();
    if(pauseSetEffectIntensity) pauseSetEffectIntensity.textContent = formatEffectIntensity();
    if(pauseSetJudgeGuide) pauseSetJudgeGuide.textContent = formatJudgeGuide();
    if(pauseSetAimStabilizer) pauseSetAimStabilizer.textContent = formatAimStabilizer();
    if(pauseSetAimVisual) pauseSetAimVisual.textContent = formatAimVisual();
    if(pauseSetVisualResponse){ pauseSetVisualResponse.textContent=formatVisualResponse(); pauseSetVisualResponse.hidden=inputSettings.aimVisual!=="SMOOTH"; }
    if(pauseSetPcAim) pauseSetPcAim.textContent=formatPcAim(); if(pauseSetLockedSensitivity) pauseSetLockedSensitivity.textContent=formatLockedSensitivity();
    if(pauseSetMobileQuality) pauseSetMobileQuality.textContent = formatMobileQuality();
    if(pauseSetHaptic) pauseSetHaptic.textContent = formatHaptic();
    if(pauseSetAuto){
      pauseSetAuto.textContent = gameState.autoEnabled ? "AUTO PLAY ON" : "AUTO PLAY OFF";
      pauseSetAuto.classList.toggle("on", gameState.autoEnabled);
      pauseSetAuto.setAttribute("aria-pressed", gameState.autoEnabled ? "true" : "false");
    }
  }

  function openPauseSettings(){
    releasePointerLock();
    if(!paused) showPause();
    if(!paused) return;
    pauseSettingsOpen = true;
    settingsVisible = false;
    document.body.classList.remove("showSettings");
    document.body.classList.add("pauseSettingsOpen");
    if(quickSettingsBtn) quickSettingsBtn.classList.remove("on");
    if(pauseOverlay) pauseOverlay.classList.add("show");
    if(tutorialMode && pauseRetry) pauseRetry.textContent="RESTART STEP";
    if(pauseSettingsOverlay) pauseSettingsOverlay.classList.add("show");
    syncPauseSettingsUI();
  }

  function closePauseSettings(){
    pauseSettingsOpen = false;
    document.body.classList.remove("pauseSettingsOpen", "showSettings");
    if(quickSettingsBtn) quickSettingsBtn.classList.remove("on");
    if(pauseSettingsOverlay) pauseSettingsOverlay.classList.remove("show");
    if(paused && pauseOverlay) pauseOverlay.classList.add("show");
    settingsVisible = false;
    setPauseMessage("");
  }

  async function lockLandscapeSafe(){
    try{ if(screen.orientation && screen.orientation.lock) await screen.orientation.lock("landscape"); }catch(e){}
  }

  function activeSceneName(){
    if(document.body.classList.contains("safeSongSelect")) return "songSelect";
    if(document.body.classList.contains("safeSettings")) return "settings";
    if(document.body.classList.contains("safeGame")) return paused ? "pause" : "game";
    return "title";
  }

  function logFullscreenSnapshot(prefix=""){
    const appRect=(gameRoot || document.documentElement).getBoundingClientRect();
    const canvasRect=canvas.getBoundingClientRect();
    if(prefix) console.log(prefix);
    console.log(`[Fullscreen] active scene: ${activeSceneName()}`);
    console.log(`[Fullscreen] app rect: ${Math.round(appRect.width)} x ${Math.round(appRect.height)}`);
    console.log(`[Fullscreen] canvas rect: ${Math.round(canvasRect.width)} x ${Math.round(canvasRect.height)}`);
  }

  function isStandaloneDisplay(){ return window.matchMedia?.("(display-mode: standalone)").matches || window.matchMedia?.("(display-mode: fullscreen)").matches || navigator.standalone===true; }
  function getViewportSize(){
    const fsEl=document.fullscreenElement || document.webkitFullscreenElement;
    const rect=fsEl ? (gameRoot || fsEl).getBoundingClientRect() : null;
    const vv=window.visualViewport;
    const width=Math.floor((rect&&rect.width) || vv?.width || document.documentElement.clientWidth || window.innerWidth || W || 1);
    const height=Math.floor((rect&&rect.height) || vv?.height || document.documentElement.clientHeight || window.innerHeight || H || 1);
    return {width,height};
  }
  function scheduleStableViewportResize(reason="viewport", attempt=0){
    updateAppHeight();
    if(stableResizeTimer){ clearTimeout(stableResizeTimer); stableResizeTimer=0; }
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const size=getViewportSize();
      if(size.width>0 && size.height>0){ resize(size); logFullscreenSnapshot(`[Viewport] ${reason}`); return; }
      if(attempt<5) stableResizeTimer=setTimeout(()=>scheduleStableViewportResize(reason, attempt+1), 60);
    }));
  }
  async function requestGameFullscreen(){
    if(isStandaloneDisplay()){ scheduleStableViewportResize("standalone"); return true; }
    if(fullscreenTransitioning) return false;
    const target=fullscreenTarget || document.documentElement;
    if(document.fullscreenElement || document.webkitFullscreenElement){ scheduleStableViewportResize("already-fullscreen"); return true; }
    if(!target.requestFullscreen) return false;
    fullscreenTransitioning=true;
    try{
      await target.requestFullscreen({navigationUI:"hide"});
      await lockLandscapeSafe();
      if(fullscreenRetryBtn) fullscreenRetryBtn.hidden=true;
      fullscreenInterrupted=false; setPauseMessage(""); scheduleStableViewportResize("request-success"); return true;
    }catch(e){
      console.log("[Fullscreen] request failed", e);
      if(fullscreenRetryBtn && isMobileViewport()) fullscreenRetryBtn.hidden=false;
      scheduleStableViewportResize("request-failed"); return false;
    }finally{ fullscreenTransitioning=false; }
  }
  async function exitGameFullscreen(){
    if(isStandaloneDisplay()){ scheduleStableViewportResize("standalone-exit"); return true; }
    if(fullscreenTransitioning) return false;
    if(!document.fullscreenElement || !document.exitFullscreen) return true;
    fullscreenTransitioning=true;
    try{ await document.exitFullscreen(); return true; }catch(e){ console.log("[Fullscreen] exit failed", e); return false; }
    finally{ fullscreenTransitioning=false; scheduleStableViewportResize("exit"); }
  }
  async function requestFullscreenEnter(){ return requestGameFullscreen(); }
  function requestFullscreenSafe(){ if(document.fullscreenElement || document.webkitFullscreenElement) exitGameFullscreen(); else requestGameFullscreen(); }
  function handleFullscreenChange(){
    releaseMobilePointers(); keys.MouseLeft=false; forceReleaseScratch(); filterHeld=false; mouseDownRight=false; fullscreenInterrupted=false; fullscreenTransitioning=false;
    const inFullscreen=!!(document.fullscreenElement || document.webkitFullscreenElement) || isStandaloneDisplay();
    if(fullscreenRetryBtn) fullscreenRetryBtn.hidden=inFullscreen || !isMobileViewport();
    if(!inFullscreen){ try{ if(screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }catch(e){} }
    scheduleStableViewportResize("fullscreenchange");
  }
  function beatNow(){return Math.max(0, now()/(BEAT*CHART_STRETCH));}
  function updateEditorStatus(){
    if(editorStatus) editorStatus.textContent="custom notes: "+customChartData.length+" / beat "+beatNow().toFixed(2)+" / ANGLE "+roundAngleForJson(selectedEditorAngle)+"° / snap "+(editorAngleSnap||"FREE");
    if(editorAngleInput) editorAngleInput.value=roundAngleForJson(selectedEditorAngle);
    if(playPauseBtn) playPauseBtn.textContent=song.paused?"PLAY":"PAUSE";
    if(editorToggle) editorToggle.classList.toggle("on",editorMode);
  }
  function rebuildCustomChart(){useCustomChart=customChartData.length>0;chart=generateChart();updateEditorStatus();}
  function snapBeat(b,grid=.25){return Math.round(b/grid)*grid;}
  function addEditorNote(type){
    const b=snapBeat(beatNow(),.25), lane=Math.round(selectedEditorAngle/45)%8;
    const d={type,beat:b,angle:roundAngleForJson(selectedEditorAngle)};
    if(type==="fx") d.durationBeat=4;
    if(type==="slideCW"||type==="slideCCW"){
      d.durationBeat=4;
      d.endAngle=roundAngleForJson(selectedEditorAngle + (type==="slideCW"?135:-135));
    }
    if(type==="scratchCW"||type==="scratchCCW"){
      d.durationBeat=.55;
      d.endAngle=roundAngleForJson(selectedEditorAngle + (type==="scratchCW"?45:-45));
    }
    customChartData.push(d);customChartData.sort((a,b)=>a.beat-b.beat);rebuildCustomChart();playHitSound(type,"PERFECT");
  }
  function exportChart(){chartText.value=JSON.stringify({title:"ANiMA custom chart",bpm:BPM,offset:SONG_OFFSET,schema:"angle-v1",notes:customChartData},null,2);}
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
    const h=e=>{ if(e){ if(e.cancelable)e.preventDefault(); e.stopPropagation(); } const m=performance.now(); if(m-last<180)return; last=m; fn(e); };
    const block=e=>{ if(e){ if(e.cancelable)e.preventDefault(); e.stopPropagation(); } };
    if(window.PointerEvent){
      el.addEventListener("pointerdown",block,{passive:false});
      el.addEventListener("pointerup",h,{passive:false});
      el.addEventListener("pointercancel",block,{passive:false});
      // Native click is a reliable fallback when pointerup is lost because an
      // overlay or responsive layout moves during the press. Debouncing avoids
      // double activation after pointerup + click.
      el.addEventListener("click",h,{passive:false});
    }else{
      el.addEventListener("touchstart",block,{passive:false});
      el.addEventListener("touchend",h,{passive:false});
      el.addEventListener("click",h,{passive:false});
    }
  }

  function bindImmediatePress(el,fn){
    if(!el)return;
    let pointerRunAt=-Infinity;
    const run=e=>{
      if(e){if(e.cancelable)e.preventDefault();e.stopPropagation();}
      fn(e);
    };
    if(window.PointerEvent){
      el.addEventListener("pointerdown",e=>{pointerRunAt=performance.now();run(e);},{passive:false});
      el.addEventListener("click",e=>{
        if(performance.now()-pointerRunAt<600){if(e.cancelable)e.preventDefault();e.stopPropagation();return;}
        run(e);
      },{passive:false});
    }else{
      el.addEventListener("touchstart",run,{passive:false});
      el.addEventListener("click",run,{passive:false});
    }
  }

  bindPress(startBtn,()=>showSongSelect());
  bindPress(editorStartBtn,()=>{ window.location.href="./editor.html"; });
  bindPress(startFullBtn,requestFullscreenSafe);
  bindPress(modeNormalBtn,()=>{selectedMenuMode="normal";updateModeButtons();});
  bindPress(modeTechBtn,()=>{selectedMenuMode="tech";updateModeButtons();});

  let mobileLayoutDraft=null, mobileLayoutSavedSnapshot=null, mobileLayoutEditing=false;
  function mobileSafeRect(){ const gap=inputSettings.mobileControlGap||18; return {left:Math.max(gap,0), top:Math.max(gap+44,44), right:Math.max(gap,0), bottom:Math.max(gap,0), width:window.innerWidth, height:window.innerHeight}; }
  function presetMobileLayout(preset=inputSettings.mobileControlPreset){ const gap=(inputSettings.mobileControlGap||18); const w=Math.max(1,window.innerWidth), h=Math.max(1,window.innerHeight); const ay=Math.max(0,Math.min(1,(h-gap-44)/h)); const low=Math.max(0,Math.min(1,(gap+44)/w)); const right=Math.max(0,Math.min(1,(w-gap-44)/w)); if(preset==="LEFT_HANDED") return {actionX:low, actionY:ay, scratchX:right, scratchY:ay}; if(preset==="RIGHT_HANDED") return {actionX:Math.max(.62,right-.06), actionY:Math.max(.62,ay-.06), scratchX:low, scratchY:ay}; return {actionX:right, actionY:ay, scratchX:low, scratchY:ay}; }
  function getMobileLayout(){ const p=inputSettings.mobileControlPreset; const base=presetMobileLayout(p); return {actionX:p==="CUSTOM"&&inputSettings.mobileActionX!=null?inputSettings.mobileActionX:base.actionX, actionY:p==="CUSTOM"&&inputSettings.mobileActionY!=null?inputSettings.mobileActionY:base.actionY, scratchX:p==="CUSTOM"&&inputSettings.mobileScratchX!=null?inputSettings.mobileScratchX:base.scratchX, scratchY:p==="CUSTOM"&&inputSettings.mobileScratchY!=null?inputSettings.mobileScratchY:base.scratchY}; }
  function clampMobilePoint(x,y,size,avoidPause=true){ const gap=inputSettings.mobileControlGap||18, r=size/2, w=window.innerWidth, h=window.innerHeight; let px=Math.min(w-gap-r,Math.max(gap+r,x*w)); let py=Math.min(h-gap-r,Math.max(gap+44+r, y*h)); if(avoidPause && px+r>w-90 && py-r<58) py=58+r; return {x:px/w,y:py/h,px,py}; }
  function applyMobileControlLayout(){ const l=getMobileLayout(); const a=clampMobilePoint(l.actionX,l.actionY,inputSettings.mobileActionSize); const sc=clampMobilePoint(l.scratchX,l.scratchY,inputSettings.mobileScratchSize); const root=document.documentElement.style; if(!root?.setProperty) return; root.setProperty('--mobile-action-size',`${inputSettings.mobileActionSize}px`); root.setProperty('--mobile-scratch-size',`${inputSettings.mobileScratchSize}px`); root.setProperty('--mobile-control-opacity',String(inputSettings.mobileButtonOpacity)); root.setProperty('--mobile-action-x',`${a.px}px`); root.setProperty('--mobile-action-y',`${a.py}px`); root.setProperty('--mobile-scratch-x',`${sc.px}px`); root.setProperty('--mobile-scratch-y',`${sc.py}px`); }
  function exportMobileControls(){ const l=getMobileLayout(); return JSON.stringify({version:window.CircleMixVersion?.version||"0.0.0",storageVersion:INPUT_SETTINGS_KEY,preset:inputSettings.mobileControlPreset,mobileActionX:l.actionX,mobileActionY:l.actionY,mobileScratchX:l.scratchX,mobileScratchY:l.scratchY,mobileActionSize:inputSettings.mobileActionSize,mobileScratchSize:inputSettings.mobileScratchSize,mobileButtonOpacity:inputSettings.mobileButtonOpacity,mobileControlGap:inputSettings.mobileControlGap,screenRatio:window.innerWidth/window.innerHeight},null,2); }
  function resetMobileControls(){ Object.assign(inputSettings,MOBILE_CONTROL_DEFAULTS); saveInputSettings(); applyMobileControlLayout(); syncPauseSettingsUI(); }
  function openMobileLayoutEditor(){ releaseMobilePointers(); mobileLayoutEditing=true; mobileLayoutSavedSnapshot={...inputSettings}; mobileLayoutDraft={...getMobileLayout()}; mobileLayoutOverlay.hidden=false; renderMobileLayoutEditor(); }
  function closeMobileLayoutEditor(save){ if(save){ Object.assign(inputSettings,{mobileControlPreset:"CUSTOM",mobileActionX:mobileLayoutDraft.actionX,mobileActionY:mobileLayoutDraft.actionY,mobileScratchX:mobileLayoutDraft.scratchX,mobileScratchY:mobileLayoutDraft.scratchY}); saveInputSettings(); } else if(mobileLayoutSavedSnapshot) Object.assign(inputSettings,mobileLayoutSavedSnapshot); mobileLayoutEditing=false; mobileLayoutOverlay.hidden=true; applyMobileControlLayout(); }
  function renderMobileLayoutEditor(){ if(!mobileLayoutPreview)return; const r=mobileLayoutPreview.getBoundingClientRect(), sx=r.width/window.innerWidth, sy=r.height/window.innerHeight; mobileLayoutResolution.textContent=`${window.innerWidth} × ${window.innerHeight}`; mobileSafeArea.style.cssText=`left:${(inputSettings.mobileControlGap||18)*sx}px;top:${(44+inputSettings.mobileControlGap)*sy}px;right:${(inputSettings.mobileControlGap||18)*sx}px;bottom:${(inputSettings.mobileControlGap||18)*sy}px`; const jr=Math.min(r.width,r.height)*.23; mobileJudgeGhost.style.cssText=`left:${r.width/2}px;top:${r.height/2}px;width:${jr*2}px;height:${jr*2}px`; [[mobileLayoutAction,'action',inputSettings.mobileActionSize],[mobileLayoutScratch,'scratch',inputSettings.mobileScratchSize]].forEach(([el,k,size])=>{ el.style.width=size*sx+'px'; el.style.height=size*sy+'px'; el.style.left=mobileLayoutDraft[k+'X']*r.width+'px'; el.style.top=mobileLayoutDraft[k+'Y']*r.height+'px'; el.style.opacity=inputSettings.mobileButtonOpacity; }); const ax=mobileLayoutDraft.actionX*window.innerWidth, ay=mobileLayoutDraft.actionY*window.innerHeight, sx2=mobileLayoutDraft.scratchX*window.innerWidth, sy2=mobileLayoutDraft.scratchY*window.innerHeight; const dist=Math.hypot(ax-sx2,ay-sy2), minOverlap=(inputSettings.mobileActionSize+inputSettings.mobileScratchSize)*.36; const cover=Math.hypot(ax-window.innerWidth/2,ay-window.innerHeight/2)<Math.min(window.innerWidth,window.innerHeight)*.30 || Math.hypot(sx2-window.innerWidth/2,sy2-window.innerHeight/2)<Math.min(window.innerWidth,window.innerHeight)*.30; mobileLayoutWarning.textContent=(dist<minOverlap?'ACTION / SCRATCH OVERLAP · ':'')+(cover?'ACTION BUTTON MAY COVER NOTES':''); mobileLayoutExport.value=exportMobileControls(); }
  function dragLayoutButton(el,kind){ if(!el)return; el.addEventListener('pointerdown',e=>{ if(!mobileLayoutEditing)return; e.preventDefault(); e.stopPropagation(); try{el.setPointerCapture(e.pointerId)}catch(_){}; const move=ev=>{ const r=mobileLayoutPreview.getBoundingClientRect(); let x=(ev.clientX-r.left)/r.width, y=(ev.clientY-r.top)/r.height; const c=clampMobilePoint(x,y,kind==='action'?inputSettings.mobileActionSize:inputSettings.mobileScratchSize,false); mobileLayoutDraft[kind+'X']=c.x; mobileLayoutDraft[kind+'Y']=c.y; inputSettings.mobileControlPreset='CUSTOM'; mobileLayoutCoord.textContent=`${kind.toUpperCase()} ${Math.round(c.px)}, ${Math.round(c.py)} · ${c.x.toFixed(3)}, ${c.y.toFixed(3)}`; renderMobileLayoutEditor(); }; const up=()=>{ el.removeEventListener('pointermove',move); el.removeEventListener('pointerup',up); el.removeEventListener('pointercancel',up); }; el.addEventListener('pointermove',move); el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up); move(e); },{passive:false}); }
  dragLayoutButton(mobileLayoutAction,'action'); dragLayoutButton(mobileLayoutScratch,'scratch');

  bindPress(modeCustomBtn,()=>{selectedMenuMode="custom";updateModeButtons();});
  bindPress(autoToggle,()=>toggleAuto("mobile"));
  bindPress(mapToggle,()=>{if(running && !debugMode)return; mapMode=mapMode==="tech"?"normal":"tech";restartIfRunning();});
  bindPress(debugToggle,()=>toggleDebugOverlay());
  bindPress(keymapToggle,()=>toggleKeymap());
  bindPress(editorToggle,()=>toggleEditor());
  bindPress(fullToggle,requestFullscreenSafe);
  bindPress(quickSettingsBtn,()=>toggleSettings());
  bindPress(quickEditorBtn,()=>{ window.location.href="./editor.html"; });
  bindPress(quickFullBtn,requestFullscreenSafe);
  bindPress(resumeBtn,e=>{requestPointerLockForAim(e);resumeGame();});
  bindPress(settingsBtn,openPauseSettings);
  bindPress(enterFullscreenBtn,requestFullscreenEnter);
  bindPress(fullscreenRetryBtn,requestFullscreenEnter);
  bindPress(mobilePauseBtn,showPause);
  bindPress(retryBtn,e=>{requestPointerLockForAim(e);retryGame();});
  bindPress(exitBtn,exitToMenu);
  bindPress(resultRetry,e=>{requestPointerLockForAim(e);retryGame();});
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
  bindPress(pauseSetNoteContrast,()=>{cycleVisualSetting("noteContrast");syncPauseSettingsUI();});
  bindPress(pauseSetPathBrightness,()=>{cycleVisualSetting("pathBrightness");syncPauseSettingsUI();});
  bindPress(pauseSetEffectIntensity,()=>{cycleVisualSetting("effectIntensity");syncPauseSettingsUI();});
  bindPress(pauseSetJudgeGuide,()=>{cycleVisualSetting("judgeGuide");syncPauseSettingsUI();});
  bindPress(pauseSetAimStabilizer,()=>{cycleAimStabilizer();syncPauseSettingsUI();});
  bindPress(pauseSetAimVisual,()=>{cycleAimVisual();syncPauseSettingsUI();});
  bindPress(pauseSetVisualResponse,()=>{cycleVisualResponse();syncPauseSettingsUI();});
  bindPress(pauseSetPcAim,()=>{cyclePcAim();syncPauseSettingsUI();}); bindPress(pauseSetLockedSensitivity,()=>{cycleLockedSensitivity();syncPauseSettingsUI();});
  bindPress(pauseSetMobileQuality,()=>{cycleMobileQuality();syncPauseSettingsUI();});
  bindPress(pauseSetHaptic,()=>{toggleHaptic();syncPauseSettingsUI();});
  bindPress(pauseSetMobileLayout,openMobileLayoutEditor); bindPress(pauseSetMobileInputTest,openMobileInputTest); bindPress(pauseSetMobileExport,()=>{try{navigator.clipboard?.writeText(exportMobileControls());}catch(e){} alert(exportMobileControls());}); bindPress(pauseSetMobileReset,resetMobileControls); bindPress(document.getElementById("pauseSetUpdateLog"),()=>openUpdateLog({index:0, auto:false}));
  bindPress(document.getElementById("mobileLayoutSave"),()=>closeMobileLayoutEditor(true)); bindPress(document.getElementById("mobileLayoutCancel"),()=>closeMobileLayoutEditor(false)); bindPress(document.getElementById("mobileLayoutCancelTop"),()=>closeMobileLayoutEditor(false)); bindPress(document.getElementById("mobileLayoutReset"),()=>{Object.assign(inputSettings,MOBILE_CONTROL_DEFAULTS); mobileLayoutDraft=presetMobileLayout("STANDARD"); renderMobileLayoutEditor();}); bindPress(document.getElementById("mobileLayoutSwap"),()=>{[mobileLayoutDraft.actionX,mobileLayoutDraft.scratchX]=[mobileLayoutDraft.scratchX,mobileLayoutDraft.actionX];[mobileLayoutDraft.actionY,mobileLayoutDraft.scratchY]=[mobileLayoutDraft.scratchY,mobileLayoutDraft.actionY]; renderMobileLayoutEditor();}); bindPress(document.getElementById("mobileLayoutPreset"),()=>{const i=(MOBILE_CONTROL_PRESETS.indexOf(inputSettings.mobileControlPreset)+1)%3; inputSettings.mobileControlPreset=MOBILE_CONTROL_PRESETS[i]; mobileLayoutDraft=presetMobileLayout(inputSettings.mobileControlPreset); renderMobileLayoutEditor();});
  bindPress(document.getElementById("mobileActionSizeDown"),()=>{inputSettings.mobileActionSize=finiteRange(inputSettings.mobileActionSize-4,64,124,88);renderMobileLayoutEditor();}); bindPress(document.getElementById("mobileActionSizeUp"),()=>{inputSettings.mobileActionSize=finiteRange(inputSettings.mobileActionSize+4,64,124,88);renderMobileLayoutEditor();}); bindPress(document.getElementById("mobileScratchSizeDown"),()=>{inputSettings.mobileScratchSize=finiteRange(inputSettings.mobileScratchSize-4,64,124,88);renderMobileLayoutEditor();}); bindPress(document.getElementById("mobileScratchSizeUp"),()=>{inputSettings.mobileScratchSize=finiteRange(inputSettings.mobileScratchSize+4,64,124,88);renderMobileLayoutEditor();}); bindPress(document.getElementById("mobileOpacityDown"),()=>{inputSettings.mobileButtonOpacity=finiteRange(inputSettings.mobileButtonOpacity-.05,.35,1,.68);renderMobileLayoutEditor();}); bindPress(document.getElementById("mobileOpacityUp"),()=>{inputSettings.mobileButtonOpacity=finiteRange(inputSettings.mobileButtonOpacity+.05,.35,1,.68);renderMobileLayoutEditor();}); bindPress(document.getElementById("mobileInputTestClose"),closeMobileInputTest);
  bindPress(addCutBtn,()=>addEditorNote("cut"));bindPress(addSwingCWBtn,()=>addEditorNote("swingCW"));bindPress(addSwingCCWBtn,()=>addEditorNote("swingCCW"));bindPress(addFxBtn,()=>addEditorNote("fx"));bindPress(addSlideCWBtn,()=>addEditorNote("slideCW"));bindPress(addSlideCCWBtn,()=>addEditorNote("slideCCW"));bindPress(addScratchCWBtn,()=>addEditorNote("scratchCW"));bindPress(addScratchCCWBtn,()=>addEditorNote("scratchCCW"));
  bindPress(seekBackBtn,()=>{song.currentTime=Math.max(0,song.currentTime-1);updateEditorStatus();});
  bindPress(seekFwdBtn,()=>{song.currentTime=Math.min(song.duration||999,song.currentTime+1);updateEditorStatus();});
  bindPress(playPauseBtn,()=>{ensureAudioCtx();applyMusicVolume();if(song.paused)playSong("play").catch(()=>{});else pauseSong("pause");updateEditorStatus();});
  bindPress(deleteLastBtn,()=>{customChartData.pop();rebuildCustomChart();});
  bindPress(exportBtn,exportChart);bindPress(importBtn,importChart);
  bindPress(clearChartBtn,()=>{customChartData=[];useCustomChart=false;rebuildCustomChart();});
  keymapOverlay.addEventListener("click",e=>{if(e.target===keymapOverlay)toggleKeymap(false);});
  if(debugMode)setDebugOverlayVisible(true);
  function snapEditorAngle(raw){ if(!editorAngleSnap) return normalizeAngleDeg(raw); const step=360/editorAngleSnap; return normalizeAngleDeg(Math.round(raw/step)*step); }
  function setEditorAngle(raw){ selectedEditorAngle=snapEditorAngle(raw); selectedLane=Math.round(selectedEditorAngle/45)%8; if(laneGrid) laneGrid.querySelectorAll("[data-lane]").forEach(b=>b.classList.toggle("on",Number(b.dataset.lane)===selectedLane)); updateEditorStatus(); }
  if(angleSnapSelect) angleSnapSelect.addEventListener("change",()=>{editorAngleSnap=angleSnapSelect.value==="FREE"?0:Number(angleSnapSelect.value)||8; setEditorAngle(selectedEditorAngle);});
  if(editorAngleInput) editorAngleInput.addEventListener("change",()=>setEditorAngle(Number(editorAngleInput.value)||0));
  if(laneGrid) laneGrid.addEventListener("click",e=>{const btn=e.target.closest("[data-lane]");if(!btn)return;setEditorAngle((Number(btn.dataset.lane)||0)*45);});

  // AUTO is deliberately the desktop-safe absolute mode. Pointer Lock is an
  // opt-in control scheme and must never be selected merely by starting play.
  function wantsLockedAim(pointerType="mouse"){ return pointerType==="mouse" && !isCoarsePointerMobile() && inputSettings.pcAimMode==="LOCKED" && !pointerLockFallback; }
  function pointerLockActive(){ return document.pointerLockElement===canvas; }
  function rebaseLockedAim(){ lockedVirtualAngle=Number.isFinite(judgementAimAngle)?judgementAimAngle:rawInputAngle; aimInput.rebasePending=true; }
  function releasePointerLock(){ if(pointerLockActive() && document.exitPointerLock) document.exitPointerLock(); pointerLockRequested=false; }
  function requestPointerLockForAim(e){
    if(!wantsLockedAim(e?.pointerType||"mouse") || !canvas?.requestPointerLock) return;
    pointerLockFallback=false; pointerLockRequested=true; rebaseLockedAim();
    try{ const result=canvas.requestPointerLock(); if(result?.catch) result.catch(()=>{ pointerLockFallback=true; pointerLockRequested=false; setPauseMessage("AIM LOCK UNAVAILABLE · ABSOLUTE MODE"); }); }
    catch(_){ pointerLockFallback=true; pointerLockRequested=false; setPauseMessage("AIM LOCK UNAVAILABLE · ABSOLUTE MODE"); }
  }
  function processLockedAimMovement(e){
    const mx=Math.max(-240,Math.min(240,Number(e.movementX)||0)), my=Math.max(-240,Math.min(240,Number(e.movementY)||0));
    lastRelativeMovement={x:mx,y:my}; const theta=lockedVirtualAngle; const tangentDelta=-Math.sin(theta)*mx+Math.cos(theta)*my;
    lockedVirtualAngle += tangentDelta/Math.max(hitR,1)*inputSettings.lockedAimSensitivity;
    processAimSample(cx+Math.cos(lockedVirtualAngle)*hitR,cy+Math.sin(lockedVirtualAngle)*hitR,Number.isFinite(e.timeStamp)?e.timeStamp:performance.now(),"pointer");
  }
  document.addEventListener("pointerlockchange",()=>{ if(pointerLockActive()){ pointerLockRequested=false; rebaseLockedAim(); return; } if(pointerLockRequested){ pointerLockFallback=true; pointerLockRequested=false; } if(running&&!paused){ releaseMobilePointers(); showPause("AIM LOCK RELEASED"); } rebaseLockedAim(); });
  document.addEventListener("pointerlockerror",()=>{ pointerLockFallback=true; pointerLockRequested=false; setPauseMessage("AIM LOCK UNAVAILABLE · ABSOLUTE MODE"); });
  function updateGameplayPointerFromEvent(e,source){
    if(isAimPointerBlockedTarget(e.target))return;
    if(pointerLockActive() && (e.pointerType==="mouse" || source==="pointer")){ processLockedAimMovement(e); lastPointerMs=performance.now(); pointerActive=true; return; }
    const fallbackPoint=e.touches?.[0] || e.changedTouches?.[0] || e;
    const samples=typeof e.getCoalescedEvents==="function" ? e.getCoalescedEvents() : [fallbackPoint];
    for(const point of samples.length?samples:[fallbackPoint]){
      if(!Number.isFinite(point.clientX)||!Number.isFinite(point.clientY))continue;
      // The gameplay canvas uses viewport CSS pixels, so client coordinates are its native coordinate system.
      processAimSample(point.clientX,point.clientY,Number.isFinite(point.timeStamp)?point.timeStamp:performance.now(),source);
    }
    lastPointerMs=performance.now(); pointerActive=true;
    if(tutorialMode&&performance.now()>=tutorialState.inputEnabledAt){ tutorialState.pointerMoved=true; tutorialState.lastSource=source; }
  }
  if(window.PointerEvent){
    window.addEventListener("pointermove",e=>{ if(!(isCoarsePointerMobile()&&e.pointerType==="touch")) updateGameplayPointerFromEvent(e,e.pointerType==="touch"?"touch":"pointer"); },{passive:true});
  }else{
    window.addEventListener("mousemove",e=>updateGameplayPointerFromEvent(e,"pointer"),{passive:true});
    window.addEventListener("touchmove",e=>{ if(!isCoarsePointerMobile()) updateGameplayPointerFromEvent(e,"touch"); },{passive:true});
  }
  canvas.addEventListener("contextmenu",e=>e.preventDefault());
  function isAimPointerBlockedTarget(target){return !!(target && target.closest && target.closest("#safeMenu,#safeOverlay,.updateLogOverlay,.keymapOverlay,.pauseOverlay,.tutorialPrompt,.tutorialComplete,.tuner,.editorPanel,.start,.mobileControls,.mobileGameplayControls,.mobileLayoutOverlay,.mobileInputTestOverlay,.selfTestOverlay"));}
  function isUiInputTarget(target){return !!(target && target.closest && target.closest("button,#safeMenu,#safeOverlay,.updateLogOverlay,.keymapOverlay,.pauseOverlay,.tutorialPrompt,.tutorialHud,.tutorialComplete,.tuner,.mobileControls,.quickMenu,.editorPanel,.start,.mobileGameplayControls,.mobileLayoutOverlay,.mobileInputTestOverlay,.selfTestOverlay"));}
  function releaseMobilePointers(){ mobileAimPointerId=null; mobileActionPointerId=null; mobileScratchPointerId=null; keys.MouseLeft=false; forceReleaseScratch(); filterHeld=false; mouseDownRight=false; mobileActionBtn?.classList.remove("mobileActionActive"); mobileScratchBtn?.classList.remove("mobileScratchActive"); }
  function handleMobileAimPointer(e){ if(e.pointerId!==mobileAimPointerId) return; updateGameplayPointerFromEvent(e,"touch"); }
  if(window.PointerEvent){
    canvas.addEventListener("pointerdown",e=>{ if(!isCoarsePointerMobile()||e.pointerType!=="touch"||isUiInputTarget(e.target)||mobileAimPointerId!==null) return; mobileAimPointerId=e.pointerId; try{canvas.setPointerCapture(e.pointerId);}catch(err){} updateGameplayPointerFromEvent(e,"touch"); e.preventDefault(); },{passive:false});
    canvas.addEventListener("pointermove",e=>{ if(isCoarsePointerMobile()&&e.pointerType==="touch"){ handleMobileAimPointer(e); e.preventDefault(); } },{passive:false});
    const endAim=e=>{ if(e.pointerId===mobileAimPointerId) mobileAimPointerId=null; };
    canvas.addEventListener("pointerup",endAim,{passive:true}); canvas.addEventListener("pointercancel",endAim,{passive:true});
  }
  window.addEventListener("mousedown",e=>{if(isUiInputTarget(e.target))return; lastPointerSource="pointer"; lastPointerMs=performance.now(); pointerActive=true; tutorialState.activeInput="pointer"; tutorialState.lastSource="pointer"; if(e.button===0){keys.MouseLeft=true; if(running)onCut();} if(e.button===2){mouseDownRight=true;filterHeld=true;setScratchHeld(true);}});
  window.addEventListener("mouseup",e=>{if(e.button===0)keys.MouseLeft=false; if(e.button===2){mouseDownRight=false;filterHeld=false;setScratchHeld(!!(keys.ShiftLeft||keys.ShiftRight));}});
  window.addEventListener("touchstart",e=>{ if(isCoarsePointerMobile()) return; if(isUiInputTarget(e.target))return; lastPointerMs=performance.now(); pointerActive=true; tutorialState.activeInput="touch"; tutorialState.lastSource="touch"; if(e.touches&&e.touches[0]){ updateGameplayPointerFromEvent(e,"touch"); } if(e.touches&&e.touches.length>=2){mouseDownRight=true;filterHeld=true;setScratchHeld(true);} else if(running)onCut();},{passive:true});
  window.addEventListener("touchend",e=>{ if(isCoarsePointerMobile()) return; if(!e.touches||e.touches.length<2){mouseDownRight=false;setScratchHeld(false);} if(!e.touches||e.touches.length===0)keys.MouseLeft=false;},{passive:true});
  function bindMobileGameButton(btn,role){
    if(!btn||!window.PointerEvent)return;
    btn.addEventListener("pointerdown",e=>{ if(!isCoarsePointerMobile()||e.pointerType!=="touch")return; e.preventDefault(); e.stopPropagation(); try{btn.setPointerCapture(e.pointerId);}catch(err){} if(role==="action"&&mobileActionPointerId===null){ mobileActionPointerId=e.pointerId; keys.MouseLeft=true; btn.classList.add("mobileActionActive"); tutorialState.activeInput="touch"; tutorialState.lastSource="touch"; if(running)onCut(); } if(role==="scratch"&&mobileScratchPointerId===null){ mobileScratchPointerId=e.pointerId; setScratchHeld(true); btn.classList.add("mobileScratchActive"); filterHeld=true; mouseDownRight=true; tutorialState.activeInput="touch"; tutorialState.lastSource="touch"; } },{passive:false});
    const release=e=>{ if(role==="action"&&e.pointerId===mobileActionPointerId){ keys.MouseLeft=false; mobileActionPointerId=null; btn.classList.remove("mobileActionActive"); } if(role==="scratch"&&e.pointerId===mobileScratchPointerId){ setScratchHeld(false); filterHeld=false; mouseDownRight=false; mobileScratchPointerId=null; btn.classList.remove("mobileScratchActive"); } };
    btn.addEventListener("pointerup",release,{passive:true}); btn.addEventListener("pointercancel",release,{passive:true});
  }
  bindMobileGameButton(mobileActionBtn,"action"); bindMobileGameButton(mobileScratchBtn,"scratch");
  window.addEventListener("pointercancel",releaseMobilePointers,{passive:true});
  window.addEventListener("resize",()=>{ releaseMobilePointers(); applyMobileControlLayout(); if(mobileLayoutEditing) renderMobileLayoutEditor(); }); window.addEventListener("orientationchange",()=>setTimeout(()=>{ releaseMobilePointers(); applyMobileControlLayout(); if(mobileLayoutEditing) renderMobileLayoutEditor(); },80)); applyMobileControlLayout();
  document.addEventListener("visibilitychange",()=>{ if(document.hidden){ releaseMobilePointers(); if(running && !paused) showPause(); } });


  const mobileInputTest={open:false,active:new Map(),cancel:0,trail:[],pass:[false,false,false,false,false,false],lastEvent:0};
  function openMobileInputTest(){ releaseMobilePointers(); mobileInputTest.open=true; mobileInputTestOverlay.hidden=false; drawMobileInputTest(); }
  function closeMobileInputTest(){ mobileInputTest.open=false; mobileInputTestOverlay.hidden=true; mobileInputTest.active.clear(); }
  function drawMobileInputTest(){ if(!mobileInputTest.open||!mobileInputTestCanvas)return; const c=mobileInputTestCanvas, r=c.getBoundingClientRect(), dpr=window.devicePixelRatio||1; c.width=r.width*dpr; c.height=r.height*dpr; const g=c.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,r.width,r.height); const mx=r.width/2,my=r.height/2,rr=Math.min(r.width,r.height)*.26; g.strokeStyle='rgba(92,255,251,.4)'; g.lineWidth=2; g.beginPath(); g.arc(mx,my,rr,0,TAU); g.stroke(); if(mobileInputTest.trail.length){ g.strokeStyle='#ffe15a'; g.beginPath(); mobileInputTest.trail.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y)); g.stroke(); } mobileInputTest.active.forEach((p,id)=>{ g.fillStyle=p.role==='action'?'#5cfffb':p.role==='scratch'?'#d047ff':'#fff'; g.beginPath(); g.arc(p.x,p.y,12,0,TAU); g.fill(); g.fillText(String(id),p.x+14,p.y); }); const aim=[...mobileInputTest.active.values()].find(p=>p.role==='aim'); const angle=aim?Math.atan2(aim.y-my,aim.x-mx):-Math.PI/2; g.strokeStyle='#79ff7d'; g.beginPath(); g.moveTo(mx,my); g.lineTo(mx+Math.cos(angle)*rr,my+Math.sin(angle)*rr); g.stroke(); const active=mobileInputTest.active.size, action=[...mobileInputTest.active.values()].some(p=>p.role==='action'), scratch=[...mobileInputTest.active.values()].some(p=>p.role==='scratch'); mobileInputTest.pass[0] ||= !!aim; mobileInputTest.pass[1] ||= action; mobileInputTest.pass[2] ||= action&&!!aim; mobileInputTest.pass[3] ||= scratch&&!!aim&&mobileInputTest.trail.length>4; mobileInputTest.pass[4] ||= active>=3; mobileInputTest.pass[5] ||= active===0&&mobileInputTest.pass.slice(0,5).every(Boolean); if(mobileInputTestStats) mobileInputTestStats.textContent=`AIM pointer ID: ${mobileAimPointerId}\nACTION pointer ID: ${mobileActionPointerId}\nSCRATCH pointer ID: ${mobileScratchPointerId}\nactive touches: ${active}\ncurrent AIM angle: ${Math.round(angle*180/Math.PI)}°\nrawAngularVelocity: ${rawAngularVelocity.toFixed(3)}\nACTION ${action?'DOWN':'UP'}\nSCRATCH ${scratch?'DOWN':'UP'}\npointercancel count: ${mobileInputTest.cancel}\nrecent input event time: ${Math.round(mobileInputTest.lastEvent)}`; if(mobileInputTestSteps) mobileInputTestSteps.innerHTML=['AIM drag','ACTION other finger','ACTION hold + AIM drag','SCRATCH hold + AIM rotate','third finger touch','release all fingers'].map((t,i)=>`<li class="${mobileInputTest.pass[i]?'pass':''}">${t} ${mobileInputTest.pass[i]?'PASS':''}</li>`).join(''); requestAnimationFrame(drawMobileInputTest); }
  if(mobileInputTestCanvas){ const upd=(e,role)=>{ if(!mobileInputTest.open)return; e.preventDefault(); const r=mobileInputTestCanvas.getBoundingClientRect(); mobileInputTest.lastEvent=performance.now(); mobileInputTest.active.set(e.pointerId,{x:e.clientX-r.left,y:e.clientY-r.top,role}); if(role==='aim'){ mobileInputTest.trail.push({x:e.clientX-r.left,y:e.clientY-r.top}); if(mobileInputTest.trail.length>50) mobileInputTest.trail.shift(); } }; mobileInputTestCanvas.addEventListener('pointerdown',e=>{ const role=mobileInputTest.active.size===0?'aim':mobileInputTest.active.size===1?'action':mobileInputTest.active.size===2?'scratch':'extra'; try{mobileInputTestCanvas.setPointerCapture(e.pointerId)}catch(_){} upd(e,role); },{passive:false}); mobileInputTestCanvas.addEventListener('pointermove',e=>upd(e,mobileInputTest.active.get(e.pointerId)?.role||'aim'),{passive:false}); const end=e=>{ mobileInputTest.lastEvent=performance.now(); mobileInputTest.active.delete(e.pointerId); if(e.type==='pointercancel') mobileInputTest.cancel++; }; mobileInputTestCanvas.addEventListener('pointerup',end); mobileInputTestCanvas.addEventListener('pointercancel',end); }

  function sortedChangelogEntries(){
    return [...changelogEntries].sort((a,b)=>String(b.date || b.version || "").localeCompare(String(a.date || a.version || "")));
  }

  const updateLogState = { index:0, auto:false };

  function currentVersionString(){
    return versionInfo.version || "0.0.0";
  }

  function markCurrentVersionSeen(){
    try{ localStorage.setItem(LAST_SEEN_VERSION_KEY, currentVersionString()); }catch(e){}
  }

  function isUpdateLogOpen(){
    const overlay=document.getElementById("updateLogOverlay");
    return !!(overlay && overlay.classList.contains("show"));
  }

  function renderUpdateLog(){
    const entries=sortedChangelogEntries();
    const entry=entries[updateLogState.index] || entries[0];
    const versionEl=document.getElementById("updateLogVersion");
    const body=document.getElementById("updateLogBody");
    const prev=document.getElementById("updateLogPrev");
    const next=document.getElementById("updateLogNext");
    if(!entry || !body || !versionEl) return;
    versionEl.textContent=`v${entry.version} · ${entry.date || ""}`;
    body.innerHTML=`<h3 class="updateLogEntryTitle">${entry.title || "Update"}</h3><p class="updateLogSummary">${entry.summary || ""}</p>${(entry.changes || []).map(change=>`<div class="updateLogChange"><strong class="updateLogCategory">[${change.category || "SYSTEM"}]</strong><span class="updateLogText">${change.text || ""}</span></div>`).join("")}`;
    if(prev) prev.disabled = updateLogState.index >= entries.length - 1;
    if(next) next.disabled = updateLogState.index <= 0;
  }

  function openUpdateLog(options={}){
    const overlay=document.getElementById("updateLogOverlay");
    if(!overlay) return;
    updateLogState.index = Math.max(0, Math.min(options.index || 0, sortedChangelogEntries().length - 1));
    updateLogState.auto = !!options.auto;
    renderUpdateLog();
    overlay.hidden=false;
    overlay.classList.add("show");
    document.body.classList.add("updateLogOpen");
    const body=document.getElementById("updateLogBody");
    if(body) body.focus({preventScroll:true});
  }

  function closeUpdateLog(){
    const overlay=document.getElementById("updateLogOverlay");
    if(overlay){ overlay.classList.remove("show"); overlay.hidden=true; }
    document.body.classList.remove("updateLogOpen");
    markCurrentVersionSeen();
    updateLogState.auto=false;
  }

  function disableCircleMixDevMode(){
    try{ localStorage.removeItem("circleMixDevMode"); }catch(e){}
    circleMixDevMode=false;
    const btn=document.getElementById("safeUpdateLogBtn");
    if(btn) btn.hidden=false;
    const devOffBtn=document.getElementById("updateLogDevOff");
    if(devOffBtn) devOffBtn.hidden=true;
    closeUpdateLog();
  }

  function initVersionAndUpdateLog(){
    const versionText=document.getElementById("safeVersionText");
    const updateBtn=document.getElementById("safeUpdateLogBtn");
    if(versionText) versionText.textContent=`CIRCLE MIX v${currentVersionString()}`;
    if(updateBtn){ updateBtn.hidden=false; safeBind(updateBtn,()=>openUpdateLog({index:0, auto:false})); }
    const devOffBtn=document.getElementById("updateLogDevOff");
    if(devOffBtn) devOffBtn.hidden=!circleMixDevMode;
    safeBind(document.getElementById("updateLogClose"), closeUpdateLog);
    safeBind(document.getElementById("updateLogCloseIcon"), closeUpdateLog);
    safeBind(document.getElementById("updateLogDevOff"), disableCircleMixDevMode);
    safeBind(document.getElementById("updateLogPrev"), ()=>{ updateLogState.index=Math.min(updateLogState.index+1, sortedChangelogEntries().length-1); renderUpdateLog(); });
    safeBind(document.getElementById("updateLogNext"), ()=>{ updateLogState.index=Math.max(updateLogState.index-1, 0); renderUpdateLog(); });
    let lastSeen="";
    try{ lastSeen=localStorage.getItem(LAST_SEEN_VERSION_KEY) || ""; }catch(e){}
    if(currentVersionString() !== lastSeen && activeSceneName() === "title") setTimeout(()=>{ if(activeSceneName() === "title") openUpdateLog({index:0, auto:true}); }, 120);
  }

  window.addEventListener("keydown",e=>{
    if(isUpdateLogOpen()){
      if(e.code==="Escape"){ e.preventDefault(); closeUpdateLog(); }
      return;
    }
    keys[e.code]=true;
    if(e.code==="KeyA")keyA=true;
    if(e.code==="KeyD")keyD=true;
    if(e.code==="Space"||e.code==="KeyZ"||e.code==="KeyX"){e.preventDefault(); tutorialState.activeInput="keyboard"; tutorialState.lastSource="keyboard"; if(!e.repeat)onCut();}
    if(e.code==="F3"&&!e.repeat){e.preventDefault();toggleDebugOverlay();}
    if(e.code==="KeyO"&&!e.repeat){toggleAuto("keyboard");}
    if(e.code==="KeyP"&&!e.repeat){ ensureAudioCtx(); applyMusicVolume(); if(song.paused) playSong("play").catch(()=>{}); else pauseSong("pause"); }
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
      if(/^Digit[1-8]$/.test(e.code)){setEditorAngle((Number(e.code.slice(-1))-1)*45);}
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
    if(e.code==="Escape"&&!e.repeat){ if(tutorialMode && paused){ resumeGame(); return; } if(keymapOverlay&&keymapOverlay.classList.contains("show")) toggleKeymap(false); else if(resultOverlay&&resultOverlay.classList.contains("show")) return; else if(pauseSettingsOpen) closePauseSettings(); else if(paused) resumeGame(); else showPause(); }
    if(e.code==="F4"&&!e.repeat)toggleDebugOverlay();
    if(e.code==="KeyF"&&!e.repeat)requestFullscreenSafe();
    if(e.code==="KeyH"&&!e.repeat)toggleSettings();
    if(e.code==="KeyE"&&!e.repeat){toggleSettings(true); toggleEditor();}
    if(e.code==="ShiftLeft"||e.code==="ShiftRight")setScratchHeld(true);
  });
  window.addEventListener("keyup",e=>{
    keys[e.code]=false;
    if(e.code==="KeyA")keyA=false;
    if(e.code==="KeyD")keyD=false;
    if(e.code==="ShiftLeft"||e.code==="ShiftRight")setScratchHeld(!!(mouseDownRight||keys.ShiftLeft||keys.ShiftRight));
  });

  song.addEventListener("ended", ()=>scheduleCompletion());

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
  const safeSetUpdateLog=document.getElementById("safeSetUpdateLog");
  const safeSetFull=document.getElementById("safeSetFull");
  const safeSetSfx=document.getElementById("safeSetSfx");
  const safeSetMusic=document.getElementById("safeSetMusic");
  const safeSetSpdDown=document.getElementById("safeSetSpdDown");
  const safeSetSpdUp=document.getElementById("safeSetSpdUp");
  const safeSetOffDown=document.getElementById("safeSetOffDown");
  const safeSetOffUp=document.getElementById("safeSetOffUp");
  const safeSetNoteContrast=document.getElementById("safeSetNoteContrast");
  const safeSetPathBrightness=document.getElementById("safeSetPathBrightness");
  const safeSetEffectIntensity=document.getElementById("safeSetEffectIntensity");
  const safeSetJudgeGuide=document.getElementById("safeSetJudgeGuide");
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
        try{ pauseSong("pause"); }catch(e){}
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

  function escapeHtml(value){
    return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
  }
  function escapeAttribute(value){ return escapeHtml(value); }

  function renderSongSelect(){
    if(!songCarousel || !songDifficulty) return;
    selectedSource = songTab==="local" ? "local" : "builtin";
    const tabHtml = `<div class="songTabs"><button class="songTab ${selectedSource!=="local"?"on":""}" data-tab="built-in" type="button">BUILT-IN</button><button class="songTab ${selectedSource==="local"?"on":""}" data-tab="local" type="button">LOCAL</button></div>`;
    const list = selectedSource==="local" ? songs.localAll() : songs.all();
    if(selectedSource==="builtin"){
      if(!selectedSongId || !list.some(s=>s.id===selectedSongId)) selectedSongId=list[0]?.id || null;
      selectedSong=selectedSongId ? resolveSelectedSong(selectedSongId,"builtin") : null;
      if(!songs.hasDifficulty(selectedSong, selectedDifficultyId || selectedMenuMode)) selectedDifficultyId=difficultyIds(selectedSong)[0] || null;
      selectedMenuMode=selectedDifficultyId || "tech";
      mapMode=selectedMenuMode;
    }else{
      if(selectedSongId && !list.some(s=>s.id===selectedSongId)){ selectedSongId=null; selectedDifficultyId=null; selectedSong=null; }
      if(selectedSongId) resolveSelectedSong(selectedSongId,"local"); else selectedSong=null;
      const localCharts=localChartEntries(selectedSong);
      if(selectedDifficultyId && !localCharts.some(c=>c.id===selectedDifficultyId)) selectedDifficultyId=null;
      if(localCharts.length===1 && !selectedDifficultyId) selectedDifficultyId=localCharts[0].id;
      selectedMenuMode=selectedDifficultyId || "";
      mapMode=selectedMenuMode;
    }
    syncSongUrl();
    songCarousel.innerHTML = tabHtml + (list.length ? list.map(songData => {
      const active = songData.id === selectedSongId;
      const chartEntries = songData.source==="local" ? localChartEntries(songData) : difficultyIds(songData).map(id=>({id}));
      const diffs=chartEntries.map(({id})=>{ const diff=difficultyViewForSong(songData,id); return `${escapeHtml(diff?.label || id.toUpperCase())} ${escapeHtml(formatStarValue(diff?.stars))}`; }).join(" · ");
      const songIdAttr=escapeAttribute(songData.id);
      const songTitle=escapeHtml(songData.title || "UNKNOWN");
      const artist=escapeHtml(songData.artist || "UNKNOWN");
      const bpm=escapeHtml(songData.bpm || "--");
      const manage=songData.source==="local" ? `<div class="songManage"><button data-action="exportChart" data-song-id="${songIdAttr}">EXPORT CHART .CMIX</button><button data-action="exportFull" data-song-id="${songIdAttr}" ${songData.audioBlob?"":"disabled"}>EXPORT FULL .CMIX</button><button data-action="rename" data-song-id="${songIdAttr}">EDIT META</button><button data-action="clone" data-song-id="${songIdAttr}">CLONE</button><button data-action="restore" data-song-id="${songIdAttr}">RESTORE PREVIOUS</button><button data-action="delete" data-song-id="${songIdAttr}">DELETE</button><button data-action="deleteBackups" data-song-id="${songIdAttr}">DELETE + BACKUP</button><a href="./editor.html?localSong=${encodeURIComponent(songData.id)}">OPEN EDITOR</a></div>` : (songData.audioRequired ? `<div class="songManage"><button data-audio-action="${songData.audioLinked ? "unlink" : "link"}" data-song-id="${songIdAttr}">${songData.audioLinked ? "UNLINK LOCAL AUDIO" : "LINK LOCAL AUDIO"}</button><small>${escapeHtml(songData.audioLinked ? "LOCAL AUDIO LINKED · NOT UPLOADED" : songData.audioNotice)}</small></div>` : "");
      const jacketUrl=localJacketUrl(songData);
      const jacket=jacketUrl ? `<img src="${escapeAttribute(jacketUrl)}" alt="" loading="lazy" onerror="this.remove()">` : "";
      return `<div class="songCard${active ? " active" : ""}" data-song-id="${songIdAttr}">
        <button class="songCardPick" type="button" data-song-id="${songIdAttr}"><div class="songJacket" aria-hidden="true">${jacket}<span>${songTitle}</span></div>
        <div class="songMeta"><span>${artist}</span><strong>${songTitle}</strong><em>${bpm} BPM</em><small>${diffs || "NO CHART"}</small></div></button>${manage}
      </div>`;
    }).join("") : `<div class="localEmpty"><p>NO SONGS INSTALLED<br>IMPORT A .CMIX PACKAGE TO BEGIN</p><button class="songPlayBtn" id="openImportFromEmpty" type="button">IMPORT .CMIX</button></div>`);
    for(const tab of songCarousel.querySelectorAll(".songTab")){ bindPress(tab,async()=>{ songTab=tab.dataset.tab; selectedSource=songTab==="local"?"local":"builtin"; if(selectedSource==="local"){ selectedSongId=null; selectedDifficultyId=null; selectedSong=null; }else{ selectedSongId=songs.all()[0]?.id || null; selectedDifficultyId=null; } try{ pauseSong("reset"); setSongCurrentTime(0,"reset"); }catch(e){} await songs.refreshLocal(); renderSongSelect(); }); }
    const emptyBtn=document.getElementById("openImportFromEmpty"); if(emptyBtn) bindPress(emptyBtn,()=>window.CircleMixCmixImport?.open?.());
    for(const card of songCarousel.querySelectorAll(".songCardPick")){
      bindPress(card,()=>{ try{ pauseSong("reset"); setSongCurrentTime(0,"reset"); }catch(e){} resolveSelectedSong(card.dataset.songId, selectedSource); selectedDifficultyId=null; renderSongSelect(); });
    }
    for(const btn of songCarousel.querySelectorAll(".songManage button[data-action]")){
      bindPress(btn,async()=>{ const id=btn.dataset.songId, action=btn.dataset.action; const rec=await window.CircleMixLocalSongs.get(id); if(!rec)return;
        if(action==="exportChart"||action==="exportFull"){ try{ btn.disabled=true; btn.textContent="EXPORTING…"; const adapter=window.CircleMixSongPackageAdapter, exporter=window.CircleMixCmixExporter; let duration=rec.actualDuration||rec.audioMetadata?.duration||rec.duration; if(!duration&&rec.audioBlob) duration=await window.CircleMixCmixAudio.metadata(rec.audioBlob); const exportRecord={...rec,audioMetadata:{...(rec.audioMetadata||{}),duration}}; const input=action==="exportChart"?adapter.songRecordToChartPackageInput(exportRecord,rec.audioMatch||{durationSeconds:duration,durationToleranceSeconds:rec.durationTolerance||2,sha256:rec.actualSha256||undefined,suggestedFilename:rec.localAudioFileName||undefined}):adapter.songRecordToFullPackageInput(exportRecord); const pkg=action==="exportChart"?await exporter.createChartPackage(input):await exporter.createFullPackage(input); const url=URL.createObjectURL(pkg.blob), a=document.createElement("a"); a.href=url;a.download=pkg.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),0); }catch(error){ alert(`EXPORT FAILED: ${error.message}`); }finally{ btn.disabled=false; btn.textContent=action==="exportChart"?"EXPORT CHART .CMIX":"EXPORT FULL .CMIX"; } return; } if(action==="restore"){ try{ await window.CircleMixLocalSongs.restorePrevious(id); await songs.refreshLocal(); renderSongSelect(); }catch(error){ alert(`RESTORE FAILED: ${error.message}`); } } if(action==="delete"||action==="deleteBackups"){ if(confirm(`${rec.title}을(를) 삭제할까요? 오디오와 모든 채보${action==="deleteBackups"?" 및 backup":""}도 함께 삭제됩니다.`)){ await window.CircleMixLocalSongs.delete(id,{withBackup:action==="deleteBackups"}); revokeLocalJacketUrl(id); await songs.refreshLocal(); selectedSongId=null; selectedDifficultyId=null; selectedSong=null; renderSongSelect(); } } if(action==="clone"){ const copy={...rec,id:rec.id+"-copy",title:rec.title+" Copy",updatedAt:new Date().toISOString()}; await window.CircleMixLocalSongs.put(copy); await songs.refreshLocal(); resolveSelectedSong(copy.id,"local"); renderSongSelect(); } if(action==="rename"){ const title=prompt("곡명",rec.title); if(title===null)return; const artist=prompt("아티스트",rec.artist||""); if(artist===null)return; await window.CircleMixLocalSongs.put({...rec,title:title.trim()||rec.title,artist:artist.trim()||rec.artist,updatedAt:new Date().toISOString()}); await songs.refreshLocal(); renderSongSelect(); } });
    }
    for(const btn of songCarousel.querySelectorAll(".songManage button[data-audio-action]")){
      bindPress(btn,async()=>{
        const id=btn.dataset.songId;
        if(btn.dataset.audioAction==="unlink"){
          await window.CircleMixBuiltinAudio.delete(id);
          await songs.refreshBuiltinAudio();
          resolveSelectedSong(id,"builtin");
          renderSongSelect();
          return;
        }
        const picker=document.createElement("input");
        picker.type="file"; picker.accept="audio/*";
        picker.addEventListener("change",async()=>{
          const file=picker.files?.[0];
          if(!file)return;
          await window.CircleMixBuiltinAudio.put(id,file);
          await songs.refreshBuiltinAudio();
          resolveSelectedSong(id,"builtin");
          renderSongSelect();
        },{once:true});
        picker.click();
      });
    }
    let diffHtml="";
    if(selectedSource==="local" && !selectedSong){
      diffHtml = `<div class="songDiffEmpty">로컬 곡을 선택하거나 에디터에서 곡을 만들어주세요.</div>`;
    }else{
      const entries = selectedSource==="local" ? localChartEntries(selectedSong) : difficultyIds(selectedSong).filter(diff => songs.hasDifficulty(selectedSong, diff)).map(diff=>({id:diff, meta:selectedSong.difficulties[diff]}));
      if(selectedSource==="local" && !entries.length) diffHtml = `<div class="songDiffEmpty">선택한 로컬 곡에 저장된 채보가 없습니다.</div>`;
      else diffHtml = entries.map(({id,meta,chart}) => {
        const label = getActiveDifficultyLabel(selectedSong,id);
        const best = getBestRecord(id, selectedSong);
        const diff=difficultyViewForSong(selectedSong,id);
        const stars = formatStarValue(diff?.stars);
        const bestHtml = best ? `<small>BEST SCORE ${String(best.bestScore || 0).padStart(7,"0")}<br>BEST POWER ${Number.isFinite(best.bestPower) ? best.bestPower : "---"}<br>BEST RANK ${best.bestRank || "---"}<br>BEST ACCURACY ${Number.isFinite(best.bestAccuracy) ? (best.bestAccuracy*100).toFixed(2)+"%" : "---"}</small>` : `<small>BEST SCORE ---<br>BEST POWER ---<br>BEST RANK ---<br>BEST ACCURACY ---</small>`;
        return `<button class="songDiffBtn${selectedDifficultyId===id ? " on" : ""}" type="button" data-difficulty="${escapeAttribute(id)}">${escapeHtml(label)} <span>${escapeHtml(stars)}</span>${bestHtml}</button>`;
      }).join("");
    }
    songDifficulty.innerHTML = diffHtml + `<button class="songDiffBtn songAutoBtn${gameState.autoEnabled ? " on" : ""}" type="button" data-auto-play="true">AUTO PLAY <span>${gameState.autoEnabled ? "ON" : "OFF"}</span></button>`;
    for(const btn of songDifficulty.querySelectorAll(".songDiffBtn[data-difficulty]")){
      bindPress(btn,()=>{ selectedDifficultyId = btn.dataset.difficulty; selectedMenuMode = selectedDifficultyId; mapMode = selectedMenuMode; renderSongSelect(); updateButtons(); });
    }
    cacheDynamicDomRefs(songDifficulty);
    startSongPreview();
    const songAutoBtn=domCache.songAutoBtn;
    bindPress(songAutoBtn,()=>{ toggleAuto("song-select"); });
    if(songPlayBtn) songPlayBtn.disabled = !buildPlayRequest();
  }

  function buildPlayRequest(){
    if(selectedSource==="builtin"){
      if(!selectedSongId || !selectedDifficultyId) return null;
      const songData=songs.all().find(s=>s.id===selectedSongId);
      if(!songData || !songs.hasDifficulty(songData, selectedDifficultyId)) return null;
      return {source:"builtin", songId:selectedSongId, difficultyId:selectedDifficultyId, chartId:selectedDifficultyId};
    }
    if(!selectedSongId || !selectedDifficultyId) return null;
    const songData=songs.localAll().find(s=>s.id===selectedSongId);
    if(!songData || !songData.charts?.[selectedDifficultyId]) return null;
    return {source:"local", songId:selectedSongId, chartId:selectedDifficultyId, difficultyId:selectedDifficultyId};
  }

  async function resolvePlayRequest(req){
    if(!req) throw new Error("실행할 로컬 곡과 채보를 선택해주세요.");
    if(req.source==="builtin"){
      const songData=songs.all().find(s=>s.id===req.songId);
      if(!songData || !songs.hasDifficulty(songData, req.difficultyId)) throw new Error("실행할 내장 곡과 난이도를 선택해주세요.");
      return {source:"builtin", song:songData, chartId:req.difficultyId, difficultyId:req.difficultyId};
    }
    const rec=await window.CircleMixLocalSongs.get(req.songId);
    if(!rec || !rec.charts?.[req.chartId]) throw new Error("실행할 로컬 곡과 채보를 선택해주세요.");
    return {source:"local", song:rec, chart:rec.charts[req.chartId], chartId:req.chartId, difficultyId:req.chartId};
  }

  window.CircleMixOpenLocalSong=async function(id){
    await songs.refreshLocal(); selectedSource="local"; songTab="local"; resolveSelectedSong(id,"local"); selectedDifficultyId=localChartEntries(selectedSong)[0]?.id || null; selectedMenuMode=selectedDifficultyId||""; syncSongUrl(); await showSongSelect();
  };
  // Kept deliberately narrow: public import may only start from a safe menu,
  // never during gameplay, results, tutorial, or a competing dialog.
  window.CircleMixCanImportCmix=function(){
    const importModal=document.getElementById("cmixImportModal");
    return !running && !paused && !tutorialMode && !selfTest.active &&
      !resultOverlay?.classList.contains("show") &&
      (!!songSelect && !songSelect.hidden || !!document.getElementById("startLayer") && !document.getElementById("startLayer").hidden || !!importModal && !importModal.hidden);
  };

  async function showSongSelect(){
    await Promise.all([songs.refreshLocal(), songs.refreshBuiltinAudio?.()]);
    const params=new URLSearchParams(window.location.search);
    selectedSource=params.get("tab")==="local" ? "local" : "builtin";
    songTab=selectedSource==="local" ? "local" : "built-in";
    selectedSongId=selectedSource==="local" ? (params.get("song") || null) : (params.get("song") || selectedSongId || songs.all()[0]?.id || null);
    selectedDifficultyId=selectedSource==="local" ? (params.get("chart") || null) : ((params.get("difficulty") || selectedDifficultyId || "tech").toLowerCase());
    stopSongPreview();
    safeSetState("songSelect");
    document.body.classList.remove("safeClean");
    if(songSelect) songSelect.hidden = false;
    renderSongSelect();
  }

  function showTitleMenu(){
    releasePointerLock();
    cleanupPlaySession({stopAudio:true, hideResultOverlay:true, abort:true});
    if(songSelect) songSelect.hidden = true;
    safeSetState("title", "showTitleMenu");
    safeRefresh();
  }

  async function startSelectedSong(e){
    if(e && isMobileViewport()) await requestFullscreenEnter();
    const req=buildPlayRequest();
    if(!req){ alert("실행할 로컬 곡과 채보를 선택해주세요."); renderSongSelect(); return false; }
    let resolved;
    try{ resolved=await resolvePlayRequest(req); }catch(err){ alert(err.message); if(debugMode) console.warn("[Start Failed] resolvePlayRequest", {request:req, message:err.message}); renderSongSelect(); return false; }
    const sceneBefore=activeSceneName();
    selectedSource=resolved.source;
    activePlaySource=resolved.source;
    activeChartId=resolved.chartId;
    selectedSong=resolved.song;
    selectedSongId=resolved.song.id;
    selectedDifficultyId=resolved.difficultyId;
    selectedMenuMode=resolved.difficultyId;
    mapMode=resolved.difficultyId;
    stopSongPreview();
    if(songSelect) songSelect.hidden = true;
    closeSettingsOverlayOnly();
    safeSetState("game", "startSelectedSong");
    syncSongUrl();
    const ok = await start("play");
    if(debugMode) console.log(`[Start Selected Song]
source=${activePlaySource}
songId=${selectedSong?.id || "-"}
difficulty=${activeChartId || selectedDifficultyId}
difficultyLabel=${getActiveDifficultyLabel(selectedSong, activeChartId || selectedDifficultyId)}
chartLength=${chart.length}
sceneBefore= ${sceneBefore}
sceneAfter= ${activeSceneName()}
settingsOrigin=${settingsOrigin}
running=${running}`);
    if(ok && activeSceneName()!=="game"){
      console.warn("[Start Selected Song] scene corrected to game", {scene:activeSceneName(), settingsOrigin});
      safeSetState("game", "startSelectedSong final correction");
      if(songSelect) songSelect.hidden = true;
    }
    return ok;
  }

  function safeInputEvent(e){
    if(!e)return;
    if(e.cancelable)e.preventDefault();
    e.stopPropagation();
  }

  function safeBind(el,fn){
    if(!el)return;
    let last=0, suppressClickUntil=0;
    const invoke=e=>{
      const m=performance.now();
      if(m-last<180)return;
      last=m;
      try{fn(e);}catch(err){console.error(err);alert("ERROR: "+err.message);}
    };
    const press=e=>safeInputEvent(e);
    const release=e=>{ safeInputEvent(e); suppressClickUntil=performance.now()+420; invoke(e); };
    const click=e=>{
      if(e.detail && performance.now()<suppressClickUntil){ safeInputEvent(e); return; }
      safeInputEvent(e); invoke(e);
    };
    if(window.PointerEvent){
      el.addEventListener("pointerdown",press,{passive:false});
      el.addEventListener("pointerup",release,{passive:false});
      el.addEventListener("pointercancel",safeInputEvent,{passive:false});
    }else{
      el.addEventListener("touchstart",press,{passive:false});
      el.addEventListener("touchend",release,{passive:false});
    }
    el.addEventListener("click",click,{passive:false});
  }

  function safeSetState(state, reason="unspecified"){
    const previous=activeSceneName();
    if(debugMode && previous==="game" && state==="title") console.warn(`[Scene Change] game -> title
reason=${reason}
settingsOrigin=${settingsOrigin}
running=${running}`);
    document.body.classList.toggle("safeTitle", state==="title");
    document.body.classList.toggle("safeSettings", state==="settings");
    document.body.classList.toggle("safeGame", state==="game");
    document.body.classList.toggle("safeSongSelect", state==="songSelect");
    if(safeMenu)safeMenu.style.display=state==="title"?"flex":"none";
    if(songSelect)songSelect.hidden=state!=="songSelect";
    if(safeOverlay)safeOverlay.classList.toggle("show",state==="settings");
    canvas.style.pointerEvents=state==="game"?"auto":"none";
    settingsVisible=state==="settings";
  }

  function closeSettingsOverlayOnly(){
    settingsVisible=false;
    document.body.classList.remove("showSettings");
    if(quickSettingsBtn) quickSettingsBtn.classList.remove("on");
    if(safeOverlay) safeOverlay.classList.remove("show");
    if(pauseSettingsOverlay) pauseSettingsOverlay.classList.remove("show");
    document.body.classList.remove("pauseSettingsOpen");
    pauseSettingsOpen=false;
  }

  function safeSetMenuVisible(v){
    safeSetState(v?"title":(settingsVisible?"settings":"game"), "safeSetMenuVisible");
  }

  function safeSetOverlay(v){
    if(v){
      settingsOrigin=currentSettingsOrigin();
      safeSetState("settings", "safeSetOverlay(open)");
    }else{
      closeSettingsOverlayOnly();
    }
  }

  function safeRefresh(){
    applyMusicVolume();
    if(safeTech){safeTech.classList.toggle("on",selectedMenuMode==="tech");safeTech.textContent="TECH " + formatDifficulty("tech");}
    if(safeNormal){safeNormal.classList.toggle("on",selectedMenuMode==="normal");safeNormal.textContent="NORMAL " + formatDifficulty("normal");}
    if(safeAuto){safeAuto.textContent=gameState.autoEnabled?"AUTO ON":"AUTO OFF";safeAuto.classList.toggle("on",gameState.autoEnabled);}
    if(safeSetAuto){safeSetAuto.textContent=gameState.autoEnabled?"AUTO PLAY ON":"AUTO PLAY OFF";safeSetAuto.classList.toggle("on",gameState.autoEnabled);safeSetAuto.setAttribute("aria-pressed",gameState.autoEnabled?"true":"false");}
    if(safeSetMap){safeSetMap.textContent=mapMode==="tech"?"MAP TECH":"MAP NORMAL";safeSetMap.classList.toggle("on",mapMode==="tech");}
    if(safeSettingsBtn)safeSettingsBtn.textContent="SETTINGS";
    if(safeSetSfx){safeSetSfx.textContent=formatSfx();safeSetSfx.classList.toggle("on",sfxEnabled);}
    if(safeSetMusic)safeSetMusic.textContent=formatMusic();
    if(safeSetSpdDown)safeSetSpdDown.textContent=formatSpeed() + " −";
    if(safeSetSpdUp)safeSetSpdUp.textContent=formatSpeed() + " ＋";
    if(safeSetOffDown)safeSetOffDown.textContent=formatOffset() + " −";
    if(safeSetOffUp)safeSetOffUp.textContent=formatOffset() + " ＋";
    if(safeSetNoteContrast)safeSetNoteContrast.textContent=formatNoteContrast();
    if(safeSetPathBrightness)safeSetPathBrightness.textContent=formatPathBrightness();
    if(safeSetEffectIntensity)safeSetEffectIntensity.textContent=formatEffectIntensity();
    if(safeSetJudgeGuide)safeSetJudgeGuide.textContent=formatJudgeGuide();
  }

  const originalStart=start;
  start=function(mode="play"){
    if(isMobilePortraitPlayBlocked()){
      pendingMobileStartMode = mode;
      safeSetState("game", "start wrapper mobile rotate");
      document.body.classList.add("safeClean");
      setRotateOverlay(true);
      try{ pauseSong("pause"); }catch(e){}
      return;
    }
    pendingMobileStartMode = null;
    setRotateOverlay(false);
    safeSetState("game", "start wrapper");
    document.body.classList.add("safeClean");
    return originalStart(mode);
  };

  const originalEndGame=endGame;
  endGame=function(stopAudio=true){
    originalEndGame(stopAudio);
    document.body.classList.remove("safeClean");
    if(resultOverlay && resultOverlay.classList.contains("show")){
      safeSetState("game", "endGame result overlay");
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
    const nextVisible = force!==undefined ? force : !settingsVisible;
    if(nextVisible) settingsOrigin=currentSettingsOrigin();
    settingsVisible = nextVisible;
    if(settingsVisible && isMobileViewport()) originalToggleKeymap(false);
    if(paused){
      if(settingsVisible) openPauseSettings();
      else closePauseSettings();
    }else if(settingsVisible){
      safeSetOverlay(true);
      originalToggleSettings(true);
    }else{
      closeSettingsOverlayOnly();
      originalToggleSettings(false);
    }
    safeRefresh();
  };

  bindPress(pauseSettingsBack,closePauseSettings);
  bindPress(pauseSetSpdDown,()=>{changeSpeed(+0.04);syncPauseSettingsUI();});
  bindPress(pauseSetSpdUp,()=>{changeSpeed(-0.04);syncPauseSettingsUI();});
  bindPress(pauseSetOffDown,()=>{changeOffset(-0.03);syncPauseSettingsUI();});
  bindPress(pauseSetOffUp,()=>{changeOffset(+0.03);syncPauseSettingsUI();});
  bindPress(pauseSetMusic,()=>{changeMusic(musicVolume>=.95?-.45:.10);syncPauseSettingsUI();});
  bindPress(pauseSetSfx,()=>{sfxEnabled=!sfxEnabled;refreshSettingsUI();syncPauseSettingsUI();});
  bindPress(pauseSetAuto,()=>{toggleAuto("pause-settings");syncPauseSettingsUI();});
  bindPress(pauseSetFull,requestFullscreenSafe);

  initVersionAndUpdateLog();

  safeBind(safeStart,()=>showSongSelect());
  safeBind(safeTutorial,e=>{requestPointerLockForAim(e);startTutorial();});
  safeBind(safeRestartStep,()=>restartTutorialStep());
  safeBind(safeEditor,()=>{ window.location.href="./editor.html"; });
  safeBind(safeTech,()=>{selectedMenuMode="tech";mapMode="tech";safeRefresh();updateButtons();});
  safeBind(safeNormal,()=>{selectedMenuMode="normal";mapMode="normal";safeRefresh();updateButtons();});
  safeBind(safeAuto,()=>toggleAuto("song-select"));
  safeBind(safeFull,requestFullscreenSafe);
  safeBind(safeSettingsBtn,()=>toggleSettings(true));

  safeBind(safeSetAuto,()=>toggleAuto("settings"));
  safeBind(safeSetMap,()=>{if(running && !debugMode)return; mapMode=mapMode==="tech"?"normal":"tech";selectedMenuMode=mapMode;safeRefresh();restartIfRunning();});
  safeBind(safeSetKeymap,()=>toggleKeymap(true));
  safeBind(safeSetUpdateLog,()=>openUpdateLog({index:0, auto:false}));
  safeBind(safeSetFull,requestFullscreenSafe);
  safeBind(safeSetSfx,()=>{sfxEnabled=!sfxEnabled;refreshSettingsUI();});
  safeBind(safeSetMusic,()=>changeMusic(musicVolume>=.95?-.45:.10));
  safeBind(safeSetSpdDown,()=>changeSpeed(+0.04));
  safeBind(safeSetSpdUp,()=>changeSpeed(-0.04));
  safeBind(safeSetOffDown,()=>changeOffset(-0.03));
  safeBind(safeSetOffUp,()=>changeOffset(+0.03));
  safeBind(safeSetNoteContrast,()=>cycleVisualSetting("noteContrast"));
  safeBind(safeSetPathBrightness,()=>cycleVisualSetting("pathBrightness"));
  safeBind(safeSetEffectIntensity,()=>cycleVisualSetting("effectIntensity"));
  safeBind(safeSetJudgeGuide,()=>cycleVisualSetting("judgeGuide"));
  safeBind(safeResume,handleSettingsResume);
  safeBind(safeExit,exitToTitle);
  bindPress(tutorialPromptStart,e=>{requestPointerLockForAim(e);startTutorial();});
  bindPress(tutorialPromptSkip,()=>{localStorage.setItem(TUTORIAL_PROMPT_KEY,"true"); tutorialPrompt.hidden=true;});
  bindImmediatePress(tutorialSkipStep,nextTutorialStep);
  bindPress(tutorialExit,()=>exitTutorial(true));
  bindPress(tutorialPlayNow,()=>{tutorialComplete.hidden=true; showSongSelect();});
  bindPress(tutorialBackTitle,()=>{tutorialComplete.hidden=true; showTitleMenu();});
  bindPress(tutorialReplay,e=>{requestPointerLockForAim(e);startTutorial();});
  bindPress(songSelectBack,()=>showTitleMenu());
  bindPress(songPlayBtn,(e)=>{requestPointerLockForAim(e);startSelectedSong(e);});

  window.addEventListener("resize",()=>{ releaseMobilePointers(); scheduleStableViewportResize("resize"); handlePlayOrientation(); });
  window.addEventListener("orientationchange", () => { releaseMobilePointers(); keys.MouseLeft=false; forceReleaseScratch(); filterHeld=false; mouseDownRight=false; scheduleStableViewportResize("orientationchange"); setTimeout(handlePlayOrientation, 80); });
  window.visualViewport?.addEventListener("resize",()=>scheduleStableViewportResize("visualViewport"));
  document.addEventListener("touchmove", handleGameplayTouchMove, {passive:false});


  // Mobile fullscreen lifecycle handling is intentionally kept in this document so song select, play, and pause are scene changes instead of navigations.
  document.addEventListener("fullscreenchange",handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange",handleFullscreenChange);
  document.addEventListener("fullscreenerror",()=>{ fullscreenTransitioning=false; if(fullscreenRetryBtn && isMobileViewport()) fullscreenRetryBtn.hidden=false; scheduleStableViewportResize("fullscreenerror"); });

  cacheDynamicDomRefs();
  safeSetState("title", "initial load");
  safeRefresh();
  showTutorialPrompt();

  function installBrowserTestApi(){
    if(new URLSearchParams(window.location.search).get("browserTest")!=="1") return;
    window.CircleMixTestApi={
      startDeterministicChart:()=>{
        if(raf){ cancelAnimationFrame(raf); raf=0; }
        cleanupPlaySession({stopAudio:true,hideResultOverlay:true,abort:true});
        tutorialMode=false; paused=false; running=true; resultShown=false; completionPending=false;
        browserTestClock=0; resetAimInput(-Math.PI/2); resize(); resetRenderWindow(); focusNote=null;
        keys.MouseLeft=false; filterHeld=false; mouseDownRight=false; forceReleaseScratch();
        lastRelativeMovement={x:0,y:0}; pointerLockFallback=false; pointerLockRequested=false;
        // This chart is intentionally test-only: it is never registered as a
        // song/local chart and each id survives runtime state changes.
        const spec=[
          ['test-cut-0','cut',0], ['test-fx-0','fx',1,.34],
          ['test-swing-cw-0','swingCW',2], ['test-swing-ccw-0','swingCCW',3],
          ['test-slide-cw-0','slideCW',4,.42,5], ['test-slide-ccw-0','slideCCW',5,.42,4],
          ['test-trace-0','traceCW',6,.48,7], ['test-scratch-cw-0','scratchCW',7], ['test-scratch-ccw-0','scratchCCW',0]
        ];
        chart=spec.map((entry,index)=>{
          const [id,type,lane,duration,endLane]=entry;
          const n=make(type, 2+index*2, lane, {duration,endLane}); n.id=id;
          // Fixed seconds make test-clock seeking independent of BPM/audio.
          n.hitTime=.8+index*.8; n.spawnTime=n.hitTime-APPROACH; return n;
        });
        chartLastHitEnd=Math.max(...chart.map(n=>n.hitTime+(n.duration||0)));
        score=combo=maxCombo=judgedCount=perfectCount=greatCount=missCount=actualHitValue=0;
        maxHitValue=chart.reduce((sum,n)=>sum+noteWeight(n),0); feedback=[]; particles=[]; waves=[]; ringBursts=[]; scratchBursts=[];
        return window.CircleMixTestApi.state();
      },
      advanceTestClock:(seconds,step=.02)=>{
        if(browserTestClock===null) throw new Error('deterministic chart is not running');
        const target=browserTestClock+Math.max(0,Number(seconds)||0), dt=Math.max(.001,Number(step)||.02);
        while(browserTestClock<target){ const delta=Math.min(dt,target-browserTestClock); browserTestClock+=delta; filterHeld=mouseDownRight||keys.KeyZ||keys.KeyX||keys.Space; scratchHeld=mouseDownRight||keys.ShiftLeft||keys.ShiftRight; syncScratchHoldState(); updateAuto(browserTestClock); updateArm(delta); updateNotes(browserTestClock,delta); focusNote=currentFocusNote(browserTestClock); testFrameCount++; testRenderCount++; }
        if(judgedCount===chart.length && !resultShown) completeRun();
        return window.CircleMixTestApi.state();
      },
      testInput:{
        aim:(clientX,clientY,timeStamp=performance.now(),pointerType='mouse')=>updateGameplayPointerFromEvent({clientX,clientY,timeStamp,pointerType,target:canvas},pointerType==='touch'?'touch':'pointer'),
        locked:(movementX,movementY,timeStamp=performance.now())=>processLockedAimMovement({movementX,movementY,timeStamp}),
        action:()=>onCut(),
        scratch:(held)=>{ mouseDownRight=!!held; filterHeld=!!held; setScratchHeld(!!held); }
      },
      startTutorial:()=>startTutorial(),
      openSongSelect:()=>showSongSelect(),
      skipTutorialStep:()=>nextTutorialStep(),
      startBuiltIn:async(songId,difficulty)=>{
        if(tutorialMode) exitTutorial(false);
        const previousSession=playSessionToken;
        const songData=songs.get(songId);
        selectedSource="builtin"; activePlaySource="builtin"; activeChartId=difficulty;
        selectedSong=songData; selectedSongId=songData.id; selectedDifficultyId=difficulty; selectedMenuMode=difficulty; mapMode=difficulty; useCustomChart=false;
        const started=await start("play");
        return {started, previousSession, playSessionToken, songId:selectedSongId, difficulty:selectedDifficultyId};
      },
      startBuiltInChartTest:(songId,difficulty)=>{
        if(raf){ cancelAnimationFrame(raf); raf=0; }
        cleanupPlaySession({stopAudio:true,hideResultOverlay:true,abort:true});
        tutorialMode=false; paused=false; running=true; resultShown=false; abortingRun=false; completionPending=false;
        const songData=songs.get(songId);
        selectedSource="builtin"; activePlaySource="builtin"; activeChartId=difficulty;
        selectedSong=songData; selectedSongId=songData.id; selectedDifficultyId=difficulty; selectedMenuMode=difficulty; mapMode=difficulty; useCustomChart=false;
        BPM=selectedSong?.bpm || 184.6; BEAT=60/BPM; SONG_OFFSET=typeof selectedSong?.offset==="number"?selectedSong.offset:-.04;
        browserTestClock=0; resetAimInput(-Math.PI/2); chart=chartForDifficulty(difficulty); resetTraceRuntimeState(); resetRenderWindow(); focusNote=null;
        chartLastHitEnd=Math.max(...chart.map(n=>n.hitTime+(n.duration||0)));
        score=combo=maxCombo=judgedCount=perfectCount=greatCount=missCount=actualHitValue=0; maxHitValue=chart.reduce((sum,n)=>sum+noteWeight(n),0);
        feedback=[]; particles=[]; waves=[]; ringBursts=[]; scratchBursts=[]; gameState.autoEnabled=true;
        return window.CircleMixTestApi.state();
      },
      completeChartTestAsPlayer:()=>{
        gameState.autoEnabled=false;
        for(const n of chart){ if(!n.done&&!n.missed) judge(n,"PERFECT",noteColor(n),{source:"pointer",reason:"USER_JUDGEMENT"}); }
        browserTestClock=chartLastHitEnd+.1;
        if(!resultShown) completeRun();
        return window.CircleMixTestApi.state();
      },
      exitTutorial:()=>exitTutorial(false),
      completeTutorial:()=>completeTutorial(),
      markFirstPendingTutorialNoteMissed:()=>{ const n=chart.find(note=>!note.done&&!note.missed); if(n){ miss(n,"TEST_FORCED_MISS"); return true; } return false; },
      clearAndPerfectTutorialChart:()=>{ for(const n of chart){ if(!n.done&&!n.missed) judge(n,"PERFECT",noteColor(n),{source:"pointer",reason:"USER_JUDGEMENT"}); } return window.CircleMixTestApi.state(); },
      state:()=>({running:!!running, paused:!!paused, tutorialMode:!!tutorialMode, tutorialStepIndex:Number(tutorialStepIndex), tutorialTargetProgress:Number(tutorialSteps[tutorialStepIndex]?._hit||0), tutorialPointerMoved:!!tutorialState.pointerMoved, tutorialExploreInsideSince:tutorialState.exploreInsideSince==null?null:Number(tutorialState.exploreInsideSince), tutorialInputEnabledAt:Number(tutorialState.inputEnabledAt), tutorialSuccessCount:Number(tutorialState.successCount), tutorialValidUserInputCount:Number(tutorialState.validUserInputCount), tutorialLastSource:tutorialState.lastSource||null, tutorialCurrentJudgement:tutorialState.currentJudgement||null, tutorialTransitioning:!!tutorialState.transitioning, tutorialTransitionState:tutorialState.transitionState||null, pendingTutorialSkipCount:Number(tutorialState.pendingSkipQueue.length), tutorialStepToken:Number(tutorialStepToken), tutorialAttemptId:Number(tutorialAttemptId), tutorialTimerCount:Number(tutorialState.timers.length), tutorialFinalMixRetryScheduled:!!tutorialState.mixRetryScheduled, tutorialFinalMixRetryCount:Number(tutorialState.mixRetryCount), tutorialChartFinalizationCount:Number(tutorialState.chartFinalizationCount), tutorialLastChartFinalization:tutorialState.lastChartFinalization||null, tutorialChartSettled:!!tutorialChartSettled(), tutorialCompleteCount:Number(tutorialState.completeCount), tutorialHudHidden:!!tutorialHud&&tutorialHud.hidden, tutorialRafCount:Number(tutorialState.rafIds.length+(raf?1:0)), currentTutorialKind:tutorialSteps[tutorialStepIndex]?.kind||null, currentTutorialTitle:tutorialSteps[tutorialStepIndex]?.name||null, chartNoteTypes:chart.map(n=>n.type), tutorialCompleteVisible:!!tutorialComplete&&!tutorialComplete.hidden, activeScene:activeSceneName(), traceSwingPhase:tutorialState.traceSwingPhase, consumedNoteIds:[...tutorialState.consumedNoteIds], judgedCount:Number(judgedCount), perfectCount:Number(perfectCount), greatCount:Number(greatCount), missCount:Number(missCount), score:Number(score), combo:Number(combo), maxCombo:Number(maxCombo), visibleNoteCount:Number(getVisibleNotes(now()).length), visibleNotes:getVisibleNotes(now()).map(n=>({id:n.id||noteDebugId(n),type:n.type})), focusNote:focusNote?{id:focusNote.id||noteDebugId(focusNote),type:focusNote.type}:null, chartDoneStates:chart.map(n=>({id:n.id||noteDebugId(n),type:n.type,done:!!n.done,missed:!!n.missed,completed:!!n.completed,hold:n.hold||0,coverage:Number(n.coverageRatio||0),quality:Number(n.traceQuality||0),started:!!n.started,active:!!n.active,failReason:n.failReason||null,hitTime:n.hitTime,angle:Number(n.angle),endAngle:n.endAngle==null?null:Number(n.endAngle),duration:Number(n.duration||0)})), tutorialLastAdvanceReason, tutorialLastAdvanceSource, inputEnabled:performance.now()>=tutorialState.inputEnabledAt, chartLength:Number(chart.length), chartEndTime:Number(chartLastHitEnd), gameTime:Number(now()), browserNow:Number(performance.now()), frameCount:Number(testFrameCount), renderCount:Number(testRenderCount), W:Number(W), H:Number(H), lastPointerSource:lastPointerSource||null, pointerActive:!!pointerActive, mouseX:Number(mouseX), mouseY:Number(mouseY), armAngle:Number(armAngle), rawArmVel:Number(rawArmVel), rawAngularVelocity:Number(rawAngularVelocity), sampleAngularVelocity:Number(aimInput.sampleAngularVelocity), cx:Number(cx), cy:Number(cy), hitR:Number(hitR), selectedSongId:selectedSongId||null, selectedDifficultyId:selectedDifficultyId||null, mobileAimPointerId:mobileAimPointerId==null?null:Number(mobileAimPointerId), mobileActionPointerId:mobileActionPointerId==null?null:Number(mobileActionPointerId), mobileScratchPointerId:mobileScratchPointerId==null?null:Number(mobileScratchPointerId), actionHeld:!!keys.MouseLeft, scratchHeld:!!scratchHeld, mouseDownRight:!!mouseDownRight, pointerLockMode:inputSettings.pcAimMode, effectivePcAimMode:effectivePcAimMode(), pointerLockRequested:!!pointerLockRequested, pointerLockActive:!!pointerLockActive(), lockedVirtualAngle:Number(lockedVirtualAngle), lockedSensitivity:Number(inputSettings.lockedAimSensitivity), lastRelativeMovement:{x:Number(lastRelativeMovement.x),y:Number(lastRelativeMovement.y)}, rawInputAngle:Number(rawInputAngle), judgementAimAngle:Number(judgementAimAngle), visualArmAngle:Number(visualArmAngle), rawJudgementDifference:Number(norm(rawInputAngle-judgementAimAngle)), judgementVisualDifference:Number(norm(judgementAimAngle-visualArmAngle)), resultVisible:!!resultOverlay?.classList.contains('show')}),
      aimInputState:()=>({rawAngle:aimInput.rawAngle, rawInputAngle, judgementAimAngle, visualArmAngle, unwrappedAngle:aimInput.unwrappedAngle, previousSampleAngle:aimInput.previousSampleAngle, sampleAngularVelocity:aimInput.sampleAngularVelocity, accumulatedCWTravel:aimInput.accumulatedCWTravel, accumulatedCCWTravel:aimInput.accumulatedCCWTravel, pointerRadius:aimInput.pointerRadius, sampleCount:aimInput.sampleCount, lastSampleTimestamp:aimInput.lastSampleTimestamp, centerDeadzoneActive:aimInput.centerDeadzoneActive, rebasePending:aimInput.rebasePending, magnetTarget:!!magnetTarget}),
      visualArmProfile:()=>visualArmProfile(),
      traceVisualProfile:()=>traceVisualProfile(),
      judgementMarkerVisible:()=>judgementMarkerVisible(),
      judgementMarkerVisibleFor:(visualAngle,judgementAngle,hasMagnet=false)=>judgementMarkerVisibleFor(visualAngle,judgementAngle,hasMagnet),
      injectAimSamples:(samples,mode="OFF")=>{ resetAimInput(samples[0]?.angle??-Math.PI/2); const previous=inputSettings.aimStabilizer; inputSettings.aimStabilizer=mode; for(const sample of samples){ const angle=sample.angle, radius=sample.radius??Math.max(hitR,80); processAimSample(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius,sample.timestamp??performance.now(),"pointer"); } updateArm(1/60); const result=window.CircleMixTestApi.aimInputState(); inputSettings.aimStabilizer=previous; return result; },
      injectImmediateAimSample:(angle,radius=Math.max(hitR,80),timestamp=performance.now())=>{ processAimSample(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius,timestamp,"pointer"); return window.CircleMixTestApi.aimInputState(); },
      injectKeyboardRotation:(direction,dt=.02)=>{ resetAimInput(-Math.PI/2); keyD=direction>0; keyA=direction<0; updateArm(dt); keyA=keyD=false; return window.CircleMixTestApi.aimInputState(); },
      expireAimInput:()=>{ aimInput.lastSampleTimestamp=performance.now()-AIM_SAMPLE_FRESH_MS-1; freshAimSample(); return window.CircleMixTestApi.aimInputState(); },
      lanePoint:lane=>({x:cx+Math.cos(laneAngle(lane))*hitR, y:cy+Math.sin(laneAngle(lane))*hitR}),
      pcAimModeState:()=>({selected:inputSettings.pcAimMode, effective:effectivePcAimMode(), wantsLockedMouse:wantsLockedAim("mouse"), pointerLockRequested:!!pointerLockRequested, pointerLockActive:!!pointerLockActive()}),
      setPcAimMode:mode=>{ if(PC_AIM_MODES.includes(mode)){ inputSettings.pcAimMode=mode; saveInputSettings(); } },
      setAimVisual:mode=>{ if(AIM_VISUAL_MODES.includes(mode)){ inputSettings.aimVisual=mode; visualArmAngle=judgementAimAngle; saveInputSettings(); } },
      setVisualResponse:mode=>{ if(AIM_VISUAL_RESPONSE_MODES.includes(mode)){ inputSettings.aimVisualResponse=mode; visualArmAngle=judgementAimAngle; saveInputSettings(); } },
      setLockedSensitivity:value=>{ inputSettings.lockedAimSensitivity=finiteRange(value,.5,2,1); saveInputSettings(); },
      injectLockedMovement:(movementX,movementY,timestamp=performance.now())=>{ processLockedAimMovement({movementX,movementY,timeStamp:timestamp}); return window.CircleMixTestApi.aimInputState(); },
      setAimStabilizer:mode=>{ if(AIM_STABILIZER_MODES.includes(mode)){ inputSettings.aimStabilizer=mode; saveInputSettings(); } },
      magnetProbe:(mode,velocity)=>{ const previousMode=inputSettings.aimStabilizer, previousTarget=magnetTarget, previousError=magnetAngleError, previousFocus=focusNote; try{ const probeNow=now(); const probeNote={type:"cut", angle:0, done:false, missed:false, spawnTime:probeNow-1, hitTime:probeNow}; inputSettings.aimStabilizer=mode; focusNote=probeNote; magnetTarget=probeNote; magnetAngleError=0; const result=updateAimMagnet(0, velocity); const disengaged=magnetTarget===null; return {mode, velocity, disengaged, result, profile:aimStabilizerProfile()}; } finally { inputSettings.aimStabilizer=previousMode; magnetTarget=previousTarget; magnetAngleError=previousError; focusNote=previousFocus; } },
      triggerViewportResizeObserverCallback:()=>{ handleViewportResize(); return window.CircleMixTestApi.state(); },
      resetCounters:()=>{ testFrameCount=0; testRenderCount=0; }
    };
  }

  // This is intentionally separate from browserTestClock.  It is a developer
  // diagnostic that uses the normal RAF/updateNotes/onCut input path and never
  // registers its small charts as songs, records, or local charts.
  const SELF_TEST_STEPS=[
    {id:"absolute-aim",name:"A · ABSOLUTE AIM",action:"Move through the eight cyan targets (0° to 315°).",type:null},
    {id:"locked-aim",name:"B · PC LOCKED AIM",action:"Mouse only: click START, accept Pointer Lock, then rotate CW and CCW.",type:null,mouseOnly:true},
    {id:"cut",name:"C · CUT",action:"Aim at the note and press ACTION (Z/X/left click).",type:"cut"},
    {id:"fx",name:"D · FX",action:"Use the displayed production FX hold input at the target.",type:"fx",duration:.45},
    {id:"swing-cw",name:"E · SWING CW",action:"Move the aim quickly clockwise through the target.",type:"swingCW"},
    {id:"swing-ccw",name:"E · SWING CCW",action:"Move the aim quickly counter-clockwise through the target.",type:"swingCCW"},
    {id:"scratch-cw",name:"F · SCRATCH CW",action:"Hold SCRATCH (right click/Shift), then rotate clockwise.",type:"scratchCW"},
    {id:"scratch-ccw",name:"F · SCRATCH CCW",action:"Hold SCRATCH (right click/Shift), then rotate counter-clockwise.",type:"scratchCCW"},
    {id:"slide-cw",name:"G · SLIDE CW",action:"Hold ACTION from START and follow the yellow path to END.",type:"slideCW",duration:.8,endLane:3},
    {id:"slide-ccw",name:"G · SLIDE CCW",action:"Hold ACTION from START and follow the yellow path to END.",type:"slideCCW",duration:.8,endLane:5},
    {id:"trace",name:"H · TRACE",action:"Do not hold ACTION. Follow the thin cyan path using multiple samples.",type:"traceCW",duration:.8,endLane:3},
    {id:"hold",name:"HOLD",action:"No independently playable HOLD note type is registered in this build.",unsupported:true}
  ];
  const selfTest={active:false,index:0,status:"WAITING",results:[],device:"unknown",startedAt:0,failReason:null,aimTarget:0,aimIndex:0,sessionId:0};
  const selfTestOverlay=document.getElementById("selfTestOverlay"), selfTestButton=document.getElementById("safeSelfTestBtn");
  const selfTestEls={label:document.getElementById("selfTestStepLabel"),instruction:document.getElementById("selfTestInstruction"),diagnostics:document.getElementById("selfTestDiagnostics"),start:document.getElementById("selfTestStart"),retry:document.getElementById("selfTestRetry"),next:document.getElementById("selfTestNext"),skip:document.getElementById("selfTestSkip"),restart:document.getElementById("selfTestRestart"),copy:document.getElementById("selfTestCopy"),exit:document.getElementById("selfTestExit")};
  function deactivateSelfTestSurface({releaseInputs=false}={}){
    selfTest.active=false;
    if(releaseInputs){ releasePointerLock(); releaseMobilePointers(); keys.MouseLeft=false; forceReleaseScratch(); filterHeld=false; mouseDownRight=false; }
    if(selfTestOverlay){ selfTestOverlay.hidden=true; selfTestOverlay.setAttribute("aria-hidden","true"); }
  }
  // The panel is never route-driven: initialize it closed before any user
  // interaction and keep developer mode limited to the Settings entry button.
  deactivateSelfTestSurface({releaseInputs:true});
  function selfTestNumber(value){ return Number.isFinite(value)?Number(value.toFixed(4)):null; }
  function selfTestSnapshot(){ const n=chart.find(note=>!note.done&&!note.missed)||null, target=selfTest.active?(SELF_TEST_STEPS[selfTest.index]?.type? n?.angle:selfTest.aimTarget):null; return {stepId:SELF_TEST_STEPS[selfTest.index]?.id||null,stepName:SELF_TEST_STEPS[selfTest.index]?.name||null,status:selfTest.status,device:selfTest.device,pcAimMode:inputSettings.pcAimMode,pointerLockActive:!!pointerLockActive(),rawInputAngle:selfTestNumber(rawInputAngle),judgementAimAngle:selfTestNumber(judgementAimAngle),visualArmAngle:selfTestNumber(visualArmAngle),angularVelocity:selfTestNumber(aimInput.sampleAngularVelocity),targetAngle:selfTestNumber(target),shortestAngleError:target==null?null:selfTestNumber(norm(judgementAimAngle-target)),note:n?{id:String(n.id||""),type:String(n.type||"")}:null,score:Number(score),combo:Number(combo),judgedCount:Number(judgedCount),actionHeld:!!keys.MouseLeft,scratchHeld:!!scratchHeld,mouseDownRight:!!mouseDownRight,slideProgress:n?selfTestNumber(n.slideProgress||0):0,traceRequiredTravelDegrees:n?selfTestNumber((n.requiredTravel||traceRequiredTravel(n))*180/Math.PI):0,traceDirectedTravelDegrees:n?selfTestNumber((n.directedTravel||0)*180/Math.PI):0,traceReverseTravelDegrees:n?selfTestNumber((n.reverseTravel||0)*180/Math.PI):0,traceProgressRatio:n?selfTestNumber(n.progressRatio||0):0,traceStartCaptured:!!n?.startCaptured,traceEndpointErrorDegrees:n?selfTestNumber((n.endpointError||0)*180/Math.PI):0,traceEndpointCaptured:!!n?.endpointCaptured,traceCompletionTime:n?.completionTime??null,traceFailReason:n?.failReason||null,failReason:selfTest.failReason||null}; }
  function selfTestResult(status){ const s=selfTestSnapshot(), ended=performance.now(); return {...s,status,startedAt:selfTest.startedAt||null,completedAt:ended,duration:selfTest.startedAt?Math.max(0,ended-selfTest.startedAt):0,expectedAction:SELF_TEST_STEPS[selfTest.index]?.action||"",actualJudgement:chart.find(n=>n.done)?.judgement||null}; }
  function renderSelfTest(){ if(!selfTestOverlay||!selfTest.active)return; const step=SELF_TEST_STEPS[selfTest.index]; const s=selfTestSnapshot(); selfTestEls.label.textContent=`${selfTest.index+1}/${SELF_TEST_STEPS.length} · ${step.name} · ${selfTest.status}`; selfTestEls.instruction.textContent=step.action; selfTestEls.diagnostics.textContent=JSON.stringify(s,null,2); selfTestEls.next.disabled=selfTest.status!=="PASS"; requestAnimationFrame(renderSelfTest); }
  function selfTestResetInput(){ releasePointerLock(); releaseMobilePointers(); keys.MouseLeft=false; forceReleaseScratch(); filterHeld=false; mouseDownRight=false; resetAimInput(-Math.PI/2); }
  function selfTestStartStep(){ if(!circleMixDevMode||!selfTest.active)return; const step=SELF_TEST_STEPS[selfTest.index]; selfTestResetInput(); chart=[]; feedback=[]; selfTest.status=step.unsupported?"UNSUPPORTED":"RUNNING"; selfTest.failReason=null; selfTest.startedAt=performance.now(); selfTest.aimIndex=0; selfTest.aimTarget=0; if(step.unsupported)return;
    if(step.mouseOnly && selfTest.device!=="mouse"){ selfTest.status="UNSUPPORTED"; return; }
    if(step.id==="absolute-aim"){ selfTest.aimTarget=0; return; }
    if(step.id==="locked-aim"){ if(!canvas?.requestPointerLock){selfTest.status="UNSUPPORTED";return;} requestPointerLockForAim({pointerType:"mouse"}); return; }
    const n=make(step.type,2,0,{duration:step.duration,endLane:step.endLane}); n.id=`selftest-${step.id}-0`; n.hitTime=now()+1; n.spawnTime=n.hitTime-APPROACH; chart=[n]; chartLastHitEnd=n.hitTime+(n.duration||0); score=combo=maxCombo=judgedCount=perfectCount=greatCount=missCount=actualHitValue=0; maxHitValue=noteWeight(n);
  }
  function selfTestTick(){ if(!selfTest.active||selfTest.status!=="RUNNING")return; const step=SELF_TEST_STEPS[selfTest.index]; if(step.id==="absolute-aim"){ if(Number.isFinite(rawInputAngle)&&Number.isFinite(judgementAimAngle)&&Number.isFinite(visualArmAngle)&&Math.abs(norm(judgementAimAngle-selfTest.aimTarget))<.16){ selfTest.aimIndex++; if(selfTest.aimIndex>=8)selfTest.status="PASS"; else selfTest.aimTarget=selfTest.aimIndex*Math.PI/4; } return; } if(step.id==="locked-aim"){ if(pointerLockActive() && aimInput.accumulatedCWTravel>=TAU && aimInput.accumulatedCCWTravel>=TAU)selfTest.status="PASS"; return; } const n=chart[0]; if(n?.done && judgedCount===1 && score>0 && combo>0)selfTest.status="PASS"; else if(n?.missed){selfTest.status="FAIL";selfTest.failReason=n.failReason||"NOTE MISSED";} }
  function openSelfTest(){ if(!circleMixDevMode)return false; cleanupPlaySession({stopAudio:true,hideResultOverlay:true,abort:true}); tutorialMode=false; chart=[]; selfTest.active=true; selfTest.index=0; selfTest.results=[]; selfTest.sessionId++; selfTestOverlay.hidden=false; selfTestOverlay.setAttribute("aria-hidden","false"); safeSetState("game","self-test"); running=true; paused=false; startMs=performance.now(); lastMs=startMs; browserTestClock=null; resize(); if(!raf)raf=requestAnimationFrame(frame); selfTestStartStep(); renderSelfTest(); return true; }
  function exitSelfTest(){ if(!selfTest.active)return; selfTestResetInput(); chart=[]; deactivateSelfTestSurface({releaseInputs:true}); cleanupPlaySession({stopAudio:true,hideResultOverlay:true,abort:true}); showTitleMenu(); }
  function finishSelfTestStep(status){ if(!selfTest.active)return; selfTest.status=status; selfTest.results.push(selfTestResult(status)); }
  window.addEventListener("pointermove",e=>{ const device=["mouse","pen","touch"].includes(e.pointerType)?e.pointerType:"unknown"; if(selfTest.active&&device!==selfTest.device){ selfTest.device=device; selfTestResetInput(); } },{capture:true,passive:true});
  window.addEventListener("keydown",()=>{ if(selfTest.active)selfTest.device="keyboard"; },{capture:true});
  if(selfTestButton){ selfTestButton.hidden=!circleMixDevMode; safeBind(selfTestButton,openSelfTest); }
  safeBind(selfTestEls.start,selfTestStartStep); safeBind(selfTestEls.retry,selfTestStartStep); safeBind(selfTestEls.skip,()=>finishSelfTestStep("SKIPPED")); safeBind(selfTestEls.next,()=>{if(selfTest.status!=="PASS")return;finishSelfTestStep("PASS");if(selfTest.index<SELF_TEST_STEPS.length-1){selfTest.index++;selfTestStartStep();}}); safeBind(selfTestEls.restart,()=>{selfTest.results=[];selfTest.index=0;selfTestStartStep();}); safeBind(selfTestEls.exit,exitSelfTest); safeBind(selfTestEls.copy,async()=>{const report={version:currentVersionString(),userAgent:navigator.userAgent,viewport:{width:window.innerWidth,height:window.innerHeight},devicePixelRatio:window.devicePixelRatio||1,device:selfTest.device,steps:selfTest.results,lastDiagnostic:selfTestSnapshot(),errors:[]}; const text=JSON.stringify(report,null,2); try{await navigator.clipboard.writeText(text);}catch(_){ } selfTestEls.copy.textContent="COPIED";});
  const productionUpdateNotes=updateNotes; updateNotes=function(t,dt){ productionUpdateNotes(t,dt); selfTestTick(); };

  installBrowserTestApi();
  if(window.CircleMixTestApi){
    window.CircleMixTestApi.selfTestState=()=>({active:!!selfTest.active, overlayHidden:!!selfTestOverlay?.hidden, overlayDisplay:selfTestOverlay?getComputedStyle(selfTestOverlay).display:null, buttonHidden:!!selfTestButton?.hidden, pointerLockActive:!!pointerLockActive(), actionHeld:!!keys.MouseLeft, scratchHeld:!!scratchHeld});
  }

  updateModeButtons();
  updateButtons();
})();
