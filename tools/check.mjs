#!/usr/bin/env node
// Content + wiring check. Uses the app's own parser (src/js/01_content.js), so there is one grammar.
//   node tools/check.mjs              verify (exit 1 on any ERROR)
//   node tools/check.mjs --lock       after ADDING cards/questions: record the new ids in content/ids.lock
//   node tools/check.mjs --json F     dump parsed content to F (for analysis scripts)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const stems = rd('content/order.txt').split(/\s+/).filter(Boolean);
const document = { querySelectorAll: () => stems.map(s => ({ textContent: rd(`content/${s}.txt`) })) };
const { CH, CARD, QLIST } = new Function('document', rd('src/js/01_content.js') + '\nreturn {CH,CARD,QLIST};')(document);
const err = [], warn = [], E = m => err.push(m), W = m => warn.push(m);

// 1. every file on disk is listed, ids unique, every question answerable
for (const f of fs.readdirSync(path.join(ROOT, 'content'))) if (/\.txt$/.test(f) && f !== 'order.txt' && !stems.includes(f.slice(0, -4))) E(`content/${f} is not in content/order.txt`);
const seen = new Set();
for (const ch of CH) { if (seen.has('ch:' + ch.id)) E('duplicate chapter ' + ch.id); seen.add('ch:' + ch.id);
  for (const c of ch.cards) { if (seen.has(c.id)) E('duplicate card ' + c.id); seen.add(c.id);
    if (!c.b.length && !c.a) W(`${c.id}: card has no A>/B> text`); } }
let longest = 0, mc = 0;
for (const q of QLIST) { const o = q.o || [];
  if (q.k === 'mc') { mc++; if (o.length < 3) E(`${q.id}: mc needs "+ " and at least two "- "`); if (q.a !== 0) E(`${q.id}: mc must list the "+ " option first, exactly once`);
    if (new Set(o).size < o.length) E(`${q.id}: duplicate option`);
    const L = o.map(x => x.length), m = Math.max(...L); if (L[0] === m && L.filter(x => x === m).length === 1) { longest++; if (m - L.slice(1).sort((a, b) => b - a)[0] >= 4) W(`${q.id}: correct option is longest by 4+ chars`); } }
  else if (q.k === 'tf') { if (typeof q.a !== 'boolean') E(`${q.id}: tf needs =T or =F`); }
  else if (q.k === 'cmd' || q.k === 'fill') { if (!Array.isArray(q.a) || !q.a.length) E(`${q.id}: needs at least one "= answer"`); }
  else if (q.k === 'ord' || q.k === 'mt') { if (o.length < 2) E(`${q.id}: needs at least two "> " lines`); }
  else if (q.k === 'sa') { if (!q.a) E(`${q.id}: sa needs R> reference`); if (!q.p) W(`${q.id}: sa has no P> scoring points`); }
  if (!q.e && q.k !== 'sa') W(`${q.id}: no E> explanation`); }

// 2. progress safety: ids recorded in ids.lock must still exist with the same question kind
const lockPath = path.join(ROOT, 'content/ids.lock');
const now = Object.fromEntries(QLIST.map(q => [q.id, q.k]));
const lock = fs.existsSync(lockPath) ? Object.fromEntries(fs.readFileSync(lockPath, 'utf8').split('\n').filter(Boolean).map(l => l.split(' '))) : {};
for (const [id, k] of Object.entries(lock)) { if (!(id in now)) E(`${id}: locked id is gone (card renamed, or a question deleted/reordered) -> user progress would be lost`);
  else if (now[id] !== k) E(`${id}: kind changed ${k} -> ${now[id]} (questions were reordered or inserted mid-card; only append)`); }
const added = Object.keys(now).filter(id => !(id in lock));
if (process.argv.includes('--lock')) { if (!err.length) { fs.writeFileSync(lockPath, Object.entries(now).map(([i, k]) => i + ' ' + k).join('\n') + '\n'); console.log(`ids.lock: ${added.length} new ids recorded`); } }
else if (added.length) W(`${added.length} new question ids not in ids.lock yet (run --lock once the content is final)`);

// 3. code tables keyed by content ids must point at real ids
const keys = (file, re) => [...rd(file).matchAll(re)].map(m => m[1]);
for (const k of keys('src/js/23_diagrams.js', /^  '([a-z0-9_]+\.[a-z0-9_]+)':/gm)) if (!CARD[k]) E(`DIAGRAMS['${k}'] has no such card`);
const chIds = new Set(CH.map(c => c.id));
const bossSrc = rd('src/js/10_boss.js'); const bs = bossSrc.slice(bossSrc.indexOf('const BOSSES={'), bossSrc.indexOf('};', bossSrc.indexOf('const BOSSES={')));
const bossKeys = [...bs.matchAll(/^  ([a-z0-9_]+):\[/gm)].map(m => m[1]);
for (const k of bossKeys) if (!chIds.has(k)) E(`BOSSES.${k} has no such chapter`);
for (const c of chIds) if (!bossKeys.includes(c)) W(`chapter ${c} has no entry in BOSSES (falls back to the shell boss)`);
for (const k of keys('src/js/12_room.js', /\{id:'[a-z0-9_]+',ch:'([a-z0-9_]+)'/g)) if (!chIds.has(k)) E(`ROOM_ITEMS ch:'${k}' has no such chapter`);

const j = process.argv.indexOf('--json');
if (j > 0) fs.writeFileSync(process.argv[j + 1], JSON.stringify(CH.map(ch => ({ id: ch.id, t: ch.t, cards: ch.cards.map(c => ({ id: c.id, t: c.t, a: c.a, b: c.b, x: c.x, q: c.q.map(({ card, ...r }) => r) })) }))));
const V = process.argv.includes('-v');
if (V) warn.forEach(w => console.log('warn  ' + w)); err.forEach(e => console.log('ERROR ' + e));
console.log(`${CH.length} chapters, ${Object.keys(CARD).length} cards, ${QLIST.length} questions; mc correct-is-longest ${longest}/${mc} (${Math.round(longest / mc * 100)}%); ${err.length} errors, ${warn.length} warnings${V || !warn.length ? '' : ' (-v to list)'}`);
process.exit(err.length ? 1 : 0);
