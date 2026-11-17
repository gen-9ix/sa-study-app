/* ═════════════════════ BOSS BATTLES ═════════════════════
   One boss per chapter. A battle is an ordinary practice run (so every answer still feeds the
   spaced-repetition schedule) with a battle layer on top: a right answer hits the boss, a combo of
   3+ lands a critical hit, a wrong answer costs one of your hearts. */
const BOSS_ARCH={
  golem:{h:'y',rows:["................","....oooooooo....","...obbbbbbbbo...","...obbbbbbbbo...","...obeebbeebo...","...obbbbbbbbo...","...obbnnnnbbo...","..oooobbbboooo..",".obbbbbbbbbbbbo.","obbobbbbbbbbobbo","obbobbhhhhbbobbo","obbobbhhhhbbobbo",".oo.obbbbbbo.oo.","....obbo.obbo...","...obbbo.obbbo..","...ooooo.ooooo.."]},
  reaper:{h:'w',extra:[[-1,0,'w',1,15],[-3,0,'s',2,1],[-4,1,'s',2,1],[-5,2,'s',1,1]],rows:["................","......oooo......","....oobbbboo....","...obbbbbbbbo...","..obbnnnnnnbbo..","..obnnennennbo..","..obnnnnnnnnbo..","..obbnnnnnnbbo..",".obbbbbbbbbbbbo.",".obbbbbbbbbbbbo.","obbbbbbbbbbbbbbo","obbbbbbbbbbbbbbo","obbbbbbbbbbbbbbo","obobobobobobobo.",".o.o.o.o.o.o.o..","................"]},
  serpent:{h:'w',rows:["................","........oooo....",".......obbbbo...","......obebbebo..","......obbbbbbo..","......obwnnwbo..",".......obbbbo...","........obbo....","....ooooobbo....","...obbbbbbbo....","..obhhhhbbbo....","..obbbbbbbbbooo.",".obbbbbbbbbbbbbo",".obhhhhhhhhhhbo.","..obbbbbbbbbbo..","...oooooooooo..."]},
  imp:{h:'y',rows:["................","...o........o...","...oo......oo...","....oboooobo....","...obbbbbbbbo...","..obbbbbbbbbbo..","..obeebbbbeebo..","..obbbbbbbbbbo..","..obbwnnnnwbbo..","...obbnnnnbbo...","....obbbbbbo....","...obbbbbbbbo...","..obobbbbbbobo..","...obbbbbbbbo...","...obbo..obbo...","...oooo..oooo..."]}
};
const BOSSES={
  shell:['serpent','g','Glob 巨蛇','把你的星號全部展開成檔名的巨蛇'],
  sh:['imp','y','空變數小惡魔','專門躲在沒加引號的 $var 裡'],
  net:['reaper','s','封包遺失幽影','你的封包有去無回'],
  boot:['golem','d','開機卡關石像','擋在 GRUB 和 systemd 之間'],
  user:['imp','r','越權 root 小惡魔','總想把自己加進 sudoers'],
  proc:['reaper','r','SIGKILL 死神','不接受 trap 的那一位'],
  cron:['serpent','d','午夜排程蛇','每到 * * * * * 就醒來'],
  fs:['golem','s','權限迷宮守衛','rwx 少一個就不讓你過'],
  lvm:['golem','g','LVM 巨像','由 PV、VG、LV 堆成的巨人'],
  btrfs:['reaper','g','快照幻影','從唯讀快照裡爬出來'],
  docker:['serpent','s','貨櫃深海蛇','把你的 port 吞進容器裡'],
  hw2:['golem','r','救援模式魔王','HW2 的最終關卡'],
  ext1:['imp','g','憑證過期小惡魔','讓你的 TLS 半夜失效'],
  ext2:['serpent','y','防火牆巨蛇','drop 掉所有不認識的封包'],
  systemd:['golem','y','依賴循環石像','Requires 了自己又 After 了自己'],
  docker2:['imp','s','肥大映像小惡魔','把 node_modules 整包 COPY 進 image'],
  hw3:['reaper','y','中間人憑證死神','握著一把被算出來的 CA 私鑰']
};
const BOSS_HP=8, BOSS_HEARTS=4;
/* Bosses get stronger every time you beat them (Lv.1 → Lv.10). */
function bossLv(chId){ const r=bossRec(chId); return Math.min(10,((r&&r.w)||0)+1); }
function bossCfg(L){ return {hp:Math.min(20,BOSS_HP+2*(L-1)), hearts:L>=8?2:L>=5?3:4, half:L<3, heal:L>=4, crit:L>=6?4:3}; }
function bossMods(L){ const c=bossCfg(L), m=[`HP ${c.hp}`,`你的心 ${c.hearts}`];
  if(!c.half) m.push('半對不造成傷害'); if(c.heal) m.push('答錯時它回 1 HP'); if(c.crit>3) m.push(`連對 ${c.crit} 題才會心一擊`); return m; }
