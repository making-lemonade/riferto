const pinInput=document.querySelector('#pinInput');
const pinConfirmInput=document.querySelector('#pinConfirmInput');
const pinConfirmField=document.querySelector('#pinConfirmField');
const unlockBtn=document.querySelector('#unlockBtn');
const lockError=document.querySelector('#lockError');
const lockCard=document.querySelector('.lock-card');
let activeInput=pinInput;
let autoUnlockTimer=null;

function isCreateMode(){return pinConfirmField && !pinConfirmField.classList.contains('hidden')}
function configureNativeFields(){
  if(pinInput){pinInput.readOnly=false;pinInput.type='password';pinInput.inputMode='numeric';pinInput.pattern='[0-9]*';pinInput.autocomplete=isCreateMode()?'new-password':'current-password';pinInput.name=isCreateMode()?'riferto-new-pin':'riferto-pin';pinInput.removeAttribute('aria-hidden');pinInput.tabIndex=0;pinInput.classList.remove('pin-native-hidden')}
  if(pinConfirmInput){pinConfirmInput.readOnly=false;pinConfirmInput.type='password';pinConfirmInput.inputMode='numeric';pinConfirmInput.pattern='[0-9]*';pinConfirmInput.autocomplete='new-password';pinConfirmInput.name='riferto-new-pin-confirm';pinConfirmInput.removeAttribute('aria-hidden');pinConfirmInput.tabIndex=0;pinConfirmInput.classList.remove('pin-native-hidden')}
}
configureNativeFields();

const keypad=document.createElement('div');
keypad.className='pin-keypad';
keypad.setAttribute('aria-label','Tastierino PIN');
keypad.innerHTML=`${[1,2,3,4,5,6,7,8,9].map(n=>`<button type="button" class="pin-key" data-pin-key="${n}">${n}</button>`).join('')}<span class="pin-key-spacer" aria-hidden="true"></span><button type="button" class="pin-key" data-pin-key="0">0</button><button type="button" class="pin-key pin-key-delete" data-pin-key="delete" aria-label="Cancella ultima cifra">⌫</button>`;
lockCard?.insertBefore(keypad,unlockBtn);

function validatePins(showMessage=false){
  if(!isCreateMode())return true;
  const pin=pinInput?.value||'',confirm=pinConfirmInput?.value||'';
  if(pin.length<6||confirm.length<6){if(showMessage&&lockError)lockError.textContent='Inserisci 6 cifre in entrambi i campi.';return false}
  if(pin!==confirm){if(lockError)lockError.textContent='I PIN non coincidono.';return false}
  if(lockError&&(lockError.textContent==='I PIN non coincidono.'||lockError.textContent==='Inserisci 6 cifre in entrambi i campi.'))lockError.textContent='';
  return true;
}
function scheduleAutoUnlock(){clearTimeout(autoUnlockTimer);if(isCreateMode()||pinInput?.value.length!==6)return;autoUnlockTimer=setTimeout(()=>{if(!isCreateMode()&&pinInput?.value.length===6&&!unlockBtn?.disabled)unlockBtn?.click()},180)}
function pressKey(key){if(!activeInput)return;if(key==='delete')activeInput.value=activeInput.value.slice(0,-1);else if(/^\d$/.test(key)&&activeInput.value.length<6)activeInput.value+=key;activeInput.dispatchEvent(new Event('input',{bubbles:true}));if(isCreateMode()&&activeInput===pinInput&&pinInput.value.length===6){activeInput=pinConfirmInput;pinConfirmInput?.focus({preventScroll:true})}if(isCreateMode()&&pinInput.value.length===6&&pinConfirmInput.value.length===6)validatePins(false);else scheduleAutoUnlock()}
keypad.addEventListener('click',event=>{const button=event.target.closest('[data-pin-key]');if(button)pressKey(button.dataset.pinKey)});
pinInput?.addEventListener('focus',()=>activeInput=pinInput);pinConfirmInput?.addEventListener('focus',()=>activeInput=pinConfirmInput);
pinInput?.addEventListener('input',scheduleAutoUnlock);
unlockBtn?.addEventListener('click',event=>{clearTimeout(autoUnlockTimer);if(isCreateMode()&&!validatePins(true)){event.preventDefault();event.stopImmediatePropagation();activeInput=(pinInput?.value.length||0)<6?pinInput:pinConfirmInput;activeInput?.focus({preventScroll:true})}},true);
new MutationObserver(()=>{clearTimeout(autoUnlockTimer);configureNativeFields();activeInput=pinInput}).observe(pinConfirmField,{attributes:true,attributeFilter:['class']});
