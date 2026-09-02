from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

if 'safe-import-playback-v10' not in s:
    script=r'''
<script id="safe-import-playback-v10">
(()=>{
  let schedTimer=0, uiRaf=0, token=0, activeScore=null, activeStartBeat=0, activeBaseTime=0, activeMax=0, activeBpm=96, activeSpb=.625, events=[], nextEvent=0, instMap=new Map();
  const oldStopSafe=stopGMPlayback;
  stopGMPlayback=function(update=true){
    token++;
    if(schedTimer){clearTimeout(schedTimer);schedTimer=0;}
    if(uiRaf){cancelAnimationFrame(uiRaf);uiRaf=0;}
    events=[]; nextEvent=0; activeScore=null;
    return oldStopSafe(update);
  };
  const fmt=x=>{x=Math.max(0,Math.floor(x));return Math.floor(x/60)+":"+String(x%60).padStart(2,'0')};
  playGMScore=async function(score,fromBeat=0){
    if(!score||!score.tr?.length){
      const ps=document.getElementById('playerStatus'); if(ps) ps.textContent='Noch keine Komposition zum Abspielen.';
      return;
    }
    const my=++token;
    if(schedTimer){clearTimeout(schedTimer);schedTimer=0;}
    if(uiRaf){cancelAnimationFrame(uiRaf);uiRaf=0;}
    oldStopSafe(false);
    const ac=ensurePlayerAudio();
    if(ac.state==='suspended') await ac.resume();
    activeScore=score;
    activeStartBeat=Math.max(0,Number(fromBeat)||0);
    activeMax=scoreMaxBeat(score);
    activeBpm=Math.max(20,Math.min(300,Number(score.bpm)||96));
    activeSpb=60/activeBpm;
    events=[]; instMap=new Map(); nextEvent=0;
    const used=new Map();
    let made=0;
    for(const t of score.tr){
      const ch=Math.max(0,Math.min(15,Number(t.ch)||0)), pg=Math.max(0,Math.min(127,Number(t.pg)||0)), key=ch+':'+pg;
      used.set(key,[pg,ch]);
      for(const n of (t.nt||[])){
        const st=Number(n[0])||0, d=Math.max(.02,Number(n[1])||.25), g=n.length>5?Math.max(.05,Math.min(4,Number(n[5])||.95)):.95, en=st+d*g;
        if(en<=activeStartBeat) continue;
        events.push({st,en,p:Math.max(0,Math.min(127,Math.round(Number(n[2])||60))),v:Math.max(1,Math.min(127,Number(n[3])||80)),pg,ch,key});
        made++;
        if(made%1500===0) await new Promise(r=>setTimeout(r,0));
        if(my!==token) return;
      }
    }
    events.sort((a,b)=>a.st-b.st);
    const status=document.getElementById('playerStatus');
    if(status) status.textContent=`Wiedergabe wird vorbereitet (${events.length} Noten) …`;
    for(const [key,[pg,ch]] of used){
      if(my!==token) return;
      instMap.set(key,await loadGMInstrument(pg,ch));
    }
    if(my!==token) return;
    activeBaseTime=ac.currentTime+.12;
    playerPlaying=true; playerPaused=false;
    if(status) status.textContent='Wiedergabe läuft.';
    const lookAheadSec=2.0;
    function schedule(){
      if(my!==token||!playerPlaying) return;
      const nowBeat=activeStartBeat+Math.max(0,ac.currentTime-activeBaseTime)*activeBpm/60;
      const horizon=nowBeat+lookAheadSec*activeBpm/60;
      let count=0;
      while(nextEvent<events.length && events[nextEvent].st<=horizon && count<800){
        const e=events[nextEvent++], inst=instMap.get(e.key);
        const rel=Math.max(0,e.st-activeStartBeat), when=activeBaseTime+rel*activeSpb;
        try{inst&&inst.play(e.p,Math.max(ac.currentTime+.005,when),{duration:Math.max(.03,(e.en-Math.max(e.st,activeStartBeat))*activeSpb),gain:Math.max(.02,Math.min(1,e.v/127))});}catch(_){}
        count++;
      }
      schedTimer=setTimeout(schedule,count>=800?0:80);
    }
    function tick(){
      if(my!==token||!playerPlaying) return;
      const beat=Math.min(activeMax,activeStartBeat+Math.max(0,ac.currentTime-activeBaseTime)*activeBpm/60), frac=activeMax?beat/activeMax:0;
      [[document.getElementById('playerSeek'),document.getElementById('playerTime')],[document.getElementById('templateSeek'),document.getElementById('templateTime')]].forEach(([r,t])=>{if(r)r.value=String(Math.round(frac*1000));if(t)t.textContent=`${fmt(beat*activeSpb)} / ${fmt(activeMax*activeSpb)}`});
      if(beat>=activeMax){
        if(playerLoopEnabled){playGMScore(score,0).catch(()=>{});}else{playerPlaying=false;if(status)status.textContent='Wiedergabe beendet.';}
        return;
      }
      uiRaf=requestAnimationFrame(tick);
    }
    schedule(); tick();
  };
})();
</script>
'''
    s=s.replace('</body>',script+'\n</body>',1)

s=s.replace('navigator.serviceWorker.register("./service-worker.js?v=11")','navigator.serviceWorker.register("./service-worker.js?v=12")')
p.write_text(s,encoding='utf-8')
