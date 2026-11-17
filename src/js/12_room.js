/* ═════════════════════ PET ROOM ═════════════════════
   Each chapter unlocks one piece of furniture: beat that chapter's boss, or reach 60% mastery.
   Unlocked pieces can be placed or put away; the pet lives in the middle of the room. */
const ROOM_ITEMS=[
 {id:'window',ch:'ext2',name:'夜景窗',x:37,y:7,layer:0,rows:["oooooooooooooooooo","onnnnnnnnnnnnnnnno","onnwnnnnnnnnnyynno","onnnnnnnnwnnyyyyno","onnnnnnnnnnnyyyyno","onnnnwnnnnnnnyynno","oooooooooooooooooo","onnnnnnnnnnnnnnnno","onnnnnnnwnnnnnnnno","onwnnnnnnnnnnnwnno","onnnnnnnnnnnnnnnno","oooooooooooooooooo","okkkkkkkkkkkkkkkko","oooooooooooooooooo"]},
 {id:'calendar',ch:'cron',name:'排程日曆',x:70,y:9,layer:0,rows:["oooooooo","orrrrrro","oooooooo","owwwwwwo","ownwnwno","owwwwwwo","ownwnwro","owwwwwwo","oooooooo"]},
 {id:'clock',ch:'proc',name:'行程時鐘',x:93,y:5,layer:0,rows:["..oooo..",".owwwwo.","owwnwwwo","owwnwwwo","owwnnnwo","owwwwwwo",".owwwwo.","..oooo.."]},
 {id:'photos',ch:'btrfs',name:'快照照片牆',x:18,y:10,layer:0,rows:["ooooo.ooooo.ooooo","osdso.oyryo.ogdgo","ossso.oyyyo.ogggo","owwwo.owwwo.owwwo","ooooo.ooooo.ooooo"]},
 {id:'door',ch:'user',name:'名牌房門',x:3,y:22,layer:0,rows:(()=>{ const O='o'.repeat(14), B='o'+'k'.repeat(12)+'o', T='okk'+'o'.repeat(8)+'kko', M='okk'+'o'+'w'.repeat(6)+'o'+'kko', L='ok'+'K'.repeat(10)+'ko', P='okK'+'k'.repeat(8)+'Kko', N='o'+'k'.repeat(10)+'yk'+'o'; return [O,B,T,M,T,B,L,P,P,L,B,N,N,B,L,P,P,P,L,B,B,B,B,B,B,B,O]; })()},
 {id:'router',ch:'net',name:'小路由器',x:86,y:19,layer:0,rows:["..o...o.","..o...o.","oooooooo","ommmmmmo","omgmamro","oooooooo"]},
 {id:'trophy',ch:'hw2',name:'HW2 獎盃',x:100,y:15,layer:0,rows:["oooooooo","oyyyyyyo","yoyyyyoy","yoyyyyoy",".oyyyyo.","..oyyo..","...oo...","..oyyo..",".oooooo."]},
 {id:'lamp',ch:'boot',name:'開機落地燈',x:14,y:33,layer:1,rows:[".oooooo.","oaaaaaao","oaaaaaao","oooooooo","...mm...","...mm...","...mm...","...mm...","...mm...","...mm...","...mm...","...mm...","...mm...","...mm...","...mm...","...mm...","...mm...","...mm...","..mmmm..",".oooooo."]},
 {id:'desk',ch:'sh',name:'腳本書桌',x:22,y:48,layer:1,rows:["oooooooooooooooooooooooo","okkkkkkkkkkkkkkkkkkkkkko","oooooooooooooooooooooooo",".oko................oko.",".oko................oko.",".oko................oko.",".oko................oko.",".ooo................ooo."]},
 {id:'crt',ch:'shell',name:'復古終端機',x:29,y:39,layer:2,rows:["oooooooooo","ommmmmmmmo","omnnnnnnmo","omnannnnmo","omnnaaanmo","omnnnnnnmo","ommmmmmmmo","oooommoooo","..oooooo.."]},
 {id:'books',ch:'fs',name:'檔案書櫃',x:100,y:34,layer:1,rows:["oooooooooooooo","okkkkkkkkkkkko","okrosoyogowoko","okrosoyogowoko","okrosoyogowoko","okkkkkkkkkkkko","okdowoorosgoko","okdowoorosgoko","okdowoorosgoko","okkkkkkkkkkkko","okyogodowosoko","okyogodowosoko","okyogodowosoko","okkkkkkkkkkkko","okkkkkkkkkkkko","okkkkkkkkkkkko","okkkkkkkkkkkko","okkkkkkkkkkkko","okkkkkkkkkkkko","oooooooooooooo"]},
 {id:'disks',ch:'lvm',name:'LVM 磁碟塔',x:86,y:44,layer:1,rows:["oooooooo","ommmmmgo","oooooooo","ommmmmgo","oooooooo","ommmmmgo","oooooooo","ommmmmgo","oooooooo","ommmmmmo","ommmmmmo","oooooooo"]},
 {id:'crate',ch:'docker',name:'貨櫃收納箱',x:3,y:58,layer:2,rows:["oooooooooooo","oddoddoddodo","odsodsodsodo","odsodsodsodo","odsodsodsodo","odsodsodsodo","oddoddoddodo","oooooooooooo"]},
 {id:'plant',ch:'ext1',name:'藍葉盆栽',x:107,y:55,layer:2,rows:["...oo...","..ogo.o.",".ogggogo","ogggggo.",".oggggo.","..oggo..","...oo...","oooooooo","orrrrrro",".orrrro.",".orrrro.","..oooo.."]},
 {id:'panel',ch:'systemd',name:'服務開關面板',x:74,y:24,layer:0,rows:["oooooooooo","ommmmmmmmo","omgmgmrmmo","omomomommo","ommmmmmmmo","omgmrmgmmo","omomomommo","ommmmmmmmo","omwwwwwwmo","oooooooooo"]},
 {id:'cert',ch:'hw3',name:'自簽憑證框',x:44,y:22,layer:0,rows:["oooooooooooo","okkkkkkkkkko","okwwwwwwwwko","okwnnnnnnwko","okwwwwwwwwko","okwnnnnwwwko","okwwwwwrrwko","okwnnwwrrwko","okkkkkkkkkko","oooooooooooo"]},
 {id:'whale',ch:'docker2',name:'鯨魚抱枕',x:88,y:62,layer:2,rows:["..oooooo...o.o","ossssssssoo.oso",".osssssssssoso.","osossssssssso..","ossssssssssso..","owwwwwwwwwso...",".owwwwwwwoo....","..ooooooo......"]},
];
const ROOM_INK={o:'q-o',w:'q-w',x:'q-x',r:'q-r',y:'q-y',g:'q-g',s:'q-s',d:'q-d',n:'q-n',m:'q-m',k:'q-k',K:'q-K',a:'q-a'};
/* light comes from the pendant lamp at (62,17): each piece gets a soft shadow on the far side,
   a warm rim on the edge facing the lamp, a darker bottom edge, and floor pieces cast a shadow. */
