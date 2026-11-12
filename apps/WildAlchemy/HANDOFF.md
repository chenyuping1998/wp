# Wild Alchemy — handoff

## 現況（2026-11-11）——從這裡接

**整款已換成 Wild Alchemy 自己的美術與音效；`upload/WildAlchemy` 已是新版（front v2 候選，見下方 21:00 補記）。** 平台仍是 math v1＋front v1。逐項交接（每位同事做了什麼、驗了什麼、沒驗什麼）在 `/Users/stone/stake-engine/docs/handoff/wild_alchemy.md`。

- 角色：見下方 21:00 補記（這一行以前寫的 rig 與 `BAR_SINK` 已過時）。
- 場景：`Background`／`SceneLife`＋`src/game/sceneLayout.json`（MG 實驗室、FG 塔頂，物件各自動）、`BoardFrame`（九宮格新框）、Logo、`TransitionAnimation`、`LoadingScreen`、`GameClock`（左上角時間改深褐字）。
- HUD／UI／大獎：`LadderHud`＋`src/game/hudLayout.ts`（階梯寬 150，`Cast.svelte` 讀 `LADDER_GAP + LADDER_W`）、`uiTheme.ts`／`palette.ts`、`Win`／`BigWinFx`、`assetsHud.ts`。
- 音效：`static/assets/audio/wild_alchemy/`（`design/generate_wild_alchemy_audio.py` 合成；**沒有人聽過**，試聽檔在 `new-games/wild-alchemy/audio-preview-20261110/`）。
- 繼承清單：開場卡、購買卡、規則、賠率表、favicon、舊元件與舊圖都清了；16 語補齊；光暈／星／金幣重做（`design/build_wild_alchemy_fx.py`）。原檔備份 `new-games/wild-alchemy/frontend-backup-20261111/`。
- 共用套件（只改 `wp-alchemy/packages`，主線沒動）：`components-ui-pixi/.../UiSprite.svelte` `tint ?? 0xffffff`（圓鈕轉完回亮）；`utils-xstate` 的 `createIntermediateMachineBet.ts`／`createPrimaryMachines.ts` 換成 wp-banandit 過審的版本（空白鍵連轉查餘額，自檢 [222]）。
- 商店圖：`upload/WildAlchemy/{thumbnail,cover}` 已換（`new-games/wild-alchemy/art/tools/build_store_art.py`）；平台上的要 Stone 在 Studio 手動換。
- 稽核：合規稽核報告在 docs/handoff；數學 `stakecli compliance` PASS（96.02／96.05／96.08）。**待決**：主遊戲中獎率 40%（每 2.47 手）對內部文件「3–8」那一條，等 Stone 決定。

### 2026-11-11 21:00 補記（取代清晨／中午那兩段）
- **角色**：`補畫單-1111`、`補畫單-1111b`（輸入圖先挖洞）都已收圖併入；圖層現在是老術士 split-12p、人造人 split-12r（`art/2026-11-10-characters/tools/split_cast.py`）。rig `535b11da…`／`7b8eebca…`，`design/build_game_cast.py` 已重包。原生大小、每 0.12 s 逐格的獨立驗收：老術士第七次、人造人第八次，「一定要修」都是 0 項。
- Stone 的決定：①–⑧「先接受」（表在角色資料夾 `拆層紀錄.md` 最後）；⑨（人造人遠側袍擺下緣）⑩（遠側腋下墨線）示意圖已送，**還沒回覆**。約二十個要放大 3 倍以上才看得出的小項留著（docs/handoff）。
- **版本一致**：來源圖層＝Spine images＝atlas＝app `static/assets/castSpine43/`＝`dist/wildalchemy-playtest`＝`upload/WildAlchemy`（md5 對過）。
- `design/ship.sh` 21:00 重跑：sanity all clean；preflight 0 FAIL／2 WARN；建置版用 `qa/built_play_cdp.mjs` 在 1440×900 與 390×844 各轉 6 局，0 錯。`upload/WildAlchemy` 是 front v2 候選。**沒有上傳、沒有發布；兩者都等 Stone 當下說好。**
- 角色位置：站在轉動鈕上緣之上（`CastAlchemy.svelte` `DIAL_RISE = 38`，腳下有接地影）；淡入淡出用 `AlphaFilter` 整張一起淡（分層各自淡會透出被蓋住的層）。動作組 `FLASK_CHEST` 26/14/−12（`~/tools/spine-generator-stand34/src/presets34.ts`，未 commit）。
- 都沒 commit（app 在 wp-alchemy 是 untracked）。

## 現況（2026-11-10 23:10）

**角色重做過一輪（split-8），已重建骨架並進遊戲（dev，未打包、未上傳）。** 平台仍是 math v1＋front v1。

- 起因：Stone 看預覽回報「腋下附近怪怪的」。原生解析度一看，近上臂舉起來整隻是壞的，人造人袍衩裡的腿也會撕開。改法與理由在 `new-games/wild-alchemy/art/2026-11-10-characters/拆層紀錄.md`「split-8」。
- 現在：MG 21 層＋2 個替換頭、FG 20 層＋2；沒有 `pauldron_r`。工具報告 MG「可以用」，FG「需要看一下」（脖子根／前腳踝的靜態警告＋肩軸刻意藏在胸裡）。`check_outline_ink` 兩隻 PASS；`check_layer_split` 兩隻 FAIL（重畫上臂所以和母圖不同、上臂排在軀幹後面——這兩項是故意的；其餘是補畫配對，清單在拆層紀錄）。
- 遊戲端沒有改程式，只重包 `static/assets/castSpine43/`（rig `882a9c8e…`／`703afc79…`）。`check:types` 0 錯。無頭重播看過：`qa/runs/cast1110b_base`（主遊戲轉換）、`cast1110b_fg`（免費遊戲）、`cast1110b_portrait`（直式，`replay_cdp.mjs --size 390x844` 是這次加的）。
- 還沒做：每個動作原生解析度逐格看完（看過的範圍寫在拆層紀錄）、補畫配對、第二三批美術接進遊戲。打包與上傳都還沒有。

## 現況（2026-11-10 18:40）

**兩隻角色已進遊戲（dev，未打包、未上傳）。** 平台上還是 11-10 早上的 math v1＋front v1（Hard Time 過渡圖）。

