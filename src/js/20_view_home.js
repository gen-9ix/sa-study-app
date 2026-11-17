/* ═════════════════════ 7. VIEWS ═════════════════════ */
const VIEWS={}, AFTER={};
VIEWS.bosses=viewBosses;
VIEWS.room=viewRoom;

/* ---------- HOME ---------- */
function greeting(){ const h=new Date().getHours(); return h<5?'夜深了，來一口份就好':h<11?'早安，來點 SA 早餐':h<14?'午安，飯後消化一下':h<18?'下午好，碎片時間到了':h<22?'晚上好，今天也前進一點':'夜深了，來一口份就好'; }
function dailyPlan(){
  const due=dueList(); const nw=nextNewQs(99).reduce((a,x)=>a+x.qs.length,0);
  return {due:due.length,newAvail:nw};
}
VIEWS.home=()=>{
  expTick(); roomTick();
  const L=lvl(), st=streak(), D=S.days[today()]||{n:0,c:0,x:0,nw:0};
  const goal=S.set.goal, ms=memStats(), P=curProf()||{};
  let learnedQ=0; for(const q of QLIST) if(seen(q.id)) learnedQ++;
  let mAll=0; for(const ch of CH) mAll+=chMastery(ch); mAll/=CH.length;
  const weak=weakCards(1)[0];
  let exam='';
  { const PC=pace();
    if(PC){ const ok=PC.behind<=0, heavy=PC.need>20;
      exam=`<div class="card alert info"><span class="ic-tile">${icon('cal')}</span><div class="grow"><div class="row between"><div class="h2">距離筆試 ${PC.days} 天</div><span class="chip ${ok?'g':'y'}">${PC.left?(ok?'今天跟上了':`還差 ${PC.behind} 張`):'全部學過了'}</span></div>
      ${PC.left||PC.done?`<div class="small muted mt-2xs">還有 <b>${PC.left}</b> 張卡沒學過。要在考前 3 天學完，今天要認識 <b>${PC.need}</b> 張新卡</div>
      <div class="bar thin mt-xs"><i style="--v:${Math.min(1,PC.done/Math.max(1,PC.need)).toFixed(3)}"></i></div><div class="tiny muted mt-2xs">今天新卡 ${PC.done} / ${PC.need}${heavy?'。量很大，學不完也沒關係：'+((S.set.mix??1)?'新卡已經輪流從各章出、':'')+'考古題考過的卡排在前面':''}</div>`:'<div class="small muted mt-2xs">所有卡都學過了，接下來專心複習和練簡答。</div>'}</div></div>`; }
    else if(!S.set.exam&&learnedQ>0) exam=`<div class="card alert info"><span class="ic-tile">${icon('cal')}</span><div class="grow"><div class="h2">還沒設定筆試日期</div><div class="small muted">設定後會幫你算每天要學幾張新卡，才來得及學完</div></div><button class="btn sm" data-act="go" data-v="settings">去設定</button></div>`; }
  const banner = S.cv<CONTENT_VERSION ? `<div class="card alert info"><span class="ic-tile">${icon('box')}</span><div class="grow small"><b>內容更新 v${CONTENT_VERSION}</b><br>${esc(CHANGELOG[CHANGELOG.length-1].note)}<br><span class="muted">你的學習紀錄完整保留。</span></div><button class="btn sm" data-act="ackcv">好</button></div>`:'';
  const hpN=ms.n?Math.max(1,Math.round(ms.avg*20)):0, hpC=!ms.n?'':ms.avg>=0.85?'':ms.avg>=0.7?' mid':' low';
  return `${banner}
  <div class="row between">
    <button class="who-btn" data-act="who" aria-label="切換帳號，目前是 ${esc(P.name||'')}">${avHTML(P)}<span><span class="h2" style="display:block">${esc(P.name||'')}</span><span class="small muted">切換帳號</span></span></button>
    <span class="row"><button class="iconbtn${S.set.bgm?' on':''}" data-act="togglebgm" aria-label="背景音樂" aria-pressed="${!!S.set.bgm}">${icon('note','lg')}</button><button class="iconbtn" data-act="go" data-v="settings" aria-label="設定">${icon('gear','lg')}</button></span>
  </div>
  <div class="home-grid"><div class="hcol">
  ${homeSay(D,goal,ms)}
  <section class="card status" aria-label="今日狀態">
    <div class="hp-head"><span class="hp-label">${icon('heart')} 記憶血量</span><span class="hp-val">${ms.n?pct(ms.avg):'--'}<small>%</small></span></div>
    <div class="hp${hpC}" role="meter" aria-label="記憶保留率" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${ms.n?pct(ms.avg):0}">${Array.from({length:20},(_,i)=>`<i${i<hpN?' class="on"':''}></i>`).join('')}</div>
    <div class="hp-note">${!ms.n?'還沒有記憶。學會第一張卡，血條就會亮起來。':ms.low?`有 <b>${ms.low}</b> 個記憶正在流失，先替它們補血。`:'記憶都很穩，可以去認識新觀念。'}${ms.n?`<span class="cond c-${petCond().k}">${esc(PETS[curPet()].name)}：${COND_TXT[petCond().k]}</span>`:''}</div>
    <div class="stats3">
      <div class="stat"><div class="k">${icon('flame')} 連續</div><div class="v${st?' hot':''}">${st} 天</div></div>
      <div class="stat"><div class="k">${icon('check')} 今日</div><div class="v">${D.n}/${goal}</div></div>
      <div class="stat"><div class="k">${icon('ice')} 補簽卡</div><div class="v">${S.fz.n} 張</div></div>
    </div>
    <div class="xpline"><span class="lv">Lv.${L.i}</span><span class="grow"><span class="bar thin" style="display:block"><i style="--v:${L.p.toFixed(3)}"></i></span></span><span class="num">${S.xp}${L.next?' / '+L.next:''} XP</span></div>
    <div class="tiny muted mt-2xs">稱號：${esc(L.name)}</div>
    ${weekRow()}
    <button class="cta" data-act="daily">${icon('play')}<span class="grow"><span class="l1">繼續冒險</span><span class="l2">${(()=>{ const PC=pace(), b=PC&&PC.behind>0?`今天還差 ${PC.behind} 張新卡`:''; return ms.low?`先救 ${ms.low} 個快忘的記憶${b?'，'+b:'，隨時可停'}`:b?b+'才跟得上進度':ms.n?'記憶都還穩，來學新觀念，隨時可停':'從第一張觀念卡開始'; })()}</span></span></button>
  </section>
  ${expPanel()}
  ${weak?`<div class="card alert"><span class="ic-tile">${icon('heal')}</span><div class="grow"><div class="h2">${md(weak.c.t)}</div><div class="small muted">盲點：${esc(weak.why.join('、'))}</div></div><button class="btn sm warn" data-act="rescue" data-c="${weak.c.id}">30 秒救援</button></div>`:''}
  ${exam}
  </div><div class="hcol">
  <div class="sec">指令選單<span class="note">想專攻某一項時再用</span></div>
  <nav class="card menu" aria-label="練習模式">
    <button class="mi" data-act="go" data-v="bosses">${icon('sword')}<span class="grow"><span class="t">魔王戰</span><span class="d">每章一隻魔王，答對就攻擊</span></span><span class="r">${CH.filter(ch=>bossRec(ch.id)?.w).length}/${CH.length}</span></button>
    <button class="mi" data-act="go" data-v="room">${icon('box')}<span class="grow"><span class="t">夥伴小房間</span><span class="d">每章解鎖一件家具，佈置${PETS[curPet()].name}的房間</span></span><span class="r">${ROOM_ITEMS.filter(roomUnlocked).length}/${ROOM_ITEMS.length}</span></button>
    <button class="mi" data-act="go" data-v="map">${icon('map')}<span class="grow"><span class="t">章節地圖</span><span class="d">照章節學新觀念、看全部筆記</span></span><span class="r">${pct(mAll)}%</span></button>
    <button class="mi" data-act="go" data-v="flashpick">${icon('cards')}<span class="grow"><span class="t">快閃卡</span><span class="d">翻卡回想比喻與重點</span></span></button>
    <button class="mi" data-act="go" data-v="termpick">${icon('term')}<span class="grow"><span class="t">終端機特訓</span><span class="d">把指令親手打出來</span></span></button>
    <button class="mi" data-act="blitz">${icon('bolt')}<span class="grow"><span class="t">60 秒閃電戰</span><span class="d">連擊加倍，快問快答</span></span><span class="r">最高 ${S.best.blitz||0}</span></button>
    <button class="mi" data-act="go" data-v="starred">${icon('star')}<span class="grow"><span class="t">收藏的卡</span><span class="d">${(()=>{ const n=starredCards().length; return n?`${n} 張，快閃複習或直接出題`:'按星號收藏的觀念卡會集中在這裡'; })()}</span></span></button>
    <button class="mi" data-act="go" data-v="exam">${icon('scroll')}<span class="grow"><span class="t">考古題道場</span><span class="d">歷屆簡答題與得分點批改</span></span></button>
    <button class="mi" data-act="go" data-v="radar">${icon('target')}<span class="grow"><span class="t">盲點雷達</span><span class="d">看弱點、針對性特訓</span></span></button>
    <button class="mi" data-act="peek">${icon('dice')}<span class="grow"><span class="t">隨手翻一張</span><span class="d">等公車、排隊時翻一張觀念卡</span></span></button>
  </nav>
  <div class="sec">總進度</div>
  <div class="card">
    <div class="row between"><div class="small muted">已見過 ${learnedQ} / ${QLIST.length} 題，共 ${CLIST.length} 張觀念卡</div><div class="small"><b>${pct(mAll)}%</b> 掌握</div></div>
    <div class="bar mt-xs"><i style="--v:${(learnedQ/QLIST.length).toFixed(3)}"></i></div>
    <div class="row between mt-sm"><span class="tiny muted row" id="syncb">${syncLabel()}</span><span class="tiny muted">內容 v${CONTENT_VERSION}</span></div>
  </div>
  </div></div>`;
};

