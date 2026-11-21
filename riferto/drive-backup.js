/* Optional encrypted Riferto backups to Google Drive. Nothing is uploaded without consent.
   Tokens live in RAM only. Pending changes are retried after reopening and reconnecting.
   This is foreground-only; iOS does not allow reliable closed-app PWA uploads. */
(() => {
  'use strict';
  const SCOPE='https://www.googleapis.com/auth/drive.file';
  const FILES='https://www.googleapis.com/drive/v3/files';
  const UPLOAD='https://www.googleapis.com/upload/drive/v3/files';
  const KEY='riferto-gdrive-';
  const K={client:KEY+'client-id',folder:KEY+'folder-id',auto:KEY+'auto',pending:KEY+'pending',last:KEY+'last'};
  const FOLDER='Riferto Backups';
  const stack=document.querySelector('.settings-stack');
  if(!stack)return;
  const card=document.createElement('article');
  card.className='glass settings-card riferto-gdrive-card';
  card.innerHTML=[
    '<p class="eyebrow">Backup esterno</p><h3>Google Drive — backup cifrati</h3>',
    '<p class="muted">Google Drive riceve soltanto file .riferto cifrati, in una cartella visibile chiamata “Riferto Backups”. Nessun PIN o password viene inviato.</p>',
    '<p class="caption">Funziona con Riferto aperto e accesso Google attivo. Se la sessione scade, il backup rimane in attesa di una nuova connessione. Non funziona con la PWA chiusa.</p>',
    '<label class="field"><span>Client ID OAuth Google (app Web)</span><input id="rifertoDriveClientId" type="text" spellcheck="false" autocapitalize="none" autocomplete="off" placeholder="...apps.googleusercontent.com"></label>',
    '<div class="settings-actions"><button id="rifertoDrivePrepare" class="secondary-btn" type="button">1. Prepara Google</button><button id="rifertoDriveConnect" class="primary-btn" type="button" disabled>2. Collega Drive</button></div>',
    '<label class="riferto-drive-toggle"><input id="rifertoDriveAuto" type="checkbox"><span>Backup automatico dopo salvataggi, modifiche e cancellazioni</span></label>',
    '<div class="settings-actions"><button id="rifertoDriveUpload" class="secondary-btn" type="button">Carica backup ora</button><button id="rifertoDriveDisconnect" class="secondary-btn" type="button">Scollega</button></div>',
    '<p id="rifertoDriveStatus" class="caption" role="status" aria-live="polite"></p>',
    '<details class="settings-disclosure"><summary><span>Configurazione Google Cloud</span><small>Ottieni un Client ID OAuth</small></summary>',
    '<div class="settings-disclosure-body"><p class="caption">In Google Cloud crea un progetto, abilita Google Drive API, configura la schermata di consenso OAuth e crea un client di tipo Applicazione web. Aggiungi fra le origini JavaScript autorizzate:</p>',
    '<p class="caption"><code>https://making-lemonade.github.io</code></p>',
    '<p class="caption">Se l’app OAuth è in modalità test, aggiungi il tuo account fra gli utenti di test. Incolla soltanto il Client ID pubblico; mai un client secret.</p>',
    '<a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console ↗</a></div></details>'
  ].join('');
  const target=stack.querySelector('#storageBackupCard');
  if(target)target.insertAdjacentElement('afterend',card);else stack.appendChild(card);
  const style=document.createElement('style');
  style.textContent=[
    '.riferto-gdrive-card .field{display:block;margin-top:13px}',
    '.riferto-gdrive-card .field input{width:100%;font-size:.8rem}',
    '.riferto-gdrive-card .settings-actions{margin-top:10px}',
    '.riferto-gdrive-card .settings-actions button{min-width:0;overflow-wrap:anywhere}',
    '.riferto-gdrive-card .settings-disclosure{margin-top:14px}',
    '.riferto-gdrive-card .riferto-drive-toggle{display:flex;gap:9px;align-items:center;margin:15px 0;font-size:.85rem}',
    '.riferto-gdrive-card .riferto-drive-toggle input{width:18px;height:18px;flex:none}',
    '#rifertoDriveStatus{min-height:30px;line-height:1.6;overflow-wrap:anywhere}',
    '.riferto-gdrive-card button[disabled]{opacity:.55;cursor:not-allowed}',
    '@media(max-width:580px){.riferto-gdrive-card .settings-actions{grid-template-columns:1fr!important}}'
  ].join('');
  document.head.appendChild(style);
  const input=card.querySelector('#rifertoDriveClientId');
  const prepare=card.querySelector('#rifertoDrivePrepare');
  const connect=card.querySelector('#rifertoDriveConnect');
  const toggle=card.querySelector('#rifertoDriveAuto');
  const upload=card.querySelector('#rifertoDriveUpload');
  const disconnect=card.querySelector('#rifertoDriveDisconnect');
  const label=card.querySelector('#rifertoDriveStatus');
  input.value=localStorage.getItem(K.client)||'';
  toggle.checked=localStorage.getItem(K.auto)==='true';
  let accessToken='',tokenUntil=0,googleClient=null,scriptLoading=null,running=false,timer=null,changes=0;
  function hasToken(){return !!accessToken&&Date.now()<tokenUntil-60000}
  function isPending(){return localStorage.getItem(K.pending)==='true'}
  function status(message){
    const stamp=localStorage.getItem(K.last);
    const time=stamp?new Intl.DateTimeFormat('it-IT',{dateStyle:'short',timeStyle:'short'}).format(new Date(stamp)):'mai';
    label.textContent=(message?message+' · ':'')+(hasToken()?'Drive collegato per questa sessione':'Drive da collegare')+' · ultimo backup riuscito: '+time+(isPending()?' · backup in attesa':'');
  }
  function clientId(){
    const value=input.value.trim();
    if(!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(value))throw new Error('Inserisci un Client ID OAuth Web valido.');
    if(localStorage.getItem(K.client)!==value){
      localStorage.setItem(K.client,value);
      localStorage.removeItem(K.folder);
      accessToken='';tokenUntil=0;googleClient=null;connect.disabled=true;
    }
    return value;
  }
  function loadGoogle(){
    if(window.google?.accounts?.oauth2?.initTokenClient)return Promise.resolve();
    if(scriptLoading)return scriptLoading;
    scriptLoading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://accounts.google.com/gsi/client';
      script.async=true;
      script.onload=()=>window.google?.accounts?.oauth2?.initTokenClient?resolve():reject(new Error('Modulo Google non disponibile'));
      script.onerror=()=>reject(new Error('Impossibile caricare Google Identity'));
      document.head.appendChild(script);
    }).catch(error=>{scriptLoading=null;throw error});
    return scriptLoading;
  }
  prepare.addEventListener('click',async()=>{
    try{
      const id=clientId();
      prepare.disabled=true;
      status('Caricamento modulo Google');
      await loadGoogle();
      googleClient=window.google.accounts.oauth2.initTokenClient({
        client_id:id,scope:SCOPE,
        callback:response=>{
          if(!response?.access_token){status('Accesso non autorizzato');return}
          if(window.google.accounts.oauth2.hasGrantedAllScopes&&!window.google.accounts.oauth2.hasGrantedAllScopes(response,SCOPE)){
            status('Permesso Drive negato');return;
          }
          accessToken=response.access_token;
          localStorage.removeItem(K.folder); // Account might have changed since the previous session.
          tokenUntil=Date.now()+(Number(response.expires_in)||3600)*1000;
          status('Collegato');
          if(toggle.checked){localStorage.setItem(K.pending,'true');schedule()}
        },
        error_callback:error=>status(error?.type==='popup_closed'?'Accesso annullato':'Popup Google non disponibile: prova da Safari')
      });
      connect.disabled=false;
      status('Pronto: premi “2. Collega Drive”');
    }catch(e){status(e.message||'Configurazione non riuscita')}
    finally{prepare.disabled=false}
  });
  connect.addEventListener('click',()=>{
    if(!googleClient){status('Prepara prima il modulo Google');return}
    // Must be called directly in the user click on iOS to avoid popup blocking.
    try{googleClient.requestAccessToken()}catch(e){status('Accesso Google non disponibile: '+e.message)}
  });
  input.addEventListener('input',()=>{
    accessToken='';tokenUntil=0;googleClient=null;connect.disabled=true;
    status('Client ID modificato: premi “1. Prepara Google”');
  });
  toggle.addEventListener('change',()=>{
    localStorage.setItem(K.auto,String(toggle.checked));
    if(toggle.checked){
      localStorage.setItem(K.pending,'true');
      if(hasToken())schedule();
      else status('Backup automatico pronto: collega Drive per iniziare');
    }else status('Backup automatico disattivato');
  });
  disconnect.addEventListener('click',()=>{
    if(accessToken&&window.google?.accounts?.oauth2?.revoke){
      try{window.google.accounts.oauth2.revoke(accessToken,()=>{})}catch(_){}
    }
    accessToken='';tokenUntil=0;toggle.checked=false;
    localStorage.setItem(K.auto,'false');
    status('Google Drive scollegato');
  });
  async function api(url,options={}){
    if(!hasToken())throw new Error('Sessione Google scaduta: ricollega Drive.');
    const headers=new Headers(options.headers||{});
    headers.set('Authorization','Bearer '+accessToken);
    const response=await fetch(url,{...options,headers,mode:'cors',cache:'no-store'});
    if(response.status===401){accessToken='';tokenUntil=0;throw new Error('Autorizzazione scaduta: ricollega Drive.')}
    if(!response.ok){
      const detail=await response.json().catch(()=>null);
      throw new Error('Google Drive: '+(detail?.error?.message||'HTTP '+response.status));
    }
    return response;
  }
  async function folderId(){
    const stored=localStorage.getItem(K.folder);
    if(stored)return stored;
    const q="name = '"+FOLDER+"' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    const response=await api(FILES+'?q='+encodeURIComponent(q)+'&fields='+encodeURIComponent('files(id,name)')+'&pageSize=50');
    const data=await response.json();
    let id=data.files?.[0]?.id;
    if(!id){
      const created=await api(FILES+'?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:FOLDER,mimeType:'application/vnd.google-apps.folder'})});
      id=(await created.json()).id;
    }
    if(!id)throw new Error('Cartella backup non creata');
    localStorage.setItem(K.folder,id);
    return id;
  }
  async function uploadPackage(bytes,createdAt,parent){
    const name='riferto-backup-'+String(createdAt).replace(/[:.]/g,'-')+'.riferto';
    const metadata={name,mimeType:'application/octet-stream',parents:[parent]};
    if(bytes.length<=5*1024*1024){
      const boundary='riferto_'+Array.from(crypto.getRandomValues(new Uint8Array(12)),x=>x.toString(16).padStart(2,'0')).join('');
      const data=new Blob([
        '--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n',
        JSON.stringify(metadata),
        '\r\n--'+boundary+'\r\nContent-Type: application/octet-stream\r\n\r\n',
        bytes,'\r\n--'+boundary+'--\r\n'
      ],{type:'multipart/related; boundary='+boundary});
      const response=await api(UPLOAD+'?uploadType=multipart&fields=id,name,size',{
        method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body:data
      });
      return response.json();
    }
    const init=await api(UPLOAD+'?uploadType=resumable',{
      method:'POST',
      headers:{'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Type':'application/octet-stream','X-Upload-Content-Length':String(bytes.length)},
      body:JSON.stringify(metadata)
    });
    const location=init.headers.get('Location');
    if(!location)throw new Error('Google non ha fornito la sessione di caricamento grande.');
    const endpoint=new URL(location);
    if(endpoint.protocol!=='https:'||!['www.googleapis.com','content.googleapis.com'].includes(endpoint.hostname))throw new Error('Destinazione upload non riconosciuta.');
    const response=await api(location,{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:bytes});
    return response.json();
  }
  async function flush(force=false){
    if(running){if(force)localStorage.setItem(K.pending,'true');return}
    if(!force&&!toggle.checked)return;
    if(!force&&!isPending())return;
    if(!hasToken()){status('Ricollega Google per eseguire il backup in attesa');return}
    if(!window.RifertoBackupSessionKey){status('Sblocca Riferto e configura la password backup');return}
    if(typeof window.RifertoBuildEncryptedBackup!=='function'){status('Modulo backup cifrato non pronto');return}
    running=true;
    upload.disabled=true;
    const generation=changes;
    localStorage.setItem(K.pending,'true');
    try{
      status('Creazione del backup cifrato');
      const pack=await window.RifertoBuildEncryptedBackup();
      if(!pack?.bytes?.length)throw new Error('Backup vuoto');
      const folder=await folderId();
      status('Invio del backup cifrato su Drive');
      const file=await uploadPackage(pack.bytes,pack.createdAt,folder);
      if(!file?.id)throw new Error('Caricamento non confermato');
      localStorage.setItem(K.last,new Date().toISOString());
      if(changes===generation)localStorage.setItem(K.pending,'false');
      status('Backup caricato con successo');
    }catch(error){
      localStorage.setItem(K.pending,'true');
      status('Backup non inviato: '+(error?.message||'errore di rete'));
    }finally{
      running=false;upload.disabled=false;
      if(changes!==generation&&hasToken()&&toggle.checked)schedule();
    }
  }
  function schedule(){if(!toggle.checked)return;clearTimeout(timer);timer=setTimeout(()=>flush(),3500)}
  function markChanged(){if(!toggle.checked)return;changes++;localStorage.setItem(K.pending,'true');schedule()}
  upload.addEventListener('click',()=>{localStorage.setItem(K.pending,'true');flush(true)});
  window.addEventListener('riferto:report-saved',markChanged);
  window.addEventListener('riferto:backup-memo-updated',markChanged);
  window.addEventListener('riferto:backup-dirty',markChanged);
  window.addEventListener('riferto:report-deleted',markChanged);
  window.addEventListener('online',()=>{if(isPending()&&hasToken())schedule()});
  window.addEventListener('riferto:backup-key-ready',()=>{if(isPending()&&hasToken())schedule()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isPending()&&hasToken())schedule()});
  status(isPending()?'Backup in attesa di riconnessione':'Google non viene contattato prima del tuo consenso');
})();
