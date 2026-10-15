const CACHE = 'dypere-2026-01-v12-pwa-2';
const ASSETS = ['./','./index.html','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith('dypere-')&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin) return;
 event.respondWith(event.request.mode==='navigate' ? fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))) : caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
