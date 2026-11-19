/* ---------- PRACTICE RUN ENGINE ---------- */
/* item: {t:'learn', c} | {t:'q', id, re?} */
function startRun(items,meta={}){
  if(!items.length){ toast('目前沒有可以練的題目 (・_・)'); return; }
  RUN={items,pos:0,active:true,meta,res:[],xp:0,startT:now(),newCards:0,requeued:{},answered:false,st:{}};
  go('run',{},true);
}
/* Endless stream: one tap (or zero — the app opens straight into it) and it never needs a menu.
   Each batch mixes: memories about to fade (lowest retrievability first) → a new concept with its
   first questions → more reviews → every 3rd batch a free-recall card → every 4th a double-XP speed burst. */
function startFeed(){
  RUN={items:[],pos:0,active:true,meta:{mode:'feed'},res:[],xp:0,startT:now(),newCards:0,requeued:{},st:{t0:now()},endless:true,used:new Map(),recalled:new Set(),batch:0,combo:0,sinceChest:0};
  STACK.length=0; STACK.push({name:'home'}); VIEW={name:'run'}; window.scrollTo(0,0); render();
}
function feedFill(){
  const R=RUN, out=[];
  // 'used' only blocks repeats within the last 12 items, so lapses can come back later in a long session
  const used={has:id=>R.used.has(id)&&(R.items.length+out.length-R.used.get(id))<18, add:id=>R.used.set(id,R.items.length+out.length), clear:()=>R.used.clear()};
  const due=dueList(q=>!used.has(q.id));
  const rev=[]; let sa=0;
  for(const q of due){ if(rev.length>=3) break; if(q.k==='sa'&&sa++) continue; rev.push(q); used.add(q.id); }
  const PC=pace(), behind=PC?PC.behind:0;
  const wantNew=behind>0?2:due.length<6?2:(due.length<30||R.batch%2===0)?1:0;
  const blocks=[]; let newL=wantNew?nextNewQs(wantNew+3,{fresh:1}):[]; if(wantNew&&newL.length<wantNew) newL=newL.concat(nextNewQs(wantNew+6));
  if(wantNew) for(const L of newL){ if(blocks.length>=wantNew) break; const qsL=L.qs.filter(q=>!used.has(q.id)&&q.k!=='sa'); if(!qsL.length) continue;
    const b=[]; if(!cardStarted(L.card)) b.push({t:'learn',c:L.card.id}); for(const q of qsL){ b.push({t:'q',id:q.id,nw:1}); used.add(q.id); } blocks.push(b); }
  if(rev.length+blocks.length<2){ const t=now(); for(const q of QLIST.filter(q=>seen(q.id)&&!used.has(q.id)&&q.k!=='sa').sort((a,b)=>retr(S.q[a.id],t)-retr(S.q[b.id],t)).slice(0,4)){ rev.push(q); used.add(q.id); } }
  rev.slice(0,2).forEach(q=>out.push({t:'q',id:q.id}));
  if(blocks[0]) out.push(...blocks[0]);
  rev.slice(2).forEach(q=>out.push({t:'q',id:q.id}));
  if(blocks[1]) out.push(...blocks[1]);
  if(R.batch>=1&&!R.saGiven&&!((S.days[today()]||{}).sa)){ const q=dailySA(used); if(q){ out.push({t:'q',id:q.id,daily:1}); used.add(q.id); R.saGiven=1; } }
  if(R.batch%3===2){ const c=CLIST.filter(c=>cardStarted(c)&&!R.recalled.has(c.id)).sort((a,b)=>(S.c[a.id]?.rt||0)-(S.c[b.id]?.rt||0)||cardMastery(a)-cardMastery(b))[0]; if(c){ R.recalled.add(c.id); out.push({t:'recall',c:c.id}); } }
  if(R.batch%4===3){ const t=now(); const pool=QLIST.filter(q=>(q.k==='tf'||q.k==='mc')&&seen(q.id)&&!used.has(q.id)).sort((a,b)=>retr(S.q[a.id],t)-retr(S.q[b.id],t)).slice(0,4); if(pool.length>=3) for(const q of pool){ out.push({t:'q',id:q.id,fast:1}); used.add(q.id); } }
  if(!out.length){ used.clear(); for(const q of shuffle(QLIST.filter(q=>q.k!=='sa')).slice(0,5)){ out.push({t:'q',id:q.id}); used.add(q.id); } }
  R.batch++; R.items.push(...out);
}
/* One written answer a day inside the main stream: past-exam questions first, then never-tried, then lowest best score. */
function dailySA(used){
  const pool=QLIST.filter(q=>q.k==='sa'&&!used.has(q.id)&&q.card.q.filter(x=>x.k!=='sa').every(x=>seen(x.id)));
  return pool.sort((a,b)=>{ const x=S.q[a.id]||{}, y=S.q[b.id]||{}; return ((x.n?1:0)-(y.n?1:0))||((b.src?1:0)-(a.src?1:0))||((x.sb||0)-(y.sb||0))||((x.t||0)-(y.t||0)); })[0];
}
/* Stubborn questions: after 4 lapses repetition is not working, so switch method (re-read + write it in your own words). */
function stubborn(q){ const st=S.q[q.id], n=S.c[q.card.id]?.note; return !!(st&&st.l>=(n?(n.l||0)+3:4)); }
function noteLine(c){ const n=S.c[c.id]?.note; return n&&n.s?`<div class="mynote">${icon('pencil')}<span><b>我的筆記</b>　${esc(n.s)}</span></div>`:''; }
function saveNote(cid,text,lapses){ const cc=S.c[cid]||(S.c[cid]={v:0}); cc.note={s:text.slice(0,200),l:lapses!=null?lapses:(cc.note?.l||0),t:now()}; cc.t=now(); save(); }
function memLine(m,g){
  if(g===0) return m.wasNew?'第一次見面就記不住很正常，10 分鐘後再考你一次，這時候複習效果最好':'記憶斷線了。趁還有印象，10 分鐘後再來一次';
  const pre=m.wasNew?'新記憶建立！':(m.el>=1&&m.i0>=1?`隔了 ${Math.round(m.el)} 天、記憶約剩 ${pct(m.R)}% 時成功想起來。`:'');
  return pre+`這個記憶現在可以撐 <b>${fmtDays(m.i1)}</b>`+(m.i0>=1&&m.i1>m.i0*1.05?`（原本 ${fmtDays(m.i0)}）`:'');
}
function buildDaily(){
  const N=S.set.size; const items=[]; const used=new Set();
  const due=dueList(); const learn=nextNewQs(S.set.newPer);
  const learnQ=learn.reduce((a,x)=>a+x.qs.length,0);
  const reserveNew=Math.min(learnQ,Math.max(2,Math.round(N*0.35)));
  let dueTake=Math.min(due.length,Math.max(N-reserveNew, Math.ceil(N*0.6)));
  const dues=due.slice(0,dueTake); dues.forEach(q=>used.add(q.id));
  // weak extras (主動複習) — not yet due but weak
  const weakQ=[]; for(const w of weakCards(4)) for(const q of w.c.q){ if(seen(q.id)&&!used.has(q.id)&&q.k!=='sa') { weakQ.push(q); break; } }
  let room=N-dues.length;
  const weakTake=weakQ.slice(0,Math.min(2,Math.max(0,room-Math.min(learnQ,reserveNew)))); weakTake.forEach(q=>used.add(q.id)); room-=weakTake.length;
  const blocks=[]; let saN=0;
  for(const L of learn){ if(room<=0) break; const qsL=L.qs.filter(q=>q.k!=='sa'||saN++<1); if(!qsL.length) continue;
    const blk=[]; if(!cardStarted(L.card)) blk.push({t:'learn',c:L.card.id});
    for(const q of qsL){ if(room<=0) break; blk.push({t:'q',id:q.id,nw:1}); used.add(q.id); room--; }
    blocks.push(blk); }
  // more due if still room
  for(const q of due) if(room>0&&!used.has(q.id)){ dues.push(q); used.add(q.id); room--; }
  // still room: review lowest mastery seen questions
  if(room>0){ const pool=QLIST.filter(q=>seen(q.id)&&!used.has(q.id)&&q.k!=='sa').sort((a,b)=>qMastery(a.id)-qMastery(b.id)); for(const q of pool){ if(room<=0) break; dues.push(q); used.add(q.id); room--; } }
  // interleave: reviews shuffled, learn blocks inserted evenly
  const rev=shuffle([...dues,...weakTake]).map(q=>({t:'q',id:q.id}));
  const out=[]; const gap=blocks.length?Math.max(1,Math.floor(rev.length/(blocks.length+1))):0; let bi=0;
  rev.forEach((it,i)=>{ out.push(it); if(bi<blocks.length&&(i+1)%gap===0){ out.push(...blocks[bi++]); } });
  while(bi<blocks.length) out.push(...blocks[bi++]);
  return out;
}
VIEWS.run=()=>{
  const R=RUN; if(!R) return VIEWS.home();
  if(R.endless&&R.pos>=R.items.length) feedFill();
  if(R.pos>=R.items.length) return summaryHTML();
  const it=R.items[R.pos];
  let head;
  if(R.boss){ head=battleHead(R); }
  else if(R.endless){ const D=S.days[today()]||{n:0}, g=S.set.goal;
    head=`<div class="topbar"><button class="back" data-act="hub" aria-label="回主頁">${icon('menu')}</button><div class="grow"><div class="bar"><i style="--v:${Math.min(1,D.n/g).toFixed(3)}"></i></div><div class="tiny muted mt-2xs">${D.n>=g?'今日目標達成，加碼 '+(D.n-g)+' 題':'今日 '+D.n+' / '+g}</div></div>${R.combo>=2?`<span class="combo">連對 ${R.combo}</span>`:''}<span class="chip y" aria-label="連續 ${streak()} 天">${icon('flame')} ${streak()}</span></div>`;
  } else {
    const dots=R.items.map((x,i)=>`<i class="${i<R.pos?(R.res[i]===0?'bad':'done'):i===R.pos?'cur':''}"></i>`).join('');
    head=`<div class="topbar"><button class="back" data-act="back" aria-label="離開">${icon('x')}</button><div class="prog" aria-label="第 ${R.pos+1} 題，共 ${R.items.length} 題">${dots}</div><span class="combo small">+${R.xp}</span></div>`;
  }
  if(it.t==='learn'){ const c=CARD[it.c];
    return head+`<div class="card">${conceptHTML(c,{isNew:1})}</div><div class="sp-dock"></div>
      <div class="dock"><div><button class="btn pri" data-act="learnok">讀懂了，考考我 →</button></div></div>`; }
  if(it.t==='recall'){ const c=CARD[it.c];
    return head+(R.st.flip?`<div class="card">${conceptHTML(c)}</div><div class="sp-dock"></div>${RATE_DOCK('rrate')}`
      :`<div class="card flash"><button class="face" data-act="rflip"><span class="chip b">${icon('cards')} 回想挑戰</span><span class="h1 big">${md(c.t)}</span><span class="muted small">不看答案，先在心裡講一遍：比喻？重點？指令？<br>主動回想比重讀一遍更能留住記憶</span><span class="chip mt-lg">點一下翻面對答案</span></button></div>`); }
  if(it.t==='reteach'){ const c=CARD[it.c], sq=S.q[it.q]||{l:0}, old=S.c[c.id]?.note?.s||'';
    return head+`<div class="card alert info"><span class="ic-tile">${icon('repeat')}</span><div class="grow"><div class="h2">換個方法學這張</div><div class="small muted">這題已經錯了 ${sq.l} 次，一直重複出題沒有用。先慢慢讀一次，再用自己的話寫一句重點。</div></div></div>
    <div class="card">${conceptHTML(c,{nonote:1})}</div>
    <div class="card"><label class="h2" for="mynote">用自己的話寫一句重點</label><div class="small muted mt-2xs">不要照抄。假裝在教同學：這張卡最容易搞錯的是什麼？</div>
    <textarea class="field mt-xs" id="mynote" rows="3" maxlength="200" placeholder="例如：awk 的 $1 是第一欄，-F 指定分隔符號">${esc(old)}</textarea></div><div class="sp-dock"></div>
    <div class="dock"><div class="row"><button class="btn" data-act="noteskip">先跳過</button><button class="btn pri grow" data-act="notesave">存成我的筆記，繼續 →</button></div></div>`; }
  if(it.t==='chest'){
    return head+`<div class="card chest">${mascot('happy',96)}<div class="h1 mt-xs">意外寶箱！</div><div class="muted small">認真作答的隨機獎勵</div><div class="xpbig">+${it.xp} XP</div></div><div class="dock"><div><button class="btn pri" data-act="chestok">收下，繼續 →</button></div></div>`; }
  if(it.t==='goal'){ const tm=QLIST.filter(q=>{ const s=S.q[q.id]; return s&&s.n&&s.d<=now()+DAY; }).length; const D=S.days[today()]||{x:0};
    return head+`<div class="card center">${mascot('happy')}<div class="h1 mt-xs">今日目標達成！</div><div class="stats"><span class="chip y">${icon('flame')} 連續 ${streak()} 天</span><span class="chip g">今天 +${D.x} XP</span></div>${weekRow()}<div class="small mt-md">明天會有 <b>${tm}</b> 個記憶到期。回來接住它們只要幾分鐘，放掉就得重學。</div></div><div class="sp-dock"></div><div class="dock"><div><button class="btn" data-act="hub">今天到這</button><button class="btn pri" data-act="next">再學一點 →</button></div></div>`; }
  const q=Q[it.id];
  return head+questionHTML(q,R.st,{nw:it.nw,re:it.re,fast:it.fast,sk:it.sk})+skipHTML()+`<div class="sp-dock"></div>`+dockHTML();
};
AFTER.run=()=>{ const R=RUN; if(!R||R.pos>=R.items.length){ if(R&&R.active) finishRun(); return; } const it=R.items[R.pos];
  if(it.t!=='q'){ if(it.t==='learn') viewCardOnce(it.c); if(it.t==='goal'&&!it.shown){ it.shown=1; confetti(); sfx('fanfare'); } if(it.t==='chest'&&!it.shown){ it.shown=1; sfx('coin'); } return; }
  afterQuestion(); if(R.boss){ const el=document.querySelector('.utbox .utt'); const line=el&&el.getAttribute('data-full'); if(line&&line!==bossTypewriter.last){ bossTypewriter.last=line; bossTypewriter(); } } };
