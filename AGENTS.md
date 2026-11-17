# SA 碎片學習：維護規則（給之後接手的任何模型或人）

NYCU 計算機系統管理期末筆試的複習 app。單一 HTML，無框架、無相依套件。
兩個發佈版本由同一份原始碼產生：GitHub Pages（PWA，repo 根目錄的 `index.html`）與 Claude artifact（`dist/index.html`）。

## 0. 五條不能破的規則

1. **不要讀也不要改 `index.html`、`dist/index.html`**。它們是產物（各約 1 MB）。只改 `src/` 和 `content/`，再跑 build。
2. **學習進度綁在 id 上**。卡片 id（如 `net.arp`）與題目 id（`<卡片 id>.<卡內第幾題，從 0 起>`）永遠不能變：
   不改卡片 id、不刪題、不在卡片中間插題、不調換題目順序。只能在卡片**最後**加題、在檔案加新卡、加新章。
   題目文字、選項、解析可以改。`tools/check.mjs` 會用 `content/ids.lock` 擋下違規。
3. **不改 UI 與操作體驗**，除非使用者明確要求。視覺變更先給樣張，得到同意才整合。
4. **不加相依套件、不加建置工具、不拆成多檔載入**。離線可用、單檔是需求。
5. 每次交付前跑 `sh tools/test.sh`，全部 PASS 才發佈（第 6 節）。

## 1. 檔案地圖（改什麼就只開那個檔）

| 路徑 | 內容 | 何時動它 |
|---|---|---|
| `content/NN_*.txt` | 全部教材與題目（DSL，第 3 節） | 新增或修正內容。**九成的更新只碰這裡** |
| `content/order.txt` | 章節檔出現順序 | 新增章節檔時加一行 |
| `content/ids.lock` | 已發佈的題目 id 與題型 | 不手改；加完內容跑 `node tools/check.mjs --lock` |
| `src/shell.html` | `<head>`、字型、`#app`、`#layer`、組裝標記 | 幾乎不動 |
| `src/css/*.css` | 樣式，依檔名排序串接 | 見下 |
| `src/js/*.js` | 程式，依檔名排序串接成**同一個 `<script>`** | 見下 |
| `src/standalone/` | PWA 靜態檔、`firebase.json`（公開金鑰，可進 repo）、`firestore.rules` | 幾乎不動 |
| `build/build.py` | 組裝腳本 | 幾乎不動 |
| `tools/check.mjs` `tools/test.sh` `test/*.mjs` | 檢查與瀏覽器回歸測試 | 加功能時補測試 |

`src/js` 模組與各自擁有的全域（**只有擁有者可以寫入這些全域的內部欄位**，其他檔案呼叫它的函式）：

| 檔案 | 職責 | 擁有的全域 / 對外函式 |
|---|---|---|
| `00_version` | 內容版本與更新說明 | `CONTENT_VERSION` `CHANGELOG` |
| `01_content` | DSL 解析器、內容索引 | `parseDSL` `CH` `CHMAP` `CARD` `CLIST` `Q` `QLIST`（唯讀） |
| `02_state` | 進度狀態、localStorage、多帳號、合併 | `S` `PROF` `fresh` `normState` `mergeState` `save` `lsRead/lsWrite/lsDel` `peekProfile` |
| `03_sync` | 雲端同步（Claude db 或 Firestore REST） | `SYNC` `FBS` `initSync` `flush` `syncSetCode` `syncClearCode` `syncDropProfile` `mergeProfileInto` |
| `04_srs` | 遺忘曲線排程、熟練度、連續天數、出題挑選 | `grade` `retr` `dueList` `nextNewQs` `pace` `cardMastery` `streak` |
| `05_helpers` | `$` `esc` `md` `toast` `icon` `cmdMatch` `fillMatch` | 純工具，不讀寫 `S` |
| `06_pets` `09_petmood` | 夥伴像素圖、進化、狀態、台詞 | `PETS` `mascot` `say` `petStage` `petCond` |
| `07_hometip` | 首頁對話框小知識 | `HOMETIP` `nextTip` |
| `08_audio` | 音效、背景音樂、魔王音樂（WebAudio 合成） | `SFX` `BGM` `BM` `sfx` `sfxMark` `sfxSilence` `musicSync` |
| `10_boss` `11_expedition` `12_room` | 魔王戰、遠征、房間 | `BOSSES` `ROOM_ITEMS`（鍵是章節 id） |
| `13_ai` `27_ai_sheets` | Claude 版的 AI 家教 | `AI` `aiOn` |
| `14_router` | 畫面切換 | `VIEW` `STACK` `RUN` `go` `back` `home` `render` `VIEWS` `AFTER` |
| `20_`–`26_` | 各畫面：首頁、帳號與設定、地圖、圖解、卡片、練習引擎、其他模式 | 往 `VIEWS.x` 註冊 |
| `23_diagrams` | 卡片圖解（鍵是卡片 id） | `DG` `DIAGRAMS` |
| `30_actions` | 所有按鈕行為與事件委派 | `ACT` |
| `99_boot` | 啟動 | — |

