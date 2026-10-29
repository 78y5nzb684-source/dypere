(function () {
  'use strict';
  const { $, node } = DypereUI;
  const view = $('journeyView');
  const skills = [['naerhet','Nærhet'],['lek','Lek'],['dybde','Dybde'],['kontroll','Kontroll'],['utforsking','Utforsking'],['intensitet','Intensitet']];
  let participantCount = 0, names = [], context = 'hjemme', session = null;
  let pending = null, calibrating = false, paused = false, selectedMatch = null;

  function panel(title, kicker) {
    view.replaceChildren();
    const p = node('section', undefined, 'journey-panel');
    if (kicker) p.append(node('p', kicker, 'eyebrow'));
    const h = node('h2', title); h.tabIndex = -1;
    p.append(h); view.append(p); h.focus?.();
    return p;
  }
  function button(label, action, cls = '') {
    const b = node('button', label, cls); b.type = 'button';
    b.onclick = event => { if(b.isConnected && !b.disabled)action(event); }; return b;
  }
  function actions(p) { const row = node('div', undefined, 'journey-actions'); p.append(row); return row; }
  function personName(id) {
    const i = Number(String(id).slice(1))-1, name = names[i] || 'Spiller '+(i+1);
    const repeated = names.filter(value => value.toLocaleLowerCase('nb') === name.toLocaleLowerCase('nb')).length > 1;
    return repeated ? name + ' · person ' + (i+1) : name;
  }
  function groupLabel(i) {
    return participantCount === 3 ? (i < 2 ? 'Paret' : 'Tredjepersonen') : (i < 2 ? 'Par A' : 'Par B');
  }
  function clearMemory() {
    session?.clear(); session = null; pending = null; selectedMatch = null;
    calibrating = false; paused = false; names = []; participantCount = 0;
  }
  function finish() {
    clearMemory();
    const p = panel('Stunden er avsluttet', 'TA VARE PÅ HVERANDRE');
    p.append(node('p', 'Ta en liten innsjekk sammen før dere går videre.'));
    const list = node('ul', undefined, 'journey-care');
    ['Hvordan kjennes det for hver av dere nå?',
      'Ønsker noen ro, nærhet, vann eller litt tid for seg selv?',
      'Hva vil dere ta med dere fra stunden?'].forEach(text => list.append(node('li', text)));
    p.append(list, node('p','Valgene fra denne økten er fjernet.','journey-note'));
    p.append(button('Start en ny stund', showParty, 'primary'));
  }
  function stopButton(p) { p.append(button('Avslutt stunden', finish, 'text-button journey-exit')); }
  function showParty() {
    clearMemory();
    const p = panel('Hvem er med?', 'VÅR STUND'); p.classList.add('journey-intro');
    p.append(node('p','Et par og en tredjeperson, eller to par. Én telefon går på rundgang, og hver av dere svarer for seg selv.'));
    const row = actions(p);
    row.append(button('Par + én · 3 personer', () => { participantCount=3; showNames(); }, 'journey-party'),
      button('To par · 4 personer', () => { participantCount=4; showNames(); }, 'journey-party'));
    p.append(node('p','Kun for voksne 18+. Alle skal ønske å være med.','journey-note'));
  }
  function showNames() {
    const p = panel('Gjør plass til alle', participantCount === 3 ? 'PAR + ÉN' : 'TO PAR');
    p.append(node('p','Bruk navn eller kallenavn, så blir det tydelig hvem som har telefonen.'));
    const fields = node('div',undefined,'journey-name-grid'), inputs = [];
    for (let i=0; i<participantCount; i++) {
      const field=node('div',undefined,'field'), input=node('input');
      input.id='journey-person-'+(i+1); input.type='text'; input.maxLength=24; input.autocomplete='off';
      input.value=names[i] || 'Spiller '+(i+1);
      const label=node('label',groupLabel(i)+' · person '+(i+1)); label.htmlFor=input.id;
      field.append(label,input); fields.append(field); inputs.push(input);
    }
    p.append(fields, node('p','Bare felles ja-valg vises til slutt. Enkeltsvar vises ikke i fellesresultatet. Valgene beholdes bare mens denne siden er åpen.','journey-note'));
    p.append(button('Alle er klare', () => {
      names=inputs.map((input,i)=>input.value.trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,24)||'Spiller '+(i+1));
      showContext();
    }, 'primary'));
    p.append(button('Tilbake til antall',showParty,'text-button'));
  }
  function showContext() {
    const p=panel('Hvor er dere?','KONTEKST'); p.append(node('p','Velg rammen for denne stunden.'));
    const row=actions(p);
    [['hjemme','Hjemme'],['seng','I sengen'],['bil','I bilen'],['fest','Nachspiel']].forEach(([id,label])=>{
      row.append(button(label,()=>{context=id;showMode();}));
    });
  }
  function showMode() {
    const p=panel('Hvordan vil dere starte?',participantCount+' PERSONER · EGNE SVAR');
    p.append(node('p','Alle får de samme kortene i korte bolker. Svar privat, og send telefonen videre når skjermen sier fra.'));
    p.append(node('p','Hver person får et kort eller en nær formulering høyst én gang i denne økten. En ny økt starter på nytt.','journey-note'));
    actions(p).append(button('Varm opp · 14 kort',()=>startSession('oppvarming'),'primary'),
      button('Kartlegg · 18 kort',()=>startSession('kartlegg')));
  }
  function startSession(mode) {
    try {
      const bank=DypereJourneyBank.buildIndex(window.DypereVarStundBank || []);
      session=DypereJourney.createSession({participantCount,context,mode},bank);
      pending=null; renderSession();
    } catch (_) {
      const p=panel('Kunne ikke starte stunden');
      p.append(node('p','Spørsmålsbanken kunne ikke åpnes. Last siden på nytt, eller prøv igjen.'));
      p.append(button('Tilbake til start',showParty,'primary'));
    }
  }
  function renderHandoff(snap) {
    pending=null; calibrating=false;
    const pid=snap.activeParticipantId, current=session;
    const p=panel('Gi telefonen til '+personName(pid),'BOLK '+snap.segment+' AV 3');
    p.classList.add('journey-handoff'); p.append(node('span','✦','journey-mark'));
    p.append(node('p',snap.phase==='profile-handoff'?'Ditt eget fokus, uten at de andre ser valgene.':'Nå er det dine svar. De andre ser bort mens du har telefonen.'));
    p.append(button('Jeg er '+personName(pid),()=>{
      if(session===current && current.beginTurn(pid).accepted)renderSession();
    },'primary'));
    p.append(node('p','Skjermen inneholder ingen tidligere svar.','journey-note'));
    stopButton(p);
  }
  function renderProfile(snap) {
    const pid=snap.activeParticipantId,current=session,own=current.getPrivateSnapshot(pid);
    if(!own)return;
    const midQuestion=snap.phase==='answering';
    const p=panel('Ditt fokus',personName(pid)+' · PRIVAT');
    p.append(node('p','Fordel poengene slik det passer deg akkurat nå.'));
    const rows=node('div',undefined,'journey-skill-list');
    skills.forEach(([id,label])=>{
      const row=node('div',undefined,'journey-skill'), controls=node('div',undefined,'journey-skill-controls');
      const change=delta=>{
        if(session!==current)return;
        const latest=current.getPrivateSnapshot(pid);if(!latest)return;
        const next={...latest.allocation,[id]:(latest.allocation[id]||0)+delta};
        if(current.setAllocation(pid,next).accepted)renderSession();
      };
      const minus=button('−',()=>change(-1));minus.setAttribute('aria-label','Mindre '+label);minus.disabled=!(own.allocation[id]>0);
      const plus=button('+',()=>change(1));plus.setAttribute('aria-label','Mer '+label);plus.disabled=own.pointsRemaining<=0;
      controls.append(minus,node('span',own.allocation[id]||0),plus);row.append(node('span',label),controls);rows.append(row);
    });
    p.append(rows,node('p','Poeng igjen: '+own.pointsRemaining,'journey-note'));
    p.append(button(midQuestion?'Tilbake til kortet':'Fokus er klart',()=>{
      if(session!==current)return;
      if(midQuestion)calibrating=false;
      else if(!current.confirmAllocation(pid).accepted)return;
      renderSession();
    },'primary'));
    stopButton(p);
  }
  function renderQuestion(snap) {
    const current=session,pid=snap.activeParticipantId,own=current.getPrivateSnapshot(pid),q=own?.question;
    if(!q)return;
    if(!current.markSeen(pid,q.id).accepted){
      const p=panel('Kortet kunne ikke åpnes');
      p.append(node('p','Avslutt stunden og start en ny økt.'));stopButton(p);return;
    }
    if(pending?.pid!==pid || pending?.qid!==q.id)pending=null;
    const p=panel('Ditt svar',personName(pid)+' · PRIVAT'),progress=node('div',undefined,'stund-progress');
    progress.append(node('span','Bolk '+snap.segment+' av 3'),node('span','Kort '+own.questionNumber+' av '+snap.totalQuestions));
    p.append(progress,node('p','Svar for deg selv, med denne gruppen i tankene.','journey-note'),node('div',q.text,'journey-card'));
    const choiceRow=node('div',undefined,'journey-answer-row');
    choiceRow.setAttribute('role','group');choiceRow.setAttribute('aria-label','Ditt private svar');
    const next=button('Neste kort',()=>{
      if(session!==current || !pending || pending.pid!==pid || pending.qid!==q.id)return;
      next.disabled=true;const choice=pending.choice;pending=null;
      if(current.answer(pid,q.id,choice).accepted)renderSession();
    },'primary');next.disabled=!pending;
    const answerNodes=[];
    [['Ja','ja'],['Kanskje','kanskje'],['Nei','nei']].forEach(([label,choice])=>{
      const b=button(label,()=>{
        if(session!==current || current.getPrivateSnapshot(pid)?.question?.id!==q.id)return;
        pending={pid,qid:q.id,choice};
        answerNodes.forEach(([other,value])=>other.setAttribute('aria-pressed',String(value===choice)));next.disabled=false;
      });
      b.setAttribute('aria-pressed',String(pending?.choice===choice));answerNodes.push([b,choice]);choiceRow.append(b);
    });
    p.append(choiceRow,next);
    p.append(button('Juster mitt fokus',()=>{calibrating=true;renderSession();},'text-button'));
    p.append(node('p','Dere ser bare felles ja-valg til slutt.','journey-note'));stopButton(p);
  }
  function renderResults(exhausted=false) {
    pending=null;calibrating=false;
    const current=session, matches=current.getMatches(),p=panel(matches.length?'Dette har dere felles':'Ingen felles ja denne gangen','DERES FELLES VALG');
    if(exhausted)p.append(node('p','Banken hadde ikke flere nye temaer. Dere får bare se felles valg fra ferdige bolker.','journey-note'));
    if(matches.length){
      p.append(node('p','Alle har svart ja til disse kortene. Velg sammen hva dere vil ta med videre.'));
      matches.forEach(q=>{
        const card=node('article',undefined,'journey-match');card.append(node('p',q.text));
        card.append(button('Velg dette kortet',()=>{
          if(session!==current || !['complete','exhausted'].includes(current.getSnapshot().phase) || !current.getMatches().some(match=>match.id===q.id))return;
          selectedMatch=q;renderPlan();
        }));p.append(card);
      });
    }else p.append(node('p','Dere kan la stunden ende med en prat eller litt omsorg. Det er også et godt sted å lande.'));
    p.append(node('p','Enkeltsvar og individuelle poeng vises ikke.','journey-note'));
    p.append(button('Avslutt med en innsjekk',finish,'primary'));
  }
  function renderPlan() {
    if(!session || !selectedMatch || !['complete','exhausted'].includes(session.getSnapshot().phase) || !session.getMatches().some(match=>match.id===selectedMatch.id))return;
    const p=panel('Ta ønsket videre sammen','ET FELLES UTGANGSPUNKT');
    p.append(node('div',selectedMatch.text,'journey-card'));
    const steps=node('ol',undefined,'journey-plan');
    ['Bli enige om en konkret variant som passer alle nå.',
      'Avtal hvem som ønsker å delta på hvilken måte, og hvordan dere sier pause.',
      'Ta en ny innsjekk med hverandre underveis.'].forEach(text=>steps.append(node('li',text)));
    p.append(steps);
    actions(p).append(button('Tilbake til fellesvalgene',()=>{selectedMatch=null;renderResults();}),
      button('Avslutt med en innsjekk',finish,'primary'));
  }
  function renderPause() {
    const p=panel('Et lite pusterom','SKJERMEN ER PAUSET');
    p.append(node('p','Gi telefonen tilbake til den som svarte før pausen. Ingen svar vises her.'));
    p.append(button('Fortsett privat',()=>{paused=false;renderSession();},'primary'));stopButton(p);
  }
  function renderSession() {
    if(!session)return showParty();
    if(paused)return renderPause();
    const snap=session.getSnapshot();
    switch(snap.phase){
      case 'profile-handoff':case 'answer-handoff':return renderHandoff(snap);
      case 'profile':return renderProfile(snap);
      case 'answering':return calibrating?renderProfile(snap):renderQuestion(snap);
      case 'ready':{
        const p=panel('Klare for neste bolk?','BOLK '+snap.segment+' AV 3'),current=session;
        p.append(node('p','Alle svarer på den samme bolken hver for seg. Kortene endres ikke mens telefonen går rundt.'));
        p.append(button('Start bolken',()=>{if(session===current && current.start().accepted)renderSession();},'primary'));stopButton(p);return;
      }
      case 'block-complete':{
        const p=panel('Alle har svart','BOLK '+snap.segment+' AV 3'),current=session;
        p.append(node('p','Hver av dere får fire nye fokuspoeng før neste bolk. Enkeltsvar holdes private.'));
        p.append(button('Neste bolk',()=>{if(session===current && current.nextBlock().accepted)renderSession();},'primary'));stopButton(p);return;
      }
      case 'complete':return selectedMatch?renderPlan():renderResults();
      case 'exhausted':return renderResults(true);
      default:return showParty();
    }
  }
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden || !session)return;
    const phase=session.getSnapshot().phase;
    if(phase==='profile' || phase==='answering'){paused=true;renderPause();}
  });
  window.addEventListener('pagehide',()=>{clearMemory();view.replaceChildren();});
  window.addEventListener('pageshow',event=>{if(event.persisted){clearMemory();showParty();}});
  showParty();
})();
