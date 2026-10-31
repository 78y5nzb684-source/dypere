(function(){
 'use strict';
 const U=DypereUI,{node,$}=U,M=window.DypereJourneyModel;
 const view=$('journeyView'),exit=$('journeyExit');
 const skills=window.DypereJourneyCategories,names=window.DypereJourneyCategoryNames;
 const language=window.DypereJourneyLanguage||{},entries=M.index(window.DypereVarStundBank);
 let profiles=[],active=0,segment=1,step=0,mode='oppvarming',lengths=[7,7,7];
 let revision=0,started=false,finished=false,busy=false,exiting=false,current=null;
 let setupIndex=0,result=null,scenarioIndex=0,custom='',chosen=false;
 const currentProfile=()=>profiles[active];
 function panel(title,kicker){
   revision++;view.replaceChildren();const p=node('section',undefined,'journey-panel');
   if(kicker)p.append(node('p',kicker,'eyebrow'));
   const h=node('h2',title);h.tabIndex=-1;p.append(h);view.append(p);h.focus();return p;
 }
 function button(label,action,cls=''){
   const b=node('button',label,cls),r=revision;b.type='button';
   b.onclick=()=>{if(r===revision&&!b.disabled&&!exiting)action(b);};return b;
 }
 function showParty(){
   if(started)return;const p=panel('Hvem er med?','DERES STUND');
   p.append(node('p','Begynn med to avatarer. Dere svarer etter tur på én telefon.'));
   p.append(button('To deltakere',()=>selectParty(2),'primary journey-party-choice'));
   const more=node('details',undefined,'journey-more'),summary=node('summary','Legg til flere deltakere');more.append(summary);
   const options=node('div',undefined,'journey-party-options');
   options.append(button('Tre deltakere',()=>selectParty(3),'journey-party-choice'),button('Fire deltakere',()=>selectParty(4),'journey-party-choice'));more.append(options);p.append(more);
 }
 function selectParty(count){profiles=Array.from({length:count},(_,i)=>M.profile('avatar-'+(i+1)));showMode();}
 function showMode(){
   const p=panel('Hva har dere lyst til?','TO VEIER');
   p.append(node('p','Velg om dere vil finne en retning for denne stunden eller bli bedre kjent med interessene deres.'));
   const options=node('div',undefined,'journey-party-options');
   const choose=value=>{mode=value;lengths=value==='kartlegg'?[8,8,8]:[7,7,7];setupIndex=0;showSetup();};
   options.append(button('Varm opp',()=>choose('oppvarming'),'primary journey-party-choice'),node('p','En stund hjemme, med plass til å finne stemningen sammen.','journey-note'),button('Kartlegg',()=>choose('kartlegg'),'journey-party-choice'),node('p','Utforsk interesser og fantasier, uavhengig av hvor dere er.','journey-note'));
   p.append(options,button('Endre deltakere',showParty,'text-button'));
 }
 function showSetup(){
   const a=profiles[setupIndex],first=segment===1;
   const p=panel(first?'Lag avataren din':'Juster avataren din',first?'AVATAR '+(setupIndex+1):a.name);
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
 function showHandoff(){
   current=null;busy=false;const a=currentProfile(),p=panel('Din tur, '+a.name,'GI TELEFONEN VIDERE');
   p.append(node('p','Svar for deg selv. De andre trenger ikke se hvilke svar du velger.'));p.append(button('Jeg er '+a.name,showQuestion,'primary'));
 }
 function showQuestion(){
   if(busy||finished)return;started=true;if(!entries?.length){showUnavailable();return;}
   const a=currentProfile(),rank=M.rank(mode,segment,step,lengths);if(!current)current=M.pick(a,entries,rank);
   if(!current){showUnavailable();return;}
   const q=current,l=language[M.family(q.text).slice(5)],tones=['Nysgjerrig og åpen','Finn deres retning','Ta med det som passer'];
   const p=panel(a.name,tones[segment-1]),progress=node('progress');progress.max=lengths.reduce((x,y)=>x+y,0);progress.value=lengths.slice(0,segment-1).reduce((x,y)=>x+y,0)+step;
   progress.setAttribute('aria-label','Fremdrift for '+a.name);p.append(progress,node('p',l?.question||q.text,'avatar-question'));
   if(l){const details=node('details',undefined,'question-explanation');details.append(node('summary','Hva betyr dette?'),node('p',l.explanation));p.append(details);}
   const row=node('div',undefined,'journey-answer-actions'),r=revision;
   [['Ja','ja'],['Kanskje','kanskje'],['Nei','nei']].forEach(([label,key])=>row.append(button(label,()=>{
     if(busy||r!==revision||current!==q)return;busy=true;Array.from(row.children).forEach(b=>b.disabled=true);
     M.vote(a,q,key);current=null;step++;
     setTimeout(()=>{busy=false;if(finished)return;if(step>=lengths[segment-1])advance();else showQuestion();},160);
   },key==='ja'?'primary':'')));p.append(row);
 }
 function advance(){
   active++;step=0;if(active<profiles.length){showHandoff();return;}
   if(segment===3){finished=true;showFinal();return;}
   segment++;active=0;setupIndex=0;profiles.forEach(a=>{a.points+=4;});showSetupHandoff();
 }
 function showUnavailable(){
   finished=true;const p=panel('Ingen nye spørsmål tilgjengelig');p.append(node('p','Det finnes ikke flere nye spørsmål som passer denne økten. Tidligere spørsmål blir ikke gjentatt.'));
   p.append(button('Se retningen dere har funnet',showFinal,'primary'));
 }
 function buildResult(){
   const shared=skills.map(s=>({id:s.id,name:s.name,value:Math.min(...profiles.map(a=>s.cat.reduce((n,c)=>n+(a.scores[c]||0),0)))})).filter(s=>s.value>0).sort((a,b)=>b.value-a.value);
   const candidates=(window.DypereJourneyScenarios||[]).filter(s=>s.groups.includes(profiles.length)).map((s,i)=>({s,i,weight:shared.filter(t=>s.skills.includes(t.id)).reduce((v,t)=>v+t.value,0)})).sort((a,b)=>b.weight-a.weight||a.i-b.i).map(x=>x.s);
   return {shared,candidates};
 }
 function showFinal(){
   if(!result)result=buildResult();const s=result.candidates[scenarioIndex],p=panel(s?s.title:'Deres egen retning','ET FORSLAG TIL DERES STUND');
   p.append(node('p',result.shared.length?'Dere har vist interesse for '+result.shared.slice(0,3).map(t=>t.name.toLowerCase()).join(', ')+'.':'Svarene gir foreløpig ingen tydelig felles kategoriretning. Velg sammen hva dere ønsker videre.'));
   p.append(node('p','Dette er en ramme dere kan tilpasse, ikke en avtale om bestemte handlinger eller roller.','journey-note'));
   if(s){
     const list=node('ol',undefined,'scenario-steps');
     [['Begynn sammen',s.intro],['Deres hoveddel',custom||s.main],['Avrunding',s.closing],['Omsorg etterpå',s.aftercare]].forEach(([label,text])=>{const li=node('li');li.append(node('strong',label),node('p',text));list.append(li);});p.append(list);
     p.append(button(chosen?'Valgt sammen':'Velg dette sammen',async b=>{
       b.disabled=true;const r=revision;const yes=await U.confirmAction('Har alle lest forslaget og lyst til å velge denne rammen sammen?','Ja, vi velger dette');
       if(r!==revision)return;b.disabled=false;if(yes){chosen=true;showFinal();}
     },'primary'));
     const edit=node('details',undefined,'scenario-edit');edit.append(node('summary','Tilpass forslaget'));
     const label=node('label','Skriv deres egen hoveddel');label.htmlFor='scenarioCustom';const input=node('textarea');input.id='scenarioCustom';input.maxLength=2000;input.rows=5;input.value=custom||s.main;
     edit.append(label,input,button('Bruk tilpasningen',()=>{custom=input.value.trim().slice(0,2000);chosen=false;showFinal();}));p.append(edit);
     if(result.candidates.length>1)p.append(button('Vis et annet forslag',()=>{scenarioIndex=(scenarioIndex+1)%result.candidates.length;custom='';chosen=false;showFinal();},'text-button'));
   }
   p.append(button('Ny stund',async b=>{b.disabled=true;const r=revision;const yes=await U.confirmAction('Starte på nytt og fjerne avatarene og svarene fra denne økten?','Ja, start på nytt');if(r!==revision)return;if(yes)location.reload();else b.disabled=false;},'text-button'));
 }
 async function requestExit(){
   if(exiting)return;exiting=true;const yes=await U.confirmAction('Vil du avslutte og gå til hovedmenyen? Avatarer og svar fra denne økten blir fjernet.','Ja, avslutt');
   exiting=false;if(yes){finished=true;profiles=[];current=null;result=null;location.assign('./index.html');}
 }
 exit.onclick=requestExit;
 document.querySelectorAll('.app-header a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();requestExit();}));
 const curtain=$('journeyPrivacy'),resume=$('journeyContinue');
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!finished&&!curtain.open)curtain.showModal();});
 resume.onclick=()=>curtain.close();
 showParty();
})();
