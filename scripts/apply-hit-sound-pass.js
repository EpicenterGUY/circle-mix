#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const gamePath = path.join(root, 'src/game.js');
const source = fs.readFileSync(gamePath, 'utf8').replace(/\r\n/g, '\n');
const startMarker = '  function playHitSound(type="cut", quality="PERFECT"){';
const endMarker = '\n  function judge(n,label,color,event={}){';
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (source.includes('HIT_SOUND_CHORD_WINDOW')) {
  console.log('Punchier hit-sound pass already applied.');
  process.exit(0);
}
if (start < 0 || end < 0) throw new Error('Unable to locate the existing hit-sound implementation.');

const replacement = String.raw`  const HIT_SOUND_CHORD_WINDOW=.036;
  let hitSoundBus=null, hitSoundLimiter=null, hitNoiseBuffer=null, recentHitTimes=[];

  function ensureHitSoundBus(){
    ensureAudioCtx();
    if(!audioCtx)return null;
    if(hitSoundBus)return hitSoundBus;
    hitSoundBus=audioCtx.createGain();
    hitSoundBus.gain.value=.92;
    if(typeof audioCtx.createDynamicsCompressor==="function"){
      hitSoundLimiter=audioCtx.createDynamicsCompressor();
      hitSoundLimiter.threshold.value=-12;
      hitSoundLimiter.knee.value=10;
      hitSoundLimiter.ratio.value=10;
      hitSoundLimiter.attack.value=.002;
      hitSoundLimiter.release.value=.09;
      hitSoundBus.connect(hitSoundLimiter);
      hitSoundLimiter.connect(audioCtx.destination);
    }else hitSoundBus.connect(audioCtx.destination);
    return hitSoundBus;
  }

  function hitSoundHeadroom(t){
    recentHitTimes=recentHitTimes.filter(time=>t-time<=HIT_SOUND_CHORD_WINDOW);
    recentHitTimes.push(t);
    return clamp(1/Math.sqrt(recentHitTimes.length),.56,1);
  }

  function ensureHitNoiseBuffer(){
    if(!audioCtx)return null;
    if(hitNoiseBuffer&&hitNoiseBuffer.sampleRate===audioCtx.sampleRate)return hitNoiseBuffer;
    const duration=.24;
    hitNoiseBuffer=audioCtx.createBuffer(1,Math.ceil(audioCtx.sampleRate*duration),audioCtx.sampleRate);
    const data=hitNoiseBuffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    return hitNoiseBuffer;
  }

  function scheduleHitTone(bus,t,{wave="sine",from=440,to=220,duration=.06,volume=.05,delay=0,attack=.003,filter=0,q=.7}){
    const start=t+delay, stop=start+duration;
    const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
    osc.type=wave;
    osc.frequency.setValueAtTime(Math.max(20,from),start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),stop);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001,volume),start+Math.min(attack,duration*.45));
    gain.gain.exponentialRampToValueAtTime(.0001,stop);
    if(filter&&typeof audioCtx.createBiquadFilter==="function"){
      const node=audioCtx.createBiquadFilter();
      node.type="lowpass";node.frequency.value=filter;node.Q.value=q;
      osc.connect(node);node.connect(gain);
    }else osc.connect(gain);
    gain.connect(bus);osc.start(start);osc.stop(stop+.015);
  }

  function scheduleHitNoise(bus,t,{duration=.04,volume=.04,delay=0,type="highpass",frequency=1800,q=.8}){
    const buffer=ensureHitNoiseBuffer();
    if(!buffer)return;
    const start=t+delay, stop=start+duration;
    const source=audioCtx.createBufferSource(), gain=audioCtx.createGain();
    source.buffer=buffer;
    gain.gain.setValueAtTime(Math.max(.0001,volume),start);
    gain.gain.exponentialRampToValueAtTime(.0001,stop);
    if(typeof audioCtx.createBiquadFilter==="function"){
      const filter=audioCtx.createBiquadFilter();
      filter.type=type;filter.frequency.value=frequency;filter.Q.value=q;
      source.connect(filter);filter.connect(gain);
    }else source.connect(gain);
    gain.connect(bus);
    const maxOffset=Math.max(0,buffer.duration-duration-.001);
    source.start(start,Math.random()*maxOffset,duration);
    source.stop(stop+.01);
  }

  function playHitSound(type="cut", quality="PERFECT"){
    const effectiveSfxVolume=sfxEnabled?clamp(sfxVolume,0,4):0;
    if(effectiveSfxVolume<=.001)return;
    const bus=ensureHitSoundBus();
    if(!bus)return;
    const t=audioCtx.currentTime;
    const family=type==="pulse"?"pulse":type.startsWith("trace")?"trace":type.startsWith("slide")?"slide":type.startsWith("swing")?"swing":type==="fx"?"hold":type.startsWith("scratch")?"scratch":"cut";
    const direction=type.endsWith("CCW")?-1:(type.endsWith("CW")?1:0);
    const qualityPitch=quality==="PERFECT"?1:.88;
    const amount=clamp(effectiveSfxVolume*hitSoundHeadroom(t),.02,2.35);
    const tone=(options)=>scheduleHitTone(bus,t,{...options,from:options.from*qualityPitch,to:options.to*qualityPitch,volume:clamp(options.volume*amount,.0001,.42)});
    const noise=(options)=>scheduleHitNoise(bus,t,{...options,volume:clamp(options.volume*amount,.0001,.32)});

    if(family==="cut"){
      tone({wave:"square",from:1080,to:520,duration:.036,volume:.050,attack:.0015});
      tone({wave:"sine",from:168,to:78,duration:.062,volume:.092,attack:.002});
      noise({duration:.026,volume:.056,type:"highpass",frequency:2200,q:.65});
    }else if(family==="pulse"){
      tone({wave:"sine",from:112,to:48,duration:.132,volume:.150,attack:.002});
      tone({wave:"triangle",from:540,to:255,duration:.105,volume:.058,attack:.004});
      tone({wave:"sine",from:760,to:610,duration:.115,volume:.030,delay:.018,attack:.008});
      noise({duration:.072,volume:.060,type:"bandpass",frequency:920,q:.9});
    }else if(family==="swing"){
      tone({wave:"sawtooth",from:direction<0?1120:250,to:direction<0?235:1120,duration:.132,volume:.068,attack:.005,filter:3200});
      tone({wave:"sine",from:138,to:72,duration:.074,volume:.060,attack:.002});
      noise({duration:.098,volume:.078,type:"bandpass",frequency:direction<0?1320:1760,q:2.1});
    }else if(family==="slide"){
      tone({wave:"triangle",from:direction<0?1320:560,to:direction<0?540:1340,duration:.112,volume:.058,attack:.004});
      tone({wave:"sine",from:190,to:104,duration:.066,volume:.056,attack:.002});
      noise({duration:.064,volume:.046,type:"bandpass",frequency:2050,q:1.4});
    }else if(family==="trace"){
      tone({wave:"sine",from:direction<0?980:710,to:direction<0?690:990,duration:.105,volume:.043,attack:.006});
      tone({wave:"triangle",from:1190,to:720,duration:.092,volume:.036,delay:.008,attack:.006});
      noise({duration:.044,volume:.032,type:"highpass",frequency:2450,q:.75});
    }else if(family==="hold"){
      tone({wave:"sine",from:154,to:54,duration:.128,volume:.118,attack:.003});
      tone({wave:"square",from:345,to:176,duration:.052,volume:.036,attack:.002,filter:1500});
      noise({duration:.060,volume:.052,type:"lowpass",frequency:720,q:.7});
    }else{
      tone({wave:"sawtooth",from:direction<0?470:180,to:direction<0?170:490,duration:.142,volume:.092,attack:.004,filter:2800});
      tone({wave:"sine",from:94,to:52,duration:.086,volume:.062,attack:.002});
      noise({duration:.132,volume:.108,type:"bandpass",frequency:1220,q:1.9});
    }

    if(quality==="PERFECT"){
      const sparkFrom=family==="pulse"?1320:(family==="hold"?980:1880);
      tone({wave:"triangle",from:sparkFrom,to:sparkFrom*1.32,duration:.038,volume:family==="pulse"?.024:.020,delay:.006,attack:.003});
    }
  }
`;

const next = source.slice(0, start) + replacement + source.slice(end);
fs.writeFileSync(gamePath, next);
console.log('Applied punchier layered hit sounds to src/game.js.');
