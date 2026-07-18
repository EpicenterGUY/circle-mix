// Shared song registry and local-song persistence for CIRCLE MIX.
(() => {
  const ghostBundle = window.CircleMixGhostRuleBundle || null;
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
    { id:"anima", source:"builtin", title:"ANiMA", artist:"xi", audio:"#embedded-anima", jacket:null, bpm:184.6, offset:-0.04, previewStart:20, previewDuration:15,
      difficulties:{ normal:{label:"NORMAL",chart:"builtin:anima-normal"}, tech:{label:"TECH",chart:"builtin:anima-tech"} } }
  ];
  if(ghostBundle?.song && ghostBundle?.charts){
    BUILT_INS.push({
      ...ghostBundle.song,
      id:"ghost-rule", source:"builtin", title:"Ghost Rule", titleUnicode:"ゴーストルール", artist:"DECO*27", bpm:210, offset:0.148,
      audio:"./assets/audio/ghost-rule.mp3", jacket:"./assets/jackets/ghost-rule.jpg",
      difficulties:cloneGhostDifficulties(ghostBundle)
    });
  }
  const VALID_TYPES = new Set(["cut","fx","slideCW","slideCCW","trace","traceCW","traceCCW","swingCW","swingCCW","scratchCW","scratchCCW"]);
  const DB_NAME="circle-mix-local-songs", DB_VERSION=1, STORE="songs";
  let localCache=[];

  function openDb(){ return new Promise((resolve,reject)=>{ const r=indexedDB.open(DB_NAME,DB_VERSION); r.onupgradeneeded=()=>{ if(!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE,{keyPath:"id"}); }; r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error||new Error("IndexedDB open failed")); }); }
  async function tx(mode, fn){ const db=await openDb(); return new Promise((resolve,reject)=>{ const t=db.transaction(STORE,mode); const s=t.objectStore(STORE); let out; try{ out=fn(s); }catch(e){ reject(e); return; } t.oncomplete=()=>{ db.close(); resolve(out?.result ?? out); }; t.onerror=()=>{ db.close(); reject(t.error||new Error("IndexedDB transaction failed")); }; }); }
  const LocalSongs = {
    async all(){ try{ localCache=await tx("readonly",s=>s.getAll()) || []; }catch(e){ console.warn("local songs unavailable",e); localCache=[]; } return localCache.slice().sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||"")); },
    cached(){ return localCache.slice(); },
    async get(id){ return tx("readonly",s=>s.get(id)); },
    async put(record){ await tx("readwrite",s=>s.put(record)); await this.all(); return record; },
    async delete(id){ await tx("readwrite",s=>s.delete(id)); await this.all(); },
    async exists(id){ return Boolean(await this.get(id)); }
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
  function validateChart(chart){ const errors=[], warnings=[]; const notes=Array.isArray(chart?.notes)?chart.notes:[]; if(!notes.length) errors.push("chart has no notes"); notes.forEach((n,i)=>{ if(!VALID_TYPES.has(n.type)) errors.push(`#${i} unsupported type ${n.type}`); if(!Number.isFinite(Number(n.beat)) || Number(n.beat)<0) errors.push(`#${i} invalid beat`); if(n.angle!==undefined && !Number.isFinite(Number(n.angle))) errors.push(`#${i} invalid angle`); if(n.angle===undefined && (!Number.isInteger(Number(n.lane ?? n.directionIndex)) || Number(n.lane ?? n.directionIndex)<0 || Number(n.lane ?? n.directionIndex)>7)) errors.push(`#${i} missing angle or invalid legacy lane`); if((String(n.type).startsWith("slide")||String(n.type).startsWith("trace")) && n.endAngle===undefined && (!Number.isInteger(Number(n.endLane ?? n.endDirectionIndex)) || Number(n.endLane ?? n.endDirectionIndex)<0 || Number(n.endLane ?? n.endDirectionIndex)>7)) errors.push(`#${i} missing/invalid endAngle`); if(["fx","slideCW","slideCCW","trace","traceCW","traceCCW"].includes(n.type) && !(Number(n.durationBeat)>0 || Number(n.duration)>0)) errors.push(`#${i} duration must be > 0`); validateTraceSweep(n,i,errors,warnings); }); for(let i=0;i<notes.length;i++) for(let j=i+1;j<notes.length;j++){ if(Math.abs((notes[i].beat||0)-(notes[j].beat||0))<0.001 && shortestAngleDifference(noteAngle(notes[i]),noteAngle(notes[j]))<8) warnings.push(`#${i}/#${j} same-time notes are visually close`); } return {ok:errors.length===0, errors, warnings}; }
  function calculateStars(chart){ const notes=(chart?.notes||[]).slice().sort((a,b)=>(a.beat||0)-(b.beat||0)); if(!notes.length) return 1; const bpm=Number(chart.bpm)||120, beat=60/bpm; const weights={cut:1,fx:1.2,slideCW:1.35,slideCCW:1.35,trace:.55,traceCW:.55,traceCCW:.55,swingCW:1.45,swingCCW:1.45,scratchCW:1.5,scratchCCW:1.5}; let raw=0, prev=null; for(const n of notes){ let w=weights[n.type]||1; if(prev){ const gap=Math.max(.04,(n.beat-prev.beat)*beat); w+=Math.max(0,Math.min(1,(.55-gap)/.55))*.95; w+=shortestAngleDifference(noteAngle(n),noteAngle(prev))/180*.55; } raw+=w; prev=n; } const dur=Math.max(1,(notes.at(-1).beat-notes[0].beat)*beat); const normalized=1+(raw/dur)*.5+Math.sqrt(notes.length/dur)*.1; return Math.round(Math.max(1,Math.min(10,normalized))*10)/10; }
  window.CircleMixSongs = BUILT_INS;
  window.CircleMixLocalSongs = LocalSongs;
  window.CircleMixChartTools = { validateChart, calculateStars, validTypes:[...VALID_TYPES], normalizeAngle, noteAngle, noteEndAngle, shortestAngleDifference };
  window.CircleMixSongRegistry = { all(){ return BUILT_INS.slice(); }, localAll(){ return LocalSongs.cached(); }, async refreshLocal(){ return LocalSongs.all(); }, get(id){ return BUILT_INS.find(s=>s.id===id) || LocalSongs.cached().find(s=>s.id===id) || BUILT_INS[0]; }, hasDifficulty(song,d){ return Boolean(song?.difficulties?.[d]); } };
})();
