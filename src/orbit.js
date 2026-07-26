(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.CircleMixOrbit=api;if(root.document)api.mount(root.document);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TAU=Math.PI*2;
  const BPM=210;
  const SPB=60/BPM;
  const BEATS_PER_TURN=8;
  const DEG_PER_BEAT=360/BEATS_PER_TURN;
  const PERFECT_WINDOW=.065;
  const GREAT_WINDOW=.135;
  const RING_FACTORS=Object.freeze([.72,1,1.28]);
  const DRAW_HOLD_BEATS=8;
  const ORBIT_TYPES=Object.freeze(['dot','hold','ribbon','stack','bloom','flipCW','flipCCW','roll','pulse']);
  const TYPE_ALIASES=Object.freeze({tap:'dot',arc:'ribbon'});
  const normDeg=v=>((Number(v)%360)+360)%360;
  const shortestDeg=(a,b)=>Math.abs(((normDeg(a)-normDeg(b)+540)%360)-180);
  const directionForType=type=>type==='flipCCW'?-1:(type==='flipCW'?1:0);
  const canonicalType=type=>TYPE_ALIASES[String(type||'')]||String(type||'dot');
  const clampRing=value=>Math.max(0,Math.min(RING_FACTORS.length-1,Math.round(Number(value)||0)));
  const ringRadiusFor=(baseRadius,ring)=>Number(baseRadius)*RING_FACTORS[clampRing(ring)];

  function normalizeStackRings(value,fallback=1){
    const source=Array.isArray(value)&&value.length?value:[fallback];
    return [...new Set(source.map(clampRing))].sort((a,b)=>a-b);
  }

  function buildRibbonPoints(entry,{angle,direction,hitTime,durationBeat,degreesPerBeat}){
    const fallbackEnd=entry.endRing===undefined?entry.ring:entry.endRing;
    const source=Array.isArray(entry.points)&&entry.points.length>=2?entry.points:[
      {beatOffset:0,ring:entry.ring},
      {beatOffset:durationBeat,ring:fallbackEnd}
    ];
    return source.map((point,index)=>{
      const defaultOffset=source.length<=1?0:durationBeat*index/(source.length-1);
      const beatOffset=Math.max(0,Math.min(durationBeat,Number.isFinite(Number(point.beatOffset))?Number(point.beatOffset):defaultOffset));
      return {
        beatOffset,
        time:hitTime+beatOffset*SPB,
        angle:normDeg(angle+beatOffset*degreesPerBeat*direction),
        ring:clampRing(point.ring===undefined?entry.ring:point.ring)
      };
    }).sort((a,b)=>a.beatOffset-b.beatOffset);
  }

  function buildOrbitChart(spec,{startAngle=0,degreesPerBeat=DEG_PER_BEAT}={}){
    const ordered=(Array.isArray(spec)?spec:[]).map((entry,index)=>({entry,index})).sort((a,b)=>(Number(a.entry.beat)||0)-(Number(b.entry.beat)||0)||a.index-b.index);
    let previousBeat=0,angle=startAngle,direction=1;
    return ordered.map(({entry,index})=>{
      const beat=Number(entry.beat)||0;
      angle=normDeg(angle+(beat-previousBeat)*degreesPerBeat*direction);
      const type=canonicalType(entry.type);
      const durationBeat=Math.max(0,Number(entry.durationBeat)||0);
      const hitTime=beat*SPB;
      const note={
        id:entry.id||`orbit-${index}`,
        type,beat,hitTime,angle,
        ring:clampRing(entry.ring===undefined?1:entry.ring),
        durationBeat,
        duration:durationBeat*SPB,
        rollCount:Math.max(0,Math.round(Number(entry.rollCount)||0)),
        directionAtStart:direction,
        bloomPetals:Math.max(4,Math.min(16,Math.round(Number(entry.petals)||8))),
        drawBeats:Math.max(0,Number.isFinite(Number(entry.drawBeats))?Number(entry.drawBeats):DRAW_HOLD_BEATS)
      };
      note.endTime=note.hitTime+note.duration;
      note.stackRings=type==='stack'?normalizeStackRings(entry.rings,note.ring):[note.ring];
      note.points=type==='ribbon'?buildRibbonPoints(entry,{angle,direction,hitTime,durationBeat,degreesPerBeat}):[];
      const lastPoint=note.points.at(-1);
      note.endAngle=lastPoint?lastPoint.angle:normDeg(angle+durationBeat*degreesPerBeat*direction);
      note.endRing=lastPoint?lastPoint.ring:clampRing(entry.endRing===undefined?note.ring:entry.endRing);
      note.drawUntil=note.endTime+note.drawBeats*SPB;
      const nextDirection=directionForType(type);
      if(nextDirection)direction=nextDirection;
      note.directionAfter=direction;
      previousBeat=beat;
      return note;
    });
  }

  function pictureSpec(){
    return [
      {type:'dot',beat:8,ring:1},{type:'dot',beat:10,ring:0},{type:'stack',beat:12,rings:[0,1,2]},
      {type:'bloom',beat:14,ring:1,petals:8},
      {type:'ribbon',beat:16,durationBeat:6,ring:1,points:[{beatOffset:0,ring:1},{beatOffset:1.5,ring:2},{beatOffset:3,ring:0},{beatOffset:4.5,ring:2},{beatOffset:6,ring:1}]},
      {type:'dot',beat:23,ring:2},{type:'flipCCW',beat:24,ring:1},{type:'dot',beat:26,ring:2},
      {type:'ribbon',beat:28,durationBeat:6,ring:2,points:[{beatOffset:0,ring:2},{beatOffset:1.5,ring:0},{beatOffset:3,ring:1},{beatOffset:4.5,ring:0},{beatOffset:6,ring:2}]},
      {type:'stack',beat:35,rings:[0,1,2]},{type:'pulse',beat:36},
      {type:'roll',beat:38,durationBeat:4,rollCount:8,ring:1},{type:'flipCW',beat:44,ring:1},
      {type:'ribbon',beat:46,durationBeat:6,ring:0,points:[{beatOffset:0,ring:0},{beatOffset:1.5,ring:2},{beatOffset:3,ring:1},{beatOffset:4.5,ring:2},{beatOffset:6,ring:0}]},
      {type:'bloom',beat:54,ring:1,petals:10},{type:'hold',beat:56,durationBeat:2,ring:0},
      {type:'stack',beat:60,rings:[0,1,2]},
      {type:'ribbon',beat:64,durationBeat:8,ring:2,points:[{beatOffset:0,ring:2},{beatOffset:2,ring:1},{beatOffset:4,ring:0},{beatOffset:6,ring:1},{beatOffset:8,ring:2}]},
      {type:'pulse',beat:76},{type:'roll',beat:78,durationBeat:4,rollCount:12,ring:2},{type:'dot',beat:84,ring:1}
    ];
  }

  const demoSpec=pictureSpec;
  const makeDemoChart=()=>buildOrbitChart(pictureSpec());

  function judgementForDelta(delta){
    const d=Math.abs(Number(delta));
    if(d<=PERFECT_WINDOW)return 'PERFECT';
    if(d<=GREAT_WINDOW)return 'GREAT';
    return null;
  }

  function isActionType(type){return ['dot','hold','ribbon','stack','bloom','roll'].includes(canonicalType(type));}
  function inputMatches(note,code){
    if(!note)return false;
    const type=canonicalType(note.type);
    if(isActionType(type))return code==='KeyZ'||code==='KeyX';
    if(type==='pulse')return code==='ShiftLeft'||code==='ShiftRight';
    if(type==='flipCW')return code==='ArrowRight';
    if(type==='flipCCW')return code==='ArrowLeft';
    return false;
  }

  function mount(document){
    const canvas=document.getElementById('orbitCanvas');
    if(!canvas)return null;
    const ctx=canvas.getContext('2d');
    const audio=document.getElementById('orbitAudio');
    const startBtn=document.getElementById('orbitStart');
    const retryBtn=document.getElementById('orbitRetry');
    const result=document.getElementById('orbitResult');
    const resultText=document.getElementById('orbitResultText');
    const status=document.getElementById('orbitStatus');
    const scoreEl=document.getElementById('orbitScore');
    const comboEl=document.getElementById('orbitCombo');
    const judgeEl=document.getElementById('orbitJudge');
    const fileInput=document.getElementById('orbitAudioFile');
    const muteBtn=document.getElementById('orbitMute');
    const startCard=document.querySelector('.orbitStartCard');
    const chart=makeDemoChart().map(note=>({...note,state:'pending',startDelta:null,coverage:0,rollHits:0,memoryUntil:0}));
    let W=0,H=0,cx=0,cy=0,radius=0,running=false,paused=false,startPerf=0,lastFrame=0,score=0,combo=0,maxCombo=0,misses=0,heldActions=new Set(),activeSustain=null,judgeLineAngle=0,feedback=[],audioObjectUrl=null,frameCount=0;

    function resize(){
      const dpr=Math.min(window.devicePixelRatio||1,2),rect=canvas.getBoundingClientRect();
      W=Math.max(320,Math.floor(rect.width));H=Math.max(320,Math.floor(rect.height));
      canvas.width=Math.floor(W*dpr);canvas.height=Math.floor(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      cx=W/2;cy=H/2;radius=Math.max(82,Math.min(W,H)*.27);
    }
    function ringRadius(ring){return ringRadiusFor(radius,ring);}
    function pointAt(angle,ring){const a=(angle-90)*Math.PI/180,r=ringRadius(ring);return {x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r,a,r};}
    function gameTime(){
      if(!running)return 0;
      if(audio&&!audio.paused&&Number.isFinite(audio.currentTime))return audio.currentTime;
      return Math.max(0,(performance.now()-startPerf)/1000);
    }
    function reset(){
      for(const note of chart)Object.assign(note,{state:'pending',startDelta:null,coverage:0,rollHits:0,memoryUntil:0});
      score=combo=maxCombo=misses=0;heldActions.clear();activeSustain=null;judgeLineAngle=0;feedback=[];frameCount=0;result.hidden=true;updateHud();
    }
    function updateHud(){scoreEl.textContent=String(score).padStart(7,'0');comboEl.textContent=`${combo} COMBO`;}
    function addFeedback(text,good=true){feedback.push({text,life:1,good});judgeEl.textContent=text;judgeEl.dataset.good=good?'true':'false';}
    function finishNote(note,label){
      if(note.state==='done'||note.state==='miss')return;
      note.state='done';note.memoryUntil=Math.max(note.drawUntil,gameTime()+DRAW_HOLD_BEATS*SPB);combo++;maxCombo=Math.max(maxCombo,combo);score+=label==='PERFECT'?1000:650;addFeedback(label,true);updateHud();
    }
    function missNote(note,reason='MISS'){
      if(note.state==='done'||note.state==='miss')return;
      note.state='miss';note.memoryUntil=gameTime()+.65;combo=0;misses++;addFeedback(reason,false);updateHud();
    }
    function nearestPending(code,t){
      let best=null,bestDelta=Infinity;
      for(const note of chart){
        if(note.state!=='pending'||!inputMatches(note,code))continue;
        const delta=t-note.hitTime,abs=Math.abs(delta);
        if(abs<=GREAT_WINDOW&&abs<bestDelta){best=note;bestDelta=abs;}
      }
      return best?{note:best,delta:t-best.hitTime}:null;
    }
    function handlePress(code){
      if(!running||paused)return;
      const t=gameTime();
      if(code==='KeyZ'||code==='KeyX')heldActions.add(code);
      if(activeSustain&&activeSustain.type==='roll'&&(code==='KeyZ'||code==='KeyX')){activeSustain.rollHits++;return;}
      const found=nearestPending(code,t);if(!found)return;
      const {note,delta}=found,label=judgementForDelta(delta);if(!label)return;
      if(note.type==='hold'||note.type==='ribbon'){
        note.state='active';note.startDelta=delta;note.coverage=0;activeSustain=note;addFeedback(note.type==='ribbon'?'RIBBON':'HOLD',true);return;
      }
      if(note.type==='roll'){
        note.state='active';note.startDelta=delta;note.rollHits=1;activeSustain=note;addFeedback('ROLL',true);return;
      }
      finishNote(note,label);
    }
    function handleRelease(code){
      heldActions.delete(code);
      if(activeSustain&&(activeSustain.type==='hold'||activeSustain.type==='ribbon')&&!heldActions.size&&gameTime()<activeSustain.endTime-.08){missNote(activeSustain,'EARLY');activeSustain=null;}
    }
    function updateNotes(t){
      for(const note of chart)if(note.state==='pending'&&t>note.hitTime+GREAT_WINDOW)missNote(note);
      if(activeSustain){
        const note=activeSustain;
        if(note.type==='hold'||note.type==='ribbon'){
          if(heldActions.size)note.coverage=Math.max(note.coverage,Math.min(note.duration,Math.max(0,t-note.hitTime)));
          if(t>=note.endTime){
            const ratio=note.duration?note.coverage/note.duration:1;
            if(ratio>=.82)finishNote(note,Math.abs(note.startDelta)<=PERFECT_WINDOW&&ratio>=.94?'PERFECT':'GREAT');else missNote(note,'BREAK');
            activeSustain=null;
          }
        }else if(note.type==='roll'&&t>=note.endTime){
          const ratio=note.rollHits/Math.max(1,note.rollCount);
          if(ratio>=.75)finishNote(note,ratio>=1?'PERFECT':'GREAT');else missNote(note,'ROLL MISS');
          activeSustain=null;
        }
      }
      const last=chart[chart.length-1];
      if(t>last.endTime+1&&result.hidden){running=false;audio?.pause();result.hidden=false;resultText.textContent=`SCORE ${score} · MAX ${maxCombo} · MISS ${misses}`;}
    }
    function orbitStateAt(t){
      let direction=1,angle=0,previous=0;
      for(const note of chart){
        if(note.hitTime>t)break;
        angle+=((note.hitTime-previous)/SPB)*DEG_PER_BEAT*direction;
        previous=note.hitTime;
        const next=directionForType(note.type);if(next)direction=next;
      }
      angle+=((t-previous)/SPB)*DEG_PER_BEAT*direction;
      return {angle:normDeg(angle),direction};
    }
    function drawRing(t=0){
      ctx.clearRect(0,0,W,H);
      const g=ctx.createRadialGradient(cx,cy,radius*.15,cx,cy,ringRadius(2)*1.45);g.addColorStop(0,'rgba(27,50,80,.08)');g.addColorStop(1,'rgba(1,8,20,.94)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      for(let ring=0;ring<RING_FACTORS.length;ring++){
        const r=ringRadius(ring);ctx.lineWidth=ring===1?13:9;ctx.strokeStyle=ring===1?'rgba(86,169,255,.14)':'rgba(120,205,255,.08)';ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
        ctx.lineWidth=1.5;ctx.strokeStyle=ring===1?'rgba(185,231,255,.48)':'rgba(170,225,255,.25)';ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
      }
      for(let i=0;i<8;i++){const a=-Math.PI/2+i*TAU/8;ctx.strokeStyle='rgba(180,220,255,.15)';ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(ringRadius(0)-8),cy+Math.sin(a)*(ringRadius(0)-8));ctx.lineTo(cx+Math.cos(a)*(ringRadius(2)+8),cy+Math.sin(a)*(ringRadius(2)+8));ctx.stroke();}
      const memoryCount=chart.filter(note=>note.state==='done'&&t<=note.memoryUntil).length;
      ctx.fillStyle='rgba(191,232,255,.62)';ctx.font='700 11px system-ui';ctx.textAlign='center';ctx.fillText(`DRAW MODE · ${memoryCount}`,cx,cy-4);
      ctx.fillStyle='rgba(132,195,225,.48)';ctx.font='600 9px system-ui';ctx.fillText('INNER · MID · OUTER',cx,cy+12);
    }
    function noteColor(note){return note.type==='pulse'?'#ff9f43':note.type.startsWith('flip')?'#f76fff':note.type==='roll'?'#ffd35a':note.type==='ribbon'?'#67e8f9':note.type==='hold'?'#63f5a5':note.type==='stack'?'#a7b8ff':note.type==='bloom'?'#ff84d7':'#ffffff';}
    function noteAlpha(note,t){if(note.state==='miss')return Math.max(0,(note.memoryUntil-t)/.65)*.3;if(note.state==='done')return t<=note.memoryUntil?.72:0;if(note.state==='active')return 1;return .9;}
    function drawOrbitArc(note,alpha,label){
      const r=ringRadius(note.ring),start=(note.angle-90)*Math.PI/180,end=(note.endAngle-90)*Math.PI/180;ctx.save();ctx.globalAlpha=alpha;ctx.lineWidth=16;ctx.lineCap='round';ctx.strokeStyle=noteColor(note);ctx.beginPath();ctx.arc(cx,cy,r,start,end,note.directionAtStart<0);ctx.stroke();const p=pointAt(note.angle,note.ring);ctx.fillStyle='#07111f';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,p.x,p.y);ctx.restore();
    }
    function drawRibbon(note,alpha){
      if(note.points.length<2)return;
      ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=noteColor(note);ctx.lineWidth=15;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=noteColor(note);ctx.shadowBlur=note.state==='done'?16:7;ctx.beginPath();
      note.points.forEach((point,index)=>{const p=pointAt(point.angle,point.ring);if(index===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.stroke();ctx.shadowBlur=0;
      for(const point of note.points){const p=pointAt(point.angle,point.ring);ctx.fillStyle='rgba(225,252,255,.9)';ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,TAU);ctx.fill();}
      ctx.restore();
    }
    function drawStack(note,alpha){
      const points=note.stackRings.map(ring=>pointAt(note.angle,ring));ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=noteColor(note);ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))ctx.lineTo(p.x,p.y);ctx.stroke();
      for(const p of points){ctx.fillStyle=noteColor(note);ctx.beginPath();ctx.arc(p.x,p.y,11,0,TAU);ctx.fill();ctx.strokeStyle='#07111f';ctx.lineWidth=3;ctx.stroke();}ctx.restore();
    }
    function drawBloom(note,alpha){
      const p=pointAt(note.angle,note.ring),petals=note.bloomPetals;ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=alpha;ctx.strokeStyle=noteColor(note);ctx.fillStyle=noteColor(note);ctx.lineWidth=3;ctx.shadowColor=noteColor(note);ctx.shadowBlur=note.state==='done'?18:8;
      for(let i=0;i<petals;i++){ctx.save();ctx.rotate(i*TAU/petals);ctx.beginPath();ctx.ellipse(0,-17,5,12,0,0,TAU);ctx.stroke();ctx.restore();}
      ctx.beginPath();ctx.arc(0,0,8,0,TAU);ctx.fill();ctx.restore();
    }
    function drawDot(note,alpha){const p=pointAt(note.angle,note.ring);ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=noteColor(note);ctx.strokeStyle='#07111f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,13,0,TAU);ctx.fill();ctx.stroke();ctx.restore();}
    function drawNote(note,t){
      const upcoming=note.state==='pending'&&note.hitTime>=t-1&&note.hitTime<=t+7;
      const active=note.state==='active';
      const remembered=(note.state==='done'||note.state==='miss')&&t<=note.memoryUntil;
      if(!upcoming&&!active&&!remembered)return;
      const alpha=noteAlpha(note,t);if(alpha<=0)return;
      if(note.type==='ribbon'){drawRibbon(note,alpha);return;}
      if(note.type==='hold'){drawOrbitArc(note,alpha,'HOLD');return;}
      if(note.type==='stack'){drawStack(note,alpha);return;}
      if(note.type==='bloom'){drawBloom(note,alpha);return;}
      if(note.type==='pulse'){
        ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=noteColor(note);ctx.lineWidth=6;for(let ring=0;ring<3;ring++){ctx.beginPath();ctx.arc(cx,cy,ringRadius(ring)+18,0,TAU);ctx.stroke();}ctx.restore();return;
      }
      const p=pointAt(note.angle,note.ring),color=noteColor(note);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a+Math.PI/2);ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.strokeStyle='#07111f';ctx.lineWidth=3;
      if(note.type==='dot'){ctx.beginPath();ctx.arc(0,0,13,0,TAU);ctx.fill();ctx.stroke();}
      else if(note.type==='flipCW'||note.type==='flipCCW'){ctx.font='bold 28px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(note.type==='flipCW'?'→':'←',0,0);}
      else if(note.type==='roll'){ctx.fillRect(-24,-13,48,26);ctx.fillStyle='#07111f';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`${note.rollHits}/${note.rollCount}`,0,0);}
      ctx.restore();
    }
    function drawJudge(t){
      const orbit=orbitStateAt(t);judgeLineAngle=orbit.angle;const a=(orbit.angle-90)*Math.PI/180,inner=ringRadius(0)-28,outer=ringRadius(2)+28;
      ctx.strokeStyle='#ffffff';ctx.lineWidth=5;ctx.shadowColor='#62d8ff';ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner);ctx.lineTo(cx+Math.cos(a)*outer,cy+Math.sin(a)*outer);ctx.stroke();ctx.shadowBlur=0;
      for(let ring=0;ring<3;ring++){const p=pointAt(orbit.angle,ring);ctx.fillStyle='#dff8ff';ctx.beginPath();ctx.arc(p.x,p.y,ring===1?8:5,0,TAU);ctx.fill();}
      ctx.fillStyle='rgba(220,245,255,.75)';ctx.font='700 13px system-ui';ctx.textAlign='center';ctx.fillText(orbit.direction>0?'CW':'CCW',cx,cy+34);
    }
    function frame(now){
      if(!running)return;lastFrame=now;const t=gameTime();updateNotes(t);drawRing(t);for(const note of chart)drawNote(note,t);drawJudge(t);for(const f of feedback)f.life-=.016;feedback=feedback.filter(f=>f.life>0);frameCount++;requestAnimationFrame(frame);
    }
    async function start(){
      reset();running=true;paused=false;if(startCard)startCard.hidden=true;startPerf=performance.now();lastFrame=startPerf;status.textContent='PICTURE DEMO';canvas.focus();
      if(audio){try{audio.currentTime=0;await audio.play();}catch(_){status.textContent='SILENT DRAW CLOCK';}}
      requestAnimationFrame(frame);
    }
    function toggleMute(){if(!audio)return;audio.muted=!audio.muted;muteBtn.textContent=audio.muted?'SOUND OFF':'SOUND ON';}
    startBtn?.addEventListener('click',start);retryBtn?.addEventListener('click',start);muteBtn?.addEventListener('click',toggleMute);
    fileInput?.addEventListener('change',()=>{const file=fileInput.files?.[0];if(!file)return;if(audioObjectUrl)URL.revokeObjectURL(audioObjectUrl);audioObjectUrl=URL.createObjectURL(file);audio.src=audioObjectUrl;status.textContent='LOCAL AUDIO READY';});
    window.addEventListener('resize',resize);window.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Space'].includes(event.code))event.preventDefault();if(event.repeat)return;handlePress(event.code);});window.addEventListener('keyup',event=>handleRelease(event.code));
    resize();drawRing(0);drawJudge(0);for(const note of chart.slice(0,6))drawNote(note,0);updateHud();
    const testApi={chart,buildOrbitChart,orbitStateAt,inputMatches,judgementForDelta,state:()=>({running,score,combo,maxCombo,misses,judgeLineAngle,activeType:activeSustain?.type||null,ringCount:RING_FACTORS.length,drawMode:true,drawCount:chart.filter(note=>note.state==='done'&&gameTime()<=note.memoryUntil).length,frameCount})};
    window.CircleMixOrbitTestApi=testApi;
    return testApi;
  }

  return Object.freeze({BPM,SPB,BEATS_PER_TURN,DEG_PER_BEAT,PERFECT_WINDOW,GREAT_WINDOW,RING_FACTORS,DRAW_HOLD_BEATS,ORBIT_TYPES,TYPE_ALIASES,normDeg,shortestDeg,directionForType,canonicalType,clampRing,ringRadiusFor,normalizeStackRings,buildRibbonPoints,buildOrbitChart,pictureSpec,demoSpec,makeDemoChart,judgementForDelta,inputMatches,mount});
});
