# Go Bananas 香蕉突擊隊 — 專案交接文件

> 最後更新：2026-07-17（數學改版 RTP 96.5% / Max Win 10,000×，見 §5.11；前端第二輪修正見 §5.10；範本 lines 遺留清除見 §5.9）
> 涵蓋範圍：`apps/GoBananas` 前端 + `math-sdk/games/GoBananas` 數學後端

---

## 1. 遊戲規格

| 項目 | 值 |
|------|-----|
| Game ID | `GoBananas` |
| 版面 | 5 軸 × 5 列 |
| 賠付線 | 15 條固定線（由左至右） |
| RTP | 96.5%（2026-07-17 自 97% 調整） |
| Max Win | 10,000×（superspin 2000×；2026-07-17 自 5000× 調整） |
| Bet Modes | `base`（1×）、`bonus`（Buy 200×）、`superspin`（50×） |
| Free Game 特色 | **黏性擴展倍率百搭**：W 落地後旋轉金箍棒擴展成整輪，黏住直到 freegame 結束，乘倍每次 spin 重擲（`updateExpandingWilds`） |

## 2. 美術（2026-07-03 二次改版：美式漫畫貼紙風・叢林突擊隊）

主題再轉向：使用者提供另一款遊戲的符號截圖（存於 `design/reference/`，**已 gitignore，版權物勿入 repo/build**），依其「叢林突擊隊猴子」概念由零重繪成**美式漫畫貼紙風**（粗墨線、平塗、網點陰影、白色貼紙描邊、有態度的表情），消除抄襲疑慮。

| 符號 | 圖案 |
|------|------|
| W 百搭 | 軍盔突擊隊猴＋步槍＋WILD 橫幅 |
| WX 擴展百搭 | 全身軍裝猴（軍盔/彈帶/軍靴，256×1280 整輪）；擴展動畫＝小猴掏出**大香蕉**轉三圈邊轉邊長大（cudgel.png 沿用金箍棒的轉軸接法） |
| H1–H4 | 軍盔+護目鏡、火焰果、鳳梨手榴彈、葡萄 TNT 炸彈 |
| L1–L5 | A/K/Q/J/10 寶石字（岩漿紅/冰晶綠/紫晶/翠玉/藍寶，白貼紙邊） |
| S | 金香蕉串 scatter |
| P | 金幣（superspin 獎金符號）、X = 木箱空格 |

> ⚠️ 背景×3、紅漆金邊轉輪框、`audio/cn/` 音效**仍是中國風**，尚未跟進換成叢林軍事主題；`Game.svelte` 標題「GO BANANAS 金猴鬧春」的中文副標也待定。
> 舊中國風符號版本可從 git 歷史（`7b5de6a`）找回。

### 生成器（全部可重跑，輸出即 repo 內素材）

```powershell
cd apps/GoBananas
node design/generate_symbols_comic.mjs <含 @resvg/resvg-js 的 node_modules 目錄>  # 漫畫貼紙風符號（現行）＋design/comic_contact_sheet.png 總覽
node design/generate_art.mjs <同上>   # 中國風背景/轉輪框（符號部分已被 comic 版取代，勿再跑符號）
node design/generate_spines.mjs   # Spine 4.1 JSON：各符號得分動畫 + wx 擴展動畫（h2 已改火焰閃爍）
node design/generate_audio.mjs    # 純 Node 合成中國風音效（無外部依賴）
```

## 2.5 美術三次改版（2026-07-16：寫實厚塗・全面對齊 AI 畫作）

`generate_symbols_realistic.mjs` 重寫 royals/props 段（工具 node_modules 在 `E:\stake\tools\gen`）：

- **l1–l4**：改用 `design/source/realistic_symbols/l1-l4.png`（AI 畫的岩漿A/冰晶K/紫晶Q/翠玉J，~110px 淺底）——chromaKey 加 `lightBg` 模式去米白底、`sharpen`（unsharp mask）補 2.3x 放大的銳度
- **l5「10」**：無畫作源，SVG 仿製：藍寶石漸層 + feTurbulence 邊緣粗糙化(rough) + 斑駁(mottle) + 手繪刻面筆觸
- **p**：厚塗金幣——放射漸層、鋸齒邊(reeded edge)、香蕉浮雕、patina 質感、星光
- **x**：叢林補給木箱（深色不搶戲）——木紋 turbulence、鋼角件、褪色 ✕ 模板噴漆
- **w_fg**：`w_fg.png`（咬香蕉特寫 607×575）裁方框成 256² 圓角金邊卡（wx 面板同款樣式），供擴展動畫咬食關鍵幀
- **cudgel**：金香蕉調亮 + 斑點質感
- **h1/h2/s**：⚠️ 來源是 `design/source/curated_symbols/` 的**手工精修版**（乾淨透明底，2026-07-15 使用者整理；2026-07-16 自 static 搬出以免進 build）——生成器只做 alpha bbox 裁切+置中縮放到 256²，**絕不重新去背**；要換圖就更新該資料夾檔案再重跑
- w/h3/h4/wx 沿用 chromaKey 管線（h4 金羅盤棋盤格殘留待修）

