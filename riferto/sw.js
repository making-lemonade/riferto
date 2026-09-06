const CACHE='riferto-v0.13.6';
const STATIC=['./styles.css?v=0.13.6','./design-0133.css?v=0.13.6','./pin-guard.js?v=0.13.6','./ui-nav.js?v=0.13.6','./bootstrap.js?v=0.13.6','./setup-security.js?v=0.13.6','./app.js?v=0.13.6','./family-core.js?v=0.13.6','./responsive-family-ui.js?v=0.13.6','./settings-info-0131.js?v=0.13.6','./update-source-0134.js?v=0.13.6','./biometric.js?v=0.13.6','./credential-ui.js?v=0.13.6','./storage-backup.js?v=0.13.6','./backup-package-0132.js?v=0.13.6','./backup-mode-0132.js?v=0.13.6','./backup-guard.js?v=0.13.6','./loinc-search.js?v=0.13.6','./reports-search.js?v=0.13.6','./report-view-guard.js?v=0.13.6','./canonical-backfill.js?v=0.13.6','./trend.js?v=0.13.6','./trend-matrix-polish.js?v=0.13.6','./settings-accordion.js?v=0.13.6','./polish-0121.js?v=0.13.6','./report-polish-0122.js?v=0.13.6','./update-badge-ui.js?v=0.13.6','./manifest.webmanifest?v=0.13.6','./icon-riferto.svg?v=0.13.6','./loinc-common.json','./changelog.html'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('riferto-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request;
  const url=new URL(req.url);
  if(url.pathname.endsWith('/version.json')){event.respondWith(fetch(req,{cache:'no-store'}));return}
  if(req.mode==='navigate'){
    event.respondWith(caches.open(CACHE).then(cache=>cache.match('./index.html')).then(cached=>cached||fetch(req,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r})));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));return r})));
});