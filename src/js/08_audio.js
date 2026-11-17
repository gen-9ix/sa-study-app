const SFX={ctx:null,played:false,master:null,el:null,unlocked:false};
function sfxMark(v){ SFX.played=v; }            // an action that makes its own sound sets this so the tap click is skipped
function sfxSilence(){ if(SFX.el){ try{ SFX.el.pause(); }catch(e){} } }
/* iPhone/iPad: Web Audio is silenced by the side Ring/Silent switch and stays suspended until it is started
   inside a real tap. On the first touch we (1) ask for a "playback" audio session (iOS 17+), (2) loop a silent
   <audio> element, which moves Safari's audio session to media playback so the silent switch no longer mutes it,
   (3) create and resume the AudioContext and play one silent sample. */
function silentWav(){ const n=800, b=new ArrayBuffer(44+n*2), v=new DataView(b), w=(o,s)=>{ for(let i=0;i<s.length;i++) v.setUint8(o+i,s.charCodeAt(i)); };
  w(0,'RIFF'); v.setUint32(4,36+n*2,true); w(8,'WAVE'); w(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,8000,true); v.setUint32(28,16000,true); v.setUint16(32,2,true); v.setUint16(34,16,true); w(36,'data'); v.setUint32(40,n*2,true);
  let s=''; const u=new Uint8Array(b); for(let i=0;i<u.length;i++) s+=String.fromCharCode(u[i]); return 'data:audio/wav;base64,'+btoa(s); }
function audioCtx(){
  if(!SFX.ctx){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null; SFX.ctx=new AC(); SFX.master=SFX.ctx.createGain(); SFX.master.gain.value=1; SFX.master.connect(SFX.ctx.destination); }
  if(SFX.ctx.state!=='running'){ try{ SFX.ctx.resume(); }catch(e){} }
  return SFX.ctx;
}
function unlockAudio(){
  if(!S||!S.set||!(S.set.snd||S.set.bgm||S.set.bbgm)) return;
  try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){}
  try{ if(!SFX.el){ const a=document.createElement('audio'); a.setAttribute('playsinline',''); a.setAttribute('x-webkit-airplay','deny'); a.loop=true; a.preload='auto'; a.src=silentWav(); SFX.el=a; }
       if(SFX.el.paused){ const p=SFX.el.play(); if(p&&p.catch) p.catch(()=>{}); } }catch(e){}
  const c=audioCtx(); if(!c) return;
  if(!SFX.unlocked){ try{ const buf=c.createBuffer(1,1,22050), src=c.createBufferSource(); src.buffer=buf; src.connect(c.destination); src.start(0); }catch(e){} }
  if(c.state==='running') SFX.unlocked=true;
  if(S.set.bgm&&!BGM.on&&!BM.on&&!document.hidden&&!inBattle()) bgmStart();
  musicSync();
}
['pointerdown','touchend','keydown','click'].forEach(ev=>document.addEventListener(ev,unlockAudio,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ bgmStop(); bossMusicStop(true); if(SFX.el){ try{ SFX.el.pause(); }catch(e){} } } });

/* Background music: a slow generative ambient piece, synthesised live (no audio files).
   Soft detuned pads through a low-pass filter and a generated reverb, a quiet bass, and sparse
   pentatonic bells. Starts only after a tap; stops when the page is hidden or on Esc. */
