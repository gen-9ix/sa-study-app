const { chromium, devices } = await import(process.env.PW || 'playwright');
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(process.env.SA_URL); await p.waitForTimeout(600);
await p.fill('#pname','測'); await p.tap('[data-act=profnew]'); await p.waitForTimeout(300);
const r=await p.evaluate(()=>{ const bad=[]; for(const q of QLIST){ if(q.k==='cmd') for(const a of q.a) if(!cmdMatch(a,q.a)) bad.push(q.id); if(q.k==='fill') for(const a of q.a) if(!fillMatch(a,q.a)) bad.push(q.id);
    try{ startRun([{t:'q',id:q.id}],{mode:'card'}); render(); }catch(e){ bad.push(q.id+' '+e.message); } }
  for(const c of CLIST){ try{ go('card',{c:c.id}); }catch(e){ bad.push(c.id+' '+e.message); } }
  return {q:QLIST.length,c:CLIST.length,dg:document.querySelectorAll('.dg').length,bad}; });
console.log(JSON.stringify(r).slice(0,600));
await p.evaluate(()=>go('card',{c:'shell.redir'})); await p.waitForTimeout(200); await p.screenshot({path:'/tmp/v5_card.png'});
console.log(errs.join('|')||'NO ERRORS'); await b.close();