## 2. 寫法規則（降低耦合）

- **單一全域作用域**。所有 js 串成一個 script，沒有 import。檔名數字決定順序：頂層 `const` 只能用到**前面檔案**已宣告的東西；函式內部可以呼叫任何檔案的函式。
- **資料流單向**：按鈕 `data-act="x"` → `ACT.x(dataset)` → 改 `S` → `save()` → `render()`。畫面是 `VIEWS.name = () => HTML 字串`，只讀狀態、不改狀態。需要綁 DOM 事件時用 `AFTER.name`。
- **不寫 inline 事件處理器、不在各處 `addEventListener`**。互動一律 `data-act`。
- **邊界**：
  - `localStorage` 只在 `02_state`（`lsRead/lsWrite/lsDel`）。
  - `window.claude`、`SYNC.*`、`FBS.*` 的寫入只在 `03_sync`；`AI.*` 只在 `13_ai`。
  - `SFX/BGM/BM` 的欄位只在 `08_audio`；其他地方呼叫 `sfx('名稱')`。
  - 兩個版本的差異只用 `window.SA_STANDALONE` 判斷，不要再開第二種旗標。
- **改 `S` 之後一定 `save()`**；改 `S.set` 要同時 `S.set.t=now()`（合併時用時間戳決定哪邊新）。
- **新增狀態欄位要改三處**（都在 `02_state`）：`fresh()` 給預設值、`mergeState()` 寫合併規則、舊資料相容（`normState`）。漏掉 `mergeState` 會讓跨裝置同步把該欄位洗掉。欄位名保持簡短（存檔大小有上限）。
- **所有使用者輸入與內容文字進 HTML 前過 `esc()` 或 `md()`**。
- **CSS** 只用 `00_tokens.css` 的變數（`--space-*` `--text-*` `--color-*`），不寫死色碼與 px 間距。版面調整放 `90_responsive.css`。風格：深色、圓角、柔和，不要刺眼或尖銳的介面。
- **程式裡引用內容 id 的地方只有三張表**：`DIAGRAMS`（卡片 id）、`BOSSES`、`ROOM_ITEMS`（章節 id）。不要在其他程式碼寫死卡片或章節 id。
- 一個功能一個檔。新檔取兩位數前綴插進合適位置；單檔超過約 25 KB 就拆。
- 文案用繁體中文；顏文字只用 `(・ω・)` `(・_・)` 這類簡單款，少量。

## 3. 內容 DSL

```
@CH id | 章節名 | icon | 來源          一個檔可有多個 @CH
@CARD net.arp | 卡片標題
A> 比喻（一行）          B> 重點（可多行）      M> 口訣      X> 程式碼行（可多行）
?mc 題目                 選擇：第一個選項寫 "+ 正解"，其後 "- 錯誤選項" 至少兩個（顯示時會洗牌）
?tf 題目                 是非：=T 或 =F
?cmd 題目  /  ?fill 題目  打指令 / 填空："= 答案"，可多行列出等價寫法
?ord 題目                排序："> 項目"，依正確順序列
?mt 題目                 配對："> 左 :: 右"
?sa 題目                 簡答："R> 參考答案"（可多行）、"P> 給分點"（可多行）
題目下可加：QX> 題目附的程式碼   H> 提示   E> 解析   S> 出處（寫了代表真實考古題）
```

