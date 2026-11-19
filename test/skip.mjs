const { chromium } = await import(process.env.PW || 'playwright');
const b = await chromium.launch({executablePath: process.env.CHROME || undefined}); const errs=[];
const p = await (await b.newContext({viewport:{width:390,height:844}})).newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.goto(process.env.SA_URL); await p.waitForTimeout(600);
await p.fill('#pname','跳'); await p.click('[data-act=profnew]'); await p.waitForTimeout(300);
const r = await p.evaluate(()=>{ const out={}; const ids=QLIST.filter(q=>q.k==='mc').slice(0,3).map(q=>q.id);
  startRun(ids.map(id=>({t:'q',id})),{mode:'card'});
  out.btn=!!document.querySelector('[data-act=skipq]'); const first=RUN.items[0].id;
  document.querySelector('[data-act=skipq]').click();
  out.moved=RUN.items[RUN.items.length-1].id===first && RUN.items[0].id!==first && RUN.items.length===3 && !S.q[first];
  ACT.mc({i:Q[RUN.items[0].id].a}); ACT.next(); ACT.mc({i:Q[RUN.items[1].id].a}); ACT.next();
  out.backChip=RUN.items[RUN.pos].id===first && /剛剛跳過/.test(document.body.textContent) && !document.querySelector('[data-act=skipq]');
  // boss: no skip
  RUN.st={t0:now()}; RUN.boss={hp:1}; out.noBoss=!canSkip(); RUN.boss=null;
  // feed: skipped item comes back 5 later
  startFeed(); const f0=RUN.items[RUN.pos]; if(!f0||f0.t!=='q'){ RUN.items.splice(RUN.pos,0,{t:'q',id:ids[0]}); } VIEW={name:'run'}; render();
  const fid=RUN.items[RUN.pos].id; ACT.skipq(); out.feed=RUN.items.findIndex((x,i)=>i>RUN.pos&&x.id===fid)-RUN.pos===5;
  return out; });
console.log(JSON.stringify(r)); const ok=Object.values(r).every(Boolean);
await b.close(); console.log(ok&&!errs.length?'NO ERRORS':'FAILED '+errs.join('|'));
