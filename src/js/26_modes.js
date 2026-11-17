/* ---------- FLASHCARDS ---------- */
VIEWS.flashpick=()=>{
  const learned=CLIST.filter(c=>cardStarted(c)||S.c[c.id]?.v);
  return topbar('快閃卡')+`<div class="small muted" style="margin-bottom:var(--space-sm)">看標題先在心裡回想「比喻是什麼、重點有哪些」，再翻面對答案。標記「忘了」的卡，相關題目會立刻排進複習。</div>
  <button class="chrow" data-act="flash" data-scope="smart"><span class="ic-tile">${icon('star')}</span><span class="grow"><span class="t" style="display:block">智慧推薦 12 張</span><span class="d">優先：弱的、快忘的、已學過的</span></span>${icon('right')}</button>
  <button class="chrow" data-act="flash" data-scope="learned" ${learned.length?'':'disabled'}><span class="ic-tile">${icon('book')}</span><span class="grow"><span class="t" style="display:block">已學過的卡（${learned.length}）</span><span class="d">隨機順序</span></span>${icon('right')}</button>
  <div class="sec">依章節</div>
  ${CH.map(ch=>`<button class="chrow" data-act="flash" data-scope="ch:${ch.id}">${chTag(ch,'lg')}<span class="grow"><span class="t" style="display:block">${esc(ch.t)}</span><span class="d">${ch.cards.length} 張</span></span>${icon('right')}</button>`).join('')}`;
};
function startFlash(scope){
  let cards;
  if(scope==='smart'){
    const w=weakCards(6).map(x=>x.c);
    const learned=shuffle(CLIST.filter(c=>cardStarted(c)&&!w.includes(c))).sort((a,b)=>cardMastery(a)-cardMastery(b));
    cards=[...w,...learned].slice(0,12);
    if(cards.length<12){ const nn=nextNewQs(12-cards.length).map(x=>x.card).filter(c=>!cards.includes(c)); cards=cards.concat(nn); }
  } else if(scope==='starred'){ cards=shuffle(starredCards()); }
  else if(scope==='learned'){ cards=shuffle(CLIST.filter(c=>cardStarted(c)||S.c[c.id]?.v)).slice(0,20); }
  else { cards=CHMAP[scope.slice(3)].cards.slice(); }
  if(!cards.length){ toast('這裡還沒有卡片'); return; }
  go('flash',{cards:cards.map(c=>c.id),i:0,flip:false,stat:[0,0,0]});
}
/* ---------- STARRED CARDS ---------- */
function starredCards(){ return CLIST.filter(c=>S.bm[c.id]?.on); }
VIEWS.starred=()=>{
  const all=starredCards(), sort=VIEW.sort||'recent';
  const nq=all.reduce((n,c)=>n+c.q.filter(q=>q.k!=='sa').length,0);
  const row=c=>`<div class="star-row">${cardRow(c)}<button class="iconbtn sm on" data-act="bm" data-c="${c.id}" aria-label="取消收藏：${esc(c.t.replace(/[*`]/g,''))}">${icon('star')}</button></div>`;
  let list;
  if(!all.length) list=`<div class="card"><div class="empty">還沒有收藏。看觀念卡時按右上角的星號，就會出現在這裡。</div></div>`;
  else if(sort==='chapter'){ list=CH.map(ch=>{ const cs=all.filter(c=>c.ch===ch); return cs.length?`<div class="sec">${chTag(ch)} ${esc(ch.t)}<span class="note">${cs.length} 張</span></div><div class="card">${cs.map(row).join('')}</div>`:''; }).join(''); }
  else { const cs=all.slice().sort((a,b)=>(S.bm[b.id].t||0)-(S.bm[a.id].t||0)); list=`<div class="card">${cs.map(row).join('')}</div>`; }
  return topbar('收藏的卡')+`<div class="small muted" style="margin-bottom:var(--space-sm)">你按了星號的觀念卡都在這裡。點卡片看內容，點星號取消收藏。</div>
  ${all.length?`<div class="row wrap" style="margin-bottom:var(--space-sm)"><button class="btn pri grow" data-act="flash" data-scope="starred">${icon('cards')} 快閃 ${all.length} 張</button><button class="btn grow" data-act="starquiz" ${nq?'':'disabled'}>${icon('play')} 用收藏出題</button></div>
  <div class="seg" role="tablist"><button role="tab" aria-selected="${sort==='recent'}" class="${sort==='recent'?'on':''}" data-act="starsort" data-s="recent">最近收藏</button><button role="tab" aria-selected="${sort==='chapter'}" class="${sort==='chapter'?'on':''}" data-act="starsort" data-s="chapter">依章節</button></div>`:''}
  ${list}`;
};
VIEWS.flash=()=>{
  const V=VIEW; if(V.i>=V.cards.length){ return topbar('快閃卡完成')+`<div class="card center">${mascot('happy')}<div class="h1 mt-xs">翻完 ${V.cards.length} 張！</div><div class="stats"><span class="chip g">記得 ${V.stat[2]}</span><span class="chip y">模糊 ${V.stat[1]}</span><span class="chip r">忘了 ${V.stat[0]}</span></div>${V.stat[0]?'<div class="small muted mt-sm">忘了的卡，相關題目已排進今日複習。</div>':''}</div><div class="dock"><div><button class="btn" data-act="home">回首頁</button><button class="btn pri" data-act="daily">去做今日任務</button></div></div>`; }
  const c=CARD[V.cards[V.i]];
  const front=`<div class="card flash"><button class="face" data-act="flip"><span class="cmeta">${chTag(c.ch)}<span>${esc(c.ch.t)}</span></span><span class="h1 big">${md(c.t)}</span><span class="muted small">先在心裡回想：比喻？重點？指令？</span><span class="chip b mt-lg">點一下翻面</span></button></div>`;
  const backF=`<div class="card">${conceptHTML(c)}</div><div class="sp-dock"></div>${RATE_DOCK('frate')}`;
  return topbar('快閃卡',`<span class="combo small">${V.i+1}/${V.cards.length}</span>`)+(V.flip?backF:front);
};