function bossReward(L,first){ return first?60:20+10*(L-1); }
/* dead sprite: eyes become X marks */
function deadSprite(A){
  const rows=A.rows.map(r=>r.split('')), extra=[], seenE=new Set(), eyes=[];
  for(let y=0;y<16;y++) for(let x=0;x<16;x++){ if(rows[y][x]!=='e'||seenE.has(x+','+y)) continue;
    let w=0; while(x+w<16&&rows[y][x+w]==='e'){ seenE.add((x+w)+','+y); w++; }
    const bg=(rows[y][x-1]&&rows[y][x-1]!=='o'&&rows[y][x-1]!=='e')?rows[y][x-1]:'b';
    for(let k=0;k<w;k++) rows[y][x+k]=bg;
    eyes.push({cx:x<8?x+w-1:x,y,col:bg==='n'?'w':'o'}); }
  // keep a one-pixel gap between the two X marks so they do not merge into a checkerboard
  if(eyes.length===2&&eyes[0].y===eyes[1].y&&Math.abs(eyes[1].cx-eyes[0].cx)<5){ const [l,r]=eyes[0].cx<eyes[1].cx?eyes:[eyes[1],eyes[0]]; const need=5-(r.cx-l.cx); l.cx-=Math.ceil(need/2); r.cx+=Math.floor(need/2); }
  for(const e of eyes) for(const [dx,dy] of [[-1,-1],[1,-1],[0,0],[-1,1],[1,1]]) extra.push([e.cx+dx,e.y+dy,e.col]);
  return {rows:rows.map(r=>r.join('')),extra}; }
function spriteSVG(rows,map,size,extra,cls){
  const at=(x,y)=>(y<0||y>15||x<0||x>15)?'.':rows[y][x], solid=c=>c!=='.'&&c!=='o', ink=c=>PAL[map[c]||'w'];
  const px=(x,y,c,w=1,h=1,k='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="p${c}${k?' '+k:''}"/>`;
  let out='';
  for(let y=0;y<16;y++){ let x=0; while(x<16){ const ch=rows[y][x]; if(ch==='.'){ x++; continue; }
    if(ch==='o'){ let nb=''; for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]]){ const c=at(x+dx,y+dy); if(solid(c)){ nb=c; break; } }
      out+= nb? px(x,y,ink(nb))+px(x,y,'o',1,1,'olo') : px(x,y,PAL.o); x++; continue; }
    let w=1; while(x+w<16&&rows[y][x+w]===ch) w++; out+=px(x,y,ink(ch),w); x+=w; } }
  for(const a of (extra||[])) out+=px(a[0],a[1],a[2],a[3]||1,a[4]||1);
  return `<svg class="pet ${cls||''}" viewBox="-6 -2 28 20" shape-rendering="crispEdges" style="width:${size}px;height:${size*20/28}px" aria-hidden="true">${out}</svg>`;
}
function bossSVG(chId,size,cls,dead){ const B=BOSSES[chId]||BOSSES.shell, A=BOSS_ARCH[B[0]];
  if(dead){ const D=deadSprite(A); const xs=D.extra.map(e=>[e[0],e[1],e[2]]); return spriteSVG(D.rows,{b:B[1],e:'y',n:'o',h:A.h,w:'w'},size,[...(A.extra||[]).map(e=>[e[0],e[1],e[2],e[3],e[4]]),...xs],'boss-spr '+(cls||'')); }
  return spriteSVG(A.rows,{b:B[1],e:'y',n:'o',h:A.h,w:'w'},size,A.extra,'boss-spr '+(cls||'')); }
