(function(){
 'use strict';const U=DypereUI,{$,node}=U,S=DypereCardStore,E=DypereGames,key='DYPERE_PARTY_V2';let state=null;
 const types=['never','point','dilemma','challenge','talk','guess','joker'];
 function valid(s){return !!s&&s.version===2&&['pair','group'].includes(s.mode)&&['points','glass'].includes(s.scoring)&&Array.isArray(s.names)&&s.names.length>=2&&s.names.length<=10&&s.names.every(x=>typeof x==='string'&&x.length>0&&x.length<=30)&&Array.isArray(s.scores)&&s.scores.length===s.names.length&&s.scores.every(x=>Number.isInteger(x)&&x>=0&&x<=999)&&Array.isArray(s.seen)&&s.seen.every(x=>typeof x==='string')&&Array.isArray(s.packs)&&s.packs.length>0&&s.packs.every(x=>typeof x==='string'&&x.length<=50)&&typeof s.onlyFavorites==='boolean'&&typeof s.ended==='boolean'&&Array.isArray(s.types)&&s.types.length&&s.types.every(t=>types.includes(t))&&[3,6,12,24,36].includes(s.limit)&&Number.isInteger(s.drawn)&&s.drawn>=0&&s.drawn<=s.limit&&Number.isInteger(s.passes)&&s.passes>=0&&(s.card===null||(typeof s.card?.text==='string'&&types.includes(s.card.kind)));}
 const saved=U.load(key,valid);$('partyResume').hidden=!saved;
 function screen(id){['partySetup','partyGame','partyEnd'].forEach(x=>$(x).hidden=x!==id);}
 function save(){U.save(key,state);}
 function scores(){
  $('partyScores').replaceChildren();state.names.forEach((name,i)=>{const box=node('div',undefined,'score-player'),label=node('span',name),value=node('strong',String(state.scores[i])),minus=node('button','−'),plus=node('button','+');minus.setAttribute('aria-label','Trekk poeng fra '+name);plus.setAttribute('aria-label','Gi poeng til '+name);minus.disabled=state.scores[i]===0;plus.disabled=state.scores[i]===999;minus.onclick=()=>{state.scores[i]=Math.max(0,state.scores[i]-1);save();scores();};plus.onclick=()=>{state.scores[i]=Math.min(999,state.scores[i]+1);save();scores();};box.append(label,minus,value,plus);$('partyScores').append(box);});
 }
 function end(){screen('partyEnd');$('partySummary').textContent=state.drawn+' kort · '+state.passes+' pass. Poengtavlen: '+state.names.map((n,i)=>n+' '+state.scores[i]).join(' · ');}
 function render(){
  screen('partyGame');scores();$('cardKind').textContent=E.labels[state.card.kind];$('gameCopy').textContent=state.card.text;
  const reader=state.names[(state.drawn-1)%state.names.length];$('gameStatus').textContent=reader+' leser · '+state.drawn+'/'+state.limit;
  const pair={never:'Gjett hverandres svar først. Ett poeng for et riktig gjett.',point:'Tell til tre og pek samtidig. Er dere enige, får begge ett poeng.',guess:'Gjett før den andre avslører. Ett poeng for et treff.',dilemma:'Gjett den andres valg. Ett poeng for riktig svar.',challenge:'Gjør oppgaven hvis dere vil. Ingen straff for pass.',talk:'Én forteller, den andre lytter. Ingen fasit.',joker:'Avtal sammen før dere fortsetter.'};
  const group={never:'Alle som kjenner seg igjen, markerer samtidig og får ett poeng.',point:'Pek samtidig. Den med flest pek får ett poeng. Uavgjort går fint.',dilemma:'Alle velger samtidig. Fortell hvorfor hvis du vil.',challenge:'Leseren får tilbudet. Pass er alltid mulig.'};
  $('cardRule').textContent=(state.mode==='pair'?pair:group)[state.card.kind]||'Spill kortet sammen. Ingen må forklare et pass.';
  if(state.scoring==='glass')$('cardRule').textContent+=' Ett poeng kan erstattes av én valgfri liten slurk. Alkoholfritt fungerer også.';
  $('partyNext').textContent=state.drawn===state.limit?'Avslutt runden':'Neste kort';
 }
 function next(pass=false){
  if(!state)return;if(pass)state.passes++;
  if(state.drawn>=state.limit){state.ended=true;save();end();return;}
  const reader=state.names[state.drawn%state.names.length],pool=S.filtered({kinds:state.types,role:reader,audience:state.mode,packs:state.packs.length?state.packs:undefined,favorites:state.onlyFavorites});
  const picked=E.pick(pool,state.seen);if(!picked){U.status('Ingen kort passer valgene. Aktiver en pakke eller velg flere kategorier.');return;}
  state.seen=picked.seen;state.drawn++;state.card=picked.card;save();render();U.refreshCard();
 }
 $('partyStart').onclick=()=>{
  const names=$('partyNames').value.split('\n').map(x=>x.trim()).filter(Boolean),mode=$('partyMode').value,chosen=[...document.querySelectorAll('[name=partyType]:checked')].map(e=>e.value),packs=[...document.querySelectorAll('[name=partyPack]:checked')].map(e=>e.value);
  if(names.length<2||names.length>10||names.some(n=>n.length>30)||(mode==='pair'&&names.length!==2)){ $('setupStatus').textContent=mode==='pair'?'Skriv nøyaktig to navn, maksimalt 30 tegn hver.':'Skriv 2–10 navn, maksimalt 30 tegn hver.';return;}
  if(new Set(names.map(n=>n.toLocaleLowerCase())).size!==names.length){$('setupStatus').textContent='Bruk ulike navn eller kallenavn, slik at poengtavlen er tydelig.';return;}
  if(!chosen.length||!packs.length){$('setupStatus').textContent='Velg minst én korttype og én pakke.';return;}
  if(!S.filtered({kinds:chosen,audience:mode,packs,favorites:$('partyFavorites').checked}).length){$('setupStatus').textContent='Ingen kort passer valgene. Velg en annen pakke eller slå av favorittfilteret.';return;}
  state={version:2,names,mode,scoring:$('partyScoring').value,limit:Number($('partyRounds').value),seen:[],drawn:0,passes:0,scores:names.map(()=>0),types:chosen,packs,onlyFavorites:$('partyFavorites').checked,card:null,ended:false};next();
 };
 $('partyResume').onclick=()=>{state=U.load(key,valid);if(!state)return;if(state.ended)end();else if(state.card)render();else next();};
 $('partyNext').onclick=()=>next();$('partyPass').onclick=()=>next(true);$('partyRestart').onclick=async()=>{if(await U.confirmAction('Gå til oppsett? Runden er mellomlagret og kan fortsettes.','Til oppsett')){screen('partySetup');$('partyResume').hidden=false;}};
 $('partyAgain').onclick=()=>{screen('partySetup');$('partyResume').hidden=false;};
 const packs=[...new Set(S.filtered({kinds:types}).map(c=>c.pack))];packs.forEach(p=>{const label=node('label',undefined,'check-option'),input=node('input');input.type='checkbox';input.name='partyPack';input.value=p;input.checked=true;label.append(input,node('span',p));$('partyPacks').append(label);});
 types.forEach(t=>{const label=node('label',undefined,'check-option'),input=node('input');input.type='checkbox';input.name='partyType';input.value=t;input.checked=true;label.append(input,node('span',E.labels[t]));$('partyTypes').append(label);});
 const plan=new URLSearchParams(location.search);const requested=Number(plan.get('minutes'));if(plan.has('minutes')&&Number.isFinite(requested)&&requested>0&&requested<=30)$('partyRounds').value=String(E.quickRounds(requested));
})();
