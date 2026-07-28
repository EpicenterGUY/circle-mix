from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def replace_once(text,old,new,label):
    count=text.count(old)
    if count!=1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old,new,1)

path=ROOT/"src/game.js"
source=path.read_text(encoding="utf-8")
source=replace_once(
    source,
    '''    if(resultPower) resultPower.textContent=result.autoPlay ? "AUTO — NO POWER" : (result.power !== null ? `POWER ${result.power}` : "POWER ---");
    if(resultAuto) resultAuto.textContent=result.autoPlay ? "AUTO PLAY RESULT" : "PLAYER RESULT";
    if(resultNewRecord) resultNewRecord.textContent=recordInfo?.newPowerRecord ? "NEW POWER RECORD" : (recordInfo?.newRecord ? "NEW RECORD" : "");
    if(resultBest){
      const best=recordInfo?.newRecord ? {bestScore:result.finalScore,bestRank:result.rank,bestAccuracy:result.accuracyRatio,bestPower:recordInfo?.newPowerRecord ? result.power : recordInfo?.previous?.bestPower} : (recordInfo?.newPowerRecord ? {...(recordInfo?.previous||{}), bestPower:result.power} : recordInfo?.previous);
      resultBest.textContent=best ? `BEST SCORE ${String(best.bestScore || 0).padStart(7,"0")} / POWER ${Number.isFinite(best.bestPower) ? best.bestPower : "---"} / ${best.bestRank || "---"} / ${Number.isFinite(best.bestAccuracy) ? (best.bestAccuracy*100).toFixed(2)+"%" : "---"}` : (result.autoPlay ? "AUTO PLAY is not saved" : "NO RECORD");
    }
    if(resultOverlay){ resultOverlay.classList.toggle("newRecord", !!(recordInfo?.newRecord || recordInfo?.newPowerRecord)); resultOverlay.classList.add("show"); }
''',
    '''    if(resultPower) resultPower.textContent=editorPlaytestSession ? "PLAYTEST — NO POWER" : (result.autoPlay ? "AUTO — NO POWER" : (result.power !== null ? `POWER ${result.power}` : "POWER ---"));
    if(resultAuto) resultAuto.textContent=editorPlaytestSession ? "EDITOR PLAYTEST · RECORD NOT SAVED" : (result.autoPlay ? "AUTO PLAY RESULT" : "PLAYER RESULT");
    if(resultNewRecord) resultNewRecord.textContent=editorPlaytestSession ? "" : (recordInfo?.newPowerRecord ? "NEW POWER RECORD" : (recordInfo?.newRecord ? "NEW RECORD" : ""));
    if(resultBest){
      if(editorPlaytestSession) resultBest.textContent="PLAYTEST RESULT · OFFICIAL RECORDS UNCHANGED";
      else{
        const best=recordInfo?.newRecord ? {bestScore:result.finalScore,bestRank:result.rank,bestAccuracy:result.accuracyRatio,bestPower:recordInfo?.newPowerRecord ? result.power : recordInfo?.previous?.bestPower} : (recordInfo?.newPowerRecord ? {...(recordInfo?.previous||{}), bestPower:result.power} : recordInfo?.previous);
        resultBest.textContent=best ? `BEST SCORE ${String(best.bestScore || 0).padStart(7,"0")} / POWER ${Number.isFinite(best.bestPower) ? best.bestPower : "---"} / ${best.bestRank || "---"} / ${Number.isFinite(best.bestAccuracy) ? (best.bestAccuracy*100).toFixed(2)+"%" : "---"}` : (result.autoPlay ? "AUTO PLAY is not saved" : "NO RECORD");
      }
    }
    if(resultOverlay){ resultOverlay.classList.toggle("newRecord", !editorPlaytestSession && !!(recordInfo?.newRecord || recordInfo?.newPowerRecord)); resultOverlay.classList.add("show"); }
''',
    "playtest result labels",
)
source=replace_once(
    source,
    '''    const recordInfo=saveBestRecord(result);
    showResult(result, recordInfo);
    try{ localStorage.setItem("circleMixPlayCount.v1", String(Number(localStorage.getItem("circleMixPlayCount.v1")||0)+1)); }catch(e){}
''',
    '''    const recordInfo=editorPlaytestSession ? {playtest:true,newRecord:false,newPowerRecord:false,previous:null} : saveBestRecord(result);
    showResult(result, recordInfo);
    if(!editorPlaytestSession){ try{ localStorage.setItem("circleMixPlayCount.v1", String(Number(localStorage.getItem("circleMixPlayCount.v1")||0)+1)); }catch(e){} }
''',
    "playtest record guard",
)
path.write_text(source,encoding="utf-8")

test_path=ROOT/"tests/editor-playtest.test.js"
tests=test_path.read_text(encoding="utf-8")
needle='''  assert.match(game,/hitR = baseR \\* EDITOR_PLAYTEST_HIT_RADIUS_SCALE/);
'''
replacement='''  assert.match(game,/hitR = baseR \\* EDITOR_PLAYTEST_HIT_RADIUS_SCALE/);
  assert.match(game,/const recordInfo=editorPlaytestSession \\? \\{playtest:true/);
  assert.match(game,/if\\(!editorPlaytestSession\\)\\{ try\\{ localStorage\\.setItem\\("circleMixPlayCount\\.v1"/);
  assert.match(game,/EDITOR PLAYTEST · RECORD NOT SAVED/);
  assert.match(game,/PLAYTEST RESULT · OFFICIAL RECORDS UNCHANGED/);
'''
tests=replace_once(tests,needle,replacement,"record isolation assertions")
test_path.write_text(tests,encoding="utf-8")
print("Applied editor playtest record isolation.")
