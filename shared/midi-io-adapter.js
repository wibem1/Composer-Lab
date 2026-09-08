(()=>{
'use strict';
if(window.CompositionLabMIDI?.VERSION)return;

const VERSION='midi-io-bridge-1.0';
function requireFunction(name,fn){if(typeof fn!=='function')throw new Error(name+' ist im aktuellen WebApp-Stand nicht verfügbar.');return fn}

window.CompositionLabMIDI={
  VERSION,
  SOURCE:'legacy-root-adapter',
  parse(buffer){return requireFunction('parseUploadedMidi',typeof parseUploadedMidi!=='undefined'?parseUploadedMidi:null)(buffer)},
  build(score){return requireFunction('buildMidi',typeof buildMidi!=='undefined'?buildMidi:null)(score)},
  canParse(){return typeof parseUploadedMidi==='function'},
  canBuild(){return typeof buildMidi==='function'}
};

const tech=document.getElementById('technicalSection')?.querySelector('.foldcontent');
if(tech&&!document.getElementById('midiIoBridgeBadge')){
  const d=document.createElement('div');d.id='midiIoBridgeBadge';d.className='uploadinfo';
  d.textContent='MIDI I/O: '+VERSION+' · stabile Schnittstelle, Implementierung noch aus Root-Altbestand';
  tech.appendChild(d);
}
})();
