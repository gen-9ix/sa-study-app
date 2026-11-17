const { chromium } = await import(process.env.PW || 'playwright');
const b = await chromium.launch({executablePath: process.env.CHROME || undefined});
const store=new Map(); const errs=[]; let reqs=0;
async function dev(){ const c=await b.newContext({viewport:{width:390,height:844}});
  await c.route(/firestore\.googleapis\.com/, async r=>{ reqs++; const u=new URL(r.request().url()); const k=decodeURIComponent(u.pathname.split('/documents/')[1]); const m=r.request().method();
    if(!/^sync\/[a-z2-9]{20}\/d\/[^/]+$/.test(k)) return r.fulfill({status:403,body:'{}'});
    
    if(m==='GET'){ const d=store.get(k); return d?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(d)}):r.fulfill({status:404,body:'{}'}); }
    if(m==='PATCH'){ store.set(k,JSON.parse(r.request().postData())); return r.fulfill({status:200,body:'{}'}); }
    if(m==='DELETE'){ store.delete(k); return r.fulfill({status:200,body:'{}'}); }
    r.fulfill({status:405,body:'{}'}); });
  const p=await c.newPage(); p.on('pageerror',e=>errs.push(e.message)); await p.goto(process.env.SA_URL); await p.waitForTimeout(800); return p; }
const A=await dev();
await A.fill('#pname','郡妤'); await A.click('[data-act=profnew]'); await A.waitForTimeout(300);
await A.evaluate(()=>{ S.xp=500; for(const q of QLIST.slice(0,30)) S.q[q.id]={t:Date.now(),n:1}; save(); VIEW={name:'settings'}; render(); });
await A.click('[data-act=synccreate]'); await A.waitForTimeout(2500);
const code=await A.evaluate(()=>FBS.code); console.log('A on',await A.evaluate(()=>FBS.on),'status',await A.evaluate(()=>SYNC.status),'docs',[...store.keys()].map(k=>k.split('/').pop()));
const B=await dev();
console.log('B who join form', await B.locator('#syncin').count());
await B.fill('#syncin','WRONG'); await B.click('[data-act=syncjoin]'); console.log('bad:', await B.locator('.toast').last().textContent());
await B.fill('#syncin','aaaaabbbbbcccccddddd'); await B.click('[data-act=syncjoin]'); await B.waitForTimeout(300); console.log('missing:', await B.locator('.toast').last().textContent());
await B.fill('#syncin',code.toUpperCase().replace(/(.{5})/g,'$1-')); await B.click('[data-act=syncjoin]'); await B.waitForTimeout(2500);
const bs=await B.evaluate(()=>({on:FBS.on,view:VIEW.name,cur:PROF.cur&&curProf().name,xp:S.xp,q:Object.keys(S.q).length}));
console.log('B',JSON.stringify(bs));
if(bs.view==='who'){ await B.click('[data-act=prof]'); await B.waitForTimeout(1500); console.log('B after pick', await B.evaluate(()=>({xp:S.xp,q:Object.keys(S.q).length}))); }
await B.evaluate(()=>{ for(const q of QLIST.slice(100,110)) S.q[q.id]={t:Date.now(),n:1}; S.xp+=50; save(); }); await B.waitForTimeout(3500);
await A.reload(); await A.waitForTimeout(2500); console.log('A after reload', JSON.stringify(await A.evaluate(()=>({xp:S.xp,q:Object.keys(S.q).length,name:curProf().name}))));
// live poll: A changes, B gets it on visibility
await A.evaluate(()=>{ S.q[QLIST[200].id]={t:Date.now(),n:1}; save(); flush(); }); await A.waitForTimeout(3500);
await B.evaluate(()=>{ document.dispatchEvent(new Event('visibilitychange')); }); await B.waitForTimeout(1500);
console.log('B live', await B.evaluate(()=>Object.keys(S.q).length));
await B.evaluate(()=>{ VIEW={name:'settings'}; render(); }); await B.screenshot({path:'/tmp/sync_settings.png',fullPage:true});
console.log('reqs',reqs, errs.length?'ERRORS '+errs.join('|'):'NO ERRORS'); await b.close();
