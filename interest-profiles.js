(function(){
 'use strict';
 const source=window.DypereProfileCatalog||[],catalog=[],lookup=new Map(),equivalent=new Map();
 // Merge only identical displayed concepts with identical directional schemas.
 // Broad categories, related practices and anatomical variants remain separate.
 for(const topic of source){const key=JSON.stringify([topic.label.normalize('NFKC').toLocaleLowerCase('nb'),topic.group,topic.directions.map(d=>[d.id,d.complement]).sort()]);let target=equivalent.get(key);if(!target){target={...topic,aliases:[...topic.aliases]};equivalent.set(key,target);catalog.push(target);}else target.aliases=[...new Set([...target.aliases,...topic.aliases])];lookup.set(topic.id,target);}
 const states=['ja','kanskje','nei'];
 function empty(){return {format:'dypere-interest-profile',version:1,id:'p-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),name:'',preferences:{},levels:{}};}
 function validate(raw){
  if(!raw||raw.format!=='dypere-interest-profile'||raw.version!==1)throw Error('Dette er ikke en støttet DYPERE-profil.');
  if(typeof raw.id!=='string'||!/^p-[a-zA-Z0-9-]{1,100}$/.test(raw.id)||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>60)throw Error('Profilen mangler gyldig navn eller identitet.');
  if(!raw.preferences||typeof raw.preferences!=='object'||Array.isArray(raw.preferences))throw Error('Profilen har ugyldige svar.');
  const result={...empty(),id:raw.id,name:raw.name.trim(),preferences:{},levels:{}};
  for(const [id,prefs] of Object.entries(raw.preferences)){
   const topic=lookup.get(id);if(!topic)throw Error('Profilen inneholder et ukjent tema.');
   if(!prefs||typeof prefs!=='object'||Array.isArray(prefs))throw Error('Ugyldige retningsvalg.');
   const out=result.preferences[topic.id]||{},priority={ja:1,kanskje:2,nei:3};for(const [dir,value] of Object.entries(prefs)){if(!topic.directions.some(d=>d.id===dir)||!states.includes(value))throw Error('Ugyldig retning eller svar.');if(!out[dir]||priority[value]>priority[out[dir]])out[dir]=value;}
   if(Object.keys(out).length)result.preferences[topic.id]=out;
  }
  if(raw.levels!==undefined&&(!raw.levels||typeof raw.levels!=='object'||Array.isArray(raw.levels)))throw Error('Ugyldig temarekkefølge.');
  for(const [id,level] of Object.entries(raw.levels||{})){if(!lookup.has(id)||!Number.isInteger(level)||level<1||level>5)throw Error('Ugyldig intensitetsnivå.');const canonical=lookup.get(id).id;result.levels[canonical]=Math.max(level,result.levels[canonical]||0);}
  return result;
 }
 function parse(text){if(typeof text!=='string'||text.length>2000000)throw Error('Profilfilen er for stor.');try{return validate(JSON.parse(text.replace(/^\uFEFF/,'')));}catch(error){if(error instanceof SyntaxError)throw Error('Filen kunne ikke leses som en profil.');throw error;}}
 const positive=v=>v==='ja'||v==='kanskje';
 function plan(people,{curious=false,explore=false}={}){
  if(people.length<2||people.length>4||new Set(people.map(p=>p.id)).size!==people.length)throw Error('Velg 2–4 forskjellige profiler.');
  const matches=[],discovery=[];
  for(const topic of catalog){
   const allowed=people.map(()=>new Set()),certain=people.map(()=>new Set());
   for(let a=0;a<people.length;a++)for(let b=a+1;b<people.length;b++)for(const d of topic.directions){
    const x=people[a].preferences[topic.id]?.[d.id],y=people[b].preferences[topic.id]?.[d.complement];
    const accepts=v=>v==='ja'||curious&&v==='kanskje'||explore&&v===undefined;
    if(accepts(x)&&accepts(y)&&(positive(x)||positive(y))){allowed[a].add(d.id);allowed[b].add(d.complement);if(x==='ja'&&y==='ja'){certain[a].add(d.id);certain[b].add(d.complement);}}
   }
   // Everyone must have a compatible path; a pair never opts the whole group in.
   if(!allowed.every(s=>s.size))continue;
   const item={topic,allowed:allowed.map(s=>[...s]),uncertain:!certain.every(s=>s.size)};
   if(item.uncertain)discovery.push(item);else matches.push(item);
  }
  return {matches,discovery,items:[...matches,...discovery]};
 }
 function download(profile){const valid=validate(profile),url=URL.createObjectURL(new Blob([JSON.stringify(valid,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='dypere-profil-'+valid.name.replace(/[^\p{L}\p{N}-]/gu,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 window.DypereInterestProfiles=Object.freeze({catalog,empty,validate,parse,plan,download});
})();
