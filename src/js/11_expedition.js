/* ═════════════════════ EXPEDITIONS ═════════════════════
   While you are away the pet explores a chapter. When it returns it brings back the card from
   that chapter you are closest to forgetting (or a new one), sometimes with a small gift. */
const EXP_MIN=150*60000, EXP_SPREAD=60*60000;
function expPickChapter(){
  const started=CH.filter(ch=>ch.cards.some(cardStarted));
  if(!started.length){ const nx=nextNewQs(1)[0]; return nx?nx.card.ch.id:CH[0].id; }
  const w=started.map(ch=>({ch,w:1.2-chMastery(ch)+Math.random()*0.4})).sort((a,b)=>b.w-a.w);
  return w[0].ch.id;
}
function expDepart(){ const ch=expPickChapter(); S.exp={st:'away',ch,t0:now(),back:now()+EXP_MIN+Math.random()*EXP_SPREAD,t:now()}; save(); }
function expResolve(){
  const E=S.exp, ch=CHMAP[E.ch]||CH[0];
  const started=ch.cards.filter(cardStarted);
  let card=null, kind='old';
  if(started.length){ card=started.map(c=>({c,m:cardMastery(c)+Math.random()*0.08})).sort((a,b)=>a.m-b.m)[0].c; }
  else { card=ch.cards.find(c=>!cardStarted(c))||ch.cards[0]; kind='new'; }
  const gift=(S.fz.n<3&&Math.random()<0.15)?{k:'fz'}:{k:'xp',n:[10,15,20,20,25,30][Math.random()*6|0]};
  S.exp=Object.assign({},E,{st:'back',card:card.id,kind,gift,t:now()}); save();
}
function expTick(){
  if(!PROF.cur) return;
  if(!S.exp||!S.exp.st) expDepart();
  else if(S.exp.st==='away'&&now()>=S.exp.back) expResolve();
}
function expLeft(ms){ const m=Math.max(1,Math.round(ms/60000)); return m>=60?`${Math.floor(m/60)} 小時 ${m%60} 分`:`${m} 分鐘`; }
function expPanel(){
  const E=S.exp; if(!E) return '';
  const P=PETS[curPet()], ch=CHMAP[E.ch]; if(!ch) return '';
  if(E.st==='away'){ const tot=E.back-E.t0, done=Math.min(1,(now()-E.t0)/tot);
    return `<div class="card exp"><div class="row"><span class="exp-pet">${mascot(pm('idle'),44)}</span><div class="grow"><div class="h2">${P.name}去探險了</div><div class="small muted">正在 ${chTag(ch)} ${esc(ch.t)} 裡找你快忘記的東西，大約 ${expLeft(E.back-now())}後回來</div></div></div><div class="bar thin mt-sm"><i style="--v:${done.toFixed(3)}"></i></div></div>`; }
  const c=CARD[E.card]; if(!c) return '';
  const gift=E.gift?.k==='fz'?`<span class="chip y">${icon('ice')} 補簽卡 +1</span>`:`<span class="chip y">+${E.gift?.n||10} XP</span>`;
  return `<div class="card exp ret"><div class="row"><span class="exp-pet">${mascot('happy',56)}</span><div class="grow"><div class="h2">${P.name}從 ${esc(ch.t)} 回來了！</div><div class="small">${E.kind==='new'?'它發現了一張你還沒學過的觀念卡：':'它帶回一張你快忘記的卡：'}<b>${md(c.t)}</b></div><div class="row wrap mt-xs">${gift}</div></div></div>
    <button class="btn pri block mt-sm" data-act="expclaim">${icon('box')} 收下並${E.kind==='new'?'學起來':'複習'}</button></div>`;
}
function expClaim(){
  const E=S.exp; if(!E||E.st!=='back') return; const c=CARD[E.card];
  if(E.gift?.k==='fz'){ S.fz.n++; S.fz.t=now(); } else { const n=E.gift?.n||10; S.xp+=n; const D=S.days[today()]||(S.days[today()]={n:0,c:0,x:0,nw:0}); D.x+=n; }
  sfx('coin'); expDepart();
  if(!c) return render();
  const qs=c.q.filter(q=>q.k!=='sa').sort((a,b)=>qMastery(a.id)-qMastery(b.id)).slice(0,2).map(q=>({t:'q',id:q.id,nw:!seen(q.id)}));
  startRun([{t:E.kind==='new'?'learn':'recall',c:c.id},...qs],{mode:'exp'});
}


