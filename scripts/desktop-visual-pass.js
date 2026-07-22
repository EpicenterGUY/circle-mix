'use strict';

function replaceOrThrow(source, search, replacement, label){
  const next=source.replace(search,replacement);
  if(next===source) throw new Error(`Unable to ${label}.`);
  return next;
}

module.exports=function applyDesktopVisualPass(game){
  game=replaceOrThrow(game,
    'trace:"#4388ff", traceSoft:"#2466d9", pulse:"#ff4eb8", scratch:',
    'trace:"#4388ff", traceSoft:"#2466d9", pulse:"#ff8a3d", scratch:',
    'separate PULSE color from SWING CCW');
  game=replaceOrThrow(game,
    'ringBursts.push({color, power, life:.30, label});',
    'ringBursts.push({color, power, life:.22, label});',
    'shorten PULSE hit-ring lifetime');

  game=replaceOrThrow(game,
    /  function drawSwing\(n,t\)\{[\s\S]*?\n  \}\n\n+  function drawSlide/,
`  function drawSwing(n,t){
    // SWING_VISUAL_DIRECTIONAL_ARC: local direction only, never a full-screen ring.
    const link=linkedTraceForSwing(n);
    if(link){
      const ratio=clamp((t-link.hitTime)/Math.max(link.duration,.001),0,1);
      if(ratio<.78)return;
      ctx.globalAlpha=ratio<1?lerp(.28,.72,clamp((ratio-.78)/.22,0,1)):1;
    }
    const color=noteColor(n), dir=n.type==="swingCW"?1:-1;
    const r=lerp(outerR,hitR,progress(n,t));
    const span=Math.PI*.18;
    const startA=n.angle-dir*span*.5;
    const amount=dir*span;
    const linkDir=link?Math.sign(slideDelta(link)||dir):0;
    const isReversal=!!(link&&linkDir&&linkDir!==dir);

    drawDirectedArcSegments(r,startA,amount,"rgba(2,7,18,.72)",n===focusNote?14:12,1);
    drawDirectedArcSegments(r,startA,amount,color,n===focusNote?9:7,n===focusNote?.96:.82,color,n===focusNote?8:4);

    const arrowA=startA+amount;
    ctx.save();
    ctx.translate(cx+Math.cos(arrowA)*r,cy+Math.sin(arrowA)*r);
    ctx.rotate(arrowA+(dir>0?Math.PI/2:-Math.PI/2));
    ctx.fillStyle="#ffffff";
    ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-7);ctx.lineTo(-4,0);ctx.lineTo(-8,7);ctx.closePath();ctx.fill();
    ctx.restore();

    if(isReversal) drawRingLabel("REV",n.angle,r+22,"rgba(255,255,255,.90)",11);
    else if(link) drawRingLabel("EXIT",n.angle,r+22,"rgba(255,255,255,.82)",10);
    ctx.globalAlpha=1;
  }

  function drawSlide`,
    'simplify SWING rendering');

  game=replaceOrThrow(game,
    /  function drawPulse\(n,t\)\{[\s\S]*?\n  \}\n\n  function drawNote/,
`  function drawPulse(n,t){
    // PULSE_VISUAL_SINGLE_RING: one outlined center ring with no inner ring or orbiting arrows.
    const p=pulseInput.approachProgress(t,n.hitTime,APPROACH);
    const r=lerp(Math.max(22,baseR*.11),hitR,p);
    const near=Math.abs(t-n.hitTime)<=HIT_WINDOW;
    const color=COLORS.pulse;
    ctx.save();ctx.translate(cx,cy);
    ctx.globalAlpha=.34+.58*p;
    ctx.lineCap="round";
    ctx.strokeStyle="rgba(4,8,18,.78)";
    ctx.lineWidth=near?16:14;
    ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();
    ctx.strokeStyle=near?"#fff4e8":color;
    ctx.lineWidth=near?10:8;
    ctx.shadowColor=color;
    ctx.shadowBlur=(4+7*p)*visualScale("effect");
    ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();
    if(p<.82){
      ctx.globalAlpha=clamp((.82-p)/.24,0,1)*.92;
      ctx.fillStyle=color;
      ctx.font="1000 12px system-ui";
      ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText("PULSE",0,0);
    }
    ctx.restore();
  }

  function drawNote`,
    'simplify PULSE rendering');

  game=replaceOrThrow(game,
    /    const isPulse=n\.type==="pulse";\n    if\(isPulse\)\{[\s\S]*?\n    \}\n\n    let a=n\.angle;/,
`    const isPulse=n.type==="pulse";
    if(isPulse){
      // PULSE_HIT_SINGLE_RING: a short local shock ring, no particle orbit or center label.
      addFeedback(label,cx,cy-baseR*.12,color);
      mobileHaptic(label);
      addRingBurst(color,label==="PERFECT"?1.08:.94);
      if(tutorialMode) tutorialHandleJudgement(judgeEvent);
      return;
    }

    let a=n.angle;`,
    'simplify PULSE judgement effects');

  game=replaceOrThrow(game,
    '    addParticles(p.x,p.y,color,isScratch?16:(isSwing?22:14),isScratch?.85:(isSwing?1.35:1));',
    '    addParticles(p.x,p.y,color,isScratch?16:(isSwing?6:14),isScratch?.85:(isSwing?.55:1));',
    'reduce SWING judgement particles');

  game=replaceOrThrow(game,
    /    if\(isSwing\)\{[\s\S]*?\n    \}\n  \}\n  function inferMissReason/,
`    if(isSwing){
      // SWING_HIT_LOCAL_ONLY: the shared local wave and six particles are enough.
    }
  }
  function inferMissReason`,
    'remove SWING full-ring burst');

  game=replaceOrThrow(game,
    /    for\(let i=ringBursts\.length-1;i>=0;i--\)\{[\s\S]*?\n    \}\n\n    for\(let i=scratchBursts\.length-1/,
`    for(let i=ringBursts.length-1;i>=0;i--){
      const r=ringBursts[i];
      r.life-=dt;
      if(r.life<=0){ringBursts.splice(i,1);continue;}
      const p=1-r.life/.22;
      ctx.save();ctx.translate(cx,cy);
      ctx.globalAlpha=clamp(r.life/.22,0,1)*visualScale("effect");
      ctx.strokeStyle=r.color;
      ctx.lineWidth=8*(1-p*.45);
      ctx.beginPath();ctx.arc(0,0,hitR+p*36*r.power,0,TAU);ctx.stroke();
      ctx.restore();ctx.globalAlpha=1;
    }

    for(let i=scratchBursts.length-1`,
    'simplify PULSE ring burst rendering');

  if(!game.includes('PULSE_VISUAL_SINGLE_RING')||!game.includes('SWING_VISUAL_DIRECTIONAL_ARC')){
    throw new Error('Desktop visual clarity transforms were not applied.');
  }
  return game;
};
