/* Home speech bubble: greeting by default; each tap swaps in a random SA tidbit drawn from the
   cards (key points, analogies, mnemonics). Endless; avoids repeating the last 40. */
const HOMETIP={cur:null,recent:[],n:0,anim:false};
const TIP_KAO=['(・ω・)','(・_・)','(・o・)','(｀・ω・´)','(´・ω・`)','(￣ー￣)'];
const TIP_PRE=['小知識','你知道嗎','考前提醒','記一下','我剛剛想到','偷偷告訴你'];
let TIPS=null;
function tipPool(){
  if(TIPS) return TIPS; TIPS=[];
  const len=t=>String(t).replace(/[*`]/g,'').length;
  for(const c of CLIST){
    for(const b of c.b) if(len(b)>=10&&len(b)<=90) TIPS.push({c,t:b,k:'b'});
    if(c.a&&len(c.a)<=90) TIPS.push({c,t:c.a,k:'a'});
    if(c.m&&len(c.m)<=90) TIPS.push({c,t:c.m,k:'m'});
  }
  return TIPS;
}
function nextTip(){
  const P=tipPool(); if(!P.length) return null;
  const mine=P.filter(x=>cardStarted(x.c)), src=(mine.length>=15&&Math.random()<0.6)?mine:P;
  let x=null; for(let g=0;g<30;g++){ x=src[Math.random()*src.length|0]; if(!HOMETIP.recent.includes(x)&&x!==HOMETIP.cur) break; }
  HOMETIP.recent.push(x); if(HOMETIP.recent.length>40) HOMETIP.recent.shift();
  const pre=x.k==='m'?'口訣時間':x.k==='a'?'打個比方':TIP_PRE[Math.random()*TIP_PRE.length|0];
  return Object.assign({},x,{pre,kao:Math.random()<0.4?TIP_KAO[Math.random()*TIP_KAO.length|0]:''});
}
function tipHTML(x){
  return `<span class="tiphead"><span class="tipk">${esc(x.pre)}</span><span>·</span>${chTag(x.c.ch)}<span>${md(x.c.t)}</span></span>${md(x.t)}${x.kao?' '+x.kao:''}<button class="tiplink" data-act="card" data-c="${x.c.id}">看這張卡 ${icon('right')}</button>${HOMETIP.n<=2?'<span class="hint">再點一下換一個</span>':''}`;
}
/* 8-bit style sound effects, synthesised with WebAudio (no files) */
