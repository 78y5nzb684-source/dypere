(function(){
 'use strict';
 const P=window.DypereInterestProfiles,M=window.DypereJourneyModel;
 function options(raw={}){
  return {minutes:[15,30,60].includes(Number(raw.minutes))?Number(raw.minutes):30,max:[2,3,5].includes(Number(raw.max))?Number(raw.max):3,explore:raw.explore===true,topics:[...new Set(Array.isArray(raw.topics)?raw.topics:[])].filter(id=>typeof id==='string').slice(0,3)};
 }
 function candidates(people,entries,max=3){
  const byId=new Map(entries.map(e=>[e.card.id,e.card]));
  return P.catalog.flatMap(topic=>{
   const card=byId.get(window.DypereProfileQuestionIds[topic.id]);
   if(!card||card.area==='uavklart')return [];
   const level=Math.max(...people.map(p=>p.levels[topic.id]||card.rang));
   if(level>max)return [];
   const allowed=people.map(()=>new Set());
   for(let a=0;a<people.length;a++)for(let b=a+1;b<people.length;b++){
    const routes=[];
    for(const d of topic.directions)for(const c of M.complements(d)){
     const x=people[a].preferences[topic.id]?.[d.id],y=people[b].preferences[topic.id]?.[c];
     if(x!=='nei'&&y!=='nei'&&topic.directions.some(t=>t.id===c))routes.push({d:d.id,c,weight:({ja:4,kanskje:2}[x]||0)+({ja:4,kanskje:2}[y]||0)});
    }
    const best=Math.max(-1,...routes.map(r=>r.weight));
    routes.filter(r=>r.weight===best).forEach(r=>{allowed[a].add(r.d);allowed[b].add(r.c);});
   }
   if(!allowed.every(d=>d.size))return [];
   return [{topic,card:{...card,rang:level},allowed:allowed.map(d=>[...d])}];
  });
 }
 function build(people,entries,raw){
  const settings=options(raw),available=candidates(people,entries,settings.max),byTopic=new Map(available.map(x=>[x.topic.id,x]));
  const known=P.plan(people).matches.flatMap(item=>{
   const found=byTopic.get(item.topic.id);return found?[{...found,allowed:item.allowed,source:'profile'}]:[];
  });
  const knownIds=new Set(known.map(x=>x.topic.id));
  const requested=settings.explore?settings.topics.filter(id=>!knownIds.has(id)).flatMap(id=>byTopic.has(id)?[{...byTopic.get(id),source:'requested'}]:[]):[];
  const items=[...known,...requested],queue=[];
  // Keep stored preferences intact. Only explicitly requested gaps need questions.
  requested.forEach(item=>people.forEach((person,personIndex)=>{
   if(item.allowed[personIndex].some(id=>person.preferences[item.topic.id]?.[id]!=='ja'))queue.push({card:item.card,personIndex});
  }));
  queue.sort((a,b)=>a.personIndex-b.personIndex||a.card.rang-b.card.rang||a.card.id.localeCompare(b.card.id));
  return {settings,known,requested,items,queue};
 }
 window.DypereSessionPlanner=Object.freeze({options,candidates,build});
})();
