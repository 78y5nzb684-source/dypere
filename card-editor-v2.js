(function(){
 'use strict';const U=DypereUI,{$,node}=U,S=DypereCardStore,E=DypereGames;let cards=S.read();
 function status(t){$('editorStatus').textContent=t;}
 function clear(){ $('cardForm').reset();$('editId').value='';$('editKind').value=new URLSearchParams(location.search).get('kind')||'photo';if(!E.kinds.includes($('editKind').value))$('editKind').value='photo';$('editLevel').value=$('editKind').value==='photo'?'3':'1';$('saveCard').textContent='Lagre kort'; }
 function save(next,message,recover=false){try{S.write(next,recover);cards=next;render();status(message);return true;}catch(e){status(e.message);return false;}}
 function render(){
  $('cardCount').textContent=cards.length+' egne kort. Kortene deles ikke med andre enheter uten eksport.';$('cardList').replaceChildren();
  const search=$('cardSearch').value.toLocaleLowerCase('nb'),kind=$('cardFilter').value;
  const list=cards.filter(c=>(!kind||c.kind===kind)&&(c.text+' '+c.pack+' '+c.role).toLocaleLowerCase('nb').includes(search));
  if(!list.length)$('cardList').append(node('p',cards.length?'Ingen kort passer filteret.':'Kortbanken er tom. Lag det første kortet ovenfor.','fine'));
  for(const c of list){const article=node('article'),meta=node('p',E.labels[c.kind]+' · '+c.role+' · '+c.pack+' · nivå '+c.level,'eyebrow'),text=node('p',c.text),row=node('div',undefined,'card-actions'),edit=node('button','Rediger'),remove=node('button','Slett'),fav=node('button',S.prefs().favorites.includes(c.id)?'★ Favoritt':'☆ Favoritt'),enabled=node('button',c.enabled?'Aktivt':'Slå på');
   fav.setAttribute('aria-pressed',String(S.prefs().favorites.includes(c.id)));enabled.setAttribute('aria-pressed',String(c.enabled));
   edit.onclick=()=>{for(const [id,v]of Object.entries({editId:c.id,editKind:c.kind,editRole:c.role,editAudience:c.audience,editText:c.text,editPack:c.pack,editLevel:c.level}))$(id).value=v;$('editEnabled').checked=c.enabled;$('saveCard').textContent='Lagre endringer';$('editText').focus();};
   fav.onclick=()=>{try{S.toggleFavorite(c.id);render();}catch(e){status(e.message);}};
   enabled.onclick=()=>save(cards.map(x=>x.id===c.id?{...x,enabled:!x.enabled}:x),'Kortstatus lagret.');
   remove.onclick=async()=>{if(await U.confirmAction('Slette dette kortet? Eksporter en kopi først hvis du vil beholde det.','Slett kort'))save(cards.filter(x=>x.id!==c.id),'Kortet er slettet.');};row.append(edit,fav,enabled,remove);article.append(meta,text,row);$('cardList').append(article);
  }
 }
 $('cardForm').onsubmit=e=>{e.preventDefault();const id=$('editId').value||'own-'+crypto.randomUUID();const c={id,kind:$('editKind').value,role:$('editRole').value,audience:$('editAudience').value,text:$('editText').value.trim(),pack:$('editPack').value.trim()||'Egne kort',level:Number($('editLevel').value),enabled:$('editEnabled').checked};if(save(cards.filter(x=>x.id!==id).concat(c),'Kortet er lagret.'))clear();};
 $('cancelEdit').onclick=()=>{clear();status('Klar for et nytt kort.');};$('cardSearch').oninput=render;$('cardFilter').onchange=render;
 $('exportCards').onclick=()=>U.download('DYPERE-kort-v2.json',{version:2,cards});$('rawBackup').onclick=()=>{try{U.download('DYPERE-kort-rakopi.json',S.raw());}catch(e){status('Råkopien kunne ikke leses.');}};
 $('importCards').onclick=()=>$('cardFile').click();
 $('cardFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{
  if(file.size>2000000)throw Error('Maksimal filstørrelse er 2 MB.');const incoming=E.validateCards(JSON.parse(await file.text())),recover=!!S.warning();
  if(recover){if(!await U.confirmAction('Kortbanken kan ikke leses. Last ned en råkopi først. Skal den erstattes med denne gyldige filen?','Gjenopprett kortbank'))return;save(incoming,'Kortbanken er gjenopprettet.',true);}
  else{const merged=E.mergeCards(cards,incoming);save(merged.cards,merged.added+' nye kort importert. '+merged.kept+' eksisterende ID-er beholdt.');}
 }catch(error){status(error.message);}finally{e.target.value='';}};
 $('editKind').addEventListener('change',()=>{if(!$('editId').value)$('editLevel').value=$('editKind').value==='photo'?'3':'1';});
 clear();render();if(S.warning())status(S.warning());
})();
