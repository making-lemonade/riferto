const CACHE='riferto-v0.13.13';
const STATIC=['./styles.css?v=0.13.13','./design-0133.css?v=0.13.13','./share.js?v=0.13.13','./drive-backup.js?v=0.13.13','./pin-guard.js?v=0.13.13','./ui-nav.js?v=0.13.13','./bootstrap.js?v=0.13.13','./setup-security.js?v=0.13.13','./app.js?v=0.13.13','./family-core.js?v=0.13.13','./responsive-family-ui.js?v=0.13.13','./settings-info-0131.js?v=0.13.13','./update-source-0134.js?v=0.13.13','./biometric.js?v=0.13.13','./credential-ui.js?v=0.13.13','./storage-backup.js?v=0.13.13','./backup-package-0132.js?v=0.13.13','./backup-mode-0132.js?v=0.13.13','./backup-guard.js?v=0.13.13','./loinc-search.js?v=0.13.13','./reports-search.js?v=0.13.13','./report-view-guard.js?v=0.13.13','./canonical-backfill.js?v=0.13.13','./trend.js?v=0.13.13','./trend-matrix-polish.js?v=0.13.13','./settings-accordion.js?v=0.13.13','./polish-0121.js?v=0.13.13','./report-polish-0122.js?v=0.13.13','./update-badge-ui.js?v=0.13.13','./manifest.webmanifest?v=0.13.13','./icon-riferto.svg?v=0.13.13','./assets/buymeacoffee.svg?v=0.13.13','./loinc-common.json','./changelog.html'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('riferto-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request;
  const url=new URL(req.url);
  // Never cache cross-origin Google OAuth or Drive requests (especially authorized responses).
  if(url.origin!==self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  if(url.pathname.endsWith('/version.json')){event.respondWith(fetch(req,{cache:'no-store'}));return}
  if(req.mode==='navigate'){
    event.respondWith(caches.open(CACHE).then(cache=>cache.match('./index.html')).then(cached=>cached||fetch(req,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r})));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));return r})));
});