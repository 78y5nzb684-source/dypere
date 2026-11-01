(function(){
 'use strict';
 const {node,$}=DypereUI,P=window.DypereInterestProfiles,host=$('profileEditor');
 let profile=P.empty(),offset=0,filter='all',query='',dirty=false,loading=false,visibleCount=0;
 const editMode=new URLSearchParams(location.search).get('mode')==='edit';
 const button=(label,fn,cls='')=>{const b=node('button',label,cls);b.type='button';b.onclick=fn;return b;};
 const title=node('h2',editMode?'Åpne interesseprofilen din':'Dine valg'),intro=node('p',editMode?'Velg profilfilen for å lese eller endre dine faste interesser. Kveldens svar endrer ikke denne filen.':'For voksne 18+. Velg det som passer. Du trenger ikke svare på alt. Ubesvart betyr ukjent.','journey-note');
 const nameLabel=node('label','Profilnavn'),name=node('input');name.id='profileName';name.maxLength=60;name.autocomplete='off';name.required=true;nameLabel.htmlFor=name.id;
 const status=node('p',undefined,'profile-save-status');status.id='profileSaveStatus';status.setAttribute('role','status');name.setAttribute('aria-describedby',status.id);
 function changed(){if(!dirty)status.textContent='Ulagrede endringer';dirty=true;}
 name.oninput=()=>{profile.name=name.value;name.setAttribute('aria-invalid','false');changed();};
 const controls=node('div',undefined,'profile-controls'),search=node('input');search.type='search';search.placeholder='Søk etter tema';search.setAttribute('aria-label','Søk etter tema');
 search.oninput=()=>{query=search.value.trim().toLocaleLowerCase('nb');offset=0;render();};
 const select=node('select');select.setAttribute('aria-label','Vis temaer');
 for(const [id,label] of [['all','Alle temaer'],['answered','Mine valg'],...(window.DypereJourneyCategories||[]).map(c=>[c.id,c.name]),['flere','Flere temaer fra katalogen']]){const o=node('option',label);o.value=id;select.append(o);}
 select.value='all';select.onchange=()=>{filter=select.value;offset=0;render();};controls.append(search,select);
 const count=node('p',undefined,'journey-note');count.setAttribute('role','status');count.tabIndex=-1;
 const list=node('div',undefined,'profile-topics'),pager=node('div',undefined,'profile-pager');
 const openLabel=node('label','Åpne lagret profil'),open=node('input');open.type='file';open.accept='.json,application/json';open.id='openProfile';openLabel.htmlFor=open.id;
 function save(){
  if(loading)return;
  if(!name.value.trim()){status.textContent='Skriv et profilnavn før du lagrer.';name.setAttribute('aria-invalid','true');name.focus();return;}
  try{profile.name=name.value;P.download(profile);dirty=false;status.textContent='Profilfilen er klar for nedlasting. Ta vare på den til neste stund.';}catch(e){status.textContent=e.message;}
 }
 const saveTop=button('Lagre profilfil',save,'primary'),saveBottom=button('Lagre endringene',save,'primary');
 open.onchange=async()=>{
  const file=open.files?.[0];if(!file||loading)return;loading=true;open.disabled=true;saveTop.disabled=true;saveBottom.disabled=true;
  try{
   if(file.size>2000000)throw Error('Profilfilen er for stor.');
   const incoming=P.parse(await file.text());
   if(dirty&&!await DypereUI.confirmAction('Åpne en annen profil og forkaste ulagrede endringer?','Ja, åpne profilen'))return;
   profile=incoming;name.value=profile.name;offset=0;dirty=false;filter='answered';select.value='answered';editor.hidden=false;name.setAttribute('aria-invalid','false');title.textContent='Din interesseprofil';status.textContent='Profilen er åpnet. Endringer lagres i en ny fil.';render();
  }catch(e){status.textContent=e.message;}finally{loading=false;open.disabled=false;saveTop.disabled=false;saveBottom.disabled=false;open.value='';}
 };
 const next=node('a','Last inn profiler til Vår stund','profile-start');next.href='./var-stund.html';
 const note=node('p','Profilen lagres som en fil hos deg. Endringer krever at du lagrer filen på nytt.','journey-note');
 const footer=node('div',undefined,'profile-save');footer.append(saveTop,next,note);
 const ordering=node('details',undefined,'journey-more');ordering.append(node('summary','Om katalogen og rekkefølgen'),node('p','Filene leses på enheten og sendes ikke til en server. Norske navn brukes der vi har dem; øvrige navn beholdes fra kilden. Nye katalogtemaer starter på middels nivå. Du kan tilpasse nivået under hvert tema. Rekkefølgen er veiledende. Fjern et valgt svar for å gjøre retningen ubesvart igjen.','journey-note'));
 const opener=node('div',undefined,'profile-save');opener.append(openLabel,open,status);
 const editor=node('div',undefined,'profile-editor-content');editor.hidden=editMode;editor.append(nameLabel,name,footer,ordering,controls,count,list,pager,saveBottom);
 host.append(title,intro,opener,editor);
 function syncBoxes(boxes,prefs,topic){
  for(const [input,value,direction] of boxes){const eligible=topic.directions.filter(d=>value==='nei'||prefs[d.id]!=='nei');input.checked=direction==='*'?eligible.length>0&&eligible.every(d=>prefs[d.id]===value):prefs[direction]===value;if(direction==='*')input.disabled=!eligible.length;}
 }
 function updateCount(){const n=Object.keys(profile.preferences).length;count.textContent=n+(n===1?' tema vurdert':' temaer vurdert')+' · '+visibleCount+' i dette utvalget';}
 function topicCard(topic){
  const card=node('section',undefined,'profile-topic'),heading=node('h3',topic.label),summary=node('p',undefined,'profile-selections');heading.id='profile-topic-'+topic.id;heading.tabIndex=-1;card.setAttribute('aria-labelledby',heading.id);card.append(heading,summary);
  const menus=node('div',undefined,'profile-state-menus'),boxes=[];
  function update(){const prefs=profile.preferences[topic.id]||{};summary.textContent=topic.directions.filter(d=>prefs[d.id]).map(d=>d.label+': '+({ja:'liker',kanskje:'nysgjerrig',nei:'nei'})[prefs[d.id]]).join(' · ')||'Ikke vurdert';syncBoxes(boxes,prefs,topic);updateCount();}
  function store(prefs){if(Object.keys(prefs).length)profile.preferences[topic.id]=prefs;else delete profile.preferences[topic.id];changed();update();}
  for(const [value,label] of [['ja','Liker'],['kanskje','Nysgjerrig'],['nei','Nei']]){
   const detail=node('details'),trigger=node('summary',label);trigger.setAttribute('aria-label',label+' · '+topic.label);detail.ontoggle=()=>{if(detail.open)for(const other of menus.children)if(other!==detail)other.open=false;};detail.append(trigger);
   const choices=node('div',undefined,'profile-direction-menu');
   for(const d of topic.directions){const wrap=node('label'),input=node('input');input.type='checkbox';input.setAttribute('aria-label',topic.label+' · '+label+' · '+d.label);input.onchange=()=>{const prefs={...(profile.preferences[topic.id]||{})};if(input.checked)prefs[d.id]=value;else if(prefs[d.id]===value)delete prefs[d.id];store(prefs);};wrap.append(input,node('span',d.label));choices.append(wrap);boxes.push([input,value,d.id]);}
   if(topic.directions.length>1){
    const text=value==='nei'?'Alle retninger':'Alle uten nei',wrap=node('label'),all=node('input');all.type='checkbox';all.setAttribute('aria-label',topic.label+' · '+label+' · '+text);
    all.onchange=()=>{const prefs={...(profile.preferences[topic.id]||{})};for(const d of topic.directions){if(value!=='nei'&&prefs[d.id]==='nei')continue;if(all.checked)prefs[d.id]=value;else if(prefs[d.id]===value)delete prefs[d.id];}store(prefs);};
    wrap.append(all,node('span',text));choices.append(wrap);boxes.push([all,value,'*']);
   }
   detail.append(choices);menus.append(detail);
  }
  card.append(menus);const advanced=node('details',undefined,'profile-level'),level=node('select');level.setAttribute('aria-label','Intensitet for '+topic.label);
  for(const [n,label] of [[0,'Bruk vanlig rekkefølge'],[1,'1 · Mykt'],[2,'2'],[3,'3 · Middels'],[4,'4'],[5,'5 · Intenst']]){const o=node('option',label);o.value=String(n);level.append(o);}
  level.value=String(profile.levels[topic.id]||0);level.onchange=()=>{const n=Number(level.value);if(n)profile.levels[topic.id]=n;else delete profile.levels[topic.id];changed();};advanced.append(node('summary','Tilpass rekkefølgen'),level);card.append(advanced);update();return card;
 }
 function render({focusList=false}={}){
  list.replaceChildren();pager.replaceChildren();const order=['naerhet','munn','dybde','styring','lek','risiko','kraft','flere'];
  const rows=P.catalog.filter(t=>(filter==='all'||filter==='answered'&&Object.keys(profile.preferences[t.id]||{}).length||t.group===filter)&&(!query||[t.label,...t.aliases].some(s=>s.toLocaleLowerCase('nb').includes(query)))).sort((a,b)=>order.indexOf(a.group)-order.indexOf(b.group)||a.label.localeCompare(b.label,'nb'));
  if(offset>=rows.length)offset=0;visibleCount=rows.length;rows.slice(offset,offset+20).forEach(t=>list.append(topicCard(t)));updateCount();
  if(!rows.length)list.append(node('p','Ingen temaer i dette utvalget.'));
  if(offset>0)pager.append(button('Forrige side',()=>{offset=Math.max(0,offset-20);render({focusList:true});}));pager.append(node('span',rows.length?Math.floor(offset/20)+1+' / '+Math.ceil(rows.length/20):'0'));
  if(offset+20<rows.length)pager.append(button('Neste side',()=>{offset+=20;render({focusList:true});}));if(focusList)(list.children[0]?.children[0]||count).focus();
 }
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 for(const link of [next,...document.querySelectorAll('.app-header a')])link.onclick=async e=>{if(!dirty)return;e.preventDefault();if(await DypereUI.confirmAction('Forlate siden uten å lagre endringene?','Ja, forlat siden')){dirty=false;location.assign(link.href);}};
 render();
})();
