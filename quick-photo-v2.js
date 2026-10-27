(function(){
 'use strict';const U=DypereUI,S=DypereCardStore,E=DypereGames,seen={Baby:[],Mester:[]},out=document.getElementById('quickPhotoText');
 document.querySelectorAll('[data-quick-photo]').forEach(b=>b.onclick=()=>{const role=b.dataset.quickPhoto,cards=S.filtered({kinds:['photo'],role,audience:'pair'}).filter(c=>c.id.startsWith('own-')||!c.id.startsWith('base-')).filter(c=>c.level===3),p=E.pick(cards,seen[role]);out.hidden=false;out.replaceChildren();
  if(!p){out.append(U.node('span',role+' · Ingen aktive bildekort på nivå 3 ennå. '));const a=U.node('a','Lag et bildekort →','text-link');a.href='./kortverksted.html?kind=photo';out.append(a);return;}
  seen[role]=p.seen;out.append(U.node('p',role+' · '+p.card.text));const fav=U.node('button',S.prefs().favorites.includes(p.card.id)?'★ Favoritt':'☆ Favoritt','text-button');fav.onclick=()=>{try{S.toggleFavorite(p.card.id);fav.textContent=S.prefs().favorites.includes(p.card.id)?'★ Favoritt':'☆ Favoritt';}catch(e){out.append(U.node('p',e.message));}};out.append(fav);
 });
})();
