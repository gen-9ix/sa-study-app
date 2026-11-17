const PAL={o:'o',w:'w',x:'x',r:'r',y:'y',g:'g',s:'s',d:'d'};  // sprite inks live in CSS (--px-*)
const PETS={
  crab:{name:'殼殼',kind:'寄居蟹',intro:'我是寄居蟹殼殼，Shell 的那個殼！',map:{b:'w',g:'y',h:'w',r:'r'},eyes:[[3,10],[6,10]],top:1,cx:9,rows:[
    "................",".......ooooo....",".....oogggggoo..","....ogghhgggggo.","....oggggoooggo.","...ogggggoggogo.","...ogggggoggggo.","...oggggggooggo.",
    "....oggggggggo..","..ooooogggggo...",".obbbbbooooo....","obbbbbbbbbbo....","obrbbbbbbrbo.oo.",".obbbbbbbbo.obbo","..oooooooo...oo.","................"]},
  slime:{name:'噗噗',kind:'史萊姆',intro:'我是史萊姆噗噗，軟軟的但很可靠！',map:{b:'g',h:'w',r:'r'},eyes:[[10,9]],top:3,cx:8,rows:[
    "................","................","................","......oo........",".....obo........",".....obbo.......","....obbbbooo....","...obhbbbbbbo...","..obhbbbbbbbbo..","..obbbbbbbbbbo..",".obbbbbbbbbbbbo.",".obbbbbbbbbrbbo.",".obbbbbbbbbbbbo.","..obbbbbbbbbbo..","...oooooooooo...","................"]},
  husky:{name:'奇奇',kind:'哈士奇',intro:'我是哈士奇奇奇，精力用不完，陪你衝到最後汪！',map:{b:'d',w:'w',n:'o',r:'r'},eyes:[[12,5]],top:1,cx:8,rows:[
    "................","..........o..o..",".........oboobo.","........obbbbbo.",".......obbbbbbbo","..o....obbbwwwbo",".obo...obwwwwwwn",".owo..obwwwwwno.","..obo.obbwwwwo..","...obbbbbbwwwo..","..obbbbbbbwwwo..","..obbbbbbbbwwo..","..obwwbbbbbwwo..","..obwwwbbbowwo..","..owwwwoooowwo..","...oooo....oo..."]},
  chick:{name:'啾啾',kind:'小雞',intro:'我是啾啾！每天啄一點點，就會長大啾。',map:{b:'y',h:'w',r:'r'},eyes:[[10,5]],top:2,cx:8,rows:[
    "................","................","......oooo......",".....obbbbo.....","....obbbbbbo....","....obbbbbbbo...","...obbbbbbbbbrr.","...obbbbbbbrbo..","..obbbbbbbbbbo..",".obbhhhhbbbbbo..",".obbbhhhbbbbbo..",".obbbbbbbbbbo...","..obbbbbbbbbo...","...ooobbbooo....","......r..r......",".....rr.rr......"]},
  shroom:{name:'菇菇',kind:'香菇',intro:'我是菇菇，慢慢長、穩穩記。',map:{b:'w',w:'x',r:'r',u:'s'},eyes:[[9,10]],top:1,cx:8,rows:[
    "................","......oooo......","....oorrrroo....","...orrwwrrrro...","..orrrwwrrrwwo..",".orrrrrrrrrwwro.",".orrwwrrrrrrrro.","orrrwwrrrrrrrrro",".ouuuuuuuuuuuuo.","....obbbbbbo....","....obbbbbbo....","....obbbbbro....","....obbbbbbo....","...obbbbbbbbo...","....oooooooo....","................"]},
  ghost:{name:'飄飄',kind:'小幽靈',intro:'我是飄飄，專門把快消失的記憶找回來～',map:{b:'x',h:'x',r:'r'},eyes:[[10,5]],top:1,cx:8,alpha:0.8,rows:[
    "................","......oooo......","....oobbbboo....","...obbbbbbbbo...","..obhbbbbbbbbo..","..obbbbbbbbbbo..",".obbbbbbbbbbbbo.",".obbbbbbbbbrbbo.",".obbbbbbbbbbbbo.",".obbbbbbbbbbbbo.","..obbbbbbbbbbbo.","..obbbbbbbbbbo..","...obbbbbbbbo...","..obbbbbbbbo....",".obbboobbbo.....",".ooo..ooo......."]}
};
/* Evolution: the stage index comes from the account level (so it is shared by every pet and never resets),
   but each pet has its own line of forms, and some forms branch by a per-account hash (v = 0..2). */
