// Shared song registry and local-song persistence for CIRCLE MIX.
(() => {
  const BUILT_INS = [
    { id:"anima", source:"builtin", title:"ANiMA", artist:"xi", audio:"#embedded-anima", jacket:null, bpm:184.6, offset:-0.04, previewStart:20, previewDuration:15,
      difficulties:{ normal:{label:"NORMAL",chart:"builtin:anima-normal"}, tech:{label:"TECH",chart:"builtin:anima-tech"} } }
  ];
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
  function validateChart(chart){ const errors=[]; const notes=Array.isArray(chart?.notes)?chart.notes:[]; if(!notes.length) errors.push("chart has no notes"); notes.forEach((n,i)=>{ if(!VALID_TYPES.has(n.type)) errors.push(`#${i} unsupported type ${n.type}`); if(!Number.isFinite(Number(n.beat)) || Number(n.beat)<0) errors.push(`#${i} invalid beat`); if(!Number.isInteger(Number(n.lane)) || n.lane<0 || n.lane>7) errors.push(`#${i} invalid lane`); if((String(n.type).startsWith("slide")||String(n.type).startsWith("trace")) && (!Number.isInteger(Number(n.endLane)) || n.endLane<0 || n.endLane>7)) errors.push(`#${i} missing/invalid endLane`); if(["fx","slideCW","slideCCW","trace","traceCW","traceCCW"].includes(n.type) && !(Number(n.durationBeat)>0 || Number(n.duration)>0)) errors.push(`#${i} duration must be > 0`); }); return {ok:errors.length===0, errors}; }
  function calculateStars(chart){ const notes=(chart?.notes||[]).slice().sort((a,b)=>(a.beat||0)-(b.beat||0)); if(!notes.length) return 1; const bpm=Number(chart.bpm)||120, beat=60/bpm; const weights={cut:1,fx:1.2,slideCW:1.35,slideCCW:1.35,trace:.55,traceCW:.55,traceCCW:.55,swingCW:1.45,swingCCW:1.45,scratchCW:1.5,scratchCCW:1.5}; let raw=0, prev=null; for(const n of notes){ let w=weights[n.type]||1; if(prev){ const gap=Math.max(.04,(n.beat-prev.beat)*beat); w+=Math.max(0,Math.min(1,(.55-gap)/.55))*.95; w+=Math.abs((n.lane||0)-(prev.lane||0))/7*.55; } raw+=w; prev=n; } const dur=Math.max(1,(notes.at(-1).beat-notes[0].beat)*beat); const normalized=1+(raw/dur)*.5+Math.sqrt(notes.length/dur)*.1; return Math.round(Math.max(1,Math.min(10,normalized))*10)/10; }
  window.CircleMixSongs = BUILT_INS;
  window.CircleMixLocalSongs = LocalSongs;
  window.CircleMixChartTools = { validateChart, calculateStars, validTypes:[...VALID_TYPES] };
  window.CircleMixSongRegistry = { all(){ return BUILT_INS.slice(); }, localAll(){ return LocalSongs.cached(); }, async refreshLocal(){ return LocalSongs.all(); }, get(id){ return BUILT_INS.find(s=>s.id===id) || LocalSongs.cached().find(s=>s.id===id) || BUILT_INS[0]; }, hasDifficulty(song,d){ return Boolean(song?.difficulties?.[d]); } };
})();
