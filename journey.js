(function(){
 'use strict';
 const U=DypereUI,{node,$}=U,M=window.DypereJourneyModel;
 const view=$('journeyView'),exit=$('journeyExit');
 const skills=window.DypereJourneyCategories,names=window.DypereJourneyCategoryNames;
 const language=window.DypereJourneyLanguage||{},entries=M.index(window.DypereVarStundBank);
 M.indexReport().skipped.forEach(row=>console.warn('Vår stund: hoppet over rad',row.id,row.reason));
 M.validerLanguage(language).forEach(key=>console.warn('Vår stund: manglende språkoppføring',key));
 let profiles=[],active=0,segment=1,step=0,mode='oppvarming',lengths=[7,7,7];
 let revision=0,started=false,finished=false,busy=false,exiting=false,current=null;
 let setupIndex=0,result=null,scenarioIndex=0,custom='',chosen=false,customOpen=false,customDraft=null,pendingAnswer=null;
 const history=[];
 const sessionId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 const notes=new Map();let reportFilter='yes',reportBody=null,reportData=null;
 function copyProfile(p){return {...p,allocated:{...p.allocated},scores:{...p.scores},recent:[...p.recent],recentCats:[...p.recentCats],seenText:new Set(p.seenText),seenFamilies:new Set(p.seenFamilies),seenTopics:new Set(p.seenTopics),answers:[...p.answers]};}
 function remember(){history.push({profiles:profiles.map(copyProfile),active,segment,step,setupIndex,question:current});}
 function previous(){
   if(busy||!history.length)return;
   const oldActive=active,frame=history.pop();profiles=frame.profiles.map(copyProfile);active=frame.active;segment=frame.segment;step=frame.step;setupIndex=frame.setupIndex;current=frame.question;finished=false;result=null;reportData=null;
   if(active!==oldActive)showHandoff(true);else showQuestion();
 }
 const currentProfile=()=>profiles[active];
 function panel(title,kicker,focusTitle=true){
   revision++;view.replaceChildren();const p=node('section',undefined,'journey-panel');
   if(kicker)p.append(node('p',kicker,'eyebrow'));
   const h=node('h2',title);h.tabIndex=-1;p.append(h);view.append(p);if(focusTitle)h.focus();return p;
 }
 function button(label,action,cls=''){
   const b=node('button',label,cls),r=revision;b.type='button';
   b.onclick=()=>{if(r===revision&&!b.disabled&&!exiting)action(b);};return b;
 }
 function showParty(){
   if(started)return;const p=panel('Hvem er med?','DERES STUND');
   p.append(node('p','Dere svarer etter tur på én telefon. Begynn med to – dere kan legge til flere.'));
   p.append(button('To deltakere',()=>selectParty(2),'primary journey-party-choice'));
   const more=node('details',undefined,'journey-more'),summary=node('summary','Legg til flere deltakere');more.append(summary);
   const options=node('div',undefined,'journey-party-options');
   options.append(button('Tre deltakere',()=>selectParty(3),'journey-party-choice'),button('Fire deltakere',()=>selectParty(4),'journey-party-choice'));more.append(options);p.append(more);
 }
 function selectParty(count){
   profiles=Array.from({length:count},(_,i)=>M.profile('avatar-'+(i+1)));
   result=null;scenarioIndex=0;custom='';chosen=false;segment=1;active=0;step=0;setupIndex=0;customOpen=false;customDraft=null;pendingAnswer=null;current=null;started=false;finished=false;busy=false;history.length=0;reportData=null;reportFilter='yes';showMode();
 }
 function showMode(){
   const p=panel('Hvordan vil dere starte?','TO VEIER');
   p.append(node('p','Velg om dere vil finne en retning for denne stunden eller bli bedre kjent med interessene deres.'));
   const options=node('div',undefined,'journey-party-options');
   const choose=value=>{mode=value;lengths=value==='kartlegg'?[8,8,8]:[7,7,7];setupIndex=0;showSetup();};
   options.append(button('Finn stemningen',()=>choose('oppvarming'),'primary journey-party-choice'),node('p','En stund hjemme, med plass til å finne stemningen sammen.','journey-note'),button('Kartlegg interesser',()=>choose('kartlegg'),'journey-party-choice'),node('p','Utforsk interesser og fantasier, uavhengig av hvor dere er.','journey-note'));
   p.append(options,button('Endre deltakere',showParty,'text-button'));
 }
 function showSetup(){
   const a=profiles[setupIndex],first=segment===1;
   const p=panel(first?'Lag profilen din':'Juster '+a.name,'AVATAR '+(setupIndex+1));
   p.append(node('p',first?'Velg et navn og fordel poeng på det du er nysgjerrig på. Poengene viser interesser, ikke ferdigheter.':'Har interessene dine endret seg? Du har fått fire nye poeng og kan flytte poeng mellom kategoriene.'));
   const label=node('label','Avatarnavn');label.htmlFor='avatarName';
   const input=node('input');input.id='avatarName';input.type='text';input.maxLength=24;input.autocomplete='off';input.value=a.name;input.placeholder='Velg et navn';
   if(first)p.append(label,input);
   const pts=node('p','Poeng igjen: '+a.points,'journey-budget');pts.setAttribute('aria-live','polite');p.append(pts);
   skills.forEach(s=>{
     const row=node('div',undefined,'avatar-category'),info=node('details'),summary=node('summary',s.name),copy=node('p',s.cat.map(c=>names[c]||c).join(' · '),'journey-note');info.append(summary,copy);
     const controls=node('div',undefined,'avatar-category-controls'),value=node('output',a.allocated[s.id]||0);value.setAttribute('aria-label',s.name+' poeng');
     const update=delta=>{if(delta>0&&a.points<1||delta<0&&!(a.allocated[s.id]>0))return;a.allocated[s.id]=(a.allocated[s.id]||0)+delta;a.points-=delta;value.textContent=a.allocated[s.id];pts.textContent='Poeng igjen: '+a.points;minus.disabled=!a.allocated[s.id];};
     const minus=button('−',()=>update(-1)),plus=button('+',()=>update(1));
     minus.setAttribute('aria-label','Fjern poeng fra '+s.name);plus.setAttribute('aria-label','Legg poeng til '+s.name);minus.disabled=!(a.allocated[s.id]>0);
     controls.append(minus,value,plus);row.append(info,controls);p.append(row);
   });
   let consent=null;
   if(first){
     const box=node('label',undefined,'journey-check');consent=node('input');consent.type='checkbox';consent.checked=a.consent;
     box.append(consent,node('span','Jeg er over 18, ønsker å delta og vet at jeg kan stoppe eller endre mening.'));
     p.append(box,node('p','Svar for deg selv. Et ja til en fantasi er ikke en avtale om å gjennomføre noe. Svarene beholdes bare i denne åpne økten.','journey-note'));
   }
   const error=node('p',undefined,'journey-error');error.setAttribute('role','alert');p.append(error);
   p.append(button('Fortsett',()=>{
     if(first){
       const name=input.value.normalize('NFKC').trim().replace(/\s+/gu,' ');
       if(!name||name.length>24){error.textContent='Gi avataren et navn på 1–24 tegn.';input.focus();return;}
       if(profiles.some((x,i)=>i!==setupIndex&&x.name.toLocaleLowerCase('nb')===name.toLocaleLowerCase('nb'))){error.textContent='Velg et annet navn, så det er lett å skille avatarene.';input.focus();return;}
       if(!consent.checked){error.textContent='Bekreft at du ønsker å delta før du fortsetter.';consent.focus();return;}
       a.name=name;a.consent=true;
     }
     setupIndex++;if(setupIndex<profiles.length){showSetupHandoff();return;}active=0;step=0;showHandoff();
   },'primary'));
   if(!started)p.append(button('Endre deltakere',showParty,'text-button'));
 }
 function showSetupHandoff(){
   const a=profiles[setupIndex],p=panel('Gi telefonen videre','ET EGET ØYEBLIKK');
   p.append(node('p',a.name?'Nå er det '+a.name+' sin tur til å justere avataren.':'Neste deltaker kan nå lage sin egen avatar.'));p.append(button('Jeg er klar',showSetup,'primary'));
 }
 function showHandoff(preserve=false){
   if(!preserve)current=null;busy=false;const a=currentProfile(),p=panel('Din tur, '+a.name,'GI TELEFONEN VIDERE');
   p.append(node('p','Svar for deg selv. De andre trenger ikke se hvilke svar du velger.'));p.append(button('Jeg er '+a.name,showQuestion,'primary'));
 }
 function showQuestion(){
   if(busy||finished)return;started=true;if(!entries?.length){showUnavailable('bank');return;}
   const a=currentProfile(),rank=M.rank(mode,segment,step,lengths);if(!current)current=M.pick(a,entries,rank);
   if(!current){showUnavailable('pool');return;}
   const q=current,l=language[M.family(q.text).slice(5)];
   const p=panel(a.name,'AVATAR '+(active+1),false),progress=node('progress');progress.max=lengths.reduce((x,y)=>x+y,0);progress.value=lengths.slice(0,segment-1).reduce((x,y)=>x+y,0)+step;
   let text=l?.question?.[segment-1]||l?.question?.[0]||q.text;
   if(/^(?:Har du lyst på|Vil du ha)(?:\s|$)/iu.test(text))text=l?.question?.[0]||text;
   const question=node('p',text,'avatar-question');question.id='avatarQuestion';question.tabIndex=-1;
   progress.setAttribute('aria-label','Fremdrift for '+a.name);progress.setAttribute('aria-valuetext','Spørsmål '+(progress.value+1)+' av '+progress.max);p.append(progress,question);
   if(segment===1&&step===0)p.append(node('p','Hvem som gjør hva, og om det skal prøves, er ikke bestemt av svaret.','journey-note'));
   if(l?.explanation){const details=node('details',undefined,'question-explanation');details.append(node('summary','Hva betyr dette?'),node('p',l.explanation));
     const link=node('a','Åpne ordboken','text-link');link.href='#ordbok';link.setAttribute('aria-haspopup','dialog');link.onclick=e=>{e.preventDefault();showDictionary(link);};details.append(link);p.append(details);}
   const row=node('div',undefined,'journey-answer-actions'),r=revision;row.setAttribute('role','group');row.setAttribute('aria-describedby','avatarQuestion');
   [['Ja','ja'],['Kanskje','kanskje'],['Nei','nei']].forEach(([label,key])=>row.append(button(label,()=>{
     if(r!==revision||current!==q||busy&&pendingAnswer?.q!==q)return;
     const first=!pendingAnswer;
     if(first){remember();pendingAnswer={q};busy=true;}
     M.vote(a,q,key);result=null;reportData=null;chosen=false;
     Array.from(row.children).forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===label)));
     if(first)setTimeout(()=>{pendingAnswer=null;busy=false;if(finished||r!==revision)return;current=null;step++;if(step>=lengths[segment-1])advance();else showQuestion();},220);
   },key==='ja'?'primary':'')));p.append(row);
   const back=button('Forrige',previous,'text-button');back.disabled=!history.length;p.append(back);question.focus();
 }
 function advance(){
   active++;step=0;if(active<profiles.length){showHandoff();return;}
   if(segment===3){finished=true;showMatch();return;}
   segment++;active=0;setupIndex=0;profiles.forEach(a=>{a.points+=4;});showSetupHandoff();
 }
 function showUnavailable(reason){
   finished=true;const p=panel(reason==='bank'?'Spørsmålene kunne ikke lastes':'Alle aktuelle spørsmål er brukt');
   p.append(node('p',reason==='bank'?'Banken er tom eller inneholder ingen gyldige rader.':'Det er ingen nye temaer igjen innenfor rammene for denne økten. Dere kan se hva dere har matchet på.'));
   p.append(button('Se hva dere matchet på',showMatch,'primary'));
 }
 function buildResult(){
   const shared=skills.map(s=>({id:s.id,name:s.name,value:Math.min(...profiles.map(a=>s.cat.reduce((n,c)=>n+(a.scores[c]||0),0)))})).filter(s=>s.value>0).sort((a,b)=>b.value-a.value);
   const ranked=(window.DypereJourneyScenarios||[]).filter(s=>s.groups.includes(profiles.length)).map((s,i)=>({s,i,weight:shared.filter(t=>s.skills.includes(t.id)).reduce((v,t)=>v+t.value,0)})).sort((a,b)=>b.weight-a.weight||a.i-b.i);
   const positive=ranked.filter(x=>x.weight>0);return {shared,candidates:(positive.length?positive:ranked).map(x=>x.s),neutral:!positive.length};
 }
 function showFinal({keepFocus=false}={}){
   const focusId=keepFocus?document.activeElement?.id:null;
   if(!result)result=buildResult();if(scenarioIndex>=result.candidates.length)scenarioIndex=0;
   const s=result.candidates[scenarioIndex],p=panel(s?s.title:'Deres egen retning','ET FORSLAG TIL DERES STUND',!keepFocus);
   p.append(node('p',!result.neutral&&result.shared.length?'Dere har vist interesse for '+result.shared.slice(0,3).map(t=>t.name.toLowerCase()).join(', ')+'.':'Ingen felles retning ennå. Velg sammen hva dere vil.'));
   p.append(node('p','Dette er en ramme dere kan tilpasse, ikke en avtale om bestemte handlinger eller roller.','journey-note'));
   p.append(button('Se hva dere matchet på',showMatch,'primary'));
   if(s){
     const list=node('ol',undefined,'scenario-steps');
     [['Begynn sammen',s.intro],['Hoveddel',custom||s.main],['Avrunding',s.closing],['Omsorg etterpå',s.aftercare]].forEach(([label,text])=>{const li=node('li');li.append(node('strong',label),node('p',text));list.append(li);});p.append(list);
     const select=button(chosen?'Valgt sammen':'Velg dette sammen',async b=>{
       b.disabled=true;const r=revision;const yes=await U.confirmAction('Har alle lest forslaget og lyst til å velge denne rammen sammen?','Ja, vi velger dette');
       if(r!==revision)return;b.disabled=false;if(yes){chosen=true;showFinal({keepFocus:true});}
     },'primary');select.id='scenarioSelect';p.append(select);
     const edit=node('details',undefined,'scenario-edit');edit.open=customOpen;edit.ontoggle=()=>{customOpen=edit.open;};
     const toggle=node('summary','Tilpass forslaget');toggle.id='scenarioEditToggle';edit.append(toggle);
     const label=node('label','Skriv deres egen hoveddel');label.htmlFor='scenarioCustom';const input=node('textarea');input.id='scenarioCustom';input.maxLength=2000;input.rows=5;input.value=customDraft??(custom||s.main);input.oninput=()=>{customDraft=input.value;};
     const apply=button('Bruk tilpasningen',()=>{custom=input.value.trim().slice(0,2000);customDraft=custom;chosen=false;showFinal({keepFocus:true});});apply.id='scenarioApply';
     edit.append(label,input,apply);p.append(edit);
     if(result.candidates.length>1){const other=button('Vis et annet forslag',()=>{scenarioIndex=(scenarioIndex+1)%result.candidates.length;custom='';customDraft=null;chosen=false;showFinal({keepFocus:true});},'text-button');other.id='scenarioOther';p.append(other);}
   }
   p.append(button('Ny stund',async b=>{b.disabled=true;const r=revision;const yes=await U.confirmAction('Starte på nytt og fjerne avatarene og svarene fra denne økten?','Ja, start på nytt');if(r!==revision)return;if(yes)location.reload();else b.disabled=false;},'text-button'));
   if(focusId)document.getElementById(focusId)?.focus();
 }
 function noteKey(id){return 'dypere-match:'+sessionId+':'+id;}
 function showDictionary(opener){
   const dialog=node('dialog',undefined,'studio-dialog dictionary-dialog');dialog.setAttribute('aria-labelledby','journeyDictionaryTitle');
   const header=node('header',undefined,'dictionary-heading'),title=node('h2','Ordbok');title.id='journeyDictionaryTitle';
   const close=node('button','Lukk');close.type='button';close.onclick=()=>dialog.close();header.append(title,close);
   const list=node('dl',undefined,'dictionary-content');
   for(const [term,definition] of Object.entries(language)){if(!definition.explanation)continue;const row=node('div');row.append(node('dt',term),node('dd',definition.explanation));list.append(row);}
   dialog.append(header,list);dialog.onclose=()=>{dialog.remove();opener.focus();};document.body.append(dialog);dialog.showModal();close.focus();
 }
 function readNote(id){
   if(notes.has(id))return notes.get(id);
   let value='';try{value=localStorage.getItem(noteKey(id))||'';}catch(_){}
   notes.set(id,value);return value;
 }
 function phrase(item,pair){
   const l=language[item.key];
   const template=l?.retning==='sym'?l.sym:l?.retning==='passiv'?l.passiv:l?.aktiv;
   if(typeof template!=='string')return '';
   return template.replace(/\{([AB])\}/g,(_,key)=>item.answers[key==='A'?pair.a:pair.b].name);
 }
 function reportRows(){
   const all=M.responses(profiles,entries);
   if(reportFilter==='all')return all.sort((a,b)=>Number(b.nesten)-Number(a.nesten)||Number(b.jaCount>=2)-Number(a.jaCount>=2)||a.id.localeCompare(b.id));
   return M.match(profiles,entries).filter(item=>item.pairs.some(pair=>reportFilter==='yes'?pair.beggeJa:pair.nesten));
 }
 function pairsFor(item){return item.pairs.filter(pair=>reportFilter==='yes'?pair.beggeJa:reportFilter==='mixed'?pair.nesten:true);}
 function svgElement(tag,attrs={}){
   const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
   for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));return el;
 }
 function radar(){
   const axes=M.chemistry(profiles),svg=svgElement('svg',{viewBox:'0 0 460 380',role:'img','aria-label':axes.map(s=>s.name+': '+s.score+' av 100').join('. '),class:'match-radar'});
   const point=(i,r)=>{const angle=-Math.PI/2+i*2*Math.PI/7;return [230+Math.cos(angle)*r,190+Math.sin(angle)*r];};
   const points=r=>axes.map((_,i)=>point(i,r).join(',')).join(' ');
   for(const r of [30,60,90,120])svg.append(svgElement('polygon',{points:points(r),class:'match-radar-grid'}));
   axes.forEach((s,i)=>{const [x,y]=point(i,120);svg.append(svgElement('line',{x1:230,y1:190,x2:x,y2:y,class:'match-radar-grid'}));
     const [tx,ty]=point(i,151),text=svgElement('text',{x:tx,y:ty,'text-anchor':tx<220?'end':tx>240?'start':'middle','dominant-baseline':'middle'});
     const words=s.name.split(' ');let lines=[s.name];if(s.name.length>18){const middle=Math.ceil(words.length/2);lines=[words.slice(0,middle).join(' '),words.slice(middle).join(' ')];}
     lines.forEach((line,j)=>{const span=svgElement('tspan',{x:tx,dy:j===0?(lines.length===2?-7:0):15});span.textContent=line;text.append(span);});svg.append(text);
   });
   svg.append(svgElement('polygon',{points:axes.map((s,i)=>point(i,s.score*1.2).join(',')).join(' '),class:'match-radar-value'}));return svg;
 }
 function showMatch(){
   finished=true;reportData=M.match(profiles,entries);
   const p=panel('Deres kjemi','DERES MATCH');p.classList.add('match-panel');
   p.append(node('p','Et bilde av appetitten deres sammen.'),radar());
   const legend=node('dl',undefined,'match-scores');M.chemistry(profiles).forEach(axis=>{const row=node('div');row.append(node('dt',axis.name),node('dd',axis.score+' / 100'));legend.append(row);});p.append(legend);
   const yes=reportData.filter(x=>x.pairs.some(pair=>pair.beggeJa)).length,maybe=reportData.filter(x=>x.kanskjeCount>=2).length;
   p.append(node('p',profiles.length===2?yes+(yes===1?' tema har':' temaer har')+' dere begge sagt ja til. '+maybe+' sier begge kanskje.':yes+(yes===1?' tema har':' temaer har')+' minst to sagt ja til. '+maybe+' har minst to svart kanskje på.','match-count'));
   const filters=node('div',undefined,'match-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label','Velg hvilke svar som vises');
   const buttons=[];
   [['Begge ja','yes'],['Ja og kanskje','mixed'],['Alt','all']].forEach(([label,key])=>{
     const b=button(label,()=>{reportFilter=key;buttons.forEach(([el,value])=>el.setAttribute('aria-pressed',String(value===key)));renderMatches();});
     b.setAttribute('aria-pressed',String(reportFilter===key));buttons.push([b,key]);filters.append(b);
   });p.append(filters);
   reportBody=node('div',undefined,'match-list');reportBody.setAttribute('aria-live','polite');p.append(reportBody);
   const setAll=()=>{reportFilter='all';buttons.forEach(([b,key])=>b.setAttribute('aria-pressed',String(key==='all')));renderMatches();};
   reportBody.setAll=setAll;renderMatches();
   p.append(node('p','Dette er interesser, ikke avtaler.','journey-note'));
   p.append(button('Kopier som tekst',exportMatch,'primary'));
   p.append(button('Se forslag',()=>showFinal(),'text-button'));
   p.append(button('Ny stund',async b=>{b.disabled=true;const yes=await U.confirmAction('Starte på nytt og fjerne avatarene og svarene fra denne økten?','Ja, start på nytt');if(yes)location.reload();else b.disabled=false;},'text-button'));
 }
 function renderMatches(){
   reportBody.replaceChildren();const rows=reportRows();
   if(!rows.length){const empty=node('section',undefined,'match-empty');empty.append(node('h3','Ingen felles treff ennå'),node('p','Dere har ingen felles treff i dette utvalget. Dere kan se alle registrerte svar.'),button('Vis alle svar',()=>reportBody.setAll(),'text-button'));reportBody.append(empty);return;}
   skills.forEach(skill=>{
     const items=rows.filter(item=>skill.cat.includes(item.cat));if(!items.length)return;
     const section=node('section',undefined,'match-category match-section'),heading=node('h3',skill.name),badge=node('span',items.length,'match-badge');badge.setAttribute('aria-label',items.length+(items.length===1?' tema':' temaer'));heading.append(badge);section.append(heading);
     const scroller=node('div',undefined,'match-table-scroll');scroller.tabIndex=0;scroller.setAttribute('role','region');scroller.setAttribute('aria-label',skill.name+' svar');
     const table=node('table',undefined,'match-table'),caption=node('caption',skill.name),thead=node('thead'),tr=node('tr');
     profiles.forEach(profile=>{const th=node('th',profile.name);th.setAttribute('scope','col');tr.append(th);});
     const th=node('th','Felles interesse');th.setAttribute('scope','col');tr.append(th);thead.append(tr);const tbody=node('tbody');
     items.forEach(item=>{
       const pairs=pairsFor(item),shown=pairs.length?pairs:[null];
       shown.forEach((pair,i)=>{
         const row=node('tr',undefined,pair?.nesten?'nesten':'');item.answers.forEach(answer=>row.append(node('td',answer.vote,'match-vote match-answer '+answer.vote)));
         const cell=node('td');cell.append(node('p',pair?phrase(item,pair):(Array.isArray(language[item.key]?.question)?language[item.key].question[0]:item.text),'match-sentence'));
         if(pair?.nesten)cell.append(node('span','nesten','match-near'));
         {
           const suffix=pair?pair.a+'-'+pair.b:'alle';
           const detail=node('details',undefined,'match-note'),id='match-note-'+item.id+'-'+suffix,label=node('label','Notat om dette temaet'),input=node('textarea');detail.id='match-details-'+item.id+'-'+suffix;label.htmlFor=id;input.id=id;input.rows=2;input.maxLength=2000;input.value=readNote(item.id);input.setAttribute('data-match-note',item.id);
           const status=node('p',undefined,'journey-note');status.setAttribute('role','status');
           input.oninput=()=>{notes.set(item.id,input.value);document.querySelectorAll('[data-match-note]').forEach(other=>{if(other!==input&&other.getAttribute('data-match-note')===item.id)other.value=input.value;});try{localStorage.setItem(noteKey(item.id),input.value);status.textContent='';}catch(_){status.textContent='Notatet beholdes bare mens siden er åpen.';}};
           detail.append(node('summary','Notat'),label,input,status);cell.append(detail);
         }
         row.append(cell);tbody.append(row);
       });
     });table.append(caption,thead,tbody);scroller.append(table);section.append(scroller);reportBody.append(section);
   });
 }
 function exportMatch(){
   const lines=['Deres kjemi','Et bilde av appetitten deres sammen.','',...M.chemistry(profiles).map(s=>s.name+': '+s.score+' av 100'),''];
   for(const skill of skills){const items=reportRows().filter(item=>skill.cat.includes(item.cat));if(!items.length)continue;lines.push(skill.name);
     for(const item of items){const pairs=pairsFor(item);for(const pair of pairs.length?pairs:[null])lines.push(item.answers.map(a=>a.name+': '+a.vote).join(' | '),pair?phrase(item,pair):(language[item.key]?.question?.[0]||item.text),...(pair?.nesten?['nesten']:[]));const note=readNote(item.id);if(note)lines.push('Notat: '+note);lines.push('');}}
   lines.push('Dette er interesser, ikke avtaler.');
   const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'})),a=node('a');a.href=url;a.download='dypere-matchrapport.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 async function requestExit(){
   if(exiting)return;exiting=true;const yes=await U.confirmAction('Vil du avslutte og gå til hovedmenyen? Avatarer og svar fra denne økten blir fjernet.','Ja, avslutt');
   exiting=false;if(yes){finished=true;profiles=[];current=null;result=null;location.assign('./index.html');}
 }
 exit.onclick=requestExit;
 document.querySelectorAll('.app-header a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();requestExit();}));
 const curtain=$('journeyPrivacy'),resume=$('journeyContinue');
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!finished&&!curtain.open&&!document.querySelector('.studio-dialog[open]'))curtain.showModal();});
 resume.onclick=()=>curtain.close();
 showParty();
})();