/* 暫時跳過：不計分、不動排程，把這題移到稍後（一般練習移到最後，無限模式往後 5 題）。魔王戰不能跳。 */
function canSkip(){ const R=RUN, st=R.st; if(!R||R.boss||st.done||(st.log||[]).length) return false;
  return R.endless||R.items.slice(R.pos+1).some(x=>x.t==='q'); }
function skipHTML(){ return canSkip()?`<div class="center mt-sm"><button class="btn sm ghost" data-act="skipq">${icon('repeat')} 先跳過，稍後再答</button></div>`:''; }
function skipQ(){ const R=RUN; if(!canSkip()) return; const it=R.items.splice(R.pos,1)[0]; it.sk=(it.sk||0)+1;
  if(R.endless){ if(R.items.length-R.pos<6) feedFill(); R.items.splice(Math.min(R.items.length,R.pos+5),0,it); } else R.items.push(it);
  R.st={t0:now()}; toast('先跳過，等一下會再出這題'); window.scrollTo(0,0); render(); }
function dockHTML(){
  const R=RUN, st=R.st, q=Q[R.items[R.pos].id];
  if(st.done) return `<div class="dock"><div><button class="btn pri" data-act="next">${R.pos+1>=R.items.length?'看成果':'繼續 →'}</button></div></div>`;
  if(q.k==='ord') return `<div class="dock"><div><button class="btn" data-act="ordreset">重排</button><button class="btn pri" data-act="ordcheck" ${(st.ord||[]).length===q.o.length?'':'disabled'}>確認順序</button></div></div>`;
  if(q.k==='mt') return `<div class="dock"><div><button class="btn pri" data-act="mtcheck" ${Object.keys(st.pairs||{}).length===q.o.length?'':'disabled'}>確認配對</button></div></div>`;
  if(q.k==='cmd'||q.k==='fill') return '';
  if(q.k==='sa'&&!st.reveal) return '';
  if(q.k==='sa'&&st.reveal) return `<div class="dock"><div><button class="btn pri" data-act="sascore">送出自評</button></div></div>`;
  return '';
}
function qHeader(q,o={}){ const c=q.card;
  return `<div class="qmeta"><span class="chip">${icon(KIND_IC[q.k])} ${KIND[q.k]}</span>${o.nw?'<span class="chip b">新題</span>':''}${o.re?'<span class="chip r">再來一次</span>':''}${o.sk?'<span class="chip">剛剛跳過</span>':''}${o.fast?`<span class="chip y">${icon('bolt')} 快問快答 XP×2</span>`:''}${q.src?`<span class="chip y">${icon('scroll')} ${esc(q.src)}</span>`:''}<span class="src">${chTag(c.ch)} ${md(c.t)}</span></div>`; }
