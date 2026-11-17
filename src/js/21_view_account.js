/* ---------- LOADING ---------- */
VIEWS.loading=()=>`<div class="loading" role="status"><div class="stage inl">${mascot('idle',110)}</div><div class="h2 mt-md">讀取冒險紀錄中…</div><div class="small muted mt-xs"><span class="spin"></span> 從雲端拿你的最新進度</div></div>`;

/* ---------- PROFILES ---------- */
const EMO=['🐧','🦊','🐱','🐼','🦉','🐙','🐳','🌵','🚀','⭐'];
VIEWS.who=()=>{
  const ps=activeProfiles(); const em=VIEW.em||EMO[ps.length%6]; const nm=VIEW.nm||'';
  return (PROF.cur?topbar('切換帳號'):`<div class="center mt-lg"><div class="stage inl">${mascot('happy')}</div><h1 class="h1 big mt-sm">SA 碎片學習</h1><div class="small muted mt-2xs">選好帳號，夥伴會陪你一起冒險</div></div>`)+`
  <div class="small muted mt-md">${ps.length?'誰要來學？每個帳號有自己獨立的進度。':'先建立一個帳號，進度就會記在這個帳號底下。'}</div>
  <div class="mt-sm">${ps.map(p=>{ const st=peekProfile(p.id); return `<button class="chrow" data-act="prof" data-p="${esc(p.id)}">${avHTML(p,'sm')}<span class="grow"><span class="t">${esc(p.name)}</span> ${p.pin?icon('lock'):''} ${p.id===PROF.cur?'<span class="chip g">目前</span>':''}<span class="d" style="display:block">${st?(st.xp||0)+' XP，已學 '+Object.keys(st.q||{}).length+' 題':'進度在雲端，選取後載入'}</span></span>${icon('right')}</button>`; }).join('')}</div>
  <div class="card mt-md"><h2 class="h2">新增帳號</h2>
    <label class="small muted mt-sm" style="display:block" for="pname">暱稱</label>
    <input class="field mt-2xs" id="pname" maxlength="12" placeholder="例如：小明" value="${esc(nm)}" autocomplete="off">
    <div class="small muted mt-sm">頭像顏色</div>
    <div class="row wrap mt-2xs" role="radiogroup" aria-label="頭像顏色">${EMO.slice(0,6).map((e,i)=>`<button class="swatch av${i}${e===em?' on':''}" role="radio" aria-checked="${e===em}" aria-label="顏色 ${i+1}" data-act="pem" data-e="${e}">${e===em?icon('check'):''}</button>`).join('')}</div>
    <label class="small muted mt-sm" style="display:block" for="ppin">密碼（可不填）</label>
    <input class="field mono mt-2xs" id="ppin" inputmode="numeric" maxlength="6" placeholder="4 到 6 位數字" value="${esc(VIEW.pn||'')}" autocomplete="off">
    <button class="btn pri block mt-md" data-act="profnew" data-e="${em}">建立並開始</button>
  </div>
  ${window.SA_STANDALONE&&fbOK()&&!FBS.on?`<div class="card mt-md"><h2 class="h2">在別的裝置用過？</h2><div class="small muted mt-2xs">輸入同步碼，就能載入那邊的帳號和進度。</div>${syncJoinForm()}</div>`:''}${window.SA_STANDALONE?'<div class="small muted mt-sm">從 Claude 版搬過來：先建立帳號，再到「設定」匯入備份碼。</div>':''}<div class="tiny muted mt-sm row wrap">${syncLabel()}<span class="sep"></span>密碼只是避免點錯帳號，不是加密保護</div>`;
};
AFTER.who=()=>{ const a=$('#pname'), b=$('#ppin'); if(a) a.oninput=()=>{ VIEW.nm=a.value; }; if(b) b.oninput=()=>{ VIEW.pn=b.value; }; };


