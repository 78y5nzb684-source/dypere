/* Choose the next question from the remaining date metadata, not a fixed pass. */
(function(root){
 'use strict';
 const Base=root.DypereSoft;
 const compiled=new WeakMap(),snapshots=new WeakMap();
 const formatKey=a=>'format:'+a.theme+':'+a.format;
 const band=minutes=>minutes<=30?'kort':minutes<=60?'middels':'lang';
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
 function createSession(bank,people,moods,place='begge',catalog){
  if(!catalog?.rows?.length)throw new Error('Datebanken må lastes før spørsmålsrunden starter.');
  const s=Base.createSession(bank,people.map(Base.profile),moods,place),set=Base.settings(s),data=compile(catalog);
  const moduleOK=catalog.modules.map(a=>a.minPeople<=s.people.length&&a.maxPeople>=s.people.length&&a.energy<=set.energy&&(place==='begge'||a.place==='begge'||a.place===place)&&!!Base.roleAssignment(s,a)&&s.people.every((p,i)=>{const interest=p.preferences[a.theme]?.interest;return interest==='ja'||interest==='kanskje'&&s.moods[i].curious;}));
  const initial=[];
  for(const pattern of data.patterns){const rows=pattern.rows.filter(row=>moduleOK[row[1]]&&moduleOK[row[2]]&&(!set.quicky||row[4]<=30));if(rows.length)initial.push({keys:pattern.keys,rows});}
  return {...s,adaptive:true,catalog,data,initial,autoKeys:new Set(place==='begge'?[]:['place:'+place]),revision:0};
 }
 function state(s){
  const cached=snapshots.get(s);if(cached?.revision===s.revision)return cached.value;
  const values=new Map(),clarified=new Set();
  for(const h of s.history){if(!values.has(h.key))values.set(h.key,[]);values.get(h.key)[h.person]=h.value;if(h.clarification)clarified.add(h.key+'#'+h.person);}
  const allYes=key=>s.autoKeys.has(key)||s.people.every((p,i)=>values.get(key)?.[i]==='ja');
  const blocked=new Set([...values].filter(([key,vs])=>vs.includes('nei')).map(([key])=>key));
  const possible=[],confirmed=[],counts=new Map();let total=0,confirmedCount=0;
  for(const pattern of s.initial){if(pattern.keys.some(key=>blocked.has(key)))continue;possible.push(pattern);total+=pattern.rows.length;for(const key of pattern.keys)counts.set(key,(counts.get(key)||0)+pattern.rows.length);if(pattern.keys.every(allYes)){confirmed.push(pattern);confirmedCount+=pattern.rows.length;}}
  const relevant=[...counts.keys()].filter(key=>!s.autoKeys.has(key));
  const explored=relevant.filter(key=>s.people.every((p,i)=>values.get(key)?.[i]!==undefined)).length;
  const value={values,clarified,allYes,blocked,possible,confirmed,counts,total,confirmedCount,relevant,explored};snapshots.set(s,{revision:s.revision,value});return value;
 }
 function priority(s,d){
  const ids=d.theme?[d.theme]:d.branch?Base.themes.filter(t=>t.branch===d.branch).map(t=>t.id):[];
  if(!ids.length)return 1.5;
  return Math.max(...ids.map(id=>s.people.reduce((sum,p)=>sum+(p.preferences[id]?.priority||0),0)/s.people.length));
 }
 function open(s,st,d){
  if(!st.counts.has(d.key)||s.autoKeys.has(d.key)||!d.parents.every(st.allYes))return false;
  if(d.type==='place')return Base.branches.some(b=>st.allYes('branch:'+b.id));
  if(d.type==='style')return [...s.data.descriptors.values()].some(x=>x.type==='specific'&&st.allYes(x.key));
  if(d.type==='duration')return s.catalog.styles.some(x=>st.allYes('style:'+x.id));
  return true;
 }
 function groupOrder(s,taskId){const ids=[...new Set(s.history.filter(h=>!h.clarification).map(h=>h.taskId||h.key))];return ids.includes(taskId)?ids.indexOf(taskId):ids.length;}
 function taskFor(s,st,d){
  const order=groupOrder(s,d.key),people=s.people.map((p,i)=>i);if(order%2)people.reverse();
  const person=people.find(i=>st.values.get(d.key)?.[i]===undefined);
  return person===undefined?null:{...d,taskId:d.key,person,order,clarification:false};
 }
 function next(s){
  if(!s.adaptive)return Base.next(s);
  const st=state(s);if(!st.total)return null;
  const last=s.history.at(-1),lastDescriptor=last&&s.data.descriptors.get(last.key);
  // Finish the current shared question before opening another branch.
  if(last&&!last.clarification&&lastDescriptor&&open(s,st,lastDescriptor)){const continuation=taskFor(s,st,lastDescriptor);if(continuation)return {...continuation,why:'Alle får svare på det samme aktuelle temaet før vi går videre.'};}
  const options=[];
  for(const d of s.data.descriptors.values()){
   if(!open(s,st,d))continue;
   const fraction=st.counts.get(d.key)/st.total,information=4*fraction*(1-fraction);
   let relevance=priority(s,d)*1.2+information*2+d.phase*.2;
   if(last&&st.allYes(last.key)){
    if(d.parents.includes(last.key))relevance+=6;
    else if(lastDescriptor?.type==='specific'&&d.type==='style')relevance+=4;
    else if(lastDescriptor?.type==='style'&&d.type==='duration')relevance+=4;
    else if(d.branch&&d.branch===lastDescriptor?.branch&&d.phase>lastDescriptor.phase)relevance+=2;
   }
   const normal=taskFor(s,st,d);if(normal)options.push({...normal,rank:relevance,why:d.parents.length?'Tidligere ja-svar har åpnet denne mer presise retningen.':'Dette spørsmålet gjelder dater som fortsatt passer profilene og kveldens rammer.'});
   for(let i=0;i<s.people.length;i++)if(st.values.get(d.key)?.[i]==='kanskje'&&!st.clarified.has(d.key+'#'+i)){
    const taskId=d.key+'#avklaring#'+i;
    options.push({...d,type:'clarification',taskId,person:i,order:groupOrder(s,taskId),clarification:true,rank:relevance+1.5,question:'Du var usikker på «'+d.label+'». Vil du åpne for dette som et aktuelt valg i kveld?',why:'Et kanskje må avklares før vi kan bruke dette i et bekreftet dateforslag.'});
   }
  }
  options.sort((a,b)=>b.rank-a.rank||a.taskId.localeCompare(b.taskId)||a.person-b.person);
  return options[0]||null;
 }
 function vote(s,task,value){
  if(!['ja','kanskje','nei'].includes(value))throw new Error('Ugyldig svar.');
  const expected=next(s);if(!expected||task.taskId!==expected.taskId||task.person!==expected.person)throw new Error('Spørsmålet er ikke lenger aktivt.');
  const before=state(s).total;
  s.history.push({key:expected.key,taskId:expected.taskId,question:expected.question,type:expected.type,person:expected.person,value,clarification:expected.clarification,why:expected.why,candidatesBefore:before});s.revision++;
  const after=state(s);Object.assign(s.history.at(-1),{candidatesAfter:after.total,confirmedAfter:after.confirmedCount});
 }
 function undo(s){const previous=s.history.pop()||null;s.revision++;return previous;}
 function dateCandidates(s,confirmed=false){return state(s)[confirmed?'confirmed':'possible'].flatMap(pattern=>pattern.rows);}
 function progress(s){const st=state(s);return {answered:s.people.map((p,i)=>s.history.filter(h=>h.person===i).length),possible:st.total,confirmed:st.confirmedCount,relevant:st.relevant.length,explored:st.explored,coverage:st.relevant.length?st.explored/st.relevant.length:1};}
 function report(s){const st=state(s),p=progress(s);return {flow:'adaptive-metadata-loop',settings:Base.settings(s),possible:st.total,confirmed:st.confirmedCount,coverage:p,metadata:{confirmed:st.relevant.filter(st.allYes).map(key=>({key,label:s.data.descriptors.get(key)?.label})),rejected:[...st.blocked].map(key=>({key,label:s.data.descriptors.get(key)?.label})),sharedPlace:s.place},answers:s.history.map(h=>({...h,person:s.people[h.person].name,personId:s.people[h.person].id})),unresolved:[...st.values].filter(([key])=>st.counts.has(key)).flatMap(([key,vs])=>vs.flatMap((value,i)=>value==='kanskje'?[{key,person:s.people[i].name}]:[]))};}
 const api={...Base,createSession,next,vote,undo,progress,report,dateCandidates};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DypereSoft=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:this);