const RATE_DOCK=act=>`<div class="dock"><div><button class="btn danger" data-act="${act}" data-r="0">${icon('x')} 忘了</button><button class="btn warn" data-act="${act}" data-r="1">${icon('q')} 模糊</button><button class="btn pri" data-act="${act}" data-r="2">${icon('check')} 記得</button></div></div>`;
function questionHTML(q,st,o={}){
  let body='';
  const code=q.x?`<pre class="code">${esc(q.x.join('\n'))}</pre>`:'';
  if(q.k==='mc'){
    if(!st.order) st.order=shuffle(q.o.map((_,i)=>i));
    body=`<div class="opts">${st.order.map((oi,j)=>{ let cls=''; if(st.done){ cls= oi===q.a?'ok': oi===st.pick?'no':'dim'; } return `<button class="opt ${cls}" data-act="mc" data-i="${oi}" ${st.done?'disabled':''}><span class="k">${'ABCDEF'[j]}</span><span>${md(q.o[oi])}</span></button>`; }).join('')}</div>`;
  } else if(q.k==='tf'){
    const cls=v=>!st.done?'':(v===q.a?'ok':(v===st.pick?'no':'dim'));
    body=`<div class="tf"><button class="opt ${cls(true)}" data-act="tf" data-v="1" ${st.done?'disabled':''}>${icon('ring')}<span>對</span></button><button class="opt ${cls(false)}" data-act="tf" data-v="0" ${st.done?'disabled':''}>${icon('x')}<span>錯</span></button></div>`;
  } else if(q.k==='cmd'){
    body=`<div class="term" id="term">${(st.log||[]).join('')}${st.done?'':`<div class="ln"><span class="ps1">$</span><input id="ans" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="在這裡輸入指令" aria-label="輸入指令"></div>`}</div>
      ${st.done?'':`<div class="row mt-sm"><button class="btn" data-act="giveup">不會，看答案</button><button class="btn pri grow" data-act="submit">送出 ${icon('enter')}</button></div>`}${!st.done&&q.h&&!st.hint?`<button class="btn sm ghost mt-xs" data-act="hint">${icon('bulb')} 提示</button>`:''}${st.hint&&!st.done?`<div class="hintline">${icon('bulb')}<span>${md(q.h)}</span></div>`:''}`;
  } else if(q.k==='fill'){
    body=st.done?`<div class="field mono done">${esc(st.val||'（空白）')}</div>`:`<input class="field mono" id="ans" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="輸入答案" aria-label="輸入答案"><div class="row mt-sm"><button class="btn" data-act="giveup">不會，看答案</button><button class="btn pri grow" data-act="submit">送出 ${icon('enter')}</button></div>`;
  } else if(q.k==='ord'){
    if(!st.pool) { st.pool=shuffle(q.o.map((_,i)=>i)); if(st.pool.every((v,i)=>v===i)&&q.o.length>1) st.pool.reverse(); st.ord=[]; }
    const placed=st.ord.map((oi,j)=>`<button class="slot ${st.done?(oi===j?'ok':'no'):''}" data-act="ordun" data-j="${j}" ${st.done?'disabled':''}><span class="n">${j+1}</span><span>${md(q.o[oi])}</span></button>`).join('');
    const pool=st.pool.filter(oi=>!st.ord.includes(oi)).map(oi=>`<button class="opt" data-act="ordpick" data-i="${oi}"><span>${md(q.o[oi])}</span></button>`).join('');
    body=`<div class="small muted" style="margin-bottom:var(--space-xs)">依序點選，放進下面的順序</div><div class="slots">${placed||'<span class="tiny muted">（尚未放入）</span>'}</div>${st.done?'':`<div class="pool">${pool}</div>`}`;
    if(st.done&&!st.ok) body+=`<div class="small mt-sm"><b>正確順序：</b><ol style="margin:var(--space-2xs) 0;padding-left:var(--space-lg)">${q.o.map(x=>`<li>${md(x)}</li>`).join('')}</ol></div>`;
  } else if(q.k==='mt'){
    if(!st.right){ st.right=shuffle(q.o.map((_,i)=>i)); if(st.right.every((v,i)=>v===i)&&q.o.length>1) st.right.push(st.right.shift()); st.pairs={}; }
    const pairOf=Object.fromEntries(Object.entries(st.pairs).map(([l,r])=>[r,l]));
    const left=q.o.map((p,i)=>{ const pr=st.pairs[i]; let cls=pr!=null?'paired':''; if(st.done) cls+= (q.o[pr]?.[1]===p[1])?' ok':' no'; if(st.sel===i) cls+=' sel';
      return `<button class="mtc ${cls}" data-act="mtl" data-i="${i}" ${st.done?'disabled':''}>${pr!=null?`<span class="tag">${i+1}</span>`:''}${md(p[0])}</button>`; }).join('');
    const right=st.right.map(ri=>{ const l=pairOf[ri]; let cls=l!=null?'paired':''; return `<button class="mtc ${cls}" data-act="mtr" data-i="${ri}" ${st.done?'disabled':''}>${l!=null?`<span class="tag">${+l+1}</span>`:''}${md(q.o[ri][1])}</button>`; }).join('');
    body=`<div class="small muted" style="margin-bottom:var(--space-xs)">先點左邊，再點右邊配成一對；點已配對的左邊可取消</div><div class="mt"><div class="col">${left}</div><div class="col">${right}</div></div>`;
    if(st.done&&!st.ok) body+=`<div class="small mt-sm"><b>正確配對：</b>${q.o.map(p=>`<div class="mt-2xs">${md(p[0])} → <b>${md(p[1])}</b></div>`).join('')}</div>`;
  } else if(q.k==='sa'){
    body=st.reveal?`${st.val?`<div class="small muted">你的答案</div><div class="ref well" style="margin:var(--space-2xs) 0 var(--space-sm)">${esc(st.val)}</div>`:''}
      ${st.ai?`<div class="fb ${st.ai.score>=80?'ok':st.ai.score>=45?'mid':'no'}" style="box-shadow:none"><div class="ttl">${icon('spark')} Claude 評分：${st.ai.score} / 100</div><div class="ai">${mdBlock(st.ai.feedback||'')}</div></div>`:''}
      ${st.aiLoading?`<div class="fb" style="box-shadow:none" role="status"><span class="spin"></span> Claude 批改中…</div>`:''}
      <div class="sec">參考答案</div><div class="ref well">${mdBlock(q.a)}</div>
      <div class="sec">得分點<span class="note">勾選你有答到的</span></div>${q.p.map((p,i)=>`<button class="check ${st.hit&&st.hit[i]?'on':''}" data-act="sahit" data-i="${i}" role="checkbox" aria-checked="${!!(st.hit&&st.hit[i])}"><span class="bx">${st.hit&&st.hit[i]?icon('check'):''}</span><span>${md(p)}</span>${st.auto&&st.auto[i]?'<span class="auto">關鍵字命中</span>':''}</button>`).join('')}${st.auto&&!st.ai?'<div class="tiny muted mt-2xs">已依關鍵字自動勾選，意思不對的請取消、漏判的請補勾</div>':''}`
      :`<textarea class="field" id="ans" aria-label="你的答案" placeholder="先用自己的話寫寫看（也可以只在心裡回想，直接看答案）">${esc(st.val||'')}</textarea><div class="tiny muted mt-2xs">${q.p.length} 個得分點。閉書作答，用自己的話寫出「是什麼」和「為什麼」</div><div class="row mt-sm">${aiOn()?`<button class="btn" data-act="sasubmit">${icon('check')} 送出並對答案</button><button class="btn pri grow" data-act="saai">${icon('spark')} Claude 批改</button>`:`<button class="btn pri grow" data-act="sasubmit">${icon('check')} 送出並對答案</button>`}</div><button class="btn sm ghost mt-xs" data-act="sareveal">想不出來，直接看答案</button>`;
  }
  let fb='';
  if(st.done&&q.k!=='sa'){
    const good=st.ok, mid=st.mid;
    const title=good?pickLine('ok'):mid?'差一點點！':pickLine('no');
    let extra='';
    if(q.k==='cmd'||q.k==='fill'){ extra=`<div class="small mt-2xs"><b>參考答案：</b>${q.a.slice(0,3).map(a=>`<code>${esc(a)}</code>`).join(' 或 ')}</div>`; }
    if(q.k==='tf') extra=`<div class="small mt-2xs">正確答案：<b>${q.a?'對':'錯'}</b></div>`;
    fb=`<div class="fb ${good?'ok':mid?'mid':'no'}" role="status"><div class="ttl">${mascot(good?'happy':'care',44)}<span class="grow">${title}</span>${st.xp?`<span class="chip g">+${st.xp} XP</span>`:''}</div>${st.mem?`<div class="mem">${icon('heart')}<span>${st.mem}</span></div>`:''}${extra}${q.e?`<div class="small mt-2xs">${md(q.e)}</div>`:''}${noteLine(q.card)}
      ${(!good&&(q.k==='cmd'||q.k==='fill'))&&!st.override?`<button class="btn sm ghost mt-xs" data-act="override">我的寫法其實也對</button>`:''}
      ${!good?`<details><summary>${icon('search')} 回顧觀念卡：${md(q.card.t)}</summary><div class="mt-xs">${conceptHTML(q.card,{nobm:1})}</div></details>${aiOn()?`<button class="btn sm mt-sm" data-act="aiwhy">${icon('spark')} 為什麼我錯了？換個方式講</button>`:''}`:''}
      <div id="aiout"></div></div>`;
  }
  return `<div class="card ${st.anim||''}"><h2 class="qtext">${md(q.q)}</h2>${qHeader(q,o)}${code}${body}</div>${fb}`;
}
const LINES={ok:['答對了！','漂亮 (・ω・)','好耶，記住了','完全正確！','穩穩的','就是這樣！'],no:['沒關係，這題本來就容易混','差一點點，我陪你再看一次','錯過一次，反而記得更牢','先記下來，等等我們再挑戰','別擔心，慢慢來']};
function pickLine(k){ const a=LINES[k]; return a[Math.random()*a.length|0]; }
function afterQuestion(){
  const R=RUN, q=Q[R.items[R.pos].id], st=R.st;
  const inp=$('#ans');
  if(inp&&!st.done){
    if(q.k!=='sa'){ setTimeout(()=>{ try{ inp.focus({preventScroll:true}); }catch(e){} },60); inp.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); submitTyped(); } }; }
    else { inp.oninput=()=>{ st.val=inp.value; }; }
  }
  st.anim='';
}
function blurInput(){ try{ const a=document.activeElement; if(a&&a.blur&&/INPUT|TEXTAREA/.test(a.tagName)) a.blur(); }catch(e){} }
function submitTyped(){
  const R=RUN, q=Q[R.items[R.pos].id], st=R.st; const v=($('#ans')?.value||'').trim(); if(v) blurInput();
  if(!v){ toast('先輸入答案，或按「不會，看答案」'); return; }
  st.val=v;
  const ok = q.k==='cmd'?cmdMatch(v,q.a):fillMatch(v,q.a);
  if(q.k==='cmd'){ st.log=(st.log||[]).concat(`<div class="ln"><span class="ps1">$</span><span>${esc(v)}</span></div><div class="out ${ok?'ok':'no'}">${ok?'[  OK  ] 指令正確':'[FAILED] command not quite right'}</div>`); }
  answer(ok?(st.hint?1:2):0, ok);
}
function answer(g,ok,mid){
  const R=RUN, st=R.st, it=R.items[R.pos], q=Q[it.id];
  st.done=true; st.ok=ok; st.mid=mid; st.g=g;
  const fast=(now()-(st.t0||now()))<5000;
  const gg=(ok&&g===2&&fast&&(q.k==='tf'||q.k==='mc')&&seen(q.id))?3:g;
  R.combo=ok?(R.combo||0)+1:0;
  const want=g>=2?(10+Math.min(10,(R.combo-1)*2))*(it.fast?2:1):g===1?5:2;
  const xp=grade(q.id,gg,{xp:want});
  st.xp=xp; st.mem=memLine(grade.last,g);
  R.xp+=xp; R.res[R.pos]=g;
  st.anim=ok?'pop':'shake'; vibrate(ok?12:[20,40,20]); sfx(ok?'ok':mid?'mid':'no',R.combo-1);
  if(R.boss) bossOnAnswer(R,g,ok);
  if(g===0&&!R.boss&&!R.retaught?.[q.card.id]&&stubborn(q)){ (R.retaught||(R.retaught={}))[q.card.id]=1; R.items.splice(R.pos+1,0,{t:'reteach',c:q.card.id,q:q.id}); }
  if(g===0&&!R.requeued[q.id]){ R.requeued[q.id]=1; if(R.endless&&R.items.length-R.pos<5) feedFill(); const at=Math.min(R.items.length,R.pos+4); R.items.splice(at,0,{t:'q',id:q.id,re:1}); }
  if(R.endless){ if(ok&&R.sinceChest>=6&&Math.random()<0.12){ R.sinceChest=0; R.items.splice(R.pos+1,0,{t:'chest',xp:[15,20,20,25,30,50][Math.random()*6|0]}); } else R.sinceChest++; }
  render();
}
function finishRun(){
  const R=RUN; R.active=false; if(R.boss) return;
  const tot=R.res.filter(x=>x!=null).length, ok=R.res.filter(x=>x>=2).length;
  if(tot&&ok/tot>=0.7) setTimeout(confetti,150);
}
function summaryHTML(){
  const R=RUN; if(R.boss){ bossFinish(R); return bossSummary(R); } const tot=R.res.filter(x=>x!=null).length, ok=R.res.filter(x=>x>=2).length;
  const wrongIds=[...new Set(R.items.filter((it,i)=>it.t==='q'&&R.res[i]===0).map(it=>it.id))];
  const mins=Math.max(1,Math.round((now()-R.startT)/6e4));
  const tomorrow=QLIST.filter(q=>{ const s=S.q[q.id]; return s&&s.n&&s.d<=now()+DAY; }).length;
  const rate=tot?ok/tot:0;
  const msg= rate>=0.9?'太強了，這回合幾乎全對！':rate>=0.7?'表現很穩，錯的題我會幫你排回來複習。':rate>=0.4?'有進步空間，盲點已記下來了。':'這回合比較難，沒關係，錯的題會一直回來找你，直到記住為止。';
  return `<div class="topbar"><h1 class="grow h2">回合結束</h1></div>
  <div class="card center">${mascot(rate>=0.6?'happy':'idle')}<div class="h1 big mt-xs">${ok} / ${tot} 正確</div><div class="muted small mt-2xs">${msg}</div>
    <div class="stats"><span class="chip g">+${R.xp} XP</span><span class="chip">${icon('clock')} ${mins} 分鐘</span><span class="chip y">${icon('flame')} 連續 ${streak()} 天</span></div></div>
  ${wrongIds.length?`<div class="card"><h2 class="h2">這回合的盲點</h2><div class="small muted">它們已排進複習，很快會再出現</div>${[...new Set(wrongIds.map(id=>Q[id].card))].map(cardRow).join('')}</div>`:''}
  <div class="card alert info"><span class="ic-tile">${icon('cal')}</span><div class="grow small">接下來 24 小時內有 <b>${tomorrow}</b> 題到期複習</div></div>
  <div class="sp-dock"></div>
  <div class="dock"><div><button class="btn" data-act="home">回首頁</button><button class="btn pri" data-act="daily">再來一回合</button></div></div>`;
}