const BGM={on:false,bus:null,verb:null,lp:null,timer:null,next:0,step:0};
const BGM_VOL=[0,0.08,0.14,0.22];
const mtof=m=>440*Math.pow(2,(m-69)/12);
const BGM_PROG=[[50,57,62,66,69],[47,54,59,62,66],[43,50,55,59,62,64],[45,52,57,61,64]]; // Dmaj9 Bm9 Gmaj9 A6
const BGM_BELL=[74,76,78,81,83,86,88];
function bgmBus(){
  const c=audioCtx(); if(!c) return null;
  if(!BGM.bus){
    BGM.bus=c.createGain(); BGM.bus.gain.value=0.0001; BGM.bus.connect(c.destination);
    BGM.lp=c.createBiquadFilter(); BGM.lp.type='lowpass'; BGM.lp.frequency.value=1400; BGM.lp.Q.value=0.3; BGM.lp.connect(BGM.bus);
    const len=Math.floor(c.sampleRate*3.2), ir=c.createBuffer(2,len,c.sampleRate);
    for(let ch=0;ch<2;ch++){ const d=ir.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6); }
    BGM.verb=c.createConvolver(); BGM.verb.buffer=ir; const wet=c.createGain(); wet.gain.value=0.9; BGM.verb.connect(wet); wet.connect(BGM.lp);
  }
  return c;
}
function bgmVoice(c,f,t,dur,peak,type,detune,wetOnly){
  const o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.value=f; o.detune.value=detune;
  const atk=Math.min(2.6,dur*0.35);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+atk); g.gain.setValueAtTime(peak,t+dur-2.2); g.gain.exponentialRampToValueAtTime(0.0001,t+dur+1.6);
  o.connect(g); g.connect(BGM.verb); if(!wetOnly) g.connect(BGM.lp); o.start(t); o.stop(t+dur+1.8);
}
function bgmBell(c,f,t){
  const o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.value=f;
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.11,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+3);
  o.connect(g); g.connect(BGM.verb); g.connect(BGM.lp); o.start(t); o.stop(t+3.1);
}
function bgmSchedule(){
  const c=SFX.ctx; if(!BGM.on||!c||c.state!=='running') return;
  while(BGM.next<c.currentTime+3){
    const t=Math.max(BGM.next,c.currentTime+0.05), dur=9, ch=BGM_PROG[BGM.step%BGM_PROG.length];
    ch.forEach((m,i)=>{ const f=mtof(m); bgmVoice(c,f,t,dur,i===0?0.05:0.032,'sine',0,false); if(i) bgmVoice(c,f,t,dur,0.018,'triangle',i%2?7:-7,true); });
    bgmVoice(c,mtof(ch[0]-12),t,dur,0.06,'sine',0,false);
    const n=2+(Math.random()*3|0);
    for(let k=0;k<n;k++) bgmBell(c,mtof(BGM_BELL[Math.random()*BGM_BELL.length|0]),t+1+Math.random()*(dur-2.5));
    BGM.step++; BGM.next=t+dur-1.5;
  }
}
function bgmStart(){
  if(BGM.on||(typeof BM!=='undefined'&&BM.on)) return; const c=bgmBus(); if(!c) return;
  BGM.on=true; BGM.next=c.currentTime+0.1;
  const v=BGM_VOL[S.set.bgmv||2]; BGM.bus.gain.cancelScheduledValues(c.currentTime); BGM.bus.gain.setValueAtTime(Math.max(0.0001,BGM.bus.gain.value),c.currentTime); BGM.bus.gain.exponentialRampToValueAtTime(v,c.currentTime+3);
  bgmSchedule(); clearInterval(BGM.timer); BGM.timer=setInterval(bgmSchedule,500);
}
function bgmStop(){
  if(!BGM.on) return; BGM.on=false; clearInterval(BGM.timer);
  const c=SFX.ctx; if(c&&BGM.bus){ BGM.bus.gain.cancelScheduledValues(c.currentTime); BGM.bus.gain.setValueAtTime(Math.max(0.0001,BGM.bus.gain.value),c.currentTime); BGM.bus.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+1.2); }
}
function bgmVolume(){ const c=SFX.ctx; if(c&&BGM.on&&BGM.bus){ BGM.bus.gain.cancelScheduledValues(c.currentTime); BGM.bus.gain.setTargetAtTime(BGM_VOL[S.set.bgmv||2],c.currentTime,0.4); } }
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&BGM.on&&!/INPUT|TEXTAREA/.test(e.target.tagName)){ S.set.bgm=0; S.set.t=now(); save(); bgmStop(); render(); } });

/* Boss battle music: a short generative chiptune loop in D minor (i–VI–VII–V), synthesised live.
   Pulse bass, a 16th-note arpeggio, soft drums and an 8-bar lead that rests every other pass.
   When the boss is down to 3 HP a higher arpeggio and busier hats join in. Plays only inside a
   battle; ambient music (if on) pauses for the fight and comes back afterwards. */