`generate_theme_jungle.mjs` 整檔重寫成厚塗風（背景 1920×1080 ×3 + 框 1280²）：
- bg_base 金色日出草原、bg_feature 烈日突擊（橘紅晚霞）、bg_superspin 夜襲（月亮+金螢火蟲）
- frame_edge 橄欖鋼帶+黃銅邊+鉚釘+銅角件；frame_bg 帆布質感橄欖底板
- ⚠️ resvg 對某些 filter region 會 panic（dotSoft 用 -120%/340% 直接 crash）；保持 ≤200%。`DUMP_SVG=1` 環境變數可傾印 debug svg
- `Background.svelte`：晃動裝飾由紅燈籠(gbH2)換成金香蕉串(gbS)，底色改深橄欖

Debug 工具（pixi-svelte 加的，`packages/pixi-svelte` 改後要跑 `svelte-package` 重建 dist + 重啟 storybook）：
- `localStorage.pixiPreference = 'webgl'` 可強制 WebGL（WebGPU 的 canvas 無法被截圖工具擷取）
- `globalThis.__PIXI_APP__` 全域指向 pixi Application（無頭截圖可手動 `Ticker.shared.update(t)` + `app.ticker.update(t)` + `app.render()` 驅動；spine 走 Ticker.shared）

## 3. 擴展百搭前端接線（2026-07-16 改版：吃香蕉長大）

演繹（`generate_spines.mjs` 的 wx `grow` 動畫，2.0s）：W 落地小跳 → 金香蕉(cudgel)彈出手掌飛向嘴邊縮小（0.04–0.3s）→ 換 `w_fg` 特寫卡 → **三口咬**（0.52/0.84/1.16s，每口擠壓+暖色閃+升一階：1.0→1.3→1.66→2.06）→ 吞嚥(1.44s) → 白金爆發換 wx 整輪(1.5s) → 落定彈跳(2.0s)。`wild_expand.wav` 對齊：pop+whoosh、三聲 crunch（一口比一口低沉）、gulp boing、horn+cymbal 爆發、滿足 hoot。

事件流（每個 free spin）：`reveal` → `updateExpandingWilds`（舊輪乘倍重擲）→ `newExpandingWilds`（新百搭擴展）→ `winInfo`。

- `src/components/ExpandingWilds.svelte`：黏性覆蓋層元件。新百搭從落地格起跳 → 轉金箍棒 3 圈放大滑至輪中心 → 金光換全身 wx → 不透明紅漆底板鎖輪 + 乘倍徽章。中獎線穿過時徽章脈衝。
- `bookEventHandlerMap.ts`：兩個事件 handler；`freeSpinTrigger`/`freeSpinEnd` 清空；`createBonusSnapshot` 斷線續玩還原（累積 newExpandingWilds + 最後一次 update 的乘倍）。
- `stateGame.stickyWildReels`：黏住的輪不再重播 W 落地音效。
- 已修 bug：`animateSymbols` 列過濾原為 1..3（3 列時代殘留），改 1..numRows。

## 4. 音效（design/generate_audio.mjs 合成）

古箏（Karplus-Strong）、鑼、木魚、大鼓、鈸、破風聲全程式合成，輸出 `static/assets/audio/cn/*.wav`：

- BGM：`bgm_main.wav`（96BPM 山水）、`bgm_freespin.wav`（126BPM 慶典），HTML5 Audio 循環
- 關鍵 SFX：轉輪停=木魚、scatter=五聲遞升撥弦、免費遊戲觸發=大鑼、`wild_expand.wav`=三段加速破風+鑼（與 wx 擴展動畫 0.35–1.45s 旋轉時間軸同步）
- `Sound.svelte` 內 `SPRITE_TO_CN` 表攔截 sprite 音效名 → 中國風音檔；未攔截的仍走原 sprite（sounds.json）

