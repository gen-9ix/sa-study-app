/* ═════════════════════ 2. STATE & PERSISTENCE ═════════════════════ */
const LS_KEY='sa-study-v1', DAY=864e5, MIN=6e4;
function fresh(){ return {v:1,q:{},c:{},xp:0,days:{},bm:{},set:{size:10,newPer:3,ai:1,exam:'',t:0,goal:20,pet:'crab',snd:1,bgm:0,bgmv:2,bbgm:1},cv:0,best:{blitz:0},fz:{n:1,used:{},t:0},boss:{},exp:null,room:{hide:{},seen:{},t:0},u:0}; }
function lsRead(k){ try{ const t=localStorage.getItem(k); return t?JSON.parse(t):null; }catch(e){ return null; } }
function lsWrite(k,o){ try{ localStorage.setItem(k,JSON.stringify(o)); }catch(e){} }
function lsDel(k){ try{ localStorage.removeItem(k); }catch(e){} }
/* profiles: several in-app accounts, each with its own progress.
   local: sa-profiles = {list:[{id,name,em,pin?,t,del?}],cur}; progress per profile in pKey(id)
   cloud: data/users/<uid>/meta (list) and data/users/<uid>/<pDoc(id)> (progress). 'main' = the pre-profile data. */
const LS_PROF='sa-profiles';
let PROF=lsRead(LS_PROF)||{list:[],cur:''};
const pKey=pid=>pid==='main'?LS_KEY:LS_KEY+':'+pid;
const pDoc=pid=>pid==='main'?'progress':'p_'+pid;
function lsGet(){ return PROF.cur?lsRead(pKey(PROF.cur)):null; }
const peekProfile=pid=>lsRead(pKey(pid));
function lsSet(o){ if(PROF.cur) lsWrite(pKey(PROF.cur),o); }
// cloud documents arrive frozen (read-only); always work on a deep, writable copy
function dclone(o){ return o==null?o:JSON.parse(JSON.stringify(o)); }
function normState(o){ const s=Object.assign(fresh(),dclone(o)||{}); s.set=Object.assign(fresh().set,s.set||{}); s.fz=Object.assign(fresh().fz,s.fz||{}); s.fz.used=s.fz.used||{}; s.best=s.best||{blitz:0}; s.boss=s.boss||{}; s.room=Object.assign({hide:{},seen:{},t:0},s.room||{}); if(!s.evo){ const T=[0,150,400,800,1400,2200,3200,4500,6500,9000], OLD=[1,2,4,6,8]; let L=1; while(L<T.length&&(s.xp||0)>=T[L]) L++; let o=0; for(let i=0;i<OLD.length;i++) if(L>=OLD[i]) o=i; s.evo={s:o,t:0}; } return s; }
if(!PROF.list.length){ const old=lsRead(LS_KEY); if(old&&(old.u||Object.keys(old.q||{}).length)){ PROF={list:[{id:'main',name:'我',em:'🐧',t:Date.now()}],cur:'main'}; lsWrite(LS_PROF,PROF); } }
const activeProfiles=()=>PROF.list.filter(p=>!p.del);
const curProf=()=>PROF.list.find(p=>p.id===PROF.cur&&!p.del);
if(PROF.cur&&!curProf()) PROF.cur='';
let S=normState(lsGet());
const SYNC={db:null,ref:null,uid:null,status:'local',last:0,writing:false,dirty:false,timer:null,unsub:null};

function mergeState(a,b){ // pure merge of two progress states (per-item newest wins)
  if(!b) return a; if(!a) return b;
  const o=fresh();
  const pick=(x,y,k)=>{ if(!x) return y; if(!y) return x; return (y[k]||0)>(x[k]||0)?y:x; };
  for(const id of new Set([...Object.keys(a.q||{}),...Object.keys(b.q||{})])) o.q[id]=pick(a.q?.[id],b.q?.[id],'t');
  for(const id of new Set([...Object.keys(a.c||{}),...Object.keys(b.c||{})])) o.c[id]=pick(a.c?.[id],b.c?.[id],'t');
  for(const id of new Set([...Object.keys(a.bm||{}),...Object.keys(b.bm||{})])) o.bm[id]=pick(a.bm?.[id],b.bm?.[id],'t');
  for(const d of new Set([...Object.keys(a.days||{}),...Object.keys(b.days||{})])){
    const x=a.days?.[d]||{}, y=b.days?.[d]||{};
    o.days[d]={n:Math.max(x.n||0,y.n||0),c:Math.max(x.c||0,y.c||0),x:Math.max(x.x||0,y.x||0),nw:Math.max(x.nw||0,y.nw||0),nc:Math.max(x.nc||0,y.nc||0),sa:Math.max(x.sa||0,y.sa||0),g:(x.g||y.g)?1:0};
  }
  o.xp=Math.max(a.xp||0,b.xp||0);
  o.set=((b.set?.t||0)>=(a.set?.t||0))?Object.assign(fresh().set,b.set):Object.assign(fresh().set,a.set);
  o.cv=Math.max(a.cv||0,b.cv||0);
  o.best={blitz:Math.max(a.best?.blitz||0,b.best?.blitz||0)};
  o.fz=((b.fz?.t||0)>=(a.fz?.t||0)?b.fz:a.fz)||fresh().fz;
  for(const k of new Set([...Object.keys(a.boss||{}),...Object.keys(b.boss||{})])){ const x=a.boss?.[k]||{}, y=b.boss?.[k]||{}; o.boss[k]={w:Math.max(x.w||0,y.w||0),l:Math.max(x.l||0,y.l||0),t:Math.max(x.t||0,y.t||0),best:Math.max(x.best||0,y.best||0),fz:Object.assign({},x.fz||{},y.fz||{})}; }
  o.evo={s:Math.max(a.evo?.s||0,b.evo?.s||0),t:Math.max(a.evo?.t||0,b.evo?.t||0)};
  o.exp=((b.exp?.t||0)>=(a.exp?.t||0)?b.exp:a.exp)||null;
  { const ra=a.room||{}, rb=b.room||{}; const nw=(rb.t||0)>=(ra.t||0)?rb:ra; o.room={hide:Object.assign({},nw.hide||{}),seen:Object.assign({},ra.seen||{},rb.seen||{}),t:Math.max(ra.t||0,rb.t||0)}; }
  o.u=Math.max(a.u||0,b.u||0);
  return o;
}
function save(){ S.u=Date.now(); lsSet(S); SYNC.dirty=true; clearTimeout(SYNC.timer); SYNC.timer=setTimeout(flush,2500); }
async function flush(){
  if(!SYNC.ref||SYNC.writing||!SYNC.dirty) return;
  SYNC.writing=true; SYNC.dirty=false;
  try{ await SYNC.ref.set(JSON.parse(JSON.stringify(S))); SYNC.last=Date.now(); SYNC.status='cloud'; }
  catch(e){ if(e&&e.code==='unavailable'){ SYNC.dirty=true; } else { SYNC.status='local'; } }
  SYNC.writing=false;
  if(SYNC.dirty){ clearTimeout(SYNC.timer); SYNC.timer=setTimeout(flush,3000); }
}
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ clearTimeout(SYNC.timer); flush(); } });
