from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Green operational status messages throughout the app.
if '#status, .playerstatus, .operationstatus' not in s:
    s=s.replace('</style>', '''\n  #status, .playerstatus, .operationstatus { color:var(--ok) !important; }\n</style>''', 1)

# Replace the two minimal comparison playback controls with player bars matching the main/template players.
oldA='''<div class="historyactions"><button type="button" class="secondary smallbtn" id="playSourceA">▶ A anhören</button><button type="button" class="secondary smallbtn" id="stopSourceA">⏹ Stop</button></div>'''
newA='''<div class="playerbar" id="sourceAPlayer">
                    <strong style="flex:1 1 100%;">Player A</strong>
                    <button type="button" class="secondary smallbtn" id="playSourceA">▶ Abspielen</button>
                    <button type="button" class="secondary smallbtn" id="pauseSourceA">⏸ Pause</button>
                    <button type="button" class="secondary smallbtn" id="stopSourceA">⏹ Stop</button>
                    <button type="button" class="secondary smallbtn" id="loopSourceA">🔁 Loop: Aus</button>
                    <label for="volumeSourceA" style="margin:0;font-weight:600;display:flex;align-items:center;gap:7px;">Lautstärke
                      <input id="volumeSourceA" type="range" min="0" max="100" value="75">
                    </label>
                    <span class="playerstatus" id="statusSourceA">Quelle A bereit.</span>
                    <div style="flex-basis:100%;height:0"></div>
                    <input id="seekSourceA" type="range" min="0" max="1000" value="0" step="1" style="flex:1 1 260px;">
                    <span class="playerstatus" id="timeSourceA">0:00 / 0:00</span>
                  </div>'''
oldB='''<div class="historyactions"><button type="button" class="secondary smallbtn" id="playSourceB">▶ B anhören</button><button type="button" class="secondary smallbtn" id="stopSourceB">⏹ Stop</button></div>'''
newB='''<div class="playerbar" id="sourceBPlayer">
                    <strong style="flex:1 1 100%;">Player B</strong>
                    <button type="button" class="secondary smallbtn" id="playSourceB">▶ Abspielen</button>
                    <button type="button" class="secondary smallbtn" id="pauseSourceB">⏸ Pause</button>
                    <button type="button" class="secondary smallbtn" id="stopSourceB">⏹ Stop</button>
                    <button type="button" class="secondary smallbtn" id="loopSourceB">🔁 Loop: Aus</button>
                    <label for="volumeSourceB" style="margin:0;font-weight:600;display:flex;align-items:center;gap:7px;">Lautstärke
                      <input id="volumeSourceB" type="range" min="0" max="100" value="75">
                    </label>
                    <span class="playerstatus" id="statusSourceB">Quelle B bereit.</span>
                    <div style="flex-basis:100%;height:0"></div>
                    <input id="seekSourceB" type="range" min="0" max="1000" value="0" step="1" style="flex:1 1 260px;">
                    <span class="playerstatus" id="timeSourceB">0:00 / 0:00</span>
                  </div>'''
if oldA in s: s=s.replace(oldA,newA,1)
if oldB in s: s=s.replace(oldB,newB,1)

# Expose comparison source scores so the enhanced controls can seek/replay them.
needle='''  fill();window.compositionLabRefreshComparisonSources=fill;'''
repl='''  window.compositionLabGetComparisonSource=(w)=>src[w]||null;\n  fill();window.compositionLabRefreshComparisonSources=fill;'''
if needle in s and 'compositionLabGetComparisonSource' not in s:
    s=s.replace(needle,repl,1)

# Make the active playback progress update comparison seek/time displays too.
s=s.replace('''[[document.getElementById('playerSeek'),document.getElementById('playerTime')],[document.getElementById('templateSeek'),document.getElementById('templateTime')]]''', '''[[document.getElementById('playerSeek'),document.getElementById('playerTime')],[document.getElementById('templateSeek'),document.getElementById('templateTime')],[document.getElementById('seekSourceA'),document.getElementById('timeSourceA')],[document.getElementById('seekSourceB'),document.getElementById('timeSourceB')]]''')
s=s.replace('''[[$("playerSeek"),$("playerTime")],[$("templateSeek"),$("templateTime")]]''', '''[[$("playerSeek"),$("playerTime")],[$("templateSeek"),$("templateTime")],[$("seekSourceA"),$("timeSourceA")],[$("seekSourceB"),$("timeSourceB")]]''')

# Add full comparison-player behavior.
if 'comparison-player-controls-v13' not in s:
    script=r'''
<script id="comparison-player-controls-v13">
(()=>{
  let activeSide=null;
  const $=id=>document.getElementById(id);
  const getScore=w=>window.compositionLabGetComparisonSource?.(w)||null;
  const setStatus=(w,msg)=>{const e=$("statusSource"+w);if(e)e.textContent=msg;};
  const syncLoops=()=>['A','B'].forEach(w=>{const b=$("loopSource"+w);if(b)b.textContent=playerLoopEnabled?'🔁 Loop: Ein':'🔁 Loop: Aus';});
  const applyVolume=w=>{
    const v=Math.max(0,Math.min(100,Number($("volumeSource"+w)?.value)||0));
    if($("playerVolume")) $("playerVolume").value=String(v);
    if($("templateVolume")) $("templateVolume").value=String(v);
    if(playerMasterGain) playerMasterGain.gain.value=v/100;
  };
  async function play(w,fromBeat=0){
    const sc=getScore(w);if(!sc){setStatus(w,'Bitte zuerst eine Quelle laden.');return;}
    activeSide=w;applyVolume(w);setStatus(w,'GM-Klänge werden geladen …');
    try{await playGMScore(sc,fromBeat);setStatus(w,'▶ Wiedergabe läuft.');}
    catch(e){setStatus(w,'Player-Fehler: '+(e?.message||e));}
  }
  ['A','B'].forEach(w=>{
    const playBtn=$("playSource"+w),pauseBtn=$("pauseSource"+w),stopBtn=$("stopSource"+w),loopBtn=$("loopSource"+w),vol=$("volumeSource"+w),seek=$("seekSource"+w);
    if(playBtn) playBtn.onclick=()=>play(w,0);
    if(pauseBtn) pauseBtn.onclick=()=>{activeSide=w;toggleGMPause().then(()=>setStatus(w,playerPaused?'⏸ Pausiert.':'▶ Wiedergabe läuft.')).catch(e=>setStatus(w,'Player-Fehler: '+(e?.message||e)));};
    if(stopBtn) stopBtn.onclick=()=>{stopGMPlayback(true);setStatus(w,'⏹ Gestoppt.');if(seek)seek.value='0';const t=$("timeSource"+w);if(t)t.textContent='0:00 / 0:00';};
    if(loopBtn) loopBtn.onclick=()=>{playerLoopEnabled=!playerLoopEnabled;syncLoops();setStatus(w,playerLoopEnabled?'Loop eingeschaltet.':'Loop ausgeschaltet.');};
    if(vol) vol.oninput=()=>applyVolume(w);
    if(seek) seek.onchange=()=>{const sc=getScore(w);if(!sc)return;play(w,scoreMaxBeat(sc)*(Number(seek.value)||0)/1000);};
  });
  const mainLoop=$('loopBtn'),templateLoop=$('templateLoopBtn');
  if(mainLoop)mainLoop.addEventListener('click',()=>setTimeout(syncLoops,0));
  if(templateLoop)templateLoop.addEventListener('click',()=>setTimeout(syncLoops,0));
  syncLoops();
})();
</script>
'''
    s=s.replace('</body>',script+'</body>',1)

p.write_text(s,encoding='utf-8')
