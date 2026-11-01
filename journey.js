(function(){
 'use strict';
 const U=DypereUI,{node,$}=U,M=window.DypereJourneyModel;
 const view=$('journeyView'),exit=$('journeyExit');
 const skills=window.DypereJourneyCategories,names=window.DypereJourneyCategoryNames,roots=window.DypereJourneyTree;
 const language=window.DypereJourneyLanguage||{},entries=M.index(window.DypereVarStundBank);
 M.indexReport().skipped.forEach(row=>console.warn('Vår stund: hoppet over rad',row.id,row.reason));
 M.validerLanguage(language).forEach(key=>console.warn('Vår stund: manglende språkoppføring',key));
 let profiles=[],active=0,segment=1,step=0,mode='oppvarming',lengths=[12,6,6];
 let revision=0,started=false,finished=false,busy=false,exiting=false,current=null;
 let setupIndex=0,result=null,scenarioIndex=0,custom='',chosen=false,customOpen=false,customDraft=null,pendingAnswer=null;
 const history=[];let restoredChoice=null;let importedSession=false,sessionQuestions=[];const P=window.DypereInterestProfiles;
 const sessionId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 const confirmations=new Map();
 const notes=new Map();let reportFilter='yes',reportBody=null,reportData=null;
 function copyProfile(p){return {...p,allocated:{...p.allocated},treeAllocated:p.treeAllocated.map(a=>({...a})),treePoints:[...p.treePoints],scores:{...p.scores},recent:[...p.recent],recentCats:[...p.recentCats],seenText:new Set(p.seenText),seenFamilies:new Set(p.seenFamilies),seenTopics:new Set(p.seenTopics),answers:[...p.answers]};}
 function remember(details){history.push({details,profiles:profiles.map(copyProfile),active,segment,step,setupIndex,question:current});}
 function previous(){
   if(busy||!history.length)return;
   const oldActive=active,frame=history.pop();profiles=frame.profiles.map(copyProfile);active=frame.active;segment=frame.segment;step=frame.step;setupIndex=frame.setupIndex;current=frame.question;restoredChoice=frame.details;finished=false;result=null;reportData=null;chosen=false;confirmations.clear();custom='';customDraft=null;
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
 async function changeParty(b){
   const r=revision;b.disabled=true;
   const hasData=!!document.getElementById('avatarName')?.value.trim()||profiles.some(a=>a.name||a.treeAllocated.some(level=>Object.values(level).some(Boolean))||a.answers.length);
   const yes=!hasData||await U.confirmAction('Endre deltakere og fjerne profilene og svarene som er lagt inn?','Ja, endre deltakere');
   if(r!==revision)return;b.disabled=false;if(yes)showParty();
 }
 function selectParty(count){
   profiles=Array.from({length:count},(_,i)=>M.profile('avatar-'+(i+1)));
   result=null;scenarioIndex=0;custom='';chosen=false;segment=1;active=0;step=0;setupIndex=0;customOpen=false;customDraft=null;pendingAnswer=null;current=null;started=false;finished=false;busy=false;history.length=0;confirmations.clear();reportData=null;reportFilter='yes';importedSession=false;sessionQuestions=[];showMode();
 }
 function showMode(){
   const p=panel('Hvordan vil dere starte?','TO VEIER');
   p.append(node('p','Velg om dere vil finne en retning for denne stunden eller bli bedre kjent med interessene deres.'));
   const options=node('div',undefined,'journey-party-options');
   const choose=value=>{mode=value;lengths=[12,6,6];setupIndex=0;showSetup();};
   options.append(button('Finn stemningen',()=>choose('oppvarming'),'primary journey-party-choice'),node('p','En stund hjemme, med plass til å finne stemningen sammen.','journey-note'),button('Kartlegg interesser',()=>choose('kartlegg'),'journey-party-choice'),node('p','Utforsk interesser og fantasier, uavhengig av hvor dere er.','journey-note'));
   p.append(options,button('Endre deltakere',changeParty,'text-button'));
 }
 function showTreeChoices(a,host,level,rootId=null,groupId=null){
   const focusId=document.activeElement?.id,focusLabel=document.activeElement?.textContent;host.replaceChildren();
   const levelButtons=[];
   const nav=node('div',undefined,'tree-levels');nav.setAttribute('role','group');nav.setAttribute('aria-label','Velg nivå i interessetreet');
   ['Hovedgrener','Undergrener','Temaer'].forEach((label,i)=>{const b=button(label,()=>showTreeChoices(a,host,i));b.disabled=i>segment-1;b.setAttribute('aria-pressed',String(i===level));nav.append(b);levelButtons.push(b);});host.append(nav);
   const suggestedRoot=roots.slice().sort((x,y)=>(a.treeAllocated[0][y.id]||0)-(a.treeAllocated[0][x.id]||0)||a.answers.filter(v=>v.vote==='ja'&&y.groups.includes(v.categoryId)).length-a.answers.filter(v=>v.vote==='ja'&&x.groups.includes(v.categoryId)).length)[0];
   const root=roots.find(r=>r.id===rootId)||suggestedRoot;
   const select=(label,id,options,value,action)=>{const caption=node('label',label);caption.htmlFor=id;const input=node('select');input.id=id;for(const o of options){const option=node('option',o.name);option.value=o.id;input.append(option);}input.value=value;input.onchange=()=>action(input.value);host.append(caption,input);};
   if(level>0)select('Hovedgren','treeRoot',roots,root.id,value=>showTreeChoices(a,host,level,value));
   const groups=skills.filter(g=>root.groups.includes(g.id));
   const suggested=groups.slice().sort((x,y)=>(a.treeAllocated[1][y.id]||0)-(a.treeAllocated[1][x.id]||0)||a.answers.filter(v=>v.vote==='ja'&&v.categoryId===y.id).length-a.answers.filter(v=>v.vote==='ja'&&v.categoryId===x.id).length)[0];
   const group=groups.find(g=>g.id===groupId)||suggested;
   if(level===2)select('Undergren','treeGroup',groups,group.id,value=>showTreeChoices(a,host,level,root.id,value));
   const path=level===0?'Dine interesser':root.name+(level===2?' › '+group.name:'');host.append(node('p',path,'tree-path'));
   const pts=node('p','Poeng igjen på dette nivået: '+a.treePoints[level],'journey-budget');pts.setAttribute('aria-live','polite');host.append(pts);
   const list=level===0?roots:level===1?groups:M.leaves(entries,group.id),controls=[];
   list.forEach(item=>{
     const row=node('div',undefined,'avatar-category tree-choice'),text=node('div');text.append(node('strong',item.name));
     if(item.description)text.append(node('p',item.description,'journey-note'));
     const buttons=node('div',undefined,'avatar-category-controls'),value=node('output',a.treeAllocated[level][item.id]||0);value.setAttribute('aria-label',item.name+' poeng');
     const refresh=()=>{pts.textContent='Poeng igjen på dette nivået: '+a.treePoints[level];controls.forEach(c=>{c.value.textContent=a.treeAllocated[level][c.id]||0;c.minus.disabled=!(a.treeAllocated[level][c.id]>0);c.plus.disabled=a.treePoints[level]<1;});};
     const change=delta=>{if(M.allocate(a,level,item.id,delta,entries,segment-1)){a.points=a.treePoints[segment-1];refresh();}};
     const minus=button('−',()=>change(-1)),plus=button('+',()=>change(1));minus.setAttribute('aria-label','Fjern poeng fra '+item.name);plus.setAttribute('aria-label','Legg poeng til '+item.name);minus.disabled=!(a.treeAllocated[level][item.id]>0);plus.disabled=a.treePoints[level]<1;
     controls.push({id:item.id,value,minus,plus});buttons.append(minus,value,plus);row.append(text,buttons);host.append(row);
   });
   host.append(node('p',level===0?'Poeng velger hva vi undersøker først. Null poeng betyr uprioritert, ikke nei.':'Velg en annen hovedgren for å utforske en annen retning. Poeng på ulike nivåer er separate.','journey-note'));
   if(focusId==='treeRoot'||focusId==='treeGroup')document.getElementById(focusId)?.focus();else levelButtons.find(b=>b.textContent===focusLabel)?.focus();
   if(level>0)host.append(node('p','En undergren kan nås fra flere hovedgrener. Det er samme valg og samme poeng begge steder.','journey-note'));
 }
 function appendInterestTrees(p){
   const all=node('details',undefined,'interest-trees');all.append(node('summary','Se interessetrærne'),node('p','Poeng viser prioritering på hvert nivå. Svarene nedenfor avgjør treffene.','journey-note'));
   profiles.forEach(a=>{const person=node('details');person.append(node('summary',a.name));const tree=node('ul',undefined,'interest-tree');
     roots.forEach(root=>{const branch=node('li');branch.append(node('strong',root.name+' · '+(a.treeAllocated[0][root.id]||0)+' poeng'));const children=node('ul');
       root.groups.forEach(id=>{const g=skills.find(s=>s.id===id),child=node('li');child.append(node('span',g.name+' · '+(a.treeAllocated[1][id]||0)+' poeng'));const themes=node('ul');
         M.leaves(entries,id).forEach(leaf=>{const count=a.treeAllocated[2][leaf.id]||0;if(count){themes.append(node('li',leaf.name+' · '+count+' poeng'));}});if(themes.children.length)child.append(themes);children.append(child);});branch.append(children);tree.append(branch);});person.append(tree);all.append(person);});p.append(all);
 }
 function showSetup(){
   const a=profiles[setupIndex],first=segment===1;
   const p=panel(first?'Lag profilen din':'Hvor vil du utforske videre, '+a.name+'?','AVATAR '+(setupIndex+1));
   p.append(node('p',first?'Velg et navn og en retning. Du har åtte poeng på fire hovedgrener. Du kan også la spørsmålene vise veien.':'Du har fire poeng på det nye nivået. Du kan også gå tilbake og flytte tidligere poeng.'));
   const label=node('label','Avatarnavn');label.htmlFor='avatarName';
   const input=node('input');input.id='avatarName';input.type='text';input.maxLength=24;input.autocomplete='off';input.value=a.name;input.placeholder='Velg et navn';
   let tone=null;
   if(first){p.append(label,input);const toneLabel=node('label','Språktone'),toneSelect=node('select');toneSelect.id='profileTone';toneLabel.htmlFor='profileTone';for(const [value,text] of [['diskret','Diskret'],['direkte','Direkte']]){const option=node('option',text);option.value=value;toneSelect.append(option);}toneSelect.value=a.tone||'diskret';tone=toneSelect;p.append(toneLabel,toneSelect,node('p','Bare ordvalg og visning av detaljer. Interessen din vurderes på samme måte.','journey-note'));}

   const preferences=node('div',undefined,'profile-preferences');p.append(preferences);showTreeChoices(a,preferences,segment-1);
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
       a.name=name;a.consent=true;a.tone=tone.value;
     }
     setupIndex++;if(setupIndex<profiles.length){showSetupHandoff();return;}active=0;step=0;showHandoff();
   },'primary'));
   if(!started)p.append(button('Endre deltakere',changeParty,'text-button'));
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
   const a=currentProfile(),rank=M.rank(mode,segment,step,lengths);if(!current)current=importedSession?sessionQuestions[step]:M.pick(a,entries.filter(e=>!e.card.id.startsWith('profile-')),rank,Math.random,profiles);
   if(!current){showUnavailable('pool');return;}
   const q=current,l=language[M.family(q.text).slice(5)];
   const p=panel(a.name,'AVATAR '+(active+1)+' · '+(importedSession?'DERES FELLES UTVALG':['BRED UTFORSKNING','FINN FELLES INTERESSER','AVKLAR DET SOM PASSER'][segment-1]),false),progress=node('progress');progress.max=lengths.reduce((x,y)=>x+y,0);progress.value=lengths.slice(0,segment-1).reduce((x,y)=>x+y,0)+step;
   const text=(importedSession?'Hva frister denne gangen innen ':'Er du nysgjerrig på ')+((a.tone==='direkte'?l?.directTopic:l?.topic)||q.topic||q.text).toLocaleLowerCase('nb')+'?';
   const question=node('p',text,'avatar-question');question.id='avatarQuestion';question.tabIndex=-1;
   progress.setAttribute('aria-label','Fremdrift for '+a.name);progress.setAttribute('aria-valuetext','Spørsmål '+(progress.value+1)+' av '+progress.max);p.append(progress,question);

   if(l?.explanation){const details=node('details',undefined,'question-explanation');details.open=false;details.append(node('summary','Hva betyr dette?'),node('p',l.explanation));
     const link=node('a','Åpne ordboken','text-link');link.href='#ordbok';link.setAttribute('aria-haspopup','dialog');link.onclick=e=>{e.preventDefault();showDictionary(link);};details.append(link,node('p','Ubesvart betyr ukjent. Trykk på et valgt svar for å fjerne det.','journey-note'));if(segment===1&&step===0)details.append(node('p','Hvem som gjør hva, og om det skal prøves, er ikke bestemt av svaret.','journey-note'));p.append(details);}
   const draft={...(restoredChoice?.preferences||{})},initialActuality=restoredChoice?.actuality||(importedSession?'ja':'uavklart');restoredChoice=null;
   p.classList.add('question-panel');let choiceRevision=0;const definitions=M.directions(q).filter(d=>!importedSession||a.allowed[q.id]?.includes(d.id));
   const quick=node('div',undefined,'question-quick'),precise=node('details',undefined,'question-precise');precise.append(node('summary','Nysgjerrig eller flere valg'));
   function quickAnswer(values){if(r!==revision)return;Object.keys(draft).forEach(k=>delete draft[k]);Object.assign(draft,values);submit();}
   for(const direction of definitions)quick.append(button(direction.label,()=>quickAnswer({[direction.id]:'ja'})));
   if(definitions.length>1)quick.append(button(definitions.length===2?'Begge':'Alle disse',()=>quickAnswer(Object.fromEntries(definitions.map(d=>[d.id,'ja'])))));
   quick.append(button('Ikke aktuelt',()=>quickAnswer(Object.fromEntries(definitions.map(d=>[d.id,'nei'])))));
   quick.setAttribute('aria-label','Velg det du liker');quick.setAttribute('role','group');quick.setAttribute('aria-describedby','avatarQuestion');p.append(node('p','Velg det du liker. Ett trykk går videre.','question-hint'),quick);
   precise.append(node('p','Her kan du svare ulikt for hver retning.','journey-note'));for(const direction of definitions){
     const group=node('fieldset',undefined,'direction-row');group.append(node('legend',direction.label));
     const row=node('div',undefined,'direction-options'),buttons=[];row.setAttribute('aria-describedby','avatarQuestion');
     function refresh(){buttons.forEach(([b,key])=>b.setAttribute('aria-pressed',String(draft[direction.id]===key)));}
     for(const [label,key] of [['Liker','ja'],['Nysgjerrig','kanskje'],['Ikke aktuelt','nei']]){
       const b=button(label,()=>{if(r!==revision)return;if(draft[direction.id]===key)delete draft[direction.id];else draft[direction.id]=key;refresh();const token=++choiceRevision;if(definitions.every(d=>draft[d.id]))setTimeout(()=>{if(token===choiceRevision&&!document.querySelector('.studio-dialog[open]')&&!clarify.open)submit();},420);});buttons.push([b,key]);row.append(b);
     }
     group.append(row);refresh();precise.append(group);
   }
   precise.open=Object.keys(draft).length>0;p.append(precise);
   const clarify=node('details',undefined,'question-clarify');clarify.append(node('summary','Aktualitet denne gangen'));
   const label=node('label','Er temaet aktuelt denne gangen?'),actuality=node('select');actuality.id='questionActuality';label.htmlFor=actuality.id;
   for(const [value,text] of [['uavklart','Ikke avklart'],['ja','Aktuelt denne gangen'],['senere','Bare kartlegging nå']]){const option=node('option',text);option.value=value;actuality.append(option);}actuality.value=initialActuality;clarify.append(label,actuality);p.append(clarify);
   const r=revision;
   function submit(){
     if(r!==revision||busy||current!==q)return;
     remember({preferences:{...draft},actuality:actuality.value});
     if(!M.voteDirections(a,q,draft,{actuality:actuality.value})){history.pop();return;}
     result=null;reportData=null;chosen=false;confirmations.clear();current=null;step++;
     if(step>=lengths[segment-1])advance();else showQuestion();
   }
   const actions=node('div',undefined,'question-navigation'),back=button('Forrige',previous,'text-button');back.disabled=!history.length;actions.append(back,button('Neste',submit,'primary'));p.append(actions);question.focus();
 }
 function advance(){
   active++;step=0;if(active<profiles.length){showHandoff();return;}
   if(importedSession||segment===3){finished=true;showMatch();return;}
   segment++;active=0;setupIndex=0;profiles.forEach(a=>{a.points=a.treePoints[segment-1];});showSetupHandoff();
 }
 function showUnavailable(reason){
   finished=true;const p=panel(reason==='bank'?'Spørsmålene kunne ikke lastes':'Alle aktuelle spørsmål er brukt');
   p.append(node('p',reason==='bank'?'Banken er tom eller inneholder ingen gyldige rader.':'Det er ingen nye temaer igjen innenfor rammene for denne økten. Dere kan se hva dere har matchet på.'));
   p.append(button('Se hva dere matchet på',showMatch,'primary'));if(history.length)p.append(button('Forrige',previous,'text-button'));
 }
 function buildResult(){
   const exact=M.match(profiles,entries).filter(item=>(!importedSession||item.answers.every(a=>a.actuality==='ja'))&&profiles.every((_,index)=>item.pairs.some(pair=>pair.compatible&&(pair.a===index||pair.b===index))));
   const shared=skills.map(s=>({id:s.id,name:s.name,value:exact.filter(item=>item.categoryId===s.id).length})).filter(s=>s.value>0).sort((a,b)=>b.value-a.value);
   const ranked=(window.DypereJourneyScenarios||[]).filter(s=>s.groups.includes(profiles.length)).map((s,i)=>({s,i,weight:shared.filter(t=>s.skills.includes(t.id)).reduce((v,t)=>v+t.value,0)})).sort((a,b)=>b.weight-a.weight||a.i-b.i);
   const positive=ranked.filter(x=>x.weight>0);return {shared,candidates:(positive.length?positive:ranked).map(x=>x.s),neutral:!positive.length};
 }
 function showFinal({keepFocus=false}={}){
   finished=true;
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
   if(history.length)p.append(button('Forrige',previous,'text-button'));
   if(focusId)document.getElementById(focusId)?.focus();
 }
 function noteKey(id){return 'dypere-match:'+sessionId+':'+id;}
 function showDictionary(opener){
   const dialog=node('dialog',undefined,'studio-dialog dictionary-dialog');dialog.setAttribute('aria-labelledby','journeyDictionaryTitle');
   const header=node('header',undefined,'dictionary-heading'),title=node('h2','Ordbok');title.id='journeyDictionaryTitle';
   const close=node('button','Lukk');close.type='button';close.onclick=()=>dialog.close();header.append(title,close);
   const list=node('dl',undefined,'dictionary-content');
   for(const [term,definition] of Object.entries(language)){if(!definition.explanation)continue;const row=node('div');row.append(node('dt',definition.topic||term),node('dd',definition.explanation));list.append(row);}
   dialog.append(header,list);dialog.onclose=()=>{dialog.remove();opener.focus();};document.body.append(dialog);dialog.showModal();close.focus();
 }
 function readNote(id){
   if(notes.has(id))return notes.get(id);
   let value='';try{value=localStorage.getItem(noteKey(id))||'';}catch(_){}
   notes.set(id,value);return value;
 }
 const answerLabels={ja:'Liker',kanskje:'Nysgjerrig',nei:'Ikke aktuelt','–':'Ubesvart'};
 function answerText(item,answer){return item.directions.map(d=>d.label+': '+answerLabels[answer.preferences[d.id]||'–']).join('; ');}
 function phrase(item,pair,full=true){
   const topic=language[item.key]?.topic||item.topic||item.key,a=item.answers[pair.a],b=item.answers[pair.b];
   const label=id=>item.directions.find(d=>d.id===id)?.label||id;
   const routes=pair.routes.map(route=>a.name+': '+label(route.aDirection)+' ('+answerLabels[route.aVote]+'); '+b.name+': '+label(route.bDirection)+' ('+answerLabels[route.bVote]+')');
   return topic+' — '+(routes.length?routes.join(' / '):a.name+' og '+b.name)+'.'+(full?' '+pair.status+'.':'');
 }
 function reportRows(){
   return M.responses(profiles,entries).filter(item=>reportFilter==='all'||pairsFor(item).length).sort((a,b)=>Number(b.pairs.some(p=>p.compatible))-Number(a.pairs.some(p=>p.compatible))||a.id.localeCompare(b.id));
 }
 function pairsFor(item){return item.pairs.filter(pair=>reportFilter==='yes'?pair.compatible:reportFilter==='mixed'?pair.nesten||pair.needsClarification:true);}
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
   p.append(node('p','Samlet interesse i denne økten, ikke en matchprosent. Ubesvart betyr ukjent.'),radar());
   const legend=node('dl',undefined,'match-scores');M.chemistry(profiles).forEach(axis=>{const row=node('div');row.append(node('dt',axis.name),node('dd',axis.score+' / 100'));legend.append(row);});p.append(legend);
   const yes=reportData.filter(x=>x.pairs.some(pair=>pair.compatible)).length,maybe=M.responses(profiles,entries).filter(x=>x.pairs.some(pair=>pair.nesten||pair.needsClarification)).length;
   p.append(node('p',yes+(yes===1?' tema har':' temaer har')+' kompatible retninger. '+maybe+' trenger avklaring.','match-count'));
   appendInterestTrees(p);
   const filters=node('div',undefined,'match-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label','Velg hvilke svar som vises');
   const buttons=[];
   [['Treff','yes'],['Til avklaring','mixed'],['Alt','all']].forEach(([label,key])=>{
     const b=button(label,()=>{reportFilter=key;buttons.forEach(([el,value])=>el.setAttribute('aria-pressed',String(value===key)));renderMatches();});
     b.setAttribute('aria-pressed',String(reportFilter===key));buttons.push([b,key]);filters.append(b);
   });p.append(filters);
   reportBody=node('div',undefined,'match-list');reportBody.setAttribute('aria-live','polite');p.append(reportBody);
   const setAll=()=>{reportFilter='all';buttons.forEach(([b,key])=>b.setAttribute('aria-pressed',String(key==='all')));renderMatches();};
   reportBody.setAll=setAll;renderMatches();
   p.append(node('p','Dette er interesser, ikke avtaler.','journey-note'));
   p.append(button('Kopier som tekst',exportMatch,'primary'));
   p.append(button('Se forslag',()=>showFinal(),'text-button'));
   if(history.length)p.append(button('Forrige',previous,'text-button'));
   p.append(button('Ny stund',async b=>{b.disabled=true;const yes=await U.confirmAction('Starte på nytt og fjerne avatarene og svarene fra denne økten?','Ja, start på nytt');if(yes)location.reload();else b.disabled=false;},'text-button'));
 }
 function confirmPair(item,pair,key,index=0){
   const person=item.answers[index===0?pair.a:pair.b],p=panel('Gi telefonen til '+person.name,'BEKREFT OPPSUMMERINGEN');
   p.append(button('Jeg er '+person.name,()=>{
     const card=panel(person.name,'DITT VALG');card.append(node('p',phrase(item,pair)));
     card.append(button('Dette passer for meg denne gangen',()=>{const done=confirmations.get(key)||[];if(!done.includes(person.profileId))done.push(person.profileId);confirmations.set(key,done);if(index===0)confirmPair(item,pair,key,1);else showMatch();},'primary'));
     card.append(button('Tilbake til rapporten',()=>{confirmations.delete(key);showMatch();},'text-button'));
   },'primary'));
 }
 function renderMatches(){
   reportBody.replaceChildren();const rows=reportRows();
   if(!rows.length){const empty=node('section',undefined,'match-empty');empty.append(node('h3','Ingen felles treff ennå'),node('p','Dere har ingen felles treff i dette utvalget. Dere kan se alle registrerte svar.'),button('Vis alle svar',()=>reportBody.setAll(),'text-button'));reportBody.append(empty);return;}
   skills.forEach(skill=>{
     const items=rows.filter(item=>item.categoryId===skill.id);if(!items.length)return;
     const section=node('section',undefined,'match-category match-section'),heading=node('h3',skill.name),badge=node('span',items.length,'match-badge');badge.setAttribute('aria-label',items.length+(items.length===1?' tema':' temaer'));heading.append(badge);section.append(heading);
     const scroller=node('div',undefined,'match-table-scroll');scroller.tabIndex=0;scroller.setAttribute('role','region');scroller.setAttribute('aria-label',skill.name+' svar');
     const table=node('table',undefined,'match-table'),caption=node('caption','Deltakernes svar på temaene nedenfor'),thead=node('thead'),tr=node('tr');
     profiles.forEach(profile=>{const th=node('th',profile.name);th.setAttribute('scope','col');tr.append(th);});
     const th=node('th','Felles interesse');th.setAttribute('scope','col');tr.append(th);thead.append(tr);const tbody=node('tbody');
     items.forEach(item=>{
       const pairs=pairsFor(item),shown=pairs.length?pairs:[null];
       shown.forEach((pair,i)=>{
         const row=node('tr',undefined,pair?.nesten?'nesten':'');item.answers.forEach(answer=>{const td=node('td',answerText(item,answer),'match-answer');td.append(node('p',({ja:'Aktuelt nå',senere:'Bare kartlegging',uavklart:'Aktualitet uavklart'})[answer.actuality],'journey-note'));row.append(td);});
         const cell=node('td');cell.append(node('p',pair?phrase(item,pair,false):(language[item.key]?.topic||item.topic||item.key),'match-sentence'));
         if(pair)cell.append(node('span',pair.status,'match-near'));
         if(pair?.compatible&&pair.status==='Kompatible ønsker'){const key=item.id+':'+pair.a+':'+pair.b;const confirm=button(confirmations.get(key)?.length===2?'Valgt sammen':'Bekreft hver for dere',()=>confirmPair(item,pair,key),'text-button');confirm.disabled=confirmations.get(key)?.length===2;cell.append(confirm);}
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
   const lines=['Deres kjemi','Registrerte interesser. Ubesvart betyr ukjent.','',...M.chemistry(profiles).map(s=>s.name+': '+s.score+' av 100'),''];
   for(const skill of skills){const items=reportRows().filter(item=>item.categoryId===skill.id);if(!items.length)continue;lines.push(skill.name);
     for(const item of items){const pairs=pairsFor(item);for(const pair of pairs.length?pairs:[null])lines.push(item.answers.map(a=>a.name+': '+answerText(item,a)+'; '+({ja:'Aktuelt nå',senere:'Bare kartlegging',uavklart:'Aktualitet uavklart'})[a.actuality]).join(' | '),pair?phrase(item,pair):(language[item.key]?.topic||item.topic||item.key),...(pair?.nesten?['nesten']:[]));const note=readNote(item.id);if(note)lines.push('Notat: '+note);lines.push('');}}
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

 function showWelcome(){
  const p=panel('Deres utgangspunkt','VÅR STUND');p.append(node('p','Lag profilen din én gang. Last inn profilene når dere vil finne en felles retning.'));
  const link=node('a','Min interesseprofil','primary profile-start');link.href='./kartlegging.html';p.append(link,button('Last inn profiler',showProfileImport,'primary'));
  const old=node('details',undefined,'journey-more');old.append(node('summary','Uten profilfil'),button('Start uten profil',showParty,'text-button'));p.append(old);
 }
 function showProfileImport(){
  const p=panel('Last inn profilene','DERES FELLES UTVALG'),loaded=[],status=node('p'),list=node('div'),summary=node('p',undefined,'journey-note');let reading=false;status.setAttribute('role','status');
  p.append(node('p','Velg din egen og partnernes profilfiler. 2–4 deltakere. Filene leses bare her på enheten.'));
  const label=node('label','Velg profilfiler'),input=node('input');input.type='file';input.multiple=true;input.accept='.json,application/json';input.id='sessionProfileFiles';label.htmlFor=input.id;
  const options=node('details',undefined,'question-clarify');options.append(node('summary','Tilpass utvalget'));
  function check(text){const l=node('label'),c=node('input');c.type='checkbox';l.append(c,node('span',text));options.append(l);c.onchange=update;return c;}
  const curious=check('Ta med nysgjerrighet'),explore=check('Spør om ubesvarte partnerinteresser');
  const maxLabel=node('label','Øvre nivå denne gangen'),max=node('select');max.id='sessionMax';maxLabel.htmlFor=max.id;for(const [v,t] of [[2,'Mykere utvalg'],[3,'Variert utvalg'],[5,'Hele det felles utvalget']]){const o=node('option',t);o.value=String(v);max.append(o);}max.value='3';max.onchange=update;options.append(maxLabel,max);
  const amountLabel=node('label','Temaer per deltaker'),amount=node('select');amount.id='sessionAmount';amountLabel.htmlFor=amount.id;for(const v of [8,12,24]){const o=node('option',String(v));o.value=String(v);amount.append(o);}amount.value='12';amount.onchange=update;options.append(amountLabel,amount);
  const start=button('Finn vår stund',()=>{
   const candidates=selection();if(reading||!candidates.length)return;
   // Sample across the permitted range, then progress from soft to more intense.
   const limit=Math.min(Number(amount.value),candidates.length),selected=Array.from({length:limit},(_,i)=>candidates[limit===1?0:Math.round(i*(candidates.length-1)/(limit-1))]);
   profiles=loaded.map((saved,i)=>{const a=M.profile('avatar-'+(i+1));a.name=saved.name;a.tone='diskret';a.allowed=Object.fromEntries(selected.map(x=>[x.card.id,x.item.allowed[i]]));return a;});
   importedSession=true;sessionQuestions=selected.map(x=>x.card);lengths=[sessionQuestions.length];active=0;segment=1;step=0;history.length=0;current=null;result=null;reportData=null;chosen=false;confirmations.clear();finished=false;started=true;showHandoff();
  },'primary');
  function selection(){if(loaded.length<2)return [];const plan=P.plan(loaded,{curious:curious.checked,explore:explore.checked});return plan.items.map(item=>{const id=window.DypereProfileQuestionIds[item.topic.id],entry=entries.find(e=>e.card.id===id);if(!entry)return null;const level=Math.max(...loaded.map(a=>a.levels[item.topic.id]||entry.card.rang));return {item,card:{...entry.card,rang:level}};}).filter(x=>x&&x.card.rang<=Number(max.value)).sort((a,b)=>a.card.rang-b.card.rang||Number(a.item.uncertain)-Number(b.item.uncertain)||a.card.id.localeCompare(b.card.id));}
  function update(){list.replaceChildren();loaded.forEach((a,i)=>{const row=node('div',undefined,'loaded-profile');row.append(node('span',a.name),button('Fjern '+a.name,()=>{loaded.splice(i,1);update();},'text-button'));list.append(row);});const candidates=selection();summary.textContent=loaded.length<2?'Legg inn minst to profiler.':candidates.length?candidates.length+(candidates.length===1?' tema passer':' temaer passer')+' alle deltakerne. Vi starter mykere og holder oss innenfor valgt nivå.':'Ingen felles temaer i dette utvalget. Dere kan velge nysgjerrighet eller endre profilene. Et nei blir ikke overstyrt.';start.disabled=reading||!candidates.length;}
  input.onchange=async()=>{if(reading)return;reading=true;input.disabled=true;status.textContent='Leser profilfilene …';update();const r=revision;try{const files=Array.from(input.files||[]);if(loaded.length+files.length>4)throw Error('Det er plass til opptil fire profiler.');const batch=await Promise.all(files.map(async f=>{if(f.size>2000000)throw Error('En av profilfilene er for stor.');return P.parse(await f.text());}));if(r!==revision)return;if(new Set([...loaded,...batch].map(a=>a.id)).size!==loaded.length+batch.length)throw Error('Samme profil er valgt flere ganger.');loaded.push(...batch);status.textContent='';update();}catch(e){if(r===revision)status.textContent=e.message;}finally{if(r===revision){reading=false;input.disabled=false;input.value='';update();}}};
  p.append(label,input,list,status,options,summary,start,button('Tilbake',showWelcome,'text-button'));update();
 }
 showWelcome();
})();
