(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){
    root.CircleMixAndroidUpdater=api;
    if(root.document)api.autoMount(root.document,root);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='android-updater-v1';
  const RELEASE_API='https://api.github.com/repos/EpicenterGUY/circle-mix/releases?per_page=20';
  const ASSET_SUFFIX='-android-arm64-release.apk';
  const AUTO_CHECK_DELAY_MS=2200;
  const POLL_INTERVAL_MS=650;

  function numericVersion(value){
    const match=String(value||'').trim().replace(/^v/i,'').match(/^(\d+)\.(\d+)\.(\d+)/);
    return match?match.slice(1).map(Number):[0,0,0];
  }

  function compareVersions(left,right){
    const a=numericVersion(left),b=numericVersion(right);
    for(let index=0;index<3;index++)if(a[index]!==b[index])return a[index]>b[index]?1:-1;
    return 0;
  }

  function releaseVersion(tag){
    const match=String(tag||'').trim().match(/^android-v(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)$/i);
    return match?match[1]:'';
  }

  function releaseToUpdate(release,currentVersion){
    if(!release||release.draft||release.prerelease)return null;
    const version=releaseVersion(release.tag_name);
    if(!version||compareVersions(version,currentVersion)<=0)return null;
    const expectedName=`circle-mix-${version}${ASSET_SUFFIX}`;
    const asset=Array.isArray(release.assets)?release.assets.find(item=>item?.name===expectedName&&item?.state==='uploaded'):null;
    const digest=String(asset?.digest||'');
    const sha256=digest.startsWith('sha256:')?digest.slice(7).toLowerCase():'';
    if(!asset?.browser_download_url||!/^[a-f0-9]{64}$/.test(sha256)||!(Number(asset.size)>0))return null;
    return Object.freeze({
      version,
      notes:String(release.body||'').trim(),
      publishedAt:String(release.published_at||''),
      apkUrl:String(asset.browser_download_url),
      sha256,
      size:Number(asset.size)||0
    });
  }

  function parseNativeState(value){
    if(value&&typeof value==='object')return value;
    try{return JSON.parse(String(value||'{}'));}catch(_){return {status:'error',progress:0,message:'네이티브 업데이트 상태를 읽지 못했습니다.'};}
  }

  function createController(doc,win){
    const currentVersion=String(win.CircleMixVersion?.version||'0.0.0');
    const state={status:'idle',progress:0,message:'',available:null,checking:false,installing:false,pollTimer:0};
    let mounted=false;

    function dispatch(){
      try{win.dispatchEvent(new win.CustomEvent('circlemix:android-update-state',{detail:{...state}}));}catch(_){ }
    }

    function ensureControl(){
      let control=doc.getElementById('androidUpdateCheck');
      if(control)return control;
      control=doc.createElement('button');
      control.id='androidUpdateCheck';control.type='button';control.hidden=true;control.textContent='UPDATE CHECK';
      control.addEventListener('click',()=>check({manual:true}));
      (doc.body||doc.documentElement).appendChild(control);
      return control;
    }

    function ensureUi(){
      ensureControl();
      if(!doc.getElementById('androidUpdaterPanel')){
        const style=doc.createElement('style');
        style.textContent=`
          #androidUpdaterPanel[hidden]{display:none!important}#androidUpdaterPanel{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);color:#eefaff;font-family:Inter,"Noto Sans KR",system-ui,sans-serif}
          .androidUpdaterCard{width:min(520px,calc(100vw - 28px));max-height:calc(100dvh - 28px);overflow:auto;box-sizing:border-box;padding:22px;border:1px solid rgba(99,220,255,.34);border-radius:22px;background:linear-gradient(155deg,rgba(8,25,45,.98),rgba(3,10,22,.98));box-shadow:0 28px 100px rgba(0,0,0,.66)}
          .androidUpdaterEyebrow{color:#70e7ff;font-size:10px;font-weight:900;letter-spacing:.18em}.androidUpdaterCard h2{margin:7px 0 8px;font-size:26px}.androidUpdaterBody{white-space:pre-wrap;color:#bfd1e5;font-size:13px;line-height:1.55}.androidUpdaterProgress{height:7px;margin:16px 0 8px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.10)}.androidUpdaterProgress i{display:block;width:0;height:100%;background:linear-gradient(90deg,#59e7ff,#8c72ff);transition:width .2s}.androidUpdaterStatus{min-height:20px;color:#8ce9ff;font-size:12px;font-weight:800}.androidUpdaterActions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}.androidUpdaterActions button{min-height:40px;padding:9px 14px;border-radius:12px;font:800 12px system-ui;cursor:pointer}.androidUpdaterLater{border:1px solid rgba(255,255,255,.18);background:transparent;color:#e2edf8}.androidUpdaterInstall{border:0;background:#62e8ff;color:#05101f}.androidUpdaterInstall:disabled,.androidUpdaterLater:disabled{opacity:.52}
          @media(max-width:900px){#androidUpdaterPanel{align-items:end;padding:0}.androidUpdaterCard{width:100%;max-width:none;max-height:calc(100dvh - env(safe-area-inset-top) - 12px);border-radius:22px 22px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom))}}
        `;
        doc.head.appendChild(style);
        const panel=doc.createElement('section');
        panel.id='androidUpdaterPanel';panel.hidden=true;
        panel.innerHTML=`<div class="androidUpdaterCard" role="dialog" aria-modal="true" aria-labelledby="androidUpdaterTitle"><div class="androidUpdaterEyebrow">CIRCLE MIX · ANDROID UPDATE</div><h2 id="androidUpdaterTitle">업데이트 확인</h2><div id="androidUpdaterBody" class="androidUpdaterBody"></div><div class="androidUpdaterProgress"><i id="androidUpdaterBar"></i></div><div id="androidUpdaterStatus" class="androidUpdaterStatus"></div><div class="androidUpdaterActions"><button id="androidUpdaterLater" class="androidUpdaterLater" type="button">나중에</button><button id="androidUpdaterInstall" class="androidUpdaterInstall" type="button">다운로드 및 설치</button></div></div>`;
        doc.body.appendChild(panel);
        doc.getElementById('androidUpdaterLater').addEventListener('click',()=>{if(!state.installing)panel.hidden=true;});
        doc.getElementById('androidUpdaterInstall').addEventListener('click',install);
      }
      injectSettingsCard();
    }

    function injectSettingsCard(){
      if(doc.querySelector('[data-setting="androidUpdate"]'))return true;
      const grid=doc.querySelector('#pcSettingsContent .pcSettingsSection[data-group="system"] .pcSettingsGrid');
      if(!grid)return false;
      const card=doc.createElement('article');
      card.className='pcSettingCard';card.dataset.setting='androidUpdate';card.dataset.group='system';card.dataset.quick='false';card.dataset.search='android update 앱 업데이트 최신 버전 apk 설치';
      card.innerHTML='<div class="pcSettingCopy"><div class="pcSettingTitleRow"><h4>Android 앱 업데이트</h4></div><p>GitHub Releases에서 새 서명 APK를 확인하고 설치합니다.</p></div><div class="pcSettingControl"><button class="pcSettingAction" type="button">UPDATE CHECK</button></div>';
      card.querySelector('button').addEventListener('click',()=>check({manual:true}));
      grid.prepend(card);
      const nav=doc.querySelector('.pcSettingsNavButton[data-group="system"] em');
      if(nav)nav.textContent=String(grid.querySelectorAll('.pcSettingCard').length);
      syncUi();
      return true;
    }

    function openPanel(title,body,status,canInstall=true){
      ensureUi();
      const panel=doc.getElementById('androidUpdaterPanel');
      doc.getElementById('androidUpdaterTitle').textContent=title;
      doc.getElementById('androidUpdaterBody').textContent=body||'';
      doc.getElementById('androidUpdaterStatus').textContent=status||'';
      doc.getElementById('androidUpdaterInstall').hidden=!canInstall;
      panel.hidden=false;
      syncUi();
    }

    function buttonLabel(){
      if(state.checking)return 'CHECKING…';
      if(state.installing)return state.status==='permission_required'?'설치 권한 허용':'UPDATING…';
      if(state.available)return `UPDATE ${state.available.version}`;
      if(state.status==='up_to_date')return '최신 버전';
      if(state.status==='error')return '다시 확인';
      return 'UPDATE CHECK';
    }

    function syncUi(){
      const label=buttonLabel();
      const hidden=doc.getElementById('androidUpdateCheck');if(hidden)hidden.textContent=label;
      const cardButton=doc.querySelector('[data-setting="androidUpdate"] .pcSettingAction');if(cardButton){cardButton.textContent=label;cardButton.disabled=state.checking||(state.installing&&state.status!=='permission_required');}
      const installButton=doc.getElementById('androidUpdaterInstall');if(installButton){installButton.disabled=state.checking||(state.installing&&state.status!=='permission_required');installButton.textContent=state.status==='permission_required'?'설치 권한 열기':state.installing?'진행 중…':'다운로드 및 설치';}
      const later=doc.getElementById('androidUpdaterLater');if(later)later.disabled=state.installing&&state.status!=='permission_required';
      const bar=doc.getElementById('androidUpdaterBar');if(bar)bar.style.width=`${Math.max(0,Math.min(100,Number(state.progress)||0))}%`;
      const status=doc.getElementById('androidUpdaterStatus');if(status)status.textContent=state.message||'';
      dispatch();
    }

    async function check({manual=false}={}){
      if(state.checking||state.installing)return state.available;
      ensureUi();state.checking=true;state.status='checking';state.message='최신 Android 버전을 확인하는 중입니다…';state.progress=0;syncUi();
      try{
        const response=await win.fetch(RELEASE_API,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
        if(response.status===404){
          state.available=null;state.status='up_to_date';state.message='아직 Android 정식 업데이트 채널이 게시되지 않았습니다.';
          if(manual)openPanel('업데이트 채널 준비 중','정식 서명 APK가 GitHub Releases에 게시되면 이 화면에서 바로 업데이트할 수 있습니다.',state.message,false);
          return null;
        }
        if(!response.ok)throw new Error(`GitHub API ${response.status}`);
        const releases=await response.json();
        const updates=(Array.isArray(releases)?releases:[releases]).map(release=>releaseToUpdate(release,currentVersion)).filter(Boolean).sort((a,b)=>compareVersions(b.version,a.version));
        const update=updates[0]||null;
        state.available=update;
        if(update){
          state.status='available';state.message=`현재 ${currentVersion} → 최신 ${update.version}`;
          openPanel(`CIRCLE MIX ${update.version}`,update.notes||'새 Android 업데이트가 준비되었습니다.',state.message,true);
        }else{
          state.status='up_to_date';state.message=`현재 ${currentVersion}이 최신 버전입니다.`;
          if(manual)openPanel('최신 버전입니다','설치된 CIRCLE MIX Android 앱이 최신 상태입니다.',state.message,false);
        }
        return update;
      }catch(error){
        state.status='error';state.message=`업데이트 확인 실패: ${String(error?.message||error)}`;
        if(manual)openPanel('업데이트 확인 실패','인터넷 연결 또는 GitHub Releases 상태를 확인해주세요.',state.message,false);
        return null;
      }finally{state.checking=false;syncUi();}
    }

    function nativeBridge(){return win.CircleMixAndroidUpdaterNative||null;}

    function pollNative(){
      win.clearTimeout(state.pollTimer);state.pollTimer=0;
      const bridge=nativeBridge();if(!bridge||!state.installing)return;
      const native=parseNativeState(bridge.getState?.());
      state.status=String(native.status||state.status);
      state.progress=Number(native.progress)||0;
      state.message=String(native.message||state.message);
      if(['error','installed'].includes(state.status)){state.installing=false;}
      if(state.status==='awaiting_confirmation')state.message='안드로이드 설치 확인 화면에서 업데이트를 승인해주세요.';
      syncUi();
      if(state.installing)state.pollTimer=win.setTimeout(pollNative,POLL_INTERVAL_MS);
    }

    function install(){
      ensureUi();
      const update=state.available;
      if(!update){check({manual:true});return;}
      const bridge=nativeBridge();
      if(!bridge){state.status='error';state.message='Android 네이티브 업데이트 브리지를 찾을 수 없습니다.';syncUi();return;}
      try{
        if(typeof bridge.canInstallPackages==='function'&&!bridge.canInstallPackages()){
          state.installing=true;state.status='permission_required';state.message='처음 한 번만 “이 출처의 앱 설치 허용”을 켜주세요.';syncUi();
          bridge.requestInstallPermission?.();
          return;
        }
        state.installing=true;state.status='starting';state.progress=0;state.message='업데이트 다운로드를 준비하는 중입니다…';syncUi();
        const result=parseNativeState(bridge.downloadAndInstall(update.apkUrl,update.sha256,update.version));
        state.status=String(result.status||'starting');state.message=String(result.message||state.message);state.progress=Number(result.progress)||0;syncUi();pollNative();
      }catch(error){state.installing=false;state.status='error';state.message=`업데이트 시작 실패: ${String(error?.message||error)}`;syncUi();}
    }

    function mount(){
      if(mounted)return controller;mounted=true;ensureUi();
      let attempts=0;const timer=win.setInterval(()=>{if(injectSettingsCard()||++attempts>80)win.clearInterval(timer);},100);
      doc.addEventListener('visibilitychange',()=>{
        if(!doc.hidden&&state.status==='permission_required'){
          const bridge=nativeBridge();
          if(bridge?.canInstallPackages?.()){state.installing=false;state.status='available';state.message='설치 권한이 허용되었습니다. 다운로드 및 설치를 다시 눌러주세요.';syncUi();}
        }
      });
      win.setTimeout(()=>check({manual:false}),AUTO_CHECK_DELAY_MS);
      return controller;
    }

    const controller=Object.freeze({VERSION,check,install,mount,state:()=>({...state}),label:buttonLabel,releaseToUpdate});
    return controller;
  }

  function autoMount(doc,win){
    if(!win?.CircleMixBuildConfig?.nativeAndroid)return null;
    const run=()=>{if(!win.__circleMixAndroidUpdaterController)win.__circleMixAndroidUpdaterController=createController(doc,win).mount();};
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',run,{once:true});else run();
    return win.__circleMixAndroidUpdaterController||null;
  }

  return Object.freeze({VERSION,RELEASE_API,ASSET_SUFFIX,numericVersion,compareVersions,releaseVersion,releaseToUpdate,parseNativeState,createController,autoMount});
});
