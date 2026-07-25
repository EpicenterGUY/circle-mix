/* Shared, data-only chart physical-feasibility analyzer. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CircleMixChartFeasibility=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  const VERSION='feasibility-v1';
  const SEVERITY_ORDER=Object.freeze({yellow:1,orange:2,red:3});
  const DEFAULTS=Object.freeze({
    simultaneousWindowSeconds:.018,
    sameAngleToleranceDeg:12,
    overlapAngleOrangeDeg:30,
    overlapAngleRedDeg:70,
    travelYellowDegPerSecond:900,
    travelOrangeDegPerSecond:1500,
    travelRedDegPerSecond:2400,
    rotationYellowDegPerSecond:950,
    rotationOrangeDegPerSecond:1500,
    rotationRedDegPerSecond:2200
  });
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const normalizeAngle=value=>((Number(value||0)%360)+360)%360;
  const signedAngleDelta=(from,to)=>((normalizeAngle(to)-normalizeAngle(from)+540)%360)-180;
  const angleDistance=(a,b)=>Math.abs(signedAngleDelta(a,b));
  const family=note=>{const type=String(note?.type||'cut').toLowerCase();return type==='fx'||type==='hold'?'hold':type.startsWith('slide')?'slide':type.startsWith('trace')?'trace':type.startsWith('swing')?'swing':type.startsWith('scratch')?'scratch':type==='pulse'?'pulse':'cut';};
  const aimed=note=>family(note)!=='pulse';
  const noteAngle=note=>normalizeAngle(note?.angle!==undefined?note.angle:Number(note?.directionIndex??note?.lane??0)*45);
  const directionSign=note=>String(note?.direction||note?.type||'').toUpperCase().includes('CCW')?-1:1;
  function degrees(value,preferRadians=false){const number=Number(value);if(!Number.isFinite(number))return null;return (preferRadians||Math.abs(number)>0&&Math.abs(number)<=Math.PI*4.2)?number*180/Math.PI:number;}
  function signedSweep(note){
    for(const key of ['signedSweepAngle','sweepAngle']) if(Number.isFinite(Number(note?.[key]))) return degrees(note[key]);
    for(const key of ['slideAmount','amount']) if(Number.isFinite(Number(note?.[key]))&&Number(note[key])!==0) return degrees(note[key],true);
    if(Number.isFinite(Number(note?.turns))&&Number(note.turns)!==0) return directionSign(note)*Math.abs(Number(note.turns))*360;
    if(note?.endAngle===undefined&&note?.endLane===undefined&&note?.endDirectionIndex===undefined)return 0;
    const end=normalizeAngle(note.endAngle!==undefined?note.endAngle:Number(note.endDirectionIndex??note.endLane??0)*45);
    return directionSign(note)*angleDistance(noteAngle(note),end);
  }
  function durationSeconds(note,secondsPerBeat){
    if(Number.isFinite(Number(note?.duration))&&Number(note.duration)>0)return Number(note.duration);
    if(Number.isFinite(Number(note?.durationBeat))&&Number(note.durationBeat)>0)return Number(note.durationBeat)*secondsPerBeat;
    return 0;
  }
  function endAngle(note){
    const type=family(note),start=noteAngle(note);
    if(type==='slide'||type==='trace'||type==='scratch')return normalizeAngle(start+signedSweep(note));
    if(note?.endAngle!==undefined)return normalizeAngle(note.endAngle);
    if(note?.endLane!==undefined||note?.endDirectionIndex!==undefined)return normalizeAngle(Number(note.endDirectionIndex??note.endLane??0)*45);
    return start;
  }
  function pathAngleAt(note,progress){return normalizeAngle(noteAngle(note)+signedSweep(note)*clamp(progress,0,1));}
  const severityLabel=severity=>severity==='red'?'RED':severity==='orange'?'ORANGE':'YELLOW';
  function analyze(chart,options={}){
    const settings={...DEFAULTS,...options};
    const bpm=Math.max(1,Number(chart?.bpm)||Number(options.bpm)||120),secondsPerBeat=60/bpm;
    const source=Array.isArray(chart?.notes)?chart.notes:[];
    const notes=source.map((note,index)=>{
      const beat=Number(note?.beat)||0,time=Number.isFinite(Number(note?.time))?Number(note.time):beat*secondsPerBeat,duration=durationSeconds(note,secondsPerBeat);
      return {note,index,beat,time,duration,endTime:time+duration,type:family(note),angle:aimed(note)?noteAngle(note):null,endAngle:aimed(note)?endAngle(note):null,sweep:signedSweep(note)};
    }).sort((a,b)=>a.time-b.time||a.index-b.index);
    const issues=[];
    const issueKeys=new Set();
    const add=(severity,code,message,items,metrics={})=>{
      const noteIndices=[...new Set(items.map(item=>typeof item==='number'?item:item.index))].sort((a,b)=>a-b);
      const key=`${code}:${noteIndices.join(',')}`;
      if(issueKeys.has(key))return;
      issueKeys.add(key);
      const first=items.find(item=>typeof item!=='number')||notes.find(item=>item.index===noteIndices[0]);
      issues.push({severity,code,message,noteIndices,beat:first?.beat??0,seconds:first?.time??0,metrics});
    };

    for(let start=0;start<notes.length;){
      let end=start+1;
      while(end<notes.length&&notes[end].time-notes[start].time<=settings.simultaneousWindowSeconds)end++;
      const group=notes.slice(start,end),aimNotes=group.filter(item=>item.type!=='pulse');
      if(aimNotes.length>1){
        const clusters=[];
        for(const item of aimNotes){const cluster=clusters.find(list=>list.some(other=>angleDistance(item.angle,other.angle)<=settings.sameAngleToleranceDeg));if(cluster)cluster.push(item);else clusters.push([item]);}
        if(clusters.length>1){
          let spread=0;for(let i=0;i<aimNotes.length;i++)for(let j=i+1;j<aimNotes.length;j++)spread=Math.max(spread,angleDistance(aimNotes[i].angle,aimNotes[j].angle));
          add('red','SIMULTANEOUS_SPLIT_AIM',`동시에 ${clusters.length}개의 서로 다른 에임 위치를 요구합니다.`,aimNotes,{angleSpreadDeg:Number(spread.toFixed(1)),windowSeconds:settings.simultaneousWindowSeconds});
        }else{
          const sustained=aimNotes.filter(item=>['hold','slide','trace'].includes(item.type));
          add(sustained.length?'orange':'yellow',sustained.length?'SIMULTANEOUS_ACTION_CONFLICT':'SIMULTANEOUS_STACK',sustained.length?'같은 위치에서 지속 입력과 다른 노트가 동시에 시작합니다.':'같은 위치에 여러 노트가 동시에 겹쳐 있습니다.',aimNotes,{count:aimNotes.length});
        }
      }
      start=end;
    }

    for(const item of notes){
      if(!['slide','trace','scratch'].includes(item.type)||item.duration<=0)continue;
      const travel=Math.abs(item.sweep),rate=travel/Math.max(.001,item.duration);
      let severity=null;
      if(rate>=settings.rotationRedDegPerSecond||(item.duration<=.09&&travel>=120))severity='red';
      else if(rate>=settings.rotationOrangeDegPerSecond)severity='orange';
      else if(rate>=settings.rotationYellowDegPerSecond)severity='yellow';
      if(severity)add(severity,'ROTATION_RATE',`${item.type.toUpperCase()} 회전 속도가 ${Math.round(rate)}°/s로 매우 빠릅니다.`,[item],{travelDeg:Number(travel.toFixed(1)),durationSeconds:Number(item.duration.toFixed(3)),rateDegPerSecond:Math.round(rate)});
    }

    for(const active of notes){
      if(!['hold','slide','trace'].includes(active.type)||active.duration<=.04)continue;
      for(const other of notes){
        if(other.index===active.index||other.type==='pulse'||other.time<=active.time+.015||other.time>=active.endTime-.015)continue;
        const progress=(other.time-active.time)/active.duration;
        const expected=active.type==='hold'?active.angle:pathAngleAt(active.note,progress);
        const delta=angleDistance(expected,other.angle);
        if(delta>=settings.overlapAngleRedDeg)add('red','SUSTAINED_AIM_CONFLICT',`${active.type.toUpperCase()} 진행 중 ${Math.round(delta)}° 떨어진 다른 에임 노트를 요구합니다.`,[active,other],{expectedAngleDeg:Number(expected.toFixed(1)),otherAngleDeg:Number(other.angle.toFixed(1)),angleDeltaDeg:Number(delta.toFixed(1)),progress:Number(progress.toFixed(3))});
        else if(delta>=settings.overlapAngleOrangeDeg)add('orange','SUSTAINED_AIM_CONFLICT',`${active.type.toUpperCase()} 진행 중 다른 에임 노트가 경로에서 ${Math.round(delta)}° 벗어납니다.`,[active,other],{expectedAngleDeg:Number(expected.toFixed(1)),otherAngleDeg:Number(other.angle.toFixed(1)),angleDeltaDeg:Number(delta.toFixed(1)),progress:Number(progress.toFixed(3))});
        else add('yellow','SUSTAINED_INPUT_OVERLAP',`${active.type.toUpperCase()} 지속 입력 중 다른 노트가 겹칩니다.`,[active,other],{angleDeltaDeg:Number(delta.toFixed(1)),progress:Number(progress.toFixed(3))});
      }
    }

    const aimNotes=notes.filter(item=>item.type!=='pulse');
    for(let index=1;index<aimNotes.length;index++){
      const previous=aimNotes[index-1],next=aimNotes[index];
      if(next.time-previous.time<=settings.simultaneousWindowSeconds)continue;
      const anchorTime=['hold','slide','trace'].includes(previous.type)?previous.endTime:previous.time;
      const anchorAngle=['hold','slide','trace'].includes(previous.type)?previous.endAngle:previous.angle;
      const gap=next.time-anchorTime;
      if(gap<=.001)continue;
      const travel=angleDistance(anchorAngle,next.angle),rate=travel/gap;
      let severity=null;
      if((gap<=.055&&travel>=100)||rate>=settings.travelRedDegPerSecond)severity='red';
      else if((gap<=.09&&travel>=100)||rate>=settings.travelOrangeDegPerSecond)severity='orange';
      else if((gap<=.13&&travel>=120)||rate>=settings.travelYellowDegPerSecond)severity='yellow';
      if(severity)add(severity,'AIM_TRAVEL',`${Math.round(travel)}° 에임 이동을 ${(gap*1000).toFixed(0)}ms 안에 요구합니다.`,[previous,next],{travelDeg:Number(travel.toFixed(1)),gapSeconds:Number(gap.toFixed(4)),rateDegPerSecond:Math.round(rate)});
    }

    for(let index=2;index<aimNotes.length;index++){
      const a=aimNotes[index-2],b=aimNotes[index-1],c=aimNotes[index];
      if(b.time-a.time<=settings.simultaneousWindowSeconds||c.time-b.time<=settings.simultaneousWindowSeconds)continue;
      const first=signedAngleDelta(a.angle,b.angle),second=signedAngleDelta(b.angle,c.angle),window=c.time-a.time;
      if(Math.sign(first)===Math.sign(second)||Math.abs(first)<45||Math.abs(second)<45||window>.32)continue;
      let severity='yellow';
      if(window<=.14&&Math.min(Math.abs(first),Math.abs(second))>=90)severity='red';
      else if(window<=.22)severity='orange';
      add(severity,'RAPID_REVERSAL',`${Math.round(Math.abs(first))}° 이동 직후 반대 방향으로 ${Math.round(Math.abs(second))}° 급반전합니다.`,[a,b,c],{firstTravelDeg:Number(Math.abs(first).toFixed(1)),secondTravelDeg:Number(Math.abs(second).toFixed(1)),windowSeconds:Number(window.toFixed(4))});
    }

    issues.sort((a,b)=>SEVERITY_ORDER[b.severity]-SEVERITY_ORDER[a.severity]||a.seconds-b.seconds||a.code.localeCompare(b.code));
    const summary={yellow:0,orange:0,red:0,total:issues.length};
    for(const item of issues)summary[item.severity]++;
    const highestByNote={};
    for(const item of issues)for(const index of item.noteIndices){const current=highestByNote[index];if(!current||SEVERITY_ORDER[item.severity]>SEVERITY_ORDER[current])highestByNote[index]=item.severity;}
    return {version:VERSION,ok:summary.red===0,issues,summary,highestByNote,settings:{...settings},bpm};
  }
  return Object.freeze({VERSION,SEVERITY_ORDER,DEFAULTS,analyze,normalizeAngle,signedAngleDelta,angleDistance,family,signedSweep,pathAngleAt,severityLabel});
});
