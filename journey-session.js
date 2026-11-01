(function(){
 'use strict';
 const P=window.DypereInterestProfiles,M=window.DypereJourneyModel;
 function options(raw={}){
  const curiosity={};for(const [id,value] of Object.entries(raw.curiosity||{}))if(typeof id==='string'&&value===true)curiosity[id]=true;
  return {minutes:[15,30,60].includes(Number(raw.minutes))?Number(raw.minutes):30,max:[2,3,5].includes(Number(raw.max))?Number(raw.max):3,curiosity};
 }
 function candidates(people,entries,raw={}){
  const settings=options(typeof raw==='number'?{max:raw}:raw),byId=new Map(entries.map(e=>[e.card.id,e.card])),rows=new Map();
  const accepts=(index,value)=>value==='ja'||settings.curiosity[people[index].id]===true&&value==='kanskje';
  for(const topic of P.catalog){
   const card=byId.get(window.DypereProfileQuestionIds[topic.id]);if(!card||card.area==='uavklart')continue;
   const level=Math.max(...people.map(p=>p.levels[topic.id]||card.rang));if(level>settings.max)continue;
   const allowed=people.map(()=>new Set()),certain=people.map(()=>new Set());
   for(let a=0;a<people.length;a++)for(let b=a+1;b<people.length;b++)for(const d of topic.directions)for(const c of M.complements(d)){
    const x=people[a].preferences[topic.id]?.[d.id],y=people[b].preferences[topic.id]?.[c];
    if(accepts(a,x)&&accepts(b,y)){allowed[a].add(d.id);allowed[b].add(c);if(x==='ja'&&y==='ja'){certain[a].add(d.id);certain[b].add(c);}}
   }
   if(!allowed.every(d=>d.size))continue;
   const item={topic,card:{...card,rang:level},allowed:allowed.map(d=>[...d]),uncertain:!certain.every(s=>s.size)};
   const prior=rows.get(card.id);if(!prior||prior.uncertain&&!item.uncertain)rows.set(card.id,item);
  }
  return [...rows.values()].sort((a,b)=>a.card.rang-b.card.rang||Number(a.uncertain)-Number(b.uncertain)||a.card.id.localeCompare(b.card.id));
 }
 function build(people,entries,raw,random=Math.random){
  const settings=options(raw),available=candidates(people,entries,settings),count=Math.min(available.length,settings.minutes===15?3:settings.minutes===30?5:7);
  const supported=window.DypereActivityRegistry?.topicIds()||new Set();
  const priority=available.filter(x=>supported.has(x.topic.id)).slice().sort((a,b)=>Number(a.uncertain)-Number(b.uncertain)||a.card.rang-b.card.rang);
  const picked=[];
  if(priority.length&&count){const index=Math.min(priority.length-1,Math.floor(Math.max(0,Math.min(.999999,Number(random())||0))*priority.length));picked.push(priority[index]);}
  const remaining=available.filter(x=>!picked.some(p=>p.card.id===x.card.id));
  picked.push(...M.selectSessionQuestions(remaining,count-picked.length,random));picked.sort((a,b)=>a.card.rang-b.card.rang||a.card.id.localeCompare(b.card.id));
  const queue=[];people.forEach((person,personIndex)=>picked.forEach(item=>queue.push({card:item.card,personIndex,item})));
  return {settings,available,items:picked,queue};
 }
 function canStillMatch(item,profiles){
  const defs=M.directions(item.card),allowed=item.allowed;
  const positive=(index,direction)=>{const answer=profiles[index].answers.findLast(a=>a.id===item.card.id);return answer?answer.actuality==='ja'&&answer.preferences[direction]==='ja':allowed[index].includes(direction);};
  const covered=profiles.map(()=>false);
  for(let a=0;a<profiles.length;a++)for(let b=a+1;b<profiles.length;b++)for(const d of defs)for(const c of M.complements(d))if(positive(a,d.id)&&positive(b,c)){covered[a]=true;covered[b]=true;}
  return covered.every(Boolean);
 }
 function pool(profiles,entries){
  return M.match(profiles,entries).filter(item=>item.answers.every(a=>a.answered&&a.actuality==='ja')&&profiles.every((_,i)=>item.pairs.some(p=>p.compatible&&(p.a===i||p.b===i))));
 }
 function enough(profiles,entries,settings,selectedCount){
  const matched=pool(profiles,entries),minimum=Math.min(2,selectedCount),target=settings.minutes===15?1:settings.minutes===30?2:3;
  return profiles.every(p=>p.answers.length>=minimum)&&matched.length>=target&&!!window.DypereActivityRegistry?.eligible(matched,profiles.length,settings).length;
 }
 window.DypereSessionPlanner=Object.freeze({options,candidates,build,canStillMatch,pool,enough});
})();