/* ---------- TERMINAL DRILL ---------- */
VIEWS.termpick=()=>{
  const all=QLIST.filter(q=>q.k==='cmd'); const dueC=dueList(q=>q.k==='cmd').length;
  return topbar('終端機特訓')+`<div class="term" style="margin-bottom:var(--space-md)"><div class="out ok">$ whoami</div><div class="out">future_root</div><div class="out ok">$ cat mission.txt</div><div class="out">把每個任務翻譯成一行指令。打出來，記憶最牢。</div></div>
  <button class="chrow" data-act="term" data-scope="smart"><span class="ic-tile">${icon('star')}</span><span class="grow"><span class="t" style="display:block">混合特訓 8 題</span><span class="d">到期的指令題 ${dueC} 題優先，再補新題</span></span>${icon('right')}</button>
  <div class="sec">依章節</div>
  ${CH.map(ch=>{ const n=all.filter(q=>q.card.ch===ch).length; return n?`<button class="chrow" data-act="term" data-scope="ch:${ch.id}">${chTag(ch,'lg')}<span class="grow"><span class="t" style="display:block">${esc(ch.t)}</span><span class="d">${n} 題指令</span></span>${icon('right')}</button>`:''; }).join('')}`;
};
function startTerm(scope){
  let pool=QLIST.filter(q=>q.k==='cmd'&&(scope==='smart'||q.card.ch.id===scope.slice(3)));
  const due=pool.filter(q=>{ const s=S.q[q.id]; return s&&s.n&&s.d<=now(); });
  const un=pool.filter(q=>!seen(q.id));
  const rest=shuffle(pool.filter(q=>seen(q.id)&&!due.includes(q))).sort((a,b)=>qMastery(a.id)-qMastery(b.id));
  const pick=[...shuffle(due),...un,...rest].slice(0,8);
  startRun(pick.map(q=>({t:'q',id:q.id,nw:!seen(q.id)})),{mode:'term'});
}