- 角色：`new-games/wild-alchemy/art/2026-11-10-characters/`（`拆層紀錄.md` 最後一節是現況）。MG 老術士 22 層／7 動作、FG 人造人 21 層／12 動作，stand34 長袍模板＋「托瓶」動作組（`~/tools/spine-generator-stand34`，`motion.set.json`）。重建：`tools/split_cast.py mg|fg` → 在 stand34 樹 `node bin/spine-motion.js character <cast>/layers -o <cast>/spine --name alchemist|homunculus` → 本 app `design/build_game_cast.py` → `static/assets/castSpine43/<who>/`。
- 遊戲端：`src/vendor/spine-core-4.3.13`（和 Static Shift 同一份）、`src/game/castSpine43.ts`、`src/game/castRig43.ts`、`src/components/CastAlchemy.svelte`（cue→clip、`cast_release` 事件淡出、`transBack` 淡入、站位不壓盤面與 FG 階梯）、`Cast.svelte` 主遊戲放老術士、免費遊戲換人造人。`check:types` 0 錯。舊的 `CastSpine.svelte`＋Hard Time rig 還在 repo，沒有被引用（FreeSpinIntro 還 import 著，沒用到）。
- 已看：無頭重播 `baseTransfer`（`qa/runs/cast1110_base_sheet.png`）、`bonus`（`qa/runs/cast1110_fg_sheet.png`）、直式一張。舉瓶→出手淡出→歸位、FG 換人都有演。
- **角色還沒過零缺陷門檻**（清單在 `拆層紀錄.md`「還沒過的」）：FG 袍片內緣細線／袍擺鋸齒／靴口毛刺／脖子根接縫，MG win_02 上臂下緣小突起，兩隻的補底配對（check_layer_split FAIL）。修完才能打包。
- 第二、三批美術已去背整理：`new-games/wild-alchemy/art/game-ready-1110/`（146 張、manifest、總表、a／b 建議；背景物件層沒有排位資料，要自己排）。**還沒接進遊戲**：背景（MG／FG＋物件層動態）、HUD（燒瓶／階梯）、盤框與大格框、UI、圖示、大獎、轉場、Logo、商店圖。
- 之後：修角色缺陷 → 接背景與 HUD（接完重看角色站位與大小）→ UI／大獎／轉場 → 符號得獎動作改成卡片用的 → 音效 → 自檢、preflight、打包。

## 現況（2026-11-09 收工時，用量到頂中斷）

規格：`new-games/wild-alchemy/SPEC.md` v0.2（血月伯爵抄錄全套；拿掉翻牌 BONUS；定案：名稱 Wild Alchemy、煉金術士之塔、base Hard Time、20,000×、購買 100×／250×、SUPER 從 ×2／9 局開始、L4 三連 0.1、不做 padding、背景拆件 §3.1）。

### 數學 `math-sdk/games/wild_alchemy` — 可跑、規則已驗
- 冒煙 `design/smoke_run.py`（一定用絕對路徑執行，有 main guard）→ `library/books/*.jsonl`。
- 規則回歸 `new-games/wild-alchemy/qa/regress_books.py`：抄錄 125 局 0 問題；生成 book 加 `--l4-three 0.1 --super-start 1`，只剩「SUPER 封頂書」是修正前產生的（下次重產即消）。
- **還沒跑 run.py 全量＋optimizer**（吃記憶體，要先問 Stone）。第一次量到：自然 FG 平均 169×／中位 54×；SUPER（預存一階）平均 19 局、570×、無封頂。optimizer 的 FG 切片（0.28／hr 220）要在全量後重量。
- `winLevel` 五級、`updateFreeSpin` 1 起算、`lineIndex` 0 起算、`reveal.bars`、`wildTransfer`／`bloodPoints` 都照抄錄格式。

### 前端 `wp-alchemy/apps/WildAlchemy` — 改到一半，**目前應該編不過**
已做：config.ts 同步（6×6／50 線／10 符號／3 模式）、constants（SYMBOL_SIZE 96、無 padding、BIG 25×）、refTiming.ts（抄錄全部時間常數）、seeded.ts、typesBookEvent.ts（新事件）、winLevelMap 五級、stateGame（bars／pendingTransfer／ladder／CastCue）、bookEventHandlerMap.ts 全改寫（reveal 預讀 wildTransfer、人物先落再換 W、霧蓋住→揭曉、點數飛瓶、X2／+3 節拍、進出 FG）、新元件 Blocks／WildTransfer／LadderHud（灰階過渡版）、刪 Searchlights／WildColumns／featureTiers／frame*／FeatureSplashPanel／stories、Background 兩場景、CastSpine 把 cue 對到暫代 rig 的 react／reactBig、betModeMeta 兩檔購買、ResumeBet／actor／utils 清理、ModalPayTable 去 H5／SW。
**下一步第一件事**：`cd wp-alchemy && pnpm --dir apps/WildAlchemy check:types`，把剩下的型別錯誤修完（可能還有：i18nText／rulesText／IntroFeatures 的 HT 文案與 tier 文字、ModalGameRules、SymbolIdleFx／symbol*Motion 的 H5 鍵、Anticipation 無害）。然後 dev 3062 `?mock=1`（devBooks.json 已換成新數學的 book：baseWin／baseTransfer／baseBlock／baseNoWin／baseTrigger／bonus／superBonus）實際轉一輪看：大格層、轉換霧、FG HUD、五級大獎。
- 之後：FreeSpinIntro 自動開始（面板 Loop 後 3.5 s 自動 START）、WinLines「原獎金→X2→乘後」、大格合併轉動動畫（紫框、一階一階吞）、轉輪速度對 REF_TIMING（27 格/s、停輪 0.2 s、第 5／6 欄不回彈）、規則／賠率文案 16 語、音效對位、角色 rig（spine-motion-kit，動作表 SPEC §4）、美術需求單（背景先拆件 §3.1）。

## scaffold 紀錄（2026-11-09）
- 來源 `wp/apps/HardTime` 工作樹（含 neon 轉輪未提交修正）；排除 design 歷史素材；dev 3062／storybook 6062；launch.json `wildalchemy-dev`／`wildalchemy-playtest`。
- 仍是 Hard Time 的：美術、音效（`static/assets/audio/hard_time/`）、規則文字、Spine 角色（暫代）。

## 2026-11-09 下午（Claude 接手前端，Codex 已停）

