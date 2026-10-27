(function(){
 'use strict';const U=DypereUI,{$,node}=U,E=DypereGames,S=DypereCardStore;let cards=[],answers=[[],[]],player=0,index=0,phase='setup';
 const requested=Number(new URLSearchParams(location.search).get('minutes'));if(Number.isFinite(requested)&&requested>0&&requested<=30)$('matchCount').value=String(requested<=5?3:requested<=15?6:12);
 function screen(id){['matchSetup','matchHandoff','matchVote','matchResult'].forEach(x=>$(x).hidden=x!==id);}
 function reset(){cards=[];answers=[[],[]];player=0;index=0;phase='setup';screen('matchSetup');$('matchResults').replaceChildren();$('matchText').textContent='';$('matchStatus').textContent='';}
 function voteScreen(){phase='vote';screen('matchVote');$('matchWho').textContent=(player?'Baby':'Mester')+' · '+(index+1)+'/'+cards.length;$('matchText').textContent=cards[index].text;}
 $('matchStart').onclick=()=>{
  let pool=S.filtered({kinds:['wish'],audience:'pair'});if($('matchOwnOnly').checked)pool=pool.filter(c=>!c.id.startsWith('base-'));
  if(!pool.length){$('matchStatus').textContent='Ingen aktive ønskekort. Legg til ønskelistekort eller aktiver en pakke.';return;}
  cards=[];let seen=[];const length=Math.min(Number($('matchCount').value),pool.length);for(let i=0;i<length;i++){const p=E.pick(pool,seen);seen=p.seen;cards.push(p.card);}answers=[[],[]];player=0;index=0;voteScreen();
 };
 document.querySelectorAll('[data-match-vote]').forEach(button=>button.onclick=()=>{
  if(phase!=='vote')return;answers[player].push(button.dataset.matchVote);index++;
  if(index<cards.length){voteScreen();return;}
  if(player===0){phase='handoff';$('matchText').textContent='';screen('matchHandoff');return;}
  phase='result';const common=E.mutual(cards,answers[0],answers[1]);screen('matchResult');$('matchResults').replaceChildren();
  if(!common.length)$('matchResults').append(node('p','Ingen felles ja denne gangen. De andre svarene vises ikke. Dere kan lage nye kort eller starte en ny runde.'));
  for(const card of common){const box=node('article',undefined,'studio-panel'),text=node('p',card.text),favorite=node('button',S.prefs().favorites.includes(card.id)?'★ Lagret som favoritt':'☆ Lagre som favoritt');favorite.onclick=()=>{try{S.toggleFavorite(card.id);favorite.textContent=S.prefs().favorites.includes(card.id)?'★ Lagret som favoritt':'☆ Lagre som favoritt';}catch(e){$('matchResultStatus').textContent=e.message;}};box.append(text,favorite);$('matchResults').append(box);}
  $('matchResultStatus').textContent=common.length+' felles ja. Bare disse valgene vises.';answers=[[],[]];
 });
 $('matchHandoffReady').onclick=()=>{player=1;index=0;voteScreen();};
 $('matchReset').onclick=async()=>{if(await U.confirmAction('Avslutte og fjerne valgene i denne runden?','Avslutt runden'))reset();};$('matchAgain').onclick=reset;
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='vote'&&!$('matchPrivacy').open)$('matchPrivacy').showModal();});$('matchPrivacy').addEventListener('cancel',e=>e.preventDefault());$('matchPrivacyReady').onclick=()=>$('matchPrivacy').close();
})();
