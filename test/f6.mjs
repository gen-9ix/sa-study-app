const { chromium } = await import(process.env.PW || 'playwright');
const b = await chromium.launch({executablePath: process.env.CHROME || undefined});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2}); await ctx.addInitScript(()=>{ Date.prototype.getHours=function(){ return 14; }; });
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(process.env.SA_URL); await p.waitForTimeout(700);
await p.fill('#pname','測'); await p.click('[data-act=profnew]'); await p.waitForTimeout(300);
// simulate: 29 shell cards learned, exam in 34 days
await p.evaluate(()=>{ const t=now(); for(const c of CHMAP.shell.cards.slice(0,29)) for(const q of c.q.filter(q=>q.k!=='sa')) S.q[q.id]={n:2,c:2,l:0,e:2.5,i:3,d:t+2*DAY,t:t-DAY,h:'11'};
  const d=new Date(Date.now()+34*DAY); S.set.exam=d.toISOString().slice(0,10); save(); home(); });
console.log('pace', await p.evaluate(()=>JSON.stringify(pace())));
console.log('next12', await p.evaluate(()=>nextNewQs(12).map(x=>x.card.ch.id+(cardHot(x.card)?'*':'')).join(' ')));
console.log('fresh8', await p.evaluate(()=>nextNewQs(8,{fresh:1}).map(x=>x.card.id).join(' ')));
console.log('only', await p.evaluate(()=>nextNewQs(3,{only:'net'}).map(x=>x.card.id).join(' ')));
await p.screenshot({path:'/tmp/f6_home.png'});
// feed: check composition and nc counting
await p.evaluate(()=>{ startFeed(); });
const comp=await p.evaluate(()=>{ feedFill(); feedFill(); return RUN.items.map(i=>i.t==='q'?(Q[i.id].k==='sa'?'SA':(i.nw?'n':'r'))+':'+i.id.split('.')[0]:i.t).join(' '); });
console.log('feed', comp);
await p.evaluate(()=>{ const q=nextNewQs(1,{fresh:1})[0].qs[0]; grade(q.id,2); });
console.log('nc', await p.evaluate(()=>S.days[today()].nc+' '+JSON.stringify(pace())));
// stubborn
const qid=await p.evaluate(()=>{ const q=CHMAP.shell.cards[0].q[0]; S.q[q.id].l=3; RUN={items:[{t:'q',id:q.id},{t:'q',id:CHMAP.shell.cards[1].q[0].id}],pos:0,active:true,meta:{mode:'card'},res:[],xp:0,startT:now(),newCards:0,requeued:{},st:{t0:now()}}; VIEW={name:'run'}; answer(0,false,false); return q.id; });
console.log('after wrong', await p.evaluate(()=>RUN.items.map(i=>i.t).join(',')));
await p.evaluate(()=>next()); await p.waitForTimeout(200); await p.screenshot({path:'/tmp/f6_reteach.png',fullPage:true});
await p.click('[data-act=notesave]'); console.log('short:', await p.locator('.toast').last().textContent());
await p.fill('#mynote','Enter 之後 shell 會先展開再執行，順序是重點'); await p.keyboard.press('Enter'); await p.click('[data-act=notesave]');
console.log('note', await p.evaluate(id=>JSON.stringify(S.c[Q[id].card.id].note.s)+' pos='+RUN.pos,qid));
console.log('stubborn again?', await p.evaluate(id=>stubborn(Q[id]),qid));
await p.evaluate(id=>{ go('card',{c:Q[id].card.id}); },qid); console.log('mynote on card', await p.locator('.mynote').count());
await p.click('[data-act=noteedit]'); await p.fill('#mynote','改過的筆記內容'); await p.click('[data-act=noteput]'); console.log('edited', await p.textContent('.mynote'));
// merge keeps note & nc
console.log('merge', await p.evaluate(id=>{ const a=dclone(S), b=dclone(S); b.days[today()].nc=9; const m=mergeState(a,b); return m.days[today()].nc+' '+!!m.c[Q[id].card.id].note; },qid));
console.log(errs.length?'ERRORS '+errs.join('|'):'NO ERRORS'); await b.close();