## 5. 數學建置（math-sdk）

```powershell
cd E:\stake\math_sdk
py -m venv env                      # Python 3.14 可用（numpy/zstandard 會源碼編譯）
.\env\Scripts\python.exe -m pip install -r requirements.txt   # 跳過第一行 git+ 那行
.\env\Scripts\python.exe -m pip install -e .
cd games\GoBananas
..\..\env\Scripts\python.exe run.py   # sims 1e4×3 modes → configs → Rust 最佳化 → 分析 → 驗證
```

輸出位置：`math_sdk/games/GoBananas/library/`
- `books/` 牌局書（.jsonl.zst）
- `lookup_tables/` 查找表 csv
- `configs/` 前端/RGS 設定（含 fe config）
- `publish_files/` 上傳 Stake Engine 用
- `optimization_files/`、`forces/` 最佳化與 force 檔

## 5.5 Superspin 前端呈現（2026-07-03 完成）

事件流：`updateFreeSpin`（次數 1..3）→ `reveal`（gameType `superspin`，board 的 P 帶 `prize` 分值）→ `newStickySymbols`（新銅錢黏板、次數重置）→ …循環… → `prizeWinInfo`（總結算）→ `setWin`/`finalWin`。

- `src/components/StickyPrizes.svelte`：黏性銅錢覆蓋層（仿 ExpandingWilds 模式）。紅漆金邊格底板鎖格 + `gbP` 銅錢 backOut 彈入 + 金字金額（`bookEventAmountToCurrencyString`）；`prizeWinInfo` 時全部脈衝
- `bookEventHandlerMap.ts`：`newStickySymbols`（撥弦音 + 彈入 + 寫入 `stateGame.stickyPrizes`）、`prizeWinInfo`（升調滑音 + 脈衝 + 設定贏分 + 收 spin counter）
- `Symbol.svelte`：P 符號顯示自身 `prize` 金額（reveal board 直接帶）
- `actor.ts` `onNewGameStart` 清空黏幣（一顆 superspin 一局）；`createBonusSnapshot` 累積 `newStickySymbols` 斷線還原（`utils.ts` snapshot 保留清單已加入）
- `betModeMeta.ts` 改為 `GO_BANANAS_BET_MODE_META`：BASE / BONUS 200× / SUPERSPIN 50×（hold'em 說明文案）
- spin 次數顯示沿用 `FreeSpinCounter`（`updateFreeSpin` 驅動，X/3，銅錢落地即重置）
- 手寫示範事件：`src/stories/data/superspin_events.ts` + `ModeSuperspinBookEvent.stories.svelte`（fullRound 一鍵播整局）
- 背景/BGM 原本就有 superspin 分支（月夜背景 + 慶典 BGM），無需改動

## 5.7 動畫打磨（2026-07-16）

- **進場**：`EntranceFx.svelte` 包住 BoardFrame（dy-24）與 Board 組（delay 140、dy-36），載入畫面結束後框先落、盤面跟進
- **轉輪**：`SymbolSprite.svelte` spin 態縱向拉伸 1.3×+上下殘影 ghost（假動態模糊）；停輪 land 態 squash 三段回彈（~240ms）
- **停輪塵土**：`ReelDust.svelte`——輪從 spinning→bouncing 撞停時輪底噴沙塵粒子
- **外框氛圍**：`BoardFrame.svelte` freegame 金色呼吸框光、superspin 冷月光（basegame 乾淨）
- **聽牌**：`Anticipation.svelte` 改金色聚光柱+上下 chevron；`Anticipations.svelte` 壓暗已停輪聚焦
- **FG 觸發**：`ScatterBurst.svelte` scatter 位置金環+火花（`scatterBurst` 事件，freeSpinTrigger 觸發鈴聲時+搖獎三連發時各一輪）；`TransitionAnimation.svelte` 香蕉後方旋轉金芒+結尾白金閃光切幕
- **無頭 QA**：`.storybook/preview-head.html` 支援 `?fakeRaf=1`（svelte Tween 在 rAF 停擺分頁凍結的解法）；改 assets.ts 後若 Storybook 吃舊資源清 `node_modules/.cache`

## 5.8 資源瘦身（2026-07-16）

