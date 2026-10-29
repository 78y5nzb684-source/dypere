(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.DypereJourney=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const skills=Object.freeze([
  {id:'naerhet',name:'Nærhet',cat:['sex','aftercare']},
  {id:'lek',name:'Lek',cat:['oral','creampie']},
  {id:'dybde',name:'Dybde',cat:['anal','fisting']},
  {id:'kontroll',name:'Kontroll',cat:['kontroll','bdsm','chastity']},
  {id:'utforsking',name:'Utforsking',cat:['group','exhibition','pegging']},
  {id:'intensitet',name:'Intensitet',cat:['impact','breath','humiliation','watersports']}
 ].map(s=>Object.freeze({...s,cat:Object.freeze(s.cat)})));
 const skillIds=new Set(skills.map(s=>s.id));
 const skillByCategory=new Map(skills.flatMap(s=>s.cat.map(cat=>[cat,s.id])));
 const contexts=new Set(['hjemme','seng','bil','fest']);
 const modes=new Set(['oppvarming','kartlegg']);
 const lengths=mode=>mode==='kartlegg'?[6,6,6]:[4,5,5];
 const cap=context=>context==='bil'?2.5:context==='fest'?3.5:5;
 function rankAt(mode,context,segment,questionIndex){
  if(!modes.has(mode)||!contexts.has(context)||!Number.isInteger(segment)||segment<1||segment>3)throw Error('Ugyldig reisekonfigurasjon.');
  const count=lengths(mode)[segment-1];
  if(!Number.isInteger(questionIndex)||questionIndex<0||questionIndex>=count)throw Error('Ugyldig spørsmålsindeks.');
  const progress=(segment-1+questionIndex/count)/3;
  const value=1+Math.pow(progress,mode==='kartlegg'?0.85:1.25)*(mode==='kartlegg'?2.5:4);
  return Math.min(value,cap(context));
 }
 function publicCard(c){return {id:c.id,cat:c.cat,rang:c.rang,text:c.text};}
 function createSession(options,indexedBank){
  if(!options||![3,4].includes(options.participantCount))throw Error('Velg tre eller fire deltakere.');
  const participantCount=options.participantCount,context=options.context||'hjemme',mode=options.mode||'oppvarming';
  if(!contexts.has(context)||!modes.has(mode))throw Error('Ugyldig kontekst eller modus.');
  if(!Array.isArray(indexedBank)||indexedBank.length>50000)throw Error('Ugyldig kortbank.');
  const ids=new Set();
  let bank=indexedBank.map(c=>{
   if(!c||typeof c.id!=='string'||!c.id||ids.has(c.id)||typeof c.cat!=='string'||!c.cat||!Number.isInteger(c.rang)||c.rang<1||c.rang>5||typeof c.text!=='string'||!c.text.trim()||typeof c.textKey!=='string'||!c.textKey||typeof c.familyKey!=='string'||!c.familyKey||(c.similarityKey!==undefined&&(typeof c.similarityKey!=='string'||!c.similarityKey.trim())))throw Error('Kortbanken mangler gyldige, unike indeksfelt.');
   ids.add(c.id);return Object.freeze({id:c.id,cat:c.cat,rang:c.rang,text:c.text,textKey:c.textKey,familyKey:c.familyKey,similarityKey:c.similarityKey===undefined?c.familyKey:c.similarityKey});
  });
  const participantIds=Array.from({length:participantCount},(_,i)=>'p'+(i+1));
  const blankSeen=()=>({ids:new Set(),textKeys:new Set(),familyKeys:new Set(),similarityKeys:new Set()});
  let people=participantIds.map(id=>({id,allocation:Object.create(null),scores:new Map(),answers:new Map(),seen:blankSeen()}));
  const blockLengths=lengths(mode),totalQuestions=blockLengths.reduce((a,b)=>a+b,0);
  let phase=bank.length?'profile-handoff':'exhausted',reason=bank.length?null:'empty-bank';
  let segmentIndex=0,activeIndex=bank.length?0:-1,questionIndex=0,block=[],selected=[];
  let recent=[],recentCats=[];
  const usedText=new Set(),usedFamilies=new Set(),usedSimilarity=new Set(),exploredGroups=new Set();
  const accepted=()=>({accepted:true});
  const rejected=why=>({accepted:false,reason:why});
  const activeId=()=>activeIndex>=0&&people[activeIndex]?people[activeIndex].id:null;
  const privatePhase=()=>phase==='profile'||phase==='answering';
  const offset=()=>blockLengths.slice(0,segmentIndex).reduce((a,b)=>a+b,0);
  const budget=()=>8+4*segmentIndex;
  function getSnapshot(){
   return {phase,reason,participantCount,participantIds:participantIds.slice(),segment:segmentIndex+1,activeParticipantId:activeId(),questionIndex,questionsInBlock:blockLengths[segmentIndex],totalQuestions,totalBlocks:3,mode,context};
  }
  function getPrivateSnapshot(pid){
   if(!privatePhase()||pid!==activeId())return null;
   const p=people[activeIndex],allocation={};skills.forEach(s=>{allocation[s.id]=p.allocation[s.id]||0;});
   return {participantId:pid,allocation,budget:budget(),pointsRemaining:budget()-Object.values(allocation).reduce((a,b)=>a+b,0),question:phase==='answering'&&block[questionIndex]?publicCard(block[questionIndex]):null,questionIndex,questionsInBlock:blockLengths[segmentIndex],questionNumber:offset()+questionIndex+1};
  }
  function markSeen(pid,qid){
   if(phase!=='answering'||pid!==activeId())return rejected('inactive-participant');
   const q=block[questionIndex];if(!q||qid!==q.id)return rejected('stale-question');
   const seen=people[activeIndex].seen,newlyRecorded=!seen.ids.has(q.id);
   seen.ids.add(q.id);seen.textKeys.add(q.textKey);seen.familyKeys.add(q.familyKey);seen.similarityKeys.add(q.similarityKey);
   return {accepted:true,newlyRecorded};
  }
  function getSeenByParticipant(){
   return Object.fromEntries(people.map(p=>[p.id,Object.fromEntries(Object.entries(p.seen).map(([key,values])=>[key,Array.from(values)]))]));
  }
  function beginTurn(pid){
   if(pid!==activeId())return rejected('inactive-participant');
   if(phase==='profile-handoff')phase='profile';
   else if(phase==='answer-handoff')phase='answering';
   else return rejected('invalid-phase');
   return accepted();
  }
  function setAllocation(pid,allocation){
   if(!privatePhase()||pid!==activeId())return rejected('inactive-participant');
   if(!allocation||typeof allocation!=='object'||Array.isArray(allocation)||Object.keys(allocation).some(id=>!skillIds.has(id)))return rejected('invalid-allocation');
   const next=Object.create(null);let used=0;
   for(const s of skills){const value=Object.hasOwn(allocation,s.id)?allocation[s.id]:0;if(!Number.isInteger(value)||value<0)return rejected('invalid-allocation');next[s.id]=value;used+=value;}
   if(used>budget())return rejected('allocation-over-budget');
   people[activeIndex].allocation=next;return accepted();
  }
  function confirmAllocation(pid){
   if(phase!=='profile'||pid!==activeId())return rejected('inactive-participant');
   if(activeIndex<participantCount-1){activeIndex++;phase='profile-handoff';}
   else{activeIndex=-1;phase='ready';}
   return accepted();
  }
  function freezeBlock(){
   const stagedText=new Set(usedText),stagedFamilies=new Set(usedFamilies),stagedSimilarity=new Set(usedSimilarity),stagedGroups=new Set(exploredGroups);
   let stagedRecent=recent.slice(),stagedCats=recentCats.slice();const next=[];
   const meanScore=cat=>people.reduce((sum,p)=>sum+(p.scores.get(cat)||0),0)/participantCount;
   const meanAllocated=id=>people.reduce((sum,p)=>sum+(p.allocation[id]||0),0)/participantCount;
   const hasPrior=skills.some(s=>meanAllocated(s.id)>0);
   for(let index=0;index<blockLengths[segmentIndex];index++){
    const desired=rankAt(mode,context,segmentIndex+1,index),maxR=cap(context);
    const remaining=bank.filter(c=>!stagedText.has(c.textKey)&&!stagedFamilies.has(c.familyKey)&&!stagedSimilarity.has(c.similarityKey)&&c.rang<=maxR&&!people.some(p=>p.seen.ids.has(c.id)||p.seen.textKeys.has(c.textKey)||p.seen.familyKeys.has(c.familyKey)||p.seen.similarityKeys.has(c.similarityKey)));
    const allowed=remaining.filter(c=>Math.abs(c.rang-desired)<=1.3);
    const pool=allowed.length?allowed:remaining;
    if(!pool.length)return false;
    const fresh=pool.filter(c=>!stagedRecent.includes(c.id)&&!stagedCats.includes(c.cat));
    const withoutIds=fresh.length?fresh:pool.filter(c=>!stagedRecent.includes(c.id));
    const candidates=withoutIds.length?withoutIds:pool,categories=new Map();
    for(const c of candidates){if(!categories.has(c.cat))categories.set(c.cat,[]);categories.get(c.cat).push(c);}
    let weighted=Array.from(categories,([cat,cards])=>({cat,cards,group:skillByCategory.get(cat)||'unmapped',score:meanScore(cat)*4.5+(skillByCategory.has(cat)?meanAllocated(skillByCategory.get(cat))*2:0)})).sort((a,b)=>b.score-a.score);
    if(!hasPrior){
     const unseen=weighted.filter(c=>!stagedGroups.has(c.group));
     if(unseen.length){const groups=Array.from(new Set(unseen.map(c=>c.group))),group=groups[Math.floor(Math.random()*groups.length)];weighted=unseen.filter(c=>c.group===group);}
    }
    const top=weighted.filter(c=>c.score===weighted[0].score),category=top[Math.floor(Math.random()*top.length)],chosen=category.cards[Math.floor(Math.random()*category.cards.length)];
    next.push(chosen);stagedText.add(chosen.textKey);stagedFamilies.add(chosen.familyKey);stagedSimilarity.add(chosen.similarityKey);stagedGroups.add(category.group);
    stagedRecent.push(chosen.id);stagedCats.push(chosen.cat);stagedRecent=stagedRecent.slice(-16);stagedCats=stagedCats.slice(-4);
   }
   block=next;selected.push(...next);recent=stagedRecent;recentCats=stagedCats;
   for(const key of stagedText)usedText.add(key);for(const key of stagedFamilies)usedFamilies.add(key);for(const key of stagedSimilarity)usedSimilarity.add(key);for(const key of stagedGroups)exploredGroups.add(key);
   return true;
  }
  function start(){
   if(phase!=='ready')return rejected('invalid-phase');
   if(!freezeBlock()){phase='exhausted';reason='insufficient-unique-cards';activeIndex=-1;questionIndex=0;block=[];return accepted();}
   activeIndex=0;questionIndex=0;phase='answer-handoff';return accepted();
  }
  function answer(pid,qid,vote){
   if(phase!=='answering'||pid!==activeId())return rejected('inactive-participant');
   const p=people[activeIndex],q=block[questionIndex];
   if(!q||qid!==q.id||p.answers.has(qid))return rejected('stale-question');
   if(!['ja','kanskje','nei'].includes(vote))return rejected('invalid-answer');
   p.answers.set(qid,vote);
   const delta=vote==='ja'?2:vote==='kanskje'?1:0;if(delta)p.scores.set(q.cat,(p.scores.get(q.cat)||0)+delta);
   questionIndex++;
   if(questionIndex===block.length){questionIndex=0;if(activeIndex<participantCount-1){activeIndex++;phase='answer-handoff';}else{activeIndex=-1;phase=segmentIndex===2?'complete':'block-complete';}}
   return accepted();
  }
  function nextBlock(){
   if(phase!=='block-complete')return rejected('invalid-phase');
   segmentIndex++;activeIndex=0;questionIndex=0;block=[];phase='profile-handoff';return accepted();
  }
  function getMatches(){
   if(phase!=='complete'&&phase!=='exhausted')return [];
   return selected.filter(q=>people.every(p=>p.answers.get(q.id)==='ja')).map(publicCard);
  }
  function clear(){
   for(const p of people){p.answers.clear();p.scores.clear();p.allocation=Object.create(null);for(const values of Object.values(p.seen))values.clear();}
   people=[];bank=[];block=[];selected=[];recent=[];recentCats=[];usedText.clear();usedFamilies.clear();usedSimilarity.clear();exploredGroups.clear();activeIndex=-1;questionIndex=0;reason=null;phase='cleared';return getSnapshot();
  }
  return Object.freeze({getSnapshot,getPrivateSnapshot,markSeen,getSeenByParticipant,beginTurn,setAllocation,confirmAllocation,start,answer,nextBlock,getMatches,clear});
 }
 return Object.freeze({skills,rankAt,createSession});
});
