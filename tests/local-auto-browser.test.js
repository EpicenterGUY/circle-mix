'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const artifactDir = process.env.BROWSER_ARTIFACTS_DIR;
const MIME = {
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.mp3':'audio/mpeg',
  '.ogg':'audio/ogg',
  '.wav':'audio/wav'
};

function startStaticServer(root){
  const base=path.resolve(root);
  const server=http.createServer((req,res)=>{
    try{
      const requestPath=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
      const relative=requestPath==='/'?'index.html':requestPath.replace(/^\/+/, '');
      const file=path.resolve(base,relative);
      if(file!==base && !file.startsWith(base+path.sep)){
        res.writeHead(403);res.end('forbidden');return;
      }
      fs.stat(file,(error,stat)=>{
        if(error||!stat.isFile()){res.writeHead(404);res.end('not found');return;}
        res.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
        fs.createReadStream(file).pipe(res);
      });
    }catch(error){res.writeHead(500);res.end(error.message);}
  });
  return new Promise((resolve,reject)=>{
    server.once('error',reject);
    server.listen(0,'127.0.0.1',()=>resolve(server));
  });
}

async function autoSnapshot(page){
  return page.evaluate(()=>{
    const local=document.querySelector('[data-auto-play]');
    const stable=document.getElementById('safeAuto');
    const details=element=>element?{
      text:element.textContent,
      className:element.className,
      ariaPressed:element.getAttribute('aria-pressed'),
      hidden:element.hidden,
      connected:element.isConnected,
      span:element.querySelector('span')?.textContent||null
    }:null;
    return {
      url:location.href,
      bodyClass:document.body.className,
      local:details(local),
      stable:details(stable),
      songSelectHidden:document.getElementById('songSelect')?.hidden,
      updateLogVisible:!!document.getElementById('updateLogOverlay')?.classList.contains('show'),
      gameState:window.CircleMixTestApi?.state?.()||null,
      localSongs:window.CircleMixSongRegistry?.localAll?.().map(song=>({id:song.id,title:song.title,difficulties:Object.keys(song.difficulties||{})}))||[]
    };
  });
}

async function waitForAuto(page,on,label){
  await page.waitForFunction(expected=>{
    const local=document.querySelector('[data-auto-play]');
    const stable=document.getElementById('safeAuto');
    const state=element=>!!element&&(element.classList.contains('on')||/(?:^|\s)ON(?:\s|$)/i.test(element.textContent||''));
    return state(local)===expected&&state(stable)===expected&&local?.querySelector('span')?.textContent===(expected?'ON':'OFF');
  },on,{timeout:5000});
  const snapshot=await autoSnapshot(page);
  assert.match(snapshot.local?.text||'',on?/ON/:/OFF/,`${label} LOCAL text ${JSON.stringify(snapshot)}`);
  assert.match(snapshot.stable?.text||'',on?/ON/:/OFF/,`${label} stable text ${JSON.stringify(snapshot)}`);
}

(async()=>{
  const server=await startStaticServer(process.cwd());
  const address=server.address();
  const url=`http://127.0.0.1:${address.port}/index.html?browserTest=1&tab=local`;
  let browser,context,page;
  let stage='launch';
  const errors=[];
  try{
    browser=await chromium.launch({headless:true});
    context=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
    page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    stage='load page';
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.CircleMixLocalSongs&&window.CircleMixSongRegistry&&window.CircleMixTestApi&&window.CircleMixCmixImportUi,{timeout:10000});
    await page.evaluate(()=>{
      const update=document.getElementById('updateLogOverlay');
      if(update){update.classList.remove('show');update.hidden=true;}
      document.body.classList.remove('updateLogOpen');
      const prompt=document.getElementById('tutorialPrompt');
      if(prompt)prompt.hidden=true;
    });

    stage='install LOCAL fixture';
    await page.evaluate(async()=>{
      const id='local-auto-browser-test';
      const existing=await window.CircleMixLocalSongs.get(id).catch(()=>null);
      if(existing)await window.CircleMixLocalSongs.delete(id,{withBackup:true});
      const now=new Date().toISOString();
      const chart={format:'circle-mix-chart',formatVersion:1,id:'normal',bpm:120,offset:0,notes:[{id:'cut-1',type:'cut',beat:1,angle:0}]};
      const record={
        id,source:'local',title:'LOCAL AUTO TEST',artist:'CIRCLE MIX TEST',bpm:120,offset:0,
        audioBlob:new Blob([new Uint8Array([82,73,70,70,0,0,0,0,87,65,86,69])],{type:'audio/wav'}),
        packageType:'full',packageVersion:1,charts:{normal:chart},difficultyOrder:['normal'],
        difficulties:{normal:{id:'normal',label:'NORMAL'}},installedAt:now,updatedAt:now
      };
      await window.CircleMixLocalSongs.put(record);
      await window.CircleMixSongRegistry.refreshLocal();
      await window.CircleMixOpenLocalSong(id);
    });

    const selector='[data-auto-play]';
    stage='wait for LOCAL AUTO button';
    await page.locator(selector).waitFor({state:'visible',timeout:5000});
    await waitForAuto(page,false,'initial');

    stage='normal click ON';
    await page.locator(selector).click();
    await waitForAuto(page,true,'normal click on');
    stage='normal click OFF';
    await page.locator(selector).click();
    await waitForAuto(page,false,'normal click off');

    stage='pointer release fallback';
    await page.evaluate(selector=>{
      const original=document.querySelector(selector);
      const clone=original.cloneNode(true);
      original.replaceWith(clone);
      const init={bubbles:true,cancelable:true,pointerId:91,pointerType:'mouse',isPrimary:true};
      clone.dispatchEvent(new PointerEvent('pointerdown',init));
      clone.dispatchEvent(new PointerEvent('pointerup',init));
    },selector);
    await waitForAuto(page,true,'pointer release fallback');

    stage='page errors';
    assert.deepEqual(errors,[],`LOCAL AUTO browser page errors: ${JSON.stringify(errors)}`);
    console.log('LOCAL AUTO browser regression passed');
  }catch(error){
    const report={stage,error:{message:error?.message||String(error),stack:error?.stack||null},errors,snapshot:null};
    if(page){
      try{report.snapshot=await autoSnapshot(page);}catch(snapshotError){report.snapshotError=snapshotError.message;}
    }
    console.error('LOCAL_AUTO_BROWSER_FAILURE',JSON.stringify(report));
    if(artifactDir){
      fs.mkdirSync(artifactDir,{recursive:true});
      fs.writeFileSync(path.join(artifactDir,'local-auto-browser-failure.json'),JSON.stringify(report,null,2));
      if(page)await page.screenshot({path:path.join(artifactDir,'local-auto-browser-failure.png'),fullPage:true}).catch(()=>{});
    }
    throw error;
  }finally{
    if(context)await context.close().catch(()=>{});
    if(browser)await browser.close().catch(()=>{});
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
