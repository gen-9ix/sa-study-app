/* ═════════════════════ 1. CONTENT PARSER ═════════════════════
  DSL:  @CH id | title | icon | source       @CARD id | title
        A> analogy  B> bullet  M> mnemonic  X> code line
        ?mc|tf|cmd|fill|ord|mt|sa question     QX> code  S> source  H> hint  E> explanation
        mc: "+ correct" / "- wrong"   tf: =T / =F   cmd/fill: "= answer"
        ord: "> item" (correct order)  mt: "> left :: right"   sa: R> reference line, P> scoring point
*/
function parseDSL(text){
  const chs=[]; let ch=null, card=null, q=null;
  const closeQ=()=>{ if(q&&card){ card.q.push(q); } q=null; };
  for(const raw of text.split('\n')){
    const line=raw.replace(/\r$/,''); const s=line.trim(); if(!s) continue;
    if(s.startsWith('@CH ')){ closeQ(); const p=s.slice(4).split('|').map(x=>x.trim()); ch={id:p[0],t:p[1],icon:p[2]||'📘',src:p[3]||'',cards:[]}; chs.push(ch); card=null; continue; }
    if(s.startsWith('@CARD ')){ closeQ(); const i=s.indexOf('|'); card={id:s.slice(6,i).trim(),t:s.slice(i+1).trim(),b:[],q:[]}; if(ch) ch.cards.push(card); continue; }
    const m=s.match(/^\?(mc|tf|cmd|fill|ord|mt|sa)\s+(.*)$/);
    if(m){ closeQ(); q={k:m[1],q:m[2]}; continue; }
    if(!card) continue;
    if(s.startsWith('QX>')){ if(!q) continue; let t=line.slice(line.indexOf('QX>')+3); if(t[0]===' ') t=t.slice(1); (q.x||(q.x=[])).push(t); continue; }
    if(s.startsWith('X>')){ let t=line.slice(line.indexOf('X>')+2); if(t[0]===' ') t=t.slice(1); (card.x||(card.x=[])).push(t); continue; }
    const tag=s.slice(0,2), rest=s.slice(2).trim();
    if(!q){ if(tag==='A>') card.a=rest; else if(tag==='B>') card.b.push(rest); else if(tag==='M>') card.m=rest; continue; }
    const k=q.k;
    if(tag==='E>') q.e=rest;
    else if(tag==='H>') q.h=rest;
    else if(tag==='S>') q.src=rest;
    else if(tag==='R>') q.a=(q.a?q.a+'\n':'')+rest;
    else if(tag==='P>') (q.p||(q.p=[])).push(rest);
    else if(k==='mc'&&s.startsWith('+ ')){ (q.o||(q.o=[])).push(s.slice(2).trim()); q.a=q.o.length-1; }
    else if(k==='mc'&&s.startsWith('- ')){ (q.o||(q.o=[])).push(s.slice(2).trim()); }
    else if(k==='tf'&&(s==='=T'||s==='=F')) q.a=(s==='=T');
    else if((k==='cmd'||k==='fill')&&s.startsWith('= ')) (q.a||(q.a=[])).push(s.slice(2).trim());
    else if(k==='ord'&&s.startsWith('> ')) (q.o||(q.o=[])).push(s.slice(2).trim());
    else if(k==='mt'&&s.startsWith('> ')){ const t=s.slice(2); const i=t.indexOf('::'); (q.o||(q.o=[])).push([t.slice(0,i).trim(),t.slice(i+2).trim()]); }
  }
  closeQ();
  return chs;
}

const CH=[], CARD={}, Q={}, QLIST=[], CLIST=[];
for(const el of document.querySelectorAll('script.sa-src')){
  for(const ch of parseDSL(el.textContent)){
    ch.idx=CH.length; CH.push(ch);
    for(const c of ch.cards){
      c.ch=ch; CARD[c.id]=c; CLIST.push(c);
      c.q.forEach((q,i)=>{ q.id=c.id+'.'+i; q.card=c; Q[q.id]=q; QLIST.push(q); });
    }
  }
}
const CHMAP=Object.fromEntries(CH.map(c=>[c.id,c]));

