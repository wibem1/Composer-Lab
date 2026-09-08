(()=>{
'use strict';
if(window.CompositionLabMIDI?.VERSION)return;

const VERSION='midi-io-bridge-2.0';
const core=()=>window.CompositionLabMIDICore;
function legacyParse(buffer){if(typeof parseUploadedMidi!=='function')throw new Error('Kein MIDI-Parser verfügbar.');return parseUploadedMidi(buffer)}
function legacyBuild(score){if(typeof buildMidi!=='function')throw new Error('Kein MIDI-Builder verfügbar.');return buildMidi(score)}

window.CompositionLabMIDI={
  VERSION,
  get SOURCE(){return core()?.VERSION?'shared-midi-core':'legacy-root-fallback'},
  parse(buffer){return core()?.parse?core().parse(buffer):legacyParse(buffer)},
  build(score){return core()?.build?core().build(score):legacyBuild(score)},
  canParse(){return !!core()?.parse||typeof parseUploadedMidi==='function'},
  canBuild(){return !!core()?.build||typeof buildMidi==='function'},
  capabilities(){return core()?.supported||{legacyFallback:true}}
};

const tech=document.getElementById('technicalSection')?.querySelector('.foldcontent');
if(tech&&!document.getElementById('midiIoBridgeBadge')){
  const d=document.createElement('div');d.id='midiIoBridgeBadge';d.className='uploadinfo';
  d.textContent='MIDI I/O: '+VERSION+' · '+(core()?.VERSION?'gemeinsamer MIDI-Kern aktiv':'Root-Fallback aktiv');
  tech.appendChild(d);
}
})();