/* ---------- BLITZ ---------- */
let BLZ=null;
function startBlitz(){
  let pool=QLIST.filter(q=>(q.k==='tf'||q.k==='mc')&&(cardStarted(q.card)||S.c[q.card.id]?.v));
  if(pool.length<20) pool=QLIST.filter(q=>(q.k==='tf'||q.k==='mc')&&CH.indexOf(q.card.ch)<4);
  BLZ={pool:shuffle(pool),i:0,score:0,combo:0,end:now()+60000,wrong:[],tm:null,done:false,cnt:0,ok:0,start:false,order:null};
  go('blitz');
}
function stopBlitz(){ if(BLZ&&BLZ.tm){ clearInterval(BLZ.tm); BLZ.tm=null; } }
VIEWS.blitz=()=>{
  const B=BLZ; if(!B) return VIEWS.home();
  if(!B.start) return topbar('60 秒閃電戰')+`<div class="card center"><div class="blzmark">${icon('bolt')}</div><div class="h1 mt-xs">60 秒，能答對幾題？</div><div class="small muted mt-xs">是非題與選擇題快問快答。連續答對 3 題分數 ×2、6 題 ×3。答錯的題會排進複習。</div><div class="chip y mt-sm">最高紀錄 ${S.best.blitz||0}</div></div><div class="dock"><div><button class="btn pri" data-act="blzgo">開始！</button></div></div>`;
  if(B.done){ const rec=B.score>=(B.prevBest||0)&&B.score>0;
    return topbar('時間到')+`<div class="card center">${mascot(rec?'happy':'idle')}<div class="h1 big mt-xs">${B.score} 分</div><div class="small muted">${B.ok}/${B.cnt} 答對${rec?'，新紀錄！':''}</div></div>
    ${B.wrong.length?`<div class="card"><div class="h2">答錯的題</div>${B.wrong.map(id=>{ const q=Q[id]; return `<div class="wrongrow"><div style="font-weight:700">${md(q.q)}</div><div class="small okline mt-2xs">${icon('check')}<span>${q.k==='tf'?(q.a?'對':'錯'):md(q.o[q.a])}</span></div>${q.e?`<div class="small muted mt-2xs">${md(q.e)}</div>`:''}</div>`; }).join('')}</div>`:''}
    <div class="sp-dock"></div><div class="dock"><div><button class="btn" data-act="home">回首頁</button><button class="btn pri" data-act="blitz">再一場</button></div></div>`; }
  const q=B.pool[B.i%B.pool.length]; if(!B.order||B.order.q!==q.id) B.order={q:q.id,o:q.k==='mc'?shuffle(q.o.map((_,i)=>i)):null};
  const left=Math.max(0,B.end-now());
  const mult=B.combo>=6?3:B.combo>=3?2:1;
  const opts=q.k==='tf'?`<div class="tf"><button class="opt" data-act="blz" data-v="1">${icon('ring')}<span>對</span></button><button class="opt" data-act="blz" data-v="0">${icon('x')}<span>錯</span></button></div>`
    :`<div class="opts">${B.order.o.map((oi,j)=>`<button class="opt" data-act="blz" data-v="${oi}"><span class="k">${'ABCDEF'[j]}</span><span>${md(q.o[oi])}</span></button>`).join('')}</div>`;
  return `<div class="topbar"><button class="back" data-act="back" aria-label="離開">${icon('x')}</button><div class="grow"><div class="timer" role="timer" aria-label="剩餘時間"><i id="blzt" style="--v:${(left/60000).toFixed(3)}"></i></div></div><span class="combo">${B.score} 分</span></div>
  <div class="row between" style="margin-bottom:var(--space-xs)"><span class="cmeta">${icon(KIND_IC[q.k])} ${chTag(q.card.ch)} ${md(q.card.t)}</span>${B.combo>=2?`<span class="combo">${icon('flame')} ${B.combo} 連擊 ×${mult}</span>`:''}</div>
  <div class="card ${B.anim||''}" id="blzc"><h2 class="qtext">${md(q.q)}</h2>${q.x?`<pre class="code">${esc(q.x.join('\n'))}</pre>`:''}${opts}</div>`;
};
AFTER.blitz=()=>{ const B=BLZ; if(!B||!B.start||B.done) return; B.anim='';
  if(!B.tm) B.tm=setInterval(()=>{ const left=B.end-now(); const el=$('#blzt'); if(el) el.style.setProperty('--v',Math.max(0,left/60000).toFixed(3)); if(left<=0){ stopBlitz(); endBlitz(); } },250); };
