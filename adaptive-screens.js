/* DYPERE v3.0 — scale only legacy stage content when necessary; never clip a required action. */
(()=>{if(!document.body.matches('[data-d-section]'))return;
const root=document.querySelector(':scope > main, :scope > .wrap');if(!root)return;
const sections=[...root.querySelectorAll(':scope > section')];
const container=()=>root;
function active(el){const style=getComputedStyle(el);return style.display!=='none'&&style.visibility!=='hidden'&&!el.hidden&&!el.classList.contains('hide')&&(el.classList.contains('active')||!el.classList.contains('page'));}
function fit(){sections.forEach(s=>{s.style.transform='';s.style.width='';s.style.marginLeft='';s.style.height='';});
 const shown=sections.filter(active);const available=root.clientHeight-parseFloat(getComputedStyle(root).paddingTop)-parseFloat(getComputedStyle(root).paddingBottom);
 const staticEls=[...root.children].filter(x=>!shown.includes(x)&&x.tagName!=='SCRIPT'&&getComputedStyle(x).display!=='none');
 const staticH=staticEls.reduce((t,e)=>t+e.getBoundingClientRect().height+parseFloat(getComputedStyle(e).marginTop||0)+parseFloat(getComputedStyle(e).marginBottom||0),0);
 const room=Math.max(120,available-staticH-12);
 shown.forEach(s=>{let natural=Math.max(s.scrollHeight,s.getBoundingClientRect().height);if(natural>room){const scale=Math.min(1,room/natural);s.style.transform=`scale(${scale})`;s.style.height=(natural*scale)+'px';s.style.width=(100/scale)+'%';s.style.marginLeft=(-(100/scale-100)/2)+'%';}});
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;fit()})}
new MutationObserver(schedule).observe(root,{subtree:true,attributes:true,attributeFilter:['class','hidden'],childList:true,characterData:true});window.addEventListener('resize',schedule);window.addEventListener('orientationchange',schedule);document.fonts?.ready.then(schedule);schedule();
})();