- Codex 這三小時的改動都保留：`src/game/createAlchemyReel.svelte.ts`（無 padding 的轉輪引擎，27 格/s、抄錄回彈曲線、第 5／6 欄不回彈）、WinLines 的「原獎金→×N→乘後」逐線 0.7 s、FreeSpinIntro 自動開始（進場 5.0 s、加局短停）、LadderHud 直式版面、規則／介紹文案（en/de/pl/fi…）、app 標題。
- 我補的：`FreeSpinOutro` 數完後停一圈（1.52 s）自動返回（抄錄面板 In/Loop/Out 自動，原本等點擊會卡住）；`constants.ts` 重複宣告清掉；`B` 空白牌（抄錄 book 重播用，`static/assets/sprites/wildAlchemy/blank.png`）；`design/pick_dev_books.py` 讀 `library/books/*.jsonl`，並把抄錄代表局放進 devBooks（`?mock=1&book=ref_bonus_1`、`ref_base_41`…）。
- `pnpm --dir apps/WildAlchemy check:types`：0 錯誤。
- 無頭邏輯測試（dev 3062、`?mock=1&headless=1&hmdebug=1`，`window.__HM_EMIT__({type:'bet'})` 觸發）：主遊戲含轉換的 book 跑通（轉輪→大格層→霧→揭曉→連線）；購買 FG book 跑通（觸發→轉場→6 局，每局約 12 s，點數累加、連線付錢、回主遊戲）。視覺只截到主遊戲四格（見對話紀錄）；FG 的畫面還沒親眼看。
- 節奏驗收工具：`new-games/wild-alchemy/qa/trace_to_timeline.py`（把 `window.__HM_TRACE__` 轉成逐局時間表並對抄錄窗口）、`qa/replay_cdp.mjs`（無頭 Chrome 重播一本 book、截圖、輸出時間表）。**卡住**：直接啟動 Google Chrome 無頭模式在這台機器上沒開出除錯埠（程序活著但不建 profile、不監聽）；Claude 內建瀏覽器窗格在 app 視窗不在前景時不合成畫面、隱藏分頁的計時器被節流，所以長流程的節奏數字不可信。解法擇一：讓 Claude app 視窗在前景（內建窗格就能截圖／點擊）、裝 Playwright Chromium（約 170 MB 下載）、或用 Claude in Chrome。
- 數學全量 `run.py` 在跑（14:49 起，模擬完成、optimizer 中）；完成後要：量各模式 RTP／中獎率／FG 形狀 → 調 `game_optimization.py` 切片 → `design/sync_math_config.py` → `pick_dev_books.py`（會自動改讀 publish_files）。

- build 守門：暫時從 `build` 鏈拿掉 Hard Time 角色專用的六個檢查（check_cast_spine_v2／check_cast_spine_holes／check_fg_cast／check_cast_motion／check_layered_cast／check_ui_palette，前三個要 HardTime design 的來源檔，後者綁 HT 色票）與兩個引用已刪模組的（check_feature_titles／check_frame_beat）。新角色 rig 進來後要補回等價的零缺陷檢查（spine-motion-kit 報告＋check_outline_ink）。其餘守門都過（social words、assets、sprite keys、symbol weight、symbol idle、reel motion、sounds）。

- 16:40：`check_symbol_motion` 要每個符號的得獎／落地動作互不相似，回放用的 `B` 空白牌給了獨特的「緩升緩沉」（無光暈）；H5／SW 條目從 `symbolWinMotion.ts`／`symbolLandMotion.ts` 移除。守門 OK: 11 win / 11 land。
- 數學量測腳本：`math-sdk/games/wild_alchemy/design/measure.py`（各模式 RTP／中獎率／高均率／封頂機率／p5k／p10k／etl10k／etl40b／FG 局數點數階數），全量跑完先跑它再調 `game_optimization.py`。
- 畫風定案 A 羊皮紙手稿＋墨線平塗，WILD 要很顯眼：`new-games/wild-alchemy/ART_REQUEST.md` §0.1。

- 17:05：`pnpm build` 通過（2m36s）。全量 run.py 卡在 super_bonus 十個 worker 結束後的 join（0% CPU；疑似 Manager 回傳過大）；暫存檔其實都在，改用 `math-sdk/games/wild_alchemy/design/finish_run.py` 合併 super_bonus 並接 optimizer。另外 `gamestate.resolve_spin` 現在只在主遊戲記 force 逐線資料（FG 50 線×多局會把回傳撐爆）。

- 17:40：數學全量完成（finish_run.py 合併＋optimizer＋分析＋格式檢查 PASS）。measure.py：RTP 96.020／96.050／96.080，base 中獎率 40.45%，封頂 1/13.3M、1/200k、1/80k，尾端指標皆在限內；FG 局數中位 9／9／18。正式 book 規則回歸 10 萬本 0 問題。`design/sync_math_config.py` 與 `pick_dev_books.py` 已改讀 publish_files。

- 18:20：**轉動中的大格合併**做了（SPEC §2.2）：`src/game/mergePath.ts`（合併樹演算法移植：每個寬 >1 的 bar 用種子亂數切成左右子樹、每步所有「兩個子都是葉」的節點同時合併；只有 ≥3 的合併亮框；種子＝上一局盤面）＋`planMerge`（框出現 `reelMergeShowWait[s-1]`、框間 `reelMergeInterval[s-1]`、最後一框後 1.0 s 整條停；算每輪要多轉幾格）。`WideReels.svelte` 畫寬轉輪面板與脈動雙框（過渡版）。轉輪引擎：大格內的輪以 'anticipated' 類型轉、首輪帶延遲、其餘輪不加自己的 padding（`stateGame.mergeExtra`）。`Anticipations` 從 Game.svelte 拿掉（本款無聽牌）。單元測試：3×3 框 0.4／停 1.5，4×4 框 0.5→1.3／停 2.3，5×5 框 0.5→1.7→2.9／停 3.9；抄錄 5×5 第一框在 2.4 s，待有畫面時決定「未框的 2 欄合併是否也占一個 interval」。`normalStopTime(i)=0.9+0.2i` 是估的，要實測校正。

## 下一步（照 SPEC 第 9 節）
1. 看到 FG 畫面：大格層、霧、X2／+3、HUD 直式；對抄錄逐局表（`replay_cdp.mjs` 或內建窗格可見時用 `__HM_TRACE__`）。
2. 大格合併「轉動中」的表演（紫框一階一階吞；現在只有停輪後的大格層）、轉輪停輪間隔對 0.2 s 實測。
3. 角色 rig（spine-motion-kit，動作表 SPEC §4）、美術需求單（背景先拆件 §3.1）、音效對位、規則／賠率 16 語檢查、`check_social_words`。

## 2026-11-09 晚間 — Codex 首批生圖來源