/* ---------- ACCOUNT ---------- */
VIEWS.account=()=>{
  const p=curProf()||{}; if(VIEW.anm==null){ VIEW.anm=p.name||''; VIEW.aem=p.em||EMO[avIdx(p)]; }
  const prev=Object.assign({},p,{name:VIEW.anm||p.name,em:VIEW.aem});
  const made=p.t?new Date(p.t).toLocaleDateString('zh-TW'):'';
  return topbar('帳戶設定')+`
  <div class="card"><div class="row">${avHTML(prev)}<div class="grow"><div class="h2">${esc(VIEW.anm||'（未命名）')}</div><div class="tiny muted">${S.xp||0} XP，已學 ${Object.keys(S.q||{}).length} 題${made?'<span class="sep"></span>建立於 '+made:''}</div></div></div></div>
  <div class="card"><h2 class="h2">暱稱與頭像</h2>
    <label class="small muted mt-sm" style="display:block" for="anm">暱稱</label>
    <input class="field mt-2xs" id="anm" maxlength="12" value="${esc(VIEW.anm)}" autocomplete="off">
    <div class="small muted mt-sm">頭像顏色</div>
    <div class="row wrap mt-2xs" role="radiogroup" aria-label="頭像顏色">${EMO.slice(0,6).map((e,i)=>`<button class="swatch av${i}${e===VIEW.aem?' on':''}" role="radio" aria-checked="${e===VIEW.aem}" aria-label="顏色 ${i+1}" data-act="aem" data-e="${e}">${e===VIEW.aem?icon('check'):''}</button>`).join('')}</div>
    <button class="btn pri block mt-md" data-act="acctsave">儲存</button>
  </div>
  <div class="card"><h2 class="h2">密碼</h2><div class="small muted mt-2xs">${p.pin?'目前有設密碼。要更改或移除，先輸入目前的密碼。':'目前沒有密碼，任何人都能直接點進這個帳號。'}</div>
    ${p.pin?`<label class="small muted mt-sm" style="display:block" for="aold">目前密碼</label><input class="field mono mt-2xs" id="aold" inputmode="numeric" maxlength="6" autocomplete="off">`:''}
    <label class="small muted mt-sm" style="display:block" for="anew">${p.pin?'新密碼':'設定密碼'}</label>
    <input class="field mono mt-2xs" id="anew" inputmode="numeric" maxlength="6" placeholder="4 到 6 位數字" autocomplete="off">
    <div class="row wrap mt-sm"><button class="btn sm pri" data-act="pinset">${p.pin?'更改密碼':'設定密碼'}</button>${p.pin?'<button class="btn sm" data-act="pindel">移除密碼</button>':''}</div>
    <div class="tiny muted mt-xs">密碼只是避免點錯帳號，不是加密保護</div>
  </div>
  ${(()=>{ const others=activeProfiles().filter(x=>x.id!==p.id); if(!others.length) return '';
    return `<div class="card"><h2 class="h2">合併帳號</h2><div class="small muted mt-2xs">同一個人在不同裝置各建了一個帳號時，用這個把它們併成一個。進度會合併（每題保留較新的紀錄），不會遺失。</div>
    ${others.map(o=>{ const st=peekProfile(o.id); return `<div class="li">${avHTML(o,'sm')}<span class="grow"><span class="t">${esc(o.name)}${o.name===p.name?' <span class="chip y">同名</span>':''}</span><span class="m">${st?(st.xp||0)+' XP，'+Object.keys(st.q||{}).length+' 題':'進度在雲端'}</span></span><button class="btn sm" data-act="mergeui" data-p="${esc(o.id)}">合併</button></div>`; }).join('')}</div>`; })()}
  <div class="card"><h2 class="h2">其他</h2><div class="row wrap mt-sm"><button class="btn sm" data-act="who">切換 / 新增帳號</button><button class="btn sm danger" data-act="profdel">刪除此帳號</button></div></div>`;
};
AFTER.account=()=>{ const a=$('#anm'); if(a) a.oninput=()=>{ VIEW.anm=a.value; }; };

