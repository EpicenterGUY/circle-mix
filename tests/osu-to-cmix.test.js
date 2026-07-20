'use strict';
const assert=require('assert'),lib=require('../scripts/osu-to-cmix-lib.js');
const fixture=(objects,extra='')=>Buffer.from(`osu file format v14\n\n[General]\nAudioFilename: song.wav\nMode: 0\nPreviewTime: 5000\n\n[Metadata]\nTitle: Test\nArtist: Artist\nCreator: Mapper\nVersion: Normal\n\n[Difficulty]\nApproachRate: 8\nSliderMultiplier: 1.4\n\n[TimingPoints]\n0,500,4,2,0,100,1,0\n${extra}\n\n[HitObjects]\n${objects.join('\n')}\n`);
let m=lib.parseOsu(fixture(['512,192,1000,1,0,0:0:0:0:','256,192,1000,1,0,0:0:0:0:']));let c=lib.convert(m,{});assert.equal(c.chart.notes[0].angle,0);assert.equal(c.chart.notes[1].angle,0);assert.ok(c.report.warnings.some(x=>x.code==='CENTER_ANGLE_FALLBACK'));
m=lib.parseOsu(fixture(['0,192,0,1,0,0:0:0:0:','0,192,0,1,0,0:0:0:0:','0,192,1000,2,0,L|256:0,1,20']));c=lib.convert(m,{});assert.ok(c.report.warnings.some(x=>x.code==='OVERLAPPING_CONVERTED_NOTES'));assert.equal(c.chart.notes[2].type,'slideCW');
m=lib.parseOsu(fixture(['256,192,1000,8,0,2000']));c=lib.convert(m,{spinnerMode:'scratch'});assert.equal(c.chart.notes[0].type,'scratchCW');assert.equal(lib.convert(m,{spinnerMode:'skip'}).chart.notes.length,0);
assert.throws(()=>lib.parseOsu(Buffer.from([255,254])));assert.equal(lib.safePath('../evil'),false);assert.equal(lib.angle(256,0),270);console.log('PASS osu-to-cmix');
