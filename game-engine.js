(function(root){
 'use strict';
 const kinds=['photo','never','point','dilemma','challenge','talk','guess','joker','wish'];
 const roles=['Alle','Baby','Mester'];
 const maxCards=2000;
 const labels={photo:'Bilde',never:'Jeg har aldri',point:'Hvem av oss',dilemma:'Dilemma',challenge:'Utfordring',talk:'Samtale',guess:'Gjett',joker:'Joker',wish:'Ønskeliste'};
 function validateCards(value){
  if(!value||![1,2].includes(value.version)||!Array.isArray(value.cards)||value.cards.length>maxCards)throw Error('Kortfilen må ha versjon 1 eller 2 og maksimalt '+maxCards+' kort.');
  const ids=new Set();
  return value.cards.map(c=>{
   if(!c||typeof c.id!=='string'||!c.id||c.id.length>100||ids.has(c.id)||!kinds.includes(c.kind)||!roles.includes(c.role)||!['pair','group','both'].includes(c.audience)||typeof c.text!=='string'||!c.text.trim()||c.text.length>1200)throw Error('Et kort har ugyldig ID, type, rolle eller tekst.');
   if(c.pack!==undefined&&(typeof c.pack!=='string'||!c.pack.trim()||c.pack.length>50))throw Error('Pakkenavn må være 1–50 tegn.');
   if(c.level!==undefined&&![1,2,3].includes(c.level))throw Error('Nivå må være 1, 2 eller 3.');
   if(c.enabled!==undefined&&typeof c.enabled!=='boolean')throw Error('Ugyldig kortstatus.');
   ids.add(c.id);return {id:c.id,kind:c.kind,role:c.role,audience:c.audience,text:c.text.trim(),pack:(c.pack||'Egne kort').trim(),level:c.level||1,enabled:c.enabled!==false};
  });
 }
 function pick(cards,seen=[],random=Math.random){
  if(!cards.length)return null;
  const eligible=cards.filter(c=>!seen.includes(c.id)),reset=!eligible.length;
  const pool=reset?(cards.length>1?cards.filter(c=>c.id!==seen.at(-1)):cards):eligible;
  const card=pool[Math.min(pool.length-1,Math.max(0,Math.floor(random()*pool.length)))];
  return {card,seen:[...(reset?[]:seen),card.id]};
 }
 function choices(cards,seen,random=Math.random,count=2){if(![2,3].includes(count))throw Error('Velg to eller tre kortalternativer.');const fresh=cards.filter(c=>!seen.includes(c.id));let pool=fresh.length?fresh:cards.length>1?cards.filter(c=>c.id!==seen.at(-1)):cards;const result=[];while(pool.length&&result.length<count){const chosen=pick(pool,[],random).card;result.push(chosen);pool=pool.filter(c=>c.id!==chosen.id);}return result;}
 function boardState(){return {version:2,positions:[0,0],turn:0,phase:'roll',card:null,options:[],seen:[],decks:{},die:0,completed:0,skipped:0,events:[],history:[]};}
 function validCard(c){try{return validateCards({version:2,cards:[c]}).length===1;}catch(e){return false;}}
 const validIds=v=>Array.isArray(v)&&v.length<=2000&&v.every(x=>typeof x==='string'&&x.length<=100);
 function validDecks(v){return v===undefined||!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length<=100&&Object.values(v).every(validIds);}
 function validBoardSettings(c){return !!c&&typeof c.preset==='string'&&c.preset.length<=40&&Array.isArray(c.packs)&&c.packs.length<=100&&c.packs.every(p=>typeof p==='string'&&p.length>0&&p.length<=50)&&Array.isArray(c.types)&&c.types.length>0&&c.types.length<=4&&new Set(c.types).size===c.types.length&&c.types.every(t=>['talk','guess','challenge','joker'].includes(t))&&typeof c.favorites==='boolean'&&[2,3].includes(c.choices)&&(c.preset==='all'||c.packs.length>0);}
 function validBoard(s){return !!s&&s.version===2&&Array.isArray(s.positions)&&s.positions.length===2&&s.positions.every(p=>Number.isInteger(p)&&p>=0&&p<=23)&&[0,1].includes(s.turn)&&['roll','choose','card','finished'].includes(s.phase)&&validIds(s.seen)&&(s.settings===undefined||validBoardSettings(s.settings))&&validDecks(s.decks)&&(s.deckSeen===undefined||validIds(s.deckSeen))&&(s.deckKey===undefined||typeof s.deckKey==='string'&&s.deckKey.length<=100)&&(s.event===undefined||s.event===null||typeof s.event==='string'&&s.event.length<=300)&&Array.isArray(s.options)&&s.options.length<=3&&s.options.every(validCard)&&Number.isInteger(s.die)&&s.die>=0&&s.die<=6&&Number.isInteger(s.completed)&&s.completed>=0&&Number.isInteger(s.skipped)&&s.skipped>=0&&Array.isArray(s.events)&&s.events.length<=5&&s.events.every(x=>typeof x==='string'&&x.length<=300)&&Array.isArray(s.history)&&s.history.length<=100&&(s.card===null||validCard(s.card))&&(s.phase!=='card'||s.card!==null)&&(s.phase!=='choose'||s.options.length>0)&&(s.phase!=='finished'||s.positions.every(p=>p===23));}
 const chapter=p=>Math.min(3,1+Math.floor(p/8));
 const tileKind=p=>p===0?'talk':p===23?'wish':['talk','guess','challenge','joker'][p%4];
 function roll(s,die,options,event=null,deckKey='default',deckSeen=[]){
  if(!validBoard(s)||s.phase!=='roll'||!Number.isInteger(die)||die<1||die>6||!Array.isArray(options)||!options.length)throw Error('Ugyldig trekk.');
  const positions=s.positions.slice();positions[s.turn]=Math.min(23,positions[s.turn]+die);
  return {...s,positions,die,phase:'choose',options:options.slice(0,3),card:null,event,deckKey,deckSeen,events:event?[...s.events,event].slice(-5):s.events};
 }
 function choose(s,index){if(!validBoard(s)||s.phase!=='choose'||!s.options[index])throw Error('Velg et tilgjengelig kort.');const card=s.options[index];return {...s,phase:'card',card,options:[],seen:[...s.seen.filter(id=>id!==card.id),card.id].slice(-2000),decks:{...(s.decks||{}),[s.deckKey||'default']:[...(s.deckSeen||[]),card.id]}};}
 function finish(s,pass=false){
  if(!validBoard(s)||!['card','choose'].includes(s.phase))throw Error('Trekk et kort først.');
  const history=[...s.history,{turn:s.turn,field:s.positions[s.turn],kind:s.card?.kind||'pass',pass}].slice(-100);
  const next={...s,card:null,options:[],history,completed:s.completed+(pass?0:1),skipped:s.skipped+(pass?1:0)};
  if(s.positions.every(p=>p===23))return {...next,phase:'finished'};
  let turn=1-s.turn;if(s.positions[turn]===23)turn=s.turn;return {...next,turn,phase:'roll'};
 }
 const eveningTimes=[5,10,15,20,30];
 function quickRounds(minutes){const t=Number(minutes);return t<=5?3:t<=10?6:t<=20?12:24;}
 function makeEvening(minutes,mood,selected){
  const options=['party','board','match','photo'],allowed=options.filter(k=>selected.includes(k));if(!allowed.length)throw Error('Velg minst én aktivitet.');
  const time=Number(minutes);if(!eveningTimes.includes(time)||!['rolig','leken','overrask'].includes(mood))throw Error('Velg 5–30 minutter og en gyldig stemning.');
  const order=mood==='rolig'?['match','party','board','photo']:mood==='leken'?['party','board','match','photo']:['board','match','party','photo'];
  const count=Math.min(allowed.length,Math.max(1,Math.floor(time/7))),list=order.filter(k=>allowed.includes(k)).slice(0,count);
  const base=Math.floor(time/list.length);return list.map((kind,i)=>({kind,minutes:base+(i===list.length-1?time-base*list.length:0),done:false}));
 }
 function mutual(cards,a,b){if(a.length!==cards.length||b.length!==cards.length||[...a,...b].some(v=>!['yes','maybe','no','pass'].includes(v)))throw Error('Begge må fullføre sine valg.');return cards.filter((_,i)=>a[i]==='yes'&&b[i]==='yes');}
 function mergeCards(current,incoming){const existing=validateCards({version:2,cards:current}),next=validateCards({version:2,cards:incoming}),ids=new Set(existing.map(c=>c.id)),added=next.filter(c=>!ids.has(c.id));if(existing.length+added.length>maxCards)throw Error('Kortbanken kan ha maksimalt '+maxCards+' kort.');return {cards:[...existing,...added],added:added.length,kept:next.length-added.length};}
 const api={kinds,roles,labels,validateCards,pick,choices,boardState,validBoard,validBoardSettings,chapter,tileKind,roll,choose,finish,eveningTimes,quickRounds,makeEvening,mutual,mergeCards};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DypereGames=api;
})(globalThis);
