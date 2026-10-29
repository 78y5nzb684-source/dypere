(function(root){
 'use strict';
 const MAX_CARDS=50000,MAX_TEXT=1200,MAX_ID=100,MAX_CATEGORY=64,MAX_TOTAL_TEXT=10000000;
 // Generic question frames and neutral timing phrases only. A lexical family
 // is an aid against repeated wording, not a semantic interpretation.
 const opening=/^(?:vil du utforske|vil du ha|frister det med|frister tanken på|er du klar for|kunne du tenke deg|skal vi prøve)(?:\s+|$)/u;
 const similarityOpening=/^(?:har du lyst til å|har du lyst til|har du lyst på|ønsker du å|ønsker du|er du klar til å|er du klar til|vil du prøve|vil du utforske|vil du ha|frister det med|frister tanken på|er du klar for|kunne du tenke deg|skal vi prøve)(?:\s+|$)/u;
 const timing=/(?:^|\s+)(?:i kveld|akkurat nå)$/u;
 function normalizeText(text){
  if(typeof text!=='string')throw new TypeError('Korttekst må være en tekststreng.');
  return text.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]/gu,' ').replace(/\s+/gu,' ').trim();
 }
 function familyKey(text){
  const normalized=normalizeText(text),core=normalized.replace(opening,'').replace(timing,'').trim();
  // Keep an empty-core fallback separate from a literal, nonempty core.
  return core?'core:'+core:'text:'+normalized;
 }
 function similarityKey(text){
  const normalized=normalizeText(text),core=normalized.replace(similarityOpening,'').replace(timing,'').replace(/^å(?:\s+|$)/u,'').trim();
  // Exact lexical equality only: retain body words, order, people, negation
  // and numbers. Never infer synonyms or combine entire categories.
  return core?'sim:v1:core:'+core:'sim:v1:text:'+normalized;
 }
 function buildIndex(bank){
  if(!Array.isArray(bank)||bank.length<1||bank.length>MAX_CARDS)throw new TypeError('Kortbanken må ha 1–'+MAX_CARDS+' kort.');
  const ids=new Set(),entries=[];let totalText=0;
  for(let i=0;i<bank.length;i++){
   const card=bank[i],label='Kort '+(i+1);
   if(!card||typeof card!=='object'||Array.isArray(card))throw new TypeError(label+' må være et kortobjekt.');
   if(typeof card.id!=='string'||!card.id.trim()||card.id!==card.id.trim()||card.id.length>MAX_ID||ids.has(card.id))throw new TypeError(label+' har ugyldig eller gjentatt ID.');
   if(typeof card.cat!=='string'||!card.cat.trim()||card.cat!==card.cat.trim()||card.cat.length>MAX_CATEGORY)throw new TypeError(label+' har ugyldig kategori.');
   if(!Number.isInteger(card.rang)||card.rang<1||card.rang>5)throw new TypeError(label+' må ha rang 1–5.');
   if(typeof card.text!=='string'||!card.text.trim()||card.text.length>MAX_TEXT)throw new TypeError(label+' må ha 1–'+MAX_TEXT+' tegn i teksten.');
   totalText+=card.text.length;if(totalText>MAX_TOTAL_TEXT)throw new TypeError('Kortbankens samlede tekst er for stor.');
   const textKey=normalizeText(card.text);
   if(!textKey)throw new TypeError(label+' mangler lesbar tekst.');
   ids.add(card.id);entries.push({id:card.id,cat:card.cat,rang:card.rang,text:card.text,textKey,familyKey:familyKey(card.text),similarityKey:similarityKey(card.text)});
  }
  return entries;
 }
 root.DypereJourneyBank=Object.freeze({normalizeText,familyKey,similarityKey,buildIndex});
})(typeof window!=='undefined'?window:globalThis);
