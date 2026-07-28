from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
REVISION = "20260728-editor-playtest-v1"


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def write(path, text):
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def regex_once(text, pattern, replacement, label, flags=0):
    next_text, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return next_text


# editor.html: add the direct playtest controls and load the shared runtime.
editor_html = read("editor.html")
transport_tail = '''      <label class="check"><input id="metro" type="checkbox" /> metronome</label>
    </div>
    <div class="timeline" id="timeline"><canvas id="timelineCanvas" height="160"></canvas></div>'''
playtest_panel = '''      <label class="check"><input id="metro" type="checkbox" /> metronome</label>
    </div>
    <section class="playtestPanel" aria-labelledby="playtestTitle">
      <div class="playtestHead"><div><strong id="playtestTitle">DIRECT PLAYTEST</strong><small>현재 편집본을 LOCAL SONGS에 저장한 뒤 공식 게임 판정으로 바로 테스트합니다. 아래 값은 테스트에만 적용되며 .cmix에는 저장되지 않습니다.</small></div><button id="playtestBtn" type="button">SAVE &amp; OPEN PLAYTEST</button></div>
      <div class="playtestControls">
        <label>Judgement <select id="playtestJudge"><option value="STRICT">STRICT</option><option value="NORMAL" selected>NORMAL</option><option value="LENIENT">LENIENT</option></select></label>
        <label>Judge circle <input id="playtestRing" type="range" min="0.75" max="1.15" step="0.05" value="1" /><output id="playtestRingValue">1.00x</output></label>
        <label>Note size <input id="playtestNoteScale" type="range" min="0.80" max="1.40" step="0.05" value="1" /><output id="playtestNoteScaleValue">1.00x</output></label>
        <label>Approach <input id="playtestApproach" type="range" min="0.34" max="1.10" step="0.02" value="0.60" /><output id="playtestApproachValue">0.60s</output></label>
      </div>
      <div id="playtestSummary" class="playtestSummary">NORMAL · RING 1.00x · NOTE 1.00x · APPROACH 0.60s</div>
    </section>
    <div class="timeline" id="timeline"><canvas id="timelineCanvas" height="160"></canvas></div>'''
editor_html = replace_once(editor_html, transport_tail, playtest_panel, "editor playtest panel")
old_editor_script = '<script src="./src/editor.js?v=20260726-unified-settings-mobile-layout-v2"></script>'
new_editor_scripts = f'<script src="./src/editor-playtest.js?v={REVISION}"></script>\n<script src="./src/editor.js?v={REVISION}"></script>'
editor_html = replace_once(editor_html, old_editor_script, new_editor_scripts, "editor playtest script")
editor_html = editor_html.replace("20260726-unified-settings-mobile-layout-v2", REVISION)
write("editor.html", editor_html)


# editor.css: readable controls without taking over the main editor layout.
editor_css = read("src/editor.css")
playtest_css = '''
.playtestPanel{margin-top:12px;padding:12px;border:1px solid rgba(255,159,67,.45);border-radius:14px;background:linear-gradient(135deg,rgba(255,159,67,.10),rgba(92,255,251,.05));text-align:left}.playtestHead{display:flex;align-items:center;gap:12px}.playtestHead>div{flex:1}.playtestHead strong{display:block;color:#ffb347;letter-spacing:.08em}.playtestHead small{display:block;margin-top:4px;color:var(--muted);line-height:1.35}.playtestHead button{border-color:rgba(255,159,67,.7);background:#4a2915;white-space:nowrap}.playtestControls{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:9px;margin-top:10px}.playtestControls label{display:grid;grid-template-columns:1fr auto;align-items:center;gap:5px;color:var(--muted);font-size:11px}.playtestControls label select,.playtestControls label input{grid-column:1/-1}.playtestControls output{color:#fff;font-weight:800}.playtestSummary{margin-top:9px;padding:8px 10px;border-radius:9px;background:rgba(3,8,18,.62);color:#fff;font-size:11px;font-weight:800;letter-spacing:.04em}.playtestPanel.isBusy{opacity:.72;pointer-events:none}
@media(max-width:980px),(pointer:coarse){.playtestHead{align-items:stretch;flex-direction:column}.playtestHead button{width:100%}.playtestControls{grid-template-columns:1fr 1fr}}
'''
if ".playtestPanel{" in editor_css:
    raise SystemExit("editor playtest CSS already exists")
