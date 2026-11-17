/* ---------- AI SHEETS ---------- */
function sheet(html){ $('#layer').innerHTML=`<div class="sheetbg" data-act="closesheet"><div class="sheet" data-stop="1" role="dialog" aria-modal="true">${html}</div></div>`; }
function closeSheet(){ if(AI.ctrl){ try{AI.ctrl.abort();}catch(e){} AI.ctrl=null; } $('#layer').innerHTML=''; }
async function aiExplainCard(cid,wrongCtx){
  const c=CARD[cid];
  sheet(`<div class="row between"><h2 class="h2">${icon('spark')} 換個方式講：${md(c.t)}</h2><button class="iconbtn" data-act="closesheet" aria-label="關閉">${icon('x')}</button></div><div class="ai mt-sm" id="aitext" aria-live="polite"><span class="spin"></span> 想一個新的比喻中…</div>`);
  const prompt=`學生對下面這個觀念不熟${wrongCtx?'，剛剛答錯了一題':''}。請「換一個和原本不同的生活化比喻」重新講解，讓他真正理解而不是死背：\n1) 一句話抓重點\n2) 新比喻（具體、有畫面）\n3) 拆解 2–4 個關鍵點，每點對應到比喻\n4) 一個常見陷阱或考試會怎麼問\n5) 最後出一題「一句話就能回答」的小問題讓他自我檢查（附答案，用「答案：」開頭放最後一行）\n全文 350 字以內，不要用 Markdown 標題符號。\n\n觀念卡內容：\n${cardText(c)}${wrongCtx?'\n\n他答錯的題目：\n'+wrongCtx:''}`;
  const ctrl=new AbortController(); AI.ctrl=ctrl;
  try{ await aiStream(prompt,t=>{ const el=$('#aitext'); if(el) el.textContent=t; },ctrl.signal); }
  catch(e){ const el=$('#aitext'); if(el) el.textContent=aiErrMsg(e); }
}
function aiAskCard(cid){
  const c=CARD[cid];
  sheet(`<div class="row between"><h2 class="h2">${icon('chat')} 問 Claude：${md(c.t)}</h2><button class="iconbtn" data-act="closesheet" aria-label="關閉">${icon('x')}</button></div>
  <div class="small muted mt-2xs">例如：「-L 和 -R 我一直搞混」「這個考試會怎麼考？」</div>
  <textarea class="field mt-sm" id="askq" style="min-height:96px" aria-label="你的問題" placeholder="輸入你的問題"></textarea>
  <button class="btn pri block mt-sm" data-act="askgo" data-c="${cid}">送出</button><div class="ai mt-md" id="aitext" aria-live="polite"></div>`);
}
async function aiAskGo(cid){
  const c=CARD[cid]; const qv=($('#askq')?.value||'').trim(); if(!qv) return;
  const out=$('#aitext'); out.innerHTML='<span class="spin"></span>';
  const ctrl=new AbortController(); AI.ctrl=ctrl;
  try{ await aiStream(`學生正在讀這張觀念卡，提出問題。請精準、簡潔（300 字內）回答，必要時舉例或給指令，並對應到考試重點。不要用 Markdown 標題符號。\n\n觀念卡：\n${cardText(c)}\n\n學生的問題：${qv}`,t=>{ if(out) out.textContent=t; },ctrl.signal); }
  catch(e){ out.textContent=aiErrMsg(e); }
}
async function aiGradeSA(){
  const R=RUN, st=R.st, q=Q[R.items[R.pos].id];
  const v=($('#ans')?.value||st.val||'').trim(); st.val=v;
  if(!v){ toast('先寫下你的答案，Claude 才能批改'); return; }
  st.reveal=true; st.aiLoading=true; st.hit=q.p.map(()=>false); render();
  try{
    const res=await aiJSON(`請批改這題系統管理筆試簡答題。嚴格但友善，依「得分點」逐點判斷學生有沒有答到（意思對就算，不要求用字一樣；答錯或觀念錯誤不算）。\n只輸出 JSON：{"score":0-100 的整數,"hit":[每個得分點是否答到的 true/false，順序與得分點相同],"feedback":"120 字內的繁體中文回饋：先說做得好的地方，再明確指出缺漏或錯誤觀念，最後給一句記憶訣竅"}\n\n題目：${q.q}${q.x?'\n'+q.x.join('\n'):''}\n\n參考答案：\n${q.a}\n\n得分點：\n${q.p.map((p,i)=>(i+1)+'. '+p).join('\n')}\n\n學生答案：\n${v}`);
    st.ai={score:Math.max(0,Math.min(100,parseInt(res.score)||0)),feedback:String(res.feedback||'')};
    if(Array.isArray(res.hit)) st.hit=q.p.map((_,i)=>!!res.hit[i]);
  }catch(e){ toast(aiErrMsg(e),2600); }
  st.aiLoading=false; if(RUN===R) render();
}
/* Rough keyword check for a scoring point: share of its English terms and Chinese bigrams found in the answer. */
const SA_STOP=new Set('的是與和在了或及要會可能這那一個用以為對於中時就也都把被讓所並且而如果因為所以可以使用需要'.split(''));
function saKeyHit(ans,point){
  const A=ans.toLowerCase(), P=String(point).replace(/[*`]/g,'').toLowerCase();
  const en=[...new Set((P.match(/[a-z0-9_.\/-]{2,}/g)||[]).filter(w=>!/^(the|and|or|to|of|in|is|on|a|an)$/.test(w)))];
  const zh=[]; for(const run of (P.match(/[\u4e00-\u9fff]+/g)||[])) for(let i=0;i+1<run.length;i++){ const b=run.slice(i,i+2); if(!SA_STOP.has(b[0])||!SA_STOP.has(b[1])) zh.push(b); }
  const zs=[...new Set(zh)];
  const enHit=en.filter(w=>A.includes(w)).length, zhHit=zs.filter(b=>A.includes(b)).length;
  const tot=en.length+zs.length; if(!tot) return false;
  return (enHit+zhHit)/tot>=0.34 || (en.length&&enHit/en.length>=0.6); }
function scoreSA(){
  const R=RUN, st=R.st, q=Q[R.items[R.pos].id];
  const hits=(st.hit||[]).filter(Boolean).length; const ratio=hits/q.p.length;
  const g= ratio>=0.8?2: ratio>=0.4?1:0;
  st.done=true; st.ok=g===2; st.g=g;
  const xp=grade(q.id,g,{xp:Math.round(5+15*ratio)}); R.xp+=xp; R.res[R.pos]=g; { const sq=S.q[q.id]; if(sq){ sq.sb=Math.max(sq.sb||0,ratio); } const D=S.days[today()]; if(D) D.sa=(D.sa||0)+1; save(); }
  if(g===0&&!R.requeued[q.id]){ R.requeued[q.id]=1; }
  toast(g===2?icon('star')+' 得分點都掌握了':g===1?'抓到一部分，會再排複習':'這題會很快再回來找你');
  next();
}

