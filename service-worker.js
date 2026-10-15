const CACHE = 'dypere-2026-01-v12-pwa-1';
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
 event.respondWith(caches.match(event.request).then(cached=>cached || fetch(event.request)));
});