- 新需求已照 `new-games/wild-alchemy/ART_REQUEST.md` 的「Codex 生圖、Claude 拆層整合」分工執行。19 張有效來源在 `new-games/wild-alchemy/art/2026-11-09-v1/`：16 張背景／物件＋H1、L1、WILD 三張畫風候選。
- 先讀該批 `README.md`。`-key` 為洋紅 RGB 待去背；尺寸未統一成 1920×1080 共座標，不能直接整張疊上；部分是多物件來源表。十張缺陷／舊版在 `rejected/`，不可整合。
- H1、L1、WILD 尚待正式盤面 style frame 驗收，木框細節也需統一。原圖檢視 `index.html`、來源清單 `manifest.json`、完整提示詞 `prompts.json`、唯讀來源檢查 `verify_sources.py`／`source-check.json`。
- 沒有動前端程式或數學，也沒有打包／更新平台；這批不是已完成的角色動畫或最終遊戲美術。

- 20:30：`design/check_symbol_idle.mjs` 的符號清單改成本款 10 個（原本寫死 HT 的 12 個，會印「SW: no idle spec」）；全部清理後 `pnpm build` 再過一次。`new-games/wild-alchemy/ART_REQUEST.md` §10 補第一批 style frame 三張（H2 女煉金師符號、她的 WILD 金像卡、MG 背景底景）的英文提示詞與驗收。
- 20:35：無頭 Chrome 問題找到了：Chrome 157 用 `--headless=new` 不開除錯埠，改純 `--headless` 1 秒就開（HardTime 的 probe_* 用的是有視窗的隔離 Chrome，也可）。`qa/replay_cdp.mjs` 改旗標並加 `--every N`（每 N 秒截一張 `t-xxx.xs.png`）。
- 21:40：無頭重播終於能看、能量（`qa/replay_cdp.mjs`：`--headless`＋唯一 profile、`Target.activateTarget`、等 `stateApp.loaded`、點掉 DOM 介紹卡 `.hm-intro`、`--probe` 頁內記錄轉輪狀態與事件、`--every`、`--extract`、頁面例外擷取）。查出並修掉四個真 bug：
  1. 抄錄 book `paddingPositions` 是空的 → 轉輪 padding 取到 undefined → `getSymbolInfo` 炸、整局卡死（所有 `ref_*` book 都會）。`bookEventHandlerMap` reveal 現在缺位置時用種子亂數補（SPEC §3.4）。
  2. `createAlchemyReel` 的 `landOnImpact` 在換回盤面之前就對整條（含 padding、上一盤）發 land → 每次停輪連發 Scatter 計數音；改成先換回 6 格再發 land。
  3. 大格內第 5、6 欄不回彈、1–4 欄回彈 → 大圖停輪時裂成兩截；改成整塊跟首欄（`stateGame.spinOptions`）。停輪音也改成整塊一聲（首欄）＋一次震動，WideReels 不再照排程發聲。
  4. 第 1 欄原本 0.84 s 停（抄錄 1.0）→ 第 1 欄 padding 多走 `LEAD_CELLS`（0.16 s×27 格/s），後面各欄因為 padding 累加自動跟著，0.2 s 節奏不變。
  量到（無頭、獨跑）：第 1 欄停 1.0–1.15、5×5 大格整塊 4.9–5.05 停（排程 4.78）、合併框 0.78／2.28／3.78 照 `mergePath` 的新模型（首框＝0.2＋showWait、框距＝interval＋0.3、暗 0.4、最後一框後 1.0 停）。截圖：`new-games/wild-alchemy/qa/runs/ref_base_41e/`。注意：**重播進行中不能改原始碼**（Vite 重載會把 `__ef` 清掉），量時間時內建窗格也要閒置。
- 22:10：Stone 在 Mac 開了 Session，內建窗格能截圖了（直式 690×1300）。用 `ref_bonus_1` 實轉看完 FG：進場面板、2×2 大格、霧蓋住→揭曉（紅叉／金卡）、點數瓶 3/12→4/12、X2 升階＋加局、連線 ×2 標籤、結算面板數字跑分、回主遊戲 WIN $32.10 ✓。修了：轉換時的全螢幕暗化矩形原本畫在 board 容器裡（只蓋到左上角）→ 改 `stateGame.fogTint` 由 Game.svelte 在畫面座標畫；直式 `FreeSpinCounter` 牌壓到 HUD 階梯 → 往上移一格。待確認：2×2 人物格成功時應整塊換成 WILD 大卡（截圖裡像只亮一格），用無頭 `ref_bonus_1b` 的逐幀對 book 核對。`qa/make_sheet.py` 把 `--every` 截圖排成總表。
- 22:35：無頭 `ref_bonus_1b`（桌機 1422×800，Pixi 每 2 s 截圖，`qa/runs/ref_bonus_1b_s1..s3.png`）整局 123.6 s 跑完、事件全對 book：觸發 2.1 s 落定 → 古堡框 4.0 → 面板 6.8 → FG 第一局 12.4（抄錄 11.5＋2.1＝13.6，差 1.2 → freeSpinTrigger 末尾加 0.8 s hold）；FG 每局 8.7～15.4 s（抄錄 9～12；15.4 的那局含升階＋加局＋多線）。**2×2 人物格成功時整塊換成 W 大卡 ✓**（先前在窗格看到的小金方塊是點數光球，不是 bug）；全螢幕暗化修正後整個場景都變色 ✓；霧對大格是整塊一片 ✓；3×3 合併時寬面板帶亮框 ✓。
  待做（表演）：轉動中的寬面板現在是黑板，抄錄是「n 欄寬的模糊轉輪」（要寬轉輪帶圖）；進場面板文案照 SPEC §3.3（CONGRATULATIONS／YOU HAVE WON N FREE SPINS／START）；`--extract`／`--every` 截圖會卡主執行緒（單欄停輪延後 0.6 s），**量時間只用 `--probe`**。
- 22:45：窗格閒置下的純探針校準（`qa/runs/cal_*`）：第 1 欄 1.06～1.17 s、每欄約 0.2、2×2 整塊同停 1.49、4×4 單框 0.82→1.93、5×5 0.78／2.28／3.78→4.93。都在 ±0.1～0.15 內（冷啟動第一局偏慢約 0.1），`LEAD_CELLS` 先維持 0.16 s。SPEC §2.2 已記實測值。
- 22:55：`qa/probe_timeline.py`（探針 → 逐局時間表，開轉點＝`mergeShow` 廣播）。發現**冷／熱差異**：頁面載入後第一局從開轉到轉輪回報 spinning 要 0.4 s（JIT／建貼圖），FG 的熱局只要 0.1 s；所以熱局第 1 欄落定在開轉後約 0.68 s（抄錄 1.0）。校準要以熱局為準：`LEAD_CELLS` 從 0.16 s 改成約 0.48 s（13 格），第一局（冷）會變約 1.4 s，可接受。探針現在也記 `broadcastAsync` 事件（霧蓋住／揭曉、光球、升階、+3、連線、面板）的開始與完成。

