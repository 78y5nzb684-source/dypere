(function(){
 'use strict';
 const bank=window.DypereActivityDatabase;
 const knownTopics=new Set(window.DypereInterestProfiles.catalog.map(t=>t.id));
 function valid(a){return !!a&&typeof a.id==='string'&&a.id.length>0&&typeof a.enabled==='boolean'&&typeof a.title==='string'&&a.title.trim()&&typeof a.description==='string'&&a.description.trim()&&Array.isArray(a.steps)&&a.steps.length>0&&a.steps.every(s=>typeof s==='string'&&s.trim())&&Number.isInteger(a.level)&&a.level>=1&&a.level<=5&&Number.isInteger(a.minutes)&&a.minutes>0&&Array.isArray(a.groups)&&a.groups.length>0&&a.groups.every(n=>[2,3,4].includes(n))&&Array.isArray(a.requires)&&a.requires.length>0&&a.requires.every(r=>r&&Array.isArray(r.anyOf)&&r.anyOf.length>0&&r.anyOf.every(id=>knownTopics.has(id))&&(!r.routes||Array.isArray(r.routes)&&r.routes.every(pair=>Array.isArray(pair)&&pair.length===2&&pair.every(v=>typeof v==='string'))));}
 function records(){const ids=new Set();return (Array.isArray(bank?.activities)?bank.activities:[]).filter(a=>{if(!valid(a)||ids.has(a.id))return false;ids.add(a.id);return true;});}
 function topicIds(){return new Set(records().flatMap(a=>a.requires.flatMap(r=>r.anyOf)));}
 function eligible(pool,partySize,settings){
  return records().filter(activity=>activity.enabled&&activity.groups.includes(partySize)&&activity.level<=settings.max&&activity.minutes<=settings.minutes).flatMap(activity=>{
   const evidence=[],bindings=[];
   for(const requirement of activity.requires){
    const matches=pool.filter(item=>item.answers.length===partySize&&item.answers.every(a=>a.answered&&a.actuality==='ja'&&a.origin==='question')&&requirement.anyOf.includes(item.topicId||window.DypereProfileCatalog.find(t=>window.DypereProfileQuestionIds[t.id]===item.id)?.id));
    const good=matches.flatMap(item=>{
     const pairs=item.pairs.filter(pair=>pair.compatible&&pair.routes.some(route=>route.confirmed&&(!requirement.routes?.length||requirement.routes.some(r=>r[0]===route.aDirection&&r[1]===route.bDirection))));
     const covered=new Set(pairs.flatMap(p=>[p.a,p.b]));
     return covered.size===partySize?[{item,pairs,requirement}]:[];
    });
    if(!good.length)return [];
    evidence.push(good[0].item);bindings.push(good[0]);
   }
   return [{activity,evidence,bindings}];
  });
 }
 function choose(rows,excludeId=null,random=Math.random){
  const alternatives=rows.filter(x=>x.activity.id!==excludeId),choices=alternatives.length?alternatives:rows;
  if(!choices.length)return null;
  let value=Number(random());if(!Number.isFinite(value))value=0;
  return choices[Math.floor(Math.max(0,Math.min(.999999999,value))*choices.length)];
 }
 function validate(){
  const ids=new Set(),errors=[];
  for(const a of Array.isArray(bank?.activities)?bank.activities:[]){
   if(!valid(a)){errors.push((a?.id||'Uten ID')+': ugyldig innhold, interesse eller ramme');continue;}
   if(ids.has(a.id))errors.push(a.id+': gjentatt aktivitets-ID');ids.add(a.id);
  }
  return errors;
 }
 window.DypereActivityRegistry=Object.freeze({topicIds,eligible,choose,validate});
})();
