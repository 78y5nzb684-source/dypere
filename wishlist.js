(function(){
 'use strict';const U=DypereUI,{$,node}=U,S=DypereCardStore;function render(){
  $('wishList').replaceChildren();const cards=S.all(true).filter(c=>c.kind==='wish');if(!cards.length)$('wishList').append(node('p','Ingen ønsker ennå. Lag ønskekort i Kortverkstedet.','fine'));
  cards.forEach(c=>{const box=node('article'),meta=node('p',c.pack,'eyebrow'),text=node('p',c.text),b=node('button',c.favorite?'★ På favorittlisten':'☆ Legg til favoritt');b.setAttribute('aria-pressed',String(c.favorite));b.onclick=()=>{try{S.toggleFavorite(c.id);render();}catch(e){U.status(e.message);}};box.append(meta,text,b);$('wishList').append(box);});
 }render();
})();
