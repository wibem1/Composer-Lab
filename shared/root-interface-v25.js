(()=>{
'use strict';
const INTERFACE_BUILD=25;
const $=id=>document.getElementById(id);
function showTemplatePlayer(){const box=$('randomTemplateBox');if(box)box.style.display='flex'}
function setCurrentPackage(pkg){if(!pkg?.score)return;try{window.compositionLabSetCurrentTemplate?.({title:pkg.score.ti||'Vorlage',score:pkg.score,fileName:(pkg.score.ti||'Vorlage')+'.mid',meta:{...(pkg.settings||{}),idea:pkg.idea||pkg.score.sm||''}})}catch(_){}showTemplatePlayer()}
function removeOldIdeaGenerator(){const old=$('labIdeaGenerateBtn');if(old){const toolbar=old.closest('.toolbar');if(toolbar&&toolbar.children.length===1)toolbar.remove();else old.remove()}const info=$('labIdeaInfo');if(info)info.remove()}
function arrange(){
  const exp=$('experimentSection'),host=exp?.querySelector('.foldcontent');if(!host)return false;
  removeOldIdeaGenerator();
  const buttons=host.querySelector('.labbuttons');
  const ideaBox=$('sharedLabIdeaBox')||$('labIdeaWork')||$('labIdea')?.parentElement;
  const player=$('randomTemplateBox'),history=$('experimentHistorySection'),info=$('experimentInfo'),make=$('randomToTemplateBtn');
  let use=$('sharedUseTemplateBtn');
  if(buttons){buttons.id='sharedRandomButtonsRow';buttons.style.marginTop='10px';[$('inspirationBtn'),$('randomFreeBtn'),$('randomGuidedBtn')].forEach(b=>{if(b&&b.parentElement!==buttons)buttons.appendChild(b)});if(make&&make.parentElement===buttons)make.remove()}
  let actions=$('sharedTemplateActionsV24')||$('sharedTemplateActionsV25');
  if(!actions){actions=document.createElement('div');actions.id='sharedTemplateActionsV25';actions.className='toolbar';actions.style.marginTop='10px'}else actions.id='sharedTemplateActionsV25';
  if(make){make.textContent='Erzeuge';make.classList.add('secondary');actions.appendChild(make)}
  if(use){use.textContent='Übernehmen';actions.appendChild(use)}
  const anchor=buttons||host.firstElementChild;
  if(buttons&&ideaBox){buttons.after(ideaBox);ideaBox.after(actions)}else if(ideaBox){ideaBox.after(actions)}else if(anchor){anchor.after(actions)}else host.appendChild(actions);
  if(player){actions.after(player);player.style.marginTop='10px';if(window.__sharedCurrentTemplate?.score)showTemplatePlayer()}
  if(info&&player)player.after(info);
  if(history){history.open=true;const s=history.querySelector('summary');if(s)s.textContent='Vorlagenverlauf';(info||player||actions).after(history)}
  if(make&&!make.dataset.playerV25){make.dataset.playerV25='1';make.addEventListener('click',()=>{const poll=setInterval(()=>{const p=window.__sharedCurrentTemplate;if(p?.score){clearInterval(poll);setCurrentPackage(p)}},120);setTimeout(()=>clearInterval(poll),20000)},true)}
  [$('randomFreeBtn'),$('randomGuidedBtn')].forEach(b=>{if(b&&!b.dataset.playerV25){b.dataset.playerV25='1';b.addEventListener('click',()=>setTimeout(()=>setCurrentPackage(window.__sharedCurrentTemplate),0),false)}});
  const hist=$('experimentHistoryList');if(hist&&!hist.dataset.playerV25){hist.dataset.playerV25='1';hist.addEventListener('click',()=>setTimeout(()=>setCurrentPackage(window.__sharedCurrentTemplate),80),false)}
  const tech=$('technicalSection')?.querySelector('.foldcontent');if(tech){let d=$('rootInterfaceBuildV24')||$('rootInterfaceBuildV25');if(!d){d=document.createElement('div');d.className='uploadinfo';d.style.marginTop='8px';tech.appendChild(d)}d.id='rootInterfaceBuildV25';d.textContent=`Interface Build Android/WebApp ${INTERFACE_BUILD}`;tech.querySelectorAll('.uploadinfo').forEach(e=>{if(/Interface Build Android\/WebApp \d+/.test(e.textContent||''))e.innerHTML=e.innerHTML.replace(/Interface Build Android\/WebApp \d+/g,`Interface Build Android/WebApp ${INTERFACE_BUILD}`)})}
  window.__compositionLabBuilds={...(window.__compositionLabBuilds||{}),interface:INTERFACE_BUILD,platform:'Android/WebApp'};return true
}
let n=0;const t=setInterval(()=>{try{if(arrange()){clearInterval(t);setTimeout(arrange,500);setTimeout(arrange,1500)}}catch(_){}if(++n>300)clearInterval(t)},100);
window.addEventListener('compositionlab-experiment-ready',()=>setTimeout(arrange,100));window.addEventListener('compositionlab-storage-restored',()=>setTimeout(arrange,100));
})();