(()=>{
'use strict';
const INTERFACE_BUILD=27;
const FOLD_KEY='composition_lab_root_fold_states_v2';
const $=id=>document.getElementById(id);
function showTemplatePlayer(){const box=$('randomTemplateBox');if(box)box.style.display='flex'}
function setCurrentPackage(pkg){if(!pkg?.score)return;try{window.compositionLabSetCurrentTemplate?.({title:pkg.score.ti||'Vorlage',score:pkg.score,fileName:(pkg.score.ti||'Vorlage')+'.mid',meta:{...(pkg.settings||{}),idea:pkg.idea||pkg.score.sm||''}})}catch(_){}showTemplatePlayer()}
function removeOldIdeaGenerator(){const old=$('labIdeaGenerateBtn');if(old){const toolbar=old.closest('.toolbar');if(toolbar&&toolbar.children.length===1)toolbar.remove();else old.remove()}const info=$('labIdeaInfo');if(info)info.remove()}
function foldId(d,i){if(d.id)return d.id;const s=(d.querySelector(':scope > summary')?.textContent||'').trim().replace(/\s+/g,' ').slice(0,80);return s?'summary:'+s:'details:'+i}
function loadStates(){try{const s=JSON.parse(localStorage.getItem(FOLD_KEY)||'{}');return s&&typeof s==='object'?s:{}}catch(_){return{}}}
function saveState(key,value){try{const s=loadStates();s[key]=!!value;localStorage.setItem(FOLD_KEY,JSON.stringify(s))}catch(_){}}
function restoreStates(){const states=loadStates();document.querySelectorAll('details').forEach((d,i)=>{const key=foldId(d,i);if(Object.prototype.hasOwnProperty.call(states,key))d.open=!!states[key]})}
function bindFoldPersistence(){document.querySelectorAll('details').forEach((d,i)=>{const key=foldId(d,i);const summary=d.querySelector(':scope > summary');if(!summary||summary.dataset.foldPersistV27)return;summary.dataset.foldPersistV27='1';summary.addEventListener('click',()=>{const next=!d.open;saveState(key,next)},{capture:true})})}
function arrange(){
  const exp=$('experimentSection'),host=exp?.querySelector('.foldcontent');if(!host)return false;
  removeOldIdeaGenerator();
  const buttons=host.querySelector('.labbuttons'),ideaBox=$('sharedLabIdeaBox')||$('labIdeaWork')||$('labIdea')?.parentElement;
  const player=$('randomTemplateBox'),history=$('experimentHistorySection'),info=$('experimentInfo'),make=$('randomToTemplateBtn');let use=$('sharedUseTemplateBtn');
  if(buttons){buttons.id='sharedRandomButtonsRow';buttons.style.marginTop='10px';[$('inspirationBtn'),$('randomFreeBtn'),$('randomGuidedBtn')].forEach(b=>{if(b&&b.parentElement!==buttons)buttons.appendChild(b)});if(make&&make.parentElement===buttons)make.remove()}
  let actions=$('sharedTemplateActionsV24')||$('sharedTemplateActionsV25')||$('sharedTemplateActionsV26')||$('sharedTemplateActionsV27');if(!actions){actions=document.createElement('div');actions.className='toolbar';actions.style.marginTop='10px'}actions.id='sharedTemplateActionsV27';
  if(make){make.textContent='Erzeuge';make.classList.add('secondary');actions.appendChild(make)}if(use){use.textContent='Übernehmen';actions.appendChild(use)}
  const anchor=buttons||host.firstElementChild;if(buttons&&ideaBox){buttons.after(ideaBox);ideaBox.after(actions)}else if(ideaBox){ideaBox.after(actions)}else if(anchor){anchor.after(actions)}else host.appendChild(actions);
  if(player){actions.after(player);player.style.marginTop='10px';if(window.__sharedCurrentTemplate?.score)showTemplatePlayer()}if(info&&player)player.after(info);
  if(history){const s=history.querySelector('summary');if(s)s.textContent='Vorlagenverlauf';(info||player||actions).after(history)}
  if(make&&!make.dataset.playerV27){make.dataset.playerV27='1';make.addEventListener('click',()=>{const poll=setInterval(()=>{const p=window.__sharedCurrentTemplate;if(p?.score){clearInterval(poll);setCurrentPackage(p)}},120);setTimeout(()=>clearInterval(poll),20000)},true)}
  [$('randomFreeBtn'),$('randomGuidedBtn')].forEach(b=>{if(b&&!b.dataset.playerV27){b.dataset.playerV27='1';b.addEventListener('click',()=>setTimeout(()=>setCurrentPackage(window.__sharedCurrentTemplate),0),false)}});
  const hist=$('experimentHistoryList');if(hist&&!hist.dataset.playerV27){hist.dataset.playerV27='1';hist.addEventListener('click',()=>setTimeout(()=>setCurrentPackage(window.__sharedCurrentTemplate),80),false)}
  bindFoldPersistence();restoreStates();
  const tech=$('technicalSection')?.querySelector('.foldcontent');if(tech){let d=$('rootInterfaceBuildV24')||$('rootInterfaceBuildV25')||$('rootInterfaceBuildV26')||$('rootInterfaceBuildV27');if(!d){d=document.createElement('div');d.className='uploadinfo';d.style.marginTop='8px';tech.appendChild(d)}d.id='rootInterfaceBuildV27';d.textContent=`Interface Build Android/WebApp ${INTERFACE_BUILD}`;tech.querySelectorAll('.uploadinfo').forEach(e=>{if(/Interface Build Android\/WebApp \d+/.test(e.textContent||''))e.innerHTML=e.innerHTML.replace(/Interface Build Android\/WebApp \d+/g,`Interface Build Android/WebApp ${INTERFACE_BUILD}`)})}
  window.__compositionLabBuilds={...(window.__compositionLabBuilds||{}),interface:INTERFACE_BUILD,platform:'Android/WebApp'};return true
}
let n=0;const t=setInterval(()=>{try{if(arrange()){clearInterval(t);setTimeout(()=>{arrange();restoreStates()},500);setTimeout(()=>{arrange();restoreStates()},1600);setTimeout(restoreStates,3000)}}catch(_){}if(++n>300)clearInterval(t)},100);
window.addEventListener('compositionlab-experiment-ready',()=>setTimeout(()=>{arrange();restoreStates()},100));window.addEventListener('compositionlab-storage-restored',()=>setTimeout(()=>{arrange();restoreStates()},100));
})();
