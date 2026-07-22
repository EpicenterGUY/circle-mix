// Shared song registry and local-song persistence for CIRCLE MIX.
(() => {
  const ghostBundle = window.CircleMixGhostRuleBundle || null;
  const routingBundle = window.CircleMixRoutingBundle || null;
  function cloneGhostDifficulties(bundle){
    const songDiffs=bundle?.song?.difficulties || {};
    const charts=bundle?.charts || {};
    return Object.keys(songDiffs).reduce((out,id)=>{
      const meta=songDiffs[id] || {};
      const chart=charts[id] || {};
      out[id]={ label:meta.label || chart.label || id.toUpperCase(), chart:meta.chart || `builtin:ghost-rule-${id}`, stars:Number.isFinite(Number(meta.stars)) ? Number(meta.stars) : Number(chart.stars), notes:chart.notes };
      return out;
    },{});
  }
  const BUILT_INS = [
    { id:"anima", source:"bundled", title:"ANiMA", artist:"xi", audio:"#embedded-anima", jacket:null, bpm:184.6, offset:-0.04, previewStart:20, previewDuration:15,
      difficulties:{ normal:{label:"NORMAL",chart:"builtin:anima-normal"}, tech:{label:"TECH",chart:"builtin:anima-tech"} } }
  ];
  if(ghostBundle?.song && ghostBundle?.charts){
    BUILT_INS.push({
      ...ghostBundle.song,
      id:"ghost-rule", source:"bundled", title:"Ghost Rule", titleUnicode:"ゴーストルール", artist:"DECO*27", bpm:210, offset:0.148,
      audio:"./assets/audio/ghost-rule.mp3", jacket:"./assets/jackets/ghost-rule.jpg", charts:ghostBundle.charts,
      difficulties:cloneGhostDifficulties(ghostBundle)
    });
  }
  if(routingBundle?.song && routingBundle?.charts){
    BUILT_INS.push({
      ...routingBundle.song,
      source:"bundled", charts:routingBundle.charts,
      difficulties:cloneGhostDifficulties(routingBundle)
    });
  }
  const VALID_TYPES = new Set(["cut","fx","slideCW","slideCCW","trace","traceCW","traceCCW","swingCW","swingCCW","scratchCW","scratchCCW","pulse"]);
  const LocalLibrary=window.CircleMixLocalLibrary;
  let localCache=[];
  const LocalSongs = {
    async all(){ try{ localCache=await LocalLibrary.list(); }catch(error){ console.warn("local songs unavailable",error); } return localCache.slice(); },
    cached(){ return localCache.slice(); },
    async get(id){ return LocalLibrary.get(id); },
    async put(record){ const current=await LocalLibrary.get(record.id); const result=await LocalLibrary.install(record,{expectedCurrent:{exists:Boolean(current),...(current||{})},keepBackup:true}); localCache=LocalLibrary.cached(); return result.record; },
    async delete(id,options){ await LocalLibrary.remove(id,options); localCache=LocalLibrary.cached(); },
    async exists(id){ return Boolean(await this.get(id)); },
    install(...args){ return LocalLibrary.install(...args); }, remove(...args){ return LocalLibrary.remove(...args); }, restorePrevious(...args){ return LocalLibrary.restorePrevious(...args); }, scanIntegrity(){ return LocalLibrary.scanIntegrity(); }, getStorageStatus(){ return LocalLibrary.getStorageStatus(); }, estimateRecordBytes(r){ return LocalLibrary.estimateRecordBytes(r); }, cacheState(){ return LocalLibrary.cacheState(); }
  };
  const BuiltinAudio = {
    async get(id){ const db=await LocalLibrary.open(); return new Promise((resolve,reject)=>{const r=db.transaction("builtinAudio").objectStore("builtinAudio").get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}); },
    async put(id,audioBlob){ if(!(audioBlob instanceof Blob)) throw new Error("A local audio file is required."); const db=await LocalLibrary.open(); await new Promise((resolve,reject)=>{const t=db.transaction("builtinAudio","readwrite");t.objectStore("builtinAudio").put({id,audioBlob,updatedAt:new Date().toISOString()});t.oncomplete=resolve;t.onabort=()=>reject(t.error);}); return {id,audioBlob}; },
    async delete(id){ const db=await LocalLibrary.open(); await new Promise((resolve,reject)=>{const t=db.transaction("builtinAudio","readwrite");t.objectStore("builtinAudio").delete(id);t.oncomplete=resolve;t.onabort=()=>reject(t.error);}); },
    async refresh(){ for(const song of BUILT_INS){ if(!song.audioStorageKey) continue; try{const record=await this.get(song.audioStorageKey);song.audioBlob=record?.audioBlob||null;song.audioLinked=Boolean(record?.audioBlob);}catch(_){song.audioBlob=null;song.audioLinked=false;} } return BUILT_INS; }
  };
  function normalizeAngle(angle){ return ((Number(angle)%360)+360)%360; }
  function legacyLaneToAngle(lane){ return normalizeAngle((Number(lane)||0)*45); }
  function noteAngle(n){ return n.angle !== undefined ? normalizeAngle(n.angle) : legacyLaneToAngle(n.directionIndex ?? n.lane ?? 0); }
  function noteEndAngle(n){ const raw=n.endAngle ?? n.endDirectionIndex ?? n.endLane; return raw===undefined ? undefined : (n.endAngle!==undefined ? normalizeAngle(raw) : legacyLaneToAngle(raw)); }
  function shortestAngleDifference(a,b){ return Math.abs(((a-b+180)%360+360)%360-180); }
  function directionSign(n){
    const dir=String(n.direction || (String(n.type).endsWith("CCW")?"CCW":(String(n.type).endsWith("CW")?"CW":""))).toUpperCase();
    return dir==="CW"?1:(dir==="CCW"?-1:0);
  }
  function validateTraceSweep(n,i,errors,warnings){
    if(!String(n.type).startsWith("trace"))return;
    const hasSigned=n.signedSweepAngle!==undefined;
    const hasSweep=n.sweepAngle!==undefined;
    const hasTurns=n.turns!==undefined;
    if(hasSigned && !Number.isFinite(Number(n.signedSweepAngle))) errors.push(`#${i} invalid signedSweepAngle`);
    if(hasSweep && !Number.isFinite(Number(n.sweepAngle))) errors.push(`#${i} invalid sweepAngle`);
    if(hasTurns && !Number.isFinite(Number(n.turns))) errors.push(`#${i} invalid turns`);
    const sign=n.direction!==undefined ? directionSign(n) : 0;
    if(hasSigned && Number(n.signedSweepAngle)!==0 && sign && Math.sign(Number(n.signedSweepAngle))!==sign) errors.push(`#${i} direction conflicts with signedSweepAngle`);
    if(!hasSigned && hasSweep && Number(n.sweepAngle)!==0 && sign && Math.sign(Number(n.sweepAngle))!==sign) errors.push(`#${i} direction conflicts with sweepAngle`);
    if(hasTurns && Number(n.turns)!==0 && Number(n.turns)<0 && sign) errors.push(`#${i} direction conflicts with negative turns`);
    if(noteEndAngle(n)!==undefined && shortestAngleDifference(noteAngle(n),noteEndAngle(n))<6 && !hasSigned && !hasSweep && !hasTurns) warnings.push(`#${i} trace start/end angles match; add sweepAngle or turns to distinguish 0° from full rotations`);
  }
  function validateChart(chart){ const errors=[], warnings=[]; const notes=Array.isArray(chart?.notes)?chart.notes:[]; const pulseBeats=new Set(); if(!notes.length) errors.push("chart has no notes"); notes.forEach((n,i)=>{ if(!VALID_TYPES.has(n.type)) errors.push(`#${i} unsupported type ${n.type}`); if(!Number.isFinite(Number(n.beat)) || Number(n.beat)<0) errors.push(`#${i} invalid beat`); if(n.type==="pulse"){ const key=Number(n.beat).toFixed(6); if(pulseBeats.has(key)) errors.push(`#${i} duplicate PULSE timestamp`); pulseBeats.add(key); for(const field of ["angle","endAngle","durationBeat","signedSweepAngle","direction"]) if(n[field]!==undefined) errors.push(`#${i} PULSE must not define ${field}`); } else { if(n.angle!==undefined && !Number.isFinite(Number(n.angle))) errors.push(`#${i} invalid angle`); if(n.angle===undefined && (!Number.isInteger(Number(n.lane ?? n.directionIndex)) || Number(n.lane ?? n.directionIndex)<0 || Number(n.lane ?? n.directionIndex)>7)) errors.push(`#${i} missing angle or invalid legacy lane`); } if((String(n.type).startsWith("slide")||String(n.type).startsWith("trace")) && n.endAngle===undefined && (!Number.isInteger(Number(n.endLane ?? n.endDirectionIndex)) || Number(n.endLane ?? n.endDirectionIndex)<0 || Number(n.endLane ?? n.endDirectionIndex)>7)) errors.push(`#${i} missing/invalid endAngle`); if(["fx","slideCW","slideCCW","trace","traceCW","traceCCW"].includes(n.type) && !(Number(n.durationBeat)>0 || Number(n.duration)>0)) errors.push(`#${i} duration must be > 0`); validateTraceSweep(n,i,errors,warnings); }); for(let i=0;i<notes.length;i++) for(let j=i+1;j<notes.length;j++){ if(notes[i].type!=="pulse"&&notes[j].type!=="pulse"&&Math.abs((notes[i].beat||0)-(notes[j].beat||0))<0.001 && shortestAngleDifference(noteAngle(notes[i]),noteAngle(notes[j]))<8) warnings.push(`#${i}/#${j} same-time notes are visually close`); } return {ok:errors.length===0, errors, warnings}; }
  function calculateStars(chart){ return window.CircleMixChartDifficulty?.calculate(chart)?.stars ?? 1; }

  window.CircleMixSongs = BUILT_INS;
  window.CircleMixLocalSongs = LocalSongs;
  window.CircleMixBuiltinAudio = BuiltinAudio;
  window.CircleMixChartTools = { validateChart, calculateStars, validTypes:[...VALID_TYPES], normalizeAngle, noteAngle, noteEndAngle, shortestAngleDifference };
  const Record=window.CircleMixSongRecord;
  const bundled=()=>window.CircleMixBuildConfig?.includeBundledSongs===false?[]:BUILT_INS.map(song=>Record?Record.normalize(song,"bundled"):song);
  const locals=()=>LocalSongs.cached().map(song=>Record?Record.normalize(song,"local"):song);
  const listeners=new Set();
  const notify=()=>listeners.forEach(listener=>listener());
  window.CircleMixSongRegistry = {
    listAll(){ return [...bundled(),...locals()]; }, listBundled(){ return bundled(); }, listLocal(){ return locals(); },
    // Legacy names remain available to old callers.
    all(){ return bundled(); }, localAll(){ return locals(); },
    async refreshLocal(){ const result=await LocalSongs.all(); notify(); return result.map(song=>Record?Record.normalize(song,"local"):song); },
    async refreshBuiltinAudio(){ const result=await BuiltinAudio.refresh(); notify(); return result; },
    get(identity){ if(typeof identity==="string") return this.get({source:"bundled",id:identity}) || this.get({source:"local",id:identity}); const source=identity?.source==="local"?"local":"bundled", id=identity?.id; return (source==="local"?locals():bundled()).find(song=>song.id===id)||null; },
    getByKey(key){ const [source,...rest]=String(key||"").split(":"); return this.get({source,id:rest.join(":")}); },
    keyOf(identity){ return Record?.keyOf(identity) || `${identity?.source==="local"?"local":"bundled"}:${identity?.id||""}`; },
    subscribe(listener){ listeners.add(listener); return ()=>listeners.delete(listener); }, hasDifficulty(song,d){ return Boolean(song?.difficulties?.[d]); }
  };
})();