build 89MB→59MB：刪 wildParty*/silverstar/audio cn（零引用）＋模板 spine 死資源（spines/symbols、symbols2、W.json、payFrame、foregroundAnimation×2、tumbleWin、progressBar、clusterWin、transition、symbolsStatic——assets.ts 條目同步移除，啟動下載也變快）。保留：reelsFrame（Frame_FSCounter）、freeSpins/winSmall（FreeSpinIntro/Outro frame 名引用）、coins、explosion、reelhouse、anticipation、fsIntro*、bigwin、globalMultiplier、pressToContinueText（動態 lang frame）。curated 源圖搬至 `design/source/curated_symbols/`。

## 5.9 範本 lines 遺留清除（2026-07-16）

MM 範本視覺全數替換為 GoBananas 風（`generate_theme_jungle.mjs` 新增 `fs_sign.png`/`fs_counter_panel.png`，軍事木牌+銅框鉚釘+香蕉徽章，文字由前端繪製、語言中性）：
- `FreeSpinAnimation`：fsIntro spine → gbFsSign 告示牌（頂部落下+盪擺入場）
- `FreeSpinIntro`/`FreeSpinOutro`：freespins_{lang}/winsmall/totalwin 圖 + fsIntro/OutroNumber spine → 雙語 Text 標題（FREE SPINS/免費遊戲、TOTAL WIN/總贏分）+ 金字 BitmapText 數字
- `FreeSpinCounter`：Frame_FSCounter.png → gbFsPanel
- `PressToContinue`：MM_pressanywhere 圖 → 呼吸文字；文案走 `src/game/i18nText.ts` **16 語字典**（ar/de/en/es/fr/id/ja/ko/pl/pt/ru/tr/vi/zh/fi/hi，與範本圖集語言完全對應；lang=br 由 state-shared 映射到 pt）。FREE SPINS／SPINS AWARDED／TOTAL WIN／FS 計數標題同源；⚠️ 這些字串**只能用 `<Text>` 畫**（gold BitmapText 無 CJK/阿拉伯/天城文 glyph，數字才安全），長語言（fi/ru/pl）有按字串長度自動縮字級
- `WinAnimation`：mm_bigwin spine → 程式化演出（旋轉金芒+等級金字 BIG/SUPER/MEGA/EPIC/MAX WIN，等級越高色越熱）
- `GlobalMultiplier` 卸載（GoBananas 數學無 updateGlobalMult；handler 留著但永不觸發）
- 刪除資源：fsIntro/bigwin/globalMultiplier spine、freeSpins/winSmall/reelsFrame/pressToContinueText sprites
- stories data 換上**真數學 books**（base：含可見 W 與 freeSpinTrigger；bonus：1/2/4 顆擴展百搭）

## 5.10 使用者回饋修正（2026-07-16 第二輪）

- **盤面防遮擋**：`SYMBOL_SIZE` 100→90 + `boardLayout` y 0.5→0.42（下緣讓開 UI bar）
- **背景**：吊掛香蕉移除；三張背景改**茂密叢林**（canopyBand 樹冠層帶 + leafyPalm 有葉棕櫚 + cornerFoliage 前景闊葉）
- **royals**：K 色相 +42° 轉冰藍（原冰晶青綠與翠玉 J 太近）；10(l5) 改由畫作部件拼裝（K 豎干→「1」、Q 去尾+清孔→「0」）再轉銀鑽白——五字五色：紅橙A/冰藍K/紫Q/翠綠J/銀白10
- **擴展百搭**：乘倍徽章加銅牌底盤（this is THE 倍率顯示）；`expandingWildsClear` 從 freeSpinEnd 移到下一次 spin（actor onNewGameStart），結算與回主遊戲期間不會露出底下個別 W
- **W 符號**：盤面不再印 NX 乘倍文字（主遊戲恆 1x 是雜訊；FG 倍率由徽章顯示）
- **過場**：香蕉縮放 → **猴子丟鳳梨手榴彈爆炸**（彈出→拋物旋轉→紅閃×2→衝擊波+白金閃光，soundBigWinBlast），進場與 FG 觸發共用
- 無頭 QA 註記：browser pane 若 `innerWidth=0`（面板隱藏）canvasSizes 全塌、只會渲染灰底——先確認 pane 有實際尺寸再截圖

## 5.11 數學改版（2026-07-17）

