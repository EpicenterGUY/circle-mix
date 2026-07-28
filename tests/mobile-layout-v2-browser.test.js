'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'src/mobile-layout-v2.js'),'utf8');
const css=fs.readFileSync(path.join(root,'mobile-layout-v2.css'),'utf8');

function html(){return `<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>html,body{margin:0;width:100%;height:100%;background:#06101d}#game{position:fixed;inset:0;width:100%;height:100%;touch-action:none}${css}</style></head><body class="safeGame"><canvas id="game"></canvas><button id="pauseSetMobileLayout">OLD LAYOUT</button><button id="pauseSetMobileReset">OLD RESET</button><button id="pauseSetMobileExport">OLD EXPORT</button><div class="mobileGameplayControls"><button id="mobileActionBtn" class="mobilePlayBtn mobileActionBtn">ACTION</button><button id="mobilePulseBtn" class="mobilePlayBtn mobilePulseBtn">PULSE</button><button id="mobileScratchBtn" class="mobilePlayBtn mobileScratchBtn">SCRATCH</button></div><script>window.__legacyLayoutClicks=0;window.__aimEvents=[];window.CircleMixBuildConfig={target:'android'};document.getElementById('pauseSetMobileLayout').addEventListener('click',()=>window.__legacyLayoutClicks++);for(const type of ['pointerdown','pointermove','pointerup'])document.getElementById('game').addEventListener(type,event=>window.__aimEvents.push({type,clientX:event.clientX,clientY:event.clientY,pointerId:event.pointerId,pointerType:event.pointerType}));window.CircleMixVersion={version:'0.9.48'};</script><script>${js}</script></body></html>`;}
const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html());});

(async()=>{
  let browser;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
    await page.goto(`http://127.0.0.1:${server.address().port}/?mobileLayoutV2=1`);
    await page.waitForFunction(()=>!!window.CircleMixMobileLayoutV2TestApi);
    assert.equal(await page.locator('#mobileScratchBtn').isHidden(),true);
    assert.match(await page.locator('#pauseSetMobileLayout').textContent(),/AIM \/ ACTION \/ PULSE/);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('circleMixInputSettings.v1')).mobileAimPreset),'BALANCED');

    const relative=await page.evaluate(()=>{
      const canvas=document.getElementById('game');
      const fire=(type,pointerId,clientX,clientY)=>canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId,clientX,clientY,buttons:type==='pointerup'?0:1}));
      fire('pointerdown',21,760,195);
      fire('pointermove',21,760,255);
      fire('pointerup',21,760,255);
      const afterFirst=window.__aimEvents.slice();
      fire('pointerdown',22,80,195);
      const afterRecontact=window.__aimEvents.slice();
      fire('pointerup',22,80,195);
      const angle=event=>Math.atan2(event.clientY-195,event.clientX-422);
      return {
        events:window.__aimEvents,
        movedAngle:angle(afterFirst.find(event=>event.type==='pointermove')),
        firstEndAngle:angle(afterFirst.filter(event=>event.type==='pointerup').at(-1)),
        recontactAngle:angle(afterRecontact.filter(event=>event.type==='pointerdown').at(-1))
      };
    });
    assert.deepEqual(relative.events.map(event=>event.pointerType),Array(relative.events.length).fill('touch'));
    assert.ok(relative.movedAngle>.05,'relative drag rotates the virtual aim');
    assert.ok(Math.abs(relative.recontactAngle-relative.firstEndAngle)<.08,'recontact keeps the previous virtual aim angle');

    await page.locator('#pauseSetMobileLayout').click();
    await page.waitForFunction(()=>!document.getElementById('mobileLayoutV2Overlay').hidden);
    assert.equal(await page.evaluate(()=>window.__legacyLayoutClicks),0,'legacy ACTION/SCRATCH editor listener is removed');

    const preview=await page.locator('#mobileLayoutV2Preview').boundingBox();
    const action=await page.locator('#mobileLayoutV2Action').boundingBox();
    assert.ok(preview&&action);
    await page.mouse.move(action.x+action.width/2,action.y+action.height/2);
    await page.mouse.down();
    await page.mouse.move(preview.x+preview.width*.64,preview.y+preview.height*.70,{steps:5});
    await page.mouse.up();

    const pulse=await page.locator('#mobileLayoutV2Pulse').boundingBox();
    assert.ok(pulse);
    await page.mouse.move(pulse.x+pulse.width/2,pulse.y+pulse.height/2);
    await page.mouse.down();
    await page.mouse.move(preview.x+preview.width*.24,preview.y+preview.height*.72,{steps:5});
    await page.mouse.up();
    await page.locator('#mobileLayoutV2PulseUp').click();
    await page.locator('#mobileLayoutV2OpacityDown').click();
    await page.locator('#mobileAimPreset').click();
    await page.locator('#mobileAimSensitivityUp').click();

    const draft=await page.evaluate(()=>window.CircleMixMobileLayoutV2TestApi.state().draft);
    assert.equal(draft.mobileControlPreset,'CUSTOM');
    assert.ok(draft.mobileActionX>.55&&draft.mobileActionX<.75);
    assert.ok(draft.mobilePulseX>.15&&draft.mobilePulseX<.35);
    assert.equal(draft.mobilePulseSize,100);
    assert.ok(draft.mobileButtonOpacity<.68);
    assert.equal(draft.mobileAimPreset,'PRECISION');
    assert.ok(draft.mobileAimSensitivity>.82);

    await page.locator('#mobileLayoutV2Save').click();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('circleMixInputSettings.v1')));
    assert.equal(saved.mobileControlPreset,'CUSTOM');
    assert.ok(Number.isFinite(saved.mobilePulseX)&&Number.isFinite(saved.mobilePulseY));
    assert.equal(saved.mobilePulseSize,100);
    assert.equal(saved.mobileAimPreset,'PRECISION');
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--mobile-pulse-size').trim()),'100px');
    const firstX=Number((await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--mobile-action-x'))).replace('px',''));

    await page.setViewportSize({width:700,height:390});
    await page.waitForTimeout(80);
    const resizedX=Number((await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--mobile-action-x'))).replace('px',''));
    assert.ok(resizedX<firstX&&Math.abs(resizedX-saved.mobileActionX*700)<2,'normalized ACTION position follows viewport resize');

    const beforeCancel=await page.evaluate(()=>localStorage.getItem('circleMixInputSettings.v1'));
    await page.locator('#pauseSetMobileLayout').click();
    await page.locator('#mobileLayoutV2Preset').click();
    await page.locator('#mobileLayoutV2Cancel').click();
    assert.equal(await page.evaluate(()=>localStorage.getItem('circleMixInputSettings.v1')),beforeCancel,'cancel preserves saved layout');
    console.log('mobile layout v2 and relative aim browser regression passed');
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
