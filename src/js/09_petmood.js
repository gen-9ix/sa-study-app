function petCond(){ const ms=memStats(); if(!ms.n) return {k:'fine',hp:null,low:0};
  const hp=Math.round(ms.avg*100); return {k:hp>=80?'great':hp>=60?'fine':hp>=40?'tired':'sick',hp,low:ms.low}; }
const COND_TXT={great:'精神飽滿',fine:'狀態不錯',tired:'有點頭暈',sick:'生病了'};
function pm(base='idle'){ const c=petCond().k; if(base==='sleep') return base;
  if(c==='sick') return base==='happy'?'tired':'sick'; if(c==='tired') return base==='happy'?'idle':'tired';
  if(c==='great'&&base==='idle') return 'great'; return base; }
function homeSay(D,goal,ms){
  if(HOMETIP.cur){ const x=HOMETIP.cur; const out=say(pm(HOMETIP.n%2?'happy':'idle'),tipHTML(x),72,true); HOMETIP.anim=false; return out; }
  const g=homeGreet(D,goal,ms); return say(pm(g[0]),g[1]+'<span class="hint">點我聽一個 SA 小知識 ›</span>',72,true);
}
function homeGreet(D,goal,ms){
  const say=(m,h)=>[m,h];
  const h=new Date().getHours(), late=(h>=23||h<5), st=streak();
  if(D.n>=goal) return say('happy','今天的目標完成了，辛苦啦！'+(late?'很晚了，早點休息，明天我在這裡等你。':'想加碼的話我也陪你 (・ω・)'));
  if(!ms.n) return say('happy','嗨，'+PETS[curPet()].intro+'從第一張卡開始，我陪你慢慢冒險，不用急。');
  if(late) return say('sleep','這麼晚還來看我呀。學一點點就好，累了就去睡，記憶我幫你顧著。');
  { const c=petCond(); if(c.k==='sick') return say('sick',`嗚……我好不舒服，記憶血量只剩 <b>${c.hp}%</b>。${c.low?`有 <b>${c.low}</b> 個記憶快忘了，`:''}先陪我複習幾題，我就會慢慢好起來 (・_・)`);
    if(c.k==='tired') return say('tired',`我有點頭暈，記憶血量 <b>${c.hp}%</b>。${c.low?`把 <b>${c.low}</b> 個快忘的記憶接回來`:'陪我複習幾題'}，我就會恢復精神。`); }
  if(!D.n&&st>=2) return say('idle',`${greeting()}！我們已經連續 ${st} 天了。今天也一起前進一點點吧。`);
  if(ms.low) return say('idle',`${greeting()}！有 <b>${ms.low}</b> 個記憶在跟我招手，我們去把它們接回來吧。`);
  return say('idle',`${greeting()}！記憶都顧得好好的，來認識幾個新朋友吧。`);
}


