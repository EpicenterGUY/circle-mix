const VERSION = "0.9.0";
const CACHE_PREFIX = "circle-mix-v";
const APP_CACHE = `${CACHE_PREFIX}${VERSION}-app`;
const MEDIA_CACHE = `${CACHE_PREFIX}${VERSION}-media`;
const APP_SHELL_URLS = [
  "./",
  "./index.html",
  "./style.css?v=20260718-ghost-rule-1",
  "./manifest.webmanifest",
  "./icons/circle-mix-icon.svg",
  "./src/version.js?v=20260718-ghost-rule-1",
  "./src/changelog.js?v=20260718-ghost-rule-1",
  "./src/charts/ghost-rule.js?v=20260718-ghost-rule-1",
  "./src/songs.js?v=20260718-ghost-rule-1",
  "./src/chart.js?v=20260718-ghost-rule-1",
  "./src/audio.js?v=20260718-ghost-rule-1",
  "./src/effects.js?v=20260718-ghost-rule-1",
  "./src/ui.js?v=20260718-ghost-rule-1",
  "./src/input.js?v=20260718-ghost-rule-1",
  "./src/game.js?v=20260718-ghost-rule-1",
  "./src/pwa.js?v=20260718-ghost-rule-1"
];
// ANiMA uses the #embedded-anima <audio> element in index.html, so there is no
// separate built-in audio URL to fetch or cache for ANiMA; Ghost Rule uses external media cached below.
const BUILTIN_OFFLINE_URLS = [
  "./assets/audio/ghost-rule.mp3",
  "./assets/jackets/ghost-rule.jpg"
];
const REQUIRED_OFFLINE_URLS = [...APP_SHELL_URLS, ...BUILTIN_OFFLINE_URLS];
function sameOrigin(request){ return new URL(request.url).origin === self.location.origin; }
function cacheNameForUrl(url){ return BUILTIN_OFFLINE_URLS.includes(url) ? MEDIA_CACHE : APP_CACHE; }
async function putRequired(url, port, done, total){
  const cache = await caches.open(cacheNameForUrl(url));
  const cached = await cache.match(url, {ignoreSearch:false});
  if(cached?.ok && cached.status === 200) return {ok:true, reused:true};
  const response = await fetch(new Request(url, {cache:"reload"}));
  if(!response.ok || response.status !== 200) return {ok:false, url, status:response.status};
  await cache.put(url, response.clone());
  const verified = await cache.match(url, {ignoreSearch:false});
  return verified?.ok && verified.status === 200 ? {ok:true} : {ok:false, url, status:"missing-after-put"};
}
async function cacheRequired(port){
  const failures=[]; let done=0; const total=REQUIRED_OFFLINE_URLS.length;
  for(const url of REQUIRED_OFFLINE_URLS){
    try{ const result=await putRequired(url, port, done, total); if(!result.ok) failures.push(result); }
    catch(error){ failures.push({ok:false, url, status:error?.message || "fetch-failed"}); }
    done++; if(port) port.postMessage({type:"OFFLINE_PROGRESS", progress:Math.min(95, (done/Math.max(1,total))*95), done, total});
  }
  if(port) port.postMessage({type:"OFFLINE_VERIFYING"});
  const status = await offlineStatus();
  if(failures.length || !status.ready) throw {failures:[...failures, ...status.missing.map(url=>({url,status:"missing"}))], status};
  return status;
}
async function offlineStatus(){
  const missing=[]; let cachedCount=0;
  for(const url of REQUIRED_OFFLINE_URLS){
    const cache = await caches.open(cacheNameForUrl(url));
    const response = await cache.match(url, {ignoreSearch:false});
    if(response?.ok && response.status === 200) cachedCount++; else missing.push(url);
  }
  return {ready:missing.length===0, version:VERSION, requiredCount:REQUIRED_OFFLINE_URLS.length, cachedCount, missing, appCache:APP_CACHE, mediaCache:MEDIA_CACHE};
}
async function rangeResponse(request, response){
  const range = request.headers.get("Range");
  if(!range) return response;
  const size = Number(response.headers.get("Content-Length"));
  const buffer = await response.clone().arrayBuffer();
  const total = Number.isFinite(size) && size > 0 ? size : buffer.byteLength;
  const match = /bytes=(\d*)-(\d*)/.exec(range);
  if(!match) return response;
  let start = match[1] ? Number(match[1]) : 0;
  let end = match[2] ? Number(match[2]) : total - 1;
  if(!match[1] && match[2]){ const suffix=Number(match[2]); start=Math.max(0,total-suffix); end=total-1; }
  if(start >= total || end >= total || start > end) return new Response(null,{status:416,headers:{"Content-Range":`bytes */${total}`}});
  const body = buffer.slice(start, end + 1);
  const headers = new Headers(response.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Length", String(body.byteLength));
  return new Response(body, {status:206, statusText:"Partial Content", headers});
}
self.addEventListener("install", event=>{ event.waitUntil(cacheRequired().catch(()=>{})); });
self.addEventListener("activate", event=>{ event.waitUntil((async()=>{ const keys=await caches.keys(); await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX) && ![APP_CACHE,MEDIA_CACHE].includes(k)).map(k=>caches.delete(k))); await self.clients.claim(); })()); });
self.addEventListener("message", event=>{ const data=event.data||{}; const port=data.port || event.ports?.[0]; if(data.type==="SKIP_WAITING") self.skipWaiting(); if(data.type==="DOWNLOAD_OFFLINE") event.waitUntil(cacheRequired(port).then(status=>port&&port.postMessage({type:"OFFLINE_COMPLETE", status})).catch(error=>port&&port.postMessage({type:"OFFLINE_FAILED", failures:error?.failures || [], status:error?.status || null}))); if(data.type==="OFFLINE_STATUS") event.waitUntil(offlineStatus().then(status=>port&&port.postMessage(status))); });
self.addEventListener("fetch", event=>{
  const request=event.request; if(request.method!=="GET" || !sameOrigin(request) || request.url.startsWith("blob:")) return;
  const url=new URL(request.url); const accept=request.headers.get("accept")||"";
  if(request.mode==="navigate" || accept.includes("text/html")){
    event.respondWith(fetch(request).then(async response=>{ const cache=await caches.open(APP_CACHE); if(response.ok && response.status===200) cache.put("./index.html", response.clone()); return response; }).catch(async()=> (await caches.match("./index.html")) || (await caches.match("./")) || Response.error())); return;
  }
  const isStatic=/\.(?:js|css|png|jpg|jpeg|svg|webp|gif|json|webmanifest)$/i.test(url.pathname);
  const isAudio=/\.(?:mp3|ogg|wav|m4a)$/i.test(url.pathname);
  if(isStatic){ event.respondWith(caches.match(request).then(cached=>cached || fetch(request).then(async response=>{ if(response.ok && response.status===200){ const cache=await caches.open(APP_CACHE); cache.put(request,response.clone()); } return response; }))); return; }
  if(isAudio){ event.respondWith(caches.open(MEDIA_CACHE).then(cache=>cache.match(request, {ignoreSearch:false}).then(cached=> cached ? rangeResponse(request,cached) : fetch(request).then(async response=>{ if(response.ok && response.status===200) cache.put(request,response.clone()); return response; })))); }
});