function bossRec(chId){ return (S.boss||{})[chId]||null; }
function bossItems(ch,n){
  const pool=QLIST.filter(q=>q.card.ch===ch&&q.k!=='sa');
  const seenQ=shuffle(pool.filter(q=>seen(q.id))).sort((a,b)=>qMastery(a.id)-qMastery(b.id)+(Math.random()-.5)*0.4);
  const fresh=shuffle(pool.filter(q=>!seen(q.id)));
  return [...seenQ,...fresh].slice(0,n).map(q=>({t:'q',id:q.id,nw:!seen(q.id)}));
}
function startBoss(chId){
  const ch=CHMAP[chId]; if(!ch) return;
  const L=bossLv(chId), C=bossCfg(L); const items=bossItems(ch,C.hp*3);
  if(items.length<4){ toast('這一章的題目還不夠開打 (・_・)'); return; }
  startRun(items,{mode:'boss',ch:chId});
  RUN.boss={ch:chId,lv:L,cfg:C,hpMax:C.hp,phMax:C.hearts,hp:C.hp,php:C.hearts,line:`* Lv.${L} ${BOSSES[chId][2]} 擋住了去路。\n* ${L>1?'它比上次更強了。':BOSSES[chId][3]+'。'}答對就能攻擊它！`,anim:'',combo:0};
  render(); sfx('hurt');
}
function bossOnAnswer(R,g,ok){
  const B=R.boss, name=BOSSES[B.ch][2];
  const C=B.cfg||bossCfg(1);
  if(!ok&&g===1&&!C.half){ B.combo=0; B.anim='';
    B.line=`* 半對……${name} 用盔甲擋下了攻擊。\n* 要完全答對才會造成傷害。`; setTimeout(()=>sfx('mid'),60); }
  else if(ok||g===1){ B.combo=ok?B.combo+1:0; const crit=ok&&B.combo>=C.crit; const dmg=crit?2:1; B.hp=Math.max(0,B.hp-dmg); B.anim='hit';
    B.line=crit?`* 會心一擊！連續答對 ${B.combo} 題。\n* ${name} 受到 ${dmg} 點傷害。`:`* 答對了！你攻擊了 ${name}。\n* 它受到 ${dmg} 點傷害。`;
    if(B.hp<=0){ B.won=true; B.anim='die'; B.line=`* ${name} 倒下了。\n* 你贏了！`; setTimeout(()=>sfx('die'),80); } else setTimeout(()=>sfx('hit'),60); }
  else { B.combo=0; B.php=Math.max(0,B.php-1); B.anim='hurt';
    const healed=C.heal&&B.hp<B.hpMax; if(healed) B.hp++;
    B.line=`* ${name} 的反擊！\n* 你失去 1 顆心${healed?'，它還回復了 1 HP':''}。看一下下面的解析再繼續。`;
    if(B.php<=0){ B.lost=true; B.line=`* 你的心碎了……\n* 但答錯的題目都記下來了，下次會更強。`; } setTimeout(()=>sfx('hurt'),60); }
  if(!B.won&&!B.lost&&R.items.length-R.pos<3){ const ch=CHMAP[B.ch]; const more=bossItems(ch,8).filter(x=>!R.items.slice(R.pos).some(y=>y.id===x.id)); R.items.push(...more); }
}
function battleHead(R){
  const B=R.boss, b=BOSSES[B.ch], HM=B.hpMax||BOSS_HP, PM=B.phMax||BOSS_HEARTS, hpCells=Array.from({length:HM},(_,i)=>`<i${i<B.hp?' class="on"':''}></i>`).join('');
  const hearts=Array.from({length:PM},(_,i)=>`<span class="ht${i<B.php?' on':''}">${icon('heart')}</span>`).join('');
  const dust=Array.from({length:14},(_,i)=>{ const a=i/14*Math.PI*2, r=40+((i*37)%30); return `<i style="--dx:${Math.round(Math.cos(a)*r)}px;--dy:${Math.round(Math.sin(a)*r*0.7-20)}px;animation-delay:${(0.95+(i%5)*0.05).toFixed(2)}s"></i>`; }).join('');
  const html=`<div class="topbar"><button class="back" data-act="back" aria-label="逃跑">${icon('x')}</button><div class="grow small muted">魔王戰：${esc(CHMAP[B.ch].t)}</div><span class="combo small">+${R.xp}</span></div>
  <section class="battle${B.anim==='hurt'?' hurt':''}" aria-label="魔王戰">
    <div class="row between"><span class="bname">${esc(b[2])} <span class="blv">Lv.${B.lv||1}</span></span><span class="tiny muted num">HP ${B.hp}/${HM}</span></div>
    <div class="bhp" role="meter" aria-label="魔王血量" aria-valuemin="0" aria-valuemax="${HM}" aria-valuenow="${B.hp}">${hpCells}</div>
    <div class="bstage">${B.won?bossSVG(B.ch,190,B.anim==='die'?'dying':'dead',true)+(B.anim==='die'?`<div class="dust" aria-hidden="true">${dust}</div><div class="ko">K.O.</div>`:''):bossSVG(B.ch,190,B.anim==='hit'?'hit':'')}</div>
    <div class="utbox" aria-live="polite"><span class="utt" data-full="${esc(B.line)}">${esc(B.line).replace(/\n/g,'<br>')}</span></div>
    <div class="row between mt-xs"><span class="hearts" aria-label="你的心 ${B.php}/${PM}">${hearts}</span><span class="tiny muted">${B.combo>=2?'連擊 '+B.combo:''}</span></div>
  </section>`;
  B.anim=''; return html;
}
function bossTypewriter(){
  const el=document.querySelector('.utbox .utt'); if(!el) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const full=el.getAttribute('data-full')||''; let i=0; el.textContent='';
  clearInterval(bossTypewriter.t); bossTypewriter.t=setInterval(()=>{ i+=1; el.innerHTML=esc(full.slice(0,i)).replace(/\n/g,'<br>'); if(i>=full.length) clearInterval(bossTypewriter.t); },28);
}
function bossSummary(R){
  const B=R.boss, b=BOSSES[B.ch], won=!!B.won;
  const wrongIds=[...new Set(R.items.filter((it,i)=>it.t==='q'&&R.res[i]===0).map(it=>it.id))];
  return `<div class="topbar"><h1 class="grow h2">${won?'勝利！':'這次先撤退'}</h1></div>
  <section class="battle center">
    <div class="bstage">${won?bossSVG(B.ch,170,'dead',true)+'<div class="ko" style="animation:none;opacity:1">K.O.</div>':bossSVG(B.ch,170,'')}</div>
    <div class="utbox"><span>${won?`* 你打倒了 Lv.${B.lv||1} 的 ${esc(b[2])}！<br>* ${(B.lv||1)<10?`它記住你了。下次會以 Lv.${(B.lv||1)+1} 的姿態回來。`:'它已經是最強的型態了。'}`:`* Lv.${B.lv||1} 的 ${esc(b[2])} 還站著。<br>* 答錯的題目已排進複習，練好再回來。`}</span></div>
    <div class="stats"><span class="chip g">+${R.xp} XP</span>${won&&B.bonus?`<span class="chip y">${icon('trophy')} 勝利獎勵 +${B.bonus} XP</span>`:''}${won&&B.fzGift?`<span class="chip">${icon('ice')} 補簽卡 +1</span>`:''}<span class="chip">${icon('heart')} 剩 ${B.php} 顆心</span></div>
    ${won?`<div class="tiny muted mt-xs">下一戰：${bossMods(Math.min(10,(B.lv||1)+1)).join('、')}</div>`:''}
  </section>
  ${wrongIds.length?`<div class="card"><h2 class="h2">這場的盲點</h2><div class="small muted">已排進複習</div>${[...new Set(wrongIds.map(id=>Q[id].card))].map(cardRow).join('')}</div>`:''}
  <div class="sp-dock"></div>
  <div class="dock"><div><button class="btn" data-act="go" data-v="bosses">魔王一覽</button><button class="btn pri" data-act="boss" data-ch="${B.ch}">${won?'再打一次':'再挑戰'}</button></div></div>`;
}
function bossFinish(R){
  const B=R.boss; if(B.done) return; B.done=true;
  if(!S.boss) S.boss={};
  const rec=S.boss[B.ch]||{w:0,l:0,t:0};
  if(B.won){ const L=B.lv||1; B.bonus=bossReward(L,!rec.w); rec.best=Math.max(rec.best||0,L);
    if([3,6,9].includes(L)&&!(rec.fz&&rec.fz[L])){ rec.fz=Object.assign({},rec.fz,{[L]:1}); if(S.fz.n<5){ S.fz.n++; S.fz.t=now(); B.fzGift=1; } }
    S.xp+=B.bonus; const D=S.days[today()]||(S.days[today()]={n:0,c:0,x:0,nw:0}); D.x+=B.bonus; rec.w++; setTimeout(()=>{ confetti(); sfx('fanfare'); },200); }
  else rec.l++;
  rec.t=now(); S.boss[B.ch]=rec; save();
}
function viewBosses(){
  const won=CH.filter(ch=>bossRec(ch.id)?.w).length;
  return topbar('魔王一覽')+`<div class="small muted" style="margin-bottom:var(--space-sm)">每章一隻魔王。答對攻擊、連對會心一擊，答錯會失去一顆心。每打倒一次它就升一級（最高 Lv.10），血更厚、規則更嚴，獎勵也更多；Lv.3、6、9 第一次打贏各送一張補簽卡。已擊敗 ${won} / ${CH.length}</div>
  <div class="grid2">${CH.map(ch=>{ const r=bossRec(ch.id), p=chProgress(ch); return `<button class="tile${r?.w?' on':''}" data-act="boss" data-ch="${ch.id}">${bossSVG(ch.id,110)}<span class="t">${esc(BOSSES[ch.id][2])}</span><span class="d">${chTag(ch)} ${esc(ch.t)}</span><span class="d blv">下一戰 Lv.${bossLv(ch.id)}</span><span class="d">${r?.w?`${icon('trophy')} 最高通關 Lv.${r.best||r.w}`:p.s?'見過 '+p.s+'/'+p.n+' 題':'還沒學過，硬打也可以'}</span></button>`; }).join('')}</div>`;
};