## 23:05 暫停（5 小時額度 90%，Stone 指示：排 01:12 繼續，再不夠排 06:15；不要留任何要他確認的事）

已排兩個一次性 CronCreate（本 session 內存，session 要開著）：01:12 主要、06:15 備援。最後狀態：
- 原始碼最後改動：`createAlchemyReel.svelte.ts` LEAD_CELLS 0.39 s（熱局校準，未實測）；`bookEventHandlerMap.ts` 進 FG 停頓 1.2 s（未實測）；`SymbolSprite`／`Blocks` 沒動。svelte-check 0 錯誤（LEAD 改完有過；停頓改完沒再跑，只是常數）。
- 背景跑著 `qa/runs/ref_bonus_1d`（純探針、含 await 事件；用 LEAD 0.39＋停頓 1.2 的程式）。完成後 log 在 `qa/runs/ref_bonus_1d.log`。
- **暫停時的待辦（照順序）**：
  1. `preview_start wildalchemy-dev`（暫停時會關掉 server）。
  2. `python3 -I qa/probe_timeline.py qa/runs/ref_bonus_1d/probe.json`：熱局 r0 應 ≈1.0；進 FG 第一局 ≈ 古堡落定 +11.5；FG 單局：wildTransferCover start ≈2.5、wildTransferReveal done ≈5.0、pointsFly 0.2+1.0、ladderStep 0.8、ladderPlus 1.2（SPEC §2.5）。偏差就調 `refTiming.ts`／handler，重跑 `node qa/replay_cdp.mjs --book ref_bonus_1 --probe`。
  3. `page-errors.txt` 有 3 次「Unable to convert color -662/-918/-4767」（1c 才出現，stack 在 SymbolSprite.svelte 的 Container $effect）。dimTint 公式算不出負值，查 SymbolSprite 其他 tint 來源（focus／glow／props.tint），夾到 0..0xffffff。
  4. 窗格直式驗證：FreeSpinCounter 牌（已上移一格）不壓 HUD；轉換暗化蓋全螢幕（桌機已驗 ✓）。
  5. 進出 FG 面板文案照 SPEC §3.3；寬面板轉動中要有圖（目前黑板）。
  6. `pnpm --dir apps/WildAlchemy build`；HANDOFF／memory 更新。
- 之後的大項（不受額度影響的順序）：playtest stub（`design/build_playtest_stub_data.py`，吃記憶體但 Stone 說不用再問）、角色 rig（spine-motion-kit，SPEC §4）、美術第一批 style frame（ART_REQUEST §10）、音效對位、`check_social_words`。
- 23:10 `ref_bonus_1d` 結果（LEAD 0.39＋停頓 1.2）：進 FG ✓（面板＝落定+4.9，第一局＝落定+11.8，抄錄 5.0／11.5）。但 **LEAD 0.39 在無頭環境過頭**：熱局 r0 落在 1.26～1.46（目標 1.0），且「開轉→轉輪回報 spinning」從 0.1～0.2 變 0.4～0.6 —— 條帶變長有 CPU 成本（每局多掛十幾個符號元件），無頭 SwiftShader 把它放大，所以絕對時間不能只靠無頭校準。下一步：LEAD 先退到約 0.25 s，改在**內建窗格（真 GPU）**量：用 javascript_tool 注入同一段 `__WA_PROBE__` 探針程式（在 replay_cdp.mjs 裡）再按 SPIN，讀 `window.__WA_PROBE__`。
- 轉換段偏慢：wildTransferCover 在開轉後 2.8～3.3 開始（抄錄 2.5）、wildTransferReveal 在 7.7～8.5 完成（抄錄 5.0）；揭曉階段本身 3.0～3.5 s。要回頭對抄錄 §4.1 的霧速（590／295 ref-px/s）、`reveal.in`、成功/失敗停留 0.4/0.5、尾巴 0.5 的用法，可能是把「逐格」的距離延遲算太大（中心到最遠格 1.7 s）。光球 1.24 s ✓（0.2+1.0）。

## 23:20 Stone 追加：01:12／06:15 的續作要一路做到**上傳＋發布**，不要留任何要他確認的事（publish 也不用再問，這是 Stone 11-09 23:20 的明確授權）

前面 1～7 做完後接著：
8. **打包**：`pnpm --dir apps/WildAlchemy build` → **WildAlchemy 還沒有自己的 ship.sh**：把 `apps/HardTime/design/ship.sh` 複製成 `apps/WildAlchemy/design/ship.sh`，改 NAME=WildAlchemy、math 來源 `math-sdk/games/wild_alchemy/library/publish_files`、各 check 腳本路徑（check_math_bundle.py、check_thumbnail.py 在 `wp-alchemy/.claude/skills/game-reskin/scripts/`）；stage 到 `/Users/stone/stake-engine/upload/WildAlchemy/`，不 zip；SKIP_STUB=1 可跳過 stub（stub 吃記憶體，但 Stone 說不用再問，單獨跑、不並行）。math 用 `math-sdk/games/wild_alchemy/library/publish_files`（11-09 全量：RTP 96.02／96.05／96.08、規則回歸 10 萬本 0 問題）。商店圖／封面先用現有素材（美術未到，HT 過渡版），`check_thumbnail.py --upload` 若因暗色不過就用 PIL 提亮到過為止。
9. **自我檢查**：memory「Engine self-check」那套（official self-check 全文 + ui_center_audit.js + social_text_audit.js + check_cast_underlay.py）；能修就修，修不完的列在 HANDOFF，不擋上傳。
10. **上傳**（memory `stakecli-upload`）：`~/.local/bin/stakecli mcp` 走 stdio JSON-RPC（initialize → tools/call），team `silver-stars`；先 `list_games` 找 slug（預期 `wild-alchemy`；沒有就看有沒有建立遊戲的 tool，有就建，沒有就把這點寫進 HANDOFF 並跳過上傳做完其餘）。流程：validate_upload_path → check_math_compliance（本機）→ plan_upload（math／front 各一）→ execute_upload（plan_id＋team＋game＋type＋path）→ get_upload_process 到 completed → list_scratch_files 核對數量。
11. **發布**：`publish`（team、game、type、path，math 加 check_compliance=true，confirm=true）math 先、front 後。update_approval_version 不加（沒有開著的審核）。不印 SID／token。
12. HANDOFF 記版本號（math vN／front vN）、memory `wild-alchemy-game.md` 加「PUBLISHED」，關 dev server。