const BM={on:false,bus:null,lp:null,timer:null,next:0,step:0,noise:null};
const BM_BPM=138, BM_16=60/BM_BPM/4;
const BM_CH=[[62,65,69],[58,62,65],[60,64,67],[57,61,64]]; // Dm Bb C A
// lead in 8ths: number = new note, 0 = hold, -1 = rest
const BM_LEAD=[74,-1,72,74,77,0,76,74, 72,0,70,0,69,0,65,0, 67,0,69,72,0,70,69,67, 69,0,0,0,73,0,76,0,
               74,-1,72,74,77,0,79,0, 81,0,79,77,0,74,77,0, 79,0,77,76,0,72,76,0, 76,0,73,0,69,0,0,-1];
function bmBus(){
  const c=audioCtx(); if(!c) return null;
  if(!BM.bus){
    BM.bus=c.createGain(); BM.bus.gain.value=0.0001; BM.bus.connect(c.destination);
    BM.lp=c.createBiquadFilter(); BM.lp.type='lowpass'; BM.lp.frequency.value=3200; BM.lp.Q.value=0.4; BM.lp.connect(BM.bus);
    const len=c.sampleRate|0, nb=c.createBuffer(1,len,c.sampleRate), d=nb.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1; BM.noise=nb;
  }
  return c;
}
function bmNote(c,f,t,dur,v,type,vib){
  const o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.setValueAtTime(f,t);
  if(vib){ const l=c.createOscillator(), lg=c.createGain(); l.frequency.value=5.5; lg.gain.setValueAtTime(0,t); lg.gain.linearRampToValueAtTime(f*0.012,t+Math.min(dur,0.35)); l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t+dur+0.05); }
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v,t+0.008); g.gain.setValueAtTime(v,t+Math.max(0.01,dur*0.6)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g); g.connect(BM.lp); o.start(t); o.stop(t+dur+0.02);
}
function bmNoise(c,t,dur,v,type,freq){
  const s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain(); s.buffer=BM.noise; f.type=type; f.frequency.value=freq;
  g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(f); f.connect(g); g.connect(BM.lp); s.start(t,Math.random()*0.5); s.stop(t+dur+0.02);
}
function bmKick(c,t){ const o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(45,t+0.12); g.gain.setValueAtTime(0.32,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.2); o.connect(g); g.connect(BM.lp); o.start(t); o.stop(t+0.22); }
function bmSchedule(){
  const c=SFX.ctx; if(!BM.on||!c||c.state!=='running') return;
  const B=RUN&&RUN.boss, rage=!!(B&&B.hp<=3), low=!!(B&&B.php<=1);
  BM.lp.frequency.setTargetAtTime(low?1500:3200,c.currentTime,0.6);
  while(BM.next<c.currentTime+0.25){
    const t=Math.max(BM.next,c.currentTime+0.02), s=BM.step, i16=s%16, bar=(s>>4), ch=BM_CH[bar%4], pass=(bar>>3)%2;
    // bass: 8th-note octave pulse
    if(i16%2===0){ const m=ch[0]-24+(i16%4===2?12:0); bmNote(c,mtof(m),t,BM_16*1.7,0.11,'triangle'); bmNote(c,mtof(m),t,BM_16*1.2,0.022,'square'); }
    // arpeggio
    const ar=[0,1,2,1,0,1,2,3, 2,1,0,1,2,3,2,1][i16], am=ar===3?ch[0]+12:ch[ar];
    bmNote(c,mtof(am),t,BM_16*0.9,pass?0.03:0.022,'square');
    if(rage) bmNote(c,mtof(am+12),t+BM_16*0.5,BM_16*0.6,0.014,'square');
    // drums
    if(i16===0||i16===8||(i16===10&&bar%2)) bmKick(c,t);
    if(i16===4||i16===12) bmNoise(c,t,0.16,0.09,'bandpass',1800);
    if(rage? true : i16%2===0) bmNoise(c,t,0.04,i16%4===2?0.035:0.022,'highpass',7000);
    // lead (rests every other 8-bar pass; a soft pad holds the chord instead)
    if(i16%2===0){
      const k=((bar%8)*8+(i16>>1)), m=BM_LEAD[k];
      if(!pass&&m>0){ let n=1; while(k+n<BM_LEAD.length&&BM_LEAD[k+n]===0&&(k+n)%8!==0) n++; const d=n*BM_16*2*0.95; bmNote(c,mtof(m),t,d,0.05,'square',true); bmNote(c,mtof(m),t,d,0.035,'triangle'); }
      if(pass&&i16===0) ch.forEach(m=>bmNote(c,mtof(m+12),t,BM_16*15,0.016,'triangle'));
    }
    BM.step++; BM.next=t+BM_16;
  }
}
function bossMusicStart(){
  if(BM.on) return; const c=bmBus(); if(!c||c.state!=='running') return;
  BM.on=true; BM.step=0; BM.next=c.currentTime+0.15;
  const v=BGM_VOL[S.set.bgmv||2]*1.15; BM.bus.gain.cancelScheduledValues(c.currentTime); BM.bus.gain.setValueAtTime(0.0001,c.currentTime); BM.bus.gain.exponentialRampToValueAtTime(v,c.currentTime+0.6);
  bmSchedule(); clearInterval(BM.timer); BM.timer=setInterval(bmSchedule,60);
}
function bossMusicStop(fast){
  if(!BM.on) return; BM.on=false; clearInterval(BM.timer);
  const c=SFX.ctx; if(c&&BM.bus){ BM.bus.gain.cancelScheduledValues(c.currentTime); BM.bus.gain.setValueAtTime(Math.max(0.0001,BM.bus.gain.value),c.currentTime); BM.bus.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+(fast?0.25:0.9)); }
}
function inBattle(){ return VIEW&&VIEW.name==='run'&&RUN&&RUN.boss&&!RUN.boss.won&&!RUN.boss.lost; }
// decides which music should be playing right now; called after every render and audio unlock
function musicSync(){
  const c=SFX.ctx; if(!c||c.state!=='running'||document.hidden) return;
  if(inBattle()&&S.set.bbgm){ if(BGM.on) bgmStop(); bossMusicStart(); if(BM.on) bmVolume(); }
  else { const was=BM.on; bossMusicStop(RUN&&RUN.boss&&(RUN.boss.won||RUN.boss.lost)); if(S.set.bgm&&!BGM.on) setTimeout(()=>{ if(!BM.on&&S.set.bgm&&!document.hidden) bgmStart(); },was?1200:0); }
}
function bmVolume(){ const c=SFX.ctx; if(c&&BM.on&&BM.bus){ BM.bus.gain.setTargetAtTime(BGM_VOL[S.set.bgmv||2]*1.15,c.currentTime,0.3); } }

