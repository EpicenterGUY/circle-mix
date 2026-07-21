/* Local-only player profile and play-history foundation. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  if(root) root.CircleMixPlayerProfile=api;
})(typeof window!=="undefined"?window:globalThis,function(root){
  "use strict";

  const DB_NAME="circle-mix-player-profile";
  const DB_VERSION=1;
  const PLAY_STORE="plays";
  const META_STORE="meta";
  const MAX_TEXT=160;
  let openPromise=null;

  const text=(value,fallback="")=>String(value??fallback).trim().slice(0,MAX_TEXT);
  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const integer=(value,fallback=0)=>Math.max(0,Math.round(finite(value,fallback)));
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const iso=value=>{const date=value?new Date(value):new Date();return Number.isFinite(date.getTime())?date.toISOString():new Date().toISOString();};

  function normalizeAccuracy(value){
    let n=finite(value,0);
    if(n>1&&n<=100)n/=100;
    return clamp(n,0,1);
  }

  function normalizePlay(input={}){
    const source=input.source==="local"?"local":"builtin";
    const songId=text(input.songId,"unknown-song")||"unknown-song";
    const chartId=text(input.chartId,"unknown-chart")||"unknown-chart";
    const autoPlay=!!input.autoPlay;
    const totalNotes=integer(input.totalNotes);
    const missCount=integer(input.missCount);
    const power=autoPlay||!Number.isFinite(Number(input.power))?null:Math.max(0,Number(input.power));
    return {
      schemaVersion:1,
      playedAt:iso(input.playedAt),
      appVersion:text(input.appVersion,"0.0.0"),
      source,
      songId,
      chartId,
      songKey:`${source}:${songId}`,
      chartKey:`${source}:${songId}:${chartId}`,
      songTitle:text(input.songTitle,"UNKNOWN"),
      artist:text(input.artist,"UNKNOWN"),
      difficultyLabel:text(input.difficultyLabel,chartId.toUpperCase()),
      starLevel:text(input.starLevel,"---"),
      score:integer(input.score),
      power,
      rank:text(input.rank,"---").toUpperCase(),
      accuracyRatio:normalizeAccuracy(input.accuracyRatio),
      perfectCount:integer(input.perfectCount),
      greatCount:integer(input.greatCount),
      missCount,
      maxCombo:integer(input.maxCombo),
      totalNotes,
      autoPlay,
      fullCombo:!autoPlay&&totalNotes>0&&missCount===0,
      completed:totalNotes>0
    };
  }

  function aggregatePlays(items=[]){
    const plays=(Array.isArray(items)?items:[]).map(normalizePlay).filter(play=>!play.autoPlay);
    const byChart={};
    const fullComboCharts=new Set();
    let accuracyTotal=0,bestScore=0,bestPower=null,fullComboPlayCount=0;
    for(const play of plays){
      accuracyTotal+=play.accuracyRatio;
      bestScore=Math.max(bestScore,play.score);
      if(play.power!==null)bestPower=bestPower===null?play.power:Math.max(bestPower,play.power);
      if(play.fullCombo){fullComboPlayCount++;fullComboCharts.add(play.chartKey);}
      const previous=byChart[play.chartKey];
      if(!previous||play.score>previous.score||(play.score===previous.score&&play.accuracyRatio>previous.accuracyRatio))byChart[play.chartKey]=play;
    }
    return {
      playCount:plays.length,
      fullComboCount:fullComboCharts.size,
      fullComboPlayCount,
      averageAccuracy:plays.length?accuracyTotal/plays.length:0,
      bestScore,
      bestPower,
      chartCount:Object.keys(byChart).length,
      bestByChart:byChart
    };
  }

  function requestResult(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error("IndexedDB request failed"));});}
  function transactionDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error("IndexedDB transaction failed"));tx.onabort=()=>reject(tx.error||new Error("IndexedDB transaction aborted"));});}

  function open(){
    if(openPromise)return openPromise;
    if(!root.indexedDB)return Promise.reject(new Error("IndexedDB is unavailable"));
    openPromise=new Promise((resolve,reject)=>{
      const request=root.indexedDB.open(DB_NAME,DB_VERSION);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(PLAY_STORE)){
          const plays=db.createObjectStore(PLAY_STORE,{keyPath:"id",autoIncrement:true});
          plays.createIndex("playedAt","playedAt");
          plays.createIndex("chartKey","chartKey");
          plays.createIndex("songKey","songKey");
        }
        if(!db.objectStoreNames.contains(META_STORE))db.createObjectStore(META_STORE,{keyPath:"key"});
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>{openPromise=null;reject(request.error||new Error("Unable to open player profile"));};
      request.onblocked=()=>console.warn("Player profile database upgrade is blocked");
    });
    return openPromise;
  }

  async function recordPlay(input){
    const play=normalizePlay(input);
    if(play.autoPlay)return {saved:false,reason:"AUTO_PLAY",play};
    if(!play.completed)return {saved:false,reason:"INCOMPLETE",play};
    const db=await open();
    const tx=db.transaction(PLAY_STORE,"readwrite");
    const id=await requestResult(tx.objectStore(PLAY_STORE).add(play));
    await transactionDone(tx);
    const saved={...play,id};
    try{root.dispatchEvent?.(new CustomEvent("circlemix:profile-play-recorded",{detail:saved}));}catch(_){ }
    return {saved:true,play:saved};
  }

  async function listRecent(limit=20){
    const db=await open();
    const tx=db.transaction(PLAY_STORE,"readonly");
    const store=tx.objectStore(PLAY_STORE);
    const rows=await requestResult(store.getAll());
    await transactionDone(tx);
    return rows.sort((a,b)=>String(b.playedAt).localeCompare(String(a.playedAt))).slice(0,Math.max(0,integer(limit,20)));
  }

  async function getSummary(){
    const db=await open();
    const tx=db.transaction(PLAY_STORE,"readonly");
    const rows=await requestResult(tx.objectStore(PLAY_STORE).getAll());
    await transactionDone(tx);
    return aggregatePlays(rows);
  }

  async function clearAll(){
    const db=await open();
    const tx=db.transaction([PLAY_STORE,META_STORE],"readwrite");
    tx.objectStore(PLAY_STORE).clear();
    tx.objectStore(META_STORE).clear();
    await transactionDone(tx);
  }

  function parseNumber(value){
    const match=String(value||"").replaceAll(",","").match(/-?\d+(?:\.\d+)?/);
    return match?Number(match[0]):0;
  }

  function selectedSongInfo(doc){
    const params=new URL(root.location?.href||"http://local/").searchParams;
    const source=params.get("tab")==="local"?"local":"builtin";
    const songId=params.get("song")||(source==="builtin"?"anima":"unknown-song");
    const chartId=params.get(source==="local"?"chart":"difficulty")||"unknown-chart";
    const registry=root.CircleMixSongRegistry;
    const song=source==="local"?registry?.localAll?.().find(item=>item.id===songId):registry?.get?.(songId);
    const meta=song?.difficulties?.[chartId]||song?.charts?.[chartId]?.meta||{};
    const mapText=doc.getElementById("resultMapLevel")?.textContent||"";
    const star=mapText.match(/\d+(?:\.\d+)?★/)?.[0]||"---";
    return {source,songId,chartId,songTitle:song?.title||doc.getElementById("resultSongTitle")?.textContent?.split(" / ")[0]||"UNKNOWN",artist:song?.artist||"UNKNOWN",difficultyLabel:meta.label||mapText.replace(star,"").trim()||chartId.toUpperCase(),starLevel:star};
  }

  function captureResult(doc=root.document){
    const overlay=doc?.getElementById?.("resultOverlay");
    if(!overlay?.classList?.contains("show"))return null;
    const info=selectedSongInfo(doc);
    const autoPlay=/AUTO/i.test(doc.getElementById("resultAuto")?.textContent||"");
    const powerText=doc.getElementById("resultPower")?.textContent||"";
    return normalizePlay({
      ...info,
      appVersion:root.CircleMixVersion?.version,
      score:parseNumber(doc.getElementById("resultScore")?.textContent),
      power:autoPlay?null:parseNumber(powerText),
      rank:doc.getElementById("resultRank")?.textContent,
      accuracyRatio:parseNumber(doc.getElementById("resultAccuracy")?.textContent)/100,
      perfectCount:parseNumber(doc.getElementById("resultPerfect")?.textContent),
      greatCount:parseNumber(doc.getElementById("resultGreat")?.textContent),
      missCount:parseNumber(doc.getElementById("resultMiss")?.textContent),
      maxCombo:parseNumber(doc.getElementById("resultMaxCombo")?.textContent),
      totalNotes:parseNumber(doc.getElementById("resultTotalNotes")?.textContent),
      autoPlay
    });
  }

  function installResultRecorder(doc=root.document){
    if(!doc?.getElementById||doc.__circleMixProfileRecorderInstalled)return false;
    const overlay=doc.getElementById("resultOverlay");
    if(!overlay||typeof MutationObserver==="undefined")return false;
    doc.__circleMixProfileRecorderInstalled=true;
    let shown=overlay.classList.contains("show"),generation=0;
    const schedule=()=>{
      const token=++generation;
      root.setTimeout?.(async()=>{
        if(token!==generation||!overlay.classList.contains("show"))return;
        const play=captureResult(doc);
        if(!play)return;
        try{await recordPlay(play);}catch(error){console.warn("Player profile record failed",error);}
      },900);
    };
    const observer=new MutationObserver(()=>{
      const next=overlay.classList.contains("show");
      if(next&&!shown)schedule();
      if(!next)generation++;
      shown=next;
    });
    observer.observe(overlay,{attributes:true,attributeFilter:["class"]});
    if(shown)schedule();
    return true;
  }

  if(root.document){
    const start=()=>installResultRecorder(root.document);
    if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  }

  return {DB_NAME,DB_VERSION,normalizePlay,aggregatePlays,open,recordPlay,listRecent,getSummary,clearAll,captureResult,installResultRecorder};
});
