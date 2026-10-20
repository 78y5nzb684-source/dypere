/* DYPERE 3.0.2. Shared, content-preserving interface behaviours. */
(() => {
  'use strict';
  const body=document.body, app=document.querySelector('.app'), file=body.dataset.file;
  const one=(s,r=document)=>r.querySelector(s), all=(s,r=document)=>[...r.querySelectorAll(s)];
  const id=n=>document.getElementById(n);
  let observer,queued=false,opener=null;
  const readingState=new WeakMap();let optionState={key:'',page:0};
  function shown(e){return !!e&&e.getClientRects().length>0&&getComputedStyle(e).display!=='none'}
  function viewport(){
    // visualViewport follows Safari's expanding toolbars and the on-screen keyboard.
    const v=window.visualViewport;const h=v?.height||window.innerHeight;
    document.documentElement.style.setProperty('--viewport-height',Math.round(h)+'px');
    const style=getComputedStyle(app);const inner=h-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
    body.classList.toggle('compact-frame',inner<650);schedule();
  }
  function closeSheets(){all('dialog[open]').forEach(d=>d.close())}
  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-open]');
    if(open){const d=id(open.dataset.open);if(!d)return;opener=open;d.showModal();if(d.id==='commentSheet')id('comment').focus();return}
    if(e.target.closest('[data-close-sheet]'))closeSheets();
    if(e.target.closest('[data-archive]')){if(typeof show==='function')show('archive');closeSheets()}
    const setup=e.target.closest('[data-game-setup]');if(setup)id('playBack')?.click();
    const pass=e.target.closest('[data-dice-pass]');if(pass)id('roll')?.click();
    const live=e.target.closest('[data-live-role]');
    if(live){
      if(file==='bildeutfordring.html')one('.photo-role[data-role="'+live.dataset.liveRole+'"]')?.click();
      if(file==='terninger.html')id(live.dataset.liveRole==='Mester'?'actorMaster':'actorBaby')?.click();
    }
    if(e.target.closest('#draw,#drawPhoto,#roll,#onlyTruth,#onlyDare,#punish,#reroll,#skipPhoto')){
      const card=one('.play-screen.active .rococo-card');
      if(card){card.classList.remove('card-refresh');void card.offsetWidth;card.classList.add('card-refresh')}
    }
    schedule();
  });
  all('dialog').forEach(d=>d.addEventListener('close',()=>{opener?.focus();schedule()}));
  id('comment')?.addEventListener('input',schedule);
  function labels(){
    const stage=one('.play-screen.active');
    if(stage){
      id('appTitle').textContent=stage.id==='screen-punishment'?'Punishment':({'spill.html':'Truth or Dare','bildeutfordring.html':'Bilde','terninger.html':'Terninger'}[file]);
      // Keep the same header glyph and hit target even when legacy show() updates its text.
      const back=id('playBack');if(back&&!back.querySelector('svg'))back.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7M7 12h13"/></svg><span>Tilbake</span>';
    }
    if(file==='bildeutfordring.html'){
      const master=one('.photo-role[data-role="Mester"]').getAttribute('aria-pressed')==='true';
      all('[data-live-role]').forEach(b=>{const selected=b.dataset.liveRole===(master?'Mester':'Baby');b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
      const extra=one('#level option[value="Drøye"]');
      if(extra){extra.disabled=master;if(master&&id('level').value==='Drøye'){id('level').value='Alle';id('level').dispatchEvent(new Event('change',{bubbles:true}))}}
      // Do not expose an undefined helper when a valid level has no old description.
      if(id('levelInfo')?.textContent==='undefined')id('levelInfo').textContent='Valgt nivå gjelder ved neste trekk.';
    }
    if(file==='terninger.html'){
      id('modeInfo').textContent='Felles kortbank for begge roller.';
      const master=id('actorMaster').getAttribute('aria-pressed')==='true';all('[data-live-role]').forEach(b=>{const on=b.dataset.liveRole===(master?'Mester':'Baby');b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))});
    }
    const qstage=id('survey');if(qstage){
      const p=one('#prev,#back',qstage);if(p)p.textContent='← Forrige';
      all('.storage-status').forEach(s=>s.dataset.warning=String(/utilgjengelig|feil|kunne ikke/i.test(s.textContent)));
      const t=id('commentToggle');if(t)t.textContent=id('comment')?.value.trim()?'Kommentar · lagt til':'Kommentar';
    }
  }
  function choices(){
    const grid=one('#survey .answer-grid');if(!grid||!shown(grid))return;
    const buttons=all(':scope > button',grid), multi=buttons.some(b=>/^[☑☐]/.test(b.textContent));
    grid.dataset.multi=String(multi);
    buttons.forEach(b=>{
      b.hidden=false;b.classList.remove('answer-pass');
      const label=b.textContent.trim();if(!multi){const map={'JA':'Ja','ÅPEN FOR DET':'Åpen','NYSGJERRIG':'Nysgjerrig','NEI':'Nei','PASS':'Pass'};if(map[label])b.textContent=map[label];if(b.textContent.trim()==='Pass')b.classList.add('answer-pass')}
      const on=b.classList.contains('selected')||b.classList.contains('chosen');b.setAttribute('aria-pressed',String(on));
    });
    const pager=one('.choice-pager');if(!pager)return;
    if(!multi){pager.hidden=true;return}
    const text=one('.reading-region > *');const old=readingState.get(text);const key=text.firstElementChild?.classList.contains('reading-copy')?old?.full:text.textContent;
    if(key!==optionState.key)optionState={key,page:0};
    const size=(window.innerHeight<700?2:3), total=Math.ceil(buttons.length/size);optionState.page=Math.max(0,Math.min(total-1,optionState.page));
    buttons.forEach((b,i)=>b.hidden=Math.floor(i/size)!==optionState.page);
    pager.hidden=total<=1;pager.innerHTML='<button type="button" aria-label="Forrige svaralternativer">←</button><span>Flere valg · '+(optionState.page+1)+' / '+total+'</span><button type="button" aria-label="Neste svaralternativer">→</button>';
    const [prev,next]=all('button',pager);prev.disabled=optionState.page===0;next.disabled=optionState.page===total-1;
    prev.onclick=()=>{optionState.page--;schedule()};next.onclick=()=>{optionState.page++;schedule()};
  }
  function reading(){
    const region=one('#survey .reading-region');if(!region||!shown(region))return;
    const el=region.firstElementChild,pager=one('.text-pager');if(!el||!pager)return;
    let state=readingState.get(el);
    if(!el.firstElementChild?.classList.contains('reading-copy')){state={full:el.textContent,page:0,pages:[]};readingState.set(el,state)}
    if(!state)return;
    pager.hidden=true;el.innerHTML='';const copy=document.createElement('span');copy.className='reading-copy';copy.textContent=state.full;el.append(copy);
    const fits=()=>el.getBoundingClientRect().height<=region.clientHeight+1;
    if(fits()){state.pages=[state.full];state.page=0;return}
    // Text stays at the agreed font size. Exceptionally short viewports use explicit reading pages.
    pager.hidden=false;pager.innerHTML='<button type="button" aria-label="Forrige del av spørsmålet">←</button><span></span><button type="button" aria-label="Neste del av spørsmålet">→</button>';
    const words=state.full.split(/\s+/),pages=[];let offset=0;
    while(offset<words.length){
      let lo=1,hi=words.length-offset,best=1;
      while(lo<=hi){const n=(lo+hi)>>1;copy.textContent=words.slice(offset,offset+n).join(' ');if(fits()){best=n;lo=n+1}else hi=n-1}
      pages.push(words.slice(offset,offset+best).join(' '));offset+=best;
    }
    state.pages=pages;state.page=Math.min(state.page,pages.length-1);copy.textContent=pages[state.page];
    one('span',pager).textContent='Spørsmålstekst · '+(state.page+1)+' / '+pages.length;
    const [prev,next]=all('button',pager);prev.disabled=state.page===0;next.disabled=state.page===pages.length-1;
    prev.onclick=()=>{state.page--;schedule()};next.onclick=()=>{state.page++;schedule()};
  }
  // The same role switch behaviour in every questionnaire. Keep answer schemas unchanged.
  // Capture before legacy change listeners so an existing role is never overwritten with the other's answers.
  if(body.dataset.layout==='questions' && id('role'))id('role').addEventListener('change',()=>{
    const selected=id('role').value;if(!['Mester','Baby'].includes(selected))return;
    const first=file==='quiz.html';const chapter=file.startsWith('kapittel-');
    const previous=first?data:d;if(previous.role===selected)return;
    const surveyId=first?SURVEY_ID:ID;
    const key=first?'DYPERE_2026_01_v12_'+selected:chapter?'dypere_'+ID+'_'+selected:ID+'_'+selected;
    let next=null;
    try{const raw=localStorage.getItem(key);if(raw){const x=JSON.parse(raw);if(x.surveyId===surveyId&&x.version===VERSION&&x.role===selected&&x.answers&&typeof x.answers==='object'&&!Array.isArray(x.answers)){
      if(first)next=validate(x);
      else if(chapter)next=x;
      else if(x.order?.length===0&&Object.keys(x.answers).length===0)next=x;
      else next=validate(x);
    }}}catch(_){}
    if(!next)next={surveyId,version:VERSION,role:selected,name:'',date:new Date().toLocaleDateString('sv-SE'),answers:{},...(!first&&!chapter?{order:[]}: {})};
    if(first){data=next;current=0;id('participant').value=next.name||'';id('surveyDate').value=next.date||''}
    else{d=next;if(chapter)idx=0;else at=0;id('name').value=next.name||'';id('date').value=next.date||''}
    schedule();
  },true);
  let detailState={text:'',page:0};
  function detailPages(){
    const sheet=id('answerSheet');if(!sheet?.open)return;
    const el=id('answerDetailCopy'),region=el.parentElement,pager=id('answerDetailPager');
    pager.hidden=true;el.textContent=detailState.text;
    if(el.offsetHeight<=region.clientHeight){detailState.page=0;return}
    pager.hidden=false;pager.innerHTML='<button type="button" aria-label="Forrige del av svaret">←</button><span></span><button type="button" aria-label="Neste del av svaret">→</button>';
    const words=detailState.text.split(/\s+/),pages=[];let offset=0;
    while(offset<words.length){let lo=1,hi=words.length-offset,best=1;while(lo<=hi){let n=(lo+hi)>>1;el.textContent=words.slice(offset,offset+n).join(' ');if(el.offsetHeight<=region.clientHeight){best=n;lo=n+1}else hi=n-1}pages.push(words.slice(offset,offset+best).join(' '));offset+=best}
    detailState.page=Math.min(detailState.page,pages.length-1);el.textContent=pages[detailState.page];one('span',pager).textContent=(detailState.page+1)+' / '+pages.length;
    const [prev,next]=all('button',pager);prev.disabled=detailState.page===0;next.disabled=detailState.page===pages.length-1;prev.onclick=()=>{detailState.page--;schedule()};next.onclick=()=>{detailState.page++;schedule()};
  }
  let compareIndex=0,compareRows=[],compareSignature='';
  function renderComparison(){
    const results=id('compareResults'),stage=id('comparison');if(!results||!stage)return;
    const table=one('table',results);if(!table)return;
    const signature=results.innerHTML;if(signature!==compareSignature){compareSignature=signature;compareRows=all('tbody tr',table).map(tr=>all('td',tr).map(td=>td.textContent));compareIndex=0}
    if(!compareRows.length)return;
    stage.classList.add('has-results');let view=one('.comparison-view',stage);
    if(!view){view=document.createElement('div');view.className='comparison-view';stage.append(view)}
    const row=compareRows[compareIndex];view.replaceChildren();
    const progress=document.createElement('p');progress.className='fine';progress.textContent='Sammenligning '+(compareIndex+1)+' / '+compareRows.length;view.append(progress);
    const text=document.createElement('p');text.className='comparison-text';text.textContent=row[0];view.append(text);
    const vals=document.createElement('div');vals.className='comparison-values';['Mester','Baby'].forEach((r,i)=>{const box=document.createElement('div'),lab=document.createElement('span'),value=document.createElement('span');lab.className='fine';lab.textContent=r;const person=i===0?comparison.master:comparison.baby,question=QUESTIONS[compareIndex];value.textContent=question.type==='multi'?((pick(person,question).selections||[]).length+' valg'):answerText(person,question);const detail=document.createElement('button');detail.type='button';detail.textContent='Vis svar';detail.onclick=()=>{detailState={text:row[i+1],page:0};id('answerSheet-title').textContent=r+' · svar';opener=detail;id('answerSheet').showModal();schedule()};box.append(lab,value,detail);vals.append(box)});view.append(vals);
    const nav=document.createElement('div');nav.className='button-row';const prev=document.createElement('button'),next=document.createElement('button');prev.textContent='← Forrige';next.textContent='Neste →';next.className='primary';prev.disabled=compareIndex===0;next.disabled=compareIndex===compareRows.length-1;prev.onclick=()=>{compareIndex--;schedule()};next.onclick=()=>{compareIndex++;schedule()};nav.append(prev,next);view.append(nav);
    const leave=document.createElement('button');leave.textContent='Til filer og eksport';leave.onclick=()=>{stage.classList.remove('has-results');results.querySelector('table')?.remove();results.replaceChildren();view.remove()};view.append(leave);
  }
  function sync(){
    queued=false;observer?.disconnect();labels();choices();reading();renderComparison();detailPages();
    observer?.observe(app,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','hidden']});
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}
  observer=new MutationObserver(schedule);observer.observe(app,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','hidden']});
  window.addEventListener('resize',viewport);window.visualViewport?.addEventListener('resize',viewport);
  document.fonts?.ready.then(schedule);viewport();sync();
  // Registration is shared by all pages. Never erase local answers or reload an active form.
  if('serviceWorker' in navigator && /https?:/.test(location.protocol))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
})();
