const CACHE='riferto-v0.13.15';
const STATIC=['./styles.css?v=0.13.15','./design-0133.css?v=0.13.15','./share.js?v=0.13.15','./drive-backup.js?v=0.13.15','./pin-guard.js?v=0.13.15','./ui-nav.js?v=0.13.15','./bootstrap.js?v=0.13.15','./setup-security.js?v=0.13.15','./app.js?v=0.13.15','./family-core.js?v=0.13.15','./responsive-family-ui.js?v=0.13.15','./settings-info-0131.js?v=0.13.15','./update-source-0134.js?v=0.13.15','./biometric.js?v=0.13.15','./credential-ui.js?v=0.13.15','./storage-backup.js?v=0.13.15','./backup-package-0132.js?v=0.13.15','./backup-mode-0132.js?v=0.13.15','./backup-guard.js?v=0.13.15','./loinc-search.js?v=0.13.15','./reports-search.js?v=0.13.15','./report-view-guard.js?v=0.13.15','./canonical-backfill.js?v=0.13.15','./trend.js?v=0.13.15','./trend-matrix-polish.js?v=0.13.15','./settings-accordion.js?v=0.13.15','./polish-0121.js?v=0.13.15','./report-polish-0122.js?v=0.13.15','./update-badge-ui.js?v=0.13.15','./manifest.webmanifest?v=0.13.15','./icon-riferto.svg?v=0.13.15','./assets/buymeacoffee.svg?v=0.13.15','./loinc-common.json','./changelog.html'];
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