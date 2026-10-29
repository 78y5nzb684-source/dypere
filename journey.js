(function(){
 'use strict';
 const U = DypereUI, {$, node} = U;
 const view = $('journeyView');
 const bank = window.DypereVarStundBank || [];

 const skills = [
   {id:'naerhet', name:'Nærhet', cat:['sex','aftercare']},
   {id:'lek', name:'Lek', cat:['oral','creampie']},
   {id:'dybde', name:'Dybde', cat:['anal','fisting']},
   {id:'kontroll', name:'Kontroll', cat:['kontroll','bdsm','chastity']},
   {id:'utforsking', name:'Utforsking', cat:['group','exhibition','pegging']},
   {id:'intensitet', name:'Intensitet', cat:['impact','breath','humiliation','watersports']}
 ];
 const skillByCategory = new Map(skills.flatMap(sk => sk.cat.map(cat => [cat, sk.id])));
 const exploredGroups = new Set();

 let points = 8;
 let allocated = {};
 let scores = {};
 let currentRang = 1;
 let segment = 1;
 let stepInSegment = 0;
 let stepsPerSegment = [4,5,5];
 let mode = 'oppvarming';
 let context = 'hjemme';
 let recent = [];
 let recentCats = [];
 let answering = false;
 let calibrationButton = null;
 let answerButtons = [];

 function panel(title, kicker) {
   view.replaceChildren();
   const p = node('section', undefined, 'journey-panel');
   if (kicker) p.append(node('p', kicker, 'eyebrow'));
   const h = node('h2', title);
   p.append(h);
   view.append(p);
   return p;
 }

 function showConsent(){ const p = panel('Før dere starter'); p.append(node('p', 'Begge må være med. Dere kan stoppe når som helst. Alt er frivillig.')); const b = node('button', 'Vi er med', 'primary'); b.onclick = showContext; p.append(b); }
function showContext() {
   const p = panel('Hvor er dere?', 'KONTEKST');
   p.append(node('p', 'Dette styrer tempo og intensitet.'));
   [['bil','I bilen'],['hjemme','Hjemme'],['seng','I sengen'],['fest','Nachspiel / flere']].forEach(([id, label]) => {
     const b = node('button', label);
     b.onclick = () => { context = id; showMode(); };
     p.append(b);
   });
 }

 function showMode() {
   const p = panel('Velg modus', 'TO VEIER');
   p.append(node('p', 'Kartlegg bygger profil. Varm opp tar dere fra nøytral til superhot.'));
   const kart = node('button', 'Kartlegg (A–Å)', 'primary');
   const varm = node('button', 'Varm opp');
   kart.onclick = () => { mode = 'kartlegg'; stepsPerSegment = [6,6,6]; showSetup(); };
   varm.onclick = () => { mode = 'oppvarming'; stepsPerSegment = [4,5,5]; showSetup(); };
   p.append(kart, varm);
 }

 function showSetup() {
   const p = panel('Din karakter', 'SEGMENT ' + segment);
   p.append(node('p', 'Kalibrer ferdighetene. Du har ' + points + ' poeng.'));
   skills.forEach(s => {
     const row = node('div');
     row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin:8px 0;';
     row.append(node('span', s.name));
     const val = node('span', allocated[s.id] || 0);
     const minus = node('button', '−');
     const plus = node('button', '+');
     minus.onclick = () => { if ((allocated[s.id]||0) > 0) { allocated[s.id]--; points++; val.textContent = allocated[s.id]; pts.textContent = 'Poeng igjen: ' + points; }};
     plus.onclick = () => { if (points > 0) { allocated[s.id]=(allocated[s.id]||0)+1; points--; val.textContent = allocated[s.id]; pts.textContent = 'Poeng igjen: ' + points; }};
     row.append(minus, val, plus);
     p.append(row);
   });
   const pts = node('p', 'Poeng igjen: ' + points);
   p.append(pts);
   const go = node('button', segment===1 ? 'Start' : 'Fortsett', 'primary');
   go.onclick = () => { if (!answering) showQuestion(); };
   p.append(go);
 }

 function showQuestion() {
   if (!bank || !bank.length) { view.innerHTML = '<p>Kunne ikke laste spørsmål. Sjekk nettverk.</p>'; return; }
   if (stepInSegment >= stepsPerSegment[segment-1]) {
     if (segment < 3) { showSegmentEnd(); return; }
     else { showFinal(); return; }
   }
   const progress = (segment-1 + stepInSegment / stepsPerSegment[segment-1]) / 3;
   let exp = mode === 'kartlegg' ? 0.85 : 1.25;
   currentRang = 1 + Math.pow(progress, exp) * (mode === 'kartlegg' ? 2.5 : 4);
   if (context === 'bil') currentRang = Math.min(currentRang, 2.5);
   if (context === 'fest') currentRang = Math.min(currentRang, 3.5);

   const q = pickQuestion();
   if (!q) {
     const p = panel('Ingen spørsmål tilgjengelig');
     p.append(node('p', 'Ingen spørsmål i banken passer denne konteksten. Prøv en annen kontekst eller en større bank.'));
     const again = node('button', 'Ny seanse', 'primary');
     again.onclick = () => location.reload();
     p.append(again);
     return;
   }
   const totalSteps = stepsPerSegment.reduce((a,b)=>a+b,0);
   const done = stepsPerSegment.slice(0, segment-1).reduce((sum, count) => sum + count, 0) + stepInSegment;
   const tones = ['Nysgjerrig og lett', 'Varmere og mer direkte', 'Helt åpen'];
   const p = panel('Segment ' + segment + ' / 3', tones[segment-1] + ' · Spørsmål ' + (stepInSegment+1));
   const bar = node('div');
   bar.style.cssText = 'height:6px;background:#2a2a2a;border-radius:3px;margin:10px 0;overflow:hidden;';
   const fill = node('div');
   fill.style.cssText = 'height:100%;width:' + (done/totalSteps*100) + '%;background:#c45c26;transition:width .3s;';
   bar.append(fill);
   p.append(bar);
   let display = q.text;
   if (context === 'bil' && display.length > 60) display = display.split(' ').slice(0, 8).join(' ') + '...';
   p.append(node('p', display));
   p.append(node('p', 'Intensitet ' + currentRang.toFixed(1) + ' · Poeng ' + points, 'fine'));
   const exit = node('button', 'Avslutt', 'text-button');
   exit.onclick = () => location.reload();
   p.append(exit);
   const calib = node('button', 'Kalibrer', 'text-button');
   calibrationButton = calib;
   calib.disabled = answering;
   calib.onclick = () => { if (!answering) showSetup(); };
   p.append(calib);
   const btns = node('div');
   btns.style.cssText = 'display:flex;gap:8px;margin-top:12px;';
   answerButtons = [];
   [['Ja','ja'],['Kanskje','kanskje'],['Nei','nei']].forEach(([label,key]) => {
     const b = node('button', label, key==='ja'?'primary':'');
     b.onclick = () => answer(q, key);
     answerButtons.push(b);
     btns.append(b);
   });
   p.append(btns);
 }

 function pickQuestion() {
   let maxR = context==='bil'?2.5:context==='fest'?3.5:5;
   const allowed = bank.filter(t => Math.abs(t.rang - currentRang) <= 1.3 && t.rang <= maxR);
   const pool = allowed.length ? allowed : bank.filter(t => t.rang <= maxR);
   if (!pool.length) return null;
   // Apply the complete history window before ranking. A prefix of one
   // popular category must not make the rest of the eligible bank disappear.
   const fresh = pool.filter(t => !recent.includes(t.id) && !recentCats.includes(t.cat));
   const unused = fresh.length ? fresh : pool.filter(t => !recent.includes(t.id));
   const candidates = unused.length ? unused : pool;
   const categories = new Map();
   candidates.forEach(t => {
     if (!categories.has(t.cat)) categories.set(t.cat, []);
     categories.get(t.cat).push(t);
   });
   const weighted = Array.from(categories, ([cat, cards]) => {
     const t = cards[0];
     let s = (scores[t.cat] || 0) * 4.5;  // sterkere vekt på tidligere svar
     skills.forEach(sk => { if (sk.cat.includes(t.cat)) s += (allocated[sk.id]||0)*2; });
     return {cat, cards, s, group: skillByCategory.get(cat) || 'unmapped'};
   }).sort((a,b)=>b.s - a.s);
   // Category first, card second: file order and bank size are not tie-breakers.
   let ranked = weighted;
   if (!skills.some(sk => (allocated[sk.id] || 0) > 0)) {
     // Without a character prior, sample each available skill before exploiting
     // early answers. Unmapped categories share one sampling slot; their
     // individual category labels, scores and final-result semantics stay intact.
     const unexplored = weighted.filter(x => !exploredGroups.has(x.group));
     if (unexplored.length) {
       const groups = Array.from(new Set(unexplored.map(x => x.group)));
       const group = groups[Math.floor(Math.random()*groups.length)];
       ranked = unexplored.filter(x => x.group === group);
     }
   }
   const top = ranked.filter(x => x.s === ranked[0].s);
   const selected = top[Math.floor(Math.random()*top.length)];
   const chosen = selected.cards[Math.floor(Math.random()*selected.cards.length)];
   exploredGroups.add(selected.group);
   recent.push(chosen.id);
   recentCats.push(chosen.cat);
   if (recent.length > 16) recent.shift();
   if (recentCats.length > 4) recentCats.shift();
   return chosen;
 }

function answer(q, key) {
   if (answering) return;
   answering = true;
   if (calibrationButton) calibrationButton.disabled = true;
   answerButtons.forEach(button => { button.disabled = true; });
   if (key === 'ja') {
     scores[q.cat] = (scores[q.cat]||0) + 2;
     // Visuell feedback
     const fb = node('p', '+2 på ' + q.cat, 'points-feedback');
     fb.style.cssText = 'color:#c45c26;font-weight:bold;margin:8px 0;';
     view.append(fb);
     setTimeout(() => fb.remove(), 800);
   } else if (key === 'kanskje') {
     scores[q.cat] = (scores[q.cat]||0) + 1;
   }
   stepInSegment++;
   setTimeout(() => { answering = false; showQuestion(); }, key==='ja' ? 400 : 0);
 }

 function showSegmentEnd() {
   const p = panel('Segment ' + segment + ' ferdig');
   p.append(node('p', '+4 poeng. Kalibrer før neste segment.'));
   points += 4;
   const cont = node('button', 'Kalibrer og fortsett', 'primary');
   cont.onclick = () => { if (cont.disabled) return; cont.disabled = true; segment++; stepInSegment=0; showSetup(); };
   p.append(cont);
 }

 function showFinal() {
   const p = panel('Ferdig', 'DERES RETNING');
   const top = Object.entries(scores).sort((a,b)=>b[1]-a[1]).slice(0,3);
   const scenario = top.length ? 'Et scenario med ' + top[0][0] + (top[1] ? ' og ' + top[1][0] : '') : 'Noe rolig og nært';
   p.append(node('p', top.length ? 'Dere heller mot: ' + top.map(([c])=>c).join(', ') : 'Rolig retning'));
   p.append(node('p', 'Forslag: ' + scenario));
   p.append(node('p', 'Sluttintensitet: ' + currentRang.toFixed(1)));
   const again = node('button', 'Ny seanse', 'primary');
   again.onclick = () => location.reload();
   p.append(again);
 }

 showConsent();
})();
// P3-03: Banken er allerede delt (5000 av 100k). Full lazy-load kan komme senere.