const LAMP_X=62;
function roomRects(it){
  const H=it.rows.length, W=it.rows[0].length, on=(x,y)=>y>=0&&y<H&&x>=0&&x<W&&it.rows[y][x]!=='.'&&it.rows[y][x]!==' ';
  const side=(it.x+W/2)<LAMP_X?-1:1, floor=it.layer>=1;
  const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${c}"/>`;
  let shd='', cast='', body='', rim='', ao='';
  if(floor){ const by=it.y+H, sx=it.x+(side>0?2:-2);
    cast+=rect(sx,by-1,W,1,'q-cast')+rect(sx+side*2,by,W-2,1,'q-cast q-cast2'); }
  it.rows.forEach((row,y)=>{ let x=0; while(x<W){ const c=row[x]; if(c==='.'||c===' '){ x++; continue; } let w=1; while(x+w<W&&row[x+w]===c) w++; body+=rect(it.x+x,it.y+y,w,1,ROOM_INK[c]||'q-w'); x+=w; } });
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ if(!on(x,y)) continue;
    if(!on(x+side,y+1)) shd+=rect(it.x+x+side,it.y+y+1,1,1,'q-shd');
    if(!on(x-side,y)&&!on(x,y-1)) rim+=rect(it.x+x,it.y+y,1,1,'q-rim');
    else if(!on(x-side,y)) rim+=rect(it.x+x,it.y+y,1,1,'q-rim q-rim2');
    if(!on(x,y+1)||!on(x+side,y)) ao+=rect(it.x+x,it.y+y,1,1,'q-ao'); }
  return cast+shd+body+ao+rim;
}
function roomUnlocked(it){ const ch=CHMAP[it.ch]; if(!ch) return false; return !!bossRec(it.ch)?.w || chMastery(ch)>=0.6; }
function roomShown(it){ return roomUnlocked(it) && !((S.room||{}).hide||{})[it.id]; }
function roomSVG(){
  let back='', mid='', front='';
  for(const it of ROOM_ITEMS){ if(!roomShown(it)) continue; const r=roomRects(it); if(it.layer===0) back+=r; else if(it.layer===1) mid+=r; else front+=r; }
  const shelf=`<rect x="85" y="28" width="26" height="2" class="q-shd"/><rect x="84" y="25" width="26" height="2" class="q-k"/><rect x="84" y="27" width="26" height="1" class="q-o"/><rect x="84" y="25" width="26" height="1" class="q-rim q-rim2"/>`;
  const seams=`<rect x="0" y="2" width="120" height="3" class="q-ao2"/><rect x="0" y="46" width="120" height="3" class="q-ao2"/><rect x="0" y="51" width="120" height="2" class="q-ao2"/>`;
  const petShadow=`<rect x="54" y="63" width="18" height="1" class="q-cast"/><rect x="56" y="64" width="14" height="1" class="q-cast"/>`;
  return `<svg class="room-svg" viewBox="0 0 120 72" shape-rendering="crispEdges" role="img" aria-label="夥伴的小房間">
    <defs>
      <radialGradient id="rmGlow" class="glow-lamp" cx="62" cy="17" r="44" gradientUnits="userSpaceOnUse"><stop offset="0" stop-opacity=".42"/><stop offset=".35" stop-opacity=".16"/><stop offset="1" stop-opacity="0"/></radialGradient>
      <radialGradient id="rmPool" class="glow-lamp" cx="62" cy="63" r="26" gradientUnits="userSpaceOnUse" gradientTransform="translate(62 63) scale(1 .35) translate(-62 -63)"><stop offset="0" stop-opacity=".3"/><stop offset="1" stop-opacity="0"/></radialGradient>
      <radialGradient id="rmLamp2" class="glow-lamp" cx="18" cy="36" r="22" gradientUnits="userSpaceOnUse"><stop offset="0" stop-opacity=".3"/><stop offset="1" stop-opacity="0"/></radialGradient>
      <radialGradient id="rmDark" class="glow-shade" cx="62" cy="30" r="80" gradientUnits="userSpaceOnUse"><stop offset=".35" stop-opacity="0"/><stop offset="1" stop-opacity=".75"/></radialGradient>
    </defs>
    <rect x="0" y="0" width="120" height="50" class="q-wall"/><rect x="0" y="0" width="120" height="2" class="q-wall2"/>
    <rect x="0" y="49" width="120" height="2" class="q-base"/><rect x="0" y="51" width="120" height="21" class="q-floor"/>
    ${Array.from({length:6},(_,i)=>`<rect x="0" y="${54+i*3}" width="120" height="1" class="q-floor2"/>`).join('')}
    ${seams}<rect x="45" y="61" width="36" height="7" class="q-cast"/><rect x="44" y="60" width="36" height="7" class="q-rug"/><rect x="46" y="61" width="32" height="5" class="q-rug2"/><rect x="44" y="60" width="36" height="1" class="q-rim q-rim2"/>
    ${shelf}${back}${mid}${petShadow}${front}
    <rect x="62" y="0" width="1" height="11" class="q-o"/><rect x="58" y="11" width="9" height="1" class="q-o"/><rect x="57" y="12" width="11" height="3" class="q-K"/><rect x="57" y="15" width="11" height="1" class="q-o"/><rect x="60" y="16" width="5" height="1" class="q-a"/>
    <rect x="0" y="0" width="120" height="72" fill="url(#rmDark)" class="room-dark"/>
    <rect x="0" y="0" width="120" height="72" fill="url(#rmGlow)" class="room-glow"/>
    <rect x="0" y="0" width="120" height="72" fill="url(#rmPool)" class="room-glow"/>
    ${roomShown(ROOM_ITEMS.find(i=>i.id==='lamp'))?'<rect x="0" y="0" width="120" height="72" fill="url(#rmLamp2)" class="room-glow"/>':''}</svg>`;
}
function roomTick(){
  if(!PROF.cur) return;
  if(!S.room) S.room={hide:{},seen:{},t:0};
  S.room.seen=S.room.seen||{}; S.room.hide=S.room.hide||{};
  const fresh=ROOM_ITEMS.filter(it=>roomUnlocked(it)&&!S.room.seen[it.id]);
  if(fresh.length){ for(const it of fresh) S.room.seen[it.id]=1; S.room.t=now(); save(); setTimeout(()=>{ toast(icon('box')+' 小房間解鎖新家具：'+fresh.map(i=>i.name).join('、'),3200); sfx('coin'); },600); }
}
function viewRoom(){
  const P=PETS[curPet()], st=petStage(), N=EVO[curPet()].names, got=ROOM_ITEMS.filter(roomUnlocked).length;
  const rows=ROOM_ITEMS.map(it=>{ const ch=CHMAP[it.ch], u=roomUnlocked(it), shown=roomShown(it), m=pct(chMastery(ch));
    return `<div class="li"><span class="ic-tile">${u?icon('box'):icon('lock')}</span><span class="grow"><span class="t">${u?esc(it.name):'？？？'}</span><span class="m">${chTag(ch)} ${u?esc(ch.t):`擊敗 ${esc(BOSSES[it.ch][2])}，或本章掌握 60%（目前 ${m}%）`}</span></span>${u?`<button class="btn sm${shown?'':' pri'}" data-act="roomtoggle" data-i="${it.id}" aria-pressed="${shown}">${shown?'收起':'擺上'}</button>`:''}</div>`; }).join('');
  return topbar(P.name+'的小房間',`<span class="combo small">${got}/${ROOM_ITEMS.length}</span>`)+`
  <div class="split"><div>
  <div class="room">${VIEW.form!=null?`<span class="memo">回憶：${esc(N[VIEW.form])}</span>`:''}${roomSVG()}<button class="room-pet" data-act="roompet" aria-label="摸摸${P.name}">${mascot(VIEW.happy?'happy':pm('idle'),96,null,VIEW.form)}</button></div>
  <div class="small muted mt-sm">每章一件家具。打倒那章的魔王，或把那章練到 60%，就會解鎖。點夥伴可以摸摸它。</div>
  <div class="sec">成長相簿<span class="note">點一下，讓${P.name}變回那時候的樣子</span></div>
  <div class="card"><div class="forms">${N.map((n,i)=>{ const got=i<=st, on=(VIEW.form??st)===i;
    return `<button class="form${on?' on':''}" ${got?`data-act="roomform" data-i="${i}"`:'disabled'} aria-pressed="${on}" aria-label="${got?n:'還沒解鎖的型態'}">${got?mascot('idle',52,null,i):`<span class="sil" aria-hidden="true">${icon('lock','lg')}</span>`}<span class="fn">${got?esc(n):'？？？'}</span><span class="fl">${i===st?'現在':'Lv.'+STAGE_LV[i]}</span></button>`; }).join('')}</div>
  ${VIEW.form!=null&&VIEW.form!==st?`<button class="btn sm block mt-sm" data-act="roomform" data-i="${st}">回到現在的樣子</button>`:''}</div>
  </div><div>
  <div class="sec">家具</div><div class="card">${rows}</div>
  </div></div>`;
}