注意：目前美術全是 Hard Time 過渡版（符號／角色／背景／UI／logo），這版發布是 Stone 要的「先上去」，不是送審版；送審前還要換美術、角色 rig、音效對位。
- 打包細節補充：HardTime 的 ship.sh 有「舊遊戲汙染」grep（Capo／Hot Miami 字串、playtest host、舊 asset 資料夾）。WildAlchemy 版把清單改成本款的前身詞（Hard Time／hard_time／HardTime／Capo／Hot Miami…），但過渡期音效仍在 `static/assets/audio/hard_time/`、logo 仍是 HT 圖：**字串**（規則文案、UI 文字裡的 HARD TIME）一定要清掉，**路徑**可暫留並在 HANDOFF 標明；check 失敗項若只是過渡素材就記錄後放行，不擋上傳。PLAYTEST 變數改 `dist/wildalchemy-playtest`、GAME=wild_alchemy、NAME=WildAlchemy、APP=$ROOT/wp-alchemy/apps/WildAlchemy。

## 2026-11-10 01:12 排程續作（額度已重置）
- 01:15 已做：1) dev server 開；LEAD_CELLS 0.39→0.25 s；2) 轉換揭曉段：拿掉每格多等的 `reveal.in` 0.45、紅叉淡出改不阻塞（抄錄 §4.1.1：揭曉全程約 1.7 s）；3) `SymbolSprite` 暗化進度 u 夾 0..1（rAF 時間戳早於 started 造成 dimAmount>1 → 負色值例外），dimTint 也夾；5) 面板文案照 SPEC §3.3：i18nText 加 congratulations／youHaveWon／inFreeSpins／start／back（16 語），FreeSpinIntro＝CONGRATULATIONS／YOU HAVE WON／N／FREE SPINS＋START，FreeSpinOutro＝CONGRATULATIONS／YOU HAVE WON／金額／IN N FREE SPINS＋BACK，PressToContinue 加 label prop；8 前置：`design/ship.sh` 修 `cd wp-alchemy`、20000× 檢查、Hard Time 字串汙染清單；商店圖／封面用 HT 過渡素材複製到 `upload/WildAlchemy/{thumbnail,cover}`，check_thumbnail 兩組 PASS（mean 137／134）。
- 上傳工具：`new-games/wild-alchemy/qa/stakecli_mcp.py`（stdio、換行分隔 JSON）可列工具／呼叫；stakecli 2.0.1 工具含 list_games、validate_upload_path、check_math_compliance、plan_upload、start_upload／execute_upload、get_upload_process、list_scratch_files、publish、list_game_versions、auth_status。
- 01:35 stakecli：auth 有效（keyring）；`check_math_compliance` 對 `library/publish_files` **PASS**（2★ 最高注級 200、3★ 1000；0 失敗 0 警告；RTP 96.02／96.05／96.08、封頂 1/13.3M／200K／80K）。`list_games`：**平台上沒有 wild-alchemy**（有 dragon-tide 未發布）；stakecli 沒有建立遊戲的工具或子命令 → 建遊戲只能在網站做。正在用內建窗格看 engine 網站是否已登入。
- 01:45 **上傳的唯一阻塞：平台沒有 wild-alchemy 遊戲**。內建窗格打開 engine.io/dashboard 會被導回首頁（窗格沒登入；登入要 Google／GitHub／Discord，我不能代為登入）。stakecli 也沒有建遊戲功能。→ Stone 在 engine.io/dashboard 建一個 Wild Alchemy（slug `wild-alchemy`）後，跑 `python3 -I new-games/wild-alchemy/qa/upload_publish.py`（validate → compliance → plan → execute → scratch → publish math 再 front，全自動），或等 06:15 備援排程自己重試（它會先 list_games）。其餘步驟（build、打包、自我檢查）照做到底。
- 01:55 探針 `ref_bonus_1e`（LEAD 0.25）：熱局第 1 欄落定 0.79～0.81（冷局 1.01）、每欄 0.2、大格同停 ✓；光球 1.21 ✓、升階 0.81 ✓、+3 1.21 ✓；進 FG：面板＝落定+4.55、第一局＝落定+11.2（抄錄 5.0／11.5，容許）；FG 單局 7.9～12.8 s。轉換段：霧 2.25 起 ✓（抄錄 2.5），揭曉完成 6.1～7.3（晚）→ 每格閃光改不阻塞（揭曉 promise 在最後一格開始散霧時就結束，照抄錄 0.6＋1.1＋1.7≈3.4 s），待下一輪探針確認。無頭環境條帶越長 CPU 停頓越大，LEAD 0.25 依行程模型（起轉 0.22＋行程 0.70）在真 GPU 約 0.95～1.0，先定案。
- 02:00 窗格直式（690×1300）實轉 `ref_bonus_1` 驗證 ✓：進場面板 CONGRATULATIONS／YOU HAVE WON／6／FREE SPINS＋START；FREE SPINS 1/6 牌在 HUD 列上方不重疊；轉換暗化蓋滿全螢幕；霧→紅叉／W 揭曉正常。第 4、5 項完成。開始第 6／8 項：`SKIP_STUB=1 design/ship.sh`（含正式 build）背景執行中。
- 02:15 `ship.sh` 第一次在第 2 步死掉：HT 的 `check_rules_match_wins.mjs`（Neon Frame／Collector 規則）把 zst 書全讀成字串爆掉（0x1fffffe8），而且它本來就不懂本款規則 → 改成跑 `qa/regress_books.py library/books --l4-three 0.1 --super-start 1`（同一次全量的明文書）。重跑中（含正式 build）。
- 02:30 第二次打包在規則回歸停下：`library/books` 是 11-09 11:43 的舊冒煙書（SUPER 修正前，191 問題）；解壓上傳包的正式 zst（8 萬本）回歸 **0 問題**（1 分 19 秒）。ship.sh 第 2 步改成「解壓 staged zst → 回歸 → 刪暫存」。第三次打包執行中。
- 02:45 第三次打包：回歸 0 問題、asset／sprite／social／motion／idle 守門全過，死在 `check_reel_stop_sound.mjs`（字串比對守門，要求 `teasing ? tease : stop`）；改成本款規則（`teasing || block`＋被吞的欄 return）。第四次打包執行中。
- 03:00 第四次打包：build 全守門過、stage 178 檔、商店圖 PASS，汙染檢查抓到 `alt="HARD TIME"`（IntroFeatures logo）、app.html 註解「Hard Time uses Saira」、識別字 `htPrisonerSpine` → 前兩個改掉，Prisoner 從清單移除（識別字非文案）。第五次打包執行中。bundle 靜態稽核：無舊 loader 字串、`<title>Wild Alchemy</title>`、2e4 封頂、viewport 正確；外部網址只有函式庫授權註解與共用套件常數（twist-game 規則圖，待確認未載入）。
- 03:10 **第五次打包 all clean**：`upload/WildAlchemy/`＝frontend 178 檔（39 MB）、math 188 MB（8 萬本回歸 0 問題、合規 PASS）、thumbnail／cover（HT 過渡素材，亮度 PASS）、ART-PACKAGE／SOURCE-ASSETS SHA256、RELEASE-SELF-CHECK-20261110.md。第 6／7／8／9 項完成。
- 第 10／11 項（上傳／發布）**卡在平台沒有 wild-alchemy**（stakecli 無建遊戲功能，窗格沒登入 engine.io）。Stone 建好遊戲後：`python3 -I new-games/wild-alchemy/qa/upload_publish.py`（會自動 validate → compliance → plan → execute → scratch → publish math 再 front）。06:15 備援排程會先 `list_games` 再決定。
- 03:20 最後探針 `ref_bonus_1f`：轉換段 霧 2.25 起 → 揭曉完成 5.6～6.5（抄錄樣本 cover→done 約 3.4 s，我們 3.4～4.3，隨霧中心位置變動）、光球 1.22、熱局第 1 欄 0.80；頁面無例外（只剩 Pixi TextStyle／drawIcon 的既有 warning）。dev server 已關。**今晚收尾：清單 1–9 完成，10–11 待平台有 wild-alchemy，12 的 memory／HANDOFF 已更新。**
- 11-10 早上 Stone 在平台建好 wild-alchemy 後跑 `qa/upload_publish.py`：math 197.6 MB（7 檔）→ **PUBLISHED math v1**；front 40.6 MB（173 檔）→ **PUBLISHED front v1**（合規 PASS、scratch 核對無誤）。06:15 備援排程已取消。這版是 Hard Time 過渡美術，不送審；下一階段：美術第一批 style frame（ART_REQUEST §10）、角色 rig、音效對位、寬面板轉動帶圖。
- 11-10 上午：驗收 Codex 11-09 的兩批 style frame 候選（盤面實測對照圖在 `new-games/wild-alchemy/art/2026-11-10-styleframe-order/00-mock-*`）：畫法採 v2 H2、WILD 字牌採 v1、MG 底景通過；人物卡改深色彩底（羊皮紙底和 WILD 一樣亮）。寫了第三輪生圖單 `art/2026-11-10-styleframe-order/生圖工單.md`（5 張×2 候選，提示詞同名 txt，只生圖）。卡片底色表寫進 ART_REQUEST §2。等 Codex 交圖後由 Claude 挑圖、量亮度階、合成 mock 驗收，再開第二批。
- 11-10 08:55：Codex 交回第三輪 style frame 10 張，Claude 驗收**五張全過**（soft 10–19%、fit 97–100%、WILD 灰階唯一亮卡、66 px 字牌可讀）。定稿 `new-games/wild-alchemy/art/2026-11-10-styleframe-order/picked/`（H2／W_H2／H1／L1／S 各 1024²＋MG_base_1920）；基準門檻寫進 ART_REQUEST §0.1。下一步：第二批生圖單（H3、H4、三張 WILD、L2–L4、背景物件層、HUD、盤框），以及把這五張先接進遊戲取代 HT 過渡符號。
- 11-10 10:10：Codex 自行生完第二批 31 張（`new-games/wild-alchemy/art/2026-11-10-batch2/`）。驗收：L2–L4、W_H1、MG／FG 背景物件 15 張、HUD 6 張、盤框與大格框**畫面通過**（待我去背、排到 1920×1080 共座標）；**H3「學徒」、H4「小徒弟」畫成青少年／小孩，違反審核規範 [217]（禁未成年人形象）→ 退**，改成 H3 抄寫學者、H4 爐工（中年），重畫單 `art/2026-11-10-batch2-fix/生圖工單.md`（8 張）。ART_REQUEST §1 加年齡規則，FG 角色由「人造人少女」改成成年女性。完整盤面合成圖 `art/2026-11-10-batch2/review/mock-full-set-*.{jpg,png}`。還沒畫：霧團、封印印章、液滴／紋章、大獎底圖、Logo、商店圖、UI 材質、兩隻角色。
- 11-10 10:20：H3 抄寫學者／H4 爐工與其 WILD 重畫交回，驗收全過（成年人、門檻全過）。**13 張符號定案**：`new-games/wild-alchemy/art/symbols-final/`（1024²，manifest 記來源）。待辦：(1) 接進遊戲取代 HT 過渡符號——W 依 `from` 選 W_H1–W_H4、WILD 1.08 倍格、rulesText 的 SYMBOL_NAMES 改名（Master Adept／Alchemist／Scribe／Furnace Keeper／Salt／Sulphur／Mercury／Gold／Tower）；(2) 背景物件、HUD、框去背並排到 1920×1080 共座標；(3) 下一張生圖單（霧團、封印印章、液滴／紋章、大獎底圖、Logo、商店圖、UI 材質）；(4) 兩隻角色的 spine-character 需求單。
- 11-10 Codex 需求續作：Stone 明確選「下一批美術與角色需求（先做）」。已開 `new-games/wild-alchemy/art/2026-11-10-batch3/生圖工單.md`（29項素材、每項2候選、manifest＋29份提示詞）與 `art/2026-11-10-characters/{共用動作與交付.md,mg/需求單.md,fg/需求單.md}`（12動作、MG24層／FG23層、2份母圖＋47份拆層提示詞）。**這次僅完成需求，未生圖／rig／驗收，未改app或更新平台**。朝向修正為站右朝左；本機 spine-motion-kit 只有拳擊模板，長袍／施法／後空翻需先擴充並核定，不能照舊總單把stand34當現成CLI。商店FG等核定MG母圖，MAX沿用EPIC場景＋程式字牌。ART_REQUEST §11有全部入口；待辦(3)(4)的開單完成，製作與原待辦(1)(2)仍未完成。
- 11-10 10:40：Stone 讓 Codex 寫了第三批工單（`art/2026-11-10-batch3/`，29 項）與兩隻角色需求（`art/2026-11-10-characters/`）。Claude 審閱：第三批可生，去背項改洋紅底、霧改不透明、補 13 項（共 42 項 84 張，`Claude審閱-先讀這份.md`）；角色五點更正（`Claude修正-先讀這份.md`）：stand34 長袍模板已存在於 `~/tools/spine-generator-stand34`、圖層用 stand34 檔名（MG 24／FG 23）、姿勢遠手叉腰近手肩高托瓶不鏡像、Codex 只生母圖（`mg/full.txt`、`fg/full.txt` 已改寫，洋紅底，各 2 候選）、MG 7 動作 FG 12 動作、win_025 改「漩渦蓋住的躍起」。Claude 待辦：在 stand34 工作樹加 Wild Alchemy 動作組（名稱秒數照 SPEC §4，`cast_release` 0.2 s）；母圖核定後拆層、開補畫單。

