(function(){
 'use strict';
 const bank=window.DypereActivityDatabase;
 const knownTopics=new Set(window.DypereInterestProfiles.catalog.map(t=>t.id));
 function validPhases(a){return a.phases===undefined||Array.isArray(a.phases)&&a.phases.length===a.steps.length&&a.phases.every(p=>p&&typeof p.title==='string'&&p.title.trim()&&typeof p.text==='string'&&p.text.trim()&&Number.isInteger(p.minutes)&&p.minutes>0&&Number.isInteger(p.level)&&p.level>=1&&p.level<=a.level)&&a.phases.reduce((sum,p)=>sum+p.minutes,0)===a.minutes;}
 function valid(a){return !!a&&typeof a.id==='string'&&a.id.length>0&&typeof a.enabled==='boolean'&&typeof a.title==='string'&&a.title.trim()&&typeof a.description==='string'&&a.description.trim()&&Array.isArray(a.steps)&&a.steps.length>0&&a.steps.every(s=>typeof s==='string'&&s.trim())&&validPhases(a)&&Number.isInteger(a.level)&&a.level>=1&&a.level<=5&&Number.isInteger(a.minutes)&&a.minutes>0&&Array.isArray(a.groups)&&a.groups.length>0&&a.groups.every(n=>[2,3,4].includes(n))&&Array.isArray(a.requires)&&a.requires.length>0&&a.requires.every(r=>r&&Array.isArray(r.anyOf)&&r.anyOf.length>0&&r.anyOf.every(id=>knownTopics.has(id))&&(!r.routes||Array.isArray(r.routes)&&r.routes.every(pair=>Array.isArray(pair)&&pair.length===2&&pair.every(v=>typeof v==='string'))));}
 function validActors(a){return (!a.reviewNote||typeof a.reviewNote==='string')&&a.requires.every(r=>!r.actorRoles||a.groups.length===1&&a.groups[0]===2&&typeof r.actorRoles==='object'&&!Array.isArray(r.actorRoles)&&Object.values(r.actorRoles).every(v=>typeof v==='string'&&v.length)&&new Set(Object.values(r.actorRoles)).size===Object.keys(r.actorRoles).length&&(!r.routes||r.routes.every(route=>route.every(d=>r.actorRoles[d]))));}
 function records(){const ids=new Set();return (Array.isArray(bank?.activities)?bank.activities:[]).filter(a=>{if(!valid(a)||!validActors(a)||ids.has(a.id))return false;ids.add(a.id);return true;});}
 function topicIds(){return new Set(records().flatMap(a=>a.requires.flatMap(r=>r.anyOf)));}
 function routeFits(route,requirement){return route.confirmed&&(!requirement.routes?.length||requirement.routes.some(r=>r[0]===route.aDirection&&r[1]===route.bDirection));}
 // An actor is a participant in the whole activity, independent of upload order.
 // Keep one consistent assignment across every required topic.
 function bindActors(options,index=0,actors={},bindings=[]){
  if(index===options.length)return {actors,bindings};
  for(const binding of options[index])for(const pair of binding.pairs)for(const route of pair.routes){
   if(!routeFits(route,binding.requirement))continue;
   const roles=binding.requirement.actorRoles||{},next={...actors};let compatible=true;
   for(const [direction,person] of [[route.aDirection,pair.a],[route.bDirection,pair.b]]){
    const role=roles[direction];if(!role)continue;
    if(next[role]!==undefined&&next[role]!==person||Object.entries(next).some(([key,value])=>key!==role&&value===person)){compatible=false;break;}
    next[role]=person;
   }
   if(!compatible)continue;
   const found=bindActors(options,index+1,next,[...bindings,{...binding,pairs:[{...pair,routes:[route]}]}]);
   if(found)return found;
  }
  return null;
 }
 function eligible(pool,partySize,settings){
  return records().filter(activity=>activity.enabled&&activity.groups.includes(partySize)&&activity.level<=settings.max&&activity.minutes<=settings.minutes&&(!Object.values(settings.quicky||{}).some(Boolean)||activity.minutes<30)).flatMap(activity=>{
   const evidence=[],bindings=[],options=[];
   for(const requirement of activity.requires){
    const matches=pool.filter(item=>item.answers.length===partySize&&item.answers.every(a=>a.answered&&a.actuality==='ja'&&a.origin==='question')&&requirement.anyOf.includes(item.topicId||window.DypereProfileCatalog.find(t=>window.DypereProfileQuestionIds[t.id]===item.id)?.id));
    const good=matches.flatMap(item=>{
     const pairs=item.pairs.filter(pair=>pair.compatible&&pair.routes.some(route=>routeFits(route,requirement)));
     const covered=new Set(pairs.flatMap(p=>[p.a,p.b]));
     return covered.size===partySize?[{item,pairs,requirement}]:[];
    });
    if(!good.length)return [];
    options.push(good);evidence.push(good[0].item);bindings.push(good[0]);
   }
   if(activity.requires.some(r=>r.actorRoles)){
    const assignment=bindActors(options);if(!assignment)return [];
    return [{activity,evidence:assignment.bindings.map(b=>b.item),bindings:assignment.bindings,actors:assignment.actors}];
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
   if(!valid(a)||!validActors(a)){errors.push((a?.id||'Uten ID')+': ugyldig innhold, interesse eller ramme');continue;}
   if(ids.has(a.id))errors.push(a.id+': gjentatt aktivitets-ID');ids.add(a.id);
  }
  return errors;
 }
 window.DypereActivityRegistry=Object.freeze({topicIds,eligible,choose,validate});
})();
