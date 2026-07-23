from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


game_path = Path("src/game.js")
game = game_path.read_text()
game = replace_once(
    game,
    '  const rotateOverlay = document.getElementById("rotateOverlay");',
    '  let rotateOverlay = document.getElementById("rotateOverlay");',
    "rotate overlay declaration",
)
game = replace_once(
    game,
    '''  async function lockLandscapeSafe(){
    try{ if(screen.orientation && screen.orientation.lock) await screen.orientation.lock("landscape"); }catch(e){}
  }''',
    '''  async function lockLandscapeSafe(reason="unspecified"){
    const orientation=screen.orientation;
    if(!orientation?.lock) return false;
    try{ await orientation.lock("landscape"); return true; }
    catch(error){ if(mobileDebug) console.log(`[Orientation] landscape lock failed · ${reason}`,error); return false; }
  }''',
    "landscape lock helper",
)
game = replace_once(
    game,
    '''    if(isStandaloneDisplay()){ scheduleStableViewportResize("standalone"); return true; }
    if(fullscreenTransitioning) return false;
    const target=fullscreenTarget || document.documentElement;
    if(document.fullscreenElement || document.webkitFullscreenElement){ scheduleStableViewportResize("already-fullscreen"); return true; }''',
    '''    if(isStandaloneDisplay()){ await lockLandscapeSafe("standalone"); scheduleStableViewportResize("standalone"); return true; }
    if(fullscreenTransitioning) return false;
    const target=fullscreenTarget || document.documentElement;
    if(document.fullscreenElement || document.webkitFullscreenElement){ await lockLandscapeSafe("already-fullscreen"); scheduleStableViewportResize("already-fullscreen"); return true; }''',
    "fullscreen preconditions",
)
game = replace_once(
    game,
    '      await lockLandscapeSafe();',
    '      await lockLandscapeSafe("request-success");',
    "fullscreen lock reason",
)
game = replace_once(
    game,
    '''    if(fullscreenRetryBtn) fullscreenRetryBtn.hidden=inFullscreen || !isMobileViewport();
    if(!inFullscreen){ try{ if(screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }catch(e){} }
    scheduleStableViewportResize("fullscreenchange");''',
    '''    if(fullscreenRetryBtn) fullscreenRetryBtn.hidden=inFullscreen || !isMobileViewport();
    if(!inFullscreen){ try{ if(screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }catch(e){} }
    else lockLandscapeSafe("fullscreenchange");
    scheduleStableViewportResize("fullscreenchange");''',
    "fullscreen change relock",
)
game = replace_once(
    game,
    '''  let pendingMobileStartMode = null;
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
  }''',
    '''  let pendingMobileStartMode = null;
  let orientationPaused = false;
  let foldExpanded = false;
  let foldRelockTimer = 0;

  function isMobileViewport(){
    return !!(window.matchMedia && window.matchMedia("(max-width: 768px), (pointer: coarse)").matches);
  }

  function mobileViewportMetrics(){
    const vv=window.visualViewport;
    const width=Math.max(1,Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 1));
    const height=Math.max(1,Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 1));
    return {width,height,shortSide:Math.min(width,height),longSide:Math.max(width,height),portrait:height>width};
  }

  function isExpandedFoldViewport(metrics=mobileViewportMetrics()){
    return isMobileViewport() && metrics.shortSide>=600 && metrics.longSide>=700;
  }

  function canRelockLandscape(){
    return isStandaloneDisplay() || !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function syncFoldViewportState(){
    const metrics=mobileViewportMetrics();
    const expanded=isExpandedFoldViewport(metrics);
    const changed=expanded!==foldExpanded;
    foldExpanded=expanded;
    document.body.classList.toggle("foldExpanded",expanded);
    return {...metrics,expanded,changed};
  }

  function ensureRotateOverlayUi(){
    if(!rotateOverlay){
      rotateOverlay=document.createElement("div");
      rotateOverlay.id="rotateOverlay";
      rotateOverlay.className="rotateOverlay";
      rotateOverlay.setAttribute("role","dialog");
      rotateOverlay.setAttribute("aria-modal","true");
      rotateOverlay.innerHTML='<div class="rotateCard"><strong>기기를 가로로 돌려주세요</strong><span>가로 화면에서 CIRCLE MIX를 플레이할 수 있습니다.</span></div>';
      document.body.appendChild(rotateOverlay);
    }
    let button=rotateOverlay.querySelector("#rotateLandscapeBtn");
    if(!button){
      button=document.createElement("button");
      button.id="rotateLandscapeBtn";
      button.className="rotateLandscapeBtn";
      button.type="button";
      button.textContent="가로 화면으로 전환";
      (rotateOverlay.querySelector(".rotateCard") || rotateOverlay).appendChild(button);
      button.addEventListener("click",async event=>{
        safeInputEvent(event);
        await requestGameFullscreen();
        await lockLandscapeSafe("rotate-button");
        scheduleStableViewportResize("rotate-button");
        setTimeout(()=>handleAdaptiveMobileViewport("rotate-button",true),120);
      },{passive:false});
    }
    return {overlay:rotateOverlay,button};
  }

  function isMobilePortraitPlayBlocked(){
    const metrics=mobileViewportMetrics();
    return isMobileViewport() && metrics.portrait;
  }

  function setRotateOverlay(show){
    const state=syncFoldViewportState();
    const {overlay,button}=ensureRotateOverlayUi();
    overlay.classList.toggle("show",!!show);
    document.body.classList.toggle("needsLandscape",!!show);
    const title=overlay.querySelector(".rotateCard strong");
    const detail=overlay.querySelector(".rotateCard span");
    if(title) title.textContent=state.expanded?"펼친 화면을 가로로 전환해주세요":"기기를 가로로 돌려주세요";
    if(detail) detail.textContent=state.expanded?"앱에서는 자동 전환을 시도합니다. 브라우저가 막으면 아래 버튼을 눌러주세요.":"가로 화면에서 CIRCLE MIX를 플레이할 수 있습니다.";
    if(button) button.hidden=!show;
  }

  function handleAdaptiveMobileViewport(reason="resize",forceRelock=false){
    const state=syncFoldViewportState();
    applyMobileControlLayout();
    if(mobileLayoutEditing) renderMobileLayoutEditor();
    if(state.expanded && (state.changed || forceRelock) && canRelockLandscape()){
      if(foldRelockTimer) clearTimeout(foldRelockTimer);
      foldRelockTimer=setTimeout(async()=>{
        foldRelockTimer=0;
        await lockLandscapeSafe(`fold-${reason}`);
        scheduleStableViewportResize(`fold-${reason}`);
        handlePlayOrientation();
      },80);
    }
    return handlePlayOrientation();
  }''',
    "mobile orientation block",
)
game = replace_once(
    game,
    '''  window.addEventListener("resize",()=>{ releaseMobilePointers(); scheduleStableViewportResize("resize"); handlePlayOrientation(); });
  window.addEventListener("orientationchange", () => { releaseMobilePointers(); keys.MouseLeft=false; forceReleaseScratch(); filterHeld=false; mouseDownRight=false; scheduleStableViewportResize("orientationchange"); setTimeout(handlePlayOrientation, 80); });
  window.visualViewport?.addEventListener("resize",()=>scheduleStableViewportResize("visualViewport"));''',
    '''  window.addEventListener("resize",()=>{ releaseMobilePointers(); scheduleStableViewportResize("resize"); handleAdaptiveMobileViewport("resize"); });
  window.addEventListener("orientationchange", () => { releaseMobilePointers(); keys.MouseLeft=false; forceReleaseScratch(); filterHeld=false; mouseDownRight=false; scheduleStableViewportResize("orientationchange"); setTimeout(()=>handleAdaptiveMobileViewport("orientationchange",true),80); });
  window.visualViewport?.addEventListener("resize",()=>{ scheduleStableViewportResize("visualViewport"); handleAdaptiveMobileViewport("visualViewport"); });''',
    "viewport listeners",
)
game = replace_once(
    game,
    '''  safeSetState("title", "initial load");
  safeRefresh();
  showTutorialPrompt();''',
    '''  safeSetState("title", "initial load");
  safeRefresh();
  handleAdaptiveMobileViewport("initial",true);
  showTutorialPrompt();''',
    "initial viewport sync",
)
game_path.write_text(game)

