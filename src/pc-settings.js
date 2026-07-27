(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){
    root.CircleMixPcSettings=api;
    root.CircleMixSettingsHub=api;
    if(root.document)api.autoMount(root.document,root);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='settings-hub-v2';
  const VISUAL_STORAGE_KEY='circleMixVisualSettings.v1';
  const INPUT_STORAGE_KEY='circleMixInputSettings.v1';
  const UI_STORAGE_KEY='circleMixSettingsHubUi.v2';

  const GROUPS=Object.freeze([
    {id:'play',label:'플레이',hint:'속도·판정 보정·화면 모드'},
    {id:'input',label:'입력',hint:'에임·키·모바일 조작'},
    {id:'audio',label:'오디오',hint:'음악과 타격음'},
    {id:'display',label:'화면',hint:'노트·경로·이펙트·성능'},
    {id:'accessibility',label:'접근성',hint:'가이드와 시각 반응'},
    {id:'system',label:'시스템',hint:'업데이트·진단·실험 기능'}
  ]);

  const SETTINGS=Object.freeze([
    {id:'speed',group:'play',title:'노트 접근 속도',description:'노트가 판정선까지 접근하는 시간을 조절합니다.',keywords:'speed approach 배속 속도',kind:'stepper',down:'speedDown',up:'speedUp',value:'speedValue',quick:true},
    {id:'offset',group:'play',title:'판정 오프셋',description:'음원과 채보의 판정 타이밍을 앞뒤로 맞춥니다.',keywords:'offset sync timing 싱크 판정',kind:'stepper',down:'offsetDown',up:'offsetUp',value:'offsetValue',quick:true},
    {id:'auto',group:'play',title:'AUTO PLAY',description:'채보와 판정 흐름을 확인하는 자동 플레이입니다.',keywords:'auto autoplay 자동 오토',kind:'cycle',targets:['autoToggle','pauseSetAuto','safeSetAuto'],quick:true},
    {id:'fullscreen',group:'play',title:'전체 화면',description:'창 모드와 전체 화면을 전환합니다.',keywords:'fullscreen window 전체화면 창모드',kind:'action',targets:['fullToggle','pauseSetFull','safeSetFull'],actionLabel:'전환',quick:true},

    {id:'pcAim',group:'input',title:'PC 에임 방식',description:'AUTO·절대 좌표·포인터 잠금 방식을 선택합니다.',keywords:'mouse aim absolute locked pointer 마우스 에임',kind:'cycle',target:'pauseSetPcAim',platform:'pc'},
    {id:'lockedSensitivity',group:'input',title:'잠금 에임 감도',description:'포인터 잠금 방식의 회전 감도를 조절합니다.',keywords:'sensitivity locked 감도',kind:'cycle',target:'pauseSetLockedSensitivity',platform:'pc'},
    {id:'aimStabilizer',group:'input',title:'에임 안정화',description:'미세 흔들림을 줄이는 보정 강도를 선택합니다.',keywords:'stabilizer smoothing 보정 안정화',kind:'cycle',target:'pauseSetAimStabilizer'},
    {id:'aimVisual',group:'input',title:'에임 표시 방식',description:'실제 판정 위치를 직접 표시하거나 시각적으로 부드럽게 보여 줍니다.',keywords:'direct smooth visual 표시 부드럽게',kind:'cycle',target:'pauseSetAimVisual'},
    {id:'mobileHaptic',group:'input',title:'모바일 진동',description:'모바일 ACTION·PULSE 입력의 햅틱 반응을 전환합니다.',keywords:'mobile haptic vibration 진동 햅틱',kind:'cycle',target:'pauseSetHaptic',platform:'mobile'},
    {id:'mobileLayout',group:'input',title:'모바일 버튼 배치',description:'ACTION·PULSE 버튼의 위치와 크기, 투명도를 조정합니다.',keywords:'mobile layout action pulse button 배치 버튼',kind:'action',target:'pauseSetMobileLayout',actionLabel:'편집',transient:true,platform:'mobile'},
    {id:'keymap',group:'input',title:'키 안내',description:'현재 PC 조작키 표를 엽니다.',keywords:'keyboard keymap 키설정 키 안내',kind:'action',targets:['keymapToggle','safeSetKeymap'],actionLabel:'열기',transient:true,platform:'pc'},

    {id:'music',group:'audio',title:'음악 볼륨',description:'재생 중인 곡의 음량을 조절합니다.',keywords:'music volume bgm 음악 볼륨',kind:'stepper',down:'musicDown',up:'musicUp',value:'musicValue',quick:true},
    {id:'sfx',group:'audio',title:'타격음 볼륨',description:'판정 타격음의 음량을 조절하고 즉시 미리 듣습니다.',keywords:'sfx hitsound sound 타격음 효과음',kind:'stepper',down:'sfxDown',up:'sfxUp',value:'sfxValue',quick:true},

    {id:'noteContrast',group:'display',title:'노트 대비',description:'노트의 밝기와 배경 대비를 조절합니다.',keywords:'note contrast visibility 노트 대비 가독성',kind:'cycle',target:'pauseSetNoteContrast',quick:true},
    {id:'pathBrightness',group:'display',title:'경로 밝기',description:'SLIDE·TRACE 경로의 표시 밝기를 조절합니다.',keywords:'path tracer slide trace brightness 경로 트레이서',kind:'cycle',target:'pauseSetPathBrightness'},
    {id:'effectIntensity',group:'display',title:'이펙트 강도',description:'파티클과 판정 효과의 표시 강도를 조절합니다.',keywords:'effect particle flash intensity 이펙트 파티클',kind:'cycle',target:'pauseSetEffectIntensity'},
    {id:'mobileQuality',group:'display',title:'모바일 품질',description:'기기 성능에 맞춰 화질과 이펙트 부하를 조절합니다.',keywords:'mobile quality performance graphics 모바일 품질 성능',kind:'cycle',target:'pauseSetMobileQuality',platform:'mobile',quick:true},

    {id:'judgeGuide',group:'accessibility',title:'판정 가이드',description:'초보자용 판정 위치 안내 표시를 선택합니다.',keywords:'judge guide beginner 접근성 판정 가이드',kind:'cycle',target:'pauseSetJudgeGuide'},
    {id:'visualResponse',group:'accessibility',title:'에임 시각 반응',description:'SMOOTH 에임 표시가 실제 입력을 따라오는 속도를 조절합니다.',keywords:'visual response fast soft 반응 속도',kind:'cycle',target:'pauseSetVisualResponse'},

    {id:'updateLog',group:'system',title:'업데이트 내역',description:'현재 버전과 이전 변경 사항을 확인합니다.',keywords:'update changelog version 업데이트 변경',kind:'action',targets:['pauseSetUpdateLog','safeSetUpdateLog'],actionLabel:'열기',transient:true},
    {id:'mobileInputTest',group:'system',title:'모바일 입력 테스트',description:'터치 좌표와 ACTION·PULSE 입력 상태를 진단합니다.',keywords:'mobile input test touch diagnostic 모바일 입력 테스트',kind:'action',target:'pauseSetMobileInputTest',actionLabel:'테스트',transient:true,platform:'mobile'},
    {id:'mobileExport',group:'system',title:'모바일 설정 내보내기',description:'현재 모바일 조작 설정을 파일로 내보냅니다.',keywords:'mobile export settings backup 내보내기 백업',kind:'action',target:'pauseSetMobileExport',actionLabel:'내보내기',transient:true,platform:'mobile'},
    {id:'mobileReset',group:'system',title:'모바일 조작 초기화',description:'모바일 버튼 배치와 입력 설정을 기본값으로 복원합니다.',keywords:'mobile reset controls 초기화 기본값',kind:'action',target:'pauseSetMobileReset',actionLabel:'초기화',transient:true,platform:'mobile',danger:true},
    {id:'debug',group:'system',title:'입력 디버그',description:'입력·에임·TRACE 상태 진단 패널을 표시합니다.',keywords:'debug diagnostic input 디버그 진단',kind:'cycle',target:'debugToggle'},
    {id:'orbit',group:'system',title:'ORBIT · EXPERIMENTAL',description:'자동 회전 판정선과 그림 채보를 시험하는 비공식 실험 모드입니다.',keywords:'orbit experimental 실험 오빗 그림 채보',kind:'link',href:'./orbit.html',actionLabel:'실험 모드 열기',transient:true}
  ]);

  function normalizeText(value){
    return String(value||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
  }

  function settingSearchText(setting){
    return normalizeText([setting.title,setting.description,setting.keywords,setting.group].join(' '));
  }

  function isPcEnvironment(win){
    if(!win)return false;
    try{
      const query=new URLSearchParams(win.location?.search||'');
      if(query.get('pcSettings')==='1'||query.get('settingsPlatform')==='pc')return true;
      if(query.get('pcSettings')==='0'||query.get('settingsPlatform')==='mobile')return false;
    }catch(_){ }
    const width=Number(win.innerWidth)||0;
    const fine=!!win.matchMedia?.('(pointer: fine)').matches;
    const coarse=!!win.matchMedia?.('(pointer: coarse)').matches;
    return width>=720 && (fine || !coarse);
  }

  function platformFor(win){return isPcEnvironment(win)?'pc':'mobile';}
  function settingAllowed(setting,platform){return !setting.platform||setting.platform==='all'||setting.platform===platform;}

  function create(doc,tag,className,text){
    const el=doc.createElement(tag);
    if(className)el.className=className;
    if(text!==undefined)el.textContent=text;
    return el;
  }

  function targetIds(setting){return Array.isArray(setting.targets)?setting.targets.filter(Boolean):[setting.target].filter(Boolean);}
  function settingTargetId(doc,setting){return targetIds(setting).find(id=>doc.getElementById(id))||targetIds(setting)[0]||'';}

  function readNodeValue(doc,id){
    const el=doc.getElementById(id);
    if(!el)return '';
    if('value' in el && String(el.value||'').trim())return String(el.value).trim();
    return String(el.textContent||'').replace(/\s+/g,' ').trim();
  }

  function readSettingValue(doc,win,setting){
    if(setting.kind==='stepper')return readNodeValue(doc,setting.value)||`${readNodeValue(doc,setting.down)}|${readNodeValue(doc,setting.up)}`;
    if(setting.id==='fullscreen')return doc.fullscreenElement||doc.webkitFullscreenElement?'FULLSCREEN':'WINDOWED';
    if(setting.kind==='link'||setting.transient)return '';
    const id=settingTargetId(doc,setting);
    const target=id&&doc.getElementById(id);
    if(!target)return '';
    const pressed=target.getAttribute?.('aria-pressed');
    return `${readNodeValue(doc,id)}${pressed===null?'':`|${pressed}`}`;
  }

  function availableSetting(doc,setting,platform='pc'){
    if(!settingAllowed(setting,platform))return false;
    if(setting.kind==='link')return true;
    if(setting.kind==='stepper')return !!(doc.getElementById(setting.down)&&doc.getElementById(setting.up));
    return !!settingTargetId(doc,setting)&&!!doc.getElementById(settingTargetId(doc,setting));
  }

  function triggerOriginal(doc,id){
    const target=id&&doc.getElementById(id);
    if(!target||target.disabled)return false;
    if(typeof target.click==='function')target.click();
    else target.dispatchEvent(new Event('click',{bubbles:true,cancelable:true}));
    return true;
  }

  function loadUiState(win){
    try{
      const parsed=JSON.parse(win.localStorage?.getItem(UI_STORAGE_KEY)||'{}');
      const legacyGroup=parsed.group==='advanced'?'system':parsed.group;
      return {group:GROUPS.some(group=>group.id===legacyGroup)?legacyGroup:'play'};
    }catch(_){return {group:'play'};}
  }

  function saveUiState(win,state){
    try{win.localStorage?.setItem(UI_STORAGE_KEY,JSON.stringify({group:state.group}));}catch(_){ }
  }

  function mount(doc,win){
    if(!doc||!win||doc.getElementById('pcSettingsHub'))return win.CircleMixPcSettingsTestApi||null;
    const oldOrbit=doc.getElementById('safeOrbit');
    if(oldOrbit){
      oldOrbit.textContent='ORBIT · EXPERIMENTAL';
      oldOrbit.classList.add('experimentalModeButton');
      oldOrbit.title='실험 중인 비공식 모드입니다. 기록과 밸런스는 AIM 모드와 분리됩니다.';
    }

    const platform=platformFor(win);
    const state={...loadUiState(win),platform,open:false,origin:'title',mode:'full',query:'',changed:0,lastOpenAt:0,returnFocus:null};
    const baseline=new Map();
    const cards=new Map();
    const sections=new Map();
    const observers=[];

    const overlay=create(doc,'section','pcSettingsHub settingsHubV2');
    overlay.id='pcSettingsHub';
    overlay.hidden=true;
    overlay.dataset.platform=platform;
    overlay.classList.toggle('isMobilePlatform',platform==='mobile');
    overlay.classList.toggle('isPcPlatform',platform==='pc');
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-labelledby','pcSettingsTitle');
    overlay.innerHTML=`
      <div class="pcSettingsShell">
        <header class="pcSettingsHeader">
          <div><span id="pcSettingsEyebrow" class="pcSettingsEyebrow">CIRCLE MIX · ${platform==='pc'?'PC':'MOBILE'}</span><h2 id="pcSettingsTitle">SETTINGS</h2></div>
          <div class="pcSettingsHeaderActions"><span id="pcSettingsChangedCount" class="pcSettingsChangedCount">변경 0</span><button id="pcSettingsClose" type="button" aria-label="설정 닫기">×</button></div>
        </header>
        <div class="pcSettingsSearchWrap"><span aria-hidden="true">⌕</span><input id="pcSettingsSearch" type="search" autocomplete="off" placeholder="설정 검색 · 속도, 에임, 타격음…" aria-label="설정 검색"></div>
        <div class="pcSettingsLayout">
          <nav id="pcSettingsNav" class="pcSettingsNav" aria-label="설정 카테고리"></nav>
          <main id="pcSettingsContent" class="pcSettingsContent" tabindex="0"></main>
        </div>
        <footer class="pcSettingsFooter"><p id="pcSettingsFooterText">변경 사항은 즉시 적용됩니다.</p><button id="pcSettingsReset" type="button">기본값 복원</button></footer>
      </div>`;
    doc.body.appendChild(overlay);

    const nav=overlay.querySelector('#pcSettingsNav');
    const content=overlay.querySelector('#pcSettingsContent');
    const search=overlay.querySelector('#pcSettingsSearch');
    const changedCount=overlay.querySelector('#pcSettingsChangedCount');
    const title=overlay.querySelector('#pcSettingsTitle');
    const eyebrow=overlay.querySelector('#pcSettingsEyebrow');
    const footerText=overlay.querySelector('#pcSettingsFooterText');
    const resetButton=overlay.querySelector('#pcSettingsReset');

    function buildControl(setting,card){
      const box=create(doc,'div','pcSettingControl');
      if(setting.kind==='stepper'){
        const down=create(doc,'button','pcSettingStep','−');
        const value=create(doc,'output','pcSettingValue','—');
        const up=create(doc,'button','pcSettingStep','＋');
        down.type=up.type='button';
        down.setAttribute('aria-label',`${setting.title} 낮추기`);
        up.setAttribute('aria-label',`${setting.title} 높이기`);
        down.addEventListener('click',()=>{triggerOriginal(doc,setting.down);scheduleRefresh();});
        up.addEventListener('click',()=>{triggerOriginal(doc,setting.up);scheduleRefresh();});
        box.append(down,value,up);
        card._value=value;
      }else if(setting.kind==='link'){
        const link=create(doc,'a','pcSettingAction',setting.actionLabel||'열기');
        link.href=setting.href;
        box.append(link);
        card._value=link;
      }else{
        const action=create(doc,'button',`pcSettingAction${setting.danger?' isDanger':''}`,setting.actionLabel||'—');
        action.type='button';
        action.addEventListener('click',()=>{
          if(setting.transient)close();
          triggerOriginal(doc,settingTargetId(doc,setting));
          scheduleRefresh();
        });
        box.append(action);
        card._value=action;
      }
      return box;
    }

    for(const group of GROUPS){
      const button=create(doc,'button','pcSettingsNavButton');
      button.type='button';
      button.dataset.group=group.id;
      button.innerHTML=`<strong>${group.label}</strong><span>${group.hint}</span><em>0</em>`;
      button.addEventListener('click',()=>selectGroup(group.id));
      nav.append(button);

      const section=create(doc,'section','pcSettingsSection');
      section.dataset.group=group.id;
      section.innerHTML=`<div class="pcSettingsSectionHeading"><h3>${group.label}</h3><p>${group.hint}</p></div><div class="pcSettingsGrid"></div>`;
      content.append(section);
      sections.set(group.id,section);
    }

    for(const setting of SETTINGS){
      if(!availableSetting(doc,setting,platform))continue;
      const section=sections.get(setting.group);
      const grid=section?.querySelector('.pcSettingsGrid');
      if(!grid)continue;
      const card=create(doc,'article','pcSettingCard');
      card.dataset.setting=setting.id;
      card.dataset.group=setting.group;
      card.dataset.search=settingSearchText(setting);
      card.dataset.quick=setting.quick?'true':'false';
      const copy=create(doc,'div','pcSettingCopy');
      copy.innerHTML=`<div class="pcSettingTitleRow"><h4>${setting.title}</h4><span class="pcSettingChanged" aria-label="변경됨">●</span></div><p>${setting.description}</p>`;
      card.append(copy,buildControl(setting,card));
      grid.append(card);
      card._setting=setting;
      cards.set(setting.id,card);
      baseline.set(setting.id,readSettingValue(doc,win,setting));
    }

    for(const group of GROUPS){
      const count=[...cards.values()].filter(card=>card.dataset.group===group.id).length;
      const button=nav.querySelector(`[data-group="${group.id}"]`);
      if(button)button.querySelector('em').textContent=String(count);
      if(!count){button?.remove();sections.get(group.id)?.remove();sections.delete(group.id);}
    }

    function currentDisplay(setting){
      if(setting.kind==='stepper')return readNodeValue(doc,setting.value)||readNodeValue(doc,setting.up)||'—';
      if(setting.id==='fullscreen')return doc.fullscreenElement||doc.webkitFullscreenElement?'전체 화면':'창 모드';
      if(setting.kind==='link')return setting.actionLabel||'열기';
      const id=settingTargetId(doc,setting);
      return readNodeValue(doc,id)||setting.actionLabel||'열기';
    }

    function refreshCard(card){
      const setting=card._setting;
      if(!setting)return;
      const display=currentDisplay(setting);
      if(card._value)card._value.textContent=display;
      const current=readSettingValue(doc,win,setting);
      const changed=!setting.transient&&current!==baseline.get(setting.id);
      card.classList.toggle('isChanged',changed);
      const targetId=settingTargetId(doc,setting);
      const original=targetId?doc.getElementById(targetId):null;
      const unavailable=setting.kind!=='link'&&!availableSetting(doc,setting,platform);
      card.classList.toggle('isUnavailable',unavailable);
      if(card._value&&card._value.tagName==='BUTTON'){
        card._value.disabled=unavailable||!!original?.disabled;
        const pressed=original?.getAttribute?.('aria-pressed');
        if(pressed!==null&&pressed!==undefined)card._value.setAttribute('aria-pressed',pressed);
        else card._value.removeAttribute('aria-pressed');
      }
      if(setting.id==='visualResponse')card.dataset.conditionHidden=String(!!original?.hidden);
      if(setting.id==='lockedSensitivity'){
        const aimText=normalizeText(readNodeValue(doc,'pauseSetPcAim'));
        card.classList.toggle('isContextual',!aimText.includes('locked')&&!aimText.includes('잠금'));
      }
    }

    function refresh(){
      let changed=0;
      for(const card of cards.values()){
        refreshCard(card);
        if(card.classList.contains('isChanged'))changed++;
      }
      state.changed=changed;
      changedCount.textContent=`변경 ${changed}`;
      applyFilter();
    }

    let refreshTimer=0;
    function scheduleRefresh(){
      win.clearTimeout(refreshTimer);
      refreshTimer=win.setTimeout(refresh,30);
      win.setTimeout(refresh,220);
    }

    function selectGroup(groupId){
      if(!sections.has(groupId))groupId=sections.keys().next().value||'play';
      state.group=groupId;
      saveUiState(win,state);
      for(const button of nav.querySelectorAll('.pcSettingsNavButton')){
        const active=button.dataset.group===groupId;
        button.classList.toggle('isActive',active);
        button.setAttribute('aria-current',active?'page':'false');
      }
      applyFilter();
      if(state.open&&state.mode==='full')content.scrollTop=0;
    }

    function applyFilter(){
      const quick=state.mode==='quick';
      const query=quick?'':normalizeText(state.query);
      let total=0;
      for(const [groupId,section] of sections){
        let visible=0;
        const active=!query&&groupId===state.group;
        for(const card of section.querySelectorAll('.pcSettingCard')){
          const conditionHidden=card.dataset.conditionHidden==='true';
          const quickAllowed=!quick||card.dataset.quick==='true';
          const match=!conditionHidden&&quickAllowed&&(!query||card.dataset.search.includes(query));
          card.hidden=!match;
          if(match)visible++;
        }
        section.hidden=quick?visible===0:(query?visible===0:!active);
        total+=visible;
      }
      content.classList.toggle('isSearching',!!query);
      overlay.classList.toggle('hasNoResults',(!!query||quick)&&total===0);
      let empty=content.querySelector('.pcSettingsEmpty');
      if((query||quick)&&total===0){
        if(!empty){empty=create(doc,'div','pcSettingsEmpty',quick?'사용 가능한 빠른 설정이 없습니다.':'일치하는 설정이 없습니다.');content.append(empty);}
      }else empty?.remove();
    }

    function configureMode(origin){
      state.origin=origin;
      state.mode=origin==='pause'?'quick':'full';
      const quick=state.mode==='quick';
      overlay.classList.toggle('isQuickMode',quick);
      overlay.classList.toggle('isFullMode',!quick);
      title.textContent=quick?'QUICK SETTINGS':'SETTINGS';
      eyebrow.textContent=quick?'CIRCLE MIX · IN GAME':`CIRCLE MIX · ${platform==='pc'?'PC':'MOBILE'}`;
      footerText.textContent=quick?'플레이 중에는 핵심 설정만 표시됩니다. 전체 설정은 타이틀 SETTINGS에서 변경하세요.':'모든 설정은 즉시 적용되며 카테고리별로 저장됩니다.';
      resetButton.hidden=quick;
      if(quick){state.query='';search.value='';}
      applyFilter();
    }

    function open(origin='title'){
      const now=Date.now();
      if(now-state.lastOpenAt<120&&state.open)return;
      state.lastOpenAt=now;
      state.open=true;
      state.returnFocus=doc.activeElement;
      configureMode(origin);
      overlay.hidden=false;
      doc.body.classList.add('pcSettingsHubOpen');
      doc.body.classList.remove('showSettings','pauseSettingsOpen');
      doc.getElementById('pauseSettingsOverlay')?.classList.remove('show');
      doc.getElementById('safeOverlay')?.classList.remove('show');
      refresh();
      content.scrollTop=0;
      if(state.mode==='full')win.setTimeout(()=>search.focus(),0);
      else win.setTimeout(()=>content.focus(),0);
    }

    function close(){
      if(!state.open)return;
      state.open=false;
      overlay.hidden=true;
      doc.body.classList.remove('pcSettingsHubOpen');
      if(state.origin==='pause')doc.getElementById('pauseOverlay')?.classList.add('show');
      try{state.returnFocus?.focus?.();}catch(_){ }
    }

    function bindOpenTrigger(id,origin){
      const target=doc.getElementById(id);
      if(!target)return;
      let pointerAt=-Infinity;
      target.addEventListener('pointerup',event=>{
        event.preventDefault();event.stopImmediatePropagation();pointerAt=Date.now();open(origin);
      },true);
      target.addEventListener('click',event=>{
        event.preventDefault();event.stopImmediatePropagation();
        if(Date.now()-pointerAt>500)open(origin);
      },true);
    }

    search.addEventListener('input',()=>{state.query=search.value;applyFilter();content.scrollTop=0;});
    overlay.querySelector('#pcSettingsClose').addEventListener('click',close);
    resetButton.addEventListener('click',()=>{
      if(!win.confirm('설정을 기본값으로 복원하고 화면을 새로고침할까요?'))return;
      try{
        win.localStorage?.removeItem(VISUAL_STORAGE_KEY);
        win.localStorage?.removeItem(INPUT_STORAGE_KEY);
        win.localStorage?.removeItem(UI_STORAGE_KEY);
      }catch(_){ }
      win.location.reload();
    });
    overlay.addEventListener('pointerdown',event=>{if(event.target===overlay)close();});
    doc.addEventListener('keydown',event=>{if(state.open&&event.key==='Escape'){event.preventDefault();close();}},true);
    doc.addEventListener('fullscreenchange',scheduleRefresh);
    doc.addEventListener('webkitfullscreenchange',scheduleRefresh);

    bindOpenTrigger('safeSettingsBtn','title');
    bindOpenTrigger('quickSettingsBtn','title');
    bindOpenTrigger('settingsBtn','pause');

    if(win.MutationObserver){
      for(const setting of SETTINGS){
        if(!settingAllowed(setting,platform))continue;
        const ids=setting.kind==='stepper'?[setting.down,setting.up,setting.value]:targetIds(setting);
        for(const id of ids){
          const node=id&&doc.getElementById(id);
          if(!node)continue;
          const observer=new win.MutationObserver(scheduleRefresh);
          observer.observe(node,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','hidden','aria-pressed','disabled']});
          observers.push(observer);
        }
      }
    }

    selectGroup(state.group);
    refresh();

    const api={overlay,open,close,refresh,selectGroup,cards,sections,state,destroy(){for(const observer of observers)observer.disconnect();overlay.remove();doc.body.classList.remove('pcSettingsHubOpen');}};
    win.CircleMixPcSettingsTestApi=api;
    win.CircleMixSettingsHubTestApi=api;
    return api;
  }

  function autoMount(doc,win){
    const run=()=>win.setTimeout(()=>mount(doc,win),0);
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',run,{once:true});
    else run();
  }

  return Object.freeze({VERSION,GROUPS,SETTINGS,normalizeText,settingSearchText,isPcEnvironment,platformFor,settingAllowed,settingTargetId,readSettingValue,availableSetting,mount,autoMount});
});
