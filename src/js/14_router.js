/* ═════════════════════ 6. ROUTER ═════════════════════ */
let VIEW={name:'home'}; const STACK=[];
let RUN=null; // active practice run
function BUSY(){ return !!(RUN&&RUN.active)||VIEW.name==='blitz'; }
function go(name,params={},push=true){ if(push) STACK.push(VIEW); VIEW={name,...params}; window.scrollTo(0,0); render(); }
function back(){ if(RUN&&RUN.active&&!RUN.endless&&!confirmLeave()) return; RUN=null; stopBlitz(); VIEW=STACK.pop()||{name:'home'}; render(); }
function home(){ HOMETIP.cur=null; HOMETIP.n=0; RUN=null; stopBlitz(); STACK.length=0; VIEW={name:'home'}; window.scrollTo(0,0); render(); }
let leaveArmed=0;
function confirmLeave(){ if(now()-leaveArmed<2500) return true; leaveArmed=now(); toast('再按一次返回就結束這回合（進度已保存）'); return false; }
function render(){
  const a=$('#app');
  if(!PROF.cur&&VIEW.name!=='who'&&VIEW.name!=='loading') VIEW={name:'who'};
  const V=VIEWS[VIEW.name]||VIEWS.home;
  a.innerHTML=V();
  document.body.dataset.v=VIEW.name;
  const after=AFTER[VIEW.name]; if(after) after();
  try{ musicSync(); }catch(e){}
}
function topbar(title,right=''){ return `<div class="topbar"><button class="back" data-act="back" aria-label="返回">${icon('left')}</button><h1 class="grow h2">${title}</h1>${right}</div>`; }

