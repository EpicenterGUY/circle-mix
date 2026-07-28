'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const ui=fs.readFileSync(path.join(root,'src/ui.js'),'utf8');
const tablet=fs.readFileSync(path.join(root,'src/trackpad-tablet-area.js'),'utf8');
const css=fs.readFileSync(path.join(root,'trackpad-tablet-area.css'),'utf8');

function html(){return `<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#06101d}#game{position:fixed;inset:0;width:100%;height:100%}.pcSettingsHub{position:fixed;left:8px;top:8px;z-index:20;width:300px;background:#071228;color:white}.pcSettingsGrid{display:grid;gap:4px}.pcSettingCard{display:flex;justify-content:space-between;padding:4px;border:1px solid #345}.pcSettingCopy p{margin:0;font-size:10px}${css}</style></head><body class="safeGame"><canvas id="game" width="800" height="500"></canvas><div id="gameRoot"></div><div id="pcSettingsHub" class="pcSettingsHub" data-platform="desktop"><button class="pcSettingsNavButton" data-group="input">INPUT <em>0</em></button><section class="pcSettingsSection" data-group="input"><div class="pcSettingsGrid"></div></section><button class="pcSettingsNavButton" data-group="system">SYSTEM <em>0</em></button><section class="pcSettingsSection" data-group="system"><div class="pcSettingsGrid"></div></section></div><button id="pauseSetPcAim">PC AIM ABSOLUTE</button><button id="pauseSetAimStabilizer">AIM STABILIZER OFF</button><button id="pauseSetAimVisual">AIM VISUAL DIRECT</button><button id="pauseSetLockedSensitivity">LOCKED SENS 1.00</button><script>window.CircleMixBuildConfig={target:'desktop'};localStorage.setItem('circleMixTrackpadSettings.v1',JSON.stringify({preset:'TABLET_AREA',keyboardOnly:true,jumpGuard:false,gestureGuard:true}));localStorage.setItem('circleMixTrackpadTabletArea.v1',JSON.stringify({x:.18,y:.12,width:.64,height:.76,rotation:0,mirrorX:false,mirrorY:false,deadzone:0}));window.__mapped=[];window.addEventListener('pointermove',event=>{if(!event.isTrusted)window.__mapped.push({x:event.clientX,y:event.clientY});});</script><script>${ui}</script><script>${tablet}</script></body></html>`;}
const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html());});

(async()=>{
  let browser;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:800,height:500}});
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(()=>!!window.CircleMixTrackpadTabletArea?.state&&!!window.CircleMixTrackpad?.getSettings);
    assert.equal(await page.evaluate(()=>window.CircleMixTrackpad.getSettings().preset),'TABLET_AREA');
    assert.ok(await page.locator('[data-setting="trackpadTabletArea"]').count());

    await page.mouse.move(655,250);
    await page.waitForFunction(()=>window.__mapped.length>0);
    let mapped=await page.evaluate(()=>window.__mapped.at(-1));
    assert.ok(Math.abs(mapped.x-570)<3,`right edge maps to right ring: ${mapped.x}`);
    assert.ok(Math.abs(mapped.y-250)<3,`right edge keeps vertical center: ${mapped.y}`);

    await page.mouse.move(400,439);
    await page.waitForTimeout(30);
    mapped=await page.evaluate(()=>window.__mapped.at(-1));
    assert.ok(Math.abs(mapped.x-400)<3,`bottom center keeps horizontal center: ${mapped.x}`);
    assert.ok(Math.abs(mapped.y-420)<3,`bottom center maps to bottom ring: ${mapped.y}`);

    await page.locator('[data-setting="trackpadTabletArea"] button').click();
    await page.waitForFunction(()=>!document.getElementById('trackpadTabletOverlay').hidden);
    await page.locator('#trackpadTabletRotate').click();
    await page.locator('#trackpadTabletSave').click();
    await page.waitForFunction(()=>document.getElementById('trackpadTabletOverlay').hidden);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('circleMixTrackpadTabletArea.v1')));
    assert.equal(saved.rotation,90);
    assert.equal(await page.evaluate(()=>window.CircleMixTrackpad.getSettings().preset),'TABLET_AREA');
    console.log('trackpad tablet area browser regression passed');
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
