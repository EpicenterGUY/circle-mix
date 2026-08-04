/* Shared, data-only LOCAL chart difficulty estimator. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CircleMixChartDifficulty=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  const VERSION='local-v6',MAX_STARS=Number.POSITIVE_INFINITY,TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const angle=n=>((Number(n?.angle??((n?.directionIndex??n?.lane??0)*45))%360)+360)%360;
  const signedDistance=(a,b)=>((b-a+540)%360)-180;
  const distance=(a,b)=>Math.abs(signedDistance(a,b));
  const family=n=>{const t=String(n?.type||'cut').toLowerCase();return t==='fx'||t==='hold'?'hold':t.startsWith('slide')?'slide':t.startsWith('trace')?'trace':t.startsWith('swing')?'swing':t.startsWith('scratch')?'scratch':t==='pulse'?'pulse':'cut';};
  const duration=(n,spb)=>Math.max(.08,Number(n.duration)||Number(n.durationBeat)*spb||spb*.5);
  const sign=n=>String(n?.direction||n?.type||'').toUpperCase().includes('CCW')?-1:1;
  function degrees(value,asRadians=false){const v=Number(value);if(!Number.isFinite(v))return null;return asRadians?v*180/Math.PI:v;}
  function signedSweep(n){
    for(const key of ['signedSweepAngle','sweepAngle']) if(Number.isFinite(Number(n?.[key]))) return degrees(n[key]);
    for(const key of ['slideAmount','amount']) if(Number.isFinite(Number(n?.[key]))&&Number(n[key])!==0) return degrees(n[key],true);
    if(Number.isFinite(Number(n?.turns))&&Number(n.turns)!==0)return sign(n)*Math.abs(Number(n.turns))*360;
    if(n?.endAngle===undefined)return 0;
    return sign(n)*distance(angle(n),Number(n.endAngle));
  }
  const upperMean=(values,ratio=.82)=>{if(!values.length)return 0;let max=-Infinity;for(const value of values)if(value>max)max=value;const floor=max*ratio,upper=values.filter(value=>value>=floor),mean=upper.reduce((sum,value)=>sum+value,0)/upper.length;return max*.62+mean*.38;};
  function localRates(items,seconds){if(!items.length)return [];const sorted=items.slice().sort((a,b)=>a.time-b.time),out=[];let end=0,sum=0;for(let start=0;start<sorted.length;start++){if(end<start){end=start;sum=0;}const limit=sorted[start].time+seconds;while(end<sorted.length&&sorted[end].time<limit){sum+=sorted[end].value;end++;}out.push(sum/seconds);sum-=sorted[start].value;}return out;}
  function localPeak(items,seconds,ratio=.82){return upperMean(localRates(items,seconds),ratio);}
  function rotationTransitions(notes){const out=[];for(let i=1;i<notes.length;i++){const gap=notes[i].time-notes[i-1].time;if(gap<.03||gap>.75)continue;const delta=signedDistance(angle(notes[i-1]),angle(notes[i]));if(Math.abs(delta)<8||Math.abs(delta)>=179.999)continue;out.push({time:notes[i].time,delta,travel:Math.abs(delta)});}return out;}
  function rotationWindowStrains(transitions,seconds){const out=[];let end=0,signed=0,total=0;for(let start=0;start<transitions.length;start++){if(end<start){end=start;signed=0;total=0;}const limit=transitions[start].time+seconds;while(end<transitions.length&&transitions[end].time<limit){signed+=transitions[end].delta;total+=transitions[end].travel;end++;}const continuity=total?Math.abs(signed)/total:0,turns=total/360;out.push(clamp(turns*(.12+.88*Math.pow(continuity,1.7)),0,seconds===2?5.5:12));signed-=transitions[start].delta;total-=transitions[start].travel;}return out;}
  function displayScale(value){
    const v=Math.max(1,Number(value)||1);
    if(v<=2)return 1+(v-1)*.55;
    if(v<=4)return 1.55+(v-2)*.65;
    if(v<=8)return 2.85+(v-4)*.88;
    if(v<=11)return 6.37+(v-8)*1.35;
    return 10.42+(v-11)*1.40;
  }
  function calculate(chart,options={}){
    const bpm=Number(chart?.bpm)||Number(options.bpm)||120,spb=60/bpm;
    const notes=(Array.isArray(chart?.notes)?chart.notes:[]).map(n=>({...n,time:(Number(n.beat)||0)*spb})).sort((a,b)=>a.time-b.time);
    const emptyComponents={density:0,speed:0,sustain:0,aim:0,rotation:0,rotationChain:0,rotationChain2:0,rotationChain5:0,overlap:0,pulseOverlap:0,complexity:0};
    if(!notes.length)return {stars:1,raw:0,version:VERSION,components:emptyComponents};
    const base={cut:1,hold:1.18,slide:1.32,trace:.78,swing:1.36,scratch:1.42,pulse:1.12};let raw=0,previous=null,previousAimed=null;
    const burdens=[],aimEvents=[],rotationEvents=[],overlapEvents=[],pulseEvents=[],complexityEvents=[];
    for(const note of notes){const type=family(note),seconds=duration(note,spb);let burden=base[type]||1;
      if(previous){const gap=Math.max(.045,note.time-previous.time),transition=type!==family(previous)?clamp((.6-gap)/.6,0,1)*.34:0;complexityEvents.push({time:note.time,value:transition});burden+=clamp((.52-gap)/.52,0,1)*.58+transition;}
      if(type!=='pulse'&&previousAimed){const gap=Math.max(.045,note.time-previousAimed.time),move=distance(angle(note),angle(previousAimed))/180,velocity=move/Math.max(.12,gap),value=clamp(velocity,0,3)*.34;aimEvents.push({time:note.time,value});burden+=clamp(velocity,0,2.5)*.24;}
      if(['slide','trace','scratch'].includes(type)){const travel=Math.abs(signedSweep(note)),value=clamp(travel/360*(.23+.34/Math.sqrt(Math.max(.12,seconds))),0,1.8);rotationEvents.push({time:note.time,value});burden+=value;}
      if(['hold','slide','trace'].includes(type)){const count=notes.filter(other=>other!==note&&other.time>note.time+.025&&other.time<note.time+seconds-.025).length,value=clamp(count*.24,0,1.2);overlapEvents.push({time:note.time,value});burden+=value;}
      if(type==='pulse'){const simultaneous=notes.some(other=>other!==note&&family(other)!=='pulse'&&Math.abs(other.time-note.time)<.001);if(simultaneous){pulseEvents.push({time:note.time,value:.42});burden+=.42;}}
      raw+=burden;burdens.push({time:note.time,value:burden});previous=note;if(type!=='pulse')previousAimed=note;
    }
    const peak2=localPeak(burdens,2,.82),peak5=localPeak(burdens,5,.82),peak8=localPeak(burdens,8,.82),sustain=Math.max(0,peak5*.72+peak8*.28-peak2*.42);
    const transitions=rotationTransitions(notes),chain2=upperMean(rotationWindowStrains(transitions,2),.82),chain5=upperMean(rotationWindowStrains(transitions,5),.82),rotationChain=clamp(.72*Math.pow(chain2,1.18)+1.10*Math.pow(chain5,1.24),0,6.5);
    const components={density:peak5,speed:peak2,sustain,aim:localPeak(aimEvents,2,.82),rotation:localPeak(rotationEvents,2,.82),rotationChain,rotationChain2:chain2,rotationChain5:chain5,overlap:localPeak(overlapEvents,2,.82),pulseOverlap:localPeak(pulseEvents,2,.82),complexity:localPeak(complexityEvents,2,.82)};
    const burst=Math.max(0,components.speed-8)*.035;
    const core=1+Math.sqrt(components.density)*.32+Math.sqrt(components.speed)*.32+Math.sqrt(sustain)*.12+components.aim*.08+components.rotation*.24+rotationChain*.90+components.overlap*.16+components.pulseOverlap*.24+components.complexity*.12+burst;
    const perceived=core<=8?core:8+Math.pow(core-8,1.20)*1.12;
    const scaled=displayScale(perceived);
    return {stars:Math.round(Math.max(1,scaled)*10)/10,raw:Math.round(raw*100)/100,version:VERSION,components};
  }
  return Object.freeze({VERSION,MAX_STARS,calculate,displayScale,signedSweep,family,localRates,localPeak,upperMean,rotationTransitions,rotationWindowStrains});
});
