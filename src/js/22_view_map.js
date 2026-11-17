/* ---------- MAP / CHAPTER / CARD ---------- */
VIEWS.map=()=>{
  const q=(VIEW.q||'').trim().toLowerCase();
  let list='';
  if(q){
    const hits=CLIST.filter(c=>(c.t+' '+c.b.join(' ')+' '+(c.a||'')+' '+(c.x||[]).join(' ')).toLowerCase().includes(q)).slice(0,40);
    list=`<div class="card">${hits.length?hits.map(cardRow).join(''):'<div class="empty">找不到，換個關鍵字試試（例如 ssh、umask、fstab）</div>'}</div>`;
  } else if(VIEW.bm){
    const hits=CLIST.filter(c=>S.bm[c.id]?.on);
    list=`<div class="card">${hits.length?hits.map(cardRow).join(''):'<div class="empty">還沒有收藏。在觀念卡右上角按星號收藏。</div>'}</div>`;
  } else {
    list=CH.map(ch=>{ const p=chProgress(ch), m=chMastery(ch); const focus=S.set.focus===ch.id;
      return `<button class="chrow" data-act="chapter" data-ch="${ch.id}">${chTag(ch,'lg')}<span class="grow"><span class="t">${esc(ch.t)}</span> ${focus?'<span class="chip g">主線</span>':''}<span class="d" style="display:block">${esc(ch.src)}</span><span class="bar thin mt-2xs" style="display:block"><i style="--v:${(p.s/p.n).toFixed(3)}"></i></span></span><span class="ring sm" style="--p:${pct(m)}" aria-label="掌握 ${pct(m)}%"><span>${pct(m)}</span></span></button>`; }).join('');
  }
  return topbar('章節地圖',`<button class="iconbtn${VIEW.bm?' on':''}" data-act="bmtoggle" aria-label="只看收藏" aria-pressed="${!!VIEW.bm}">${icon(VIEW.bm?'star':'staro','lg')}</button>`)+`
  <div class="search">${icon('search')}<input id="srch" aria-label="搜尋觀念" placeholder="搜尋觀念：ssh、umask、sticky…" value="${esc(VIEW.q||'')}" autocomplete="off"></div>
  <div class="mt-sm">${list}</div>`;
};
AFTER.map=()=>{ const i=$('#srch'); if(i){ i.oninput=()=>{ VIEW.q=i.value; const pos=i.selectionStart; render(); const j=$('#srch'); j.focus(); j.setSelectionRange(pos,pos); }; } };
function cardRow(c){ const lv=cardLevel(c); const cls=['','l1','l2','l3'][lv]; return `<button class="li" data-act="card" data-c="${c.id}"><span class="dot ${cls}" aria-label="${['未學','待加強','再練練','已掌握'][lv]}"></span><span class="grow"><span class="t">${md(c.t)}</span><span class="m">${chTag(c.ch)} ${esc(c.ch.t)}<span class="sep"></span>${c.q.length} 題</span></span>${icon('right')}</button>`; }
VIEWS.chapter=()=>{
  const ch=CHMAP[VIEW.ch]; const p=chProgress(ch), m=chMastery(ch);
  const due=dueList(q=>q.card.ch===ch).length; const nn=nextNewQs(1,{only:ch.id}).length;
  return topbar(esc(ch.t))+`
  <div class="card"><div class="row">${chTag(ch,'lg')}<div class="grow"><div class="small">已見過 ${p.s}/${p.n} 題，共 ${ch.cards.length} 張卡</div><div class="tiny muted">來源：${esc(ch.src)}</div></div><div class="ring" style="--p:${pct(m)}" aria-label="掌握 ${pct(m)}%"><span>${pct(m)}%</span></div></div>
    <div class="row wrap mt-sm">
      <button class="btn sm pri" data-act="chlearn" data-ch="${ch.id}" ${nn?'':'disabled'}>${icon('book')} 學下一批新卡</button>
      <button class="btn sm" data-act="chreview" data-ch="${ch.id}" ${p.s?'':'disabled'}>${icon('repeat')} 複習本章${due?' ('+due+')':''}</button>
      <button class="btn sm" data-act="boss" data-ch="${ch.id}">${icon('sword')} 挑戰魔王</button>
      <button class="btn sm" data-act="focus" data-ch="${ch.id}" aria-pressed="${S.set.focus===ch.id}">${S.set.focus===ch.id?icon('check')+' 主線':'設為主線'}</button>
    </div></div>
  <div class="card">${ch.cards.map(cardRow).join('')}</div>`;
};