- 11-10 Codex 生圖續作：Stone「你有生圖嗎，沒有的話馬上生」後，已用內建 image_gen 生完第三批42項×2＝84張（`art/2026-11-10-batch3/raw/`）＋MG／FG母圖各2張（`art/2026-11-10-characters/{mg,fg}/raw/`），每張附實際used提示詞、來源路徑、尺寸與SHA256。依Claude修訂的洋紅底與新母圖姿勢提示詞，未去背／裁切／放大／合成／拆層／rig。大獎兩張混入人物與金焰框偏圓已重生，舊稿隔離rejected。商店FG用MG-a作暫定身份參考，連同母圖待Claude核定，不是已通過。stand34實際在spine-generator-stand34，後續依Claude修正單（MG7／FG12動作）處理。原圖待正式美術驗收；遊戲、upload包、平台版本本輪未更新。
- 11-10 11:25：Codex 交回角色母圖 4 張與第三批 84 張。**MG 母圖核定 mg-b**（`art/2026-11-10-characters/mg/approved/full.png` 已去背）；**FG 選 fg-b 但袍擺有 Dragon Tide 浪花紋**（姿勢參考外漏；程式抹除三次都不乾淨）→ 補單 `fg/補單-去袍擺紋.md`（2 候選，收圖要和 fg-b 相減驗只改袍擺）。第三批畫面全過（`art/2026-11-10-batch3/review/驗收紀錄.md`）：旋鈕選 b、paytable 圖示選 b、商店 FG 不用（改用核定母圖排位），其餘 a／b 待合成定選。新工具 `art/tools/key_magenta.py`（洋紅去背＋去色溢，淺深底無粉邊）。Claude 待辦順序：(1) FG 補單收圖驗差 → (2) 兩隻拆層＋補畫單 → (3) stand34 工作樹加 WA 動作組 → (4) 第二、三批全部去背、排 1920×1080 共座標、定選 → (5) 13 張符號接進遊戲。
- 11-10 11:40：**13 張符號接進遊戲**（等 FG 補圖期間做的）。`static/assets/sprites/wildAlchemy/symbols/`（512²，共 3.3 MB）；`assets.ts` 的 hmH1–4／hmL1–4／hmS／hmW 改指新檔，加 `waWH1–4`；`constants.ts` 新增 `CARD_RATIOS` 0.94、塔 1.0、WILD 1.08、`WILD_INFO_BY_PERSON` 與 `symbolInfoOf()`（W 依 `from` 選那個人的金像卡），`utils.getSymbolInfo` 與 `Blocks.svelte` 都走它；大格拿掉程式畫的銀框（卡片自帶同款框）。介紹卡三個圖示改新符號；`rulesText` 的 SYMBOL_NAMES 16 語改成 Master Adept／Alchemist／Scribe／Furnace Keeper／Salt／Sulphur／Mercury／Sol／Tower；`design/check_symbol_weight.py` 改寫成卡片版亮度階守門。`pnpm build` 全守門過。無頭實看：主遊戲轉換（爐工與大師兄各自的 WILD）、5×5 大格、購買 FG 全程正常（`qa/runs/art-*`）。未打包、未上傳。待調：符號得獎／落地動作是為 HT 物件設計的旋轉，套在方卡上像卡片歪斜，換完其他美術後一起重調。