出題品質要求：每題有 `E>`；選擇題的錯誤選項要和正解差不多長、看起來合理（check 會列出正解明顯最長的題目）；`?cmd` 盡量列出所有等價寫法。內容檔不可出現 `</script` 或 `<!--`。

## 4. 常見任務的最短路徑

**加新簡報 / 作業的內容**
1. 在對應的 `content/NN_*.txt` 末尾加 `@CARD`（或在既有卡片末尾加題）。新章節：新檔 + `content/order.txt` 加一行 + `10_boss.js` 的 `BOSSES` 加一筆（否則用預設魔王）。
2. `00_version.js`：`CONTENT_VERSION` 加 1，`CHANGELOG` 加一筆（app 會顯示更新通知）。
3. `node tools/check.mjs -v` → 無 ERROR 後 `node tools/check.mjs --lock`。
4. 第 6 節發佈。

**改既有題目**：直接改文字、選項、解析。不要刪題；真的要廢一題，就把它改寫成同題型的另一題。

**加圖解**：`23_diagrams.js` 的 `DIAGRAMS['卡片 id'] = () => [高度, SVG 內容, 替代文字]`，用 `DG` 的小工具畫，寬度固定 320。

**加畫面**：新檔 `src/js/2x_view_name.js` 寫 `VIEWS.name=()=>…`；入口按鈕 `data-act="go" data-v="name"`；需要的行為加進 `ACT`。

**加設定**：`fresh().set` 加預設值 → 設定畫面（`21_view_account.js`）加開關 → `ACT` 加 toggle（記得 `S.set.t=now(); save(); render();`）。

**加題型**：`01_content.js`（解析）→ `25_run.js` 的 `questionHTML` 與作答判定 → `05_helpers.js` 的 `KIND`/`KIND_IC` → `tools/check.mjs` 加驗證 → 本檔第 3 節。

## 5. 省 token 的工作方式

- 先 `grep -n "關鍵字" src/js/*.js`，再只讀命中的那幾行（`sed -n 'A,Bp'`）。多數行很長，讀取時截寬（`cut -c1-200`）。
- 內容分析用 `node tools/check.mjs --json /tmp/all.json`，不要自己寫解析器。
- 批次改內容用腳本對 `content/*.txt` 做字串取代，不要整檔重寫。
- 不要建立備份副本（`template.v12.html` 之類）；歷史用 git。
- 不要把截圖、樣張、一次性腳本放進 repo；放 `/tmp`。

## 6. 建置、測試、發佈

```
python3 build/build.py          # 產生 ./index.html（Pages）與 dist/index.html（artifact）
node tools/check.mjs -v         # 內容與 id 檢查
sh tools/test.sh                # build + check + 全部瀏覽器測試；sh tools/test.sh v5 star 只跑指定的
```

測試需要 node、playwright、Chrome；路徑不同時設 `PW=…/playwright/index.mjs CHROME=…`。
`fuzz` 會印出 `reteach … NOT SUBMITTED`，那是測試腳本不會填筆記欄，不算失敗；以最後的 PASS/FAIL 為準。

發佈兩處，內容要一致：
1. **GitHub Pages**：commit（含重建後的 `index.html`）並 push 到 `main`，網址 https://gen-9ix.github.io/sa-study-app/ 。
2. **Claude artifact**：把 `dist/index.html` 發佈到既有 artifact（標題「SA 碎片學習」），更新同一個、不要另開新的。

改了 `src/standalone/sw.js` 的快取清單時，把裡面的 `CACHE` 名稱加一號。

## 7. 資料位置（除錯用）

- 本機：`localStorage['sa-profiles']`（帳號清單）、`sa-study-v1` / `sa-study-v1:<pid>`（各帳號進度）、`sa-sync`（Pages 版同步碼）。
- 雲端：`data/users/<uid>/meta` 與 `…/progress` 或 `…/p_<pid>`。Claude 版走 artifact db；Pages 版走 Firestore REST（`sync/<同步碼>/d/<名稱>`，規則在 `src/standalone/firestore.rules`）。
- 兩端合併一律經 `mergeState`（逐項取較新者，數值取最大），所以任何寫入都不會讓進度倒退。
