/* Shared, data-only LOCAL chart difficulty estimator. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CircleMixChartDifficulty=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  const VERSION='local-v3',TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const angle=n=>((Number(n?.angle??((n?.directionIndex??n?.lane??0)*45))%360)+360)%360;
  const signedDistance=(a,b)=>((b-a+540)%360)-180;
  const distance=(a,b)=>Math.abs(signedDistance(a,b));
  const family=n=>{const t=String(n?.type||'cut').toLowerCase();return t==='fx'||t==='hold'?'hold':t.startsWith('slide')?'slide':t.startsWith('trace')?'trace':t.startsWith('swing')?'swing':t.startsWith('scratch')?'scratch':'cut';};
  const duration=(n,spb)=>Math.max(.08,Number(n.duration)||Number(n.durationBeat)*spb||spb*.5);
  const sign=n=>String(n?.direction||n?.type||'').toUpperCase().includes('CCW')?-1:1;
  function degrees(value,preferRadians=false){const v=Number(value);if(!Number.isFinite(v))return null;return (preferRadians||Math.abs(v)>0&&Math.abs(v)<=TAU*2.1)?v*180/Math.PI:v;}
  function signedSweep(n){
    for(const key of ['signedSweepAngle','sweepAngle']) if(Number.isFinite(Number(n?.[key]))) return degrees(n[key]);
    for(const key of ['slideAmount','amount']) if(Number.isFinite(Number(n?.[key]))&&Number(n[key])!==0) return degrees(n[key],true);
    if(Number.isFinite(Number(n?.turns))&&Number(n.turns)!==0)return sign(n)*Math.abs(Number(n.turns))*360;
    if(n?.endAngle===undefined)return 0;
    return sign(n)*distance(angle(n),Number(n.endAngle));
  }
  const percentile=(values,p)=>{if(!values.length)return 0;const v=values.slice().sort((x,y)=>x-y),i=(v.length-1)*p,l=Math.floor(i),h=Math.ceil(i);return v[l]+(v[h]-v[l])*(i-l);};
  function rotationTransitions(notes){const out=[];for(let i=1;i<notes.length;i++){const gap=notes[i].time-notes[i-1].time;if(gap<.03)continue;const delta=signedDistance(angle(notes[i-1]),angle(notes[i]));if(Math.abs(delta)<8||Math.abs(delta)>=179.999)continue;out.push({time:notes[i].time,delta,travel:Math.abs(delta)});}return out;}
  function rotationWindowStrains(transitions,seconds){const out=[];let end=0,signed=0,total=0;for(let start=0;start<transitions.length;start++){if(end<start){end=start;signed=0;total=0;}const limit=transitions[start].time+seconds;while(end<transitions.length&&transitions[end].time<limit){signed+=transitions[end].delta;total+=transitions[end].travel;end++;}const continuity=total?Math.abs(signed)/total:0,turns=total/360;out.push(clamp(turns*(.12+.88*Math.pow(continuity,1.7)),0,seconds===2?3.5:8));signed-=transitions[start].delta;total-=transitions[start].travel;}return out;}
  function calculate(chart,options={}){
    const bpm=Number(chart?.bpm)||Number(options.bpm)||120,spb=60/bpm;
    const notes=(Array.isArray(chart?.notes)?chart.notes:[]).map(n=>({...n,time:(Number(n.beat)||0)*spb})).sort((a,b)=>a.time-b.time);
    const emptyComponents={density:0,speed:0,aim:0,rotation:0,rotationChain:0,rotationChain2:0,rotationChain5:0,overlap:0,complexity:0};
    if(!notes.length)return {stars:1,raw:0,version:VERSION,components:emptyComponents};
    const base={cut:1,hold:1.18,slide:1.32,trace:.78,swing:1.36,scratch:1.42};let raw=0,aim=0,rotation=0,overlap=0,complexity=0,previous=null,burdens=[];
    for(const note of notes){const type=family(note),seconds=duration(note,spb);let burden=base[type]||1;
      if(previous){const gap=Math.max(.045,note.time-previous.time),move=distance(angle(note),angle(previous))/180,velocity=move/Math.max(.12,gap),transition=type!==family(previous)?clamp((.6-gap)/.6,0,1)*.34:0;aim+=clamp(velocity,0,3)*.34;complexity+=transition;burden+=clamp((.52-gap)/.52,0,1)*.58+clamp(velocity,0,2.5)*.24+transition;}
      if(['slide','trace','scratch'].includes(type)){const travel=Math.abs(signedSweep(note)),rot=clamp(travel/360*(.23+.34/Math.sqrt(Math.max(.12,seconds))),0,1.15);rotation+=rot;burden+=rot;}
      if(['hold','slide','trace'].includes(type)){const count=notes.filter(other=>other!==note&&other.time>note.time+.025&&other.time<note.time+seconds-.025).length,value=clamp(count*.24,0,.9);overlap+=value;burden+=value;}
      raw+=burden;burdens.push({time:note.time,value:burden});previous=note;
    }
    const songSeconds=Math.max(1,notes.at(-1).time-notes[0].time),rate=raw/songSeconds,windows=seconds=>notes.map(note=>burdens.filter(item=>item.time>=note.time&&item.time<note.time+seconds).reduce((sum,item)=>sum+item.value,0)/seconds),peak2=percentile(windows(2),.94),peak5=percentile(windows(5),.90),sustained=Math.max(0,peak5-rate);
    const transitions=rotationTransitions(notes),chain2=percentile(rotationWindowStrains(transitions,2),.90),chain5=percentile(rotationWindowStrains(transitions,5),.90),rotationChain=clamp(.65*Math.pow(chain2,1.15)+1.05*Math.pow(chain5,1.22),0,3.6);
    const components={density:rate,speed:peak2,aim:aim/songSeconds,rotation:rotation/songSeconds,rotationChain,rotationChain2:chain2,rotationChain5:chain5,overlap:overlap/songSeconds,complexity:complexity/songSeconds};
    const normalized=1+Math.sqrt(rate)*.18+Math.sqrt(peak2)*.28+Math.sqrt(peak5)*.22+Math.sqrt(sustained)*.14+components.aim*.06+components.rotation*.22+rotationChain+components.overlap*.16+components.complexity*.12;
    return {stars:Math.round(clamp(normalized,1,10)*10)/10,raw:Math.round(raw*100)/100,version:VERSION,components};
  }
  return Object.freeze({VERSION,calculate,signedSweep,family,rotationTransitions,rotationWindowStrains});
});
