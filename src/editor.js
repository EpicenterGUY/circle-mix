(() => {
  const $ = id => document.getElementById(id);
  const TAU = Math.PI * 2;
  const NOTE_TYPES = ["cut","fx","slideCW","slideCCW","trace","traceCW","traceCCW","swingCW","swingCCW","scratchCW","scratchCCW"];
  const state = { notes: [], selected: new Set(), type: "cut", audioUrl: null, audioFile: null, jacketFile: null, jacketData: null, clipboard: [], undo: [], redo: [], db: null, autoPreview:false, lastMetro:-1 };
  const audio = $("audio"), preview = $("preview"), ctx = preview.getContext("2d"), tl = $("timelineCanvas"), tx = tl.getContext("2d");
  const fields = ["songId","title","artist","bpm","offset","difficulty","previewStart"];
  const meta = () => Object.fromEntries(fields.map(id => [id, id==="bpm"||id==="offset"||id==="previewStart" ? Number($(id).value)||0 : $(id).value.trim() || ""]));
  const beatDur = () => 60 / Math.max(1, Number($("bpm").value)||120);
  const beatAt = t => Math.max(0, (t - (Number($("offset").value)||0)) / beatDur());
  const timeAtBeat = b => b * beatDur() + (Number($("offset").value)||0);
  const snapBeat = b => Math.round(b / Number($("snap").value)) * Number($("snap").value);
  const normDeg = d => ((Number(d||0) % 360) + 360) % 360;
  const snapAngle = deg => { const v=$("angleSnap")?.value || "8"; if(v==="FREE") return normDeg(deg); const step=360/(Number(v)||8); return normDeg(Math.round(normDeg(deg)/step)*step); };
  const cleanDeg = d => Number(normDeg(d).toFixed(3));
  const angleToLane = deg => ((Math.round(normDeg(deg) / 45) % 8));
  const laneToDeg = lane => cleanDeg((Number(lane)||0) * 45);
  const noteAngle = n => n?.angle !== undefined ? cleanDeg(n.angle) : laneToDeg(n?.directionIndex ?? n?.lane ?? 0);
  const noteEndAngle = n => { const raw=n?.endAngle ?? n?.endDirectionIndex ?? n?.endLane; return raw===undefined ? "" : (n.endAngle!==undefined ? cleanDeg(raw) : laneToDeg(raw)); };
  const shortestAngleDifference = (a,b) => Math.abs(((a-b+180)%360+360)%360-180);
  function noteTime(n){ return typeof n.beat === "number" ? timeAtBeat(n.beat) : Number(n.time)||0; }
  function pushHistory(){ state.undo.push(JSON.stringify(state.notes)); if(state.undo.length>80) state.undo.shift(); state.redo=[]; }
  function restore(json){ state.notes = JSON.parse(json); state.selected.clear(); renderAll(); autosave(); }
  function selectedNote(){ return state.notes[[...state.selected][0]]; }
  function makeNote(angleDeg){
    const type = state.type, beat = snapBeat(beatAt(audio.currentTime));
    const angle = cleanDeg(snapAngle(angleDeg));
    const note = { type, beat, angle };
    if(type === "fx") note.durationBeat = 4;
    if(type.startsWith("slide") || type.startsWith("trace")){ note.endAngle = cleanDeg(angle + (type.endsWith("CCW") ? -90 : 90)); note.durationBeat = type.startsWith("trace") ? 1.5 : 4; if(type.startsWith("trace")) note.sweepAngle = type.endsWith("CCW") ? -90 : 90; }
    if(type.startsWith("scratch")){ note.endAngle = cleanDeg(angle + (type.endsWith("CCW") ? -45 : 45)); note.durationBeat = .55; note.amount = Math.PI * .34; }
    if(type.startsWith("swing")) note.direction = type.endsWith("CCW") ? "CCW" : "CW";
    return note;
  }
  function addNote(angleDeg){ pushHistory(); state.notes.push(makeNote(angleDeg)); state.notes.sort((a,b)=>noteTime(a)-noteTime(b)); state.selected = new Set([state.notes.length-1]); renderAll(); autosave(); }
  function updateSelectedFromInputs(){ const n=selectedNote(); if(!n) return; pushHistory(); n.beat=Number($("noteBeat").value)||0; n.angle=cleanDeg(Number($("noteAngle").value)||0); delete n.lane; if($("noteEndAngle").value!=="") { n.endAngle=cleanDeg(Number($("noteEndAngle").value)); delete n.endLane; } n.direction=$("noteDirection").value; if($("noteDuration").value!=="") n.durationBeat=Number($("noteDuration").value)||0; if($("noteSweepAngle")?.value!=="") n.sweepAngle=Number($("noteSweepAngle").value)||0; else delete n.sweepAngle; if($("noteTurns")?.value!=="") n.turns=Number($("noteTurns").value)||0; else delete n.turns; renderAll(); autosave(); }
  function fillProps(){ const n=selectedNote(); $("noteBeat").value=n?.beat??""; $("noteAngle").value=n?noteAngle(n):""; $("noteEndAngle").value=n?noteEndAngle(n):""; $("noteDirection").value=n?.direction || (n?.type?.endsWith("CCW")?"CCW":"CW"); $("noteDuration").value=n?.durationBeat??""; if($("noteSweepAngle")) $("noteSweepAngle").value=n?.sweepAngle??""; if($("noteTurns")) $("noteTurns").value=n?.turns??""; }
  function chartJson(){ const m=meta(); return { schema:"angle-v1", title:m.title, artist:m.artist, bpm:m.bpm, offset:m.offset, difficulty:m.difficulty, previewStart:m.previewStart, notes:state.notes.slice().sort((a,b)=>(a.beat??0)-(b.beat??0)) }; }
  function songMetaJson(){ const m=meta(); return { id:m.songId, title:m.title, artist:m.artist, audio:"", jacket:state.jacketData?"local-jacket-not-embedded-in-chart":null, bpm:m.bpm, offset:m.offset, previewStart:m.previewStart, difficulties:{ custom:{ label:m.difficulty, chart:`${m.songId}.json` } } }; }
  function download(name,obj){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:"application/json"})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); }
  function validate(){ const dur=audio.duration||Infinity, errors=[], warnings=[]; const traceSign=n=>String(n.direction || (n.type?.endsWith("CCW")?"CCW":(n.type?.endsWith("CW")?"CW":""))).toUpperCase()==="CCW"?-1:(String(n.direction || (n.type?.endsWith("CW")?"CW":"")).toUpperCase()==="CW"?1:0); state.notes.forEach((n,i)=>{ const fam=n.type==="fx"?"hold":(n.type||"").replace(/CW|CCW/g,"").toLowerCase(); if(!NOTE_TYPES.includes(n.type)) errors.push(`#${i} unsupported type ${n.type}`); if((n.beat??0)<0 || noteTime(n)<0) errors.push(`#${i} negative time`); if(["fx","slideCW","slideCCW","trace","traceCW","traceCCW"].includes(n.type) && !(n.durationBeat>0)) errors.push(`#${i} ${fam} duration must be > 0`); if(noteTime(n)>dur) warnings.push(`#${i} outside song length`); if(n.angle!==undefined && !Number.isFinite(Number(n.angle))) errors.push(`#${i} invalid angle`); if(n.angle===undefined && (n.lane===undefined || n.lane<0 || n.lane>7)) errors.push(`#${i} invalid lane/angle`); if((n.type.startsWith("slide")||n.type.startsWith("trace")) && n.endAngle===undefined && n.endLane===undefined) errors.push(`#${i} missing endAngle`); const end=noteEndAngle(n); if((n.type.startsWith("slide")||n.type.startsWith("trace")) && end!=="" && shortestAngleDifference(noteAngle(n),end)<6) warnings.push(`#${i} path start/end angles are very close`); if(n.type.startsWith("trace")){ const sign=traceSign(n); if(n.sweepAngle!==undefined && !Number.isFinite(Number(n.sweepAngle))) errors.push(`#${i} invalid sweepAngle`); if(n.sweepAngle!==undefined && Number(n.sweepAngle)!==0 && sign && Math.sign(Number(n.sweepAngle))!==sign) errors.push(`#${i} direction conflicts with sweepAngle`); if(end!=="" && shortestAngleDifference(noteAngle(n),end)<6 && n.sweepAngle===undefined && n.turns===undefined) warnings.push(`#${i} TRACE needs sweepAngle/turns when startAngle equals endAngle`); } }); for(let i=0;i<state.notes.length;i++) for(let j=i+1;j<state.notes.length;j++){ if(Math.abs((state.notes[i].beat||0)-(state.notes[j].beat||0))<0.001 && shortestAngleDifference(noteAngle(state.notes[i]),noteAngle(state.notes[j]))<8) warnings.push(`#${i}/#${j} same-time angles overlap visually`); } $("validation").innerHTML=[...errors.map(e=>`<div class="err">ERROR ${e}</div>`),...warnings.map(w=>`<div class="warn">WARN ${w}</div>`)].join("") || "No errors."; return errors.length===0; }
  function renderPreview(){ const w=preview.width,h=preview.height,c=w/2,r=w*.35; ctx.clearRect(0,0,w,h); ctx.strokeStyle="#24405f"; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(c,c,r,0,TAU); ctx.stroke(); for(let i=0;i<8;i++){ const a=(-90+i*45)*Math.PI/180; ctx.strokeStyle="rgba(92,255,251,.18)"; ctx.beginPath(); ctx.moveTo(c,c); ctx.lineTo(c+Math.cos(a)*r,c+Math.sin(a)*r); ctx.stroke(); }
    const t=audio.currentTime; state.notes.forEach((n,i)=>{ const dt=noteTime(n)-t; if(Math.abs(dt)>8) return; const a=(noteAngle(n)-90)*Math.PI/180; const rr=r + Math.max(-40,Math.min(110,dt*30)); ctx.fillStyle=state.selected.has(i)?"#fff36a":(n.type.includes("scratch")?"#d9782a":n.type.includes("slide")?"#ffe15a":n.type.includes("trace")?"#dffcff":n.type.includes("swing")?"#ff72d6":n.type==="fx"?"#b77cff":"#5cfffb"); ctx.beginPath(); ctx.arc(c+Math.cos(a)*rr,c+Math.sin(a)*rr,8,0,TAU); ctx.fill(); if(n.type.includes("trace") && state.selected.has(i)){ const sweep=Number(n.sweepAngle ?? (Number(n.turns||0)*360)); if(sweep){ ctx.fillStyle="#dffcff"; ctx.font="700 12px system-ui"; ctx.textAlign="center"; ctx.fillText(`${sweep}° / ${(Math.abs(sweep)/360).toFixed(2)}x`,c,c+r+24); } } }); }
  function renderTimeline(){ const zoom=Number($("zoom").value), w=Math.max(900,(audio.duration||120)*zoom); tl.width=w; const h=tl.height, t=audio.currentTime, bpm=Number($("bpm").value)||120; tx.clearRect(0,0,w,h); tx.fillStyle="#06101e"; tx.fillRect(0,0,w,h); tx.strokeStyle="rgba(92,255,251,.18)"; for(let b=0;b<beatAt(audio.duration||120)+8;b++){ const x=timeAtBeat(b)*zoom; tx.beginPath(); tx.moveTo(x,0); tx.lineTo(x,h); tx.stroke(); } state.notes.forEach((n,i)=>{ const x=noteTime(n)*zoom; tx.fillStyle=state.selected.has(i)?"#fff36a":"#5cfffb"; tx.fillRect(x-2,35+angleToLane(noteAngle(n))*12,5,16); }); tx.strokeStyle="#ff4567"; tx.beginPath(); tx.moveTo(t*zoom,0); tx.lineTo(t*zoom,h); tx.stroke(); }
  function renderList(){ $("noteList").innerHTML=state.notes.map((n,i)=>`<div class="noteRow ${state.selected.has(i)?"on":""}" data-i="${i}"><span>${i} ${n.type}</span><span>b${(n.beat||0).toFixed(3)} A${noteAngle(n)}°</span></div>`).join(""); fillProps(); }
  function renderAll(){ renderPreview(); renderTimeline(); renderList(); }
  function tick(){ if(!audio.paused && $("loop").checked){ const s=Math.max(0,audio.currentTime-4), e=s+8; if(audio.currentTime>e) audio.currentTime=s; } if($("metro").checked){ const b=Math.floor(beatAt(audio.currentTime)); if(b!==state.lastMetro){ state.lastMetro=b; try{ const ac=new AudioContext(), o=ac.createOscillator(); o.connect(ac.destination); o.frequency.value=880; o.start(); o.stop(ac.currentTime+.035); }catch{} } } $("seek").value=audio.currentTime||0; $("timeLabel").textContent=`${(audio.currentTime||0).toFixed(3)} / ${(audio.duration||0).toFixed(3)}`; renderPreview(); requestAnimationFrame(tick); }
  function openDb(){ return new Promise(res=>{ const r=indexedDB.open("circle-mix-editor",1); r.onupgradeneeded=()=>r.result.createObjectStore("projects",{keyPath:"id"}); r.onsuccess=()=>{state.db=r.result;res();}; r.onerror=()=>res(); }); }
  function saveLocal(){ if(!state.db) return; const p={id:$("songId").value||"custom-song", savedAt:new Date().toISOString(), meta:meta(), notes:state.notes}; const txd=state.db.transaction("projects","readwrite"); txd.objectStore("projects").put(p); txd.oncomplete=listProjects; }
  function autosave(){ if($("autosave").checked) saveLocal(); }
  function listProjects(){ if(!state.db) return; const req=state.db.transaction("projects").objectStore("projects").getAll(); req.onsuccess=()=>$("projects").innerHTML=req.result.map(p=>`<div class="projectRow" data-id="${p.id}"><span>${p.id}</span><span>${new Date(p.savedAt).toLocaleString()}</span></div>`).join(""); }
  NOTE_TYPES.forEach(t=>{ const b=document.createElement("button"); b.textContent=t; b.onclick=()=>{state.type=t; document.querySelectorAll("#typeBtns button").forEach(x=>x.classList.toggle("on",x===b));}; $("typeBtns").appendChild(b); if(t==="cut") b.classList.add("on"); });
  preview.addEventListener("click",e=>{ const r=preview.getBoundingClientRect(), x=(e.clientX-r.left)*preview.width/r.width-preview.width/2, y=(e.clientY-r.top)*preview.height/r.height-preview.height/2; addNote(normDeg(Math.atan2(y,x)*180/Math.PI+90)); });
  tl.addEventListener("click",e=>{ const r=tl.getBoundingClientRect(), x=(e.clientX-r.left)*tl.width/r.width, t=x/Number($("zoom").value); audio.currentTime=Math.max(0,t); const idx=state.notes.findIndex(n=>Math.abs(noteTime(n)-t)<.05); if(idx>=0){ if(!e.shiftKey) state.selected.clear(); state.selected.add(idx); } renderAll(); });
  $("noteList").onclick=e=>{ const row=e.target.closest(".noteRow"); if(!row)return; if(!e.shiftKey) state.selected.clear(); state.selected.add(Number(row.dataset.i)); renderAll(); };
  ["noteBeat","noteAngle","noteEndAngle","noteDirection","noteDuration","noteSweepAngle","noteTurns"].forEach(id=>$(id).addEventListener("change",updateSelectedFromInputs));
  $("audioFile").onchange=e=>{ const f=e.target.files[0]; if(!f)return; state.audioFile=f; if(state.audioUrl) URL.revokeObjectURL(state.audioUrl); state.audioUrl=URL.createObjectURL(f); audio.src=state.audioUrl; $("fileInfo").textContent=`${f.name} · loading duration...`; audio.onloadedmetadata=()=>{ $("fileInfo").textContent=`${f.name} · ${(audio.duration||0).toFixed(3)}s · local object URL`; $("seek").max=audio.duration||0; renderAll(); }; };
  $("jacketFile").onchange=e=>{ const f=e.target.files[0]; if(!f)return; state.jacketFile=f; const rd=new FileReader(); rd.onload=()=>{state.jacketData=rd.result; autosave();}; rd.readAsDataURL(f); };
  $("playBtn").onclick=()=> audio.paused ? audio.play() : audio.pause(); audio.onplay=()=>$("playBtn").textContent="Pause"; audio.onpause=()=>$("playBtn").textContent="Play"; $("seek").oninput=e=>audio.currentTime=Number(e.target.value); $("rate").onchange=e=>audio.playbackRate=Number(e.target.value); $("zoom").oninput=renderTimeline;
  $("exportBtn").onclick=()=>{ if(validate()) download(`${$("songId").value||"chart"}.json`, chartJson()); }; $("exportMetaBtn").onclick=()=>download(`${$("songId").value||"song"}.metadata.json`, songMetaJson()); $("validateBtn").onclick=validate;
  $("importFile").onchange=e=>{ const f=e.target.files[0]; if(!f)return; const rd=new FileReader(); rd.onload=()=>{ try{ const data=JSON.parse(rd.result); pushHistory(); state.notes=Array.isArray(data)?data:(data.notes||[]); fields.forEach(id=>{ if(data[id]!==undefined) $(id).value=data[id]; }); renderAll(); autosave(); validate(); }catch(err){ $("validation").innerHTML=`<span class="err">IMPORT ERROR ${err.message}</span>`; } }; rd.readAsText(f); };
  $("copyBtn").onclick=()=>state.clipboard=[...state.selected].map(i=>({...state.notes[i]})); $("pasteBtn").onclick=()=>{ pushHistory(); const add=state.clipboard.map(n=>({...n,beat:(n.beat||0)+Number($("snap").value)})); state.notes.push(...add); renderAll(); autosave();}; $("deleteBtn").onclick=()=>{ pushHistory(); state.notes=state.notes.filter((_,i)=>!state.selected.has(i)); state.selected.clear(); renderAll(); autosave();}; $("undoBtn").onclick=()=>{ if(state.undo.length){ state.redo.push(JSON.stringify(state.notes)); restore(state.undo.pop()); }}; $("redoBtn").onclick=()=>{ if(state.redo.length){ state.undo.push(JSON.stringify(state.notes)); restore(state.redo.pop()); }};

  async function addToLocalSongs(){
    const m=meta(), status=$("localSongStatus"), tools=window.CircleMixChartTools, store=window.CircleMixLocalSongs;
    const chart=chartJson(), problems=[];
    if(!m.songId) problems.push("곡 ID가 필요합니다.");
    if(!m.title) problems.push("곡명이 필요합니다.");
    if(!m.artist) problems.push("아티스트가 필요합니다.");
    if(!state.audioFile) problems.push("오디오 파일이 필요합니다.");
    if(!(m.bpm>0)) problems.push("BPM은 0보다 커야 합니다.");
    if(!Number.isFinite(m.offset)) problems.push("OFFSET이 올바르지 않습니다.");
    const checked=tools.validateChart(chart);
    if(!checked.ok) problems.push(...checked.errors);
    if(problems.length){ status.innerHTML=problems.map(e=>`<div class="err">${e}</div>`).join(""); return; }
    try{
      if(await store.exists(m.songId) && !confirm(`LOCAL SONGS에 ${m.songId}가 이미 있습니다. 덮어쓸까요?`)) return;
      const diffKey=(m.difficulty||"custom").toLowerCase().replace(/[^a-z0-9_-]+/g,"-") || "custom";
      const record={ id:m.songId, source:"local", title:m.title, artist:m.artist, bpm:m.bpm, offset:m.offset, previewStart:m.previewStart, updatedAt:new Date().toISOString(), audioBlob:state.audioFile, audioType:state.audioFile.type, jacketBlob:state.jacketFile||null, jacketData:state.jacketData, difficulties:{ [diffKey]:{ label:m.difficulty||"CUSTOM", chart:`local:${m.songId}:${diffKey}`, stars:tools.calculateStars(chart) } }, charts:{ [diffKey]:chart } };
      await store.put(record);
      status.innerHTML=`<div>No errors. LOCAL SONGS에 등록되었습니다. <a class="back" href="./index.html?tab=local&song=${encodeURIComponent(m.songId)}&difficulty=${encodeURIComponent(diffKey)}">SONG SELECT로 이동</a></div>`;
    }catch(err){ status.innerHTML=`<div class="err">IndexedDB 저장 실패: ${err.message}</div>`; }
  }

  $("saveProject").onclick=saveLocal; $("addLocalSong").onclick=addToLocalSongs; $("newProject").onclick=()=>{ pushHistory(); state.notes=[]; state.selected.clear(); renderAll();}; $("projects").onclick=e=>{ const row=e.target.closest(".projectRow"); if(!row||!state.db)return; const req=state.db.transaction("projects").objectStore("projects").get(row.dataset.id); req.onsuccess=()=>{ const p=req.result; if(!p)return; Object.entries(p.meta||{}).forEach(([k,v])=>$(k)&&($(k).value=v)); state.notes=p.notes||[]; renderAll(); }; };
  document.querySelectorAll(".quickSweep [data-sweep]").forEach(b=>b.onclick=()=>{ const n=selectedNote(); if(!n)return; pushHistory(); const sign=($("noteDirection").value==="CCW"?-1:1); n.sweepAngle=Number(b.dataset.sweep)*sign; $("noteSweepAngle").value=n.sweepAngle; renderAll(); autosave(); });
  $("autoPreviewBtn").onclick=()=>{ state.autoPreview=!state.autoPreview; $("autoPreviewBtn").classList.toggle("on",state.autoPreview); $("validation").innerHTML="AUTO preview uses the editor renderer only; official game judgment stays in src/game.js."; };
  document.addEventListener("keydown",e=>{ if(e.target.matches("input,textarea,select"))return; if(e.key===" "){ e.preventDefault(); $("playBtn").click(); } if(e.key==="Delete") $("deleteBtn").click(); if((e.ctrlKey||e.metaKey)&&e.key==="c") $("copyBtn").click(); if((e.ctrlKey||e.metaKey)&&e.key==="v") $("pasteBtn").click(); if((e.ctrlKey||e.metaKey)&&e.key==="z") $("undoBtn").click(); });

  async function loadLocalSongFromQuery(){
    const id=new URLSearchParams(location.search).get("localSong");
    if(!id || !window.CircleMixLocalSongs) return;
    try{ const rec=await window.CircleMixLocalSongs.get(id); if(!rec) return;
      $("songId").value=rec.id; $("title").value=rec.title||""; $("artist").value=rec.artist||""; $("bpm").value=rec.bpm||120; $("offset").value=rec.offset||0; $("previewStart").value=rec.previewStart||0;
      const diff=Object.keys(rec.charts||{})[0]; if(diff){ $("difficulty").value=rec.difficulties?.[diff]?.label || diff; state.notes=rec.charts[diff].notes||[]; }
      state.audioFile=rec.audioBlob; state.jacketFile=rec.jacketBlob; state.jacketData=rec.jacketData; if(state.audioUrl) URL.revokeObjectURL(state.audioUrl); state.audioUrl=URL.createObjectURL(rec.audioBlob); audio.src=state.audioUrl; $("fileInfo").textContent=`${rec.title} · IndexedDB audio Blob`; renderAll(); validate();
    }catch(err){ $("validation").innerHTML=`<span class="err">LOCAL LOAD ERROR ${err.message}</span>`; }
  }

  openDb().then(()=>{ listProjects(); loadLocalSongFromQuery(); }); renderAll(); tick();
})();
