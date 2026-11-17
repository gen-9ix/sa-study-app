const { chromium } = await import(process.env.PW || 'playwright');
const b = await chromium.launch({executablePath: process.env.CHROME || undefined});
const store=new Map(); const errs=[];
async function dev(){ const c=await b.newContext({viewport:{width:390,height:844}});
  await c.route(/firestore\.googleapis\.com/, async r=>{ const u=new URL(r.request().url()); const k=decodeURIComponent(u.pathname.split('/documents/')[1]); const m=r.request().method();
    if(m==='GET'){ const d=store.get(k); return d?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(d)}):r.fulfill({status:404,body:'{}'}); }
    if(m==='PATCH'){ store.set(k,JSON.parse(r.request().postData())); return r.fulfill({status:200,body:'{}'}); }
    if(m==='DELETE'){ store.delete(k); return r.fulfill({status:200,body:'{}'}); } });
  const p=await c.newPage(); p.on('pageerror',e=>errs.push(e.message)); await p.goto(process.env.SA_URL); await p.waitForTimeout(800); return p; }
async function mk(p,qs){ await p.fill('#pname','郡妤'); await p.click('[data-act=profnew]'); await p.waitForTimeout(300);
  await p.evaluate(qs=>{ for(const i of qs) S.q[QLIST[i].id]={t:Date.now(),n:1}; S.xp+=qs.length*10; save(); },qs); }
const A=await dev(); await mk(A,[0,1,2,3,4,5,6,7,8,9]);
await A.evaluate(()=>{ VIEW={name:'settings'}; render(); }); await A.click('[data-act=synccreate]'); await A.waitForTimeout(2500);
const code=await A.evaluate(()=>FBS.code);
// phone: own account first, then joins from settings -> auto merge
const B=await dev(); await mk(B,[50,51,52]);
await B.evaluate(()=>{ VIEW={name:'settings'}; render(); }); await B.click('[data-act=syncjoinui]'); await B.fill('#syncin',code); await B.click('[data-act=syncjoin]'); await B.waitForTimeout(3500);
console.log('B auto', JSON.stringify(await B.evaluate(()=>({names:activeProfiles().map(p=>p.name),q:Object.keys(S.q).length,xp:S.xp,toast:[...document.querySelectorAll('.toast')].map(t=>t.textContent)}))));
await A.reload(); await A.waitForTimeout(2500); console.log('A sees', JSON.stringify(await A.evaluate(()=>({names:activeProfiles().map(p=>p.name),q:Object.keys(S.q).length}))));
// manual merge: simulate an old duplicate (C joined before this fix)
const C=await dev(); await mk(C,[70,71]);
await C.evaluate(c=>{ lsWrite('sa-sync',{code:c}); },code); await C.reload(); await C.waitForTimeout(2500);
console.log('C dup', JSON.stringify(await C.evaluate(()=>activeProfiles().map(p=>p.name))));
await C.evaluate(()=>{ VIEW={name:'account'}; render(); }); await C.screenshot({path:'/tmp/merge_acct.png',fullPage:true});
await C.click('[data-act=mergeui]'); await C.click('[data-act=mergego]'); await C.waitForTimeout(3000);
console.log('C merged', JSON.stringify(await C.evaluate(()=>({names:activeProfiles().map(p=>p.name),q:Object.keys(S.q).length,cur:curProf().name}))));
await A.reload(); await A.waitForTimeout(2500); console.log('A final', JSON.stringify(await A.evaluate(()=>({names:activeProfiles().map(p=>p.name),q:Object.keys(S.q).length}))));
console.log(errs.length?'ERRORS '+errs.join('|'):'NO ERRORS'); await b.close();
