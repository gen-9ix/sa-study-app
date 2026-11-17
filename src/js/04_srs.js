/* ═════════════════════ 3. SCHEDULER (SRS) ═════════════════════ */
const now=()=>Date.now();
const today=()=>{ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const dkey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function qs(id){ return S.q[id]; }
/* Memory model (Ebbinghaus-style exponential forgetting):
   each question keeps a stability s.i (days) = time for recall probability to fall to 90%.
   retrievability R(t) = 0.9^(elapsed/s.i). A successful recall multiplies stability; the lower R was
   at the moment of recall, the bigger the gain (spacing effect). A lapse cuts stability and
   re-tests after 10 minutes. Reviews are scheduled when R is predicted to hit ~90%. */
function retr(s,t){ if(!s||!s.n) return 0; t=t||now(); if(!(s.i>=1)) return t<s.d?0.7:0.4; return Math.pow(0.9,Math.max(0,(t-s.t)/DAY)/s.i); }
function fmtDays(i){ return i<1?'不到 1 天':i<30?Math.round(i)+' 天':i<60?'約 1 個月':'約 2 個月'; }
function memStats(){ let n=0,r=0,low=0; const t=now(); for(const q of QLIST){ const s=S.q[q.id]; if(!s||!s.n) continue; const R=retr(s,t); n++; r+=R; if(s.d<=t) low++; } return {n,avg:n?r/n:0,low}; }
function seen(id){ const s=S.q[id]; return !!(s&&s.n); }
// grade: 0 wrong, 1 partial/hard, 2 good, 3 easy
function grade(id,g,opt={}){
  const t=now(); let s=S.q[id]||{n:0,c:0,l:0,e:2.5,i:0,d:t,t:0,h:''};
  const cardNew=!s.n&&Q[id]&&!Q[id].card.q.some(x=>seen(x.id));
  const wasNew=!s.n, L0=lvl().i, P0=petStage(), i0=s.i||0, R=wasNew?1:retr(s,t), el=wasNew?0:(t-s.t)/DAY;
  s.n++; s.h=(s.h+(g>=2?'1':g===1?'h':'0')).slice(-8);
  if(g>=2) s.c++;
  if(g===0){ s.l++; s.e=Math.max(1.3,s.e-0.2); s.i=i0>=5?Math.min(3,i0*0.2):0; s.d=t+10*MIN; }
  else {
    const gap=Math.min(0.25,1-R);                 // how much had been forgotten when recalled
    if(g===1){ s.e=Math.max(1.3,s.e-0.15); s.i=Math.max(1,i0*(1.15+gap)); }
    else {
      let i;
      if(i0<1) i=1;
      else if(i0<2.5) i=(el>=0.5)?3:i0;
      else i=i0*Math.min(3.5,1+(s.e-1)*(0.05+9.5*gap));
      if(g===3){ s.e=Math.min(3,s.e+0.1); i*=1.15; }
      s.i=Math.min(60,Math.max(i,i0));
    }
    s.d=t+s.i*DAY;
    if(S.set.exam){ const ex=new Date(S.set.exam+'T00:00').getTime(); if(ex>t+2*DAY&&s.d>ex-DAY){ s.d=Math.max(t+DAY,ex-DAY-Math.random()*2*DAY); } }  // always one more review right before the exam
  }
  s.t=t; S.q[id]=s;
  const d=today(); const D=S.days[d]||(S.days[d]={n:0,c:0,x:0,nw:0});
  D.n++; if(g>=2) D.c++; if(wasNew) D.nw++; if(cardNew) D.nc=(D.nc||0)+1;
  const xp = opt.xp!=null?opt.xp : (g>=2?10:g===1?5:2);
  D.x+=xp; S.xp+=xp;
  if(D.n===1){ const st=streak(); if(st>0&&st%7===0&&S.fz.n<2){ S.fz.n++; S.fz.t=t; setTimeout(()=>toast(icon('ice')+' 連續 '+st+' 天！獲得 1 張補簽卡',2800),900); } }
  if(lvl().i>L0||petStage()>P0) setTimeout(()=>{ const ev=petStage()>P0; toast(ev?icon('star')+' '+PETS[curPet()].name+' 進化了！新型態：'+EVO[curPet()].names[petStage()]:icon('trophy')+' 升級！Lv.'+lvl().i+' '+esc(lvl().name),ev?3600:2800); confetti(); sfx('fanfare'); },350);
  grade.last={i0,i1:s.i,R,el,wasNew};
  save();
  return xp;
}
function viewCard(cid){ const c=S.c[cid]||(S.c[cid]={v:0,t:0}); c.v++; c.t=now(); save(); }
function rateCard(cid,r){ // flashcard rating 0 忘了 1 模糊 2 記得
  const c=S.c[cid]||(S.c[cid]={v:0,t:0}); c.r=r; c.rt=now(); c.t=now(); c.v=(c.v||0)+1;
  if(r===0){ for(const q of CARD[cid].q){ const s=S.q[q.id]; if(s&&s.n){ s.d=Math.min(s.d,now()); s.t=now(); } } }
  const xp=2; S.xp+=xp; const D=S.days[today()]||(S.days[today()]={n:0,c:0,x:0,nw:0}); D.x+=xp;
  save();
}
function recentAcc(h){ if(!h) return 0; const r=h.slice(-4); let a=0; for(const ch of r) a+= ch==='1'?1:ch==='h'?0.5:0; return a/r.length; }
function qMastery(id){
  const s=S.q[id]; if(!s||!s.n) return 0;
  let m=0.45*recentAcc(s.h)+0.55*Math.min(1,s.i/12);
  const over=(now()-s.d)/DAY; if(over>0) m*=Math.pow(0.5,over/Math.max(1,s.i));
  if(s.h.slice(-1)==='0') m=Math.min(m,0.2);
  return Math.max(0,Math.min(1,m));
}
function cardMastery(c){ if(!c.q.length) return S.c[c.id]?.v?0.5:0; let t=0; for(const q of c.q) t+=qMastery(q.id); let m=t/c.q.length; if(S.c[c.id]?.r===0) m=Math.min(m,0.25); return m; }
function cardStarted(c){ return c.q.some(q=>seen(q.id)); }
function chMastery(ch){ let t=0; for(const c of ch.cards) t+=cardMastery(c); return ch.cards.length?t/ch.cards.length:0; }
function chProgress(ch){ let s=0,n=0; for(const c of ch.cards) for(const q of c.q){ n++; if(seen(q.id)) s++; } return {s,n}; }
function level(m,started){ if(!started) return 0; return m<0.35?1:m<0.7?2:3; }
function cardLevel(c){ return level(cardMastery(c),cardStarted(c)||!!S.c[c.id]?.r); }
function dueList(filter){
  const t=now(); const out=[];
  for(const q of QLIST){ const s=S.q[q.id]; if(s&&s.n&&s.d<=t&&(!filter||filter(q))) out.push(q); }
  out.sort((a,b)=>prio(b)-prio(a));
  return out;
}
function prio(q){ const s=S.q[q.id]; return (1-retr(s))*3+s.l*0.3+(s.h.slice(-1)==='0'?1.5:0)+Math.random()*0.1; }
function weakness(c){
  let seenN=0,l=0,lastBad=0,acc=0;
  for(const q of c.q){ const s=S.q[q.id]; if(!s||!s.n) continue; seenN++; l+=s.l; if(s.h.slice(-1)==='0') lastBad++; acc+=recentAcc(s.h); }
  const fr=S.c[c.id]?.r;
  if(!seenN&&fr!==0) return null;
  acc=seenN?acc/seenN:0.5;
  const score=(1-cardMastery(c))*1.2+l*0.35+lastBad*0.9+(fr===0?0.8:fr===1?0.3:0)+(1-acc)*0.6;
  const why=[]; if(lastBad) why.push('上次答錯'); if(l>=2) why.push('錯過 '+l+' 次'); else if(l===1&&!lastBad) why.push('錯過 1 次');
  if(fr===0) why.push('閃卡標記忘了'); else if(fr===1) why.push('閃卡標記模糊');
  if(!why.length&&acc<0.6) why.push('正確率 '+Math.round(acc*100)+'%');
  if(!why.length){ const ds=c.q.map(q=>S.q[q.id]).filter(s=>s&&s.n&&s.d<now()); if(ds.length) why.push('快忘了，該複習'); }
  return {c,score,why};
}
function weakCards(n=8){ return CLIST.map(weakness).filter(w=>w&&w.why.length&&w.score>0.6).sort((a,b)=>b.score-a.score).slice(0,n); }
/* Pacing: how many NEW cards today so that every card is met before the exam (last 3 days = review only). */
function pace(){
  if(!S.set.exam) return null; const days=Math.ceil((new Date(S.set.exam+'T09:00')-new Date())/DAY); if(days<0) return null;
  const left=CLIST.filter(c=>!cardStarted(c)).length, done=(S.days[today()]||{}).nc||0;
  const need=left+done?Math.ceil((left+done)/Math.max(1,days-3)):0;
  return {days,left,need,done,behind:Math.max(0,Math.min(left,need-done))};
}
const cardHot=c=>c.q.some(q=>q.src);   // has a real past-exam question
/* Next cards to learn. Unfinished cards first; then chapters are interleaved (the chapter with the lowest
   share of started cards goes next) and, inside a chapter, past-exam cards are pulled a few places forward. */
function nextNewQs(limitCards, opts={}){
  const per=opts.per||2, res=[];
  const unOf=c=>{ const obj=c.q.filter(x=>x.k!=='sa'); return c.q.filter(q=>!seen(q.id)&&(opts.allowSA||q.k!=='sa'||obj.every(x=>seen(x.id)))); };
  const queue=ch=>ch.cards.map((c,i)=>({c,i,un:unOf(c),st:cardStarted(c)})).filter(x=>x.un.length&&!(opts.fresh&&x.st))
    .sort((a,b)=>(b.st-a.st)||((a.i-(cardHot(a.c)?3:0))-(b.i-(cardHot(b.c)?3:0)))||(a.i-b.i));
  const take=x=>{ res.push({card:x.c,qs:x.un.slice(0,per)}); return res.length>=limitCards; };
  if(opts.only){ for(const x of queue(CHMAP[opts.only])) if(take(x)) break; return res; }
  const f=S.set.focus&&CHMAP[S.set.focus];
  if(f) for(const x of queue(f)) if(take(x)) return res;
  const pools=CH.filter(ch=>ch!==f).map((ch,k)=>({k,q:queue(ch),n:Math.max(1,ch.cards.length),st:ch.cards.filter(cardStarted).length}));
  for(const P of pools) while(P.q.length&&P.q[0].st){ if(take(P.q.shift())) return res; }   // finish what was started
  if((S.set.mix??1)===0){ for(const P of pools) for(const x of P.q) if(take(x)) return res; return res; }
  for(;;){ let best=null; for(const P of pools){ if(!P.q.length) continue; if(!best||P.st/P.n<best.st/best.n-1e-9) best=P; }
    if(!best) break; best.st++; if(take(best.q.shift())) break; }
  return res;
}
function streak(){ let n=0; const d=new Date(); if(!(S.days[today()]?.n>0)) d.setDate(d.getDate()-1);
  for(let g=0;g<4000;g++){ const k=dkey(d); if(S.days[k]?.n>0) n++; else if(!S.fz.used[k]) break; d.setDate(d.getDate()-1); } return n; }
function applyFreeze(){ // bridge up to fz.n missed days so one bad day does not kill the habit
  if(!PROF.cur) return; const d=new Date(); d.setDate(d.getDate()-1); const miss=[];
  while(miss.length<3){ const k=dkey(d); if(S.days[k]?.n>0||S.fz.used[k]) break; miss.push(k); d.setDate(d.getDate()-1); }
  if(!miss.length||miss.length>S.fz.n) return;
  const k=dkey(d); if(!(S.days[k]?.n>0||S.fz.used[k])) return;
  for(const m of miss) S.fz.used[m]=1; S.fz.n-=miss.length; S.fz.t=now(); save();
  setTimeout(()=>toast(icon('ice')+' 用掉補簽卡，連續紀錄保住了',3000),700);
}
function weekRow(){ const out=[]; const d=new Date(); d.setDate(d.getDate()-6);
  for(let i=0;i<7;i++){ const k=dkey(d), on=S.days[k]?.n>0, fz=!on&&S.fz.used[k]; out.push(`<div class="d${i===6?' today':''}"><span>${'日一二三四五六'[d.getDay()]}</span><span class="m${on?' on':fz?' fz':''}">${on?icon('flame'):fz?icon('ice'):''}</span></div>`); d.setDate(d.getDate()+1); }
  return `<div class="week" role="img" aria-label="最近 7 天的打卡紀錄">${out.join('')}</div>`; }
const LEVELS=[[0,'訪客 guest'],[150,'一般 user'],[400,'會用 man 的人'],[800,'sudoer'],[1400,'實習 SA'],[2200,'系統管理員'],[3200,'資深 SA'],[4500,'root'],[6500,'kernel 大師'],[9000,'傳說中的 SA']];
function lvl(){ let i=0; while(i+1<LEVELS.length&&S.xp>=LEVELS[i+1][0]) i++; const cur=LEVELS[i], nx=LEVELS[i+1]; return {i:i+1,name:cur[1],p:nx?(S.xp-cur[0])/(nx[0]-cur[0]):1,next:nx?nx[0]:null}; }

