/* ═════════════════ STANDALONE CROSS-DEVICE SYNC (GitHub version) ═════════════════
   No login: each person gets a secret 20-character sync code. Every device that knows the code
   reads and writes the same documents in Firestore (REST API, no SDK) at sync/<code>/d/<name>.
   This file pretends to be Claude's db/user capabilities, so the same merge logic as the Claude
   version runs unchanged: pull, merge per item (newest wins), push; poll every 30 s and on return. */
const LS_SYNC='sa-sync';
const FBS={code:(lsRead(LS_SYNC)||{}).code||'',on:false};
function syncSetCode(code,join){ lsWrite(LS_SYNC,join?{code,join:1}:{code}); }
function syncClearCode(){ lsDel(LS_SYNC); }
/* stop syncing one profile and delete its local + cloud copy (the caller marks it deleted in PROF) */
function syncDropProfile(pid){ if(SYNC.unsub){ try{ SYNC.unsub(); }catch(e){} SYNC.unsub=null; }
  clearTimeout(SYNC.timer); SYNC.dirty=false; SYNC.ref=null; lsDel(pKey(pid)); if(SYNC.db) SYNC.db.doc(SYNC.base+pDoc(pid)).delete().catch(()=>{}); }
function fbOK(){ return !!(window.SA_STANDALONE&&window.SA_FB&&window.SA_FB.apiKey&&window.SA_FB.projectId); }
function fbURL(path,code){ const c=code||FBS.code, pre='data/users/'+c+'/', name=path.startsWith(pre)?path.slice(pre.length):path;
  return `https://firestore.googleapis.com/v1/projects/${window.SA_FB.projectId}/databases/(default)/documents/sync/${c}/d/${encodeURIComponent(name)}?key=${encodeURIComponent(window.SA_FB.apiKey)}`; }