write("src/editor.css", editor_css.rstrip() + playtest_css)


# index.html: shared runtime must be available before game.js evaluates its session.
index = read("index.html")
if "src/editor-playtest.js" in index:
    raise SystemExit("index already loads editor playtest runtime")
index = regex_once(
    index,
    r'(<script\s+src=["\'][^"\']*src/game\.js[^"\']*["\']\s*></script>)',
    f'<script src="./src/editor-playtest.js?v={REVISION}"></script>\n\\1',
    "index editor playtest loader",
    re.I,
)
write("index.html", index)


# editor.js: preview scaling, persistence, LOCAL save, and direct handoff.
editor_js = read("src/editor.js")
meta_line = '  const meta = () => Object.fromEntries(fields.map(id => [id, id==="bpm"||id==="offset"||id==="previewStart" ? Number($(id).value)||0 : $(id).value.trim() || ""]));\n'
playtest_runtime = '''  const meta = () => Object.fromEntries(fields.map(id => [id, id==="bpm"||id==="offset"||id==="previewStart" ? Number($(id).value)||0 : $(id).value.trim() || ""]));
  const playtestApi=window.CircleMixEditorPlaytest;
  let playtestPreferences=playtestApi?.loadPreferences()||{judgementPreset:"NORMAL",hitRadiusScale:1,noteScale:1,approachSeconds:.60};
  function difficultyKey(){const value=(meta().difficulty||"custom").toLowerCase().replace(/[^a-z0-9_-]+/g,"-");return value||"custom";}
  function playtestSettingsFromInputs(){return playtestApi?.sanitize({judgementPreset:$("playtestJudge")?.value,hitRadiusScale:$("playtestRing")?.value,noteScale:$("playtestNoteScale")?.value,approachSeconds:$("playtestApproach")?.value})||playtestPreferences;}
  function syncPlaytestUi({repaint=true,persist=true}={}){
    const settings=playtestSettingsFromInputs();playtestPreferences=settings;
    if(persist)playtestApi?.savePreferences(settings);
    if($("playtestRingValue"))$("playtestRingValue").textContent=settings.hitRadiusScale.toFixed(2)+"x";
    if($("playtestNoteScaleValue"))$("playtestNoteScaleValue").textContent=settings.noteScale.toFixed(2)+"x";
    if($("playtestApproachValue"))$("playtestApproachValue").textContent=settings.approachSeconds.toFixed(2)+"s";
    if($("playtestSummary"))$("playtestSummary").textContent=playtestApi?.summary(settings)||"";
    window.CircleMixEditorPlaytestUI={settings,previewMetrics:playtestApi?.previewMetrics(settings,preview.width)||null};
    if(repaint)renderPreview();
    return settings;
  }
  function initializePlaytestControls(){
    if(!playtestApi||!$("playtestBtn"))return;
    $("playtestJudge").value=playtestPreferences.judgementPreset;
    $("playtestRing").value=playtestPreferences.hitRadiusScale;
    $("playtestNoteScale").value=playtestPreferences.noteScale;
    $("playtestApproach").value=playtestPreferences.approachSeconds;
    for(const id of ["playtestJudge","playtestRing","playtestNoteScale","playtestApproach"]){$(id)?.addEventListener(id==="playtestJudge"?"change":"input",()=>syncPlaytestUi());}
    syncPlaytestUi({repaint:false,persist:false});
  }
'''
editor_js = replace_once(editor_js, meta_line, playtest_runtime, "editor playtest runtime")
editor_js = regex_once(
    editor_js,
    r'  function renderPreview\(\)\{.*?\n  function renderTimeline\(\)',
    '''  function renderPreview(){ const w=preview.width,h=preview.height,c=w/2,settings=playtestSettingsFromInputs(),metrics=playtestApi?.previewMetrics(settings,w)||{ringRadius:w*.35,noteRadius:8,lineWidth:3},r=metrics.ringRadius; window.CircleMixEditorPlaytestUI={settings,previewMetrics:metrics}; ctx.clearRect(0,0,w,h); ctx.strokeStyle="#24405f"; ctx.lineWidth=metrics.lineWidth; ctx.beginPath(); ctx.arc(c,c,r,0,TAU); ctx.stroke(); for(let i=0;i<8;i++){ const a=(-90+i*45)*Math.PI/180; ctx.strokeStyle="rgba(92,255,251,.18)"; ctx.beginPath(); ctx.moveTo(c,c); ctx.lineTo(c+Math.cos(a)*r,c+Math.sin(a)*r); ctx.stroke(); }
    const t=audio.currentTime; state.notes.forEach((n,i)=>{ const dt=noteTime(n)-t; if(Math.abs(dt)>8) return; if(n.type==="pulse"){ const p=Math.max(0,Math.min(1,1-dt/Math.max(.2,settings.approachSeconds))); ctx.strokeStyle=state.selected.has(i)?"#fff36a":"#ff9f43"; ctx.lineWidth=5*settings.noteScale; ctx.beginPath(); ctx.arc(c,c,Math.max(18,r*p),0,TAU); ctx.stroke(); return; } const a=(noteAngle(n)-90)*Math.PI/180; const rr=r + Math.max(-40,Math.min(110,dt*30)); ctx.fillStyle=state.selected.has(i)?"#fff36a":(n.type.includes("scratch")?"#d9782a":n.type.includes("slide")?"#ffe15a":n.type.includes("trace")?"#dffcff":n.type.includes("swing")?"#ff72d6":n.type==="fx"?"#b77cff":"#5cfffb"); ctx.beginPath(); ctx.arc(c+Math.cos(a)*rr,c+Math.sin(a)*rr,metrics.noteRadius,0,TAU); ctx.fill(); if(n.type.includes("trace") && state.selected.has(i)){ const sweep=Number(n.sweepAngle ?? (Number(n.turns||0)*360)); if(sweep){ ctx.fillStyle="#dffcff"; ctx.font="700 12px system-ui"; ctx.textAlign="center"; ctx.fillText(`${sweep}° / ${(Math.abs(sweep)/360).toFixed(2)}x`,c,c+r+24); } } }); }
  function renderTimeline()''',
    "editor preview playtest metrics",
    re.S,
)
editor_js = regex_once(
    editor_js,
    r'  async function addToLocalSongs\(\)\{.*?\n  \}\n\n  \$\("saveProject"\)',
    '''  async function addToLocalSongs(options={}){
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
    if(problems.length){ status.innerHTML=problems.map(e=>`<div class="err">${e}</div>`).join(""); return null; }
    try{
      const existing=await store.get(m.songId);
      if(existing && !confirm(`LOCAL SONGS에 ${m.songId}가 이미 있습니다. 현재 편집본으로 덮어쓸까요?`)) return null;
      const diffKey=difficultyKey();
      const record={ id:m.songId, source:"local", title:m.title, artist:m.artist, bpm:m.bpm, offset:m.offset, previewStart:m.previewStart, updatedAt:new Date().toISOString(), audioBlob:state.audioFile, audioType:state.audioFile.type, jacketBlob:state.jacketFile||null, jacketData:state.jacketData, difficulties:{ [diffKey]:{ label:m.difficulty||"CUSTOM", chart:`local:${m.songId}:${diffKey}`, stars:tools.calculateStars(chart) } }, charts:{ [diffKey]:chart } };
      await store.install(record,{expectedCurrent:{exists:Boolean(existing),...(existing||{})},keepBackup:true});
      state.localRecord=record;
      if(!options.playtest) status.innerHTML=`<div>No errors. LOCAL SONGS에 등록되었습니다. <a class="back" href="./index.html?tab=local&song=${encodeURIComponent(m.songId)}&chart=${encodeURIComponent(diffKey)}">SONG SELECT로 이동</a></div>`;
      return {record,diffKey};
    }catch(err){ status.innerHTML=`<div class="err">IndexedDB 저장 실패: ${err.message}</div>`; return null; }
  }
  async function openPlaytest(){
    if(!playtestApi){$("validation").innerHTML='<div class="err">PLAYTEST ERROR: runtime unavailable.</div>';return;}
    const button=$("playtestBtn"), panel=button?.closest(".playtestPanel"), old=button?.textContent||"";
    if(button){button.disabled=true;button.textContent="SAVING PLAYTEST…";} panel?.classList.add("isBusy");
    try{
      const saved=await addToLocalSongs({playtest:true});if(!saved)return;
      const settings=syncPlaytestUi({repaint:false,persist:true});
      playtestApi.beginSession({...settings,songId:saved.record.id,chartId:saved.diffKey});
      const url=new URL("./index.html",location.href);url.searchParams.set("tab","local");url.searchParams.set("song",saved.record.id);url.searchParams.set("chart",saved.diffKey);url.searchParams.set("editorPlaytest","1");location.href=url.href;
    }catch(error){$("validation").innerHTML=`<div class="err">PLAYTEST ERROR: ${error.message}</div>`;}
    finally{if(button){button.disabled=false;button.textContent=old;}panel?.classList.remove("isBusy");}
  }

  $("saveProject")''',
    "editor local save and playtest handoff",
    re.S,
)
editor_js = replace_once(
    editor_js,
    '  $("saveProject").onclick=saveLocal; $("addLocalSong").onclick=addToLocalSongs;',
    '  $("saveProject").onclick=saveLocal; $("addLocalSong").onclick=()=>addToLocalSongs(); $("playtestBtn").onclick=openPlaytest;',
    "editor playtest binding",
)
editor_js = replace_once(
    editor_js,
    '  openDb().then(()=>{ listProjects(); loadLocalSongFromQuery(); }); renderAll(); tick();',
    '  initializePlaytestControls(); openDb().then(()=>{ listProjects(); loadLocalSongFromQuery(); }); renderAll(); tick();',
    "editor playtest initialization",
)
write("src/editor.js", editor_js)


