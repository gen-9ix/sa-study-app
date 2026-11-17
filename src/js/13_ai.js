/* ═════════════════════ 5. AI TUTOR (sample capability) ═════════════════════ */
const AI={fn:null,ready:false};
async function initAI(){ try{ if(!window.claude||!window.claude.use) return; const s=await window.claude.use('sample'); if(s){ AI.fn=s; AI.ready=true; if(!BUSY()) render(); } }catch(e){} }
const aiOn=()=>AI.ready&&S.set.ai;
function cardText(c){ return `【${c.t}】（章節：${c.ch.t}）\n比喻：${c.a||''}\n重點：\n- ${c.b.join('\n- ')}${c.x?'\n範例：\n'+c.x.join('\n'):''}${c.m?'\n口訣：'+c.m:''}`; }
const AI_SYS='你是一位溫暖、幽默的「計算機系統管理（System Administration）」家教，學生是陽明交大資工系大學生，正在準備期末筆試（閉書、簡答題為主），目標滿分。請用繁體中文（台灣用語），專有名詞保留英文。不要使用 ▽ 或 ∀ 嘴巴的顏文字；若用顏文字最多一個，例如 (・ω・)。';
async function aiStream(prompt,onText,signal){
  if(!AI.fn) throw {code:'not_granted'};
  const r=await AI.fn([{role:'user',content:AI_SYS+'\n\n'+prompt}],{onText:({text})=>onText&&onText(text),signal,cache:false});
  return r.text;
}
async function aiJSON(prompt){
  if(!AI.fn) throw {code:'not_granted'};
  const full=AI_SYS+'\n\n'+prompt;
  if(typeof AI.fn.json==='function'){ return await AI.fn.json([{role:'user',content:full}],{cache:false}); }
  const r=await AI.fn([{role:'user',content:full}],{cache:false});
  const m=r.text.match(/\{[\s\S]*\}/); return JSON.parse(m?m[0]:r.text);
}
function aiErrMsg(e){ if(e&&e.code==='rate_limited') return 'Claude 有點忙，等一下再試。'; if(e&&e.code==='not_granted') return '這個檢視沒有開放 AI 家教，可以改用參考答案自評。'; return 'AI 暫時無法回應，可以改用參考答案自評。'; }

