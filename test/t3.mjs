const { chromium } = await import(process.env.PW || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme:'dark' })).newPage();
const errs=[]; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
const has = async s => (await page.$(s)) !== null;
// legacy data migrates into profile "main"
await page.goto(process.env.SA_DIST);
await page.evaluate(()=>{ localStorage.clear(); localStorage.setItem('sa-study-v1', JSON.stringify({v:1,q:{'shell.layers.0':{n:1,c:1,l:0,e:2.5,i:1,d:Date.now()-1000,t:Date.now()-864e5,h:'1'}},c:{},xp:10,days:{},bm:{},set:{size:10,newPer:3,ai:1,exam:'',t:0},cv:1,best:{blitz:0},u:5})); });
await page.reload(); await page.waitForTimeout(400);
console.log('migrated:', await page.evaluate(()=>JSON.stringify(PROF)+' view='+VIEW.name+' q='+Object.keys(S.q).length));
await page.screenshot({ path:'/tmp/sa_30_feed_first.png', fullPage:true });
async function play(n,tag){ const seenT={};
  for(let s=0;s<n;s++){ await page.waitForTimeout(60);
    const t=await page.evaluate(()=>RUN&&RUN.items[RUN.pos]?RUN.items[RUN.pos].t+(RUN.items[RUN.pos].fast?'F':''):'none');
    if(!seenT[t]&&tag){ seenT[t]=1; }
    if(await has('[data-act=learnok]')){ await page.click('[data-act=learnok]'); continue; }
    if(await has('[data-act=rflip]')){ await page.screenshot({path:`/tmp/sa_31_recall.png`}); await page.click('[data-act=rflip]'); continue; }
    if(await has('[data-act=rrate]')){ await page.click('[data-act=rrate][data-r="2"]'); continue; }
    if(await has('[data-act=chestok]')){ await page.screenshot({path:`/tmp/sa_32_chest.png`}); await page.click('[data-act=chestok]'); continue; }
    if(await has('.dock [data-act=hub]')){ await page.waitForTimeout(300); await page.screenshot({path:`/tmp/sa_33_goal.png`, fullPage:true}); await page.click('.dock [data-act=next]'); continue; }
    if(await has('[data-act=next]')){ if(s<12) await page.screenshot({path:`/tmp/sa_34_fb_${s}.png`, fullPage:true}); await page.click('[data-act=next]'); continue; }
    // answer correctly most of the time using the answer key
    const k=await page.evaluate(()=>{ const q=Q[RUN.items[RUN.pos].id]; return {k:q.k,a:q.a,n:q.o?q.o.length:0}; });
    const right=Math.random()<0.8;
    if(k.k==='mc'){ const i=right?k.a:(k.a+1)%k.n; await page.click(`[data-act=mc][data-i="${i}"]`); }
    else if(k.k==='tf'){ await page.click(`[data-act=tf][data-v="${(right?k.a:!k.a)?1:0}"]`); }
    else if(k.k==='cmd'||k.k==='fill'){ await page.fill('#ans', right?k.a[0]:'zz'); await page.click('[data-act=submit]'); }
    else if(k.k==='ord'){ for(let i=0;i<k.n;i++) await page.click(`[data-act=ordpick][data-i="${i}"]`); await page.click('[data-act=ordcheck]'); }
    else if(k.k==='mt'){ for(let i=0;i<k.n;i++){ await page.click(`[data-act=mtl][data-i="${i}"]`); await page.click(`[data-act=mtr][data-i="${i}"]`);} await page.click('[data-act=mtcheck]'); }
    else if(k.k==='sa'){ await page.click('[data-act=sareveal]'); await page.click('[data-act=sahit][data-i="0"]'); await page.click('[data-act=sascore]'); }
  } }
await play(140,1);
console.log('after play:', await page.evaluate(()=>{ const D=S.days[today()]; return `answered=${D.n} goalFlag=${D.g} xp=${S.xp} batch=${RUN.batch} types=${[...new Set(RUN.items.map(i=>i.t+(i.fast?'F':'')))].join(',')} streak=${streak()}`; }));
await page.click('[data-act=hub]'); await page.waitForTimeout(200); await page.screenshot({ path:'/tmp/sa_35_hub.png', fullPage:true });
await page.click('[data-act=who]'); await page.waitForTimeout(150);
await page.fill('#pname','小明'); await page.click('[data-act=pem][data-e="🦊"]'); await page.fill('#ppin','1234');
await page.screenshot({ path:'/tmp/sa_36_who.png', fullPage:true });
await page.click('[data-act=profnew]'); await page.waitForTimeout(300);
console.log('new profile:', await page.evaluate(()=>`cur=${curProf().name} q=${Object.keys(S.q).length} xp=${S.xp} view=${VIEW.name}`));
await play(6);
await page.click('[data-act=hub]'); await page.click('[data-act=who]'); await page.click('[data-act=prof][data-p="main"]'); await page.waitForTimeout(300);
console.log('back to main:', await page.evaluate(()=>`cur=${curProf().name} q=${Object.keys(S.q).length} xp=${S.xp}`));
await page.reload(); await page.waitForTimeout(400);
console.log('reload:', await page.evaluate(()=>`cur=${curProf().name} view=${VIEW.name} endless=${RUN&&RUN.endless} profiles=${activeProfiles().map(p=>p.name+(p.pin?'🔒':''))}`));
// pin gate
await page.click('[data-act=hub]'); await page.click('[data-act=who]'); const second=await page.evaluate(()=>PROF.list[1].id);
await page.click(`[data-act=prof][data-p="${second}"]`); await page.fill('#pinin','0000'); await page.click('[data-act=pinok]');
console.log('wrong pin stays:', await page.evaluate(()=>curProf().name));
await page.fill('#pinin','1234'); await page.click('[data-act=pinok]'); await page.waitForTimeout(200);
console.log('right pin:', await page.evaluate(()=>curProf().name+' q='+Object.keys(S.q).length));
// forgetting-curve model sanity + streak freeze
console.log(await page.evaluate(()=>{ const id='net.tcpip.0'; const out=[]; let T=Date.now(); const real=Date.now; 
  Date.now=()=>T; delete S.q[id];
  grade(id,2); out.push('new→'+S.q[id].i);
  T+=864e5; grade(id,2); out.push('1d→'+S.q[id].i);
  T+=3*864e5; grade(id,2); out.push('on time→'+S.q[id].i.toFixed(1)+' R='+grade.last.R.toFixed(2));
  T+=20*864e5; grade(id,2); out.push('late success→'+S.q[id].i.toFixed(1)+' R='+grade.last.R.toFixed(2));
  T+=60*1000; grade(id,2); out.push('immediate repeat→'+S.q[id].i.toFixed(1));
  grade(id,0); out.push('lapse→'+S.q[id].i.toFixed(1)+' due(min)='+Math.round((S.q[id].d-T)/6e4));
  Date.now=real; return out.join(' | '); }));
console.log(await page.evaluate(()=>{ const d=new Date(); const k=n=>{ const x=new Date(); x.setDate(x.getDate()-n); return dkey(x); };
  S.days={}; S.days[k(2)]={n:5}; S.days[k(3)]={n:5}; S.fz={n:1,used:{},t:0}; const before=streak(); applyFreeze(); return `streak before freeze=${before} after=${streak()} fz.n=${S.fz.n}`; }));
console.log(errs.join('\n')||'NO ERRORS'); await browser.close();
