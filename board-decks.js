(function(root){
 'use strict';
 const types=['talk','guess','challenge','joker'];
 function defaults(){return {preset:'all',packs:[],types:types.slice(),favorites:false,choices:3};}
 const E=typeof module!=='undefined'&&module.exports?require('./game-engine.js'):root.DypereGames;
 const valid=E.validBoardSettings;
 function tileKind(position,config){const raw=position===0?'talk':position===23?'wish':['talk','guess','challenge','joker'][position%4];return raw==='wish'||config.types.includes(raw)?raw:config.types[position%config.types.length];}
 function eligible(cards,c,role,level){if(!valid(c))return [];return cards.filter(a=>a.enabled!==false&&['pair','both'].includes(a.audience)&&['Alle',role].includes(a.role)&&a.level<=level&&(c.preset==='all'||c.packs.includes(a.pack))&&(!c.favorites||a.favorite)&&[...c.types,'wish'].includes(a.kind));}
 function pool(cards,c,role,position){const all=eligible(cards,c,role,Math.min(3,1+Math.floor(position/8))),kind=tileKind(position,c),specific=all.filter(a=>a.kind===kind);return specific.length?specific:all.filter(a=>c.types.includes(a.kind));}
 function draw(cards,c,role,position,seen,random=Math.random){const available=pool(cards,c,role,position),ids=new Set(available.map(a=>a.id)),exhausted=available.length>0&&available.every(a=>seen.includes(a.id));return {options: E.choices(available,seen,random,c.choices),seen:exhausted?seen.filter(id=>!ids.has(id)):seen,deckSeen:exhausted?[]:seen.filter(id=>ids.has(id))};}
 function coverage(cards,c){return ['Mester','Baby'].every(role=>eligible(cards,c,role,1).some(a=>c.types.includes(a.kind)));}
 function draft(preset,packs,chosen,favorites,choices){const c={preset,packs:packs.slice(),types:chosen.slice(),favorites:!!favorites,choices:Number(choices)};if(!valid(c))throw Error('Velg minst én korttype og én pakke.');return c;}
 const api={types,defaults,valid,tileKind,eligible,pool,draw,coverage,draft};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DypereBoardDecks=api;
})(globalThis);
