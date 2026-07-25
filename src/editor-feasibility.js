(() => {
  'use strict';
  const analyzer=window.CircleMixChartFeasibility;
  if(!analyzer) return;
  const $=id=>document.getElementById(id);
  const severityOrder={yellow:1,orange:2,red:3};
  const state={result:null,project:null,runToken:0,timer:0};
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  function openDb(){return new Promise(resolve=>{const request=indexedDB.open('circle-mix-editor',1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('projects'))request.result.createObjectStore('projects',{keyPath:'id'});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);});}
  async function readProject(id){const db=await openDb();if(!db)return null;return new Promise(resolve=>{const request=db.transaction('projects').objectStore('projects').get(id);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>resolve(null);});}
  async function currentProject(save){if(save)$('saveProject')?.click();await delay(save?60:25);const id=$('songId')?.value||'custom-song';return readProject(id);}
  function chartFromProject(project){return {schema:'angle-v1',bpm:Number($('bpm')?.value)||Number(project?.meta?.bpm)||120,offset:Number($('offset')?.value)||Number(project?.meta?.offset)||0,notes:Array.isArray(project?.notes)?project.notes:[]};}
  function highestForNote(index){return state.result?.highestByNote?.[index]||'';}
  function issueBlock(){const result=state.result,summary=result?.summary||{yellow:0,orange:0,red:0,total:0};const header=`<div class="feasibilitySummary"><strong>PHYSICAL CHECK</strong><span class="severity-yellow">YELLOW ${summary.yellow||0}</span><span class="severity-orange">ORANGE ${summary.orange||0}</span><span class="severity-red">RED ${summary.red||0}</span><small>경고는 내보내기를 막지 않습니다.</small></div>`;if(!result?.issues?.length)return `<section class="feasibilityBlock">${header}<div class="feasibilityOk">물리 가능성 경고가 없습니다.</div></section>`;return `<section class="feasibilityBlock">${header}${result.issues.map((issue,index)=>`<button type="button" class="feasibilityIssue severity-${issue.severity}" data-feasibility-i="${index}"><b>${escapeHtml(issue.severity.toUpperCase())}</b><span>${escapeHtml(issue.message)}</span><small>${escapeHtml(issue.code)} · NOTE ${issue.noteIndices.map(i=>`#${i}`).join(', ')}</small></button>`).join('')}</section>`;}
  function selectNote(index){const row=document.querySelector(`.noteRow[data-i="${index}"]`);row?.click();row?.scrollIntoView({block:'nearest'});const note=state.project?.notes?.[index];if(!note)return;const bpm=Math.max(1,Number($('bpm')?.value)||120),offset=Number($('offset')?.value)||0,time=(Number(note.beat)||0)*60/bpm+offset;const audio=$('audio');if(audio)audio.currentTime=Math.max(0,time-.3);const seek=$('seek');if(seek)seek.value=String(Math.max(0,time-.3));}
  function decorateRows(){document.querySelectorAll('.noteRow').forEach(row=>{row.classList.remove('severity-yellow','severity-orange','severity-red');row.querySelector('.issueBadge')?.remove();const index=Number(row.dataset.i),severity=highestForNote(index);if(!severity)return;row.classList.add(`severity-${severity}`);const first=row.querySelector('span');if(first){const badge=document.createElement('b');badge.className=`issueBadge severity-${severity}`;badge.textContent=severity.toUpperCase();first.append(' ',badge);}});}
  function renderTimelineMarkers(){const timeline=$('timeline'),canvas=$('timelineCanvas');if(!timeline||!canvas)return;timeline.querySelector('.feasibilityTimelineOverlay')?.remove();const project=state.project,result=state.result;if(!project||!result?.issues?.length)return;timeline.classList.add('hasFeasibilityOverlay');const overlay=document.createElement('div');overlay.className='feasibilityTimelineOverlay';overlay.style.width=`${canvas.width}px`;const bpm=Math.max(1,Number($('bpm')?.value)||120),offset=Number($('offset')?.value)||0,zoom=Number($('zoom')?.value)||140;Object.entries(result.highestByNote||{}).forEach(([key,severity])=>{const index=Number(key),note=project.notes?.[index];if(!note)return;const time=(Number(note.beat)||0)*60/bpm+offset,marker=document.createElement('button');marker.type='button';marker.className=`feasibilityTimelineMarker severity-${severity}`;marker.style.left=`${Math.max(0,time*zoom-4)}px`;marker.title=`${severity.toUpperCase()} · NOTE #${index}`;marker.dataset.noteIndex=String(index);overlay.appendChild(marker);});timeline.appendChild(overlay);}
  function decorate(){decorateRows();renderTimelineMarkers();}
  function renderIntoValidation(){const target=$('validation');if(!target)return;target.querySelector('.feasibilityBlock')?.remove();target.insertAdjacentHTML('beforeend',issueBlock());}
  async function run({save=false,show=false}={}){const token=++state.runToken,project=await currentProject(save);if(token!==state.runToken)return null;state.project=project||{id:$('songId')?.value||'custom-song',meta:{bpm:Number($('bpm')?.value)||120,offset:Number($('offset')?.value)||0},notes:[]};state.result=analyzer.analyze(chartFromProject(state.project));decorate();if(show)renderIntoValidation();return state.result;}
  function scheduleLive(){clearTimeout(state.timer);if(!$('autosave')?.checked)return;state.timer=setTimeout(()=>run({save:false,show:false}),90);}
  $('validateBtn')?.addEventListener('click',()=>setTimeout(()=>run({save:true,show:true}),0));
  $('physicalCheckBtn')?.addEventListener('click',()=>{$('validateBtn')?.click();});
  $('validation')?.addEventListener('click',event=>{const row=event.target.closest('[data-feasibility-i]');if(!row)return;const issue=state.result?.issues?.[Number(row.dataset.feasibilityI)],index=issue?.noteIndices?.[0];if(Number.isInteger(index))selectNote(index);});
  $('timeline')?.addEventListener('click',event=>{const marker=event.target.closest('[data-note-index]');if(marker)selectNote(Number(marker.dataset.noteIndex));});
  $('zoom')?.addEventListener('input',renderTimelineMarkers);
  document.addEventListener('change',event=>{if(event.target.matches('input,select'))scheduleLive();});
  $('preview')?.addEventListener('click',scheduleLive);
  $('noteList')&&new MutationObserver(decorateRows).observe($('noteList'),{childList:true});
  window.CircleMixEditorFeasibilityUI=Object.freeze({run,get result(){return state.result;}});
  setTimeout(()=>run({save:false,show:false}),120);
})();