style_path = Path("style.css")
style = style_path.read_text()
marker = "/* Foldable landscape affordance v1 */"
if marker in style:
    raise SystemExit("fold style already exists")
style += '''

/* Foldable landscape affordance v1 */
.rotateLandscapeBtn{margin-top:16px;min-height:46px;padding:11px 18px;border:0;border-radius:999px;background:#5cfffb;color:#06101d;font-size:13px;font-weight:1000;letter-spacing:.06em;box-shadow:0 0 28px rgba(92,255,251,.28);touch-action:manipulation;cursor:pointer}
.rotateLandscapeBtn[hidden]{display:none!important}
body.foldExpanded .rotateCard{width:min(520px,calc(100vw - 36px));border-color:rgba(141,107,255,.48);box-shadow:0 24px 80px rgba(0,0,0,.62),0 0 78px rgba(141,107,255,.20)}
body.foldExpanded .rotateCard strong{font-size:clamp(22px,4vw,30px)}
@media (pointer:coarse) and (min-width:600px){body.foldExpanded .rotateCard{padding:28px 32px}.rotateLandscapeBtn{min-width:220px}}
'''
style_path.write_text(style)

smoke_path = Path("tests/smoke.test.js")
smoke = smoke_path.read_text()
smoke += '''

test("foldable mobile viewports retry landscape safely", () => {
  const src=fs.readFileSync("src/game.js","utf8");
  assert.match(src,/function mobileViewportMetrics\(\)/);
  assert.match(src,/metrics\.shortSide>=600 && metrics\.longSide>=700/);
  assert.match(src,/function handleAdaptiveMobileViewport\(reason="resize",forceRelock=false\)/);
  assert.match(src,/state\.expanded && \(state\.changed \|\| forceRelock\) && canRelockLandscape\(\)/);
  assert.match(src,/if\(isStandaloneDisplay\(\)\)\{ await lockLandscapeSafe\("standalone"\)/);
  assert.match(src,/button\.textContent="가로 화면으로 전환"/);
  assert.match(src,/await requestGameFullscreen\(\);[\s\S]{0,120}await lockLandscapeSafe\("rotate-button"\)/);
  assert.match(src,/handleAdaptiveMobileViewport\("initial",true\)/);
});
'''
smoke_path.write_text(smoke)

