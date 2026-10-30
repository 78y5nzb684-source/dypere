(function(){
 'use strict';
 const U = DypereUI, {$, node} = U;
 const view = $('journeyView');
 const bank = window.DypereVarStundBank || [];
 const partyOptions = [
   {id:'couple', label:'Ett par', count:2},
   {id:'two-couples', label:'To par', count:4},
   {id:'couple-plus-one', label:'Et par + én ekstra', count:3}
 ].map(Object.freeze);
 let party = null;
 let sessionStarted = false;
 let panelRevision = 0;

 const skills = [
   {id:'naerhet', name:'Nærhet', cat:['sex','aftercare','sensory']},
   {id:'munn', name:'Munn', cat:['oral','cum','spitting']},
   {id:'dybde', name:'Dypere', cat:['anal','fisting','plug']},
   {id:'styring', name:'Styring', cat:['kontroll','bdsm','chastity','daddy']},
   {id:'lek', name:'Lek', cat:['creampie','feet','pet','wax']},
   {id:'risiko', name:'Risiko', cat:['group','exhibition','pegging','latex']},
   {id:'kraft', name:'Kraft', cat:['impact','breath','humiliation','watersports','medical']}
 ];

 let points = 8;
 let allocated = {};
 let scores = {};
 let currentRang = 1;
 let segment = 1;
 let stepInSegment = 0;
 let stepsPerSegment = [7,7,7];
 let mode = 'oppvarming';
 let context = 'hjemme';
 let recent = [];
 let recentCats = [];
 let answering = false;
 let calibrationButton = null;
 let answerButtons = [];
 let currentQuestion = null;
 let currentPosition = null;
 const seenText = new Set();
 const seenFamilies = new Set();
 const indexedBank = indexQuestions(bank);

 function normalizeQuestion(text) {
   return text.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]/gu, ' ').replace(/\s+/gu, ' ').trim();
 }

 function questionFamily(text) {
   // Generic positive question frames only. Preserve content words, people,
   // negation, numbers and word order; do not infer themes or synonyms.
   const normalized = normalizeQuestion(text);
   const core = normalized
     .replace(/^(?:har du lyst til å|har du lyst til|har du lyst på|har du lyst å prøve|har du lyst å|ønsker du å|ønsker du|er du klar til å|er du klar til|vil du prøve|vil du utforske|vil du ha|frister det med|frister tanken på|er du klar for|kunne du tenke deg|skal vi prøve|skal vi leke med|skal vi leke|skal vi teste)(?:\s+|$)/u, '')
     .replace(/(?:^|\s+)(?:i kveld|akkurat nå)$/u, '')
     .replace(/^å(?:\s+|$)/u, '').trim();
   return core ? 'core:' + core : 'text:' + normalized;
 }

 function indexQuestions(source) {
   if (!Array.isArray(source)) return null;
   const ids = new Set(), entries = [];
   for (const q of source) {
     if (!q || typeof q.id !== 'string' || !q.id.trim() || ids.has(q.id) || typeof q.cat !== 'string' || !q.cat.trim() || !Number.isInteger(q.rang) || q.rang < 1 || q.rang > 5 || typeof q.text !== 'string' || !q.text.trim() || q.text.length > 1200) return null;
     const textKey = normalizeQuestion(q.text);
     if (!textKey) return null;
     ids.add(q.id);
     entries.push({card: Object.freeze({id:q.id, cat:q.cat, rang:q.rang, text:q.text}), textKey, familyKey:questionFamily(q.text)});
   }
   return entries;
 }

 function panel(title, kicker) {
   panelRevision++;
   view.replaceChildren();
   const p = node('section', undefined, 'journey-panel');
   if (kicker) p.append(node('p', kicker, 'eyebrow'));
   const h = node('h2', title);
   p.append(h);
   if (party) p.append(node('p', party.label + ' · ' + party.count + ' deltakere', 'journey-group-summary'));
   view.append(p);
   return p;
 }

 function bindPanelAction(button, action) {
   const revision = panelRevision;
   button.onclick = () => { if (revision === panelRevision && !button.disabled) action(); };
 }

 function showParty() {
   if (sessionStarted || answering) return;
   const p = panel('Hvem er med?', 'DERES STUND');
   p.append(node('p', 'Velg hvem som deltar. Dere bruker én felles profil og svarer sammen.'));
   const options = node('div', undefined, 'journey-party-options');
   partyOptions.forEach((option, i) => {
     const b = node('button', option.label + ' · ' + option.count + ' deltakere', 'journey-party-choice' + (i === 0 ? ' primary' : ''));
     bindPanelAction(b, () => { party = option; showConsent(); });
     options.append(b);
   });
   p.append(options);
 }

 function showConsent() {
   if (!party || sessionStarted) return;
   const p = panel('Før dere starter');
   p.append(node('p', 'Alle må være med. Dere kan stoppe når som helst. Alt er frivillig.'));
   p.append(node('p', 'Svar sammen med én felles profil. Alle skal være enige i svaret dere velger.'));
   const b = node('button', 'Vi er med', 'primary');
   bindPanelAction(b, showContext);
   const change = node('button', 'Endre gruppe', 'text-button');
   bindPanelAction(change, showParty);
   p.append(b, change);
 }
