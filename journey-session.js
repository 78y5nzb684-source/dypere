(function(){
 'use strict';
 const P=window.DypereInterestProfiles,M=window.DypereJourneyModel;
 function options(raw={}){
  const curiosity={};for(const [id,value] of Object.entries(raw.curiosity||{}))if(typeof id==='string'&&value===true)curiosity[id]=true;
  const quicky={};for(const [id,value] of Object.entries(raw.quicky||{}))if(value===true)quicky[id]=true;
  return {quicky,minutes:[15,30,60].includes(Number(raw.minutes))?Number(raw.minutes):30,max:[2,3,5].includes(Number(raw.max))?Number(raw.max):3,curiosity};
 }
 function roleDirection(person,direction){return !person.dynamicRole||direction!=='lede'&&direction!=='folge'||direction==='lede'&&person.dynamicRole==='dom'||direction==='folge'&&person.dynamicRole==='sub';}
 function rolePair(a,b){return !a.dynamicRole&&!b.dynamicRole||['dom','sub'].includes(a.dynamicRole)&&['dom','sub'].includes(b.dynamicRole)&&a.dynamicRole!==b.dynamicRole;}
 function candidates(people,entries,raw={}){
  const settings=options(typeof raw==='number'?{max:raw}:raw),byId=new Map(entries.map(e=>[e.card.id,e.card])),rows=new Map();
  const accepts=(index,value)=>value==='ja'||settings.curiosity[people[index].id]===true&&value==='kanskje';
  for(const topic of P.catalog){
   const card=byId.get(window.DypereProfileQuestionIds[topic.id]);if(!card||card.area==='uavklart')continue;
   const level=Math.max(...people.map(p=>p.levels[topic.id]||card.rang));if(level>settings.max)continue;
   const allowed=people.map(()=>new Set()),certain=people.map(()=>new Set());
   for(let a=0;a<people.length;a++)for(let b=a+1;b<people.length;b++)for(const d of topic.directions)for(const c of M.complements(d)){
    const x=people[a].preferences[topic.id]?.[d.id],y=people[b].preferences[topic.id]?.[c];
    if((!people[a].dynamicRole||!people[b].dynamicRole||rolePair(people[a],people[b]))&&roleDirection(people[a],d.id)&&roleDirection(people[b],c)&&accepts(a,x)&&accepts(b,y)){allowed[a].add(d.id);allowed[b].add(c);if(x==='ja'&&y==='ja'){certain[a].add(d.id);certain[b].add(c);}}
   }
   if(!allowed.every(d=>d.size))continue;
   const item={topic,card:{...card,rang:level},allowed:allowed.map(d=>[...d]),uncertain:!certain.every(s=>s.size)};
   const prior=rows.get(card.id);if(!prior||prior.uncertain&&!item.uncertain)rows.set(card.id,item);
  }
  return [...rows.values()].sort((a,b)=>a.card.rang-b.card.rang||Number(a.uncertain)-Number(b.uncertain)||a.card.id.localeCompare(b.card.id));
 }
 function prioritizeEvidence(matches,people,available){
  // An activity may accept several related topics. Prefer the participant's
  // actual priority before selecting evidence for that activity.
  const scores=new Map(available.map(item=>[item.card.id,people.reduce((sum,person)=>sum+(person.priorities?.[item.topic.id]||0),0)]));
  return matches.slice().sort((a,b)=>(scores.get(b.id)||0)-(scores.get(a.id)||0));
 }
 function build(people,entries,raw,random=Math.random){
  const settings=options(raw),available=candidates(people,entries,settings),count=Math.min(available.length,Object.values(settings.quicky||{}).some(Boolean)?3:settings.minutes===15?3:settings.minutes===30?5:7);
  const supported=window.DypereActivityRegistry?.topicIds()||new Set();
  const priority=available.filter(x=>supported.has(x.topic.id)).slice().sort((a,b)=>Number(a.uncertain)-Number(b.uncertain)||a.card.rang-b.card.rang);
  const picked=[];
  // These temporary answers only plan which questions to ask. They never enter
  // the evening's answers, source profiles or final result.
  const possible=people.map((saved,index)=>Object.assign(M.profile('planning-'+index),{dynamicRole:saved.dynamicRole||null}));
  for(const item of available)possible.forEach((person,index)=>M.voteDirections(person,item.card,Object.fromEntries(item.allowed[index].map(id=>[id,'ja'])),{actuality:'ja'}));
  const plans=(window.DypereActivityRegistry?.eligible(prioritizeEvidence(pool(possible,entries),people,available),people.length,settings)||[]).filter(row=>new Set(row.evidence.map(item=>item.id)).size<=count);
  const priorityScore=row=>row.evidence.reduce((sum,evidence)=>{const item=available.find(item=>item.card.id===evidence.id);return sum+people.reduce((value,person)=>value+(person.priorities?.[item?.topic.id]||0),0);},0);
  const highestPriority=Math.max(0,...plans.map(priorityScore)),preferredPlans=highestPriority?plans.filter(row=>priorityScore(row)===highestPriority):plans;
  if(preferredPlans.length){const index=Math.min(preferredPlans.length-1,Math.floor(Math.max(0,Math.min(.999999,Number(random())||0))*preferredPlans.length));for(const evidence of preferredPlans[index].evidence){const item=available.find(item=>item.card.id===evidence.id);if(item&&!picked.some(p=>p.card.id===item.card.id))picked.push(item);}}
  if(!picked.length&&priority.length&&count){const index=Math.min(priority.length-1,Math.floor(Math.max(0,Math.min(.999999,Number(random())||0))*priority.length));picked.push(priority[index]);}
  // A feasible activity already provides direction. Keep the first round short
  // and reserve additional questions for actual unresolved requirements.
  const budget=plans.length?Math.min(count,Math.max(2,picked.length)):count;
  const remaining=available.filter(x=>!picked.some(p=>p.card.id===x.card.id)&&(!plans.length||supported.has(x.topic.id)));
  picked.push(...M.selectSessionQuestions(remaining,budget-picked.length,random));picked.sort((a,b)=>a.card.rang-b.card.rang||a.card.id.localeCompare(b.card.id));
  const queue=[];people.forEach((person,personIndex)=>picked.forEach(item=>queue.push({card:item.card,personIndex,item})));
  return {settings,available,items:picked,queue};
 }
 function canStillMatch(item,profiles){
  const defs=M.directions(item.card),allowed=item.allowed;
  const positive=(index,direction)=>{const answer=profiles[index].answers.findLast(a=>a.id===item.card.id);return answer?answer.actuality==='ja'&&answer.preferences[direction]==='ja':allowed[index].includes(direction);};
  const covered=profiles.map(()=>false);
  for(let a=0;a<profiles.length;a++)for(let b=a+1;b<profiles.length;b++)for(const d of defs)for(const c of M.complements(d))if(rolePair(profiles[a],profiles[b])&&roleDirection(profiles[a],d.id)&&roleDirection(profiles[b],c)&&positive(a,d.id)&&positive(b,c)){covered[a]=true;covered[b]=true;}
  return covered.every(Boolean);
 }
 function pool(profiles,entries){
  const answered=profiles.map(person=>new Set(person.answers.map(answer=>answer.id)));
  const complete=entries.filter(entry=>answered.every(ids=>ids.has((entry.card||entry).id)));
  return M.match(profiles,complete).map(item=>({...item,pairs:item.pairs.filter(pair=>rolePair(profiles[pair.a],profiles[pair.b])).map(pair=>{const routes=pair.routes.filter(route=>roleDirection(profiles[pair.a],route.aDirection)&&roleDirection(profiles[pair.b],route.bDirection));return {...pair,routes,compatible:pair.compatible&&routes.some(route=>route.confirmed)};})})).filter(item=>item.answers.every(a=>a.answered&&a.actuality==='ja')&&profiles.every((_,i)=>item.pairs.some(p=>p.compatible&&(p.a===i||p.b===i))));
 }
 function followup(plan,profiles,entries,settings){
  const answerLimit=Object.values(settings.quicky||{}).some(Boolean)?6:12;if(profiles.some(person=>person.answers.length>=answerLimit))return [];
  // Only ask unresolved requirements for an activity still possible after the
  // actual answers. A rejected direction is never replaced by a prediction.
  const possible=profiles.map((person,index)=>{
   const predicted=M.profile('followup-'+index);predicted.dynamicRole=person.dynamicRole;
   for(const item of plan.available){const answer=person.answers.findLast(a=>a.id===item.card.id);M.voteDirections(predicted,item.card,answer?answer.preferences:Object.fromEntries(item.allowed[index].map(id=>[id,'ja'])),{actuality:answer?answer.actuality:'ja'});}
   return predicted;
  });
  const asked=new Set(profiles.flatMap(person=>person.answers.map(answer=>answer.id))),categoryVisits=new Map();for(const item of plan.available)if(asked.has(item.card.id)){const category=item.topic.group||item.card.categoryId;categoryVisits.set(category,(categoryVisits.get(category)||0)+1);}
  const preferenceScore=proposal=>proposal.unanswered.reduce((sum,e)=>{const item=plan.available.find(item=>item.card.id===e.id);return sum+profiles.reduce((score,person)=>score+(person.priorities?.[item?.topic.id]||0),0);},0);
  const flexibility=proposal=>proposal.unanswered.reduce((sum,e)=>{const item=plan.available.find(item=>item.card.id===e.id);return sum+(item?Math.min(...item.allowed.map(directions=>directions.length)):0);},0);
  const diversityCost=proposal=>Math.min(...proposal.unanswered.map(e=>{const item=plan.available.find(item=>item.card.id===e.id);return categoryVisits.get(item?.topic.group||item?.card.categoryId)||0;}));
  const proposals=window.DypereActivityRegistry.eligible(prioritizeEvidence(pool(possible,entries),profiles,plan.available),profiles.length,settings).map(row=>({row,unanswered:row.evidence.filter(e=>profiles.some(person=>!person.answers.some(a=>a.id===e.id)))})).filter(x=>x.unanswered.length).sort((a,b)=>preferenceScore(b)-preferenceScore(a)||a.unanswered.length-b.unanswered.length||flexibility(b)-flexibility(a)||diversityCost(a)-diversityCost(b)||a.row.activity.level-b.row.activity.level);
  if(!proposals.length)return [];
  const items=proposals[0].unanswered.map(e=>plan.available.find(item=>item.card.id===e.id)).filter(Boolean).sort((a,b)=>a.card.rang-b.card.rang);
  const queue=[];profiles.forEach((person,personIndex)=>items.forEach(item=>{if(!person.answers.some(a=>a.id===item.card.id))queue.push({card:item.card,personIndex,item});}));return queue;
 }
 function enough(profiles,entries,settings,selectedCount){
  const matched=pool(profiles,entries),minimum=Math.min(2,selectedCount),target=Object.values(settings.quicky||{}).some(Boolean)?1:settings.minutes===15?1:settings.minutes===30?2:3;
  return profiles.every(p=>p.answers.length>=minimum)&&matched.length>=target&&!!window.DypereActivityRegistry?.eligible(matched,profiles.length,settings).length;
 }
 window.DypereSessionPlanner=Object.freeze({options,candidates,build,canStillMatch,pool,enough,followup});
})();