/* ---------- PETS ---------- */
VIEWS.pets=()=>{
  const cur=curPet(), P=PETS[cur], st=petStage(), L=lvl(), N=EVO[cur].names;
  return topbar('夥伴')+`<div class="card center"><div class="stage inl">${mascot(pm('happy'),150)}</div>
    <h2 class="h1 mt-sm">${P.name}</h2><div class="small muted">${P.kind}，目前型態：${N[st]}</div>${(()=>{ const c=petCond(); return c.hp==null?'':`<div class="mt-2xs"><span class="cond c-${c.k}">${icon('heart')} 記憶血量 ${c.hp}%：${COND_TXT[c.k]}</span></div>`; })()}
    ${(()=>{ const nd=stageNeed(st); if(!nd) return '<div class="tiny muted mt-sm">已達最終型態</div>'; const mf=masteredFrac();
      return `<div class="evo-need mt-sm"><div class="tiny muted">進化條件（兩個都要達成）</div>
      <div class="row mt-2xs"><span class="tiny grow">等級 Lv.${L.i} / Lv.${nd.lv}</span>${L.i>=nd.lv?`<span class="chip g">${icon('check')}</span>`:''}</div><div class="bar thin"><i style="--v:${Math.min(1,(L.i-1+L.p)/(nd.lv-1)).toFixed(3)}"></i></div>
      <div class="row mt-xs"><span class="tiny grow">已熟練的卡 ${pct(mf)}% / ${Math.round(nd.m*100)}%</span>${mf>=nd.m?`<span class="chip g">${icon('check')}</span>`:''}</div><div class="bar thin"><i style="--v:${Math.min(1,mf/nd.m).toFixed(3)}"></i></div></div>`; })()}
    <div class="row wrap mt-sm" style="justify-content:center">${N.map((n,i)=>`<span class="chip ${i===st?'y':''}">${i<=st?n:'？？？'}</span>`).join('')}</div></div>
  <div class="sec">換一位夥伴</div>
  <div class="grid2">${Object.keys(PETS).map(id=>`<button class="tile ${id===cur?'on':''}" data-act="pet" data-p="${id}" aria-pressed="${id===cur}">${mascot('idle',92,id)}<span class="t">${PETS[id].name}</span><span class="d">${PETS[id].kind}，${EVO[id].names[st]}</span></button>`).join('')}</div>
  <div class="small muted mt-md">進化要同時達到等級與「熟練的卡片比例」，練得越紮實長得越大；進化過的型態不會退回，換夥伴也不會歸零。每隻夥伴的進化路線都不一樣，有些型態的顏色還會因帳號而異，要升上去才知道會變成什麼。</div>`;
};