# game.js: only an exact, fresh editor session alters official runtime values.
game_js = read("src/game.js")
initial_params = '  const initialParams = new URLSearchParams(window.location.search);\n'
playtest_session = '''  const initialParams = new URLSearchParams(window.location.search);
  const editorPlaytestApi=window.CircleMixEditorPlaytest||null;
  const editorPlaytestSession=editorPlaytestApi?.readSession({search:window.location.search})||null;
  const EDITOR_PLAYTEST_JUDGEMENT_SCALE=editorPlaytestSession?.judgementScale||1;
  const EDITOR_PLAYTEST_HIT_RADIUS_SCALE=editorPlaytestSession?.hitRadiusScale||1;
  const EDITOR_PLAYTEST_NOTE_SCALE=editorPlaytestSession?.noteScale||1;
  window.CircleMixEditorPlaytestActive=editorPlaytestSession;
'''
game_js = replace_once(game_js, initial_params, playtest_session, "game editor playtest session")
game_js = replace_once(game_js, '  let APPROACH = 0.60;', '  let APPROACH = editorPlaytestSession?.approachSeconds||0.60;', "playtest approach")
game_js = replace_once(game_js, '  const HIT_WINDOW = 0.17;', '  const HIT_WINDOW = 0.17 * EDITOR_PLAYTEST_JUDGEMENT_SCALE;', "playtest timing window")
game_js = replace_once(game_js, '  const DIAL_ARC_HALF = Math.PI * 0.075;', '  const DIAL_ARC_HALF = Math.PI * 0.075 * EDITOR_PLAYTEST_JUDGEMENT_SCALE;', "playtest aim window")
for old,new,label in [
    ('    startToleranceDeg:30,','    startToleranceDeg:30*EDITOR_PLAYTEST_JUDGEMENT_SCALE,',"trace start tolerance"),
    ('    endpointGreatToleranceDeg:30,','    endpointGreatToleranceDeg:30*EDITOR_PLAYTEST_JUDGEMENT_SCALE,',"trace endpoint great"),
    ('    endpointPerfectToleranceDeg:15,','    endpointPerfectToleranceDeg:15*EDITOR_PLAYTEST_JUDGEMENT_SCALE,',"trace endpoint perfect"),
    ('    startGrace:.25,','    startGrace:.25*EDITOR_PLAYTEST_JUDGEMENT_SCALE,',"trace start grace"),
    ('    endpointWindow:.25,','    endpointWindow:.25*EDITOR_PLAYTEST_JUDGEMENT_SCALE,',"trace endpoint window"),
    ('    endpointGrace:.14,','    endpointGrace:.14*EDITOR_PLAYTEST_JUDGEMENT_SCALE,',"trace endpoint grace"),
    ('    angleExtra:.025,','    angleExtra:.025*EDITOR_PLAYTEST_JUDGEMENT_SCALE,',"slide aim tolerance"),
]:
    game_js = replace_once(game_js, old, new, label)
