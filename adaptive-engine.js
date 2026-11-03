/* Choose the next question from the remaining date metadata, not a fixed pass. */
(function(root){
 'use strict';
 const Base=root.DypereSoft;
 const compiled=new WeakMap(),snapshots=new WeakMap();
 const formatKey=a=>'format:'+a.theme+':'+a.format;
 const band=minutes=>minutes<=30?'kort':minutes<=60?'middels':'lang';
 const BATCH_SIZE=10;
 function validateStart(person,mood,raw){
  if(!raw||!Array.isArray(raw.themes)||!['inne','ute','begge'].includes(raw.place)||!['fleksibel','kort','middels','lang'].includes(raw.duration)||!['avklar',...Base.dateStyles.map(s=>s.id)].includes(raw.style))throw new Error('Ugyldige startvalg.');
  const selected=[...new Set(raw.themes)];
  for(const id of selected){const value=person.preferences[id]?.interest;if(!Base.themes.some(t=>t.id===id)||!(value==='ja'||value==='kanskje'&&mood.curious))throw new Error('Startvalgene kan ikke åpne en interesse utenfor profilen.');}
  if(mood.quicky&&!['kort','fleksibel'].includes(raw.duration))throw new Error('Kort økt kan ikke kombineres med en lengre varighet.');
  return {themes:selected,place:raw.place,duration:mood.quicky?'kort':raw.duration,style:raw.style};
 }
 function seedChoices(choices){
  const values=[];
  choices.forEach((start,person)=>{
   for(const t of Base.themes)values.push({person,key:'theme:'+t.id,value:start.themes.includes(t.id)?'ja':'nei',source:'startvalg'});
   for(const b of Base.branches)values.push({person,key:'branch:'+b.id,value:Base.themes.some(t=>t.branch===b.id&&start.themes.includes(t.id))?'ja':'nei',source:'startvalg'});
   for(const place of ['inne','ute'])values.push({person,key:'place:'+place,value:start.place==='begge'||start.place===place?'ja':'nei',source:'startvalg'});
   for(const time of Base.durationBands)values.push({person,key:'duration:'+time.id,value:start.duration==='fleksibel'||start.duration===time.id?'ja':'nei',source:'startvalg'});
   if(start.style!=='avklar')for(const style of Base.dateStyles)values.push({person,key:'style:'+style.id,value:start.style===style.id?'ja':'nei',source:'startvalg'});
  });return values;
 }
 function compile(catalog){
  if(compiled.has(catalog))return compiled.get(catalog);
  const descriptors=new Map(),patterns=new Map(),themeById=new Map(Base.themes.map(t=>[t.id,t]));
  const add=d=>{if(!descriptors.has(d.key))descriptors.set(d.key,d);return d.key;};
  for(const b of Base.branches)add({key:'branch:'+b.id,type:'broad',phase:0,label:b.name,branch:b.id,parents:[],question:'Er '+b.name.toLowerCase()+' aktuelt for deg i kveld?'});
  for(const t of Base.themes)add({key:'theme:'+t.id,type:'theme',phase:1,label:t.name,theme:t.id,branch:t.branch,parents:['branch:'+t.branch],question:'Er '+t.name.toLowerCase()+' aktuelt som en del av daten i kveld?'});
  const moduleKeys=catalog.modules.map(a=>{
   const theme=themeById.get(a.theme);if(!theme)throw new Error('Ukjent tema i datebanken.');
   add({key:formatKey(a),type:'specific',phase:2,label:a.formatLabel,theme:a.theme,branch:theme.branch,parents:['branch:'+theme.branch,'theme:'+a.theme],question:'Passer '+a.formatLabel.toLowerCase()+' for deg i kveld?'});
   return ['branch:'+theme.branch,'theme:'+a.theme,formatKey(a)];
  });
  for(const style of catalog.styles){const wording=Base.dateStyles.find(s=>s.id===style.id);if(!wording)throw new Error('Ukjent dateramme.');add({key:'style:'+style.id,type:'style',phase:3,label:style.name,parents:[],question:wording.question});}
  for(const time of Base.durationBands)add({key:'duration:'+time.id,type:'duration',phase:4,label:time.id==='kort'?'25–30 minutter':time.id==='middels'?'45–60 minutter':'90–120 minutter',parents:[],question:time.question});
  for(const place of ['inne','ute'])add({key:'place:'+place,type:'place',phase:1,label:place==='inne'?'Innendørs':'Utendørs',parents:[],question:place==='inne'?'Er en innendørs date aktuell i kveld?':'Er en utendørs date aktuell i kveld?'});
  for(const row of catalog.rows){
   const a=catalog.modules[row[1]],b=catalog.modules[row[2]],style=catalog.styles[row[3]];
   const keys=[...new Set([...moduleKeys[row[1]],...moduleKeys[row[2]],'style:'+style.id,'duration:'+band(row[4]),...(a.place==='begge'?[]:['place:'+a.place])])].sort();
   const signature=keys.join('|');if(!patterns.has(signature))patterns.set(signature,{keys,rows:[]});patterns.get(signature).rows.push(row);
  }
  const result={descriptors,patterns:[...patterns.values()]};compiled.set(catalog,result);return result;
 }
 function createSession(bank,people,moods,place='begge',catalog,starts){
  if(!catalog?.rows?.length)throw new Error('Datebanken må lastes før spørsmålsrunden starter.');
  const normalized=people.map(Base.profile);
  if(starts&&starts.length!==people.length)throw new Error('Alle må ha egne startvalg.');
  const startChoices=starts?starts.map((v,i)=>validateStart(normalized[i],moods[i],v)):null;
  if(startChoices){const common=['inne','ute'].filter(v=>startChoices.every(s=>s.place==='begge'||s.place===v)&&(place==='begge'||place===v));if(common.length===1)place=common[0];}
  const s=Base.createSession(bank,normalized,moods,place),set=Base.settings(s),data=compile(catalog);
  const moduleOK=catalog.modules.map(a=>a.minPeople<=s.people.length&&a.maxPeople>=s.people.length&&a.energy<=set.energy&&(place==='begge'||a.place==='begge'||a.place===place)&&!!Base.roleAssignment(s,a)&&s.people.every((p,i)=>{const interest=p.preferences[a.theme]?.interest;return interest==='ja'||interest==='kanskje'&&s.moods[i].curious;}));
  const initial=[];
  for(const pattern of data.patterns){const rows=pattern.rows.filter(row=>moduleOK[row[1]]&&moduleOK[row[2]]&&(!set.quicky||row[4]<=30));if(rows.length)initial.push({keys:pattern.keys,rows});}
  return {...s,adaptive:true,catalog,data,initial,startChoices,seedAnswers:startChoices?seedChoices(startChoices):[],autoKeys:new Set(place==='begge'?[]:['place:'+place]),revision:0,batchSize:BATCH_SIZE};
 }
 function state(s){
  const cached=snapshots.get(s);if(cached?.revision===s.revision)return cached.value;
  const values=new Map(),clarified=new Set();
  for(const h of [...s.seedAnswers,...s.history]){if(!values.has(h.key))values.set(h.key,[]);values.get(h.key)[h.person]=h.value;if(h.clarification)clarified.add(h.key+'#'+h.person);}
  const allYes=key=>s.autoKeys.has(key)||s.people.every((p,i)=>values.get(key)?.[i]==='ja');
  const blocked=new Set([...values].filter(([key,vs])=>vs.includes('nei')).map(([key])=>key));
  const possible=[],confirmed=[],counts=new Map();let total=0,confirmedCount=0;
  for(const pattern of s.initial){if(pattern.keys.some(key=>blocked.has(key)))continue;possible.push(pattern);total+=pattern.rows.length;for(const key of pattern.keys)counts.set(key,(counts.get(key)||0)+pattern.rows.length);if(pattern.keys.every(allYes)){confirmed.push(pattern);confirmedCount+=pattern.rows.length;}}
  const relevant=[...counts.keys()].filter(key=>!s.autoKeys.has(key));
  const explored=relevant.filter(key=>s.people.every((p,i)=>values.get(key)?.[i]!==undefined)).length;
  const value={values,clarified,allYes,blocked,possible,confirmed,counts,total,confirmedCount,relevant,explored};snapshots.set(s,{revision:s.revision,value});return value;
 }
 function priority(s,d,person){
  const ids=d.theme?[d.theme]:d.branch?Base.themes.filter(t=>t.branch===d.branch).map(t=>t.id):[];
  if(!ids.length)return 1.5;
  return Math.max(...ids.map(id=>(s.people[person].preferences[id]?.priority||0)*.7+s.people.reduce((sum,p)=>sum+(p.preferences[id]?.priority||0),0)/s.people.length*.3));
 }
 function personalYes(s,st,key,person){return s.autoKeys.has(key)||st.values.get(key)?.[person]==='ja';}
 function open(s,st,d,person){
  const yes=key=>personalYes(s,st,key,person);
  if(!st.counts.has(d.key)||s.autoKeys.has(d.key)||!d.parents.every(yes))return false;
  if(d.type==='place')return Base.branches.some(b=>yes('branch:'+b.id));
  if(d.type==='style')return [...s.data.descriptors.values()].some(x=>x.type==='specific'&&st.counts.has(x.key)&&yes(x.key));
  if(d.type==='duration')return s.catalog.styles.some(x=>st.counts.has('style:'+x.id)&&yes('style:'+x.id));
  return true;
 }
 function personalOptions(s,st,person){
  const last=[...s.history].reverse().find(h=>h.person===person),lastDescriptor=last&&s.data.descriptors.get(last.key);
  const options=[];
  for(const d of s.data.descriptors.values()){
   if(!open(s,st,d,person))continue;
   const fraction=st.counts.get(d.key)/st.total,information=4*fraction*(1-fraction);
   let relevance=priority(s,d,person)*1.2+information*2+d.phase*.2;
   if(last&&personalYes(s,st,last.key,person)){
    if(d.parents.includes(last.key))relevance+=6;
    else if(lastDescriptor?.type==='specific'&&d.type==='style')relevance+=4;
    else if(lastDescriptor?.type==='style'&&d.type==='duration')relevance+=4;
    else if(d.branch&&d.branch===lastDescriptor?.branch&&d.phase>lastDescriptor.phase)relevance+=2;
   }
   if(st.values.get(d.key)?.[person]===undefined)options.push({...d,taskId:d.key,person,clarification:false,rank:relevance,why:d.parents.length?'Dine tidligere svar har åpnet denne mer presise retningen.':'Dette spørsmålet gjelder dater som fortsatt passer startvalgene deres.'});
   if(st.values.get(d.key)?.[person]==='kanskje'&&!st.clarified.has(d.key+'#'+person)){
    const taskId=d.key+'#avklaring#'+person;
    options.push({...d,type:'clarification',taskId,person,clarification:true,rank:relevance+1.5,question:'Du var usikker på «'+d.label+'». Vil du åpne for dette som et aktuelt valg i kveld?',why:'Et kanskje må avklares før vi kan bruke dette i et bekreftet dateforslag.'});
   }
  }
  options.sort((a,b)=>b.rank-a.rank||a.taskId.localeCompare(b.taskId)||a.person-b.person);
  return options;
 }
 function next(s){
  if(!s.adaptive)return Base.next(s);
  const st=state(s);if(!st.total)return null;
  const last=s.history.at(-1);let slot=last?.batchSlot??0,used=s.history.filter(h=>h.batchSlot===slot).length;
  if(used>=BATCH_SIZE){slot++;used=0;}
  for(let attempt=0;attempt<s.people.length*2;attempt++,slot++,used=0){
   const round=Math.floor(slot/s.people.length),index=slot%s.people.length,person=round%2?s.people.length-1-index:index;
   const task=personalOptions(s,st,person)[0];if(task)return {...task,batchSlot:slot,batchRound:round,batchPosition:used+1,batchSize:BATCH_SIZE};
  }
  return null;
 }
 function vote(s,task,value){
  if(!['ja','kanskje','nei'].includes(value))throw new Error('Ugyldig svar.');
  const expected=next(s);if(!expected||task.taskId!==expected.taskId||task.person!==expected.person||task.batchSlot!==expected.batchSlot)throw new Error('Spørsmålet er ikke lenger aktivt.');
  const before=state(s).total;
  s.history.push({key:expected.key,taskId:expected.taskId,question:expected.question,type:expected.type,person:expected.person,value,clarification:expected.clarification,why:expected.why,batchSlot:expected.batchSlot,batchRound:expected.batchRound,batchPosition:expected.batchPosition,candidatesBefore:before});s.revision++;
  const after=state(s);Object.assign(s.history.at(-1),{candidatesAfter:after.total,confirmedAfter:after.confirmedCount});
 }
 function undo(s){const previous=s.history.pop()||null;s.revision++;return previous;}
 function dateCandidates(s,confirmed=false){return state(s)[confirmed?'confirmed':'possible'].flatMap(pattern=>pattern.rows);}
 function progress(s){const st=state(s);return {answered:s.people.map((p,i)=>s.history.filter(h=>h.person===i).length),possible:st.total,confirmed:st.confirmedCount,relevant:st.relevant.length,explored:st.explored,coverage:st.relevant.length?st.explored/st.relevant.length:1};}
 function report(s){const st=state(s),p=progress(s);return {flow:'adaptive-metadata-loop',responseMode:'serpentine-batches-10',startAnswers:s.seedAnswers.map(h=>({...h,person:s.people[h.person].name,personId:s.people[h.person].id})),batches:[...new Set(s.history.map(h=>h.batchSlot))].map(slot=>({slot,round:Math.floor(slot/s.people.length),person:s.people[s.history.find(h=>h.batchSlot===slot).person].name,answers:s.history.filter(h=>h.batchSlot===slot).length})),settings:Base.settings(s),possible:st.total,confirmed:st.confirmedCount,coverage:p,metadata:{confirmed:st.relevant.filter(st.allYes).map(key=>({key,label:s.data.descriptors.get(key)?.label})),rejected:[...st.blocked].map(key=>({key,label:s.data.descriptors.get(key)?.label})),sharedPlace:s.place},answers:s.history.map(h=>({...h,person:s.people[h.person].name,personId:s.people[h.person].id})),unresolved:[...st.values].filter(([key])=>st.counts.has(key)).flatMap(([key,vs])=>vs.flatMap((value,i)=>value==='kanskje'?[{key,person:s.people[i].name}]:[]))};}
 const api={...Base,createSession,next,vote,undo,progress,report,dateCandidates,validateStart};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DypereSoft=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:this);
