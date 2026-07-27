'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'src/pc-settings.js'),'utf8');
const css=fs.readFileSync(path.join(root,'pc-settings.css'),'utf8');
const ids=[
  'safeSettingsBtn','quickSettingsBtn','settingsBtn',
  'speedDown','speedUp','speedValue','offsetDown','offsetUp','offsetValue',
  'musicDown','musicUp','musicValue','sfxDown','sfxUp','sfxValue',
  'fullToggle','pauseSetFull','safeSetFull','autoToggle','pauseSetAuto','safeSetAuto',
  'pauseSetPcAim','pauseSetLockedSensitivity','pauseSetAimStabilizer','pauseSetAimVisual','pauseSetVisualResponse','keymapToggle','safeSetKeymap',
  'pauseSetNoteContrast','pauseSetPathBrightness','pauseSetEffectIntensity','pauseSetJudgeGuide','pauseSetMobileQuality','pauseSetHaptic',
  'pauseSetMobileLayout','pauseSetMobileInputTest','pauseSetMobileExport','pauseSetMobileReset',
  'debugToggle','pauseSetUpdateLog','safeSetUpdateLog','safeOrbit','pauseOverlay','pauseSettingsOverlay','safeOverlay'
];
function html(){
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${ids.map(id=>id.endsWith('Value')?`<span id="${id}">${id==='speedValue'?'0.60s':'50%'}</span>`:`<button id="${id}">${id}</button>`).join('')}<script>window.__clicks={};for(const id of ${JSON.stringify(ids)}){const el=document.getElementById(id);if(el&&el.tagName==='BUTTON')el.addEventListener('click',()=>{window.__clicks[id]=(window.__clicks[id]||0)+1;if(id==='pauseSetPcAim')el.textContent=el.textContent.includes('LOCKED')?'PC AIM AUTO':'PC AIM LOCKED';if(id==='pauseSetMobileQuality')el.textContent=el.textContent.includes('HIGH')?'MOBILE QUALITY AUTO':'MOBILE QUALITY HIGH';if(id==='autoToggle'){const on=el.getAttribute('aria-pressed')!=='true';el.setAttribute('aria-pressed',String(on));el.textContent=on?'AUTO ON':'AUTO OFF';}})}</script><script>${js}</script></body></html>`;
}
const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html());});
(async()=>{
  let browser;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    browser=await chromium.launch({headless:true});
    const base=`http://127.0.0.1:${server.address().port}/`;

    const desktop=await browser.newPage({viewport:{width:1280,height:800}});
    await desktop.goto(`${base}?pcSettings=1`);
    await desktop.waitForSelector('#pcSettingsHub',{state:'attached'});
    assert.equal(await desktop.locator('#safeOrbit').textContent(),'ORBIT · EXPERIMENTAL');
    await desktop.locator('#quickSettingsBtn').click();
    await desktop.waitForFunction(()=>!document.getElementById('pcSettingsHub').hidden);
    assert.equal(await desktop.locator('.pcSettingsNavButton').count(),6);
    assert.equal(await desktop.locator('[data-setting="speed"]').count(),1);
    assert.equal(await desktop.locator('[data-setting^="mobile"]').count(),0);
    await desktop.locator('.pcSettingsNavButton[data-group="input"]').click();
    await desktop.locator('[data-setting="pcAim"] .pcSettingAction').click();
    assert.equal(await desktop.evaluate(()=>window.__clicks.pauseSetPcAim),1);
    await desktop.locator('[data-setting="keymap"] .pcSettingAction').click();
    assert.equal(await desktop.evaluate(()=>window.__clicks.keymapToggle),1);
    assert.equal(await desktop.locator('#pcSettingsHub').getAttribute('hidden'),'');
    await desktop.locator('#quickSettingsBtn').click();
    await desktop.waitForFunction(()=>!document.getElementById('pcSettingsHub').hidden);
    await desktop.locator('#pcSettingsSearch').fill('타격음');
    assert.equal(await desktop.locator('.pcSettingCard:not([hidden])').count(),1);
    assert.equal(await desktop.locator('.pcSettingCard:not([hidden])').getAttribute('data-setting'),'sfx');
    await desktop.keyboard.press('Escape');
    assert.equal(await desktop.locator('#pcSettingsHub').getAttribute('hidden'),'');

    const mobile=await browser.newPage({viewport:{width:884,height:500},isMobile:true,hasTouch:true});
    await mobile.goto(`${base}?settingsPlatform=mobile`);
    await mobile.waitForSelector('#pcSettingsHub',{state:'attached'});
    await mobile.locator('#safeSettingsBtn').click();
    await mobile.waitForFunction(()=>!document.getElementById('pcSettingsHub').hidden);
    assert.equal(await mobile.locator('#pcSettingsHub').getAttribute('data-platform'),'mobile');
    assert.equal(await mobile.locator('[data-setting="mobileQuality"]').count(),1);
    assert.equal(await mobile.locator('[data-setting="mobileLayout"]').count(),1);
    assert.equal(await mobile.locator('[data-setting="pcAim"]').count(),0);
    await mobile.locator('.pcSettingsNavButton[data-group="display"]').click();
    const scroll=await mobile.locator('#pcSettingsContent').evaluate(el=>({overflowY:getComputedStyle(el).overflowY,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,touchAction:getComputedStyle(el).touchAction}));
    assert.equal(scroll.overflowY,'auto');
    assert.equal(scroll.touchAction,'pan-y');
    assert.ok(scroll.scrollHeight>0&&scroll.clientHeight>0);
    await mobile.locator('[data-setting="mobileQuality"] .pcSettingAction').click();
    assert.equal(await mobile.evaluate(()=>window.__clicks.pauseSetMobileQuality),1);
    await mobile.locator('#pcSettingsClose').click();

    await mobile.locator('#settingsBtn').click();
    await mobile.waitForFunction(()=>!document.getElementById('pcSettingsHub').hidden);
    assert.equal(await mobile.locator('#pcSettingsHub').evaluate(el=>el.classList.contains('isQuickMode')),true);
    assert.equal(await mobile.locator('#pcSettingsNav').evaluate(el=>getComputedStyle(el).display),'none');
    assert.equal(await mobile.locator('[data-setting="speed"]').evaluate(el=>el.hidden),false);
    assert.equal(await mobile.locator('[data-setting="mobileQuality"]').evaluate(el=>el.hidden),false);
    assert.equal(await mobile.locator('[data-setting="pathBrightness"]').evaluate(el=>el.hidden),true);
    assert.equal(await mobile.locator('#pcSettingsFooterText').textContent(), '플레이 중에는 핵심 설정만 표시됩니다. 전체 설정은 타이틀 SETTINGS에서 변경하세요.');

    console.log('unified settings hub browser regression passed');
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