/* ---------- SETTINGS ---------- */
VIEWS.settings=()=>{
  const s=S.set;
  const seg=(key,vals,lab=x=>x)=>`<div class="seg">${vals.map(v=>`<button class="${s[key]===v?'on':''}" data-act="set" data-k="${key}" data-val="${v}">${lab(v)}</button>`).join('')}</div>`;
  return topbar('設定')+`
  <div class="card"><div class="row">${avHTML(curProf()||{},'sm')}<h2 class="h2 grow">帳號：${esc((curProf()||{}).name||'')}</h2></div><div class="row wrap mt-sm"><button class="btn sm pri" data-act="go" data-v="account">${icon('pencil')} 帳戶設定</button><button class="btn sm" data-act="who">切換 / 新增帳號</button><button class="btn sm danger" data-act="profdel">刪除此帳號</button></div></div>
  <div class="card row"><div class="grow"><div class="h2">夥伴：${PETS[curPet()].name}</div><div class="small muted">隨時可換，成長階段不會歸零</div></div><button class="btn sm" data-act="go" data-v="pets">更換</button></div>
  <div class="card row"><div class="grow"><div class="h2">音效</div><div class="small muted">8-bit 風格的小音效。沒聲音的話，先調高媒體音量再點一下「開啟」試聽</div></div><button class="btn sm ${s.snd?'pri':''}" data-act="togglesnd">${s.snd?'開啟':'關閉'}</button></div>
  <div class="card"><div class="row"><div class="grow"><div class="h2">背景音樂</div><div class="small muted">慢速的環境音樂，即時合成，每段和弦上的鈴聲都隨機。切到別的 app 會自動停</div></div><button class="btn sm ${s.bgm?'pri':''}" data-act="togglebgm" aria-pressed="${!!s.bgm}">${s.bgm?'開啟':'關閉'}</button></div><div class="row mt-sm"><div class="grow"><div class="h2">魔王戰音樂</div><div class="small muted">進入魔王戰才會響，緊張一點的 8-bit 戰鬥曲。魔王剩 3 格血時會加快</div></div><button class="btn sm ${s.bbgm?'pri':''}" data-act="togglebbgm" aria-pressed="${!!s.bbgm}">${s.bbgm?'開啟':'關閉'}</button></div>${(s.bgm||s.bbgm)?`<div class="small muted" style="margin:var(--space-sm) 0 var(--space-xs)">音量</div>${seg('bgmv',[1,2,3],v=>['','小','中','大'][v])}`:''}</div>
  <div class="card"><div class="h2">每日目標</div><div class="small muted" style="margin:var(--space-2xs) 0 var(--space-sm)">答到這個題數就算今天打卡。目標小一點，比較容易天天做到</div>${seg('goal',[10,20,30,50],v=>v+' 題')}</div>
  <div class="card"><div class="h2">專項練習每回合題數</div><div class="small muted" style="margin:var(--space-2xs) 0 var(--space-sm)">工具箱裡各模式一回合的長度</div>${seg('size',[5,10,15,20])}</div>
  <div class="card"><div class="h2">新卡的出現順序</div><div class="small muted" style="margin:var(--space-2xs) 0 var(--space-sm)">${(s.mix??1)?'各章輪流：每章都會先碰到重點，穿插著學記得比較久':'照章節順序：一章學完才換下一章，比較有連貫感'}。兩種都會把考古題考過的卡往前排，章節地圖設的「主線」也一樣優先</div><div class="seg">${[[1,'各章輪流'],[0,'照章節順序']].map(([v,l])=>`<button class="${(s.mix??1)===v?'on':''}" aria-pressed="${(s.mix??1)===v}" data-act="set" data-k="mix" data-val="${v}">${l}</button>`).join('')}</div></div>
  <div class="card"><div class="h2">每回合新觀念卡</div><div class="small muted" style="margin:var(--space-2xs) 0 var(--space-sm)">章節地圖「學下一批新卡」一次學幾張</div>${seg('newPer',[1,2,3,4,6])}</div>
  <div class="card"><div class="h2">筆試日期</div><div class="small muted" style="margin:var(--space-2xs) 0 var(--space-sm)">設定後首頁會倒數，並依剩下的卡數自動安排每天的新卡量</div><input class="field" type="date" id="examdate" value="${esc(s.exam)}"></div>
  ${window.SA_STANDALONE?"":`<div class="card row"><div class="grow"><div class="h2">AI 家教（Claude）</div><div class="small muted">批改簡答題、換個比喻講解、回答你的問題${AI.ready?'':'（此檢視目前無法使用）'}</div></div><button class="btn sm ${s.ai?'pri':''}" data-act="toggleai">${s.ai?'開啟':'關閉'}</button></div>`}
  ${syncCard()}
  <div class="card"><div class="h2">進度與備份</div><div class="small muted" style="margin:var(--space-2xs) 0 var(--space-sm)" id="syncb">${syncLabel()}${SYNC.last?'，上次同步 '+new Date(SYNC.last).toLocaleTimeString():''}</div>
    <div class="small muted" style="margin-bottom:var(--space-sm)">${window.SA_STANDALONE?(FBS.on?"跨裝置同步已開啟。要和 Claude 裡的版本互通，或保險起見留一份，可以用備份碼：一邊複製、另一邊匯入，進度會合併，不會覆蓋。":"獨立版：進度存在這台裝置的 app 裡。要和 Claude 裡的版本互通，用備份碼搬：一邊複製、另一邊匯入，進度會合併，不會覆蓋。"):"進度會存在你的帳號（雲端）與這台裝置。要搬到主畫面的獨立版，或保險起見，可以複製備份碼，到另一邊匯入（會合併，不會覆蓋）。"}</div>
    <div class="row"><button class="btn sm" data-act="export">${icon('copy')} 複製備份碼</button><button class="btn sm" data-act="importui">${icon('import')} 匯入</button></div>
    <div id="importbox"></div></div>
  <div class="card"><div class="h2">內容版本</div>${CHANGELOG.slice().reverse().map(c=>`<div class="small mt-xs"><b>v${c.v}</b> <span class="muted">${c.date}</span><br><span class="muted">${esc(c.note)}</span></div>`).join('')}</div>
  <div class="card"><div class="h2">重設</div><div class="small muted" style="margin:var(--space-2xs) 0 var(--space-sm)">清除所有學習紀錄（無法復原）</div><button class="btn sm danger" data-act="reset">清除進度</button></div>`;
};
AFTER.settings=()=>{ const d=$('#examdate'); if(d) d.onchange=()=>{ S.set.exam=d.value; S.set.t=now(); save(); toast('已設定筆試日期'); }; };

