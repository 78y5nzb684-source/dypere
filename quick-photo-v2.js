(function(){
 'use strict';
 const U = DypereUI;
 const out = document.getElementById('quickPhotoText');

 // Bruk de mest eksplisitte listene
 const babyPrompts = window.DYPERE_BABY_EXTRA || [];
 const mesterPrompts = [
  "Send bilde av pikken din hard.",
  "Send bilde av deg som holder den.",
  "Send bilde av pikken din og skriv hva du vil gjøre med den.",
  "Send bilde av deg etter du har kommet.",
  "Send bilde av hånden din rundt pikken.",
  "Send bilde av deg som rører den.",
  "Send bilde av pikken din tett på.",
  "Send bilde av deg hard og klar.",
  "Send bilde av spermen din.",
  "Send bilde av deg som viser hvor hard du er.",
  "Send bilde av pikken din våt.",
  "Send bilde av deg som spruter.",
  "Send bilde av pikken din i munnen hennes.",
  "Send bilde av deg som holder henne i håret mens hun suger.",
  "Send bilde av pikken din inne i henne.",
  "Send bilde av deg som tar henne bakfra.",
  "Send bilde av pikken din med glid.",
  "Send bilde av deg som kommer på henne.",
  "Send bilde av pikken din hard og dryppende.",
  "Send bilde av deg som holder den mot fitta hennes.",
  "Send bilde av pikken din etter du har vært inne i henne.",
  "Send bilde av deg som nekter henne å komme.",
  "Send bilde av pikken din mens du sier hva du vil.",
  "Send bilde av deg som bruker henne.",
  "Send bilde av pikken din tett på rompehullet hennes."
];;

 document.querySelectorAll('[data-quick-photo]').forEach(b => {
   b.onclick = () => {
     const role = b.dataset.quickPhoto;
     const pool = role === 'Baby' ? babyPrompts : mesterPrompts;
     out.hidden = false;
     out.replaceChildren();
     if (!pool.length) {
       out.append(U.node('p', role + ' · Ingen prompter tilgjengelig.'));
       return;
     }
     const prompt = pool[Math.floor(Math.random() * pool.length)];
     out.append(U.node('p', role + ' · ' + prompt));
   };
 });
})();
