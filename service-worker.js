const VERSION = "0.8.2";
const CACHE_PREFIX = "circle-mix-v";
const APP_CACHE = `${CACHE_PREFIX}${VERSION}-app`;
const RUNTIME_CACHE = `${CACHE_PREFIX}${VERSION}-runtime`;
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./style.css?v=20260718-pwa-1",
  "./manifest.webmanifest",
  "./icons/circle-mix-icon.svg",
  "./src/version.js?v=20260718-pwa-1",
  "./src/changelog.js?v=20260718-pwa-1",
  "./src/songs.js?v=20260718-pwa-1",
  "./src/chart.js?v=20260718-pwa-1",
  "./src/audio.js?v=20260718-pwa-1",
  "./src/effects.js?v=20260718-pwa-1",
  "./src/ui.js?v=20260718-pwa-1",
  "./src/input.js?v=20260718-pwa-1",
  "./src/game.js?v=20260718-pwa-1",
  "./src/pwa.js?v=20260718-pwa-1"
];
function sameOrigin(request){ return new URL(request.url).origin === self.location.origin; }
async function cacheExisting(cacheName, urls, port){
  const cache = await caches.open(cacheName); let done=0;
  for(const url of urls){
    try{ const response=await fetch(new Request(url,{cache:"reload"})); if(response.ok) await cache.put(url,response); }catch(e){}
    done++; if(port) port.postMessage({type:"OFFLINE_PROGRESS", progress:(done/urls.length)*100});
  }
}
self.addEventListener("install", event=>{ event.waitUntil(cacheExisting(APP_CACHE, PRECACHE_URLS)); });
self.addEventListener("activate", event=>{ event.waitUntil((async()=>{ const keys=await caches.keys(); await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX) && ![APP_CACHE,RUNTIME_CACHE].includes(k)).map(k=>caches.delete(k))); await self.clients.claim(); })()); });
self.addEventListener("message", event=>{ const data=event.data||{}; const port=data.port || event.ports?.[0]; if(data.type==="SKIP_WAITING") self.skipWaiting(); if(data.type==="DOWNLOAD_OFFLINE") event.waitUntil(cacheExisting(APP_CACHE, PRECACHE_URLS, port).then(()=>port&&port.postMessage({type:"OFFLINE_COMPLETE"})).catch(()=>port&&port.postMessage({type:"OFFLINE_FAILED"}))); if(data.type==="OFFLINE_STATUS") event.waitUntil(caches.open(APP_CACHE).then(async c=>{ const ready=await c.match("./index.html"); port&&port.postMessage({ready:!!ready}); })); });
self.addEventListener("fetch", event=>{
  const request=event.request; if(request.method!=="GET" || !sameOrigin(request) || request.url.startsWith("blob:")) return;
  const url=new URL(request.url); const accept=request.headers.get("accept")||"";
  if(request.mode==="navigate" || accept.includes("text/html")){
    event.respondWith(fetch(request).then(async response=>{ const cache=await caches.open(APP_CACHE); if(response.ok) cache.put("./index.html", response.clone()); return response; }).catch(async()=> (await caches.match("./index.html")) || (await caches.match("./")) || Response.error())); return;
  }
  const isStatic=/\.(?:js|css|png|jpg|jpeg|svg|webp|gif|json|webmanifest)$/i.test(url.pathname);
  const isAudio=/\.(?:mp3|ogg|wav|m4a)$/i.test(url.pathname);
  if(isStatic){ event.respondWith(caches.match(request).then(cached=>cached || fetch(request).then(async response=>{ if(response.ok){ const cache=await caches.open(APP_CACHE); cache.put(request,response.clone()); } return response; }))); return; }
  if(isAudio){ event.respondWith(caches.open(RUNTIME_CACHE).then(cache=>cache.match(request).then(cached=>cached || fetch(request).then(response=>{ if(response.ok) cache.put(request,response.clone()); return response; })))); }
});