game_js = replace_once(
    game_js,
    '  const NOTE_WIDTHS = { cut:BASE_NOTE_WIDTH, slide:BASE_NOTE_WIDTH, scratch:BASE_NOTE_WIDTH, swing:BASE_NOTE_WIDTH, pulse:10, trace:3.0, hold:11.5 };',
    '  const NOTE_WIDTHS = { cut:BASE_NOTE_WIDTH*EDITOR_PLAYTEST_NOTE_SCALE, slide:BASE_NOTE_WIDTH*EDITOR_PLAYTEST_NOTE_SCALE, scratch:BASE_NOTE_WIDTH*EDITOR_PLAYTEST_NOTE_SCALE, swing:BASE_NOTE_WIDTH*EDITOR_PLAYTEST_NOTE_SCALE, pulse:10*EDITOR_PLAYTEST_NOTE_SCALE, trace:3.0*EDITOR_PLAYTEST_NOTE_SCALE, hold:11.5*EDITOR_PLAYTEST_NOTE_SCALE };',
    "playtest note scale",
)
hit_assignments = game_js.count('      hitR = baseR;') + game_js.count('    hitR = baseR;')
if hit_assignments != 2:
    raise SystemExit(f"playtest hit radius: expected two assignments, found {hit_assignments}")
game_js = game_js.replace('      hitR = baseR;', '      hitR = baseR * EDITOR_PLAYTEST_HIT_RADIUS_SCALE;', 1)
game_js = game_js.replace('    hitR = baseR;', '    hitR = baseR * EDITOR_PLAYTEST_HIT_RADIUS_SCALE;', 1)
install_marker = '''  installBrowserTestApi();
  if(window.CircleMixTestApi){'''
