/* DYPERE soft: interests are a starting point; tonight's answers decide. */
(function(root){
 'use strict';
 const branches=[{id:'ro',name:'Ro og kontakt'},{id:'sanser',name:'Musikk og stemning'},{id:'lek',name:'Lek og skaping'},{id:'variasjon',name:'Ut og oppleve'}];
 const themes=[{id:'musikk',name:'Musikk',branch:'sanser'},{id:'spill',name:'Spill',branch:'lek'},{id:'tur',name:'Tur',branch:'variasjon'},{id:'prat',name:'Samtale',branch:'ro'},{id:'kreativ',name:'Skaping',branch:'lek'},{id:'plan',name:'Planer',branch:'variasjon'},{id:'minne',name:'Gode minner',branch:'ro'}];
 const themeIds=new Set(themes.map(t=>t.id)),answers=new Set(['ja','kanskje','nei']);
 const dateStyles=[
  {id:'enkelt',question:'Ønsker du en enkel og uformell date uten ekstra opplegg?'},
  {id:'detaljer',question:'Vil du ha en date der dere legger ekstra merke til små detaljer?'},
  {id:'favoritter',question:'Vil du at alle får velge en liten favoritt innenfor aktivitetene?'},
  {id:'lavterskel',question:'Ønsker du en date der resultat og prestasjon er helt uviktig?'},
  {id:'pauser',question:'Vil du ha en tydelig liten pause mellom aktivitetene?'},
  {id:'nysgjerrig',question:'Vil du prøve en liten ny vri på aktiviteter dere allerede liker?'},
  {id:'tilstede',question:'Vil du sette andre gjøremål til side og være til stede i daten?'},
  {id:'liten',question:'Har du lyst til å gjøre daten til en liten anledning i hverdagen?'}
 ];
 const durationBands=[
  {id:'kort',question:'Passer en kort date på omtrent 25–30 minutter for deg?'},
  {id:'middels',question:'Passer en date på omtrent 45–60 minutter for deg?'},
  {id:'lang',question:'Passer en lengre date på omtrent halvannen til to timer for deg?'}
 ];
 const phaseLabels=['Brede områder','Dine interesser i kveld','Konkrete aktiviteter','Stemningen i daten','Tid til daten'];
 const finite=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
 function profile(raw){
  if(!raw||raw.version!==1||raw.kind!=='dypere-soft-profile'||typeof raw.id!=='string'||!raw.id.trim()||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>50||!raw.preferences||typeof raw.preferences!=='object'||Array.isArray(raw.preferences))throw new Error('Ugyldig soft-profil. Bruk Lag eller rediger profil.');
  const preferences={};
  for(const [id,p] of Object.entries(raw.preferences)){
   if(!themeIds.has(id)||!p||!answers.has(p.interest)||!finite(p.priority,0,3)||!['lede','delta','begge'].includes(p.role))throw new Error('Ugyldig tema eller verdi i profilen.');
   preferences[id]={interest:p.interest,priority:p.priority,role:p.role};
  }
  return {version:1,kind:'dypere-soft-profile',id:raw.id.trim(),name:raw.name.trim(),preferences};
 }
 function validateBank(raw){
  if(!raw||raw.version!==1||!Array.isArray(raw.activities))throw new Error('Aktivitetsbanken har feil format.');
  const seen=new Set();
  for(const a of raw.activities){
   if(!a||typeof a.id!=='string'||!a.id||seen.has(a.id)||!themeIds.has(a.theme)||!['title','description','formatLabel','format'].every(k=>typeof a[k]==='string'&&a[k].trim())||!finite(a.energy,1,3)||typeof a.supportsQuicky!=='boolean'||!(a.minMinutes===null||finite(a.minMinutes,1,1440))||a.supportsQuicky&&a.minMinutes>30||!finite(a.minPeople,2,4)||!finite(a.maxPeople,a.minPeople,4)||!['inne','ute','begge'].includes(a.place)||!Array.isArray(a.steps)||!a.steps.length||a.steps.some(s=>typeof s!=='string'||!s.trim())||typeof a.needsLeader!=='boolean')throw new Error('Ugyldig aktivitet: '+(a?.id||'ukjent ID'));
   seen.add(a.id);
  }
  return raw.activities;
 }
 function checkMood(raw){
  if(!raw||!finite(raw.energy,1,3)||typeof raw.quicky!=='boolean'||typeof raw.curious!=='boolean')throw new Error('Ugyldig dagsform.');
  return {energy:raw.energy,quicky:raw.quicky,curious:raw.curious};
 }
 function createSession(bank,people,moods,place='begge'){
  if(people.length<2||people.length>4||new Set(people.map(p=>p.id)).size!==people.length)throw new Error('Velg 2–4 forskjellige profiler.');
  people=people.map(profile);
  if(moods.length!==people.length)throw new Error('Alle må velge dagsform.');
  if(!['inne','ute','begge'].includes(place))throw new Error('Ugyldig sted.');
  return {bank:validateBank({version:1,activities:bank}),people,moods:moods.map(checkMood),place,history:[]};
 }
 function settings(s){return {quicky:s.moods.some(m=>m.quicky),energy:Math.min(...s.moods.map(m=>m.energy)),place:s.place};}
 function pref(s,i,t){return s.people[i].preferences[t]||{interest:'ukjent',priority:0,role:'begge'};}
 function answer(s,key,i){for(let h=s.history.length-1;h>=0;h--){const x=s.history[h];if(x.key===key&&x.person===i)return x.value;}return null;}
 function roleAssignment(s,a){
  if(!a.needsLeader)return {leader:null,participants:s.people.map((p,i)=>i)};
  for(let i=0;i<s.people.length;i++){
   if(pref(s,i,a.theme).role==='delta')continue;
   if(s.people.every((p,j)=>j===i||pref(s,j,a.theme).role!=='lede'))return {leader:i,participants:s.people.map((p,j)=>j).filter(j=>j!==i)};
  }
  return null;
 }
 function baseEligible(s,a){
  const set=settings(s);
  if(a.minPeople>s.people.length||a.maxPeople<s.people.length||a.energy>set.energy||set.quicky&&(!a.supportsQuicky||a.minMinutes>30)||set.place!=='begge'&&a.place!=='begge'&&a.place!==set.place||!roleAssignment(s,a))return false;
  return s.people.every((p,i)=>{const v=pref(s,i,a.theme).interest;return v==='ja'||v==='kanskje'&&s.moods[i].curious;});
 }
 function score(s,a){return s.people.reduce((sum,p,i)=>sum+pref(s,i,a.theme).priority+(pref(s,i,a.theme).interest==='ja'?3:1),0);}
 function candidates(s,confirmed=false){return s.bank.filter(a=>baseEligible(s,a)&&s.people.every((p,i)=>{
  const b=themes.find(t=>t.id===a.theme).branch;
  const broad=answer(s,'branch:'+b,i),topic=answer(s,'theme:'+a.theme,i),specific=answer(s,'format:'+a.theme+':'+a.format,i);
  if(broad==='nei'||topic==='nei'||specific==='nei')return false;
  return !confirmed||broad==='ja'&&topic==='ja'&&specific==='ja';
 })).sort((a,b)=>score(s,b)-score(s,a));}
 function topicTasks(s){
  const pool=candidates(s),tasks=[];
  for(const b of branches){
   const rows=pool.filter(a=>themes.find(t=>t.id===a.theme).branch===b.id);
   if(rows.length)tasks.push({key:'branch:'+b.id,type:'broad',label:b.name,score:Math.max(...rows.map(a=>score(s,a))),question:'Har du lyst til å utforske '+b.name.toLowerCase()+' i kveld?'});
  }
  tasks.sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
  // Stable order comes from the full session, so back/edit keeps person order stable.
  const all=s.bank.filter(a=>baseEligible(s,a));
  const branchOrder=branches.filter(b=>all.some(a=>themes.find(t=>t.id===a.theme).branch===b.id)).map(b=>({...b,score:Math.max(...all.filter(a=>themes.find(t=>t.id===a.theme).branch===b.id).map(a=>score(s,a)))})).sort((a,b)=>b.score-a.score||('branch:'+a.id).localeCompare('branch:'+b.id));
  for(const t of tasks)t.order=branchOrder.findIndex(b=>t.key==='branch:'+b.id);
  return tasks;
 }
 function formats(s){
  const map=new Map();
  for(const a of candidates(s)){
   const b=themes.find(t=>t.id===a.theme).branch;
   if(!s.people.every((p,i)=>answer(s,'branch:'+b,i)==='ja'&&answer(s,'theme:'+a.theme,i)==='ja'))continue;
   const key='format:'+a.theme+':'+a.format;
   if(!map.has(key))map.set(key,{key,type:'specific',theme:a.theme,label:a.formatLabel,score:score(s,a),question:'Passer '+a.formatLabel.toLowerCase()+' for deg i kveld?'});
  }
  return [...map.values()].sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
 }
 function themeTasks(s){
  const available=candidates(s),tasks=[];
  for(const t of themes){const rows=available.filter(a=>a.theme===t.id);if(!rows.length||!s.people.every((p,i)=>answer(s,'branch:'+t.branch,i)==='ja'))continue;
   tasks.push({key:'theme:'+t.id,type:'theme',theme:t.id,label:t.name,score:Math.max(...rows.map(a=>score(s,a))),question:'Har du lyst til å ha '+t.name.toLowerCase()+' som en del av daten i kveld?'});
  }
  return tasks.sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
 }
 function frameTasks(s){
  if(!candidates(s,true).length)return [];
  return dateStyles.filter(t=>!s.people.some((p,i)=>answer(s,'style:'+t.id,i)==='nei')).map(t=>({...t,key:'style:'+t.id,type:'style'}));
 }
 function timeTasks(s){
  if(!candidates(s,true).length||!dateStyles.some(t=>s.people.every((p,i)=>answer(s,'style:'+t.id,i)==='ja')))return [];
  return durationBands.filter(t=>(!settings(s).quicky||t.id==='kort')&&!s.people.some((p,i)=>answer(s,'duration:'+t.id,i)==='nei')).map(t=>({...t,key:'duration:'+t.id,type:'duration'}));
 }
 function progress(s){const active=next(s),completed=s.history.reduce((counts,h)=>(counts[h.person]++,counts),s.people.map(()=>0));return {phase:active?.phase??5,phases:phaseLabels,answered:completed,totalAnswers:s.history.length};}
 function next(s){
  const groups=[topicTasks(s),themeTasks(s),formats(s),frameTasks(s),timeTasks(s)];
  for(let phase=0;phase<groups.length;phase++){
   const tasks=groups[phase];
   for(let n=0;n<tasks.length;n++){
    const task=tasks[n];
    const visited=[...new Set(s.history.map(h=>h.key))];
    const order=visited.includes(task.key)?visited.indexOf(task.key):visited.length;
    const people=s.people.map((p,i)=>i);if(order%2)people.reverse();
    for(const person of people)if(answer(s,task.key,person)===null)return {...task,person,phase,order};
   }
  }
  return null;
 }
 function vote(s,task,value){
  if(!answers.has(value))throw new Error('Ugyldigt svar.');
  const expected=next(s);if(!expected||expected.key!==task.key||expected.person!==task.person)throw new Error('Spørsmålet er ikke lenger aktivt.');
  s.history.push({key:task.key,question:expected.question,type:expected.type,person:task.person,value});
 }
 function undo(s){return s.history.pop()||null;}
 function shuffle(rows,random=Math.random){const copy=[...rows];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
 function pool(s,random=Math.random){return shuffle(candidates(s,true),random).sort((a,b)=>score(s,b)-score(s,a)).slice(0,20);}
 function draw(pool,previous=[],random=Math.random){const fresh=pool.filter(a=>!previous.includes(a.id)),size=Math.min(3,pool.length);return shuffle(fresh.length>=size?fresh:pool,random).slice(0,size);}
 function report(s){return {settings:settings(s),possible:candidates(s).length,confirmed:candidates(s,true).length,answers:s.history.map(h=>({...h,person:s.people[h.person].name,personId:s.people[h.person].id})),unresolved:s.history.filter(h=>h.value==='kanskje').length};}
 const api={branches,themes,dateStyles,durationBands,phaseLabels,profile,validateBank,createSession,settings,next,vote,undo,pool,draw,report,candidates,roleAssignment,progress};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DypereSoft=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:this);
