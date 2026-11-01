(function(){
 'use strict';
 const M=window.DypereJourneyModel,language=window.DypereJourneyLanguage,bank=window.DypereVarStundBank;
 const byLanguage=new Map(bank.map(q=>[M.family(q.text).slice(5),q]));
 const map={};
 for(const t of window.DypereProfileCatalog){
  let q=byLanguage.get(t.languageKey);
  if(!q){const text='Profiltema '+t.id;q={id:'profile-'+t.id,text,cat:'profil',rang:3};const key=M.family(text).slice(5);language[key]={topic:t.label,directTopic:t.label,question:[t.label,t.label,t.label],directions:t.directions,repeatKey:t.id,categoryId:t.group==='flere'?'lek':t.group};bank.push(q);}
  map[t.id]=q.id;
 }
 window.DypereProfileQuestionIds=Object.freeze(map);
})();
