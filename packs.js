(function(){
 'use strict';const U=DypereUI,{$,node}=U,S=DypereCardStore,E=DypereGames;let shown=24;
 function render(){
  const all=S.all(true),disabled=S.prefs().disabledPacks;$('packList').replaceChildren();
  for(const pack of [...new Set(all.map(c=>c.pack))]){const cards=all.filter(c=>c.pack===pack),box=node('article',undefined,'studio-panel'),title=node('h2',pack),meta=node('p',cards.length+' kort · '+cards.filter(c=>c.favorite).length+' '+(cards.filter(c=>c.favorite).length===1?'favoritt':'favoritter'),'fine'),button=node('button',disabled.includes(pack)?'Aktiver pakken':'Pakken er aktiv');button.setAttribute('aria-pressed',String(!disabled.includes(pack)));button.onclick=()=>{try{S.packEnabled(pack,disabled.includes(pack));render();}catch(e){U.status(e.message);}};box.append(title,meta,button);$('packList').append(box);}
  $('favoriteList').replaceChildren();const favorites=all.filter(c=>c.favorite);if(!favorites.length)$('favoriteList').append(node('p','Ingen favoritter ennå. Merk kort her eller i Kortverkstedet.','fine'));
  const list=all.filter(c=>c.kind!=='photo'&&(!$('onlyFavorites').checked||c.favorite)&&(c.text+' '+c.pack).toLocaleLowerCase().includes($('packSearch').value.toLocaleLowerCase()));
  $('favoriteList').append(node('p',list.length+' kort funnet · viser '+Math.min(shown,list.length),'fine'));
  list.slice(0,shown).forEach(c=>{const item=node('article'),meta=node('p',c.pack+' · '+E.labels[c.kind]+' · kapittel '+c.level,'eyebrow'),text=node('p',c.text),button=node('button',c.favorite?'★ Fjern favoritt':'☆ Favoritt');button.setAttribute('aria-pressed',String(c.favorite));button.onclick=()=>{try{S.toggleFavorite(c.id);render();}catch(e){U.status(e.message);}};item.append(meta,text,button);$('favoriteList').append(item);});
  if(shown<list.length){const more=node('button','Vis flere kort');more.onclick=()=>{shown+=24;render();};$('favoriteList').append(more);}
 }
 $('packSearch').oninput=()=>{shown=24;render();};$('onlyFavorites').onchange=()=>{shown=24;render();};render();
})();
