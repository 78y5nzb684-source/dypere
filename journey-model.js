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
     ids.add(q.id);entries.push({card:Object.freeze({...q}),textKey,familyKey,topicKey:l?.repeatKey||normalize(l?.topic||familyKey)});
   }
   return entries;
 }
 function profile(id){return {id,name:'',points:16,allocated:{},scores:{},recent:[],recentCats:[],seenText:new Set(),seenFamilies:new Set(),seenTopics:new Set(),answers:[],consent:false};}
 function rank(mode,segment,step,lengths){const progress=(segment-1+step/lengths[segment-1])/3;return 1+Math.pow(progress,mode==='kartlegg'?0.85:1.25)*(mode==='kartlegg'?2.5:4);}
 function pick(p,entries,currentRang,random=Math.random){
   if(!entries)return null;
   const fresh=entries.filter(x=>x.card.rang<=5&&!p.recent.includes(x.card.id)&&!p.recentCats.includes(x.card.cat)&&!p.seenText.has(x.textKey)&&!p.seenFamilies.has(x.familyKey)&&(!x.topicKey||!p.seenTopics.has(x.topicKey)));
   const allowed=fresh.filter(x=>Math.abs(x.card.rang-currentRang)<=1.3),pool=allowed.length?allowed:fresh;
   if(!pool.length)return null;
   const groups=new Map();pool.forEach(x=>{if(!groups.has(x.card.cat))groups.set(x.card.cat,[]);groups.get(x.card.cat).push(x);});
   const weighted=Array.from(groups,([cat,entries])=>{
     let s=(p.scores[cat]||0)*4.5;
     categories.forEach(sk=>{if(sk.cat.includes(cat))s+=(p.allocated[sk.id]||0)*2;});
     return {entries,s};
   }).sort((a,b)=>b.s-a.s);
   const top=weighted.filter(x=>x.s===weighted[0].s),group=top[Math.floor(random()*top.length)];
   const entry=group.entries[Math.floor(random()*group.entries.length)];
   p.seenText.add(entry.textKey);p.seenFamilies.add(entry.familyKey);if(entry.topicKey)p.seenTopics.add(entry.topicKey);
   p.recent.push(entry.card.id);p.recentCats.push(entry.card.cat);
   if(p.recent.length>16)p.recent.shift();if(p.recentCats.length>4)p.recentCats.shift();
   return entry.card;
 }
 function vote(p,q,key){
   if(!['ja','kanskje','nei'].includes(key))return false;
   const value={ja:2,kanskje:1,nei:0}[key];
   const previous=p.answers.findIndex(a=>a.id===q.id);
   if(previous>=0){
     const old=p.answers[previous],oldValue={ja:2,kanskje:1,nei:0}[old.vote];
     if(oldValue){p.scores[old.cat]=(p.scores[old.cat]||0)-oldValue;if(!p.scores[old.cat])delete p.scores[old.cat];}
   }
   if(value)p.scores[q.cat]=(p.scores[q.cat]||0)+value;
   const entry=Object.freeze({id:q.id,cat:q.cat,family:family(q.text),vote:key,profileId:p.id});
   if(previous>=0)p.answers[previous]=entry;else p.answers.push(entry);return true;
 }
 function responses(profiles,entries){
   return entries.map(entry=>{
     const card=entry.card||entry;
     const answers=profiles.map(p=>{const answer=p.answers.findLast(a=>a.id===card.id);return {profileId:p.id,name:p.name,vote:answer?.vote||'–'};});
     const pairs=[];
     for(let a=0;a<answers.length;a++)for(let b=a+1;b<answers.length;b++){
       const av=answers[a].vote,bv=answers[b].vote;
       if(['ja','kanskje'].includes(av)&&['ja','kanskje'].includes(bv))pairs.push({a,b,nesten:av!==bv,beggeJa:av==='ja'&&bv==='ja'});
     }
     pairs.sort((a,b)=>Number(b.nesten)-Number(a.nesten)||Number(b.beggeJa)-Number(a.beggeJa)||a.a-b.a||a.b-b.b);
     return {...card,key:family(card.text).slice(5),answers,pairs,nesten:pairs.some(p=>p.nesten),jaCount:answers.filter(a=>a.vote==='ja').length,kanskjeCount:answers.filter(a=>a.vote==='kanskje').length};
   }).filter(e=>e.answers.some(a=>a.vote!=='–'));
 }
 function match(profiles,entries){
   return responses(profiles,entries).filter(e=>e.pairs.length).sort((a,b)=>Number(b.nesten)-Number(a.nesten)||Number(b.jaCount>=2)-Number(a.jaCount>=2)||a.id.localeCompare(b.id));
 }
 function chemistry(profiles){
   const raw=categories.map(s=>({id:s.id,name:s.name,value:profiles.reduce((sum,p)=>sum+s.cat.reduce((n,cat)=>n+(p.scores[cat]||0),0),0)}));
   const max=Math.max(0,...raw.map(s=>s.value));return raw.map(s=>({...s,score:max?Math.round(s.value/max*100):0}));
 }
 window.DypereJourneyModel=Object.freeze({normalize,family,index,indexReport,validerLanguage,profile,rank,pick,vote,responses,match,chemistry});
})();
