/* Zeiterfassung – Offline-Speicher (Service Worker)
   Startseite: erst Netz (max. 3,5 s), sonst gespeicherte Fassung. Icons/Manifest: aus dem Speicher. */
const CACHE='zeiterfassung-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function timeout(p,ms){return new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('timeout')),ms);p.then(r=>{clearTimeout(t);res(r)},e=>{clearTimeout(t);rej(e)})})}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==location.origin)return;
  const isPage=req.mode==='navigate'||/\/(index\.html)?$/.test(url.pathname);
  if(isPage){
    e.respondWith((async()=>{const c=await caches.open(CACHE);
      try{const r=await timeout(fetch(req,{cache:'no-store'}),url.search?8000:3500);if(r&&r.ok&&!url.search)c.put('./index.html',r.clone());return r}
      catch(_){return (await c.match('./index.html'))||(await c.match('./'))||Response.error()}})());
    return}
  e.respondWith((async()=>{const c=await caches.open(CACHE);const hit=await c.match(req,{ignoreSearch:true});
    const net=fetch(req).then(r=>{if(r&&r.ok)c.put(req,r.clone());return r}).catch(()=>null);
    return hit||(await net)||Response.error()})());
});
