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
  const ORBIT_TYPES=Object.freeze(['tap','hold','arc','flipCW','flipCCW','roll','pulse']);
  const normDeg=v=>((Number(v)%360)+360)%360;
  const shortestDeg=(a,b)=>Math.abs(((normDeg(a)-normDeg(b)+540)%360)-180);
  const directionForType=type=>type==='flipCCW'?-1:(type==='flipCW'?1:0);

  function buildOrbitChart(spec,{startAngle=0,degreesPerBeat=DEG_PER_BEAT}={}){
    let previousBeat=0,angle=startAngle,direction=1;
    return spec.map((entry,index)=>{
      const beat=Number(entry.beat)||0;
      angle=normDeg(angle+(beat-previousBeat)*degreesPerBeat*direction);
      const note={id:entry.id||`orbit-${index}`,type:entry.type,beat,hitTime:beat*SPB,angle,durationBeat:Number(entry.durationBeat)||0,rollCount:Number(entry.rollCount)||0};
      note.duration=note.durationBeat*SPB;
      note.endTime=note.hitTime+note.duration;
      note.endAngle=normDeg(angle+note.durationBeat*degreesPerBeat*direction);
      const nextDirection=directionForType(entry.type);
      if(nextDirection)direction=nextDirection;
      note.directionAfter=direction;
      previousBeat=beat;
      return note;
    });
  }

  function demoSpec(){
    return [
      {type:'tap',beat:8},{type:'tap',beat:10},{type:'tap',beat:12},{type:'tap',beat:14},
      {type:'hold',beat:16,durationBeat:2},{type:'tap',beat:19},{type:'pulse',beat:20},
      {type:'arc',beat:22,durationBeat:4},{type:'tap',beat:27},
      {type:'flipCCW',beat:28},{type:'tap',beat:30},{type:'tap',beat:32},
      {type:'roll',beat:34,durationBeat:4,rollCount:8},{type:'pulse',beat:38},
      {type:'flipCW',beat:40},{type:'arc',beat:42,durationBeat:4},
      {type:'tap',beat:47},{type:'hold',beat:48,durationBeat:2},
      {type:'flipCCW',beat:52},{type:'tap',beat:54},{type:'pulse',beat:56},
      {type:'roll',beat:58,durationBeat:4,rollCount:12},{type:'flipCW',beat:64},
      {type:'arc',beat:66,durationBeat:6},{type:'tap',beat:73},{type:'tap',beat:74},
      {type:'pulse',beat:76},{type:'hold',beat:78,durationBeat:2},{type:'tap',beat:82}
    ];
  }

  const makeDemoChart=()=>buildOrbitChart(demoSpec());

  function judgementForDelta(delta){
    const d=Math.abs(Number(delta));
    if(d<=PERFECT_WINDOW)return 'PERFECT';
    if(d<=GREAT_WINDOW)return 'GREAT';
    return null;
  }

  function isActionType(type){return type==='tap'||type==='hold'||type==='arc'||type==='roll';}
  function inputMatches(note,code){
    if(!note)return false;
    if(isActionType(note.type))return code==='KeyZ'||code==='KeyX';
    if(note.type==='pulse')return code==='ShiftLeft'||code==='ShiftRight';
    if(note.type==='flipCW')return code==='ArrowRight';
    if(note.type==='flipCCW')return code==='ArrowLeft';
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
    const chart=makeDemoChart().map(note=>({...note,state:'pending',startDelta:null,coverage:0,rollHits:0}));
    let W=0,H=0,cx=0,cy=0,radius=0,running=false,paused=false,startPerf=0,lastFrame=0,score=0,combo=0,maxCombo=0,misses=0,heldActions=new Set(),activeSustain=null,judgeLineAngle=0,feedback=[],audioObjectUrl=null;

    function resize(){
      const dpr=Math.min(window.devicePixelRatio||1,2),rect=canvas.getBoundingClientRect();
      W=Math.max(320,Math.floor(rect.width));H=Math.max(320,Math.floor(rect.height));
      canvas.width=Math.floor(W*dpr);canvas.height=Math.floor(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      cx=W/2;cy=H/2;radius=Math.max(105,Math.min(W,H)*.34);
    }
    function gameTime(){
      if(!running)return 0;
      if(audio&&!audio.paused&&Number.isFinite(audio.currentTime))return audio.currentTime;
      return Math.max(0,(performance.now()-startPerf)/1000);
    }
    function reset(){
      for(const note of chart)Object.assign(note,{state:'pending',startDelta:null,coverage:0,rollHits:0});
      score=combo=maxCombo=misses=0;heldActions.clear();activeSustain=null;judgeLineAngle=0;feedback=[];result.hidden=true;updateHud();
    }
    function updateHud(){scoreEl.textContent=String(score).padStart(7,'0');comboEl.textContent=`${combo} COMBO`;}
    function addFeedback(text,good=true){feedback.push({text,life:1,good});judgeEl.textContent=text;judgeEl.dataset.good=good?'true':'false';}
    function finishNote(note,label){
      if(note.state==='done'||note.state==='miss')return;
      note.state='done';combo++;maxCombo=Math.max(maxCombo,combo);score+=label==='PERFECT'?1000:650;addFeedback(label,true);updateHud();
    }
    function missNote(note,reason='MISS'){
      if(note.state==='done'||note.state==='miss')return;
      note.state='miss';combo=0;misses++;addFeedback(reason,false);updateHud();
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
      const {note,delta}=found,label=judgementForDelta(delta);
      if(!label)return;
      if(note.type==='hold'||note.type==='arc'){
        note.state='active';note.startDelta=delta;note.coverage=0;activeSustain=note;addFeedback(note.type==='arc'?'ARC':'HOLD',true);return;
      }
      if(note.type==='roll'){
        note.state='active';note.startDelta=delta;note.rollHits=1;activeSustain=note;addFeedback('ROLL',true);return;
      }
      finishNote(note,label);
    }
    function handleRelease(code){
      heldActions.delete(code);
      if(activeSustain&&(activeSustain.type==='hold'||activeSustain.type==='arc')&&!heldActions.size&&gameTime()<activeSustain.endTime-.08){missNote(activeSustain,'EARLY');activeSustain=null;}
    }
    function updateNotes(t,dt){
      for(const note of chart){
        if(note.state==='pending'&&t>note.hitTime+GREAT_WINDOW)missNote(note);
      }
      if(activeSustain){
        const note=activeSustain;
        if(note.type==='hold'||note.type==='arc'){
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
    function drawRing(){
      ctx.clearRect(0,0,W,H);
      const g=ctx.createRadialGradient(cx,cy,radius*.18,cx,cy,radius*1.35);g.addColorStop(0,'rgba(27,50,80,.08)');g.addColorStop(1,'rgba(1,8,20,.92)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      ctx.lineWidth=14;ctx.strokeStyle='rgba(86,169,255,.12)';ctx.beginPath();ctx.arc(cx,cy,radius,0,TAU);ctx.stroke();
      ctx.lineWidth=2;ctx.strokeStyle='rgba(170,225,255,.45)';ctx.beginPath();ctx.arc(cx,cy,radius,0,TAU);ctx.stroke();
      for(let i=0;i<8;i++){const a=-Math.PI/2+i*TAU/8;ctx.strokeStyle='rgba(180,220,255,.18)';ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(radius-10),cy+Math.sin(a)*(radius-10));ctx.lineTo(cx+Math.cos(a)*(radius+10),cy+Math.sin(a)*(radius+10));ctx.stroke();}
    }
    function noteColor(note){return note.type==='pulse'?'#ff9f43':note.type.startsWith('flip')?'#f76fff':note.type==='roll'?'#ffd35a':note.type==='arc'?'#67e8f9':note.type==='hold'?'#63f5a5':'#ffffff';}
    function drawArc(note){
      const start=(note.angle-90)*Math.PI/180,end=(note.endAngle-90)*Math.PI/180;ctx.lineWidth=18;ctx.lineCap='round';ctx.strokeStyle=note.state==='miss'?'rgba(255,80,80,.28)':noteColor(note);ctx.globalAlpha=note.state==='done'?.22:.65;ctx.beginPath();ctx.arc(cx,cy,radius,start,end,note.directionAfter<0);ctx.stroke();ctx.globalAlpha=1;
    }
    function drawNote(note,t){
      if(note.state==='done'&&t-note.endTime>.45)return;
      if(note.type==='arc')drawArc(note);
      if(note.type==='pulse'){ctx.save();ctx.globalAlpha=note.state==='miss'?.22:(note.state==='done'?.28:1);ctx.strokeStyle=noteColor(note);ctx.lineWidth=7;ctx.beginPath();ctx.arc(cx,cy,radius+26,0,TAU);ctx.stroke();ctx.restore();return;}
      const a=(note.angle-90)*Math.PI/180,x=cx+Math.cos(a)*radius,y=cy+Math.sin(a)*radius,color=noteColor(note);
      ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/2);ctx.globalAlpha=note.state==='miss'?.25:(note.state==='done'?.35:1);
      ctx.fillStyle=color;ctx.strokeStyle='#07111f';ctx.lineWidth=3;
      if(note.type==='tap'){ctx.beginPath();ctx.arc(0,0,13,0,TAU);ctx.fill();ctx.stroke();}
      else if(note.type==='flipCW'||note.type==='flipCCW'){ctx.font='bold 28px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(note.type==='flipCW'?'→':'←',0,0);}
      else if(note.type==='roll'){ctx.fillRect(-24,-13,48,26);ctx.fillStyle='#07111f';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`${note.rollHits}/${note.rollCount}`,0,0);}
      else {ctx.fillRect(-18,-14,36,28);ctx.fillStyle='#07111f';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(note.type==='arc'?'ARC':'HOLD',0,0);}
      ctx.restore();
    }
    function drawJudge(t){
      const orbit=orbitStateAt(t);judgeLineAngle=orbit.angle;const a=(orbit.angle-90)*Math.PI/180;
      ctx.strokeStyle='#ffffff';ctx.lineWidth=5;ctx.shadowColor='#62d8ff';ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(radius-34),cy+Math.sin(a)*(radius-34));ctx.lineTo(cx+Math.cos(a)*(radius+34),cy+Math.sin(a)*(radius+34));ctx.stroke();ctx.shadowBlur=0;
      ctx.fillStyle='#dff8ff';ctx.beginPath();ctx.arc(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius,8,0,TAU);ctx.fill();
      ctx.fillStyle='rgba(220,245,255,.75)';ctx.font='700 13px system-ui';ctx.textAlign='center';ctx.fillText(orbit.direction>0?'CW':'CCW',cx,cy+5);
    }
    function frame(now){
      if(!running)return;const dt=Math.min(.05,Math.max(0,(now-lastFrame)/1000));lastFrame=now;const t=gameTime();updateNotes(t,dt);drawRing();for(const note of chart)if(note.hitTime>=t-1&&note.hitTime<=t+7)drawNote(note,t);drawJudge(t);for(const f of feedback)f.life-=dt;feedback=feedback.filter(f=>f.life>0);requestAnimationFrame(frame);
    }
    async function start(){
      reset();running=true;paused=false;if(startCard)startCard.hidden=true;startPerf=performance.now();lastFrame=startPerf;status.textContent='PLAYING';
      if(audio){try{audio.currentTime=0;await audio.play();}catch(_){status.textContent='SILENT CLOCK';}}
      requestAnimationFrame(frame);
    }
    function toggleMute(){if(!audio)return;audio.muted=!audio.muted;muteBtn.textContent=audio.muted?'SOUND OFF':'SOUND ON';}
    startBtn?.addEventListener('click',start);retryBtn?.addEventListener('click',start);muteBtn?.addEventListener('click',toggleMute);
    fileInput?.addEventListener('change',()=>{const file=fileInput.files?.[0];if(!file)return;if(audioObjectUrl)URL.revokeObjectURL(audioObjectUrl);audioObjectUrl=URL.createObjectURL(file);audio.src=audioObjectUrl;status.textContent='LOCAL AUDIO READY';});
    window.addEventListener('resize',resize);window.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Space'].includes(event.code))event.preventDefault();if(event.repeat)return;handlePress(event.code);});window.addEventListener('keyup',event=>handleRelease(event.code));
    resize();drawRing();drawJudge(0);for(const note of chart.slice(0,5))drawNote(note,0);updateHud();
    const testApi={chart,buildOrbitChart,orbitStateAt,inputMatches,judgementForDelta,state:()=>({running,score,combo,maxCombo,misses,judgeLineAngle,activeType:activeSustain?.type||null})};
    window.CircleMixOrbitTestApi=testApi;
    return testApi;
  }

  return Object.freeze({BPM,SPB,BEATS_PER_TURN,DEG_PER_BEAT,PERFECT_WINDOW,GREAT_WINDOW,ORBIT_TYPES,normDeg,shortestDeg,directionForType,buildOrbitChart,demoSpec,makeDemoChart,judgementForDelta,inputMatches,mount});
});