function showContext() {
   if (!party || sessionStarted) return;
   const p = panel('Hvor er dere?', 'KONTEKST');
   p.append(node('p', 'Dette styrer tempo og intensitet.'));
   [['bil','I bilen'],['hjemme','Hjemme'],['seng','I sengen'],['fest','Nachspiel / flere']].forEach(([id, label]) => {
     const b = node('button', label);
     bindPanelAction(b, () => { context = id; showMode(); });
     p.append(b);
   });
 }

 function showMode() {
   if (!party || sessionStarted) return;
   const p = panel('Velg modus', 'TO VEIER');
   p.append(node('p', 'Kartlegg bygger profil. Varm opp tar dere fra nøytral til superhot.'));
   const kart = node('button', 'Kartlegg (A–Å)', 'primary');
   const varm = node('button', 'Varm opp');
   bindPanelAction(kart, () => { mode = 'kartlegg'; stepsPerSegment = [8,8,8]; showSetup(); });
   bindPanelAction(varm, () => { mode = 'oppvarming'; stepsPerSegment = [7,7,7]; showSetup(); });
   p.append(kart, varm);
 }

 function showSetup() {
   const p = panel('Deres felles karakter', 'SEGMENT ' + segment);
   p.append(node('p', 'Kalibrer deres felles ferdigheter. Dere har ' + points + ' poeng.'));
   skills.forEach(s => {
     const row = node('div');
     row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin:8px 0;';
     row.append(node('span', s.name));
     const val = node('span', allocated[s.id] || 0);
     const minus = node('button', '−');
     const plus = node('button', '+');
     bindPanelAction(minus, () => { if ((allocated[s.id]||0) > 0) { allocated[s.id]--; points++; val.textContent = allocated[s.id]; pts.textContent = 'Poeng igjen: ' + points; }});
     bindPanelAction(plus, () => { if (points > 0) { allocated[s.id]=(allocated[s.id]||0)+1; points--; val.textContent = allocated[s.id]; pts.textContent = 'Poeng igjen: ' + points; }});
     row.append(minus, val, plus);
     p.append(row);
   });
   const pts = node('p', 'Poeng igjen: ' + points);
   p.append(pts);
   const go = node('button', segment===1 ? 'Start' : 'Fortsett', 'primary');
   bindPanelAction(go, () => { if (!answering) showQuestion(); });
   p.append(go);
   if (!sessionStarted) {
     const change = node('button', 'Endre gruppe', 'text-button');
     bindPanelAction(change, showParty);
     p.append(change);
   }
 }

 function showQuestion() {
   if (!party) { showParty(); return; }
   sessionStarted = true;
   if (!indexedBank || !indexedBank.length) { showUnavailable('Kunne ikke laste en gyldig kortbank. Start på nytt eller gå tilbake til hovedmenyen.'); return; }
   if (stepInSegment >= stepsPerSegment[segment-1]) {
     if (segment < 3) { showSegmentEnd(); return; }
     else { showFinal(); return; }
   }
   const progress = (segment-1 + stepInSegment / stepsPerSegment[segment-1]) / 3;
   let exp = mode === 'kartlegg' ? 0.85 : 1.25;
   currentRang = 1 + Math.pow(progress, exp) * (mode === 'kartlegg' ? 2.5 : 4);
   if (context === 'bil') currentRang = Math.min(currentRang, 2.5);
   if (context === 'fest') currentRang = Math.min(currentRang, 3.5);

   const position = segment + ':' + stepInSegment;
   if (!currentQuestion || currentPosition !== position) {
     currentQuestion = pickQuestion();
     currentPosition = currentQuestion ? position : null;
   }
   const q = currentQuestion;
   if (!q) { showUnavailable('Det er ingen nye spørsmål som passer rammene nå. Økten er avsluttet uten å gjenta tidligere tekst eller varianter.'); return; }
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
   bindPanelAction(calib, () => { if (!answering) showSetup(); });
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

 function showUnavailable(message) {
   currentQuestion = null;
   currentPosition = null;
   const p = panel('Ingen nye spørsmål tilgjengelig');
   p.append(node('p', message));
   const again = node('button', 'Ny seanse', 'primary');
   again.onclick = () => location.reload();
   p.append(again);
 }

 function pickQuestion() {
   if (!indexedBank) return null;
   const maxR = context==='bil'?2.5:context==='fest'?3.5:5;
   // Every fallback keeps the complete session and history constraints.
   const fresh = indexedBank.filter(x => x.card.rang <= maxR && !recent.includes(x.card.id) && !recentCats.includes(x.card.cat) && !seenText.has(x.textKey) && !seenFamilies.has(x.familyKey));
   const allowed = fresh.filter(x => Math.abs(x.card.rang - currentRang) <= 1.3);
   const pool = allowed.length ? allowed : fresh;
   if (!pool.length) return null;
   const categories = new Map();
   pool.forEach(x => {
     if (!categories.has(x.card.cat)) categories.set(x.card.cat, []);
     categories.get(x.card.cat).push(x);
   });
   const weighted = Array.from(categories, ([cat, entries]) => {
     let s = (scores[cat] || 0) * 4.5;
     skills.forEach(sk => { if (sk.cat.includes(cat)) s += (allocated[sk.id]||0)*2; });
     return {entries, s};
   }).sort((a,b)=>b.s - a.s);
   // Equal category scores have equal chances regardless of row count/order.
   const top = weighted.filter(x => x.s === weighted[0].s);
   const category = top[Math.floor(Math.random()*top.length)];
   const entry = category.entries[Math.floor(Math.random()*category.entries.length)];
   const chosen = entry.card;
   seenText.add(entry.textKey);
   seenFamilies.add(entry.familyKey);
   recent.push(chosen.id);
   recentCats.push(chosen.cat);
   if (recent.length > 16) recent.shift();
   if (recentCats.length > 4) recentCats.shift();
   return chosen;
 }

function answer(q, key) {
   if (answering || !currentQuestion || q !== currentQuestion || currentPosition !== segment + ':' + stepInSegment || !['ja','kanskje','nei'].includes(key)) return;
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
   currentQuestion = null;
   currentPosition = null;
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

 showParty();
})();
// P3-03: Banken er allerede delt (5000 av 100k). Full lazy-load kan komme senere.
