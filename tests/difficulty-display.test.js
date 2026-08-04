const assert=require("node:assert/strict"),fs=require("node:fs"),D=require("../src/chart-difficulty.js");
assert.equal(D.VERSION,"local-v6");
assert.equal(D.MAX_STARS,Infinity);
assert.ok(D.displayScale(20)>15,"automatic difficulty display must extend beyond 15 stars");
const game=fs.readFileSync("src/game.js","utf8");
for(const needle of ["function declaredDifficultyLevel","declaredLevel:declaredDifficultyLevel(songData,difficultyId)","function formatDifficultyView","LV ${level} · AUTO ${auto}"]){assert.ok(game.includes(needle),needle);}
assert.match(game,/return \{\.\.\.chartDifficulty\.calculate\(c\),declaredLevel:declaredDifficultyLevel\(selectedSong,mode\)\}/);
const powerStart=game.indexOf("function powerPreviewHtml");
const powerEnd=game.indexOf("function renderSongSelect",powerStart);
const powerBody=game.slice(powerStart,powerEnd);
assert.ok(powerBody.includes("const stars=Number(diff?.stars)"),"POWER preview must continue using automatic stars");
assert.ok(!powerBody.includes("declaredLevel"),"authored LEVEL must not affect POWER preview");
console.log("difficulty display separation tests passed");
