(function(){
 'use strict';const key='DYPERE_CARDS_V1',prefsKey='DYPERE_PLAY_PREFS_V2';let warning='';
 function read(){warning='';try{const raw=localStorage.getItem(key);return raw?DypereGames.validateCards(JSON.parse(raw)):[];}catch(e){warning='Kortbanken kunne ikke leses. Last ned en råkopi før du gjenoppretter fra en kortfil.';return [];}}
 function write(cards,recover=false){const clean=DypereGames.validateCards({version:2,cards});read();if(warning&&!recover)throw Error(warning);try{localStorage.setItem(key,JSON.stringify({version:2,cards:clean}));warning='';}catch(e){throw Error('Kortene kunne ikke lagres. Last ned en kopi og kontroller nettleserens lagring.');}}
 function prefs(){try{const p=JSON.parse(localStorage.getItem(prefsKey)||'{}');return {favorites:Array.isArray(p.favorites)?p.favorites.filter(x=>typeof x==='string'):[],disabledPacks:Array.isArray(p.disabledPacks)?p.disabledPacks.filter(x=>typeof x==='string'):[]};}catch(e){return {favorites:[],disabledPacks:[]};}}
 function savePrefs(p){try{localStorage.setItem(prefsKey,JSON.stringify(p));}catch(e){throw Error('Innstillingene kunne ikke lagres.');}}
 function all(includeDisabled=false){const own=read(),ids=new Set(own.map(c=>c.id)),p=prefs();return [...(window.DyperePlayCards||[]).filter(c=>!ids.has(c.id)),...own].map(c=>({...c,pack:c.pack||'Original',level:c.level||1,enabled:c.enabled!==false,favorite:p.favorites.includes(c.id)})).filter(c=>includeDisabled||(c.enabled&&!p.disabledPacks.includes(c.pack)));}
 function toggleFavorite(id){const p=prefs();p.favorites=p.favorites.includes(id)?p.favorites.filter(x=>x!==id):[...p.favorites,id];savePrefs(p);}
 function packEnabled(pack,enabled){const p=prefs();p.disabledPacks=enabled?p.disabledPacks.filter(x=>x!==pack):[...new Set([...p.disabledPacks,pack])];savePrefs(p);}
 function filtered({kinds,role,audience,level=3,packs,favorites=false}={}){return all().filter(c=>(!kinds||kinds.includes(c.kind))&&(!role||['Alle',role].includes(c.role))&&(!audience||[audience,'both'].includes(c.audience))&&c.level<=level&&(!packs||packs.includes(c.pack))&&(!favorites||c.favorite));}
 window.DypereCardStore={key,read,write,all,prefs,toggleFavorite,packEnabled,filtered,warning:()=>warning,raw:()=>localStorage.getItem(key)||'{"version":2,"cards":[]}'};
})();