function endBlitz(){ const B=BLZ; B.done=true; B.prevBest=S.best.blitz||0; if(B.score>(S.best.blitz||0)){ S.best.blitz=B.score; } const xp=Math.round(B.score/2); S.xp+=xp; const D=S.days[today()]||(S.days[today()]={n:0,c:0,x:0,nw:0}); D.x+=xp; save(); if(B.score>B.prevBest&&B.score>0) confetti(); if(VIEW.name==='blitz') render(); }
function blzAnswer(v){
  const B=BLZ; if(!B||B.done) return; const q=B.pool[B.i%B.pool.length];
  const ok = q.k==='tf' ? ((v==='1')===q.a) : (+v===q.a);
  B.cnt++;
  sfx(ok?'ok':'no',B.combo); if(ok){ B.combo++; B.ok++; B.score+= (B.combo>=6?3:B.combo>=3?2:1); B.anim='pop'; vibrate(8);
    const s=S.q[q.id]; if(!s||!s.n||s.d<=now()) grade(q.id,2,{xp:3}); }
  else { B.combo=0; B.anim='shake'; vibrate([20,40,20]); if(!B.wrong.includes(q.id)) B.wrong.push(q.id); grade(q.id,0,{xp:0}); }
  B.i++; render();
}

/* ---------- EXAM DOJO ---------- */
function examGroups(){ const g={}; for(const q of QLIST){ if(q.k==='sa'&&!q.src){ (g['模擬題']||(g['模擬題']=[])).push(q); continue; } if(!q.src) continue; const k=q.src.replace(/\s*(Q\d.*|Part.*)$/,'').trim(); (g[k]||(g[k]=[])).push(q); }
  for(const k in g) g[k].sort((a,b)=>{ if(!a.src||!b.src) return CH.indexOf(a.card.ch)-CH.indexOf(b.card.ch); const na=parseInt((a.src.match(/Q(\d+)/)||[])[1]||0), nb=parseInt((b.src.match(/Q(\d+)/)||[])[1]||0); return na-nb; });
  return Object.entries(g).sort((a,b)=>(a[0]==='模擬題')-(b[0]==='模擬題')||b[0].localeCompare(a[0])); }
VIEWS.exam=()=>{
  const groups=examGroups(); const tab=VIEW.tab||groups[0][0];
  const list=(groups.find(g=>g[0]===tab)||groups[0])[1];
  const st=q=>{ const s=S.q[q.id]; if(!s||!s.n) return '<span class="chip">未作答</span>'; if(q.k==='sa'&&s.sb!=null) return `<span class="chip ${s.sb>=0.8?'g':s.sb>=0.4?'y':'r'}">最佳 ${Math.round(s.sb*100)}%</span>`; const m=qMastery(q.id); return m>=0.6?'<span class="chip g">已掌握</span>':m>=0.3?'<span class="chip y">再練練</span>':'<span class="chip r">待加強</span>'; };
  const done=list.filter(q=>seen(q.id)).length;
  return topbar('考古題道場')+`<div class="small muted" style="margin-bottom:var(--space-sm)">這位教授的筆試以「簡答 + 解釋原因」為主。先寫下答案再對照得分點：系統會依關鍵字先幫你勾一次，你再自己確認${aiOn()?'，或請 Claude 逐點批改':''}。「模擬題」是依今年簡報與作業出的簡答題。</div>
  <div class="seg" role="tablist">${groups.map(g=>`<button role="tab" aria-selected="${g[0]===tab}" class="${g[0]===tab?'on':''}" data-act="examtab" data-tab="${esc(g[0])}">${esc(g[0])}</button>`).join('')}</div>
  <div class="row between" style="margin:var(--space-sm) 0 var(--space-xs)"><span class="small muted">完成 ${done}/${list.length}</span><button class="btn sm pri" data-act="examrun" data-tab="${esc(tab)}">隨機考我 5 題</button></div>
  <div class="card">${list.map(q=>`<button class="li" data-act="examone" data-q="${q.id}"><span class="grow"><span class="t" style="display:block">${md(q.q.length>70?q.q.slice(0,70)+'…':q.q)}</span><span class="m">${esc(q.src||'模擬題')}<span class="sep"></span>${KIND[q.k]}<span class="sep"></span>${chTag(q.card.ch)} ${esc(q.card.ch.t)}</span></span>${st(q)}</button>`).join('')}</div>`;
};

