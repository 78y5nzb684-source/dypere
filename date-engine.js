/* Date proposals must satisfy every confirmed layer of the question round. */
(function(root){
 'use strict';
 const family=(catalog,row)=>[catalog.modules[row[1]],catalog.modules[row[2]]].map(a=>a.theme+':'+a.format).sort().join('|');
 const topicKey=a=>'format:'+a.theme+':'+a.format;
 function validate(catalog,rows){
  if(catalog?.version!==1||!Array.isArray(catalog.modules)||!Array.isArray(catalog.styles)||!Array.isArray(rows)||rows.length!==catalog.count)throw new Error('Datebanken er ufullstendig.');
  root.DypereSoft.validateBank({version:1,activities:catalog.modules});
  const ids=new Set();
  for(const row of rows){
   if(!Array.isArray(row)||row.length!==5||typeof row[0]!=='string'||ids.has(row[0])||!row.slice(1).every(Number.isInteger)||!catalog.modules[row[1]]||!catalog.modules[row[2]]||row[1]===row[2]||!catalog.styles[row[3]]||![25,30,45,60,90,120].includes(row[4]))throw new Error('Ugyldig datepost.');
   const a=catalog.modules[row[1]],b=catalog.modules[row[2]],style=catalog.styles[row[3]],overhead=style.id==='pauser'?5:3;
   if(a.place!==b.place||Math.max(8,a.minMinutes||0)+Math.max(8,b.minMinutes||0)+overhead>row[4]||row[4]<=30&&(!a.supportsQuicky||!b.supportsQuicky))throw new Error('Datoens tids- eller stedskrav henger ikke sammen.');
   ids.add(row[0]);
  }
  return {...catalog,rows};
 }
 let loading=null;
 function load(){
  if(!loading)loading=(async()=>{
   async function json(url){const r=await fetch(url);if(!r.ok)throw new Error('Kunne ikke laste datebanken ('+r.status+').');return r.json();}
   const catalog=await json('./datebank/manifest.json'),parts=new Array(catalog.parts.length);let index=0;
   await Promise.all(Array.from({length:Math.min(4,parts.length)},async()=>{while(index<parts.length){const i=index++,part=catalog.parts[i];const r=await fetch('./datebank/'+part.file);if(!r.ok)throw new Error('En del av datebanken mangler.');const bytes=await r.arrayBuffer();
    if(crypto.subtle){const digest=await crypto.subtle.digest('SHA-256',bytes),hash=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==part.sha256)throw new Error('En del av datebanken har feil kontrollsum.');}
    const rows=JSON.parse(new TextDecoder().decode(bytes));if(rows.length!==part.count)throw new Error('En del av datebanken er ufullstendig.');parts[i]=rows;
   }}));
   return validate(catalog,parts.flat());
  })().catch(error=>{loading=null;throw error;});
  return loading;
 }
 function eligible(catalog,session){
  if(session.adaptive)return root.DypereSoft.dateCandidates(session,true);
  const E=root.DypereSoft,set=E.settings(session),confirmed=new Set(E.candidates(session,true).map(topicKey));
  const yes=key=>session.people.every((p,i)=>{const last=[...session.history].reverse().find(h=>h.key===key&&h.person===i);return last?.value==='ja';});
  const styles=catalog.styles.map(style=>yes('style:'+style.id)),durations={kort:yes('duration:kort'),middels:yes('duration:middels'),lang:yes('duration:lang')};
  const moduleOK=catalog.modules.map(a=>confirmed.has(topicKey(a))&&a.energy<=set.energy&&a.minPeople<=session.people.length&&a.maxPeople>=session.people.length&&(set.place==='begge'||a.place==='begge'||a.place===set.place)&&!!E.roleAssignment(session,a));
  return catalog.rows.filter(row=>moduleOK[row[1]]&&moduleOK[row[2]]&&styles[row[3]]&&durations[row[4]<=30?'kort':row[4]<=60?'middels':'lang']&&(!set.quicky||row[4]<=30));
 }
 function score(catalog,session,row){const themes=[...new Set([catalog.modules[row[1]].theme,catalog.modules[row[2]].theme])];return session.people.reduce((sum,p)=>sum+themes.reduce((n,t)=>n+(p.preferences[t]?.priority||0),0)/themes.length,0);}
 function pool(catalog,session,random=Math.random){
  const E=root.DypereSoft,groups=new Map();
  for(const row of eligible(catalog,session)){const key=family(catalog,row);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
  // Sample families first, so twenty time variations do not crowd out other ideas.
  const ranked=[...groups.values()].map(rows=>({rows,score:score(catalog,session,rows[0]),tie:random()})).sort((a,b)=>b.score-a.score||a.tie-b.tie),chosen=[];
  while(chosen.length<20){let added=false;for(const group of ranked){if(!group.rows.length)continue;const i=Math.floor(random()*group.rows.length);chosen.push(group.rows.splice(i,1)[0]);added=true;if(chosen.length===20)break;}if(!added)break;}
  return chosen;
 }
 function draw(catalog,pool,previous=[],random=Math.random){
  const fresh=pool.filter(r=>!previous.includes(r[0])),size=Math.min(3,pool.length),source=[...(fresh.length>=size?fresh:pool)];
  for(let i=source.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[source[i],source[j]]=[source[j],source[i]];}
  const out=[],families=new Set();for(const row of source){const f=family(catalog,row);if(!families.has(f)){out.push(row);families.add(f);}if(out.length===size)return out;}
  for(const row of source)if(!out.includes(row)){out.push(row);if(out.length===size)break;}
  return out;
 }
 function materialize(catalog,row,session){
  const E=root.DypereSoft,a=catalog.modules[row[1]],b=catalog.modules[row[2]],style=catalog.styles[row[3]],overhead=style.id==='pauser'?5:3;
  const minA=Math.max(8,a.minMinutes||0),minB=Math.max(8,b.minMinutes||0),spare=row[4]-overhead-minA-minB,first=minA+Math.floor(spare/2),second=minB+Math.ceil(spare/2);
  function role(part){const r=E.roleAssignment(session,part);return r?.leader!==null&&r?.leader!==undefined?' '+session.people[r.leader].name+' leder denne delen.':'';}
  return {id:row[0],title:a.title+' + '+b.title,description:a.description+' Deretter: '+b.description.charAt(0).toLowerCase()+b.description.slice(1),theme:a.theme,themes:[...new Set([a.theme,b.theme])],energy:Math.max(a.energy,b.energy),place:a.place,needsLeader:false,durationMinutes:row[4],style:style.name,parameters:{first:a.id,second:b.id,style:style.id},steps:[style.intro,'Første del · omtrent '+first+' minutter. '+a.description+role(a),...(style.id==='pauser'?['Ta en pause på omtrent to minutter før neste del.']:[]),'Andre del · omtrent '+second+' minutter. '+b.description+role(b),'Avslutning · omtrent tre minutter. '+style.end]};
 }
 const api={load,validate,eligible,pool,draw,materialize,family};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DypereDates=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:this);
