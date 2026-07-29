"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const api=require("../src/editor-playtest.js");
class MemoryStorage{constructor(){this.map=new Map();}getItem(k){return this.map.has(k)?this.map.get(k):null;}setItem(k,v){this.map.set(k,String(v));}removeItem(k){this.map.delete(k);}}

test("editor playtest settings sanitize and persist",()=>{
  const storage=new MemoryStorage();
  const saved=api.savePreferences({judgementPreset:"lenient",hitRadiusScale:9,noteScale:.2,approachSeconds:.1},storage);
  assert.deepEqual(saved,{judgementPreset:"LENIENT",judgementScale:1.18,hitRadiusScale:1.15,noteScale:.8,approachSeconds:.34});
  assert.deepEqual(api.loadPreferences(storage),saved);
  const metrics=api.previewMetrics(saved,560);
  assert.equal(Number(metrics.ringRadius.toFixed(1)),225.4);
  assert.equal(metrics.noteRadius,6.4);
});

test("editor playtest session requires the exact local song and chart",()=>{
  const storage=new MemoryStorage(), now=1_000_000;
  const session=api.beginSession({songId:"song-a",chartId:"hard",judgementPreset:"STRICT",hitRadiusScale:.9,noteScale:1.2,approachSeconds:.8},storage,now);
  assert.equal(session.judgementScale,.82);
  const active=api.readSession({storage,search:"?tab=local&song=song-a&chart=hard&editorPlaytest=1",now:now+500});
  assert.equal(active.songId,"song-a");
  assert.equal(active.noteScale,1.2);
  assert.equal(api.readSession({storage,search:"?tab=local&song=song-a&chart=normal&editorPlaytest=1",now:now+500}),null);
  assert.equal(api.readSession({storage,search:"?tab=local&song=song-a&chart=hard",now:now+500}),null);
  assert.equal(api.readSession({storage,search:"?tab=local&song=song-a&chart=hard&editorPlaytest=1",now:now+api.SESSION_MAX_AGE_MS+1}),null);
});

test("editor playtest save preserves sibling LOCAL difficulties",()=>{
  const existing={id:"song",difficultyOrder:["easy","hard"],difficulties:{easy:{stars:2},hard:{stars:8}},charts:{easy:{notes:[1]},hard:{notes:[2]}}};
  const incoming={id:"song",difficultyOrder:["hard"],difficulties:{hard:{stars:9}},charts:{hard:{notes:[3]}}};
  const merged=api.mergeLocalDifficulty(existing,incoming,"hard");
  assert.deepEqual(merged.difficultyOrder,["easy","hard"]);
  assert.equal(merged.difficulties.easy.stars,2);
  assert.equal(merged.difficulties.hard.stars,9);
  assert.deepEqual(merged.charts.easy.notes,[1]);
});

test("editor playtest is wired into editor, game, offline shell and packages",()=>{
  const editor=fs.readFileSync("editor.html","utf8"), editorJs=fs.readFileSync("src/editor.js","utf8"), game=fs.readFileSync("src/game.js","utf8"), index=fs.readFileSync("index.html","utf8"), sw=fs.readFileSync("service-worker.js","utf8"), pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
  assert.match(editor,/id="playtestBtn"/);
  assert.match(editor,/src="\.\/src\/editor-playtest\.js/);
  assert.match(editorJs,/beginSession\(/);
  assert.match(editorJs,/mergeLocalDifficulty\(existing,incoming,diffKey\)/);
  assert.match(editorJs,/searchParams\.set\("editorPlaytest","1"\)/);
  assert.match(game,/editorPlaytestSession/);
  assert.match(game,/EDITOR_PLAYTEST_JUDGEMENT_SCALE/);
  assert.match(game,/hitR = baseR \* EDITOR_PLAYTEST_HIT_RADIUS_SCALE/);
  assert.match(game,/const recordInfo=editorPlaytestSession \? \{playtest:true/);
  assert.match(game,/if\(!editorPlaytestSession\)\{ try\{ localStorage\.setItem\("circleMixPlayCount\.v1"/);
  assert.match(game,/EDITOR PLAYTEST · RECORD NOT SAVED/);
  assert.match(game,/PLAYTEST RESULT · OFFICIAL RECORDS UNCHANGED/);
  assert.match(index,/editor-playtest\.js[\s\S]*game\.js/);
  assert.match(sw,/src\/editor-playtest\.js/);
  assert.ok(pkg.scripts.test.includes("tests/editor-playtest.test.js"));
  assert.ok(pkg.scripts["test:browser"].includes("tests/editor-playtest-browser.test.js"));
});
