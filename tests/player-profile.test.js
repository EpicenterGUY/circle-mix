'use strict';

const assert=require('node:assert/strict');
const profile=require('../src/player-profile.js');

const player=profile.normalizePlay({
  source:'local',songId:'song-a',chartId:'expert',songTitle:'SONG A',artist:'ARTIST',difficultyLabel:'EXPERT',starLevel:'7.2★',
  score:987654,power:4321,rank:'ss',accuracyRatio:98.75,perfectCount:99,greatCount:1,missCount:0,maxCombo:100,totalNotes:100,autoPlay:false,
  playedAt:'2026-07-22T00:00:00.000Z',appVersion:'0.9.30'
});
assert.equal(player.songKey,'local:song-a');
assert.equal(player.chartKey,'local:song-a:expert');
assert.equal(player.accuracyRatio,0.9875);
assert.equal(player.fullCombo,true);
assert.equal(player.power,4321);

const auto=profile.normalizePlay({...player,autoPlay:true,power:9999});
assert.equal(auto.power,null);
assert.equal(auto.fullCombo,false);

const summary=profile.aggregatePlays([
  player,
  {...player,score:900000,power:4000,accuracyRatio:0.95,missCount:1,fullCombo:false,playedAt:'2026-07-22T00:01:00.000Z'},
  {...player,source:'builtin',songId:'anima',chartId:'normal',songKey:'builtin:anima',chartKey:'builtin:anima:normal',score:700000,power:3000,accuracyRatio:0.8,missCount:2,fullCombo:false,playedAt:'2026-07-22T00:02:00.000Z'},
  auto
]);
assert.equal(summary.playCount,3,'AUTO plays must not enter profile statistics');
assert.equal(summary.fullComboCount,1);
assert.equal(summary.fullComboPlayCount,1);
assert.equal(summary.chartCount,2);
assert.equal(summary.bestScore,987654);
assert.equal(summary.bestPower,4321);
assert.equal(summary.bestByChart['local:song-a:expert'].score,987654);
assert.ok(Math.abs(summary.averageAccuracy-(0.9875+0.95+0.8)/3)<1e-10);

const repeatedFullCombo=profile.aggregatePlays([player,{...player,score:980000,playedAt:'2026-07-22T00:03:00.000Z'}]);
assert.equal(repeatedFullCombo.playCount,2);
assert.equal(repeatedFullCombo.fullComboCount,1,'repeated FCs on one chart count as one FC chart');
assert.equal(repeatedFullCombo.fullComboPlayCount,2);

console.log('player profile tests passed');
