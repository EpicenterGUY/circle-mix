'use strict';
const fs=require('node:fs');

function read(path){return fs.readFileSync(path,'utf8');}
function write(path,content){fs.writeFileSync(path,content);}
function replaceOnce(source,from,to,label){
  if(!source.includes(from))throw new Error(`missing ${label}`);
  return source.replace(from,to);
}

let version=read('src/version.js');
version=version.replace('version: "0.9.30"','version: "0.9.31"')
  .replace('buildDate: "2026-07-23"','buildDate: "2026-07-24"')
  .replace('cacheRevision: "20260723-fold-landscape-v1-1"','cacheRevision: "20260724-mobile-pwa-stability-v1"');
write('src/version.js',version);

let changelog=read('src/changelog.js');
if(!changelog.includes('version: "0.9.31"')){
  const entry=`  { version: "0.9.31", date: "2026-07-24", title: "MOBILE PWA STABILITY", summary: "폴더블·가로 화면 전환과 PWA 업데이트 적용 흐름을 안정화했습니다.", changes: [\n    { category: "MOBILE", text: "visualViewport 기반 화면 크기·위치 동기화로 폴드/펼침, 주소창 변화와 가로모드에서 메뉴·HUD·터치 버튼 배치를 즉시 갱신" },\n    { category: "LOCAL", text: "짧은 가로 화면에서도 LOCAL 탭, .cmix 가져오기와 PLAY 영역이 화면 안에서 스크롤 가능하고 접근 가능하도록 정리" },\n    { category: "PWA", text: "대기 중 업데이트가 플레이·오프라인 다운로드 중임을 명확히 표시하고 안전한 시점에 적용한 뒤 한 번만 새로고침" },\n    { category: "CACHE", text: "새 서비스워커 활성 버전을 열린 앱에 통지하고 0.9.31 앱 셸 캐시로 확실히 전환" }\n  ] },\n`;
  changelog=replaceOnce(changelog,'window.CircleMixChangelog = [\n',`window.CircleMixChangelog = [\n${entry}`,'changelog insertion');
}
write('src/changelog.js',changelog);

let sw=read('service-worker.js');
const oldActivate='self.addEventListener("activate", event=>{ event.waitUntil((async()=>{ const keys=await caches.keys(); await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX) && ![APP_CACHE,MEDIA_CACHE].includes(k)).map(k=>caches.delete(k))); await self.clients.claim(); })()); });';
const newActivate=`async function announceRelease(){\n  const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});\n  for(const client of windows) client.postMessage({type:"RELEASE_ACTIVE",version:VERSION,revision:CACHE_REVISION});\n}\nself.addEventListener("activate", event=>{ event.waitUntil((async()=>{ const keys=await caches.keys(); await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX) && ![APP_CACHE,MEDIA_CACHE].includes(k)).map(k=>caches.delete(k))); await self.clients.claim(); await announceRelease(); })()); });`;
sw=replaceOnce(sw,oldActivate,newActivate,'service worker activate');
write('service-worker.js',sw);

let pwaTest=read('tests/pwa-update.test.js');
pwaTest=pwaTest.replace('assert.equal(browser.window.CircleMixVersion.version, "0.9.30");','assert.equal(browser.window.CircleMixVersion.version, "0.9.31");');
if(!pwaTest.includes('mobile viewport and guarded update flow')){
  pwaTest+=`\n\ntest("mobile viewport and guarded update flow are present", () => {\n  assert.match(pwaSource, /window\\.visualViewport\\?\\.addEventListener\\("resize"/);\n  assert.match(pwaSource, /--app-height/);\n  assert.match(pwaSource, /mobileShortLandscape/);\n  assert.match(pwaSource, /function canApplyUpdate\\(\\)/);\n  assert.match(pwaSource, /UPDATE AFTER PLAY/);\n  assert.match(pwaSource, /RELOAD_GUARD_KEY/);\n  assert.match(serviceWorkerSource, /async function announceRelease\\(\\)/);\n  assert.match(serviceWorkerSource, /type:"RELEASE_ACTIVE"/);\n});\n`;
}
write('tests/pwa-update.test.js',pwaTest);

const browserTest=`'use strict';\nconst assert=require('node:assert/strict');\nconst fs=require('node:fs');\nconst http=require('node:http');\nconst path=require('node:path');\nconst {chromium}=require('playwright');\nconst MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg'};\nfunction server(root){const base=path.resolve(root);const app=http.createServer((req,res)=>{const rel=new URL(req.url,'http://127.0.0.1').pathname==='/'?'index.html':decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\\/+/, '');const file=path.resolve(base,rel);if(file!==base&&!file.startsWith(base+path.sep)){res.writeHead(403);return res.end();}fs.stat(file,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);});});return new Promise((resolve,reject)=>{app.once('error',reject);app.listen(0,'127.0.0.1',()=>resolve(app));});}\nasync function state(page){return page.evaluate(()=>({width:getComputedStyle(document.documentElement).getPropertyValue('--app-width').trim(),height:getComputedStyle(document.documentElement).getPropertyValue('--app-height').trim(),runtimeStyle:!!document.getElementById('circleMixMobileViewportRuntime'),expanded:document.body.classList.contains('foldExpanded'),landscape:document.body.classList.contains('mobileLandscape'),short:document.body.classList.contains('mobileShortLandscape'),api:!!window.CircleMixPWA?.syncViewport}));}\n(async()=>{const app=await server(process.cwd());let browser;try{browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(\`http://127.0.0.1:\${app.address().port}/index.html?browserTest=1\`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.CircleMixPWA?.syncViewport&&document.getElementById('circleMixMobileViewportRuntime'));await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--app-width').trim()==='844px');let s=await state(page);assert.equal(s.runtimeStyle,true);assert.equal(s.api,true);assert.equal(s.landscape,true);assert.equal(s.short,true);assert.equal(s.expanded,false);await page.setViewportSize({width:720,height:680});await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--app-width').trim()==='720px'&&document.body.classList.contains('foldExpanded'));s=await state(page);assert.equal(s.height,'680px');assert.equal(s.landscape,true);assert.equal(s.short,false);assert.equal(s.expanded,true);await page.setViewportSize({width:680,height:720});await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--app-height').trim()==='720px'&&!document.body.classList.contains('mobileLandscape'));s=await state(page);assert.equal(s.width,'680px');assert.equal(s.expanded,true);assert.equal(s.landscape,false);assert.deepEqual(errors,[]);await context.close();console.log('mobile viewport browser regression passed');}finally{if(browser)await browser.close().catch(()=>{});await new Promise(resolve=>app.close(resolve));}})().catch(error=>{console.error(error);process.exitCode=1;});\n`;
write('tests/mobile-viewport-browser.test.js',browserTest);

let pkg=read('package.json');
pkg=replaceOnce(pkg,'node tests/pwa-update.test.js"','node tests/pwa-update.test.js"','package static anchor');
if(!pkg.includes('tests/mobile-viewport-browser.test.js')){
  pkg=pkg.replace('node tests/mobile-song-select-layout.test.js && node tests/player-profile-browser.test.js','node tests/mobile-song-select-layout.test.js && node tests/mobile-viewport-browser.test.js && node tests/player-profile-browser.test.js');
}
write('package.json',pkg);
console.log('Applied mobile/PWA 0.9.31 release patch.');