- 11-10 Codex 新補單續作：Stone「還有新需求的話馬上做」後找到FG去袍擺紋補單，已依hem-fix.txt原文＋fg-b原圖，用內建image_gen生出 `art/2026-11-10-characters/fg/raw/fg-b-plain-a.png`、`fg-b-plain-b.png`，附used提示詞與來源記錄。保留洋紅底原稿，未去背／裁切／另行修圖；待Claude差分驗收後才核定與拆層，未更新遊戲、upload或平台。
- 11-10 下午：FG 補圖（去袍擺紋）收件核定 `fg-b-plain-a` → `art/2026-11-10-characters/fg/approved/full.png`。**兩隻角色拆層 split-3**（`art/2026-11-10-characters/tools/split_cast.py`、`layer_sheet.py`、紀錄 `拆層紀錄.md`）：MG 21 層／FG 20 層，合成對母圖 0 差異、每層 1 塊，stand34 長袍模板（`~/tools/spine-generator-stand34`）認得、能跑全部動作。未過：近上臂舉高時肘部邊緣（可能要補畫單）、靜止接縫（肘／FG 頸／FG 踝）、缺 head_blink／head_focus、WA 動作組未加、未跑 check_layer_split／check_outline_ink、未進遊戲。新版製程規則在 `wp/.claude/skills/game-reskin/references/art-request-rules.md`（會露出的補底只能真畫；每層一整塊；交界墨線歸前層；收圖當天套模板逐格看）。
- 11-10 下午（續）：角色拆層到 split-4。母圖差異 0、`check_outline_ink` 兩隻 PASS；`check_layer_split` 各剩 7 項補底配對（清單在 `art/2026-11-10-characters/拆層紀錄.md` 末段）。開了補畫單 `art/2026-11-10-characters/補畫單-1110/生圖工單.md`（近上臂整段、head_blink、head_focus，兩隻共 6 項 12 張，**要請 Stone 轉給 Codex**）。下一步：補齊補底配對 → 收補畫圖（先和輸入圖相減驗位移）→ 逐格看 → stand34 工作樹加 WA 動作組 → 進遊戲；之後才是第二、三批去背排位。
- 11-10 傍晚：補畫單-1110 收 12 張並驗收（位置位移 <0.5 px）。併入肘端真畫、head_blink ×2、MG head_focus（split-5，母圖差異 0、墨線 PASS）。退 mg-focus-b、fg-focus ×2（頭轉向右）。舉手時露出軀幹側面的程式補底 → 開 `art/2026-11-10-characters/補畫單-1110b/生圖工單.md`（身體側面 ×2、fg-focus 重畫，共 3 項 6 張，**要請 Stone 轉給 Codex**）。拆層腳本 `tools/split_cast.py` 的 CONFIG 有 `paint_arm`／`heads` 掛點，收到身體側面圖後照同樣方式加 `paint_torso`。