- **RTP 97% → 96.5%**：`game_config.py` `self.rtp`；`game_optimization.py` 各模式分段重新配平（base：wincap 0.01＋scatter/freegame 0.37＋basegame 0.585；bonus：wincap 0.01＋freegame 0.955；superspin：wincap 0.01＋basegame 0.955）
- **Max Win 5,000× → 10,000×**（base/bonus；superspin 維持 2,000×）：`self.wincap` 與 `mode_maxwins`。可達性：乘倍為線上中獎位加總，5 顆 50× 擴展百搭同線＝5,000×/線 ×15 線 × 多 spin
- 重跑 `run.py` 全流程，三模式 RTP 收斂 0.965、格式驗證全過；產出於 `math-sdk/games/GoBananas/library/`
- 前端同步：`config.ts`（rtp/max_win）、`betModeMeta.ts` 文案 10,000×、`stories/data/` books 換新數學抽樣

## 5.12 使用者回饋修正（2026-07-17 第三輪）

- **範本字體全滅**：新增 `GoldText.svelte`（canvas Text 金漸層+描邊+陰影，支援 maxWidth 縮放與全字集）取代 mm_gold 點陣字全部使用點（Intro/Outro/Win/StickyPrizes/Symbol/擴展徽章/轉數牌）；assets 刪 goldFont/goldBlur/silverFont/purpleFont/loader spine；`WildPartyLoader` 改 GO BANANAS 品牌（金香蕉徽章+雙語標題）
- **開場過場**：移除猴子——手榴彈自頂旋轉落下→紅閃×2→爆炸
- **superspin 診斷**：books/播放引擎本來就會跑 3 次 hold'n'spin（updateFreeSpin amount=已用次數）；壞的是計數牌把它顯示成遞增「1/3」誤導。轉數牌重寫：superspin 顯示**剩餘重轉大數字 3→2→1**（落幣回到 3）+ pips 燈；FG 顯示 current/total；標題模式感知（RESPINS/FREE SPINS，i18nText 加 `respins` 16 語）；portrait 也掛載（改置頂中）
- **擴展百搭精緻化**：不透明蓋板改**吃香蕉一開始就全輪蓋住**（jungle 綠配色，徹底遮住底下 W 疊列）；三口咬合噴香蕉碎屑、wx 鎖定金色衝擊波×3+火花、idle 呼吸金光邊框；徽章改 GoldText

## 5.13 全英文化 + 供應商標誌還原（2026-07-17）

- **WildPartyLoader（SILVERSTARS STUDIO 777）還原**——這是供應商標誌，必須保留（5.12 誤換成 GO BANANAS 版，已 revert）
- **玩家可見中文全移除**：標題「GO BANANAS 香蕉突擊隊」→「GO BANANAS」（Game/LoadingScreen）；INFO 全英文化
- **INFO 內容同步修正**（原本還是舊主題）：paytable 名稱對齊現行美術（Combat Helmet／Pineapple Grenade／Banana Ammo Crate／Golden Compass／Golden Bananas）；規則改「Sergeant Wild devours banana」機制、3/4/5 S → 8/12/15 FG、乘倍 2×–50× 線上加總、無 retrigger；新增 Super Spin 章節；載入頁副標 Max Win 10,000×
- `i18n/messagesMap/zh.ts` 與 `i18nText.ts` 的 zh 條目**保留**——那是 lang=zh 的正規語系，非硬編中文

## 6. 待辦

- [x] math 正式跑完（2026-07-16）：`math-sdk/games/GoBananas/library/` 三模式 RTP 0.97、驗證全過；books 含 `newExpandingWilds`/`updateExpandingWilds`/`newStickySymbols`。注意 `game_config.py` 的 game_id 原是範例殘留 `0_0_expwilds`，已改 `GoBananas`
- [x] 新 books 已抽樣換進 `src/stories/data/`（2026-07-16，取自 library/publish_files 真數學；superspin 示範事件仍為手寫）
- [x] h1/h2/s 改用 curated 精修版（2026-07-16；精修檔帶純白不透明底，生成器只摳「均勻白底」再裁切縮放，畫面本體不動）
- [x] h4 金羅盤棋盤格已修（2026-07-16：`checkerBg` 判定「低飽和+亮」+ stepGate 220 跨棋盤格硬邊 + 關閉 enclosed 清除保住錶面白光）
- [x] superspin 模式前端呈現（2026-07-03，見 §5.5）
- [x] 背景/轉輪框/音效叢林軍事化（2026-07-16，見 §2.5）
- [ ] Stake 上架素材（Thumbnail/Foreground）尚未做