const STAGE_LV=[1,3,5,7,9];            // level needed for each form
const STAGE_M=[0,0.05,0.15,0.3,0.5];    // …and share of all cards mastered (card mastery ≥ 70%)
const STAGE_LV_OLD=[1,2,4,6,8];
let MFCACHE={k:'',v:0};
function masteredFrac(){ const k=S.xp+'|'+Math.floor(now()/20000); if(MFCACHE.k===k) return MFCACHE.v;
  let m=0; for(const c of CLIST) if(c.q.length&&cardMastery(c)>=0.7) m++; const v=CLIST.length?m/CLIST.length:0; MFCACHE={k,v}; return v; }
function lvFromXp(x){ let i=0; while(i+1<LEVELS.length&&x>=LEVELS[i+1][0]) i++; return i+1; }
function stageRaw(){ let L=1; try{ if(PROF.cur) L=lvl().i; }catch(e){} let mf=0; try{ mf=masteredFrac(); }catch(e){}
  let st=0; for(let i=0;i<STAGE_LV.length;i++) if(L>=STAGE_LV[i]&&mf>=STAGE_M[i]) st=i; return st; }
function stageNeed(st){ const n=st+1; if(n>=STAGE_LV.length) return null; return {lv:STAGE_LV[n],m:STAGE_M[n]}; }
const EVO={
  crab:{names:['幼年期','插旗殼','彩繪殼','珊瑚殼','城堡殼'],f:(s,v)=>{ const c=['r','g','s'][v], flag=[[11,-2,'s',1,3],[12,-2,'r',2,1],[12,-1,'r']];
    if(s===1) return {px:flag};
    if(s===2) return {map:{g:c},px:[[7,6,'w'],[11,3,'w'],[12,7,'w'],[8,7,'x'],...flag]};
    if(s===3) return {map:{g:c},px:[[7,-1,'r',1,2],[6,-2,'r'],[8,-2,'r'],[11,-1,'r',1,2],[10,-2,'r'],[12,-3,'r',1,2],[14,2,'r',1,2],[15,1,'r'],[13,10,'o',3,1],[13,11,'r',3,1],[16,11,'o',1,3],[7,6,'w'],[12,7,'w']]};
    if(s===4) return {px:[[7,-3,'s',7,4],[7,-4,'s'],[9,-4,'s'],[11,-4,'s'],[13,-4,'s'],[8,-2,'o'],[12,-2,'o'],[10,-1,'o',1,2],[10,-7,'w',1,3],[11,-7,'r',2,1],[3,-2,'y',1,1,'tw'],[16,-1,'w',1,1,'tw'],[5,2,'w',1,1,'tw'],[13,10,'o',3,1],[13,11,'r',3,1],[16,11,'o',1,3]]};
    return {}; }},
  slime:{names:['幼年期','冒新芽','開花了','雙子史萊姆','星雲史萊姆'],f:(s,v)=>{ const B=['g','s','y'][v], sprout=[[6,1,'g',1,2],[4,0,'g',2,1],[7,0,'g',2,1]], flower=[[6,1,'g',1,2],[5,-1,'r'],[7,-1,'r'],[6,-2,'r'],[6,0,'r'],[6,-1,'y']];
    if(s===1) return {px:sprout};
    if(s===2) return {map:{b:B},px:flower};
    if(s===3) return {map:{b:B},px:[...flower,[-2,11,'o'],[-3,12,'o'],[-2,12,B],[-1,12,'o'],[-4,13,'o'],[-3,13,B,2,1],[-1,13,'o'],[0,13,'o'],[-3,14,'o',3,1]]};
    if(s===4) return {map:{b:'d',h:'w'},px:[[4,9,'w',1,1,'tw'],[8,8,'y',1,1,'tw'],[12,12,'w',1,1,'tw'],[6,12,'y',1,1,'tw'],[3,1,'y',6,1],[2,2,'y'],[9,2,'y'],[-1,6,'y',1,1,'tw'],[17,8,'w',1,1,'tw'],[15,2,'y',1,1,'tw']]};
    return {}; }},
  husky:{names:['幼年期','紅領巾','雪橇犬','極光隊長','冰原狼王'],f:(s,v)=>{ const B=['d','s','d'][v], ban=[[7,8,'r',6,1],[9,9,'r',2,1]], gog=[[8,3,'o',7,1],[11,3,'y',2,1]];
    if(s===1) return {px:ban};
    if(s===2) return {map:{b:B},px:[...ban,...gog]};
    if(s===3) return {map:{b:B},px:[...ban,...gog,[4,8,'r',3,1],[3,9,'r',2,1],[2,-3,'g',5,1,'tw'],[6,-4,'g',6,1],[11,-3,'g',5,1,'tw'],[7,-2,'y',4,1,'tw']]};
    if(s===4) return {map:{b:'s'},px:[[9,0,'y',5,1],[9,-1,'y'],[11,-1,'y'],[13,-1,'y'],[11,-2,'r'],[0,9,'r',2,5],[7,8,'y',6,1],[1,-5,'y',3,1],[0,-4,'y',2,1],[0,-3,'y',2,1],[1,-2,'y',3,1],[-2,2,'w',1,1,'tw'],[6,-3,'w',1,1,'tw'],[16,-1,'w',1,1,'tw']]};
    return {}; }},
  chick:{names:['幼年期','蛋殼帽','小翅膀','大公雞','鳳凰'],f:(s,v)=>{
    if(s===1) return {px:[[5,1,'w',6,1],[5,0,'w'],[7,0,'w'],[9,0,'w']]};
    if(s===2) return {px:[[7,1,'r',2,1],[8,0,'r'],[0,7,'y',2,1],[-1,6,'y',2,1],[-2,5,'w',2,1]]};
    if(s===3) return {map:{b:['y','w','y'][v]},px:[[6,1,'r',4,1],[6,0,'r'],[8,0,'r',2,1],[8,-1,'r'],[13,7,'r',1,2],[-1,6,'y',1,4],[-2,5,'r',1,3],[0,5,'w']]};
    if(s===4) return {map:{b:'r',h:'y'},px:[[8,1,'y'],[8,0,'y'],[7,-1,'y'],[9,-1,'y'],[8,-2,'r',1,1,'tw'],[-1,6,'y',2,1],[-2,5,'y',2,1],[-3,4,'r',2,1],[15,4,'y',2,1],[16,3,'y',2,1],[17,2,'r',2,1],[0,12,'y',2,1],[-2,13,'r',2,1],[3,-1,'y',1,1,'tw'],[13,-2,'r',1,1,'tw'],[17,9,'y',1,1,'tw']]};
    return {}; }},
  shroom:{names:['幼年期','帶小菇','變色菇','夜光菇','菇菇森林'],f:(s,v)=>{ const baby=(x,c)=>[[x+1,11,c,3,1],[x,12,c,5,1],[x,13,'o',5,1],[x+2,14,'w',1,1],[x+1,12,'w']];
    if(s===1) return {px:baby(13,'r')};
    if(s===2) return {map:{r:['y','g','s'][v]},px:[[7,5,'w',2,1],...baby(13,['y','g','s'][v])]};
    if(s===3) return {map:{r:'g'},px:[...baby(13,'y'),[-1,2,'y',1,1,'tw'],[17,4,'y',1,1,'tw'],[2,-1,'w',1,1,'tw'],[13,-1,'y',1,1,'tw'],[8,-2,'w',1,1,'tw'],[7,5,'y',2,1]]};
    if(s===4){ const C=['r','d','y'][v]; return {map:{r:C},px:[[5,-1,'o',6,1],[4,0,'o'],[11,0,'o'],[5,0,C,6,1],[7,0,'w',2,1],[8,-4,'y'],[7,-3,'y',3,1],[8,-2,'y'],...baby(13,'g'),...baby(-2,'y'),[-2,3,'w',1,1,'tw'],[17,2,'w',1,1,'tw']]}; }
    return {}; }},
  ghost:{names:['幼年期','小燭火','巫師帽','提燈巫師','幽靈王'],f:(s,v)=>{ const H=['d','r','g'][v], hat=c=>[[3,1,c,10,1],[5,0,'y',6,1],[6,-1,c,4,1],[7,-2,c,3,1],[8,-3,c,2,1],[9,-4,c]];
    if(s===1) return {px:[[16,9,'w',1,3],[16,8,'y',1,1,'tw'],[16,7,'r',1,1,'tw']]};
    if(s===2) return {px:hat('d')};
    if(s===3) return {px:[...hat(H),[17,7,'o',1,2],[16,9,'y',3,3],[16,10,'o'],[18,10,'o'],[17,12,'y',1,1,'tw']]};
    if(s===4) return {map:{b:'x'},px:[...hat('d'),[10,-5,'y',1,1,'tw'],[0,8,'r',2,3],[14,8,'r',2,3],[-2,5,'y',1,9],[-3,4,'y',3,1],[-2,3,'r'],[17,3,'w',1,1,'tw'],[16,13,'w',1,1,'tw'],[-4,12,'w',1,1,'tw']]};
    return {}; }}
};
function petStage(){ if(typeof S==='undefined'||!S) return 0; const r=stageRaw(), k=(S.evo&&S.evo.s)||0; if(r>k){ S.evo={s:r,t:now()}; } return Math.max(r,k); }
const curPet=()=>{ let id=S&&S.set&&S.set.pet; if(id==='cat') id='husky'; return PETS[id]?id:'crab'; };
function petVar(id){ const k=(PROF.cur||'x')+':'+id; let h=7; for(let i=0;i<k.length;i++) h=(h*31+k.charCodeAt(i))>>>0; return h%3; }
function mascot(mood='idle',size=64,pid,stO){
  const id=pid||curPet(), P=PETS[id]||PETS.crab, st=(stO!=null?stO:petStage()), E=EVO[id].f(st,petVar(id)), map=Object.assign({},P.map,E.map||{}); let out='';
  const px=(x,y,c,w=1,h=1,cls='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="p${c}${cls?' '+cls:''}"/>`;
  const R=P.rows, at=(x,y)=>(y<0||y>15||x<0||x>15)?'.':R[y][x], solid=c=>c!=='.'&&c!=='o', ink=c=>PAL[map[c]||'w'];
  for(let y=0;y<16;y++){ let x=0; while(x<16){ const ch=R[y][x]; if(ch==='.'){ x++; continue; }
      if(ch==='o'){ // selective outline: the outline takes a deep tone of the body it wraps
        let nb=''; for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]]){ const c=at(x+dx,y+dy); if(solid(c)){ nb=c; break; } }
        out+= nb? px(x,y,ink(nb))+px(x,y,'o',1,1,'olo') : px(x,y,PAL.o); x++; continue; }
      let w=1; while(x+w<16&&R[y][x+w]===ch) w++; out+=px(x,y,ink(ch),w); x+=w; } }
  if(P.alpha) out=`<g opacity="${P.alpha}">${out}</g>`;
  let eyes='';
  for(const [ex,ey] of P.eyes){ eyes+= (mood==='happy'||mood==='great')?px(ex,ey,PAL.o)+px(ex-1,ey+1,PAL.o)+px(ex+1,ey+1,PAL.o) : mood==='sleep'?px(ex-0.5,ey+1,PAL.o,2,1) : mood==='tired'?px(ex-0.5,ey+0.5,PAL.o,2,1)+px(ex,ey+1,PAL.o) : mood==='sick'?px(ex-1,ey,PAL.o)+px(ex,ey+1,PAL.o)+px(ex+1,ey,PAL.o) : px(ex,ey,PAL.o,1,2); }
  const acc=(E.px||[]).map(a=>px(a[0],a[1],PAL[a[2]],a[3]||1,a[4]||1,a[5]||'')).join('');
  const fx = mood==='tired'?px(15,-2,PAL.s)+px(15,-1,PAL.s,1,1)+px(14,-1,PAL.s) : mood==='sick'?px(15,-3,PAL.s)+px(15,-2,PAL.s)+px(14,-2,PAL.s)+px(-1,0,PAL.s)+px(-1,1,PAL.s)+px(13,-6,PAL.w,3,1)+px(14,-7,PAL.w,1,3) : mood==='great'?px(15,-5,PAL.y,1,1,'tw')+px(-2,-2,PAL.y,1,1,'tw')+px(16,1,PAL.y,1,1,'tw') : mood==='care'?px(14,-5,PAL.r)+px(16,-5,PAL.r)+px(14,-4,PAL.r,3,1)+px(15,-3,PAL.r) : mood==='sleep'?px(14,-5,PAL.w,2,1)+px(15,-4,PAL.w)+px(14,-3,PAL.w,2,1) : '';
  const sc=[0.78,0.86,0.93,1,1][st];
  return `<svg class="pet${(mood==='happy'||mood==='great')?' hop':''}${mood==='sick'?' sick':''}${mood==='tired'?' tired':''}" viewBox="-4 -8 24 24" shape-rendering="crispEdges" style="width:${size}px;height:${size}px" role="img" aria-label="${P.name}"><g transform="translate(8 15) scale(${sc}) translate(-8 -15)"><g class="body">${out}<g class="${mood==='idle'||mood==='care'?'blink':''}">${eyes}</g>${acc}${fx}</g></g></svg>`;
}
function say(mood,html,size=72,tap){ const P=PETS[curPet()]; return `<div class="say"><button class="stage" data-act="go" data-v="pets" aria-label="夥伴${P.name}，點一下換夥伴">${mascot(mood,size)}</button><div class="bubble${tap?' tap'+(HOMETIP.anim?' fresh':''):''}"${tap?` data-act="saynext" role="button" tabindex="0" aria-label="${P.name}說的話，點一下換一句 SA 小知識"`:''}><span class="who">${P.name}</span>${html}</div></div>`; }
