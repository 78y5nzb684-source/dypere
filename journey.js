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
 const history=[];let restoredChoice=null;let answerReadyAt=0;let importedSession=false,sessionQuestions=[];const P=window.DypereInterestProfiles;
 const sessionId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 const confirmations=new Map();
 const notes=new Map();let reportFilter='yes',reportBody=null,reportData=null;
 const S=window.DypereSessionPlanner;
 let shortSession=false,sourceProfiles=[],shortQueue=[],today=S.options(),runStep=0;
 let shortPlan=null,activityChoice=null;const activitySeen=new Set(),A=window.DypereActivityRegistry;
 A.validate().forEach(error=>console.warn('Aktivitetsregister:',error));
 const sessionOverrides=new Map();
 const backButton=$('journeyBack');let backAction=null,screenId='',screenRenderer=null,reportReturn=null,proposalReturn=null;
 let loadedProfiles=[],partyFingerprint='',navigatingBack=false,runningActivityId=null,runCompleted=false;
 function navigation(id,action,destination,render){
  screenId=id;screenRenderer=render;backAction=action;if(document.body)document.body.dataset.journeyScreen=id;
  if(backButton){backButton.textContent=id==='welcome'?'Hovedmeny':'← Tilbake';backButton.setAttribute('aria-label',id==='welcome'?'Hovedmeny':'Tilbake til '+destination);}
  exit.hidden=id==='welcome';
 }
 async function navigateBack(){if(exiting||busy||navigatingBack)return;navigatingBack=true;try{const editor=document.querySelector('.profile-editor-dialog[open]');if(editor?.requestBack){await editor.requestBack();return;}if(backAction)await backAction();}finally{navigatingBack=false;}}
 function initialSessionBack(){
  if(history.length){previous();return;}
  if(shortSession||sourceProfiles.length){showToday(sourceProfiles);return;}
  setupIndex=Math.max(0,profiles.length-1);showSetupHandoff();
 }
 function proposalBack(){if(proposalReturn){proposalReturn();return;}if(history.length)previous();else if(sourceProfiles.length)showToday(sourceProfiles);else showMode();}
 function openProfileEditor(mode,opener){
  const dialog=node('dialog',undefined,'studio-dialog profile-editor-dialog'),bar=node('div',undefined,'profile-editor-bar'),close=node('button','Tilbake til Vår stund','text-button'),frame=node('iframe',undefined,'profile-editor-frame');
  close.type='button';frame.title=mode==='edit'?'Les eller rediger interesseprofil':'Lag interesseprofil';frame.src='./kartlegging.html?mode='+mode+'&embedded=1';dialog.setAttribute('aria-label',frame.title);bar.append(close);dialog.append(bar,frame);document.body.append(dialog);
  let closing=false;
  async function finish(){if(closing)return;closing=true;const guard=frame.contentWindow?.DypereProfileEditor?.requestClose;const allowed=!guard||await guard();closing=false;if(!allowed)return;dialog.close();dialog.remove();window.removeEventListener('message',message);opener?.focus();}
  function message(event){if(event.origin===location.origin&&event.source===frame.contentWindow&&event.data?.type==='dypere-profile-close')finish();}
  dialog.requestBack=finish;close.onclick=finish;dialog.oncancel=event=>{event.preventDefault();finish();};window.addEventListener('message',message);dialog.showModal();close.focus();
 }
 function copyProfile(p){return {...p,allocated:{...p.allocated},treeAllocated:p.treeAllocated.map(a=>({...a})),treePoints:[...p.treePoints],scores:{...p.scores},recent:[...p.recent],recentCats:[...p.recentCats],seenText:new Set(p.seenText),seenFamilies:new Set(p.seenFamilies),seenTopics:new Set(p.seenTopics),answers:[...p.answers]};}
 function remember(details){history.push({details,profiles:profiles.map(copyProfile),active,segment,step,setupIndex,question:current});}
 function previous(){
   if(busy||!history.length)return;
   proposalReturn=null;runningActivityId=null;runCompleted=false;
   const oldActive=active,frame=history.pop();profiles=frame.profiles.map(copyProfile);active=frame.active;segment=frame.segment;step=frame.step;setupIndex=frame.setupIndex;current=frame.question;restoredChoice={...frame.details,questionId:current.id,profileId:profiles[active].id};answerReadyAt=0;finished=false;result=null;reportData=null;chosen=false;confirmations.clear();custom='';customDraft=null;
   if(shortSession)sessionOverrides.delete(sourceProfiles[active].id+':'+current.id);
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
   navigation('party',showWelcome,'Vår stund',showParty);
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
   if(r!==revision)return;b.disabled=false;if(yes){started=false;profiles=[];sourceProfiles=[];loadedProfiles=[];partyFingerprint='';history.length=0;sessionOverrides.clear();shortPlan=null;showParty();}
 }
 function selectParty(count){
   shortSession=false;sourceProfiles=[];shortQueue=[];
   profiles=Array.from({length:count},(_,i)=>M.profile('avatar-'+(i+1)));
   result=null;scenarioIndex=0;custom='';chosen=false;segment=1;active=0;step=0;setupIndex=0;customOpen=false;customDraft=null;pendingAnswer=null;restoredChoice=null;answerReadyAt=0;current=null;started=false;finished=false;busy=false;history.length=0;confirmations.clear();reportData=null;reportFilter='yes';importedSession=false;sessionQuestions=[];showMode();
 }
 function showMode(){
   navigation('mode',()=>changeParty(backButton||exit),'deltakervalg',showMode);
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
   navigation('setup',()=>{const input=$('avatarName');if(input)profiles[setupIndex].name=input.value;if(setupIndex===0&&segment===1)showMode();else showSetupHandoff();},setupIndex===0&&segment===1?'modusvalg':'overleveringen',showSetup);
   const a=profiles[setupIndex],first=segment===1;
   const p=panel(first?'Lag profilen din':'Hvor vil du utforske videre, '+a.name+'?','AVATAR '+(setupIndex+1));
   p.append(node('p',first?'Velg et navn og en retning. Du har åtte poeng på fire hovedgrener. Du kan også la spørsmålene vise veien.':'Du har fire poeng på det nye nivået. Du kan også gå tilbake og flytte tidligere poeng.'));
   const label=node('label','Avatarnavn');label.htmlFor='avatarName';
   const input=node('input');input.id='avatarName';input.type='text';input.maxLength=24;input.autocomplete='off';input.value=a.name;input.placeholder='Velg et navn';
   if(first){input.oninput=()=>{a.name=input.value;};p.append(label,input);}

   const preferences=node('div',undefined,'profile-preferences');p.append(preferences);showTreeChoices(a,preferences,segment-1);
   let consent=null;
   if(first){
     const box=node('label',undefined,'journey-check');consent=node('input');consent.type='checkbox';consent.checked=a.consent;consent.onchange=()=>{a.consent=consent.checked;};
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
   if(!started)p.append(button('Endre deltakere',changeParty,'text-button'));
 }
 function showSetupHandoff(){
   navigation('setup-handoff',()=>{if(setupIndex>0){setupIndex--;showSetupHandoff();}else if(history.length)previous();else showMode();},setupIndex>0?'forrige deltaker':'forrige steg',showSetupHandoff);
   const a=profiles[setupIndex],p=panel('Gi telefonen videre','ET EGET ØYEBLIKK');
   p.append(node('p',a.name?'Nå er det '+a.name+' sin tur til å justere avataren.':'Neste deltaker kan nå lage sin egen avatar.'));p.append(button('Jeg er klar',showSetup,'primary'));
 }
 function showHandoff(preserve=false){
   navigation('handoff',initialSessionBack,history.length?'forrige spørsmål':shortSession?'kveldens rammer':'profiloppsettet',()=>showHandoff(true));
   if(!preserve)current=null;busy=false;const a=currentProfile(),p=panel('Din tur, '+a.name,'GI TELEFONEN VIDERE');
   p.append(node('p','Svar for deg selv. De andre trenger ikke se hvilke svar du velger.'));p.append(button('Jeg er '+a.name,showQuestion,'primary'));
 }
 function showQuestion(){
   if(busy||finished)return;started=true;if(!entries?.length){showUnavailable('bank');return;}
   const a=currentProfile(),rank=M.rank(mode,segment,step,lengths);if(!current)current=shortSession?shortQueue[step]?.card:importedSession?sessionQuestions[step]:M.pick(a,entries.filter(e=>!e.card.id.startsWith('profile-')),rank,Math.random,profiles);
   if(!current){showUnavailable('pool');return;}
   const q=current,l=language[M.family(q.text).slice(5)];
   const p=panel(a.name,'AVATAR '+(active+1)+' · '+(importedSession?'DERES FELLES UTVALG':['BRED UTFORSKNING','FINN FELLES INTERESSER','AVKLAR DET SOM PASSER'][segment-1]),false),progress=node('progress');progress.max=lengths.reduce((x,y)=>x+y,0);progress.value=lengths.slice(0,segment-1).reduce((x,y)=>x+y,0)+step;
   const topic=l?.topic||q.topic||q.text;
   const text='«'+topic+'» – hva frister'+(importedSession?' i kveld':'')+'?';
   const question=node('p',text,'avatar-question');question.id='avatarQuestion';question.tabIndex=-1;
   progress.setAttribute('aria-label','Fremdrift for '+a.name);progress.setAttribute('aria-valuetext','Spørsmål '+(progress.value+1)+' av '+progress.max);p.append(progress,question);

   if(l?.explanation){const details=node('details',undefined,'question-explanation');details.open=false;details.append(node('summary','Hva betyr dette?'),node('p',l.explanation));
     const link=node('a','Åpne ordboken','text-link');link.href='#ordbok';link.setAttribute('aria-haspopup','dialog');link.onclick=e=>{e.preventDefault();showDictionary(link);};details.append(link,node('p','Ubesvart betyr ukjent. Trykk på et valgt svar for å fjerne det.','journey-note'));if(segment===1&&step===0)details.append(node('p','Hvem som gjør hva, og om det skal prøves, er ikke bestemt av svaret.','journey-note'));p.append(details);}
   const restored=restoredChoice?.questionId===q.id&&restoredChoice?.profileId===a.id?restoredChoice:null;
   const draft={...(restored?.preferences||{})},initialActuality=restored?.actuality||'uavklart';restoredChoice=null;
   p.classList.add('question-panel');p.setAttribute('data-question-id',q.id);const definitions=M.directions(q).filter(d=>!importedSession||a.allowed[q.id]?.includes(d.id));
   const quick=node('div',undefined,'question-quick'),precise=node('details',undefined,'question-precise');precise.append(node('summary','Nysgjerrig eller flere valg'));
   function quickAnswer(values){if(r!==revision)return;if(Date.now()<answerReadyAt){question.focus();return;}Object.keys(draft).forEach(k=>delete draft[k]);Object.assign(draft,values);submit();}
   for(const direction of definitions)quick.append(button(direction.label,()=>quickAnswer({[direction.id]:'ja'})));
   if(definitions.length>1)quick.append(button(definitions.length===2?'Begge retninger':'Alle retninger',()=>quickAnswer(Object.fromEntries(definitions.map(d=>[d.id,'ja'])))));
   quick.append(button('Ikke aktuelt',()=>quickAnswer(Object.fromEntries(definitions.map(d=>[d.id,'nei'])))));
   quick.setAttribute('aria-label','Velg det du liker');quick.setAttribute('role','group');quick.setAttribute('aria-describedby','avatarQuestion');p.append(node('p',shortSession?'Velg det som frister i kveld. Ett trykk går videre.':'Velg det du liker. Ett trykk går videre.','question-hint'),quick);
   precise.append(node('p','Her kan du svare ulikt for hver retning.','journey-note'));for(const direction of definitions){
     const group=node('fieldset',undefined,'direction-row');group.append(node('legend',direction.label));
     const row=node('div',undefined,'direction-options'),buttons=[];row.setAttribute('aria-describedby','avatarQuestion');
     function refresh(){buttons.forEach(([b,key])=>b.setAttribute('aria-pressed',String(draft[direction.id]===key)));}
     for(const [label,key] of [['Liker','ja'],['Nysgjerrig','kanskje'],['Ikke aktuelt','nei']]){
       const b=button(label,()=>{if(r!==revision)return;if(draft[direction.id]===key)delete draft[direction.id];else draft[direction.id]=key;refresh();});buttons.push([b,key]);row.append(b);
     }
     group.append(row);refresh();precise.append(group);
   }
   precise.open=Object.keys(draft).length>0;p.append(precise);
   const clarify=node('details',undefined,'question-clarify');clarify.append(node('summary','Aktualitet denne gangen'));
   const label=node('label','Er temaet aktuelt denne gangen?'),actuality=node('select');actuality.id='questionActuality';label.htmlFor=actuality.id;
   for(const [value,text] of [['uavklart','Ikke avklart'],['ja','Aktuelt denne gangen'],['senere','Bare kartlegging nå']]){const option=node('option',text);option.value=value;actuality.append(option);}actuality.value=initialActuality;clarify.append(label,actuality);p.append(clarify);
   if(shortSession){clarify.hidden=true;const base=sourceProfiles[active],summary=definitions.map(d=>d.label+': '+({ja:'liker',kanskje:'nysgjerrig'})[base.preferences[shortQueue[step].item.topic.id]?.[d.id]]).join(' · ');const baseline=node('details',undefined,'question-profile-basis');baseline.append(node('summary','Fra profilen din'),node('p',summary,'journey-note'));p.append(baseline);}
   const r=revision;
   navigation('question',()=>{if(history.length)previous();else{restoredChoice={preferences:{...draft},actuality:actuality.value,questionId:q.id,profileId:a.id};showHandoff(true);}},history.length?'forrige spørsmål':'overleveringen',showQuestion);
   function submit(){
     if(r!==revision||busy||current!==q||Date.now()<answerReadyAt)return;
     remember({preferences:{...draft},actuality:actuality.value});
     const currentActuality=shortSession?(Object.values(draft).includes('ja')?'ja':'uavklart'):actuality.value;
     if(!M.voteDirections(a,q,draft,{actuality:currentActuality})){history.pop();return;}
     if(shortSession)sessionOverrides.set(sourceProfiles[active].id+':'+q.id,{preferences:{...draft},actuality:currentActuality});
     answerReadyAt=Date.now()+300;result=null;reportData=null;chosen=false;confirmations.clear();current=null;step++;
     if(shortSession){
       while(step<shortQueue.length&&!S.canStillMatch(shortQueue[step].item,profiles))step++;
       if(step>=shortQueue.length||S.enough(profiles,entries,today,shortPlan.items.length)){finished=true;showFinal();return;}
       const next=shortQueue[step].personIndex,changed=active!==next;active=next;if(changed)showHandoff();else showQuestion();return;
     }
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
   navigation('unavailable',initialSessionBack,'forrige steg',()=>showUnavailable(reason));
   finished=true;const p=panel(reason==='bank'?'Spørsmålene kunne ikke lastes':'Alle aktuelle spørsmål er brukt');
   p.append(node('p',reason==='bank'?'Banken er tom eller inneholder ingen gyldige rader.':'Det er ingen nye temaer igjen innenfor rammene for denne økten. Dere kan se hva dere har matchet på.'));
   p.append(button('Se hva dere matchet på',showMatch,'primary'));if(history.length)p.append(button('Forrige',previous,'text-button'));
 }
 function buildResult(){
   const exact=M.match(profiles,entries).filter(item=>(!importedSession||item.answers.every(a=>shortSession?a.actuality!=='senere':a.actuality==='ja'))&&profiles.every((_,index)=>item.pairs.some(pair=>pair.compatible&&(pair.a===index||pair.b===index))));
   const shared=skills.map(s=>({id:s.id,name:s.name,value:exact.filter(item=>item.categoryId===s.id).length})).filter(s=>s.value>0).sort((a,b)=>b.value-a.value);
   const ranked=(window.DypereJourneyScenarios||[]).filter(s=>s.groups.includes(profiles.length)).map((s,i)=>({s,i,weight:shared.filter(t=>s.skills.includes(t.id)).reduce((v,t)=>v+t.value,0)})).sort((a,b)=>b.weight-a.weight||a.i-b.i);
   const positive=ranked.filter(x=>x.weight>0);return {exact,possible:M.match(profiles,entries).filter(item=>item.pairs.some(pair=>pair.nesten)),shared,candidates:(positive.length?positive:ranked).map(x=>x.s),neutral:!positive.length};
 }
 function showFinal({keepFocus=false}={}){
   if(shortSession){showShortProposal();return;}
   navigation('final',()=>{if(proposalReturn)proposalReturn();else if(history.length)previous();else showMode();},proposalReturn?'rapporten':'siste spørsmål',()=>showFinal());
   finished=true;
   const focusId=keepFocus?document.activeElement?.id:null;
   if(!result)result=buildResult();if(scenarioIndex>=result.candidates.length)scenarioIndex=0;
   const s=result.candidates[scenarioIndex],p=panel(s?s.title:'Deres egen retning','ET FORSLAG TIL DERES STUND',!keepFocus);
   p.append(node('p',!result.neutral&&result.shared.length?'Dere har vist interesse for '+result.shared.slice(0,3).map(t=>t.name.toLowerCase()).join(', ')+'.':'Ingen felles retning ennå. Velg sammen hva dere vil.'));
   p.append(node('p','Dette er en ramme dere kan tilpasse, ikke en avtale om bestemte handlinger eller roller.','journey-note'));
   p.append(button('Se hva dere matchet på',showMatch,'primary'));
   if(s){
     const basis=result.exact.filter(item=>s.skills.includes(item.categoryId));
     if(basis.length){const details=node('details',undefined,'scenario-basis');details.append(node('summary','Treff bak forslaget ('+basis.length+')'));const ul=node('ul');basis.forEach(item=>ul.append(node('li',language[item.key]?.topic||item.cat)));details.append(ul);p.append(details);}
     const tentative=result.possible.filter(item=>s.skills.includes(item.categoryId));
     if(tentative.length){const details=node('details',undefined,'scenario-possible');details.append(node('summary','Mulige treff å avklare ('+tentative.length+')'));const ul=node('ul');tentative.forEach(item=>ul.append(node('li',language[item.key]?.topic||item.cat)));details.append(ul);p.append(details);}
     if(result.candidates.length>1)p.append(node('p','Forslag '+(scenarioIndex+1)+' av '+result.candidates.length,'journey-note'));
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
   if(['proposal','final'].includes(screenId)&&proposalReturn===showMatch)proposalReturn=null;
   else if(!['match','confirm'].includes(screenId))reportReturn=['question','handoff'].includes(screenId)?()=>showFinal():screenRenderer||(()=>showFinal());
   navigation('match',()=>reportReturn?.(),'forrige skjerm',showMatch);
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
   p.append(button('Se forslag',()=>{proposalReturn=showMatch;showFinal();},'text-button'));
   if(history.length)p.append(button('Endre siste svar',previous,'text-button'));
   p.append(button('Ny stund',async b=>{b.disabled=true;const yes=await U.confirmAction('Starte på nytt og fjerne avatarene og svarene fra denne økten?','Ja, start på nytt');if(yes)location.reload();else b.disabled=false;},'text-button'));
 }
 function confirmPair(item,pair,key,index=0){
   navigation('confirm',showMatch,'rapporten',()=>confirmPair(item,pair,key,index));
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
         const row=node('tr',undefined,pair?.nesten?'nesten':'');item.answers.forEach(answer=>{const td=node('td',answerText(item,answer),'match-answer');if(shortSession)td.append(node('p',answer.origin==='profile'?'Fra profilfilen':'Avklart i denne stunden','journey-note'));td.append(node('p',({ja:'Aktuelt nå',senere:'Bare kartlegging',uavklart:'Aktualitet uavklart'})[answer.actuality],'journey-note'));row.append(td);});
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
   if(!started&&!profiles.length&&!loadedProfiles.length){location.assign('./index.html');return;}
   if(exiting)return;exiting=true;const yes=await U.confirmAction('Vil du avslutte og gå til hovedmenyen? Avatarer og svar fra denne økten blir fjernet.','Ja, avslutt');
   exiting=false;if(yes){finished=true;profiles=[];current=null;result=null;location.assign('./index.html');}
 }
 exit.onclick=requestExit;
 if(backButton)backButton.onclick=navigateBack;
 // One guard entry lets the browser's Back button follow the same screen route.
 // No profile data is written to browser history or browser storage.
 if(window.history?.pushState){
  if(!window.history.state?.dypereJourney){window.history.replaceState({dypereJourney:true,guard:false},'');window.history.pushState({dypereJourney:true,guard:true},'');}
  else if(!window.history.state.guard)window.history.pushState({dypereJourney:true,guard:true},'');
  window.addEventListener('popstate',event=>{if(event.state?.dypereJourney&&!event.state.guard){window.history.pushState({dypereJourney:true,guard:true},'');navigateBack();}});
 }
 const curtain=$('journeyPrivacy'),resume=$('journeyContinue');
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!finished&&!curtain.open&&!document.querySelector('.studio-dialog[open]'))curtain.showModal();});
 resume.onclick=()=>curtain.close();

 function showToday(people){
  navigation('today',()=>showProfileImport(people),'profilopplastingen',()=>showToday(people));
  sourceProfiles=people;finished=false;
  const p=panel('Hvordan er kvelden?','VÅR STUND');p.append(node('p','Profilene er utgangspunktet. Nå finner vi det som frister dere i kveld.'));
  const fields=node('div',undefined,'session-fields');
  function select(caption,id,rows,value,change){const label=node('label',caption),input=node('select');label.htmlFor=id;input.id=id;for(const [v,text] of rows){const option=node('option',text);option.value=String(v);input.append(option);}input.value=String(value);input.onchange=()=>{change(Number(input.value));update();};fields.append(label,input);}
  select('Hvor mye tid har dere?','todayMinutes',[[15,'En kort stund · omtrent 15 minutter'],[30,'God tid · omtrent 30 minutter'],[60,'En lang stund · omtrent en time']],today.minutes,value=>{today.minutes=value;});
  select('Hvilket nivå passer nå?','todayLevel',[[2,'Mykere'],[3,'Variert'],[5,'Hele det felles utvalget']],today.max,value=>{today.max=value;});p.append(fields);
  const quick=node('fieldset',undefined,'session-quicky');quick.append(node('legend','Kjapp stund'),node('p','Hvis én velger dette, holder vi forslaget under 30 minutter.','journey-note'));
  people.forEach(person=>{const label=node('label',undefined,'session-topic'),input=node('input');input.type='checkbox';input.checked=today.quicky[person.id]===true;input.setAttribute('data-quicky-profile',person.id);input.onchange=()=>{if(input.checked)today.quicky[person.id]=true;else delete today.quicky[person.id];update();};label.append(input,node('span',person.name+' ønsker en kjapp stund'));quick.append(label);});p.append(quick);
  const curiosity=node('details',undefined,'session-curiosity');curiosity.append(node('summary','Nysgjerrigheter i kveld'),node('p','Slå på bare for den som ønsker spørsmål om sine registrerte nysgjerrigheter. Ellers bruker vi bare det du liker.','journey-note'));
  people.forEach(person=>{
   const count=Object.values(person.preferences).filter(prefs=>Object.values(prefs).includes('kanskje')).length;
   if(!count)return;
   const label=node('label',undefined,'session-topic'),input=node('input');input.type='checkbox';input.checked=today.curiosity[person.id]===true;input.setAttribute('data-curiosity-profile',person.id);input.onchange=()=>{if(input.checked)today.curiosity[person.id]=true;else delete today.curiosity[person.id];update();};
   label.append(input,node('span',person.name+' er nysgjerrig i kveld'));curiosity.append(label);
  });if(people.some(person=>Object.values(person.preferences).some(prefs=>Object.values(prefs).includes('kanskje'))))p.append(curiosity);
  const summary=node('p',undefined,'session-summary');summary.setAttribute('role','status');p.append(summary);
  const start=button('Finn det som passer i kveld',()=>prepareShortSession(people),'primary');start.id='todayContinue';p.append(start);
  const extra=node('details',undefined,'journey-more'),edit=node('a','Les eller rediger en interesseprofil','text-link');edit.href='./kartlegging.html?mode=edit';edit.onclick=event=>{event.preventDefault();openProfileEditor('edit',edit);};extra.append(node('summary','Profiler og tilpasning'),button('Endre deltakere',()=>showProfileImport(people),'text-button'),edit);p.append(extra);
  function update(){const available=S.candidates(people,entries,today);const included=people.filter(p=>today.curiosity[p.id]).map(p=>p.name);summary.textContent=available.length?'En kort runde om kveldens ønsker.'+(Object.values(today.quicky).some(Boolean)?' Kjapp stund: forslaget varer under 30 minutter.':'')+(included.length?' Nysgjerrigheter er med for '+included.join(' og ')+'.':' Nysgjerrigheter er ikke med i kveld.'):'Ingen kompatible interesser innenfor kveldens valg. Dere kan justere nivå eller åpne for registrert nysgjerrighet. Nei og ubesvarte valg tas ikke med.';start.disabled=!available.length;}
  update();
 }
 function prepareShortSession(people){
  proposalReturn=null;
  const key=JSON.stringify([people.map(person=>person.id),S.options(today)]);
  if(shortPlan?.key===key&&shortSession&&profiles.some(person=>person.answers.length)){
   started=true;if(step>=shortQueue.length||S.enough(profiles,entries,today,shortPlan.items.length)){finished=true;showFinal();}else{active=shortQueue[step].personIndex;showHandoff(true);}return;
  }
  const plan=shortPlan?.key===key?shortPlan:S.build(people,entries,today);plan.key=key;if(!plan.items.length)return;
  sourceProfiles=people;shortPlan=plan;shortSession=true;importedSession=true;sessionQuestions=[];
  profiles=people.map((saved,index)=>{
   const person=M.profile('avatar-'+(index+1));person.name=saved.name;person.allowed=Object.fromEntries(plan.items.map(item=>[item.card.id,item.allowed[index]]));
   for(const item of plan.items){const answer=sessionOverrides.get(saved.id+':'+item.card.id);if(!answer)continue;const preferences=Object.fromEntries(Object.entries(answer.preferences).filter(([id])=>item.allowed[index].includes(id)));M.voteDirections(person,item.card,preferences,{actuality:answer.actuality});}return person;
  });
  shortQueue=plan.queue.filter(item=>!profiles[item.personIndex].answers.some(a=>a.id===item.card.id));
  result=null;scenarioIndex=0;custom='';customDraft=null;chosen=false;activityChoice=null;runningActivityId=null;runCompleted=false;activitySeen.clear();confirmations.clear();reportData=null;history.length=0;step=0;segment=1;setupIndex=0;current=null;restoredChoice=null;answerReadyAt=0;lengths=[Math.max(1,shortQueue.length)];active=shortQueue[0]?.personIndex||0;started=true;finished=false;
  while(step<shortQueue.length&&!S.canStillMatch(shortQueue[step].item,profiles))step++;
  if(S.enough(profiles,entries,today,plan.items.length)){finished=true;showFinal();}else if(step<shortQueue.length){active=shortQueue[step].personIndex;showHandoff();}else showFinal();
 }
 function eveningResult(){
  const exact=S.pool(profiles,entries),possible=M.match(profiles,entries).filter(item=>item.pairs.some(pair=>pair.nesten));
  return {exact,possible,shared:[],candidates:[]};
 }
 function chooseActivity(choices){
  let available=choices.filter(row=>!activitySeen.has(row.activity.id));
  if(!available.length){activitySeen.clear();available=choices;}
  const next=A.choose(available,activityChoice?.activity.id);
  if(next?.activity.id!==activityChoice?.activity.id){runningActivityId=null;runCompleted=false;runStep=0;}
  if(next)activitySeen.add(next.activity.id);activityChoice=next;
 }
 function activityRoles(choice){
  const labels=new Map();
  for(const binding of choice.bindings)for(const pair of binding.pairs){
   const route=pair.routes.find(r=>r.confirmed&&(!binding.requirement.routes?.length||binding.requirement.routes.some(w=>w[0]===r.aDirection&&w[1]===r.bDirection)));
   if(!route)continue;
   for(const [index,direction] of [[pair.a,route.aDirection],[pair.b,route.bDirection]])if(!labels.has(index))labels.set(index,choice.activity.roleLabels?.[direction]||binding.item.directions.find(d=>d.id===direction)?.label||direction);
  }
  return profiles.map((person,index)=>person.name+': '+(labels.get(index)||'etter tur')).join(' · ');
 }
 function showShortProposal(){
  navigation('proposal',proposalBack,proposalReturn?'rapporten':'siste spørsmål',showShortProposal);
  finished=true;result=eveningResult();const choices=A.eligible(result.exact,profiles.length,today);
  const currentChoice=activityChoice&&choices.find(row=>row.activity.id===activityChoice.activity.id);
  if(currentChoice)activityChoice=currentChoice;else chooseActivity(choices);
  if(!activityChoice){
   const p=panel(result.exact.length?'Ingen passende aktivitet i registeret ennå':'Ingen felles retning i kveld','DERES STUND');
   p.append(node('p',result.exact.length?'Dere har felles ønsker, men ingen registrert aktivitet oppfyller alle kravene. Treffene vises uten at vi finner på et annet opplegg.':'Svarene ga ikke en avklart felles retning innenfor kveldens rammer. Det er også et gyldig resultat.'),button('Se kveldens treff',showMatch,'primary'),button('Endre kveldens rammer',()=>showToday(sourceProfiles),'text-button'));
   if(history.length)p.append(button('Forrige',previous,'text-button'));return;
  }
  const activity=activityChoice.activity,p=panel(activity.title,'ET FORSLAG FOR I KVELD');
  p.setAttribute('data-activity-id',activity.id);p.append(node('p',(Object.values(today.quicky||{}).some(Boolean)?'Kjapp stund · ':'')+'Omtrent '+activity.minutes+' minutter','session-meta'),node('p',activity.description,'session-action'),node('p',activityRoles(activityChoice),'activity-roles'));
  if(activity.reviewNote){const preview=node('details',undefined,'scenario-basis');preview.append(node('summary','Les hele forslaget'));for(const phase of activity.phases||[])preview.append(node('h3',phase.title),node('p',phase.text));p.append(node('p',activity.reviewNote,'journey-note'),preview);}
  const resuming=runningActivityId===activity.id&&!runCompleted,repeating=runningActivityId===activity.id&&runCompleted;
  const start=button(resuming?'Fortsett fra del '+(runStep+1):repeating?'Start aktiviteten på nytt':activity.reviewNote?'Dette passer oss – start':'Start aktiviteten',()=>{chosen=true;if(!resuming)runStep=0;runningActivityId=activity.id;runCompleted=false;showRunning();},'primary');start.id='startTogether';p.append(start);
  if(choices.length>1)p.append(button('Et annet forslag',()=>{chooseActivity(choices);showShortProposal();},'text-button'));
  const why=node('details',undefined,'scenario-basis');why.append(node('summary','Hvorfor dette forslaget?'));const ul=node('ul');for(const item of activityChoice.evidence)ul.append(node('li',(language[item.key]?.topic||item.topic||item.cat)+' · kompatible ja i kveld'));why.append(ul,button('Se kveldens svar',showMatch,'text-button'));p.append(why);
  const extra=node('details',undefined,'journey-more');extra.append(node('summary','Endre kveldens rammer'),button('Tilbake til dagsformen',()=>showToday(sourceProfiles),'text-button'));if(history.length)extra.append(button('Endre forrige svar',previous,'text-button'));p.append(extra);
 }
 function showRunning(){
  runCompleted=false;
  navigation('running',()=>{if(runStep>0){runStep--;showRunning();}else showShortProposal();},runStep>0?'forrige del':'forslaget',showRunning);
  if(!activityChoice)return;const activity=activityChoice.activity;
  finished=false;const p=panel(activity.title,'DEL '+(runStep+1)+' AV '+activity.steps.length);p.setAttribute('data-activity-id',activity.id);
  const phase=activity.phases?.[runStep];
  p.append(node('p',activityRoles(activityChoice),'activity-roles'));
  if(phase)p.append(node('h3',phase.title,'activity-phase-title'),node('p','Omtrent '+phase.minutes+' minutter','session-meta'));
  p.append(node('p',phase?.text||activity.steps[runStep],'session-action'));
  const basis=node('details',undefined,'scenario-basis');basis.append(node('summary','Kveldens felles ønsker'));const themes=node('ul');for(const item of result.exact)themes.append(node('li',language[item.key]?.topic||item.topic||item.cat));basis.append(themes);p.append(basis);
  const progress=node('progress');progress.max=activity.steps.length;progress.value=runStep+1;progress.setAttribute('aria-label','Del '+(runStep+1)+' av '+activity.steps.length);p.append(progress);
  p.append(button(runStep===activity.steps.length-1?'Avrund stunden':'Neste del',()=>{if(runStep<activity.steps.length-1){runStep++;showRunning();}else showDone();},'primary'));
  if(runStep)p.append(button('Forrige del',()=>{runStep--;showRunning();},'text-button'));
  p.append(button('Pause',()=>{if(!curtain.open)curtain.showModal();},'text-button'),button('Tilbake til forslaget',showShortProposal,'text-button'));
 }
 function showDone(){navigation('done',showRunning,'siste del',showDone);finished=true;runCompleted=true;const done=panel('Takk for stunden','AVRUNDET');done.append(node('p','Kveldens svar har ikke endret interesseprofilene deres.'),button('Se kveldens treff',showMatch,'primary'),button('Ny stund',()=>location.reload(),'text-button'));}
 function showWelcome(){
  navigation('welcome',requestExit,'hovedmenyen',showWelcome);
  const p=panel('Deres utgangspunkt','VÅR STUND');p.append(node('p','Lag profilen din én gang. Last inn profilene når dere vil finne en felles retning.'));
  p.append(button('Last inn profiler',()=>showProfileImport(loadedProfiles),'primary'));
  const link=node('a','Les eller rediger en interesseprofil','profile-start');link.href='./kartlegging.html?mode=edit';link.onclick=event=>{event.preventDefault();openProfileEditor('edit',link);};p.append(link);
  const create=node('a','Lag en ny interesseprofil','text-link');create.href='./kartlegging.html?mode=new';create.onclick=event=>{event.preventDefault();openProfileEditor('new',create);};p.append(create);
  const old=node('details',undefined,'journey-more');old.append(node('summary','Uten profilfil'),button('Start uten profil',changeParty,'text-button'));p.append(old);
 }
 function showProfileImport(initial=[]){
  navigation('import',showWelcome,'Vår stund',()=>showProfileImport(loadedProfiles));
  const p=panel('Last inn profilene','DERES UTGANGSPUNKT'),loaded=[...initial],status=node('p'),list=node('div');
  loadedProfiles=loaded;
  let reading=false;status.setAttribute('role','status');
  p.append(node('p','Velg din egen og partnernes profilfiler. 2–4 deltakere. Filene leses bare på denne enheten.'));
  const label=node('label','Velg profilfiler'),input=node('input');input.type='file';input.multiple=true;input.accept='.json,application/json';input.id='sessionProfileFiles';label.htmlFor=input.id;
  const start=button('Fortsett',async b=>{if(reading||loaded.length<2)return;const fingerprint=JSON.stringify(loaded);if(partyFingerprint&&fingerprint!==partyFingerprint&&sessionOverrides.size){b.disabled=true;const allowed=await U.confirmAction('Endre deltakere og fjerne kveldens svar?','Ja, endre deltakere');b.disabled=false;if(!allowed)return;}if(fingerprint!==partyFingerprint){today=S.options();shortPlan=null;sessionOverrides.clear();history.length=0;profiles=[];current=null;activityChoice=null;result=null;started=false;}partyFingerprint=fingerprint;showToday(loaded);},'primary');start.id='profilesContinue';
  function update(){
   list.replaceChildren();loaded.forEach((person,i)=>{const row=node('div',undefined,'loaded-profile');row.append(node('span',person.name),button('Fjern '+person.name,()=>{loaded.splice(i,1);update();},'text-button'));list.append(row);});
   start.disabled=reading||loaded.length<2;
  }
  input.onchange=async()=>{
   if(reading)return;reading=true;input.disabled=true;status.textContent='Leser profilfilene …';update();const r=revision;
   try{const files=Array.from(input.files||[]);if(loaded.length+files.length>4)throw Error('Det er plass til opptil fire profiler.');const batch=await Promise.all(files.map(async f=>{if(f.size>2000000)throw Error('En av profilfilene er for stor.');return P.parse(await f.text());}));if(r!==revision)return;if(new Set([...loaded,...batch].map(a=>a.id)).size!==loaded.length+batch.length)throw Error('Samme profil er valgt flere ganger.');loaded.push(...batch);status.textContent='';}
   catch(e){if(r===revision)status.textContent=e.message;}
   finally{if(r===revision){reading=false;input.disabled=false;input.value='';update();}}
  };
  p.append(label,input,list,status,start,button('Tilbake',showWelcome,'text-button'));update();
 }
 showWelcome();
})();
