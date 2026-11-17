const { chromium } = await import(process.env.PW || 'playwright');
const b = await chromium.launch({executablePath: process.env.CHROME || undefined});
const errs=[]; const log=(...a)=>console.log(...a);
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.goto(process.env.SA_URL); await p.waitForTimeout(700);
await p.fill('#pname','郡妤'); await p.click('[data-act=profnew]'); await p.waitForTimeout(400);
await p.evaluate(()=>{ S.xp=900; for(const q of QLIST.slice(0,120)) S.q[q.id]={t:Date.now(),n:2,e:2.5,i:3,d:Date.now()+86400000,h:[1,1]}; for(const ch of CH.slice(0,5)) S.boss[ch.id]={w:1,l:0,t:1}; save(); home(); });
await p.screenshot({path:'/tmp/f_home_greet.png'});
const seen=new Set();
for(let i=0;i<25;i++){ await p.click('.bubble.tap',{position:{x:30,y:20}}); const t=await p.textContent('.bubble'); seen.add(t); }
log('distinct tips',seen.size, 'pool', await p.evaluate(()=>tipPool().length));
log('sample:', [...seen].slice(0,3).map(x=>x.slice(0,70)).join(' || '));
await p.screenshot({path:'/tmp/f_home_tip.png'});
await p.click('.tiplink'); await p.waitForTimeout(200); log('tiplink ->', await p.evaluate(()=>VIEW.name));
await p.evaluate(()=>home()); log('back greet:', (await p.textContent('.bubble')).slice(0,30));
// account
await p.evaluate(()=>{ VIEW={name:'settings'}; render(); }); await p.click('[data-v=account]');
await p.fill('#anm','郡妤2'); await p.click('[data-act=aem] >> nth=3'); await p.click('[data-act=acctsave]');
await p.fill('#anew','12'); await p.click('[data-act=pinset]'); log('short pin toast', await p.locator('.toast').last().textContent());
await p.fill('#anew','1234'); await p.click('[data-act=pinset]');
await p.fill('#aold','0000'); await p.fill('#anew','5678'); await p.click('[data-act=pinset]'); log('wrong old', await p.locator('.toast').last().textContent());
await p.fill('#aold','1234'); await p.fill('#anew','5678'); await p.click('[data-act=pinset]');
log('prof', JSON.stringify(await p.evaluate(()=>{ const x=curProf(); return {name:x.name,em:x.em,pin:x.pin}; })));
await p.screenshot({path:'/tmp/f_account.png',fullPage:true});
await p.fill('#aold','5678'); await p.click('[data-act=pindel]'); log('pin after del', await p.evaluate(()=>curProf().pin));
// room forms
await p.evaluate(()=>{ VIEW={name:'room'}; render(); });
log('forms', await p.locator('.form').count(), 'enabled', await p.locator('.form:not([disabled])').count(), 'stage', await p.evaluate(()=>petStage()));
await p.click('.form >> nth=0'); await p.waitForTimeout(100); log('form view', await p.evaluate(()=>VIEW.form), await p.locator('.memo').count());
await p.screenshot({path:'/tmp/f_room_phone.png',fullPage:true});
// sizes
for(const [w,h,n] of [[820,1180,'tablet'],[1440,900,'desktop'],[320,640,'small']]){
  await p.setViewportSize({width:w,height:h}); await p.evaluate(()=>home()); await p.waitForTimeout(150);
  await p.screenshot({path:`/tmp/f_home_${n}.png`});
  await p.evaluate(()=>{ VIEW={name:'room'}; render(); }); await p.screenshot({path:`/tmp/f_room_${n}.png`});
  const ow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth); log(n,'overflow-x',ow);
}
await p.setViewportSize({width:1440,height:900}); await p.evaluate(()=>{ startBoss(CH[0].id); }); await p.screenshot({path:'/tmp/f_boss_desktop.png'});
await p.setViewportSize({width:844,height:390}); await p.evaluate(()=>render()); await p.screenshot({path:'/tmp/f_boss_land.png'});
log(errs.length?'ERRORS '+errs.join('|'):'NO ERRORS'); await b.close();
