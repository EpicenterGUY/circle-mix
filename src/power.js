/* Shared CIRCLE MIX POWER model and song-select forecast helpers. */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.CircleMixPower=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";
  const VERSION="power-v1";
  const ACCURACY_STEPS=Object.freeze([0.90,0.95,0.97,0.99,1.00]);
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  function calculatePower({stars,accuracyRatio,comboRatio,missCount,totalNotes}={}){
    const starValue=Number(stars);
    const noteCount=Number(totalNotes);
    if(!Number.isFinite(starValue)||starValue<=0||!Number.isFinite(noteCount)||noteCount<=0)return null;
    const accuracy=clamp(Number.isFinite(accuracyRatio)?accuracyRatio:0,0,1);
    const combo=clamp(Number.isFinite(comboRatio)?comboRatio:0,0,1);
    const misses=Math.max(0,Number.isFinite(missCount)?Math.trunc(missCount):0);
    const missPenalty=Math.pow(0.97,misses);
    const power=Math.pow(starValue,2.15)*18*Math.pow(accuracy,2.4)*(0.75+0.25*combo)*missPenalty;
    if(!Number.isFinite(power))return null;
    return Math.max(0,Math.round(power));
  }
  function previewForStars(stars,accuracies=ACCURACY_STEPS){
    const steps=Array.isArray(accuracies)?accuracies:ACCURACY_STEPS;
    return steps.map(value=>{
      const accuracy=clamp(Number(value)||0,0,1);
      return Object.freeze({accuracyRatio:accuracy,accuracyPercent:Math.round(accuracy*100),power:calculatePower({stars,accuracyRatio:accuracy,comboRatio:1,missCount:0,totalNotes:1})});
    });
  }
  return Object.freeze({VERSION,ACCURACY_STEPS,calculatePower,previewForStars});
});