function tone(f,t0,d,type='square',v=0.05){ const c=SFX.ctx, o=c.createOscillator(), g=c.createGain(), t=c.currentTime+0.01+t0; v*=1.8; o.type=type; o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.connect(g); g.connect(SFX.master); o.start(t); o.stop(t+d+0.02); }
function sfx(n,k=0){
  if(!S.set.snd) return; SFX.played=true;
  try{
    if(!audioCtx()) return;
    const b=660*Math.pow(2,Math.min(k,8)/12);
    if(n==='tap') tone(880,0,.03,'square',.02);
    else if(n==='ok'){ tone(b,0,.08); tone(b*1.5,.07,.14); }
    else if(n==='mid'){ tone(523,0,.09,'triangle',.08); tone(587,.08,.12,'triangle',.08); }
    else if(n==='no'){ tone(233,0,.12,'triangle',.09); tone(196,.11,.2,'triangle',.09); }
    else if(n==='flip'){ tone(520,0,.05,'square',.03); tone(780,.04,.07,'square',.03); }
    else if(n==='coin'){ tone(988,0,.07); tone(1319,.07,.25); }
    else if(n==='pet'){ tone(700,0,.05,'square',.04); tone(1050,.05,.05,'square',.04); tone(1400,.1,.1,'square',.04); }
    else if(n==='hit'){ tone(392,0,.05,'square',.07); tone(262,.05,.06,'square',.07); tone(131,.11,.14,'square',.06); }
    else if(n==='hurt'){ tone(147,0,.12,'sawtooth',.05); tone(110,.1,.22,'sawtooth',.05); }
    else if(n==='die'){ tone(392,0,.06,'square',.07); tone(330,.07,.06,'square',.07); tone(262,.14,.06,'square',.07); tone(196,.21,.08,'square',.07); tone(98,.3,.45,'triangle',.08); }
    else if(n==='fanfare'){ [523,659,784,1047].forEach((f,i)=>tone(f,i*.1,.12)); tone(1319,.42,.35); }
  }catch(e){}
}
/* The pet's condition follows the memory HP bar (average recall probability of learned items). */
