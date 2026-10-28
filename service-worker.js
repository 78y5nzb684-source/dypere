/* DYPERE 3.0.6 beta | image repair 20261020-bilder2. Never changes answer storage. */
const CACHE = 'dypere-3-0-6-beta-r1';
const ASSETS = [
  "./",
  "./bildeprompts-extra.js?build=3.0.6-beta-r1",
  "./bildeutfordring.html",
  "./bli-kjent.html",
  "./board-cards.js?build=3.0.6-beta-r1",
  "./board-decks.js?build=3.0.6-beta-r1",
  "./board-game.js?build=3.0.6-beta-r1",
  "./brettspill.html",
  "./card-editor-v2.js?build=3.0.6-beta-r1",
  "./card-store.js?build=3.0.6-beta-r1",
  "./evening.js?build=3.0.6-beta-r1",
  "./ffm.html",
  "./game-engine.js?build=3.0.6-beta-r1",
  "./hemmelig-match.html",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./index.html",
  "./interface.css?build=3.0.6-beta-r1",
  "./interface.js?build=3.0.6-beta-r1",
  "./journey-bank.js?build=3.0.6-beta-r1",
  "./journey-engine.js?build=3.0.6-beta-r1",
  "./journey.css?build=3.0.6-beta-r1",
  "./journey.js?build=3.0.6-beta-r1",
  "./kapittel-ii.html",
  "./kapittel-iii.html",
  "./kapittel-iv.html",
  "./kapittel-v.html",
  "./kortpakker.html",
  "./kortverksted.html",
  "./kveldsmikser.html",
  "./kveldsspill.html",
  "./lek-sammen.html",
  "./lek.html",
  "./manifest.webmanifest",
  "./match-game.js?build=3.0.6-beta-r1",
  "./onskeliste.html",
  "./ornaments/bilde.svg",
  "./ornaments/bilde_ornate.svg",
  "./ornaments/dare.svg",
  "./ornaments/dare_ornate.svg",
  "./ornaments/punishment.svg",
  "./ornaments/punishment_ornate.svg",
  "./ornaments/quiz.svg",
  "./ornaments/quiz_ornate.svg",
  "./ornaments/terninger.svg",
  "./ornaments/terninger_ornate.svg",
  "./ornaments/truth.svg",
  "./ornaments/truth_ornate.svg",
  "./pa-kanten-meny.html",
  "./pa-kanten-quiz.html",
  "./pa-kanten.html",
  "./packs.js?build=3.0.6-beta-r1",
  "./party-game.js?build=3.0.6-beta-r1",
  "./play-cards.js?build=3.0.6-beta-r1",
  "./play-common.js?build=3.0.6-beta-r1",
  "./play-studio.css?build=3.0.6-beta-r1",
  "./position-gallery.css?build=3.0.6-beta-r1",
  "./position-gallery.js?build=3.0.6-beta-r1",
  "./punishment-home.js?build=3.0.6-beta-r1",
  "./punishment.html",
  "./quick-photo-v2.js?build=3.0.6-beta-r1",
  "./quiz.html",
  "./release-polish.css?build=3.0.6-beta-r1",
  "./spill.html",
  "./spillbank.js?build=3.0.6-beta-r1",
  "./stillinger-bdsm.html",
  "./stillinger-bdsm/01_Kneeling.png",
  "./stillinger-bdsm/02_Over_the_Knee.png",
  "./stillinger-bdsm/03_Wrist_to_Ankle.png",
  "./stillinger-bdsm/04_Matanawa.png",
  "./stillinger-bdsm/05_Box_Tie.png",
  "./stillinger-bdsm/06_Hip_Harness.png",
  "./stillinger-bdsm/07_Suspension.png",
  "./stillinger-bdsm/08_Yoke.png",
  "./stillinger-bdsm/09_Ball_Tie.png",
  "./stillinger-bdsm/10_Mummification.png",
  "./stillinger-bdsm/11_Spreader_Bar.png",
  "./stillinger-bdsm/12_Standing_Spread.png",
  "./stillinger-bdsm/13_Spread_Eagle.png",
  "./stillinger-bdsm/14_Chair.png",
  "./stillinger-bdsm/15_Crab_Tie.png",
  "./stillinger-bdsm/16_Hogtie.png",
  "./stillinger-bdsm/17_Frog_Tie.png",
  "./stillinger-bdsm/18_Pet_Play.png",
  "./stillinger-bdsm/19_Chest_Harness.png",
  "./stillinger-bdsm/20_Face_Down.png",
  "./stillinger-klassisk.html",
  "./stillinger.html",
  "./stillinger/01_Missionary.png",
  "./stillinger/02_Doggy_Style.png",
  "./stillinger/03_Flat_Iron.png",
  "./stillinger/04_Face_Off.png",
  "./stillinger/05_Cowgirl.png",
  "./stillinger/06_Reverse_Cowgirl.png",
  "./stillinger/07_Spooning.png",
  "./stillinger/08_CAT.png",
  "./stillinger/09_Stand_Deliver.png",
  "./stillinger/10_Seashell.png",
  "./stillinger/11_Lotus.png",
  "./stillinger/12_Happy_Baby.png",
  "./stillinger/13_Pearly_Gates.png",
  "./stillinger/14_Pretzel.png",
  "./stillinger/15_Leapfrog.png",
  "./stillinger/16_Ballet_Dancer.png",
  "./stillinger/17_Little_Dipper.png",
  "./stillinger/18_Standing_Wheelbarrow.png",
  "./stillinger/19_Pinball_Wizard.png",
  "./stillinger/20_Waterfall.png",
  "./stillinger/21_Hot_Seat.png",
  "./stillinger/22_Stairway_to_Heaven.png",
  "./stillinger/23_Butter_Churner.png",
  "./stillinger/24_Yourself_on_the_Shelf.png",
  "./stillinger/25_Mountain_Climber.png",
  "./terninger.html",
  "./var-stund.html",
  "./wishlist.js?build=3.0.6-beta-r1"
];
const assetURLs = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));
const core = ASSETS.filter(path => !/\.(png|svg)$/i.test(path));
const media = ASSETS.filter(path => /\.(png|svg)$/i.test(path));
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const request = path => new Request(new URL(path, self.registration.scope), {cache:'reload'});
    // Required pages/scripts are atomic. Media are cached independently.
    await cache.addAll(core.map(request));
    const remaining = media.slice();
    await Promise.all(Array.from({length:4}, async () => {
      while (remaining.length) {
        const path = remaining.shift();
        const req = request(path);
        try { await cache.add(req); }
        catch (error) {
          const previous = await caches.match(req);
          if (previous && previous.ok) await cache.put(req, previous);
          else console.warn('DYPERE: media not cached', path);
        }
      }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('dypere-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  let cacheKey = event.request.url;
  if (event.request.mode === 'navigate') {
    const url = new URL(cacheKey);
    const scope = new URL(self.registration.scope);
    const canonical = new URL(url.pathname, url.origin).href;
    if (url.origin === scope.origin && assetURLs.has(canonical)) cacheKey = canonical;
  }
  if (!assetURLs.has(cacheKey)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request, {cache: 'no-cache'});
      if (response.ok) {
        await cache.put(cacheKey, response.clone()).catch(() => {});
        return response;
      }
      return (await cache.match(cacheKey)) || response;
    } catch (error) {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
      return new Response('Ikke tilgjengelig uten nett. Åpne appen med nettilkobling først.', {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
