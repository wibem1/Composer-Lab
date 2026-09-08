(()=>{
'use strict';
if(window.__compositionLabWebShell)return;
window.__compositionLabWebShell=true;

const $=id=>document.getElementById(id);
const MODEL_OPTIONS={
  gemini:[["gemini-3.7-flash","Gemini 3.7 Flash"]],
  anthropic:[["claude-sonnet-5","Claude Sonnet 5"]],
  openai:[["gpt-5.6-sol","GPT-5.6 Sol"],["gpt-5.6-terra","GPT-5.6 Terra"],["gpt-5.6-luna","GPT-5.6 Luna"]]
};
const FORM_KEY='composition_lab_clean_form_v1';
const KEYS_KEY='composition_lab_api_keys_v1';
const FOLD_KEY='composition_lab_fold_states_v2';

window.lastScore=null;
window.uploadedScore=null;
window.uploadedName='';
window.lastMidiBytes=null;
window.mainPlayerScore=null;
window.lastProvider='';
window.lastModel='';
window.lastConcept='';
window.playerAudioCtx=null;
window.playerMasterGain=null;
window.playerInstrumentCache=new Map();
window.playerPlaying=false;
window.playerPaused=false;
window.playerLoopEnabled=false;

const GM_NAMES=[
'acoustic_grand_piano','bright_acoustic_piano','electric_grand_piano','honkytonk_piano','electric_piano_1','electric_piano_2','harpsichord','clavinet',
'celesta','glockenspiel','music_box','vibraphone','marimba','xylophone','tubular_bells','dulcimer','drawbar_organ','percussive_organ','rock_organ','church_organ','reed_organ','accordion','harmonica','tango_accordion',
'acoustic_guitar_nylon','acoustic_guitar_steel','electric_guitar_jazz','electric_guitar_clean','electric_guitar_muted','overdriven_guitar','distortion_guitar','guitar_harmonics',
'acoustic_bass','electric_bass_finger','electric_bass_pick','fretless_bass','slap_bass_1','slap_bass_2','synth_bass_1','synth_bass_2','violin','viola','cello','contrabass','tremolo_strings','pizzicato_strings','orchestral_harp','timpani',
'string_ensemble_1','string_ensemble_2','synth_strings_1','synth_strings_2','choir_aahs','voice_oohs','synth_choir','orchestra_hit','trumpet','trombone','tuba','muted_trumpet','french_horn','brass_section','synth_brass_1','synth_brass_2',
'soprano_sax','alto_sax','tenor_sax','baritone_sax','oboe','english_horn','bassoon','clarinet','piccolo','flute','recorder','pan_flute','blown_bottle','shakuhachi','whistle','ocarina','lead_1_square','lead_2_sawtooth','lead_3_calliope','lead_4_chiff','lead_5_charang','lead_6_voice','lead_7_fifths','lead_8_bass__lead',
'pad_1_new_age','pad_2_warm','pad_3_polysynth','pad_4_choir','pad_5_bowed','pad_6_metallic','pad_7_halo','pad_8_sweep','fx_1_rain','fx_2_soundtrack','fx_3_crystal','fx_4_atmosphere','fx_5_brightness','fx_6_goblins','fx_7_echoes','fx_8_sci_fi',
'sitar','banjo','shamisen','koto','kalimba','bagpipe','fiddle','shanai','tinkle_bell','agogo','steel_drums','woodblock','taiko_drum','melodic_tom','synth_drum','reverse_cymbal','guitar_fret_noise','breath_noise','seashore','bird_tweet','telephone_ring','helicopter','applause','gunshot'
];

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function status(msg,kind='ok'){const e=$('status');if(e)e.innerHTML=`<span class="${kind}">${esc(msg)}</span>`}
function clone(x){return JSON.parse(JSON.stringify(x))}

function loadKeys(){try{return JSON.parse(localStorage.getItem(KEYS_KEY)||'{}')}catch(_){return{}}}
function saveKey(){const provider=$('provider')?.value;if(!provider)return;const keys=loadKeys();keys[provider]=$('apiKey')?.value||'';localStorage.setItem(KEYS_KEY,JSON.stringify(keys))}
function restoreKey(){const keys=loadKeys();if($('apiKey'))$('apiKey').value=keys[$('provider')?.value]||''}
function fillModels(){const p=$('provider')?.value||'gemini',sel=$('model');if(!sel)return;const current=sel.value;sel.innerHTML='';for(const [value,label] of MODEL_OPTIONS[p]||[]){const o=document.createElement('option');o.value=value;o.textContent=label;sel.appendChild(o)}if([...sel.options].some(o=>o.value===current))sel.value=current}

function saveCurrentState(){
  const ids=['provider','model','reasoningEffort','measures','meter','tempo','musicalKey','ensemble','prompt','templateLength','labTempo','labEnsemble','labStyle','labIdea'];
  const form={};for(const id of ids){const e=$(id);if(e&&'value'in e)form[id]=e.value}
  localStorage.setItem(FORM_KEY,JSON.stringify(form));saveKey();
}
window.saveCurrentState=saveCurrentState;
function restoreForm(){
  let form={};try{form=JSON.parse(localStorage.getItem(FORM_KEY)||'{}')}catch(_){}
  if(form.provider&&$('provider'))$('provider').value=form.provider;fillModels();
  for(const [id,value] of Object.entries(form)){const e=$(id);if(e&&id!=='provider'&&id!=='model')e.value=value}
  if(form.model&&$('model')&&[...$('model').options].some(o=>o.value===form.model))$('model').value=form.model;
  restoreKey();
}

function ensurePlayerAudio(){
  if(!window.playerAudioCtx){window.playerAudioCtx=new (window.AudioContext||window.webkitAudioContext)();window.playerMasterGain=playerAudioCtx.createGain();playerMasterGain.gain.value=.75;playerMasterGain.connect(playerAudioCtx.destination)}
  return window.playerAudioCtx;
}
window.ensurePlayerAudio=ensurePlayerAudio;
async function loadGMInstrument(program,channel=0){
  const ac=ensurePlayerAudio();const key=channel===9?'percussion':String(Math.max(0,Math.min(127,Number(program)||0)));
  if(playerInstrumentCache.has(key))return playerInstrumentCache.get(key);
  if(!window.Soundfont?.instrument)throw new Error('GM-Soundfont-Bibliothek ist nicht geladen.');
  const name=channel===9?'synth_drum':GM_NAMES[Math.max(0,Math.min(127,Number(program)||0))]||'acoustic_grand_piano';
  const promise=window.Soundfont.instrument(ac,name,{soundfont:'MusyngKite',destination:playerMasterGain});
  playerInstrumentCache.set(key,promise);return promise;
}
window.loadGMInstrument=loadGMInstrument;

function buildMidi(score){const core=window.CompositionLabMIDICore;if(!core)throw new Error('MIDI-Core ist noch nicht geladen.');return core.build(score)}
window.buildMidi=buildMidi;
function parseUploadedMidi(buffer){const core=window.CompositionLabMIDICore;if(!core)throw new Error('MIDI-Core ist noch nicht geladen.');return core.parse(buffer)}
window.parseUploadedMidi=parseUploadedMidi;
function scoreMaxBeat(score){let m=0;for(const tr of score?.tr||[])for(const n of tr.nt||[]){if(Array.isArray(n))m=Math.max(m,(Number(n[0])||0)+(Number(n[1])||0)*Math.max(.05,Number(n[5]??1)||1))}return m}
window.scoreMaxBeat=scoreMaxBeat;

function downloadBlob(data,name,type='application/octet-stream'){
  const blob=data instanceof Blob?data:new Blob([data],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500)
}
window.downloadBlob=downloadBlob;

function installGeneratedScore(score,message='Score geladen.'){
  window.lastScore=clone(score);window.mainPlayerScore=window.lastScore;window.lastMidiBytes=buildMidi(window.lastScore);
  if($('downloadBtn'))$('downloadBtn').disabled=false;if($('jsonBtn'))$('jsonBtn').disabled=false;
  if($('mainPlayerTitle'))$('mainPlayerTitle').textContent=`Komposition: ${score.ti||'Unbenannt'}`;
  if($('lastResult'))$('lastResult').innerHTML=`<strong>${esc(score.ti||'Komposition')}</strong><div class="meta">${esc(score.bpm||'')} BPM · ${esc(score.k||'')} · ${score.tr?.length||0} Spur(en)</div><div>${esc(score.sm||'')}</div>`;
  renderChatContext();status(message);
}
window.installGeneratedScore=installGeneratedScore;
window.validateScore=score=>!!(score&&Array.isArray(score.tr));
window.addHistory=()=>{};

async function handleUpload(file){
  if(!file)return;try{
    let score;if(/\.json$/i.test(file.name))score=JSON.parse(await file.text());else score=parseUploadedMidi(await file.arrayBuffer());
    if(!score||!Array.isArray(score.tr))throw new Error('Datei enthält keinen lesbaren Score.');
    window.uploadedScore=score;window.uploadedName=file.name;window.mainPlayerScore=score;
    if($('uploadInfo'))$('uploadInfo').textContent=`${file.name} · ${(score.tr||[]).reduce((n,t)=>n+(t.nt?.length||0),0)} Noten`;
    if($('analyzeImportedBtn'))$('analyzeImportedBtn').disabled=false;
    if($('mainPlayerTitle'))$('mainPlayerTitle').textContent=`Vorlage: ${score.ti||file.name}`;
    status('Vorlage geladen.');
  }catch(error){status('Import fehlgeschlagen: '+(error?.message||error),'err')}
}
function clearUpload(){window.uploadedScore=null;window.uploadedName='';if($('uploadInput'))$('uploadInput').value='';if($('uploadInfo'))$('uploadInfo').textContent='Keine Vorlage geladen.';if($('analyzeImportedBtn'))$('analyzeImportedBtn').disabled=true;if(lastScore)mainPlayerScore=lastScore;status('Vorlage entfernt.')}

async function callLLMLegacy(provider,model,apiKey,systemPrompt,userPrompt,wantJson=false){
  const engine=window.CompositionLabEngine;if(!engine)throw new Error('Kompositionsengine ist noch nicht geladen.');
  return engine.callLLM({provider,model,apiKey,reasoning:$('reasoningEffort')?.value||'medium',systemPrompt,userPrompt,wantJson});
}
window.callLLM=callLLMLegacy;

function renderChatContext(){if($('chatContext'))$('chatContext').innerHTML=lastScore?`Aktives Stück: <strong>${esc(lastScore.ti||'Unbenannt')}</strong>`:'Keine Komposition aktiv.'}
window.renderChatContext=renderChatContext;
let chatHistory=[];
function addChat(role,text){const log=$('chatLog');if(!log)return;const d=document.createElement('div');d.className='chatmsg '+(role==='user'?'chatuser':'chatai');d.textContent=(role==='user'?'Du: ':'KI: ')+text;log.appendChild(d);log.scrollTop=log.scrollHeight}
function modificationRequest(text){return /(mach|mache|ändere|veränder|verlänger|verkürz|bearbeit|variier|komponier|füge|ersetze|orchestrier|arrangier)/i.test(text)}
async function sendChat(){
  const input=$('chatInput'),msg=String(input?.value||'').trim();if(!msg||!lastScore)return;
  const provider=$('provider').value,model=$('model').value,apiKey=$('apiKey').value.trim(),reasoning=$('reasoningEffort').value;
  addChat('user',msg);chatHistory.push({role:'user',text:msg});input.value='';const btn=$('chatSendBtn');btn.disabled=true;
  try{
    if(modificationRequest(msg)){
      const result=await CompositionLabEngine.compose({provider,model,apiKey,reasoning,settings:{ensemble:$('ensemble').value||'frei',measures:Number($('measures').value)||32,meter:$('meter').value||'4/4',bpm:Number($('tempo').value)||96,key:$('musicalKey').value||'frei',task:msg},source:lastScore,sourceName:lastScore.ti||'Aktuelles Stück',onConcept:({concept})=>addChat('assistant',concept)});
      if(result.score){installGeneratedScore(result.score,'Änderung als neue Komposition übernommen.');addChat('assistant',result.score.sm||'Die überarbeitete Komposition ist geladen.');chatHistory.push({role:'assistant',text:result.score.sm||'Komposition überarbeitet.'})}
    }else{
      const result=await CompositionLabEngine.discuss({provider,model,apiKey,reasoning,source:lastScore,sourceName:lastScore.ti||'Aktuelles Stück',history:chatHistory.slice(0,-1),question:msg});
      addChat('assistant',result.text);chatHistory.push({role:'assistant',text:result.text});
    }
  }catch(error){addChat('assistant','Fehler: '+(error?.message||error))}finally{btn.disabled=false}
}

function installFoldPersistence(){
  let saved={};try{saved=JSON.parse(localStorage.getItem(FOLD_KEY)||'{}')}catch(_){}
  document.querySelectorAll('details[id]').forEach(d=>{if(Object.prototype.hasOwnProperty.call(saved,d.id))d.open=!!saved[d.id];d.addEventListener('toggle',()=>{const all={};document.querySelectorAll('details[id]').forEach(x=>all[x.id]=x.open);localStorage.setItem(FOLD_KEY,JSON.stringify(all))})})
}

function installUi(){
  restoreForm();
  $('provider')?.addEventListener('change',()=>{saveKey();fillModels();restoreKey();saveCurrentState()});
  $('model')?.addEventListener('change',saveCurrentState);$('apiKey')?.addEventListener('change',saveKey);
  ['reasoningEffort','measures','meter','tempo','musicalKey','ensemble','prompt'].forEach(id=>$(id)?.addEventListener('change',saveCurrentState));
  $('uploadInput')?.addEventListener('change',e=>handleUpload(e.target.files?.[0]));$('clearUploadBtn')?.addEventListener('click',clearUpload);
  $('downloadBtn')?.addEventListener('click',()=>{if(lastScore)downloadBlob(buildMidi(lastScore),`${lastScore.ti||'composition'}.mid`,'audio/midi')});
  $('jsonBtn')?.addEventListener('click',()=>{if(lastScore)downloadBlob(JSON.stringify(lastScore,null,2),`${lastScore.ti||'composition'}.json`,'application/json')});
  $('chatSendBtn')?.addEventListener('click',sendChat);$('chatInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();sendChat()}});
  installFoldPersistence();renderChatContext();
}

document.addEventListener('DOMContentLoaded',installUi,{once:true});
})();
