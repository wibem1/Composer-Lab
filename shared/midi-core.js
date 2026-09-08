(()=>{
'use strict';
if(window.CompositionLabMIDICore?.VERSION)return;

const VERSION='midi-core-1.0';
const PPQ_OUT=480;
const td=new TextDecoder();
const te=new TextEncoder();

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function readU32(b,o){return ((b[o]<<24)>>>0)|(b[o+1]<<16)|(b[o+2]<<8)|b[o+3]}
function readVLQ(b,state){let v=0,x;do{if(state.i>=b.length)throw new Error('Unerwartetes Dateiende in MIDI-VLQ.');x=b[state.i++];v=(v<<7)|(x&0x7f)}while(x&0x80);return v>>>0}
function writeVLQ(v){v=Math.max(0,Math.floor(v));let buffer=v&0x7f,out=[];while((v>>=7)){buffer<<=8;buffer|=((v&0x7f)|0x80)}for(;;){out.push(buffer&255);if(buffer&0x80)buffer>>=8;else break}return out}
function u16(n){return[(n>>8)&255,n&255]}
function u32(n){return[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]}
function textBytes(s){return Array.from(te.encode(String(s||'')))}
function meta(type,data){return[0xff,type,...writeVLQ(data.length),...data]}
function keyName(sf,minor){const maj=['Cb','Gb','Db','Ab','Eb','Bb','F','C','G','D','A','E','B','F#','C#'];const min=['Ab','Eb','Bb','F','C','G','D','A','E','B','F#','C#','G#','D#','A#'];const i=clamp(Number(sf)||0,-7,7)+7;return (minor?min:maj)[i]+(minor?' minor':' major')}
function keyBytes(name){const s=String(name||'').trim();const m=s.match(/^([A-Ga-g](?:#|b)?)(?:\s+|\-)?(major|minor|maj|min)?$/i);if(!m)return[0,0];const tonic=m[1][0].toUpperCase()+m[1].slice(1);const minor=/minor|min/i.test(m[2]||'');const arr=minor?['Ab','Eb','Bb','F','C','G','D','A','E','B','F#','C#','G#','D#','A#']:['Cb','Gb','Db','Ab','Eb','Bb','F','C','G','D','A','E','B','F#','C#'];const ix=arr.indexOf(tonic);return[ix<0?0:ix-7,minor?1:0]}

function parse(buffer){
  const b=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);
  if(b.length<14||String.fromCharCode(...b.slice(0,4))!=='MThd')throw new Error('Keine gültige MIDI-Datei.');
  const hdr=readU32(b,4),format=(b[8]<<8)|b[9],ntrks=(b[10]<<8)|b[11],division=(b[12]<<8)|b[13];
  if(division&0x8000)throw new Error('SMPTE-Zeitbasis wird derzeit nicht unterstützt.');
  const ppq=division||480;let pos=8+hdr;
  let bpm=96,ts={n:4,d:4},k='C major',title='MIDI-Import';
  const scoreTracks=[];
  for(let ti=0;ti<ntrks;ti++){
    if(pos+8>b.length||String.fromCharCode(...b.slice(pos,pos+4))!=='MTrk')throw new Error('Ungültiger MIDI-Track.');
    const len=readU32(b,pos+4);const end=pos+8+len;let i=pos+8,tick=0,running=0,trackName='';
    const channels=new Map();
    function chState(ch){if(!channels.has(ch))channels.set(ch,{ch,pg:0,nt:[],ct:[],open:new Map(),used:false});return channels.get(ch)}
    while(i<end){const st={i};const delta=readVLQ(b,st);i=st.i;tick+=delta;if(i>=end)break;
      let status=b[i++];if(status<0x80){if(!running)throw new Error('Ungültiger Running-Status.');i--;status=running}else if(status<0xf0)running=status;
      if(status===0xff){const type=b[i++];const ls={i};const l=readVLQ(b,ls);i=ls.i;const data=b.slice(i,i+l);i+=l;
        if(type===0x03&&data.length){trackName=td.decode(data);if(!ti&&trackName)title=trackName}
        else if(type===0x51&&data.length>=3){const us=(data[0]<<16)|(data[1]<<8)|data[2];if(us)bpm=60000000/us}
        else if(type===0x58&&data.length>=2){ts={n:data[0]||4,d:2**data[1]}}
        else if(type===0x59&&data.length>=2){const sf=data[0]>127?data[0]-256:data[0];k=keyName(sf,!!data[1])}
        continue;
      }
      if(status===0xf0||status===0xf7){const ls={i};const l=readVLQ(b,ls);i=ls.i+l;continue}
      const kind=status&0xf0,ch=status&0x0f,s=chState(ch);s.used=true;
      const need2=![0xc0,0xd0].includes(kind);const d1=b[i++]??0,d2=need2?(b[i++]??0):0;const beat=tick/ppq;
      if(kind===0x90&&d2>0){const key=d1;const a=s.open.get(key)||[];a.push({beat,vel:d2});s.open.set(key,a)}
      else if(kind===0x80||(kind===0x90&&d2===0)){const a=s.open.get(d1)||[];const on=a.shift();if(a.length)s.open.set(d1,a);else s.open.delete(d1);if(on){const dur=Math.max(1/ppq,beat-on.beat);s.nt.push([on.beat,dur,d1,on.vel,0,0.95])}}
      else if(kind===0xb0){s.ct.push([beat,d1,d2])}
      else if(kind===0xc0){s.pg=d1}
    }
    channels.forEach((s,ch)=>{if(!s.used||(!s.nt.length&&!s.ct.length))return;for(const [pitch,a] of s.open){for(const on of a)s.nt.push([on.beat,Math.max(.25,1/ppq),pitch,on.vel,0,.95])}s.nt.sort((a,b)=>a[0]-b[0]);s.ct.sort((a,b)=>a[0]-b[0]);scoreTracks.push({nm:trackName||(channels.size>1?`Track ${ti+1} Ch ${ch+1}`:`Track ${ti+1}`),ch,pg:s.pg,nt:s.nt,ct:s.ct})});
    pos=end;
  }
  return{ti:title,bpm:Math.round(bpm*1000)/1000,ts,k,sm:`Importierte MIDI-Datei (Format ${format})`,tr:scoreTracks};
}

function encodeTrack(events){events.sort((a,b)=>a.t-b.t||a.order-b.order);let out=[],last=0;for(const e of events){out.push(...writeVLQ(Math.max(0,e.t-last)),...e.bytes);last=e.t}out.push(0,0xff,0x2f,0);return[...textBytes('MTrk'),...u32(out.length),...out]}
function build(score){
  if(!score||!Array.isArray(score.tr))throw new Error('Ungültiger Score für MIDI-Export.');
  const bpm=clamp(Number(score.bpm)||96,20,300),ts=score.ts||{n:4,d:4};const tracks=[];const cond=[];let order=0;
  cond.push({t:0,order:order++,bytes:meta(0x03,textBytes(score.ti||'Composition Lab'))});
  const us=Math.max(1,Math.round(60000000/bpm));cond.push({t:0,order:order++,bytes:meta(0x51,[(us>>16)&255,(us>>8)&255,us&255])});
  const dd=Math.max(0,Math.round(Math.log2(Number(ts.d)||4)));cond.push({t:0,order:order++,bytes:meta(0x58,[clamp(Number(ts.n)||4,1,255),dd,24,8])});
  const kb=keyBytes(score.k);cond.push({t:0,order:order++,bytes:meta(0x59,[kb[0]&255,kb[1]])});tracks.push(encodeTrack(cond));
  for(const tr of score.tr){const ch=clamp(Number(tr.ch)||0,0,15),pg=clamp(Number(tr.pg)||0,0,127),ev=[];order=0;ev.push({t:0,order:order++,bytes:meta(0x03,textBytes(tr.nm||'Track'))});ev.push({t:0,order:order++,bytes:[0xc0|ch,pg]});
    for(const c of tr.ct||[]){if(!Array.isArray(c)||c.length<3)continue;ev.push({t:Math.max(0,Math.round((Number(c[0])||0)*PPQ_OUT)),order:order++,bytes:[0xb0|ch,clamp(Number(c[1])||0,0,127),clamp(Number(c[2])||0,0,127)]})}
    for(const n of tr.nt||[]){if(!Array.isArray(n)||n.length<4)continue;const start=Math.max(0,Number(n[0])||0),dur=Math.max(1/PPQ_OUT,Number(n[1])||.25),pitch=clamp(Math.round(Number(n[2])||60),0,127),vel=clamp(Math.round(Number(n[3])||80),1,127),gate=n.length>5?clamp(Number(n[5])||.95,.05,4):.95;const st=Math.round(start*PPQ_OUT),en=Math.max(st+1,Math.round((start+dur*gate)*PPQ_OUT));ev.push({t:st,order:order++,bytes:[0x90|ch,pitch,vel]},{t:en,order:order++,bytes:[0x80|ch,pitch,0]})}
    tracks.push(encodeTrack(ev));
  }
  const header=[...textBytes('MThd'),...u32(6),...u16(1),...u16(tracks.length),...u16(PPQ_OUT)];return new Uint8Array([...header,...tracks.flat()]);
}

window.CompositionLabMIDICore={VERSION,PPQ:PPQ_OUT,parse,build,supported:{notes:true,velocity:true,gate:true,channels:true,programs:true,controllers:true,tempo:true,timeSignature:true,keySignature:true,trackNames:true,rawEvents:false}};
})();
