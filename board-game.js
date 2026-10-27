(function(){
 'use strict';const U=DypereUI,{$,node}=U,E=DypereGames,S=DypereCardStore,key='DYPERE_BOARD_V2',names=['Mester','Baby'];
 let state=U.load(key,E.validBoard)||E.boardState(),busy=false,overviewOpen=null;
 const chapters=['Første gnist','Litt mer spill','Deres finale'],symbols={talk:'✦',guess:'?',challenge:'◇',joker:'✧',wish:'♡'};
 const events=['Omvei: velg gjerne den andre korttypen denne turen.','Speilrunde: la partneren velge mellom de to kortene.','Samarbeid: løs kortet sammen denne turen.','Historierunde: fortell et lite minne før dere velger kort.'];
 function save(){U.save(key,state);}
 function render(viewPositions=state.positions){
  $('board').replaceChildren();
  for(let row=0;row<4;row++)for(let col=0;col<6;col++){
   const i=row*6+(row%2?5-col:col),kind=E.tileKind(i),tile=node('div',undefined,'board-tile'),num=node('span',String(i+1),'tile-num'),icon=node('span',i===0?'START':i===23?'MÅL':symbols[kind],'tile-icon'),tokens=node('div',undefined,'board-tokens');
   tile.dataset.kind=kind;tile.dataset.chapter=E.chapter(i);tile.dataset.direction=i===23?'end':i%6===5?'down':Math.floor(i/6)%2?'left':'right';tile.setAttribute('aria-label','Felt '+(i+1)+' · '+E.labels[kind]);
   viewPositions.forEach((p,j)=>{if(p===i){const t=node('span',j?'B':'M','board-token'+(j?' baby':''));t.title=names[j];tokens.append(t);}});tile.append(num,icon,tokens);$('board').append(tile);
  }
  $('boardPlayers').replaceChildren();state.positions.forEach((p,i)=>{const el=node('span',names[i]+' · '+(p+1)+'/24',i===state.turn?'active':'');$('boardPlayers').append(el);});
  const ch=E.chapter(state.positions[state.turn]);$('boardChapter').textContent='KAPITTEL '+ch+' · '+chapters[ch-1];$('boardDie').textContent=state.die?['⚀','⚁','⚂','⚃','⚄','⚅'][state.die-1]:'✧';
  $('boardProgress').value=state.positions.reduce((a,b)=>a+b,0);$('boardRoll').hidden=state.phase!=='roll';$('boardRoll').disabled=busy;$('boardReset').disabled=busy;$('boardDie').setAttribute('aria-label','Siste terningkast: '+(state.die||'ingen ennå'));$('boardActions').hidden=state.phase!=='card';$('boardOptions').replaceChildren();
  const compact=overviewOpen===null?['choose','card'].includes(state.phase):!overviewOpen;$('boardPanel').classList.toggle('board-compact',compact);$('boardToggle').textContent=compact?'Vis brettet':'Skjul brettet';$('boardToggle').setAttribute('aria-expanded',String(!compact));$('boardCard').hidden=state.phase==='choose';
  $('cardKind').textContent=state.phase==='finished'?'BEGGE I MÅL':names[state.turn]+' · '+(state.card?E.labels[state.card.kind]:'Deres valg');
  $('gameCopy').textContent=state.phase==='finished'?'Reisen er deres. Hva tar dere med videre?':state.phase==='choose'?'Velg ett av kortene.':state.card?.text||'Kast terningen. Flytt brikken. Velg hva som skjer.';
  $('cardRule').textContent=state.phase==='finished'?state.completed+' kort fullført · '+state.skipped+' pass. Velg en avslutning nedenfor.':state.phase==='choose'?(state.event||'Velg selv. Det andre kortet blir i bunken.'):state.phase==='card'?'Ferdig og pass avslutter begge turen.':'Tre kapitler. Kort opp til kapittelet er med.';
  if(state.phase==='choose'){$('boardOptions').append(node('h2',state.options.length>1?'Velg ett kort':'Ett kort igjen i bunken'));if(state.event)$('boardOptions').append(node('p',state.event,'fine'));state.options.forEach((c,i)=>{const b=node('button',c.text,'choice-card');b.type='button';b.setAttribute('aria-label','Velg kort '+(i+1));b.onclick=()=>{state=E.choose(state,i);save();render();U.refreshCard();};$('boardOptions').append(b);});const pass=node('button','Pass på turen','text-button');pass.onclick=()=>complete(true);$('boardOptions').append(pass);}
  $('boardFinale').hidden=state.phase!=='finished';$('boardFinaleCopy').textContent=state.phase==='finished'?'Velg en idé i Ønskelisten, bygg en ny kveld, eller skriv deres eget finalekort. Begge velger selv.':'';
 }
 function complete(pass=false){if(!['card','choose'].includes(state.phase))return;overviewOpen=null;state=E.finish(state,pass);save();render();}
 $('boardRoll').onclick=async()=>{
  if(state.phase!=='roll'||busy)return;busy=true;overviewOpen=null;$('boardRoll').disabled=true;$('boardDie').classList.add('die-rolling');
  try{
   const die=1+Math.floor(Math.random()*6),target=Math.min(23,state.positions[state.turn]+die),kind=E.tileKind(target),level=E.chapter(target);
   let pool=S.filtered({kinds:[kind],role:names[state.turn],audience:'pair',level});
   if(!pool.length)pool=S.filtered({kinds:['talk','guess','challenge','joker','wish'],role:names[state.turn],audience:'pair',level});
   const deckKey=kind+'|'+names[state.turn]+'|'+level,previous=state.decks?.[deckKey]||[],roundSeen=pool.every(c=>previous.includes(c.id))?[]:previous;
   const options=E.choices(pool,previous);if(!options.length){U.status('Ingen aktive kort passer dette feltet. Aktiver en kortpakke eller legg til egne kort.');return;}
   const event=target%4===3?events[Math.floor(Math.random()*events.length)]:null;
   await new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?0:320));
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const view=state.positions.slice();while(view[state.turn]<target){view[state.turn]++;render(view);await new Promise(resolve=>setTimeout(resolve,70));}}
   state=E.roll(state,die,options,event,deckKey,roundSeen);U.status(event||names[state.turn]+' flytter '+die+' felt.');save();render();U.refreshCard();
  }finally{busy=false;$('boardDie').classList.remove('die-rolling');$('boardRoll').disabled=false;$('boardReset').disabled=false;}
 };
 $('boardDone').onclick=()=>complete(false);$('boardPass').onclick=()=>complete(true);
 $('boardReset').onclick=async()=>{if(await U.confirmAction('Starte en ny reise? Plasseringene i denne runden blir erstattet.','Start ny reise')){state=E.boardState();save();U.status('En ny reise er klar.');render();}};
 $('boardToggle').onclick=()=>{overviewOpen=$('boardPanel').classList.contains('board-compact');render();};
 render();
})();