/* ---------- RADAR ---------- */
function radarSVG(){
  const n=CH.length, cx=150, cy=150, R=105;
  const pts=CH.map((ch,i)=>{ const a=-Math.PI/2+i*2*Math.PI/n; const m=chMastery(ch); return {a,m,ch}; });
  const poly=pts.map(p=>`${cx+Math.cos(p.a)*R*Math.max(0.03,p.m)},${cy+Math.sin(p.a)*R*Math.max(0.03,p.m)}`).join(' ');
  const rings=[0.25,0.5,0.75,1].map(r=>`<polygon points="${pts.map(p=>`${cx+Math.cos(p.a)*R*r},${cy+Math.sin(p.a)*R*r}`).join(' ')}" class="rg"/>`).join('');
  const spokes=pts.map(p=>`<line x1="${cx}" y1="${cy}" x2="${cx+Math.cos(p.a)*R}" y2="${cy+Math.sin(p.a)*R}" class="sp"/>`).join('');
  const labels=pts.map(p=>{ const x=cx+Math.cos(p.a)*(R+22), y=cy+Math.sin(p.a)*(R+22); return `<text x="${x}" y="${y+4}" text-anchor="middle">${String(CH.indexOf(p.ch)+1).padStart(2,'0')}</text>`; }).join('');
  return `<svg class="radar" viewBox="0 0 300 300" style="width:100%;max-width:320px;margin:0 auto" role="img" aria-label="各章掌握度雷達圖">${rings}${spokes}<polygon points="${poly}" class="poly"/>${labels}</svg>`;
}
VIEWS.radar=()=>{
  const weak=weakCards(10);
  const byK={}; for(const q of QLIST){ const s=S.q[q.id]; if(!s||!s.n) continue; const k=q.k; const b=byK[k]||(byK[k]={n:0,c:0}); b.n+=s.n; b.c+=s.c; }
  const ks=Object.entries(byK).filter(([,b])=>b.n>=3).map(([k,b])=>({k,acc:b.c/b.n})).sort((a,b)=>a.acc-b.acc);
  const worst=ks[0];
  return topbar('盲點雷達')+`<div class="card">${radarSVG()}<div class="tiny muted center mt-2xs">各章掌握度（越外圈越熟）</div>
    <div class="chgrid">${CH.map(ch=>`<div>${chTag(ch)}<span class="n">${esc(ch.t)}</span><b class="num">${pct(chMastery(ch))}%</b></div>`).join('')}</div></div>
  ${worst?`<div class="card alert info"><span class="ic-tile">${icon('search')}</span><div class="grow small">題型分析：你在 <b>${KIND[worst.k]}題</b> 的正確率最低（${pct(worst.acc)}%）。${worst.k==='cmd'?'多用「終端機特訓」把指令打熟。':worst.k==='sa'?'多到「考古題道場」練寫得分點。':worst.k==='mt'||worst.k==='ord'?'這類題考的是概念之間的關係，多用快閃卡比較相近的觀念。':'閃電戰可以幫你練反應。'}</div></div>`:''}
  <div class="sec">你的盲點${weak.length?'<span class="note">Top '+weak.length+'</span>':''}</div>
  ${weak.length?`<div class="card">${weak.map(w=>`<div class="li" style="align-items:flex-start"><span class="dot l1" style="margin-top:var(--space-xs)"></span><span class="grow"><button class="t" data-act="card" data-c="${w.c.id}">${md(w.c.t)}</button><span class="m">${chTag(w.c.ch)} ${esc(w.why.join('、'))}</span><span class="row mt-xs"><button class="btn sm warn" data-act="rescue" data-c="${w.c.id}">救援</button>${aiOn()?`<button class="btn sm" data-act="aiexplain" data-c="${w.c.id}">${icon('spark')} 換個講法</button>`:''}</span></span></div>`).join('')}</div>
  <div class="sp-dock"></div><div class="dock"><div><button class="btn pri" data-act="weakrun">${icon('target')} 盲點特訓 ${Math.min(S.set.size,weak.length*2)} 題</button></div></div>`
  :`<div class="card empty">目前沒有明顯的盲點。多做幾回合，我會記下你答錯、猶豫、快忘記的觀念。</div>`}`;
};

