/* Editorial revisions preserve old answers without interpreting them as answers to a new question. */
(() => {
 'use strict';
 const revisions={"quiz.html": {"DYPERE-I-Q003": "Kunne du ønske deg fem minutter til med nærhet før dere står opp?", "DYPERE-I-Q007": "Baby legger hodet i fanget til Mester og blir strøket gjennom håret mens de snakker om dagen. Frister det?", "DYPERE-I-Q009": "Mester setter av en kveld til å ta vare på Baby. Ingen oppgaver, bare omsorg. Frister det?", "DYPERE-I-Q011": "En spontan dans i stuen, selv om ingen av dere er særlig flinke til å danse. Frister det?", "DYPERE-I-Q012": "Kunne du tenke deg å dele en lang dusj bare fordi det er hyggelig å være sammen?", "DYPERE-I-Q013": "Baby får velge hvordan hun ønsker å bli holdt rundt når dere skal sove. Frister det?", "DYPERE-I-Q014": "Mester overrasker Baby med en romantisk helg han har planlagt selv. Frister det?", "DYPERE-I-Q019": "Mester og Baby later som de er fremmede som møtes i en hotellbar. Frister det at Baby tar det første initiativet?", "DYPERE-I-Q028": "Liker du at Mester veksler mellom en bestemt og en myk side?", "DYPERE-I-Q048": "Kunne du tenke deg å gjenta en kjent favoritt neste gang dere planlegger en kveld sammen?", "DYPERE-I-Q055": "Baby får velge belønningen blant forslag fra Mester. Frister denne valgfriheten?", "DYPERE-I-Q061": "Kunne du tenke deg å utforske anale preferanser uten at det trenger å være hovedaktiviteten?", "DYPERE-I-Q067": "Ei jente dukker opp i en fantasi om Baby og Mester. Er du nysgjerrig på å snakke mer om fantasien?", "DYPERE-I-Q079": "Mester åpner for at ei Mesterinne kan lede et avgrenset rollespill med Baby mens han observerer. Er tanken interessant for deg?", "DYPERE-I-Q085": "Er du nysgjerrig på å snakke om forskjellen mellom mykere og strengere dominans?", "DYPERE-I-Q116": "Mester og Baby planlegger hver sin overraskelse. Frister det å bytte på å overraske hverandre?", "DYPERE-I-Q123": "Baby og ei jente planlegger en overraskelse mens Mester venter. Er du nysgjerrig på å snakke om hvilken rolle han kunne hatt?", "DYPERE-I-Q132": "Mester foreslår at ei Mesterinne kan gi Baby en uventet belønning. Er du nysgjerrig på tanken?", "DYPERE-I-Q143": "Ei jente Baby kjenner, men som Mester ikke kjenner. Er du nysgjerrig på å snakke om en slik situasjon?", "DYPERE-I-Q146": "Kunne du tenke deg å bli kjent med ei jente som er like ny i dette som dere?"}, "kapittel-ii.html": {"0": "Et hotellrom uten planer. Frister det at dere velger hva dere vil gjøre sammen når dere kommer frem?", "16": "Vil du gjerne få en tydelig invitasjon til en intim kveld?"}, "kapittel-iii.html": {"5": "Ønsker du at Mester tar initiativ til mer variasjon innen sanselek?", "19": "Ønsker du å fordype et av temaene fra denne modulen i en ny samtale?"}, "kapittel-iv.html": {"3": "Liker du tydelige, bestemte instrukser fra Mester?", "19": "Ønsker du en ny samtale om hva dere liker ved Mester/Baby-dynamikken?"}, "kapittel-v.html": {"1": "Et tenkt kyss mellom Baby og ei jente foran Mester. Er du nysgjerrig på å snakke om hvilke følelser tanken vekker?", "11": "Ønsker du å skille tydelig mellom det som frister i fantasien og det du vil oppleve i virkeligheten?", "19": "Ønsker du å snakke videre om reaksjonene deres etter denne modulen?"}};
 const file=document.body.dataset.file;
 function reconcile(data,questions){
  if(!data?.answers)return;
  const changed=revisions[file]||{};
  questions.forEach((q,index)=>{
   const id=typeof q==='string'?String(index):q.id,text=changed[id],a=data.answers[id];
   if(!text||a?.questionRevision===24)return;
   if(!a){data.answers[id]={questionRevision:24};return;}
   const legacy={...a};delete legacy.questionRevision;
   data.answers[id]={comment:a.comment||'',questionRevision:24,previousAnswer:legacy};
  });
 }
 const exclusive=label=>/^(Ingen av|Ingen bestemte|Ønsker ikke|Har ingen preferanse|Usikker|At alt forblir)/i.test(label);
 function toggle(values,label){
  if(values.includes(label))return values.filter(x=>x!==label);
  return exclusive(label)?[label]:[...values.filter(x=>!exclusive(x)),label];
 }
 window.DypereSurveyReview=Object.freeze({reconcile,toggle});
})();