browser_path = Path("tests/mobile-song-select-layout.test.js")
browser = browser_path.read_text()
browser = replace_once(
    browser,
    '''      bodyClass:document.body.className,
      updateLogVisible:!!document.getElementById('updateLogOverlay')?.classList.contains('show'),''',
    '''      bodyClass:document.body.className,
      foldExpanded:document.body.classList.contains('foldExpanded'),
      landscapeButtonExists:!!document.getElementById('rotateLandscapeBtn'),
      landscapeButtonHidden:document.getElementById('rotateLandscapeBtn')?.hidden ?? null,
      updateLogVisible:!!document.getElementById('updateLogOverlay')?.classList.contains('show'),''',
    "mobile layout snapshot",
)
browser = replace_once(
    browser,
    '''        assert.equal(state.coarse,true,`${viewport.name} coarse pointer media query missing`);
        assert.equal(state.cardCount,7,`${viewport.name} LOCAL cards ${JSON.stringify(state)}`);''',
    '''        assert.equal(state.coarse,true,`${viewport.name} coarse pointer media query missing`);
        const expandedViewport=Math.min(viewport.width,viewport.height)>=600&&Math.max(viewport.width,viewport.height)>=700;
        assert.equal(state.foldExpanded,expandedViewport,`${viewport.name} fold-expanded classification ${JSON.stringify(state)}`);
        assert.equal(state.landscapeButtonExists,true,`${viewport.name} landscape fallback button missing ${JSON.stringify(state)}`);
        assert.equal(state.landscapeButtonHidden,true,`${viewport.name} landscape button should stay hidden outside blocked play ${JSON.stringify(state)}`);
        assert.equal(state.cardCount,7,`${viewport.name} LOCAL cards ${JSON.stringify(state)}`);''',
    "mobile layout fold assertions",
)
browser_path.write_text(browser)

version_path = Path("src/version.js")
version = version_path.read_text()
version = replace_once(
    version,
    'cacheRevision: "20260723-pwa-update-foundation"',
    'cacheRevision: "20260723-fold-landscape-v1"',
    "cache revision",
)
version_path.write_text(version)
