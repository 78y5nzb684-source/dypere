(function(){
 'use strict';
 const categories=window.DypereJourneyCategories;
 function normalize(text){return text.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]/gu,' ').replace(/\s+/gu,' ').trim();}
 function family(text){
   const normalized=normalize(text);
   const core=normalized.replace(/^(?:har du lyst til å|har du lyst til|har du lyst på|har du lyst å prøve|har du lyst å|ønsker du å|ønsker du|er du klar til å|er du klar til|vil du prøve|vil du utforske|vil du ha|frister det med|frister tanken på|er du klar for|kunne du tenke deg|skal vi prøve|skal vi leke med|skal vi leke|skal vi teste)(?:\s+|$)/u,'').replace(/(?:^|\s+)(?:i kveld|akkurat nå)$/u,'').replace(/^å(?:\s+|$)/u,'').trim();
   return core?'core:'+core:'text:'+normalized;
 }
 let skipped=[],bankFamilies=new Set();
 function validerLanguage(language){return [...bankFamilies].filter(key=>!language||!Object.prototype.hasOwnProperty.call(language,key));}
 function indexReport(){return {skipped:skipped.map(x=>({...x}))};}
 function index(source){
   skipped=[];bankFamilies=new Set();
   if(!Array.isArray(source)){skipped.push({id:null,reason:'Banken er ikke en liste'});return [];}
   const ids=new Set(),entries=[];
   for(const q of source){
     let reason='';
     if(!q||typeof q.id!=='string'||!q.id.trim())reason='Ugyldig ID';
     else if(ids.has(q.id))reason='Duplikat ID';
     else if(typeof q.cat!=='string'||!q.cat.trim())reason='Ugyldig kategori';
     else if(!Number.isInteger(q.rang)||q.rang<1||q.rang>5)reason='Ugyldig rang';
     else if(typeof q.text!=='string'||!q.text.trim()||q.text.length>1200)reason='Ugyldig tekst';
     if(reason){skipped.push({id:q?.id??null,reason});continue;}
     const textKey=normalize(q.text);if(!textKey){skipped.push({id:q.id,reason:'Tom normalisert tekst'});continue;}
     const familyKey=family(q.text),l=window.DypereJourneyLanguage?.[familyKey.slice(5)];
     bankFamilies.add(familyKey.slice(5));
     ids.add(q.id);entries.push({card:Object.freeze({...q,categoryId:l?.categoryId||categories.find(s=>s.cat.includes(q.cat))?.id,area:l?.area||null,topic:l?.topic||familyKey.slice(5)}),textKey,familyKey,topicKey:l?.repeatKey||normalize(l?.topic||familyKey)});
   }
   return entries;
 }
 function profile(id){return {id,name:'',points:8,allocated:{},treeAllocated:[{},{},{}],treePoints:[8,4,4],scores:{},recent:[],recentCats:[],seenText:new Set(),seenFamilies:new Set(),seenTopics:new Set(),answers:[],consent:false};}
 const roots=window.DypereJourneyTree;
 function leaves(entries,group){
   const found=new Map();for(const e of entries){const q=e.card||e;if(q.categoryId!==group||q.area==='uavklart')continue;
     const id=group+':'+q.cat;if(!found.has(id))found.set(id,{id,name:q.cat==='fisting'&&group==='lek'?'Vaginal fisting':window.DypereJourneyCategoryNames[q.cat]||q.cat,cat:q.cat,group});}
   return [...found.values()];
 }
 function treeNodes(level,entries){return level===0?roots:level===1?categories:categories.flatMap(c=>leaves(entries,c.id));}
 function allocate(p,level,id,delta,entries,unlocked=2){
   if(!Number.isInteger(level)||level<0||level>unlocked||level>2||![1,-1].includes(delta)||!treeNodes(level,entries).some(n=>n.id===id))return false;
   if(delta>0&&p.treePoints[level]<1||delta<0&&!(p.treeAllocated[level][id]>0))return false;
   p.treeAllocated[level][id]=(p.treeAllocated[level][id]||0)+delta;p.treePoints[level]-=delta;return true;
 }
 function priority(p,q,entries){
   if(!p.treeAllocated)return p.allocated[q.categoryId]||0;
   const [top,middle,bottom]=p.treeAllocated;
   const paths=roots.filter(root=>root.groups.includes(q.categoryId)).map(root=>{
     const childTotal=root.groups.reduce((n,id)=>n+1+(middle[id]||0),0);
     return (1+(top[root.id]||0))*(1+(middle[q.categoryId]||0))/childTotal;
   });
   const children=leaves(entries,q.categoryId),total=children.reduce((n,c)=>n+1+(bottom[c.id]||0),0);
   // Shared nodes use the strongest route, never a duplicated sum of the same node.
   return Math.max(0,...paths)*(1+(bottom[q.categoryId+':'+q.cat]||0))/Math.max(1,total);
 }
 function rank(mode,segment,step,lengths){const progress=(segment-1+step/lengths[segment-1])/3;return 1+Math.pow(progress,mode==='kartlegg'?0.85:1.25)*(mode==='kartlegg'?2.5:4);}
 function pick(p,entries,currentRang,random=Math.random,peers=[]){
   if(!entries)return null;
   const rejected=p.answers.filter(a=>a.vote==='nei');
   const fresh=entries.filter(x=>!(x.card.cat==='fisting'&&x.card.area==='uavklart')&&!rejected.some(a=>a.cat==='fisting'&&x.card.cat==='fisting'&&(a.area==='uavklart'||a.area===x.card.area))&&x.card.rang<=5&&!p.recent.includes(x.card.id)&&!p.recentCats.includes(x.card.cat)&&!p.seenText.has(x.textKey)&&!p.seenFamilies.has(x.familyKey)&&(!x.topicKey||!p.seenTopics.has(x.topicKey)));
   if(!fresh.length)return null;
   const progress=p.answers.length,phase=progress<12?'bred':(progress-12)%4<2?'avklar':(progress-12)%4===2?'utforsk':'kontroller';
   const counts=Object.fromEntries(categories.map(c=>[c.id,p.answers.filter(a=>a.categoryId===c.id).length]));
   const targets=new Set(peers.filter(other=>other.id!==p.id).flatMap(other=>other.answers.filter(a=>a.vote==='ja'||a.vote==='kanskje').map(a=>a.id)));
   const near=fresh.filter(e=>Math.abs(e.card.rang-currentRang)<=1.3);
   let pool=near.length?near:fresh;
   if(phase==='avklar'||phase==='kontroller'){
     const shared=fresh.filter(e=>targets.has(e.card.id));if(shared.length)pool=shared;
   }
   if(phase==='bred'||phase==='utforsk'){
     const least=Math.min(...pool.map(e=>counts[e.card.categoryId]||0));pool=pool.filter(e=>(counts[e.card.categoryId]||0)===least);
   }
   const sizes={};pool.forEach(e=>sizes[e.card.categoryId]=(sizes[e.card.categoryId]||0)+1);
   const weighted=pool.map(e=>{
     const id=e.card.categoryId;
     // No-answer is never negative interest. Maybe is not a weak yes.
     const interest=p.answers.filter(a=>a.categoryId===id&&a.vote==='ja').length;
     const prior=priority(p,e.card,entries)*8;
     const rankWeight=1/(1+Math.abs(e.card.rang-currentRang));
     return {entry:e,weight:(1+prior*.25+interest*.35)*rankWeight/sizes[id]};
   });
   let needle=Math.max(0,Math.min(.999999999,random()))*weighted.reduce((sum,e)=>sum+e.weight,0);
   const entry=(weighted.find(e=>(needle-=e.weight)<0)||weighted[weighted.length-1]).entry;
   p.seenText.add(entry.textKey);p.seenFamilies.add(entry.familyKey);if(entry.topicKey)p.seenTopics.add(entry.topicKey);
   p.recent.push(entry.card.id);p.recentCats.push(entry.card.cat);
   if(p.recent.length>16)p.recent.shift();if(p.recentCats.length>4)p.recentCats.shift();
   return entry.card;
 }
 function directions(q){
   const rows=window.DypereJourneyLanguage?.[family(q.text).slice(5)]?.directions;
   return Array.isArray(rows)?rows.map(row=>({...row})):[];
 }
 function aggregate(preferences){
   const votes=Object.values(preferences);
   return votes.includes('ja')?'ja':votes.includes('kanskje')?'kanskje':votes.length&&votes.every(v=>v==='nei')?'nei':'–';
 }
 function voteDirections(p,q,preferences,details={}){
   const defs=directions(q),keys=new Set(defs.map(d=>d.id));
   if(!defs.length||!preferences||typeof preferences!=='object'||Array.isArray(preferences)||Object.entries(preferences).some(([id,v])=>!keys.has(id)||!['ja','kanskje','nei','–'].includes(v)))return false;
   if(p.allowed&&Object.entries(preferences).some(([id,v])=>(v==='ja'||v==='kanskje')&&!p.allowed[q.id]?.includes(id)))return false;
   const selected=Object.freeze(Object.fromEntries(defs.map(d=>[d.id,preferences[d.id]||'–'])));
   const key=aggregate(selected),l=window.DypereJourneyLanguage?.[family(q.text).slice(5)];
   const previous=p.answers.findIndex(a=>a.id===q.id);
   if(previous>=0){const old=p.answers[previous],oldValue={ja:2,kanskje:1,nei:0}[old.vote]||0;p.scores[old.cat]=Math.max(0,(p.scores[old.cat]||0)-oldValue);if(!p.scores[old.cat])delete p.scores[old.cat];}
   const value={ja:2,kanskje:1,nei:0}[key]||0;if(value)p.scores[q.cat]=(p.scores[q.cat]||0)+value;
   const answer=Object.freeze({id:q.id,cat:q.cat,family:family(q.text),profileId:p.id,categoryId:q.categoryId||l?.categoryId||categories.find(s=>s.cat.includes(q.cat))?.id,area:q.area||l?.area||null,preferences:selected,vote:key,actuality:['ja','senere'].includes(details.actuality)?details.actuality:'uavklart'});
   if(previous>=0)p.answers[previous]=answer;else p.answers.push(answer);return true;
 }
 function responses(profiles,entries){
   const positive=v=>v==='ja'||v==='kanskje';
   return entries.map(entry=>{
     const source=entry.card||entry,l=window.DypereJourneyLanguage?.[family(source.text).slice(5)];
     const card={...source,categoryId:source.categoryId||l?.categoryId||categories.find(s=>s.cat.includes(source.cat))?.id,area:source.area||l?.area||null};
     const defs=directions(card);
     const answers=profiles.map(p=>{const answer=p.answers.findLast(a=>a.id===card.id);return {profileId:p.id,name:p.name,answered:!!answer,vote:answer?.vote||'–',preferences:answer?.preferences||{},actuality:answer?.actuality||'uavklart'};});
     const pairs=[];
     for(let a=0;a<answers.length;a++)for(let b=a+1;b<answers.length;b++){
       const x=answers[a],y=answers[b],routes=[];
       for(const d of defs){const av=x.preferences[d.id]||'–',bv=y.preferences[d.complement]||'–';if(positive(av)&&positive(bv))routes.push({aDirection:d.id,bDirection:d.complement,aVote:av,bVote:bv,confirmed:av==='ja'&&bv==='ja'});}
       const compatible=card.area!=='uavklart'&&routes.some(r=>r.confirmed),possible=routes.length>0;
       const common=positive(x.vote)&&positive(y.vote);
       if(!possible&&!common)continue;
       const needsClarification=!possible&&defs.some(d=>positive(x.preferences[d.id])&&(y.preferences[d.complement]||'–')==='–'||positive(y.preferences[d.complement])&&(x.preferences[d.id]||'–')==='–');
       const status=compatible?(x.actuality==='ja'&&y.actuality==='ja'?'Kompatible ønsker':'Kompatibel retning'):possible?'Mulig treff':needsClarification?'Felles interesse – retning uavklart':'Felles interesse – ingen kompatibel retning';
       pairs.push({a,b,routes,compatible,beggeJa:compatible,nesten:possible&&!compatible,needsClarification,status});
     }
     pairs.sort((a,b)=>Number(b.compatible)-Number(a.compatible)||Number(b.nesten)-Number(a.nesten)||a.a-b.a||a.b-b.b);
     return {...card,key:family(card.text).slice(5),directions:defs,answers,pairs,nesten:pairs.some(p=>p.nesten),jaCount:answers.filter(a=>a.vote==='ja').length,kanskjeCount:answers.filter(a=>a.vote==='kanskje').length};
   }).filter(e=>e.answers.some(a=>a.answered));
 }
 function match(profiles,entries){return responses(profiles,entries).filter(e=>e.pairs.some(p=>p.routes.length)).sort((a,b)=>Number(b.pairs.some(p=>p.compatible))-Number(a.pairs.some(p=>p.compatible))||a.id.localeCompare(b.id));}
 function chemistry(profiles){
   const raw=categories.map(s=>({id:s.id,name:s.name,value:profiles.reduce((sum,p)=>sum+p.answers.filter(a=>(a.categoryId||categories.find(c=>c.cat.includes(a.cat))?.id)===s.id&&a.vote==='ja').length,0)}));
   const max=Math.max(0,...raw.map(s=>s.value));return raw.map(s=>({...s,score:max?Math.round(s.value/max*100):0}));
 }
 window.DypereJourneyModel=Object.freeze({normalize,family,index,indexReport,validerLanguage,profile,rank,pick,directions,aggregate,voteDirections,responses,match,chemistry,leaves,treeNodes,allocate,priority});
})();
