/* ═════════════════════ 8. ACTIONS ═════════════════════ */
function next(){ const R=RUN; if(R.boss&&(R.boss.won||R.boss.lost)){ R.pos=R.items.length; R.st={}; window.scrollTo(0,0); render(); return; } if(R.endless){ const D=S.days[today()]; if(D&&D.n>=S.set.goal&&!D.g){ D.g=1; save(); R.items.splice(R.pos+1,0,{t:'goal'}); } } R.pos++; R.st={t0:now()}; window.scrollTo(0,0); render(); }
const ACT={
  back, home,
  go:d=>go(d.v),
  ackcv:()=>{ S.cv=CONTENT_VERSION; save(); render(); },
  daily:()=>startFeed(),
  hub:()=>{ RUN=null; STACK.length=0; VIEW={name:'home'}; window.scrollTo(0,0); render(); },
  rflip:()=>{ sfx('flip'); RUN.st.flip=true; viewCard(RUN.items[RUN.pos].c); window.scrollTo(0,0); render(); },
  rrate:d=>{ const r=+d.r; rateCard(RUN.items[RUN.pos].c,r); RUN.xp+=2; RUN.res[RUN.pos]=r?2:0; toast(r===2?'記得！這張卡先放心':r===1?'有點模糊，相關題目會早一點回來':'沒關係，相關題目已排進接下來的複習'); next(); },
  notesave:()=>{ const it=RUN.items[RUN.pos], v=($('#mynote')?.value||'').trim(); if(v.length<4){ toast('寫一句就好，用自己的話'); return; }
    blurInput(); saveNote(it.c,v,(S.q[it.q]||{}).l||0); S.xp+=5; RUN.xp+=5; save(); toast('筆記存好了，答完這張卡的題目時會顯示給你'); next(); },
  noteskip:()=>{ blurInput(); next(); },
  noteedit:d=>{ const c=CARD[d.c], old=S.c[c.id]?.note?.s||'';
    sheet(`<div class="row between"><h2 class="h2">我的筆記</h2><button class="iconbtn" data-act="closesheet" aria-label="關閉">${icon('x')}</button></div><div class="small muted mt-2xs">${md(c.t)}：用自己的話寫一句重點</div><textarea class="field mt-xs" id="mynote" rows="3" maxlength="200">${esc(old)}</textarea><button class="btn pri block mt-sm" data-act="noteput" data-c="${c.id}">儲存</button>`); },
  noteput:d=>{ const v=($('#mynote')?.value||'').trim(); if(v.length<4&&v.length){ toast('再多寫幾個字'); return; }
    if(v) saveNote(d.c,v); else if(S.c[d.c]){ delete S.c[d.c].note; S.c[d.c].t=now(); save(); } closeSheet(); render(); toast(v?'筆記已儲存':'筆記已刪除'); },
  chestok:()=>{ const x=RUN.items[RUN.pos].xp; S.xp+=x; const D=S.days[today()]||(S.days[today()]={n:0,c:0,x:0,nw:0}); D.x+=x; RUN.xp+=x; save(); next(); },
  who:()=>go('who'),
  saynext:()=>{ const x=nextTip(); if(!x) return; HOMETIP.cur=x; HOMETIP.n++; HOMETIP.anim=true; sfx('flip'); render(); },
  aem:d=>{ VIEW.aem=d.e; render(); },
  acctsave:()=>{ const p=curProf(); if(!p) return; const name=(VIEW.anm||'').trim();
    if(!name){ toast('暱稱不能是空的'); return; }
    if(activeProfiles().some(x=>x.id!==p.id&&x.name===name)){ toast('這個暱稱已經有人用了'); return; }
    p.name=name; p.em=VIEW.aem||p.em; p.t=Date.now(); pushMeta(); toast('已儲存'); render(); },
  pinset:()=>{ const p=curProf(); if(!p) return; const nw=($('#anew')?.value||'').trim();
    if(p.pin&&($('#aold')?.value||'').trim()!==p.pin){ toast('目前的密碼不對'); return; }
    if(!/^\d{4,6}$/.test(nw)){ toast('密碼要是 4 到 6 位數字'); return; }
    p.pin=nw; p.t=Date.now(); pushMeta(); toast('密碼已更新'); render(); },
  pindel:()=>{ const p=curProf(); if(!p) return;
    if(($('#aold')?.value||'').trim()!==p.pin){ toast('先輸入目前的密碼'); return; }
    delete p.pin; p.t=Date.now(); pushMeta(); toast('已移除密碼'); render(); },
  roomform:d=>{ const i=+d.i; VIEW.form=(i===petStage())?null:i; VIEW.happy=true; sfx('pet'); render(); clearTimeout(ACT._rf); ACT._rf=setTimeout(()=>{ if(VIEW.name==='room'){ VIEW.happy=false; render(); } },1200); },
  synccreate:()=>{ if(!fbOK()) return; const c=newSyncCode(); syncSetCode(c); toast('建立好了，正在上傳…'); setTimeout(()=>location.reload(),500); },
  syncjoinui:()=>{ const b=$('#syncbox'); if(b){ b.innerHTML=syncJoinForm(); const i=$('#syncin'); if(i) i.focus(); } },
  syncjoin:async()=>{ const c=cleanCode($('#syncin')?.value); if(c.length!==20){ toast('同步碼要是 20 個字，確認有貼完整'); return; }
    toast('<span class="spin"></span> 確認中…',3000); let j=null;
    try{ j=await fbReq('GET','meta',null,c); }catch(e){ toast(e&&e.code==='unavailable'?'連不上網路，等一下再試':'這組同步碼不能用'); return; }
    if(!j){ toast('找不到這組同步碼，確認一下有沒有打錯'); return; }
    syncSetCode(c,1); toast('連上了，正在載入…'); setTimeout(()=>location.reload(),500); },
  synccode:()=>{ VIEW.showcode=!VIEW.showcode; render(); },
  synccopy:async()=>{ try{ await navigator.clipboard.writeText(fmtCode(FBS.code)); toast('同步碼已複製'); }catch(e){ VIEW.showcode=true; render(); toast('無法自動複製，請長按同步碼複製'); } },
  syncoff:()=>{ if(now()-leaveArmed>3000){ leaveArmed=now(); toast('這台裝置會停止同步（資料留在這台，雲端也不會刪）。3 秒內再按一次確認',3200); return; }
    flush(); syncClearCode(); toast('已停止同步'); setTimeout(()=>location.reload(),600); },
  mergeui:d=>{ const a=curProf(), b=PROF.list.find(x=>x.id===d.p); if(!a||!b) return;
    sheet(`<div class="row between"><h2 class="h2">合併帳號</h2><button class="iconbtn" data-act="closesheet" aria-label="關閉">${icon('x')}</button></div>
    <div class="small mt-sm">把目前的「${esc(a.name)}」（${S.xp||0} XP）併入「${esc(b.name)}」。合併後只會留下「${esc(b.name)}」，兩邊的進度都會保留在裡面。</div>
    ${b.pin?`<label class="small muted mt-sm" style="display:block" for="mpin">「${esc(b.name)}」的密碼</label><input class="field mono mt-2xs" id="mpin" inputmode="numeric" maxlength="6" autocomplete="off">`:''}
    <button class="btn pri block mt-md" data-act="mergego" data-p="${esc(b.id)}">確定合併</button>`); },
  mergego:async d=>{ const a=curProf(), b=PROF.list.find(x=>x.id===d.p); if(!a||!b) return;
    if(b.pin&&($('#mpin')?.value||'').trim()!==b.pin){ toast('密碼不對'); return; }
    closeSheet(); toast('<span class="spin"></span> 合併中…',4000);
    await mergeProfileInto(a.id,b.id); pushMeta(); selectProfile(b.id); setTimeout(()=>toast('合併完成'),600); },
  pem:d=>{ VIEW.em=d.e; render(); },
  prof:d=>{ const p=PROF.list.find(x=>x.id===d.p); if(!p) return; if(p.pin){ sheet(`<div class="row between"><div class="row">${avHTML(p,'sm')}<h2 class="h2">${esc(p.name)}</h2></div><button class="iconbtn" data-act="closesheet" aria-label="關閉">${icon('x')}</button></div><input class="field mono" id="pinin" inputmode="numeric" maxlength="6" placeholder="輸入密碼" style="margin-top:var(--space-sm)" autocomplete="off"><button class="btn pri block" style="margin-top:var(--space-sm)" data-act="pinok" data-p="${esc(p.id)}">進入</button>`); setTimeout(()=>{ try{ $('#pinin').focus(); }catch(e){} },80); } else selectProfile(p.id); },
  pinok:d=>{ const p=PROF.list.find(x=>x.id===d.p); if(p&&($('#pinin')?.value||'')===p.pin) selectProfile(p.id); else toast('密碼不對'); },
  profnew:d=>{ const name=($('#pname')?.value||'').trim(); if(!name){ toast('先取個暱稱'); return; } if(activeProfiles().some(p=>p.name===name)){ toast('這個暱稱已經有人用了'); return; }
    const pin=($('#ppin')?.value||'').trim(); const id='p'+Date.now().toString(36)+(Math.random()*1296|0).toString(36);
    const p={id,name,em:d.e,t:Date.now()}; if(pin) p.pin=pin; PROF.list.push(p); pushMeta(); selectProfile(id); toast('歡迎，'+esc(name)+'！直接開始吧'); },
  profdel:()=>{ if(now()-leaveArmed>3000){ leaveArmed=now(); toast('會刪除這個帳號的所有進度。3 秒內再按一次確認',2800); return; }
    const pid=PROF.cur, p=PROF.list.find(x=>x.id===pid); if(!p) return; syncDropProfile(pid); p.del=true; p.t=Date.now(); delete p.pin;
    PROF.cur=''; pushMeta(); S=normState(null); RUN=null; STACK.length=0; VIEW={name:'who'}; render(); toast('已刪除'); },
  boss:d=>startBoss(d.ch),
  roomtoggle:d=>{ S.room.hide=S.room.hide||{}; if(S.room.hide[d.i]) delete S.room.hide[d.i]; else S.room.hide[d.i]=1; S.room.t=now(); save(); render(); },
  roompet:()=>{ VIEW.happy=1; sfx('pet'); vibrate(10); render(); clearTimeout(ACT.roompet.t); ACT.roompet.t=setTimeout(()=>{ if(VIEW.name==='room'){ VIEW.happy=0; render(); } },1400); },
  expclaim:()=>expClaim(),
  rescue:d=>{ const c=CARD[d.c]; const qsx=c.q.filter(q=>q.k!=='sa').sort((a,b)=>qMastery(a.id)-qMastery(b.id)).slice(0,2); startRun([{t:'learn',c:c.id},...qsx.map(q=>({t:'q',id:q.id}))],{mode:'rescue'}); },
  peek:()=>{ const pool=CLIST.filter(c=>cardStarted(c)); const c=(pool.length&&Math.random()<0.75)?pool[Math.random()*pool.length|0]:(nextNewQs(1)[0]?.card||CLIST[Math.random()*CLIST.length|0]); go('card',{c:c.id}); },
  chapter:d=>go('chapter',{ch:d.ch}),
  card:d=>{ lastViewed=''; go('card',{c:d.c}); },
  starsort:d=>{ VIEW.sort=d.s; render(); },
  starquiz:()=>{ const qs=shuffle(starredCards().flatMap(c=>c.q.filter(q=>q.k!=='sa'))).sort((a,b)=>qMastery(a.id)-qMastery(b.id)+(Math.random()-.5)*0.3).slice(0,10);
    if(!qs.length){ toast('收藏的卡還沒有題目'); return; } startRun(qs.map(q=>({t:'q',id:q.id,nw:!seen(q.id)})),{mode:'card'}); render(); },
  bm:d=>{ const b=S.bm[d.c]; S.bm[d.c]={on:!(b&&b.on),t:now()}; save(); render(); },
  bmtoggle:()=>{ VIEW.bm=!VIEW.bm; VIEW.q=''; render(); },
  focus:d=>{ S.set.focus=S.set.focus===d.ch?'':d.ch; S.set.t=now(); save(); render(); toast(S.set.focus?'今日任務會優先教這一章的新卡':'已取消主線'); },
  chlearn:d=>{ const L=nextNewQs(S.set.newPer,{only:d.ch}); const items=[]; for(const x of L){ items.push({t:'learn',c:x.card.id}); for(const q of x.qs) items.push({t:'q',id:q.id,nw:1}); } startRun(items,{mode:'learn'}); },
  chreview:d=>{ const ch=CHMAP[d.ch]; const due=dueList(q=>q.card.ch===ch); const rest=shuffle(QLIST.filter(q=>q.card.ch===ch&&seen(q.id)&&!due.includes(q))).sort((a,b)=>qMastery(a.id)-qMastery(b.id)); startRun([...due,...rest].slice(0,S.set.size).map(q=>({t:'q',id:q.id})),{mode:'review'}); },
  cardpractice:d=>{ const c=CARD[d.c]; startRun(c.q.map(q=>({t:'q',id:q.id,nw:!seen(q.id)})),{mode:'card'}); },
  learnok:()=>{ RUN.newCards++; const xp=5; S.xp+=xp; RUN.xp+=xp; save(); next(); },
  mc:d=>{ const st=RUN.st; if(st.done) return; st.pick=+d.i; const q=Q[RUN.items[RUN.pos].id]; answer(st.pick===q.a?2:0, st.pick===q.a); },
  tf:d=>{ const st=RUN.st; if(st.done) return; st.pick=d.v==='1'; const q=Q[RUN.items[RUN.pos].id]; answer(st.pick===q.a?2:0, st.pick===q.a); },
  submit:()=>submitTyped(),
  skipq:()=>skipQ(),
  giveup:()=>{ blurInput(); const st=RUN.st; const q=Q[RUN.items[RUN.pos].id]; st.val=($('#ans')?.value||'').trim(); if(q.k==='cmd') st.log=(st.log||[]).concat(`<div class="out hint"># 參考：${esc(q.a[0])}</div>`); answer(0,false); },
  hint:()=>{ RUN.st.hint=true; render(); },
  override:()=>{ const R=RUN, st=R.st, q=Q[R.items[R.pos].id]; st.override=true; st.ok=true; const s=S.q[q.id]; if(s){ s.l=Math.max(0,s.l-1); s.h=s.h.slice(0,-1)+'1'; s.c++; s.i=Math.max(1,s.i); s.d=now()+DAY; } R.res[R.pos]=2; const ix=R.items.findIndex((x,i)=>i>R.pos&&x.id===q.id&&x.re); if(ix>0) R.items.splice(ix,1); save(); render(); toast('已改判為正確'); },
  ordpick:d=>{ const st=RUN.st; st.ord.push(+d.i); render(); },
  ordun:d=>{ const st=RUN.st; st.ord.splice(+d.j,1); render(); },
  ordreset:()=>{ RUN.st.ord=[]; render(); },
  ordcheck:()=>{ const st=RUN.st; const ok=st.ord.every((v,i)=>v===i); answer(ok?2:0,ok); },
  mtl:d=>{ const st=RUN.st; const i=+d.i; if(st.pairs[i]!=null){ delete st.pairs[i]; st.sel=null; } else st.sel=i; render(); },
  mtr:d=>{ const st=RUN.st; if(st.sel==null){ toast('先點左邊的項目'); return; } const r=+d.i; for(const k in st.pairs) if(st.pairs[k]===r) delete st.pairs[k]; st.pairs[st.sel]=r; st.sel=null; render(); },
  mtcheck:()=>{ const st=RUN.st, q=Q[RUN.items[RUN.pos].id]; let wrong=0; q.o.forEach((p,i)=>{ if(q.o[st.pairs[i]]?.[1]!==p[1]) wrong++; }); const ok=wrong===0; const mid=wrong===1&&q.o.length>=4; answer(ok?2:mid?1:0,ok,mid); },
  sasubmit:()=>{ blurInput(); const st=RUN.st, q=Q[RUN.items[RUN.pos].id]; const v=($('#ans')?.value||st.val||'').trim(); st.val=v;
    if(!v){ toast('先寫幾個關鍵字吧；真的想不出來，就按「直接看答案」'); return; }
    st.reveal=true; st.auto=q.p.map(p=>saKeyHit(v,p)); st.hit=st.auto.slice(); render(); },
  sareveal:()=>{ blurInput(); const st=RUN.st; st.val=($('#ans')?.value||st.val||'').trim(); st.reveal=true; st.hit=Q[RUN.items[RUN.pos].id].p.map(()=>false); render(); },
  saai:()=>{ blurInput(); aiGradeSA(); },
  sahit:d=>{ const st=RUN.st; st.hit[+d.i]=!st.hit[+d.i]; render(); },
  sascore:()=>scoreSA(),
  next:()=>next(),
  aiwhy:()=>{ const q=Q[RUN.items[RUN.pos].id]; const st=RUN.st; const ctx=`${q.q}\n${q.x?q.x.join('\n')+'\n':''}學生的作答：${st.val||(q.k==='mc'?q.o[st.pick]:q.k==='tf'?(st.pick?'對':'錯'):'（看答案）')}\n正確答案：${q.k==='mc'?q.o[q.a]:q.k==='tf'?(q.a?'對':'錯'):Array.isArray(q.a)?q.a[0]:''}`; aiExplainCard(q.card.id,ctx); },
  aiexplain:d=>aiExplainCard(d.c),
  aiask:d=>aiAskCard(d.c),
  askgo:d=>aiAskGo(d.c),
  closesheet:()=>closeSheet(),
  flash:d=>startFlash(d.scope),
  flip:()=>{ sfx('flip'); VIEW.flip=true; viewCard(VIEW.cards[VIEW.i]); render(); },
  frate:d=>{ const r=+d.r; rateCard(VIEW.cards[VIEW.i],r); VIEW.stat[r]++; VIEW.i++; VIEW.flip=false; window.scrollTo(0,0); render(); },
  term:d=>startTerm(d.scope),
  blitz:()=>{ stopBlitz(); if(VIEW.name==='blitz'){ VIEW={name:'home'}; } startBlitz(); },
  blzgo:()=>{ BLZ.start=true; BLZ.end=now()+60000; render(); },
  blz:d=>blzAnswer(d.v),
  examtab:d=>{ VIEW.tab=d.tab; render(); },
  examone:d=>startRun([{t:'q',id:d.q}],{mode:'exam'}),
  examrun:d=>{ const g=examGroups().find(x=>x[0]===d.tab); const pool=g[1].slice().sort((a,b)=>qMastery(a.id)-qMastery(b.id)+ (Math.random()-.5)*0.3); startRun(pool.slice(0,5).map(q=>({t:'q',id:q.id})),{mode:'exam'}); },
  weakrun:()=>{ const items=[]; for(const w of weakCards(10)){ for(const q of w.c.q.filter(q=>seen(q.id)).sort((a,b)=>qMastery(a.id)-qMastery(b.id)).slice(0,2)) items.push({t:'q',id:q.id}); } startRun(shuffle(items).slice(0,S.set.size),{mode:'weak'}); },
  set:d=>{ S.set[d.k]=+d.val; S.set.t=now(); save(); if(d.k==='bgmv'){ bgmVolume(); bmVolume(); } render(); },
  togglebgm:()=>{ S.set.bgm=S.set.bgm?0:1; S.set.t=now(); save(); if(S.set.bgm){ unlockAudio(); bgmStart(); toast(icon('note')+' 背景音樂開啟，再點一次或按 Esc 可關閉',2200); } else bgmStop(); sfxMark(true); render(); },
  togglebbgm:()=>{ S.set.bbgm=S.set.bbgm?0:1; S.set.t=now(); save(); if(S.set.bbgm){ unlockAudio(); toast(icon('sword')+' 魔王戰音樂開啟',1800); } else bossMusicStop(true); sfxMark(true); render(); },
  togglesnd:()=>{ S.set.snd=S.set.snd?0:1; S.set.t=now(); save(); if(S.set.snd){ unlockAudio(); sfx('coin'); } else sfxSilence(); render(); },
  pet:d=>{ if(!PETS[d.p]) return; S.set.pet=d.p; S.set.t=now(); save(); sfx('pet'); render(); toast(PETS[d.p].name+'：請多指教！'); },
  toggleai:()=>{ S.set.ai=S.set.ai?0:1; S.set.t=now(); save(); render(); },
  export:async()=>{ const code=btoa(unescape(encodeURIComponent(JSON.stringify(S)))); let ok=false; try{ await navigator.clipboard.writeText(code); ok=true; }catch(e){}
    $('#importbox').innerHTML=`<div class="small mt-sm">${ok?'已複製到剪貼簿。':'無法自動複製，請長按下面的框框全選後複製。'}這份備份包含 ${S.xp||0} XP、${Object.keys(S.q||{}).length} 題紀錄</div><textarea class="field mono" id="expbox" style="margin-top:var(--space-xs);min-height:96px" readonly>${esc(code)}</textarea><div class="tiny muted mt-2xs">到另一個版本的「設定 → 進度與備份 → 匯入」貼上就好</div>`;
    const t=$('#expbox'); if(t){ t.onfocus=()=>t.select(); } toast(ok?'備份碼已複製':'請手動複製備份碼'); },
  importui:()=>{ $('#importbox').innerHTML=`<textarea class="field mono" id="imp" style="margin-top:var(--space-sm);min-height:96px" placeholder="貼上備份碼" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea><button class="btn sm pri" style="margin-top:var(--space-xs)" data-act="importgo">合併匯入</button>`; const t=$('#imp'); if(t) t.focus(); },
  importgo:()=>{ let o=null; try{ const raw=($('#imp').value||'').replace(/\s+/g,''); o=JSON.parse(decodeURIComponent(escape(atob(raw)))); }catch(e){}
    if(!o||typeof o!=='object'||!('q' in o||'xp' in o)){ toast('備份碼格式不正確，確認有整段複製到'); return; }
    const before=Object.keys(S.q||{}).length; S=normState(mergeState(S,normState(o))); save(); flush();
    toast(`已合併匯入：現在 ${S.xp||0} XP、${Object.keys(S.q).length} 題（多了 ${Object.keys(S.q).length-before} 題）`,3200); render(); },
  reset:()=>{ if(now()-leaveArmed>3000){ leaveArmed=now(); toast('確定要清除？3 秒內再按一次'); return; } S=normState(null); S.cv=CONTENT_VERSION; save(); flush(); toast('已清除'); home(); },
};
let lastTouchAct=0;
document.addEventListener('touchend',e=>{ const el=e.target.closest('[data-act=submit],[data-act=giveup],[data-act=saai],[data-act=sareveal]'); if(!el||el.disabled) return; e.preventDefault(); lastTouchAct=Date.now(); runAct(el.dataset.act,el.dataset); },{passive:false});
function runAct(a,d){ try{ const r=ACT[a](d); if(r&&r.catch) r.catch(reportErr); }catch(err){ reportErr(err,a); } }
function reportErr(err,a){ try{ console.error(err); const m=String(err&&err.message||err).slice(0,80); toast('出了點錯（'+esc(a||'')+'）：'+esc(m)+'，截圖給 Claude 修',5000); if(RUN&&RUN.active&&VIEW.name==='run'){ render(); } }catch(e){} }
window.addEventListener('error',e=>reportErr(e.error||e.message,'global'));
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]'); if(!el) return;
  if(Date.now()-lastTouchAct<600&&/^(submit|giveup|saai|sareveal)$/.test(el.dataset.act)) return;
  if(el.dataset.act==='closesheet'&&e.target.closest('[data-stop]')&&!e.target.closest('button[data-act="closesheet"]')) return;
  const fn=ACT[el.dataset.act]; if(fn){ e.preventDefault(); sfxMark(false); runAct(el.dataset.act,el.dataset); if(!SFX.played) sfx('tap'); }
});
document.addEventListener('keydown',e=>{ const rb=e.target&&e.target.closest&&e.target.closest('[role=button][data-act]'); if(rb&&(e.key==='Enter'||e.key===' ')&&e.target===rb){ e.preventDefault(); rb.click(); } });
document.addEventListener('keydown',e=>{
  if(VIEW.name!=='run'||!RUN||!RUN.active) return; if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  const st=RUN.st; const it=RUN.items[RUN.pos];
  if(e.key==='Enter'){ if(it&&it.t==='learn') ACT.learnok(); else if(st.done) next(); }
  if(!st.done&&it&&it.t==='q'){ const q=Q[it.id]; if(q.k==='mc'&&/^[1-6a-f]$/i.test(e.key)){ const j=isNaN(+e.key)?'abcdef'.indexOf(e.key.toLowerCase()):+e.key-1; const oi=st.order&&st.order[j]; if(oi!=null) ACT.mc({i:oi}); } if(q.k==='tf'&&(e.key==='o'||e.key==='x')) ACT.tf({v:e.key==='o'?'1':'0'}); }
});
// start timing per question
const _render=render;
render=function(){ if(RUN&&RUN.active&&RUN.st&&!RUN.st.t0) RUN.st.t0=now(); _render(); };

