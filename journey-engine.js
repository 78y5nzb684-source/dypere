(function(root){
 'use strict';
 const moods=['calm','playful','creative','connection'],votes=['yes','maybe','no','pass'],times=[5,10,15,20,30];
 function validateBank(bank){
  if(!bank||bank.version!==1||!Array.isArray(bank.activities)||bank.activities.length<1||bank.activities.length>1000)throw Error('Aktivitetsbanken kunne ikke åpnes.');
  const ids=new Set();
  for(const a of bank.activities){
   if(!a||typeof a.id!=='string'||!/^[a-z0-9-]{1,80}$/.test(a.id)||ids.has(a.id)||!['low','active'].includes(a.effort)||typeof a.outside!=='boolean'||typeof a.cost!=='boolean'||!Array.isArray(a.tags)||!a.tags.length||a.tags.some(t=>!moods.includes(t))||!Array.isArray(a.steps)||!a.steps.length||a.steps.length>10||[a.title,a.question,...a.steps].some(x=>typeof x!=='string'||!x.trim()||x.length>1200))throw Error('En aktivitet har ugyldige felt.');
   ids.add(a.id);
  }
  return bank;
 }
 function profile(p){return !!p&&moods.includes(p.mood)&&['low','active'].includes(p.energy)&&['indoors','either'].includes(p.place)&&typeof p.noCost==='boolean';}
 function config(minutes){if(!times.includes(minutes))throw Error('Velg 5–30 minutter.');return {minutes,rounds:minutes<=10?1:2,batch:minutes<=5?3:minutes<=20?4:5};}
 function allowed(a,p){return profile(p)&&(!p.noCost||!a.cost)&&(p.place!=='indoors'||!a.outside)&&(p.energy!=='low'||a.effort==='low');}
 function rank(a,p){return a.tags.includes(p.mood)?4:0;}
 function questions(bank,p,answers={},limit=5){
  validateBank(bank);if(!profile(p)||!Number.isInteger(limit)||limit<1||limit>10)throw Error('Velg gyldig profil og bolklengde.');
  // Deliberately uses ONLY this person's profile and votes. A partner's private
  // answers never determine wording/order and cannot be inferred from a branch.
  const ownYes=bank.activities.filter(a=>answers[a.id]==='yes').flatMap(a=>a.tags);
  return bank.activities.filter(a=>allowed(a,p)&&!Object.hasOwn(answers,a.id)).sort((a,b)=>{
   const score=x=>rank(x,p)+Math.min(2,x.tags.filter(t=>ownYes.includes(t)).length);
   return score(b)-score(a)||a.id.localeCompare(b.id);
  }).slice(0,limit);
 }
 function answer(current,id,vote,bank,p){
  if(!votes.includes(vote)||!bank.activities.some(a=>a.id===id&&allowed(a,p)))throw Error('Ugyldig svar.');
  return {...current,[id]:vote};
 }
 function matches(bank,profiles,answers){
  validateBank(bank);if(!Array.isArray(profiles)||profiles.length!==2||!profiles.every(profile)||!Array.isArray(answers)||answers.length!==2)throw Error('Begge må gjøre sine valg.');
  return bank.activities.filter(a=>profiles.every(p=>allowed(a,p))&&answers.every(v=>Object.hasOwn(v,a.id)&&v[a.id]==='yes')).sort((a,b)=>profiles.reduce((n,p)=>n+rank(b,p)-rank(a,p),0)||a.id.localeCompare(b.id));
 }
 function updateMood(p,mood){if(!profile(p)||!moods.includes(mood))throw Error('Ugyldig stemning.');return {...p,mood};}
 const api={moods,votes,times,validateBank,profile,config,allowed,questions,answer,matches,updateMood};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DypereJourney=api;
})(globalThis);