install_playtest = '''  installBrowserTestApi();
  if(editorPlaytestSession){
    document.body.classList.add("editorPlaytestMode");
    editorPlaytestApi?.mountBadge(editorPlaytestSession);
    Promise.resolve().then(()=>showSongSelect()).catch(error=>console.error("Editor playtest song select failed",error));
  }
  if(window.CircleMixTestApi){'''
game_js = replace_once(game_js, install_marker, install_playtest, "game editor playtest startup")
write("src/game.js", game_js)


# PWA and build wiring.
service_worker = read("service-worker.js")
service_worker = replace_once(service_worker, '  versioned("./src/editor.js"),', '  versioned("./src/editor-playtest.js"),\n  versioned("./src/editor.js"),', "service worker editor playtest cache")
write("service-worker.js", service_worker)

version = read("src/version.js")
version = regex_once(version, r'cacheRevision:\s*"[^"]+"', f'cacheRevision: "{REVISION}"', "cache revision")
write("src/version.js", version)

package_path = ROOT / "package.json"
package_data = json.loads(package_path.read_text(encoding="utf-8"))
test_script = package_data["scripts"]["test"]
if "node --check src/editor-playtest.js" not in test_script:
    test_script = test_script.replace("node --check src/editor.js", "node --check src/editor-playtest.js && node --check src/editor.js")
if "node tests/editor-playtest.test.js" not in test_script:
    test_script = test_script.replace("node tests/editor-feasibility.test.js", "node tests/editor-feasibility.test.js && node tests/editor-playtest.test.js")
package_data["scripts"]["test"] = test_script
browser_script = package_data["scripts"]["test:browser"]
if "node tests/editor-playtest-browser.test.js" not in browser_script:
    browser_script = browser_script.replace("node tests/editor-feasibility-browser.test.js", "node tests/editor-feasibility-browser.test.js && node tests/editor-playtest-browser.test.js")
package_data["scripts"]["test:browser"] = browser_script
package_path.write_text(json.dumps(package_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print("Applied editor direct playtest v1.")