async function fbReq(method,path,body,code){
  let r; try{ r=await fetch(fbURL(path,code),{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'}); }catch(e){ throw {code:'unavailable'}; }
  if(r.status===404&&method==='GET') return null;
  if(!r.ok) throw {code:r.status>=500||r.status===429?'unavailable':'denied',status:r.status};
  return method==='GET'?r.json():null;
}
function fbSnap(j){ let d=null; try{ d=j&&j.fields&&j.fields.j?JSON.parse(j.fields.j.stringValue):null; }catch(e){} return {exists:!!d,data:()=>d,metadata:{hasPendingWrites:false}}; }
function fbDoc(path){
  return {
    get:async()=>fbSnap(await fbReq('GET',path)),
    set:async o=>{ await fbReq('PATCH',path,{fields:{j:{stringValue:JSON.stringify(o)},u:{integerValue:String(Date.now())}}}); },
    delete:async()=>{ await fbReq('DELETE',path); },
    onSnapshot:(cb)=>{ let last=''; const poll=async()=>{ if(document.hidden) return; try{ const j=await fbReq('GET',path); const u=j&&j.fields&&j.fields.u?j.fields.u.integerValue:''; if(u&&u!==last){ const first=!last; last=u; if(!first) cb(fbSnap(j)); } }catch(e){} };
      poll(); const t=setInterval(poll,30000), v=()=>{ if(!document.hidden) setTimeout(poll,400); }; document.addEventListener('visibilitychange',v);
      return ()=>{ clearInterval(t); document.removeEventListener('visibilitychange',v); }; }
  };
}
if(fbOK()&&FBS.code&&!window.claude){ FBS.on=true; window.claude={use:async n=>n==='db'?{doc:fbDoc}:n==='user'?{id:async()=>FBS.code}:null}; }
const SYNC_ABC='abcdefghjkmnpqrstuvwxyz23456789';
function newSyncCode(){ const r=crypto.getRandomValues(new Uint32Array(20)); return Array.from(r,x=>SYNC_ABC[x%SYNC_ABC.length]).join(''); }
const fmtCode=c=>String(c).replace(/(.{5})(?=.)/g,'$1-');
const cleanCode=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
function syncJoinForm(){ return `<label class="small muted mt-sm" style="display:block" for="syncin">同步碼（20 個字，大小寫、連字號都沒關係）</label>
  <input class="field mono mt-2xs" id="syncin" placeholder="xxxxx-xxxxx-xxxxx-xxxxx" autocomplete="off" autocapitalize="off" spellcheck="false">
  <button class="btn pri block mt-sm" data-act="syncjoin">連線並載入</button>`; }
function syncCard(){
  if(!window.SA_STANDALONE) return '';
  if(!fbOK()) return `<div class="card"><div class="h2">跨裝置同步</div><div class="small muted mt-2xs">雲端還沒設定好，目前只能用下面的備份碼搬進度。</div></div>`;
  if(!FBS.on) return `<div class="card"><div class="h2">跨裝置同步</div><div class="small muted mt-2xs" style="margin-bottom:var(--space-sm)">目前只存在這台裝置。建立一組同步碼，再到其他裝置輸入同一組，帳號和進度就會自動互通。</div>
    <div class="row wrap"><button class="btn sm pri" data-act="synccreate">${icon('cloud')} 建立同步碼</button><button class="btn sm" data-act="syncjoinui">我已經有同步碼</button></div><div id="syncbox"></div></div>`;
  return `<div class="card"><div class="h2">跨裝置同步</div><div class="small muted mt-2xs" id="syncb2">${syncLabel()}${SYNC.last?'，上次同步 '+new Date(SYNC.last).toLocaleTimeString():''}</div>
    <div class="small muted mt-sm">你的同步碼（像密碼一樣，別貼到公開的地方）</div>
    <div class="row mt-2xs"><code class="grow" style="padding:var(--space-xs);font-size:var(--text-md);letter-spacing:.04em">${VIEW.showcode?fmtCode(FBS.code):fmtCode(FBS.code).replace(/[a-z0-9](?=.{6})/g,'•')}</code><button class="btn sm" data-act="synccode">${VIEW.showcode?'隱藏':'顯示'}</button></div>
    <div class="row wrap mt-sm"><button class="btn sm" data-act="synccopy">${icon('copy')} 複製同步碼</button><button class="btn sm danger" data-act="syncoff">這台裝置停止同步</button></div>
    <div class="tiny muted mt-xs">在其他裝置的「設定 → 跨裝置同步 → 我已經有同步碼」輸入它。進度每次變動後幾秒內上傳，其他裝置打開 app 或每 30 秒會抓最新的。</div></div>`;
}


/* Merge one in-app account's progress into another (same person, two devices), then retire it. */
async function mergeProfileInto(fromId,toId){
  if(fromId===toId) return;
  if(fromId===PROF.cur){ if(SYNC.unsub){ try{ SYNC.unsub(); }catch(e){} SYNC.unsub=null; } clearTimeout(SYNC.timer); SYNC.dirty=false; SYNC.ref=null; }
  let from=fromId===PROF.cur?normState(S):normState(lsRead(pKey(fromId))), to=normState(lsRead(pKey(toId)));
  if(SYNC.db){
    try{ const a=await SYNC.db.doc(SYNC.base+pDoc(fromId)).get(); if(a.exists) from=normState(mergeState(from,dclone(a.data()))); }catch(e){}
    try{ const b=await SYNC.db.doc(SYNC.base+pDoc(toId)).get(); if(b.exists) to=normState(mergeState(to,dclone(b.data()))); }catch(e){}
  }
  const m=normState(mergeState(to,from)); m.u=Date.now(); lsWrite(pKey(toId),m);
  if(SYNC.db){ try{ await SYNC.db.doc(SYNC.base+pDoc(toId)).set(JSON.parse(JSON.stringify(m))); }catch(e){} }
  const p=PROF.list.find(x=>x.id===fromId); if(p){ p.del=true; p.t=Date.now(); delete p.pin; }
  lsDel(pKey(fromId));
  if(SYNC.db) SYNC.db.doc(SYNC.base+pDoc(fromId)).delete().catch(()=>{});
  return m;
}
async function initSync(){
  if(!window.claude||!window.claude.use) return;
  try{
    const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
    if(!db||!user) return;
    const uid=await user.id(); if(!uid) return;
    SYNC.db=db; SYNC.uid=uid; SYNC.base='data/users/'+uid+'/'; SYNC.metaRef=db.doc(SYNC.base+'meta');
    const [ms,old]=await Promise.all([SYNC.metaRef.get(), PROF.list.length?null:db.doc(SYNC.base+'progress').get()]);
    const md=ms.exists?(dclone(ms.data())||{}):{}; const rl=md.list||[];
    for(const p of rl){ if(!p||!p.id) continue; const i=PROF.list.findIndex(x=>x.id===p.id); if(i<0) PROF.list.push(p); else if((p.t||0)>(PROF.list[i].t||0)) PROF.list[i]=p; }
    if(!PROF.list.length&&old&&old.exists) PROF.list.push({id:'main',name:'我',em:'🐧',t:Date.now()});
    const jn=lsRead(LS_SYNC); if(jn&&jn.join){ const ids=new Set(rl.map(p=>p&&p.id));
      for(const lp of PROF.list.filter(p=>!p.del&&!ids.has(p.id))){ const rp=rl.find(p=>p&&!p.del&&p.id!==lp.id&&p.name===lp.name); if(!rp) continue;
        await mergeProfileInto(lp.id,rp.id); if(PROF.cur===lp.id){ PROF.cur=rp.id; S=normState(lsGet()); } SYNC.merged=(SYNC.merged||0)+1; }
      delete jn.join; lsWrite(LS_SYNC,jn); }
    if(!PROF.cur&&md.cur){ const p=PROF.list.find(x=>x.id===md.cur&&!x.del); if(p&&!p.pin){ PROF.cur=p.id; S=normState(lsGet()); if(!BOOT.done) { VIEW={name:'loading'}; render(); } } }
    lsWrite(LS_PROF,PROF);
    if(JSON.stringify(PROF.list)!==JSON.stringify(rl)||(md.cur||'')!==(PROF.cur||'')) pushMeta();
    if(VIEW.name==='who') render();
    await attachProfile();
    if(SYNC.merged){ setTimeout(()=>toast('已把這台裝置上同名的帳號，和雲端的帳號合併成一個',3200),800); SYNC.merged=0; }
  }catch(e){ SYNC.status='local'; refreshSyncBadge(); }
}
function pushMeta(){ lsWrite(LS_PROF,PROF); if(SYNC.metaRef) SYNC.metaRef.set({list:JSON.parse(JSON.stringify(PROF.list)),cur:PROF.cur||'',u:Date.now()}).catch(()=>{}); }
async function attachProfile(){
  if(SYNC.unsub){ try{ SYNC.unsub(); }catch(e){} SYNC.unsub=null; }
  SYNC.ref=null;
  if(!SYNC.db||!PROF.cur){ refreshSyncBadge(); return; }
  const pid=PROF.cur, ref=SYNC.db.doc(SYNC.base+pDoc(pid));
  SYNC.status='syncing'; refreshSyncBadge();
  try{
    const snap=await ref.get(); if(PROF.cur!==pid) return;
    const remote=snap.exists?dclone(snap.data()):null;
    const qb=JSON.stringify(S.q), xb=S.xp;
    S=normState(mergeState(S,remote)); lsSet(S);
    SYNC.ref=ref; SYNC.status='cloud'; SYNC.last=Date.now();
    if(!remote||JSON.stringify(remote.q||{})!==JSON.stringify(S.q)||remote.xp!==S.xp){ SYNC.dirty=true; flush(); }
    if(JSON.stringify(S.q)!==qb||S.xp!==xb) refreshAfterRemote();
    refreshSyncBadge();
    SYNC.unsub=ref.onSnapshot(sn=>{
      if(PROF.cur!==pid||!sn.exists||sn.metadata.hasPendingWrites) return;
      const r=dclone(sn.data()); if(!r||(r.u||0)<=(S.u||0)) return;
      S=normState(mergeState(S,r)); lsSet(S); refreshAfterRemote();
    },()=>{});
  }catch(e){ SYNC.status='local'; refreshSyncBadge(); }
}
function refreshAfterRemote(){
  if(!BOOT.done) return;                       // boot will start the feed with the merged data
  if(RUN&&RUN.endless){ if(!RUN.st.done&&!($('#ans')?.value)) startFeed(); return; }   // rebuild an untouched feed
  if(!BUSY()) render();
}
const BOOT={done:false,timer:null};
function bootStart(){
  if(BOOT.done) return; BOOT.done=true; clearTimeout(BOOT.timer);
  if(!PROF.cur){ VIEW={name:'who'}; render(); return; }
  applyFreeze(); startFeed();
  const ms0=memStats(), st0=streak(), D=S.days[today()]||{n:0};
  if(ms0.n) setTimeout(()=>toast(D.n>=S.set.goal?icon('check')+' 今天的目標已完成，想加碼就繼續':(st0?icon('flame')+' 連續 '+st0+' 天，':'')+(D.n?'今天已做 '+D.n+' / '+S.set.goal:ms0.low?ms0.low+' 個記憶等你救':'記憶都還穩，來點新的'),2600),400);
}
function selectProfile(pid){
  if(SYNC.dirty&&SYNC.ref) flush();
  clearTimeout(SYNC.timer); SYNC.dirty=false;
  RUN=null; stopBlitz(); closeSheet();
  PROF.cur=pid; lsWrite(LS_PROF,PROF);
  S=normState(lsGet()); if(!Object.keys(S.q).length) S.cv=CONTENT_VERSION;
  pushMeta(); BOOT.done=false; VIEW={name:'loading'}; render();
  BOOT.timer=setTimeout(bootStart,3500); attachProfile().finally(bootStart);
}
function refreshSyncBadge(){ const el=document.getElementById('syncb'); if(el) el.innerHTML=syncLabel(); }
function syncLabel(){ return SYNC.status==='cloud'?icon('cloud')+' 已雲端同步':SYNC.status==='syncing'?'<span class="spin"></span> 同步中':icon('phone')+' 存在此裝置'; }

