function conceptHTML(c,opts={}){
  return `<div class="concept">
    <div class="row between"><div class="cmeta">${chTag(c.ch)}<span>${esc(c.ch.t)}</span></div>${opts.nobm?'':`<button class="iconbtn sm${S.bm[c.id]?.on?' on':''}" data-act="bm" data-c="${c.id}" aria-label="收藏這張卡" aria-pressed="${!!S.bm[c.id]?.on}">${icon(S.bm[c.id]?.on?'star':'staro')}</button>`}</div>
    <h2 class="h1">${opts.isNew?'<span class="newbadge">NEW</span> ':''}${md(c.t)}</h2>
    ${c.a?`<div class="ana">${icon('bulb')}<div>${md(c.a)}</div></div>`:''}
    ${diagramHTML(c.id)}
    <ul>${c.b.map(b=>`<li>${md(b)}</li>`).join('')}</ul>
    ${c.x?`<pre class="code">${esc(c.x.join('\n'))}</pre>`:''}
    ${c.m?`<div class="mnemo">${icon('star')}<span>${md(c.m)}</span></div>`:''}
    ${opts.nonote?'':noteLine(c)}
  </div>`;
}
VIEWS.card=()=>{
  const c=CARD[VIEW.c]; const lv=cardLevel(c);
  const stat=c.q.map(q=>{ const s=S.q[q.id]; const m=qMastery(q.id); return `<span class="chip ${!s?'':m>=0.7?'g':m>=0.35?'y':'r'}" title="${KIND[q.k]}">${icon(KIND_IC[q.k])} ${KIND[q.k]}</span>`; }).join(' ');
  return topbar('觀念卡')+`<div class="card">${conceptHTML(c)}</div>
  <div class="card"><div class="small muted">這張卡的 ${c.q.length} 題狀態</div><div class="row wrap mt-xs">${stat}</div>
  <div class="row wrap mt-sm"><button class="btn sm pri" data-act="cardpractice" data-c="${c.id}">${icon('play')} 練這張</button><button class="btn sm" data-act="noteedit" data-c="${c.id}">${icon('pencil')} ${S.c[c.id]?.note?'改筆記':'寫筆記'}</button>${aiOn()?`<button class="btn sm" data-act="aiexplain" data-c="${c.id}">${icon('spark')} 換個講法</button><button class="btn sm" data-act="aiask" data-c="${c.id}">${icon('chat')} 問 Claude</button>`:''}</div></div>`;
};
AFTER.card=()=>{ viewCardOnce(VIEW.c); };
let lastViewed='';
function viewCardOnce(cid){ if(lastViewed===cid) return; lastViewed=cid; viewCard(cid); }

