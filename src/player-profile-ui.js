/* Visible local-only profile screen for CIRCLE MIX. */
(function(root){
'use strict';

const BUTTON_ID='circleMixProfileBtn';
const OVERLAY_ID='circleMixProfileOverlay';
const STYLE_ID='circleMixProfileStyle';
const NICKNAME_KEY='circleMixProfileNickname';
const DEFAULT_NICKNAME='PLAYER';
let returnFocus=null;

const text=(value,fallback='')=>String(value??fallback).trim();
const number=value=>Number.isFinite(Number(value))?Number(value):0;
const formatInteger=value=>Math.max(0,Math.round(number(value))).toLocaleString();
const formatAccuracy=value=>`${(Math.max(0,Math.min(1,number(value)))*100).toFixed(2)}%`;
const formatPower=value=>value===null||value===undefined?'---':formatInteger(value);

function nickname(){
  try{return text(root.localStorage?.getItem(NICKNAME_KEY),DEFAULT_NICKNAME).slice(0,24)||DEFAULT_NICKNAME;}
  catch(_){return DEFAULT_NICKNAME;}
}

function saveNickname(value){
  const next=text(value,DEFAULT_NICKNAME).slice(0,24)||DEFAULT_NICKNAME;
  try{root.localStorage?.setItem(NICKNAME_KEY,next);}catch(_){ }
  return next;
}

function initial(value){
  return Array.from(text(value,DEFAULT_NICKNAME))[0]?.toUpperCase()||'P';
}

function el(doc,tag,className='',value=''){
  const node=doc.createElement(tag);
  if(className)node.className=className;
  if(value!=='')node.textContent=value;
  return node;
}

function installStyle(doc){
  if(doc.getElementById(STYLE_ID))return;
  const style=doc.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
#${BUTTON_ID}{display:none;position:fixed;z-index:9500;right:max(18px,env(safe-area-inset-right));top:max(18px,env(safe-area-inset-top));min-width:112px;min-height:48px;padding:10px 18px;border:1px solid rgba(143,246,255,.42);border-radius:999px;background:linear-gradient(135deg,rgba(21,42,72,.96),rgba(26,22,64,.96));color:#ecfbff;font:800 14px/1 system-ui,sans-serif;letter-spacing:.08em;box-shadow:0 0 24px rgba(78,229,255,.16);cursor:pointer}
body.safeTitle #${BUTTON_ID}{display:inline-flex;align-items:center;justify-content:center}
body.circleMixProfileOpen #${BUTTON_ID}{visibility:hidden}
#${OVERLAY_ID}[hidden]{display:none!important}
#${OVERLAY_ID}{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;padding:max(14px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));background:rgba(1,6,18,.86);backdrop-filter:blur(13px);box-sizing:border-box;color:#eefbff;font-family:system-ui,sans-serif}
.circleMixProfilePanel{width:min(960px,100%);max-height:min(92dvh,880px);overflow:auto;box-sizing:border-box;padding:clamp(16px,3vw,30px);border:1px solid rgba(113,236,255,.28);border-radius:28px;background:linear-gradient(145deg,rgba(8,20,42,.98),rgba(13,13,38,.98));box-shadow:0 30px 90px rgba(0,0,0,.56),0 0 44px rgba(80,229,255,.09)}
.circleMixProfileHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.circleMixProfileEyebrow{margin:0 0 5px;color:#6cf7f2;font-weight:900;font-size:12px;letter-spacing:.28em}.circleMixProfileHeader h2{margin:0;font-size:clamp(30px,6vw,56px);line-height:.95;letter-spacing:.04em}.circleMixProfileClose{width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;font-size:24px;cursor:pointer}
.circleMixProfileIdentity{display:grid;grid-template-columns:92px minmax(0,1fr);gap:18px;align-items:center;margin-bottom:20px;padding:16px;border-radius:22px;background:rgba(255,255,255,.045)}.circleMixProfileAvatar{display:grid;place-items:center;width:92px;height:92px;border-radius:50%;background:radial-gradient(circle at 30% 28%,#76fff7,#a463ff 58%,#17254c);color:#071426;font-size:44px;font-weight:1000;box-shadow:0 0 30px rgba(102,244,255,.25)}.circleMixProfileNameRow{display:flex;gap:10px;align-items:center}.circleMixProfileName{min-width:0;flex:1;height:48px;box-sizing:border-box;border:1px solid rgba(255,255,255,.18);border-radius:14px;background:rgba(0,0,0,.24);color:#fff;padding:0 14px;font-size:18px;font-weight:800}.circleMixProfileSave{height:48px;padding:0 18px;border:0;border-radius:14px;background:linear-gradient(135deg,#58fff3,#8a6cff);color:#071326;font-weight:1000;cursor:pointer}.circleMixProfileStatus{min-height:20px;margin:7px 0 0;color:#9caec6;font-size:12px;letter-spacing:.04em}
.circleMixProfileStats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:22px}.circleMixProfileStat{min-width:0;padding:15px 12px;border-radius:18px;background:rgba(255,255,255,.05);text-align:center}.circleMixProfileStat span{display:block;color:#91a6c0;font-size:10px;font-weight:900;letter-spacing:.12em}.circleMixProfileStat strong{display:block;margin-top:5px;color:#fff;font-size:clamp(18px,3vw,28px);overflow:hidden;text-overflow:ellipsis}
.circleMixProfileSectionTitle{display:flex;justify-content:space-between;align-items:end;gap:10px;margin-bottom:10px}.circleMixProfileSectionTitle h3{margin:0;font-size:20px}.circleMixProfileSectionTitle span{color:#8194ad;font-size:11px}.circleMixProfileRecent{display:grid;gap:8px}.circleMixProfileRecord{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:13px 15px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.055)}.circleMixProfileRecordMain,.circleMixProfileRecordScore{min-width:0}.circleMixProfileRecord strong,.circleMixProfileRecord b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.circleMixProfileRecord small{display:block;margin-top:4px;color:#91a6c0}.circleMixProfileRecordScore{text-align:right}.circleMixProfileEmpty{padding:26px;border:1px dashed rgba(255,255,255,.16);border-radius:16px;color:#91a6c0;text-align:center}
@media(max-width:720px){#${BUTTON_ID}{right:max(10px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));min-width:92px;min-height:42px;padding:8px 12px;font-size:11px}.circleMixProfilePanel{border-radius:20px;padding:15px}.circleMixProfileHeader h2{font-size:34px}.circleMixProfileIdentity{grid-template-columns:64px minmax(0,1fr);gap:12px;padding:12px}.circleMixProfileAvatar{width:64px;height:64px;font-size:31px}.circleMixProfileNameRow{align-items:stretch;flex-direction:column}.circleMixProfileName,.circleMixProfileSave{width:100%}.circleMixProfileStats{grid-template-columns:repeat(2,minmax(0,1fr))}.circleMixProfileStat:last-child{grid-column:1/-1}.circleMixProfileRecord{grid-template-columns:minmax(0,1fr)}.circleMixProfileRecordScore{text-align:left;display:flex;justify-content:space-between;gap:10px}}
@media(orientation:landscape) and (max-height:520px){#${OVERLAY_ID}{place-items:start center;padding:7px}.circleMixProfilePanel{max-height:calc(100dvh - 14px);padding:11px 14px}.circleMixProfileHeader{margin-bottom:8px}.circleMixProfileHeader h2{font-size:28px}.circleMixProfileIdentity{grid-template-columns:52px minmax(0,1fr);margin-bottom:8px;padding:8px}.circleMixProfileAvatar{width:52px;height:52px;font-size:25px}.circleMixProfileStats{grid-template-columns:repeat(5,minmax(0,1fr));margin-bottom:10px}.circleMixProfileStat{padding:8px}.circleMixProfileStat strong{font-size:17px}.circleMixProfileRecent{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
  (doc.head||doc.documentElement).appendChild(style);
}

function setText(doc,id,value){const node=doc.getElementById(id);if(node)node.textContent=value;}

function renderRecord(doc,play){
  const row=el(doc,'article','circleMixProfileRecord');
  const main=el(doc,'div','circleMixProfileRecordMain');
  main.append(el(doc,'strong','',play.songTitle||'UNKNOWN'));
  main.append(el(doc,'small','',`${play.difficultyLabel||play.chartId||'CHART'} ${play.starLevel||''} · ${play.rank||'---'}${play.fullCombo?' · FULL COMBO':''}`));
  const score=el(doc,'div','circleMixProfileRecordScore');
  score.append(el(doc,'b','',formatInteger(play.score)));
  score.append(el(doc,'small','',`${formatAccuracy(play.accuracyRatio)} · POWER ${formatPower(play.power)}`));
  row.append(main,score);
  return row;
}

async function refresh(doc=root.document){
  const api=root.CircleMixPlayerProfile;
  if(!api)return false;
  const [summary,recent]=await Promise.all([api.getSummary(),api.listRecent(10)]);
  const name=nickname();
  const input=doc.getElementById('circleMixProfileNickname');
  if(input&&doc.activeElement!==input)input.value=name;
  setText(doc,'circleMixProfileAvatar',initial(name));
  setText(doc,'circleMixProfilePlayCount',formatInteger(summary.playCount));
  setText(doc,'circleMixProfileFcCount',formatInteger(summary.fullComboCount));
  setText(doc,'circleMixProfileAccuracy',formatAccuracy(summary.averageAccuracy));
  setText(doc,'circleMixProfilePower',formatPower(summary.bestPower));
  setText(doc,'circleMixProfileChartCount',formatInteger(summary.chartCount));
  const list=doc.getElementById('circleMixProfileRecent');
  if(list){
    list.replaceChildren();
    if(!recent.length)list.append(el(doc,'div','circleMixProfileEmpty','NO PLAY RECORDS YET'));
    else recent.forEach(play=>list.append(renderRecord(doc,play)));
  }
  return true;
}

function close(doc=root.document){
  const overlay=doc.getElementById(OVERLAY_ID);
  if(!overlay||overlay.hidden)return false;
  overlay.hidden=true;
  doc.body?.classList.remove('circleMixProfileOpen');
  returnFocus?.focus?.();
  returnFocus=null;
  return true;
}

async function open(doc=root.document){
  const overlay=doc.getElementById(OVERLAY_ID);
  if(!overlay)return false;
  returnFocus=doc.activeElement;
  overlay.hidden=false;
  doc.body?.classList.add('circleMixProfileOpen');
  await refresh(doc);
  doc.getElementById('circleMixProfileClose')?.focus?.();
  return true;
}

function install(doc=root.document){
  if(!doc?.body||doc.getElementById(BUTTON_ID))return false;
  installStyle(doc);
  const launch=el(doc,'button','circleMixProfileLaunch','PROFILE');
  launch.id=BUTTON_ID;
  launch.type='button';
  launch.setAttribute('aria-haspopup','dialog');

  const overlay=el(doc,'section','circleMixProfileOverlay');
  overlay.id=OVERLAY_ID;
  overlay.hidden=true;
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-labelledby','circleMixProfileTitle');
  const panel=el(doc,'div','circleMixProfilePanel');
  const header=el(doc,'header','circleMixProfileHeader');
  const heading=el(doc,'div');
  heading.append(el(doc,'p','circleMixProfileEyebrow','LOCAL PLAYER DATA'));
  const title=el(doc,'h2','','PROFILE');title.id='circleMixProfileTitle';heading.append(title);
  const closeButton=el(doc,'button','circleMixProfileClose','×');closeButton.id='circleMixProfileClose';closeButton.type='button';closeButton.setAttribute('aria-label','Close profile');
  header.append(heading,closeButton);

  const identity=el(doc,'section','circleMixProfileIdentity');
  const avatar=el(doc,'div','circleMixProfileAvatar',initial(nickname()));avatar.id='circleMixProfileAvatar';
  const editor=el(doc,'div');
  const nameRow=el(doc,'div','circleMixProfileNameRow');
  const nameInput=doc.createElement('input');nameInput.id='circleMixProfileNickname';nameInput.className='circleMixProfileName';nameInput.maxLength=24;nameInput.value=nickname();nameInput.setAttribute('aria-label','Profile nickname');
  const save=el(doc,'button','circleMixProfileSave','SAVE');save.type='button';
  nameRow.append(nameInput,save);
  const status=el(doc,'p','circleMixProfileStatus','SAVED ONLY ON THIS DEVICE');status.id='circleMixProfileStatus';
  editor.append(nameRow,status);identity.append(avatar,editor);

  const stats=el(doc,'section','circleMixProfileStats');
  for(const [label,id] of [['PLAYS','circleMixProfilePlayCount'],['FC CHARTS','circleMixProfileFcCount'],['AVG ACC','circleMixProfileAccuracy'],['BEST POWER','circleMixProfilePower'],['PLAYED CHARTS','circleMixProfileChartCount']]){
    const card=el(doc,'div','circleMixProfileStat');card.append(el(doc,'span','',label));const strong=el(doc,'strong','','---');strong.id=id;card.append(strong);stats.append(card);
  }
  const sectionTitle=el(doc,'div','circleMixProfileSectionTitle');sectionTitle.append(el(doc,'h3','','RECENT RECORDS'),el(doc,'span','','AUTO RESULTS EXCLUDED'));
  const recent=el(doc,'section','circleMixProfileRecent');recent.id='circleMixProfileRecent';
  panel.append(header,identity,stats,sectionTitle,recent);overlay.append(panel);doc.body.append(launch,overlay);

  launch.addEventListener('click',()=>open(doc));
  closeButton.addEventListener('click',()=>close(doc));
  overlay.addEventListener('click',event=>{if(event.target===overlay)close(doc);});
  save.addEventListener('click',()=>{const next=saveNickname(nameInput.value);nameInput.value=next;avatar.textContent=initial(next);status.textContent='PROFILE SAVED ON THIS DEVICE';});
  nameInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();save.click();}});
  doc.addEventListener('keydown',event=>{if(event.key==='Escape'&&!overlay.hidden){event.preventDefault();close(doc);}});
  root.addEventListener?.('circlemix:profile-play-recorded',()=>{if(!overlay.hidden)refresh(doc).catch(()=>{});});
  return true;
}

const api={install,open,close,refresh,nickname,saveNickname};
root.CircleMixPlayerProfileUi=api;
if(root.document){const start=()=>install(root.document);if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof window!=='undefined'?window:globalThis);
