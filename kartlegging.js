(function(){
 'use strict';
 const {node,$}=DypereUI,P=window.DypereInterestProfiles,host=$('profileEditor');let profile=P.empty(),offset=0,filter='all',query='';
 const button=(label,fn,cls='')=>{const b=node('button',label,cls);b.type='button';b.onclick=fn;return b;};
 const title=node('h2','Dine valg'),intro=node('p','For voksne 18+. Velg det som passer. Du trenger ikke svare på alt. Ubesvart betyr ukjent.','journey-note');
 const nameLabel=node('label','Profilnavn'),name=node('input');name.id='profileName';name.maxLength=60;name.autocomplete='off';nameLabel.htmlFor=name.id;name.oninput=()=>{profile.name=name.value;};
 const controls=node('div',undefined,'profile-controls'),search=node('input');search.type='search';search.placeholder='Søk etter tema';search.setAttribute('aria-label','Søk etter tema');search.oninput=()=>{query=search.value.trim().toLocaleLowerCase('nb');offset=0;render();};
 const select=node('select');select.setAttribute('aria-label','Vis temaer');for(const [id,label] of [['all','Alle temaer'],['answered','Mine valg'],...(window.DypereJourneyCategories||[]).map(c=>[c.id,c.name]),['flere','Flere temaer fra katalogen']]){const o=node('option',label);o.value=id;select.append(o);}select.value='all';select.onchange=()=>{filter=select.value;offset=0;render();};controls.append(search,select);
 const count=node('p',undefined,'journey-note'),list=node('div',undefined,'profile-topics'),pager=node('div',undefined,'profile-pager'),status=node('p');status.setAttribute('role','status');
 const openLabel=node('label','Åpne lagret profil'),open=node('input');open.type='file';open.accept='.json,application/json';open.id='openProfile';openLabel.htmlFor=open.id;
 open.onchange=async()=>{const file=open.files?.[0];if(!file)return;try{if(file.size>2000000)throw Error('Profilfilen er for stor.');profile=P.parse(await file.text());name.value=profile.name;status.textContent='Profilen er åpnet. Du kan endre og lagre en ny fil.';render();}catch(e){status.textContent=e.message;}finally{open.value='';}};
 const save=button('Lagre profilfil',()=>{try{profile.name=name.value;P.download(profile);status.textContent='Profilfilen er klar for nedlasting. Ta vare på den til neste stund.';}catch(e){status.textContent=e.message;}},'primary');
 const next=node('a','Last inn profiler til Vår stund','profile-start');next.href='./var-stund.html';
 const note=node('p','Profilen lagres som en fil hos deg. Den sendes ikke til en server. Endringer krever at du lagrer filen på nytt.','journey-note');
 const footer=node('div',undefined,'profile-save');footer.append(save,next,note,status,openLabel,open);
 const ordering=node('details',undefined,'journey-more');ordering.append(node('summary','Om katalogen og rekkefølgen'),node('p','Katalogen bygger på PDF-en. Norske navn brukes der vi har dem; øvrige navn beholdes fra kilden. Nye katalogtemaer starter på middels nivå. Du kan tilpasse nivået under hvert tema. Rekkefølgen er veiledende.','journey-note'));
 host.append(title,intro,nameLabel,name,footer,ordering,controls,count,list,pager);
 function render(){
  list.replaceChildren();pager.replaceChildren();const order=['naerhet','munn','dybde','styring','lek','risiko','kraft','flere'];const rows=P.catalog.filter(t=>(filter==='all'||filter==='answered'&&Object.keys(profile.preferences[t.id]||{}).length||t.group===filter)&&(!query||[t.label,...t.aliases].some(s=>s.toLocaleLowerCase('nb').includes(query)))).sort((a,b)=>order.indexOf(a.group)-order.indexOf(b.group)||a.label.localeCompare(b.label,'nb'));
  if(offset>=rows.length)offset=0;count.textContent=Object.keys(profile.preferences).length+' temaer vurdert · '+rows.length+' i dette utvalget';
  for(const topic of rows.slice(offset,offset+20)){
   const card=node('section',undefined,'profile-topic'),heading=node('h3',topic.label),summary=node('p',undefined,'profile-selections');card.append(heading,summary);
   const menus=node('div',undefined,'profile-state-menus'),boxes=[];
   function update(){const prefs=profile.preferences[topic.id]||{};summary.textContent=topic.directions.filter(d=>prefs[d.id]).map(d=>d.label+': '+({ja:'liker',kanskje:'nysgjerrig',nei:'nei'})[prefs[d.id]]).join(' · ')||'Ikke vurdert';count.textContent=Object.keys(profile.preferences).length+' temaer vurdert · '+rows.length+' i dette utvalget';}
   for(const [value,label] of [['ja','Liker'],['kanskje','Nysgjerrig'],['nei','Nei']]){
    const detail=node('details'),trigger=node('summary',label);detail.ontoggle=()=>{if(detail.open)for(const other of menus.children)if(other!==detail)other.open=false;};detail.append(trigger);const choices=node('div',undefined,'profile-direction-menu');
    for(const d of topic.directions){const wrap=node('label'),input=node('input');input.type='checkbox';input.checked=profile.preferences[topic.id]?.[d.id]===value;input.setAttribute('aria-label',topic.label+' · '+label+' · '+d.label);input.onchange=()=>{const prefs=profile.preferences[topic.id]||{};if(input.checked)prefs[d.id]=value;else if(prefs[d.id]===value)delete prefs[d.id];if(Object.keys(prefs).length)profile.preferences[topic.id]=prefs;else delete profile.preferences[topic.id];for(const [other,v,dir] of boxes)other.checked=dir==='*'?topic.directions.every(d=>prefs[d.id]===v):prefs[dir]===v;update();};wrap.append(input,node('span',d.label));choices.append(wrap);boxes.push([input,value,d.id]);}
    if(topic.directions.length>1){const wrap=node('label'),all=node('input');all.type='checkbox';all.checked=topic.directions.every(d=>profile.preferences[topic.id]?.[d.id]===value);all.setAttribute('aria-label',topic.label+' · '+label+' · Alle retninger');all.onchange=()=>{const prefs=profile.preferences[topic.id]||{};for(const d of topic.directions)if(all.checked)prefs[d.id]=value;else if(prefs[d.id]===value)delete prefs[d.id];if(Object.keys(prefs).length)profile.preferences[topic.id]=prefs;else delete profile.preferences[topic.id];for(const [other,v,dir] of boxes)other.checked=dir==='*'?topic.directions.every(d=>prefs[d.id]===v):prefs[dir]===v;update();};wrap.append(all,node('span','Alle retninger'));choices.append(wrap);boxes.push([all,value,'*']);}
    detail.append(choices);menus.append(detail);
   }
   card.append(menus);const advanced=node('details',undefined,'profile-level'),level=node('select');level.setAttribute('aria-label','Intensitet for '+topic.label);for(const [n,label] of [[0,'Bruk vanlig rekkefølge'],[1,'1 · Mykt'],[2,'2'],[3,'3 · Middels'],[4,'4'],[5,'5 · Intenst']]){const o=node('option',label);o.value=String(n);level.append(o);}level.value=String(profile.levels[topic.id]||0);level.onchange=()=>{const n=Number(level.value);if(n)profile.levels[topic.id]=n;else delete profile.levels[topic.id];};advanced.append(node('summary','Tilpass rekkefølgen'),level);card.append(advanced);list.append(card);update();
  }
  if(!rows.length)list.append(node('p','Ingen temaer i dette utvalget.'));
  if(offset>0)pager.append(button('Forrige side',()=>{offset=Math.max(0,offset-20);render();}));pager.append(node('span',rows.length?Math.floor(offset/20)+1+' / '+Math.ceil(rows.length/20):'0'));
  if(offset+20<rows.length)pager.append(button('Neste side',()=>{offset+=20;render();}));
 }
 render();
})();
