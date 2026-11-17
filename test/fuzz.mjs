const { chromium, devices } = await import(process.env.PW || 'playwright');
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message+' '+e.stack?.split('\n')[1]));
await p.goto(process.env.SA_DIST); await p.waitForTimeout(300);
await p.fill('#pname','測'); await p.tap('[data-act=profnew]'); await p.waitForTimeout(300);
await p.evaluate(()=>{ for(const q of QLIST.slice(0,200)) grade(q.id, Math.random()<0.5?2:0); save(); });
const fails=[];
async function play(label,start,arg){
  await p.evaluate(start,arg); await p.waitForTimeout(150);
  for(let i=0;i<40;i++){
    const info=await p.evaluate(()=>{ if(!RUN||VIEW.name!=='run') return null; if(RUN.pos>=RUN.items.length) return {end:1}; const it=RUN.items[RUN.pos]; return {t:it.t,k:it.t==='q'?Q[it.id].k:'',re:!!it.re,pos:RUN.pos,done:!!RUN.st.done}; });
    if(!info||info.end) break;
    const before=JSON.stringify(info);
    try{
      if(info.t==='learn') await p.tap('[data-act=learnok]',{timeout:2000});
      else if(info.t==='recall'){ await p.tap('[data-act=rflip]',{timeout:2000}); await p.tap('[data-act=rrate][data-r="2"]',{timeout:2000}); }
      else if(info.t==='chest') await p.tap('[data-act=chestok]',{timeout:2000});
      else if(info.t==='goal') await p.tap('[data-act=next]',{timeout:2000});
      else {
        const k=info.k;
        if(k==='mc'||k==='tf') await p.tap('.opt >> nth=0',{timeout:2000});
        else if(k==='cmd'||k==='fill'){ await p.fill('#ans','ls -l'); await p.tap('[data-act=submit]',{timeout:2000}); }
        else if(k==='ord'){ const n=await p.locator('[data-act=ordpick]').count(); for(let j=0;j<n;j++) await p.tap('[data-act=ordpick] >> nth=0',{timeout:2000}); await p.tap('[data-act=ordcheck]',{timeout:2000}); }
        else if(k==='mt'){ const n=await p.locator('[data-act=mtl]').count(); for(let j=0;j<n;j++){ await p.tap(`[data-act=mtl] >> nth=${j}`,{timeout:2000}); await p.tap(`[data-act=mtr] >> nth=${j}`,{timeout:2000}); } await p.tap('[data-act=mtcheck]',{timeout:2000}); }
        else if(k==='sa'){ await p.tap('[data-act=sareveal]',{timeout:2000}); await p.tap('[data-act=sascore]',{timeout:2000}); }
        await p.waitForTimeout(60);
        const d=await p.evaluate(()=>RUN&&RUN.pos<RUN.items.length&&RUN.st.done);
        const pos2=await p.evaluate(()=>RUN&&RUN.pos);
        if(!d&&pos2===info.pos){ fails.push(label+' NOT SUBMITTED '+before); await p.screenshot({path:`/tmp/sa_fail_${fails.length}.png`,fullPage:true}); await p.evaluate(()=>{RUN.st.done=true;render();}); }
        if(await p.evaluate(()=>RUN.st.done)) await p.tap('[data-act=next]',{timeout:2000});
      }
    }catch(e){ fails.push(label+' ERR '+before+' '+e.message.split('\n')[0]); await p.screenshot({path:`/tmp/sa_fail_${fails.length}.png`,fullPage:true}); await p.evaluate(()=>{ RUN.pos++; RUN.st={}; render(); }); }
    await p.waitForTimeout(60);
    if(fails.length>8) break;
  }
}
for(let r=0;r<3;r++){
  await play('weak',()=>ACT.weakrun());
  await play('chreview',r=>ACT.chreview({ch:CH[r].id}),r);
  await play('rescue',()=>{ const w=weakCards(3)[0]; ACT.rescue({c:w.c.id}); });
  await play('feed',()=>startFeed());
  await play('exam',r=>{ const g=examGroups()[r%examGroups().length]; ACT.examrun({tab:g[0]}); },r);
}
console.log(fails.join('\n')||'ALL SUBMITTED'); console.log(errs.join('\n')||'NO ERRORS'); await b.close();
