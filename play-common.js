(function(){
 'use strict';const $=id=>document.getElementById(id);
 function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
 function status(text){const e=$('gameStatus')||$('editorStatus')||$('studioStatus');if(e)e.textContent=text;}
 function load(key,valid){try{const raw=localStorage.getItem(key);if(!raw)return null;const s=JSON.parse(raw);if(valid(s))return s;status('Den lagrede runden kunne ikke åpnes. Start en ny runde.');}catch(e){status('Lagring er utilgjengelig eller runden kunne ikke leses.');}return null;}
 function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(e){const message='Kunne ikke mellomlagre. Hold siden åpen, eller eksporter en kopi.';status(message);let banner=$('playStorageWarning');if(!banner){banner=node('p',message,'storage-warning');banner.id='playStorageWarning';banner.setAttribute('role','status');document.querySelector('.app')?.append(banner);}return false;}}
 function download(filename,data){const url=URL.createObjectURL(new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type:'application/json'})),a=node('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function confirmAction(message,label='Bekreft'){return new Promise(resolve=>{const d=node('dialog',undefined,'studio-dialog');d.setAttribute('aria-label','Bekreft handling');const text=node('p',message),row=node('div',undefined,'button-row'),cancel=node('button','Avbryt'),ok=node('button',label,'primary');let answered=false;const done=value=>{if(answered)return;answered=true;d.close();d.remove();resolve(value);};cancel.onclick=()=>done(false);ok.onclick=()=>done(true);d.oncancel=e=>{e.preventDefault();done(false);};row.append(cancel,ok);d.append(text,row);document.body.append(d);d.showModal();cancel.focus();});}
 function refreshCard(){const card=document.querySelector('.studio-card');if(card){card.classList.remove('card-refresh');void card.offsetWidth;card.classList.add('card-refresh');}}
 window.DypereUI={$,node,status,load,save,download,confirmAction,refreshCard};
})();
