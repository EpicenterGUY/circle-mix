"use strict";
const assert=require("node:assert/strict");
const Power=require("../src/power");

const perfect=Power.calculatePower({stars:5,accuracyRatio:1,comboRatio:1,missCount:0,totalNotes:100});
assert.equal(perfect,Math.round(Math.pow(5,2.15)*18));
assert.equal(Power.calculatePower({stars:5,accuracyRatio:1,comboRatio:1,missCount:0,totalNotes:0}),null);
assert(Power.calculatePower({stars:5,accuracyRatio:.99,comboRatio:1,missCount:0,totalNotes:100})<perfect);
assert(Power.calculatePower({stars:5,accuracyRatio:1,comboRatio:1,missCount:1,totalNotes:100})<perfect);

const preview=Power.previewForStars(7);
assert.deepEqual(preview.map(item=>item.accuracyPercent),[90,95,97,99,100]);
assert.equal(preview.length,5);
assert(preview.every((item,index)=>index===0||item.power>preview[index-1].power));
assert.equal(preview.at(-1).power,Power.calculatePower({stars:7,accuracyRatio:1,comboRatio:1,missCount:0,totalNotes:1}));
console.log("power preview model tests passed");
