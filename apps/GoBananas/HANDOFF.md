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

## 5.14 演繹方式全面對齊 WildParty（2026-07-17 第四輪）

參考的是 WildParty 的**演繹手法**（非美術風格）：貼圖化加法混色粒子、rAF 單一 `t` 進度驅動、震屏＋定格閃白、FX 時鐘、分層景深。分四階段做，每階段結束自行掃 bug。

**Phase 1 — bet bar 主題化**：`components-ui-pixi` 原本硬編 WildParty 紫金/Cinzel，GoBananas 直接繼承。新增 `src/theme.svelte.ts`（`uiTheme` + `setUiTheme`，預設＝原值故 WildParty 不受影響），UiButton/UiLabel/ButtonBet/ButtonDrawer/ButtonBuyBonus/UiGameName/LabelBalance 全改讀 theme；GoBananas 於 `game/uiTheme.ts` 設叢林軍事色（橄欖底/黃銅邊/sans）。**兩個 app 都重建驗證。**

**Phase 2 — FX 貼圖管線**：`design/generate_fx_textures.mjs` 產 `fx_glow/fx_star/fx_streak/fx_leaf/fx_vignette`（純白，執行期 tint）。新增 `FxBurst`（中心閃光＋雙震波環＋12 火花，`flavour="jungle"` 混入葉片碎屑）與 `ImpactDust`（貼地扇形塵）。ReelDust/ScatterBurst/ExpandingWilds 的自製向量粒子**全面改成加法貼圖 sprite**。

**Phase 3 — 進場與景深**：`EntryReveal`（閃白＋爆發＋五輪由左至右揭幕波）取代原 EntranceFx 下落；`Background` 加 ken-burns 視差（1.08 overscan）＋22 顆飄浮 bokeh（superspin 換冷色）；`Game.svelte` 背景包 `BlurFilter` 景深＋ `fxVignette` 四角壓暗。⚠️ 此階段需為 GoBananas 補 `pixi.js` 直接依賴（型別 import 會被抹除所以先前沒事，`BlurFilter` 是執行期值）。

**Phase 4 — 中獎演繹**：`design/generate_win_banners.mjs` 產五張黃銅獎牌（BIG/SUPER/MEGA/EPIC/MAX WIN，1000×560，中央暗槽給金額）。`Win.svelte` 重寫：震屏 700ms、hit-stop 閃白＋scale punch、獎牌 FX 時鐘（入場過衝→呼吸光→每 2.3s 加法自疊眨眼→鉚釘星芒→epic/max 連發爆點）、tier 強度分級。新增 `BigWinFx`（12 道旋轉金芒＋漂移 bokeh＋週期爆點＋vignette）。舊 `WinAnimation`/`WinLevelSymbolIntro` 移除。

**掃描抓到的真 bug（已修）**：
1. **`StickyPrizes` 從未掛載**——superspin 黏性金幣覆蓋層不在 `Game.svelte` 裡，`stickyPrizesNew`/`stickyPrizesClear` 事件一直廣播給空氣。這是 superspin 演繹缺失的根因之一，已掛載
2. `GlobalMultiplier` 死碼——元件孤兒＋`key="globalMultiplier"` 資源已刪，連帶清掉 emitter 型別、`updateGlobalMult` handler、`stateGame.globalMultiplier`
3. 缺 `pixi.js` 依賴（見 Phase 3）

**常備掃描腳本**（HANDOFF 附錄，每次改完可跑）：檢查 ①所有 `key=` 都對應 assets.ts ②無孤兒元件 ③無未使用 assets ④**無「廣播但無人監聽」的事件**（第 4 項就是抓到 StickyPrizes 的那一條）。

## 5.15 演繹流暢度打磨（2026-07-17 第五輪）

- **擴展百搭改「跟著長大」**：原本蓋板第一幀就整輪全高彈出（最不自然的一點）。改成 `cover` tween，蓋板從落地格向上下擴張，階梯對齊 spine 的三次咬合放大（0.16→0.3→0.46→1），所以底下的 W 全程被蓋住、但視覺上是「長出來」而非「幕落下」
- **撞框衝擊**：`BoardFrame` 新增可複用的 `boardFrameImpact` 事件——框體衰減抖動（正弦×指數包絡 420ms）＋ 黃銅邊加法自疊閃白。擴展百搭 slam 時同步：`cover` 用 backOut 過衝進框、上下軌噴出橫向碎屑與塵、軌縫白熱條（fxStreak 加法）、框體吃一記衝擊
- **中獎線改 draw-on**：原本整條瞬間出現，改成沿賠付線由左至右畫出（前 60% 時間畫、後 40% 停留可讀），線頭帶一顆加法光點
- **聽牌壓暗改淡入**：原本瞬間變暗像閃爍，改 260ms cubicOut 進出
- **爆炸過場**：衝擊波經過時同步敲一記 `boardFrameImpact`（strength 1.4）
- **順手修掉隱患**：斷線續玩路徑仍在 `findLastBookEvent('updateGlobalMult')` 並重播，但該 handler 已於 §5.14 移除 → 真的取到會查不到 handler；已從 resume 路徑與 snapshot 保留清單移除（GoBananas 數學本就不產這事件）

## 5.16 bet bar 面板美術（2026-07-17 第六輪）

- `design/generate_ui_plates.mjs` 產兩張板：`ticker_plate.png`（652×146，比例對齊 UI 的 326:73）與 `buybonus_plate.png`（300²）。用的是與轉輪框／告示牌同一套語彙：橄欖帆布底＋顆粒＋黃銅框＋內凹讀數槽＋四角鉚釘；buyBonus 額外加暖色頂光讓它從 bar 裡浮起來當 CTA
- **共用 `UiSprite` 支援每遊戲掛貼圖**：`uiTheme.sprites` 可為 `base_ticker`/`buyBonus`/`bet`/`base_mobile_drawer` 指定 asset key，有掛就畫貼圖、沒掛維持原本主題化圓角矩形（WildParty 未設定 → 完全不受影響）
- **三個讀數的配色收進 theme**：`LabelWin`/`LabelBet` 原本硬編 WildParty 的綠與紫，改讀 `uiTheme.winAccent`/`betAccent`；GoBananas 設 win＝叢林綠、bet＝冷黃銅，balance＝暖金，三者可辨但同調
- ⚠️ 貼圖路徑會忽略 `backgroundColor`/`borderColor`，所以 buyBonus 的 disabled／active 狀態改用 `tint` 表達（灰化／提亮），否則按下與停用就看不出來

## 5.17 INFO / PayTable / Buy Bonus 全面核對（2026-07-17 第七輪）

拿 `game_config.py` 與實際 books 當真值逐條核對前端說明，**修掉三個錯誤**：

1. **「Scatter pays anywhere on the reels」→ 錯**。paytable 根本沒有 `S` 條目，10,000 局 books 裡 scatter 中獎 0 筆。改為「不單獨賠付，唯一作用是開啟功能」
2. **「3, 4 or 5 Scatters award 8, 12 or 15 Free Spins」→ 誤導**。`freespin_triggers` 雖宣告 `{3:8, 4:12, 5:15}`，但所有 freegame 分佈的 `scatter_triggers` 都是 `{4:1, 5:2}`，books 實測 totalFs 只有 12(346局)/15(664局)，**3 scatter 永不觸發**。改為「4 或 5 個 → 12 或 15」
3. **PayTable 的「3 Scatters (reels 3-5) trigger 5 Free Spins」→ 三處全錯**：S 在五輪都有（BR0 每輪 S 數 8/1/8/1/8）、不是 3 個、更沒有 5 次這個獎項

補充說明（原本沒寫清楚的）：Wild 只在免費遊戲擴展（主遊戲維持單格）、每線只取最高獎（`lines.py` 的 `wild_win > base_win`）、Wild 也以自身賠付。

核對通過的：賠付表 11 個符號全部與數學一致、15 條賠付線、RTP 0.965、三模式 cost/max_win（1×/200×/50×，10000/10000/2000）、乘倍 2×–50×（實際離散值 2,3,4,5,10,20,50）、乘倍同線相加、無 retrigger。

順手處理：兩個 modal 仍是 WildParty 粉紫配色（介面最後的範本殘留），換成黃銅／叢林綠；superspin 用詞統一為 respins；`max_win` 過期 fallback 5000→10000。

> ⚠️ **待決策**：數學宣告 3 scatter → 8 次免費遊戲，但分佈設定讓它永不發生。目前 INFO 照實際行為寫（4/5 才觸發）。若希望 3 scatter 也能觸發（較符合玩家預期），要改 `game_config.py` 各 freegame 分佈的 `scatter_triggers` 加入 `3`，並重跑數學。

## 5.18 中獎線改「手榴彈拉線」（2026-07-17 第八輪）

**演出**：每條中獎線一顆鳳梨手榴彈，從第 1 輪左側彈入 → 沿賠付線折線滾行到第 5 輪（滾動角度依行進距離，不會像在平移）→ 抵達後淡出、線定色留著閱讀。**刻意不爆炸**——爆點會蓋掉線本身，這裡的目的是讓玩家看清哪條線得分。

**同時多線＝齊射**：全部線同時起跑，每條差 28ms（turbo/FG 12ms），讀起來是一起發射但眼睛能分辨路徑；總時長不隨線數增加。books 實測一次最多 15 條同時中，故 `≥6 條` 時手榴彈縮 0.7 倍、軌跡變細。

**符號經過即亮**：`WinLines` 接管符號得分動畫，手榴彈跨過每一輪就點亮該輪的符號（原本是全部跑完才一次點亮）。兩個必要防護：
- **跨輪偵測放在 rAF 迴圈內並回補**（不是 `$effect`）：掉幀時手榴彈可能一幀跨兩輪，回補確保不會有某輪符號永遠不亮；`oncomplete` 再強制回報最後一輪
- **全域去重**：同一格可能同時位於多條線上，重複指派 `symbolState='win'` 不會再觸發 effect，遊戲會卡在等一個永不到來的完成回呼。以 volley 為單位用 Set 去重，結束再補掃一次漏網位置

**焦痕**：軌跡最底層多畫一道深色粗線——壓在擴展百搭的金色面板上時讀作燒焦痕跡，在深色盤面上幾乎看不見，一筆兩用。

檔案：新增 `GrenadeRunner.svelte`；`WinLines.svelte` 改為一次全部線；`bookEventHandlerMap.ts` 的 `winInfo` 移除原本的批次 `animateSymbols`（改由 WinLines 負責）。素材沿用 `gbH2`／`fxGlow`，無新美術。

## 5.19 動畫「機械感」稽核（2026-07-17 第九輪）

針對「看起來像機器排的」逐項稽核自己寫的動畫曲線，抓到並修掉四處：

1. **手榴彈等速直進**：`travelAt` 原本是純線性 `(ms - entry) / travel`，等於瞬間全速起步、瞬間停死。改成**梯形速度曲線**（加速 18% → 巡航 → 減速 26%，減速段刻意較長讓它「有重量地抵達」）。這也順帶修好一個接縫：入場是 easeOut 減速到靜止，接著若是線性就會有速度不連續的頓挫；梯形從零加速正好接上
2. **齊射時每顆手榴彈參數完全相同**：以 `lineIndex` 決定性播種，給每條線 ±8% 速度差與 ±35% 起跑抖動——同一條線每次表現一致（不會閃爍），但同場不會有兩顆同速同步
3. **多實例共用同一相位呼吸**（最明顯的一項）：`Math.sin(Date.now() / X)` 讓所有實例**完全同步**。修 3 處：得分符號（每顆隨機相位＋±10% 速率）、擴展百搭光暈（每輪依 reel 算相位與速率）、聽牌聚光（每輪相位偏移，多輪同時聽牌時是沿盤面流動而非整塊閃）
4. 順帶：擴展百搭光暈取樣 40ms→24ms（慢速輝光在 25fps 下看得出階梯）

稽核通過的：背景光點（相位/速度/擺幅皆隨機）、FxBurst 火花（均勻角度＋jitter）、ImpactDust（扇形＋隨機）、擴展百搭碎屑（全隨機）。轉輪停止間隔固定 145ms 屬拉霸機本來的機械節奏，**刻意不改**。

## 5.20 讀取卡死修復 + 出貨前守門（2026-07-22 第十輪）

使用者回報「這一版讀取不出來，只到供應商 logo 那邊就卡住」。主控台顯示三個問題，逐一查到底：

### 1. `Uncaught ReferenceError: backgroundBlur is not defined`（致命，就是卡住主因）

`Game.svelte` 樣板寫了 `<Container filters={backgroundBlur}>`，但**常數宣告從來沒被插入**——先前用腳本 `src.replace()` 打補丁時錨點字串沒對上，`replace` 靜默回傳原字串，補丁等於沒套用。`vite build` 不做型別檢查，所以 build 一路綠燈，錯誤只在執行期炸開，Pixi 場景整個掛掉，只剩 HTML loader 蓋在最上層 → 看起來就是「卡在供應商 logo」。

補回 `const backgroundBlur = [new BlurFilter({ strength: 4, quality: 3 })];`。

**教訓已固化成工具**：`design/check_undefined_refs.mjs`（見下）＋ 之後所有腳本補丁一律加「替換必須命中」的斷言（這次就靠斷言抓到 `LoadingScreen.svelte` 是 CRLF 行尾、原本的 `<script lang="ts">\n` 錨點對不上）。

### 2. 主控台 404 + `Web font load inactive` ← 範本字體

兩個來源，都是 Stake 範本殘留的 Adobe Typekit：

- `src/app.html` 的 `<link rel="stylesheet" href="https://use.typekit.net/aba0ebl.css">`
- `packages/pixi-svelte/src/lib/utils.svelte.ts` 的 `preloadFont()`，用 webfontloader 抓 `typekit: { id: 'aba0ebl' }`

該 kit 綁定範本自己的帳號網域，換到別的來源就 404，字體實際上**從來沒生效過**（一直在吃 Arial fallback）。

- 共用套件加 `setFontKit(id | null)`，**預設值維持 `'aba0ebl'` 所以 WildParty 完全不受影響**；GoBananas 在 `src/game/fonts.ts` 呼叫 `setFontKit(null)` 直接跳過請求
- 新增 `src/game/fonts.ts` 的 `GAME_FONT`＝`"Trebuchet MS", "Segoe UI", Tahoma, Arial, sans-serif`（純系統字體，零網路請求、無授權問題），全專案 13 處 `proxima-nova` 一次換掉
- ⚠️ `pixi-svelte` 是**以 dist 被消費**的，改完必須 `pnpm --filter pixi-svelte build`（svelte-package）才會生效

### 3. `I18nTest` 除錯覆蓋層會直接出貨（實際跑起來才抓到）

`Game.svelte` 無條件掛著範本的 `<I18nTest />`，在畫面 x=300 疊一塊半透明黑底，印 `TRANSLATIONS TEST` / `HOME (from game)` / `SETTINGS (from ui-pixi)` / `NOT TRANSLATED`。沒有任何 dev 判斷，正式版玩家看得到。元件與掛載點皆已刪除。

### 出貨前守門（兩支，已接進 `pnpm build`）

`vite build` 不做型別檢查，svelte-check 實測**抓不到**樣板未定義變數，`npm run lint` 的 ESLint 又是舊設定格式跑不起來——三者都攔不住 §5.20-1 那種 bug，所以自己寫：

- `design/check_undefined_refs.mjs`：拆 script/markup，收集所有宣告（含 import、解構、`{#each as}`、`{#snippet}`、`{@const}`、內聯箭頭函式參數），比對樣板 `{...}` 內的識別字。會剝除字串與註解、保留模板字串的 `${}` 內容、以括號配對掃描任意巢狀深度。全專案零誤判；故意拿掉 `backgroundBlur` 可穩定重現攔截
- `design/check_assets.mjs`：驗 `assets.ts` 全部 68 條路徑。注意 `new URL('../../assets/…', import.meta.url)` 是**執行期**相對 bundle URL 解析（落在 `static/`），不是建置期 import——所以打錯字只會變成靜默 404，不會 build 失敗

`package.json` 的 `build` 已改成 `node design/check_undefined_refs.mjs && vite build`。

### 實機驗證方式（不用 Storybook）

`vite preview` 沒有 RGS 後端會停在錯誤彈窗，所以做了一個一次性測試殼（在 scratchpad，不進 repo）：複製 `build/`，於 `index.html` 最前面注入攔截 `window.fetch` 的 stub，用 `src/stories/data/` 裡的**真實數學 books** 回應 `/wallet/authenticate`、`/wallet/play`、`/bet/event`、`/wallet/end-round`。

已驗證：**零 JS 錯誤**、載入畫面走到 `TAP TO CONTINUE`（＝68 個資產全部預載成功，讀取卡死確定解決）、點擊後主畫面正常掛載（BALANCE / WIN / BET / BUY BONUS / 標題全英文）、除錯覆蓋層已消失。

未驗證：**實際旋轉與中獎演繹**。自動化瀏覽器分頁是 `visibilityState: hidden`，`document.timeline.currentTime` 恆為 0、rAF 完全不觸發，Pixi ticker 與 Svelte transition 都停擺，再測下去只會測到測試環境本身而非遊戲。這部分仍須真機確認。

## 5.21 使用者回饋修正（2026-07-22 第十一輪，八項）

1. **PayTable 補上 15 條賠付線圖**：`ModalPayTable.svelte` 直接讀 `config.paylines`，每條渲染一張 5×5 迷你盤，命中格用金色漸層。資料已驗：15 條全部 5 格且 row 皆在 0–4，形狀為 5 直線 + 4 上折 + 4 下折 + 2 對角
2. **過場手榴彈不再旋轉**：移除 `grenadeRot`（連同已成死碼的 `rotation` prop），落下全程正面。爆炸放大：半徑改用 `max(width,height)*0.95`（原本只有 `height*0.7`）、震波環 2→3 圈、火球核心 0.16→0.34 並加一層橙色外核、破片 16→30 且更大、`BOOM_MS` 300→420 讓大爆炸有時間讀完
3. **盤面放大 + bet bar 縮小**：先試過只放大盤面，實測發現**做不到**——`BoardFrame` 的 `FRAME_SCALE = 1.28` 是實體外殼不是光暈，盤面實際佔位是playfield 的 1.29 倍，在原 bar 高度下 `SYMBOL_SIZE` 連 92 都塞不下（外框上緣會被切、下緣壓到數值列）。所以照原要求縮 bar：共用主題新增 `betBarScale`（**預設 1，WildParty 不受影響**），在 Desktop/Landscape/Tablet 三個 layout 以「底邊對齊」方式縮放（`y` 加上 `BASE_SIZE * (1 - scale)` 補償，bar 只往上收、底邊不動）。GoBananas 設 0.84，`SYMBOL_SIZE` 90 → 96。
   實測（canvas 1280×720）：外框 y 1→554 完整在畫面內、數值列自 566 起、中間留 12px；playfield 401 → 428px（面積 +14%）
4. **擴展百搭流暢化**：原本 `cover` 只在三次咬食各跳一次固定值（0.16/0.3/0.46）再跳到 1，四段之間完全靜止——這正是「只是圖片在移動」的來源。改成每次咬食 `backOut` 衝一段後**繼續朝下一次咬食緩慢爬升**（`CREEP_AHEAD`），全程沒有靜止幀；另加 `squeeze`（咬食時橫向壓縮 0.94、爆發前預備收到 0.86、衝出時拉長到 1.1 再回彈）與 `streak`（爆發瞬間三道加法混色垂直速度線）。盤面撞擊與碎屑維持原有
5. **Buy Bonus 改叢林風**：發現 `ui/Modals.svelte` 整份還是 WildParty 的紫/洋紅（檔頭註解就寫著 "Wild Party — Premium Modal Styling"），**所有彈窗都吃這套**。全部改成深橄欖底 + 黃銅邊 + 香蕉金，對齊 `BoardFrame` 與 `game/uiTheme.ts`。Buy Bonus 卡片的實際 class 是 `.bonus-card-wrap`（不是 `.bonus-card`，已查原始碼確認），並補上 `.title`/`.price`/`.description` 的配色
6. **聽牌**：
   - **觸發改成 3 個 scatter 之後**。數學給的 `anticipation[reel] = (該輪之前已落的 scatter 數) - 1`，也就是**第 2 個** scatter 就開始聽牌；但 FG 要 4 個才觸發，聽太早等於每局都聽、失去意義。在 `bookEventHandlerMap.ts` 傳進 `spin()` 前過濾（`>= 2` 才保留），這樣**慢停與視覺由同一條件 gate**，且不動共用套件
   - **改成框住整輪 5 格**：原本用 `key="anticipation"` 那支 spine，它是**採礦題材的範本素材**（`MiningMayhem_by_KICK`，slot 裡是 rocks/dust/sparks），美術偏移在左上角 → 就是那塊亮色區塊；而且只有 1.6 格高，根本框不住整輪。整支改自繪：滿高外框（三層描邊）+ 五格分隔刻度 + 上下收斂箭頭 + 貼齊上下軌的加法光暈。`anticipation` 資產仍保留給 `SymbolSpine` 的 `payframe` 使用
7. **Superspin 黏性金幣不再露出底下轉動的符號**：`StickyPrizes` 的格子底板是 0.96 半透明**圓角**矩形，四角沒蓋到、整體又會透——所以後方轉輪的金幣看起來像從底下滑過去。改成先鋪一層完全不透明的**滿格直角**底，再疊圓角裝飾板
8. **符號 10 中獎不再變色**：`design/generate_spines.mjs` 的 `genericWin()` 尾端掛了 `flashSlot()`，peak 是琥珀色 `ffe9a8`。spine 的 slot color 是**相乘**，所以所謂「閃光」實際是在扣減色版——套在冷色調的 royals（K 冰藍、10 銀鑽）上就是明顯變色。移除 `genericWin` 的 slot 染色（影響 l1–l5 與 x），改由縮放/旋轉/位移加 payframe 表現；h1–h4/p/w/s 本來就是暖色系，保留各自的客製閃光。已重跑 `generate_spines.mjs` 並驗證 `l5.json` 的 win 只剩 `bones`、`h1.json` 仍有 `slots`

## 5.22 擴展百搭中獎時的「上下層」問題（2026-07-22 第十二輪）

使用者回報：擴展完成後連線時看得出上下兩層，底下還有圖案跑出來，而且連線感覺是從底下的符號而不是上層的擴展百搭發出的。

成因有兩個，都會讓底層曝光：

1. **底下的個別 W 仍在播中獎動畫**。`WinLines.animatePositions` 把中獎位置**全部**送去 `boardWithAnimateSymbols`，包含被擴展百搭接管的那一輪。那些 W 是 spine 符號，win 動畫會放大到 1.45 倍 —— 蓋板只有 `SYMBOL_SIZE` 寬，1.45 倍的符號**兩側各突出約 22%**，所以會從蓋板後面長出來。這同時解釋了「連線像是從底下的圖案發出」。
   修法：`animatePositions` 過濾掉 `stateGame.stickyWildReels` 內的輪。該欄位本來就有在維護（原本只用於消音）。
2. **蓋板本身會透光**。跟 §5.21-7 的黏性金幣同一類問題：`0x0a1508` 只有 0.97 不透明度且是**圓角**矩形，四角沒蓋到。改成 `cover > 0.99`（完全接管後）先鋪一層滿格直角的全不透明底，再疊圓角板。

底層不再動之後，那一輪需要自己表現中獎，否則會變成完全沒反應：新增 `winFlash` Tween，中獎時面板打兩次光（熱白內緣 + 金色外緣 + 加法光暈），並刻意插在 wx spine **之後**、倍率徽章之前，讓光洗過猴子美術但不蓋住倍率數字。

註：`bookEventHandlerMap` 另外兩處 `animateSymbols` 是 **scatter** 觸發用的（FG 觸發／再觸發），擴展輪上不會有 scatter，不受影響，維持原狀。

## 5.23 Superspin 零金幣回合收尾（2026-07-22 第十三輪）

回報：superspin 若前三轉都沒轉出金幣就會卡住沒結算，之後按 bet，左方的重轉牌子還留在畫面上。

**根因**：整個 superspin 的收尾只寫在 `prizeWinInfo` 這一個 handler 裡，而數學**只有在真的贏到東西時才會發這個事件**。對照兩種 book 的尾巴：

- 有金幣：`… prizeWinInfo → setWin → setTotalWin → finalWin`
- 無金幣：`… setTotalWin → finalWin`（**沒有** `prizeWinInfo`，也沒有 `setWin`）

實測 `books_superspin.jsonl.zst` 10000 筆中有 **1000 筆（10%）** 三轉全空。這些回合因此從未收牌子，且完全沒有任何結算演出。

**修法**：`finalWin` 是所有模式每個 book 都保證會跑到的最後一個事件，把收尾補在那裡（冪等；free game 的 `freeSpinEnd` 早一步已收，不衝突）：

1. 若 `stateUi.freeSpinCounterShow` 還是 true 就收掉牌子
2. `gameType` 重設回 `basegame` — 這是同根因的另一個洩漏：`gameType` 只在 `freeSpinEnd`（第 245 行）被重設，而 superspin 的 book **從來不含該事件**，所以跑完 superspin 後會一直卡在 `'superspin'`，下一次一般轉的 `preSpin` 會拿到 superspin 的 padding 輪帶。（曾誤判為 `undefined` 會導致當機——實際 `config.paddingReels` 三個 key 都存在，只是輪帶不對，屬視覺不一致而非當機。）

**未能確認的部分**：程式碼上找不到硬性當機的路徑 —— `playBet` 會 `await playBookEvents()` 後必定廣播 `stopButtonEnable`，而無金幣路徑的四個事件（`updateFreeSpin`/`reveal`/`setTotalWin`/`finalWin`）都沒有會拋錯或永不 resolve 的地方；`freeSpinCounterShow` 也只用於 portrait/tablet 版面渲染，不參與下注按鈕的啟用判斷。因此目前的理解是：**回合實際上有結束，但因為零贏分沒有任何結算演出、加上重轉牌子凍在畫面上（並延續到後續回合），看起來就像卡住**。若實際上 spin 按鈕真的按不下去，那是另一個尚未定位的問題。

## 5.24 零分牌子 / FG 文案 / 倍率標示 / 擴展改真動畫（2026-07-22 第十四輪）

1. **Superspin 零分也要有結算牌子**
   接續 §5.23：零分回合確實沒有任何演出。在 `finalWin` 補上 —— superspin 且 `amount === 0` 時，用 free-spin outro 那塊「TOTAL WIN」銅牌顯示 0，並自行 hold 1.4 秒（`winLevelMap[1]` 的 `presentDuration` 是 0，不 hold 會一閃而過）。
   判斷條件已對資料驗證：`books_superspin.jsonl.zst` 10000 筆中，「payout 0」與「沒有 prizeWinInfo 事件」**是完全相同的那 1000 筆**，兩個邊界桶都是 0，所以 `amount === 0` 是安全的判斷。

2. **FG 牌子文案冗贅**
   原本是「FREE SPINS / 12 / **SPINS** AWARDED」，`SPINS` 出現兩次。`spinsAwarded` 16 個語系全部改為單純的「已獲得」語意（en 由 `SPINS AWARDED` → `AWARDED`），面板變成「FREE SPINS / 12 / AWARDED」。

3. **擴展百搭倍率要醒目**
   倍率徽章其實一直都在，但它是個小圓形、位置剛好壓在 wx 面板底部那塊繁雜的手部美術上，實務上看不見。改成**整輪寬的實心銅牌**貼齊底軌（即使用者說的「D 下面」），加不透明底色（壓得住背後任何美術）、外圈呼吸光暈、字級 0.34→0.4。

4. **擴展轉場改成真動畫**（前兩輪都沒解到的核心）
   追進 spine 才找到根因：`grow` 全長 1.52 秒，但**美術只在最後一刻換一次** —— `w_fg` 從 t=0.3 一路撐到 t=1.52，然後**硬切**成完全不同的 `wx` 全輪面板。所以玩家看到的就是「一張圖被放大 1.2 秒，然後跳接成另一張圖」。前兩輪我調的都是外框蓋板（`cover`/`squeeze`/`streak`），動不到這個核心。
   - `generate_spines.mjs`：**移除 `grow` 尾端的 `wx` 硬切**，grow 結束在 `w_fg`
   - `ExpandingWilds`：新增 `unroll` Tween，爆發瞬間用 `Graphics isMask`（pixi-svelte 支援）遮住同一張面板圖，讓 banner **從猴子所在那一格往上下捲開**填滿整輪（340ms），兩道前緣還帶加法混色的熱縫；捲完後交給 spine 的 `idle` 顯示成品，這份複本停止繪製
   - 面板圖以 `gbWxPanel` 掛成一般精靈，指向**同一個** `spines/goBananasSymbolsV2/wx.png`，不增加下載量
   - `expandingWildsRestore`（斷線重連）的 `unroll` 初始值為 1，直接呈現已展開狀態

   註：順帶查清先前 HANDOFF 記為「未識別」的那個 404 —— 是瀏覽器自動探測 `/favicon.ico`（app.html 指的是 `favicon.svg`），無害。

## 5.25 擴展百搭：猴子把捲軸「撐開」（2026-07-22 第十五輪）

§5.24 把硬切改成遮罩捲開之後，動作是連續了，但捲軸是自己開的、猴子只是剛好在旁邊長大 —— 缺的是**因果**。這一輪讓「猴子出力」變成捲軸打開的原因，三件事：

1. **圖層對調**：banner 原本畫在 spine **上面**，所以視覺上是布幕蓋過猴子（像窗簾拉上），而不是他撐開。改成畫在猴子**下面**，猴子全程在最上層可見地使勁

2. **邊緣改成弧形**：遮罩由 `drawRect` 改成 `quadraticCurveTo` 的弧邊，上下開口各往外弓起。平直的邊只會讀成「wipe 轉場」；被推出的弧形才讀成「有個圓的東西正把它頂開」

3. **節奏改成「抗力 → 鬆脫」**：原本是單段 340ms cubicOut（一路順順開完）。改成兩段——前 120ms 幾乎不動（480px 只開 67px）但邊緣外凸到 25px、猴子脹到 1.155；接著 180ms 才鬆脫全開。總長 300ms，**剛好落在 spine grow 結束的 1800ms**，交棒無縫

關鍵在於猴子的膨脹與捲軸的外凸**共用同一條曲線**（`bowAt`），兩者是同一個動作而不是各自為政。

曲線指數是**對著實際時間軸算出來的**，不是憑感覺：`u^0.6 * (1-u)^1.5` 讓撐力在 120ms 抗力階段穩定累積（峰值的 0.59 → 0.86），在鬆脫那一刻達到最大後崩落。試過的其他值：`u^0.35` 一幀內就衝到 83%（會彈出來）；`u^0.9` 峰值落在 160ms，也就是捲軸都飛開了他還在使勁 —— **因果反了**。

## 5.26 低分符號統一配色 + 全機制稽核（2026-07-22 第十六輪）

### 低分符號 A/K/Q/J/10 統一成一色

原本五個 royals 各有一色（岩漿紅 A、冰藍 K、紫晶 Q、翠玉 J、銀鑽 10），低分層跟高分層一樣吵。統一成**風化槍鐵藍灰**：

- 高分符號全是暖色（黃銅羅盤、橄欖頭盔、橘紅手榴彈、香蕉箱，加金色 W/S/P），所以 royals 走冷色低飽和，對比最大又不搶戲
- `silverize()` 一般化為 `unifyRoyal()`，走**亮度**重上色，厚塗的刻面／斜角／高光全部保留，只換色相
- 曲線刻意壓在中間調而非壓暗（陰影 59、中間調 138、高光衝到 255），在深橄欖盤面上不會糊掉
- `hueRotate` 不再用於 royals

量測結果：五個 royals 平均 RGB 幾乎相同（~115,123,138）、飽和度全部 0.17；高分符號飽和度 0.64–0.65（**近 4 倍**）且明顯偏暖。亮度範圍 40–235。

順帶一提，賠付表本來就顯示 **L2=L3（0.3/0.7/3）、L4=L5（0.2/0.5/2）賠率完全相同** —— 用五種顏色暗示五種價值本來就是誤導，統一成一色反而更誠實；字母之間仍靠**形狀**辨識，那才是玩家實際在讀的。

### 全機制稽核（對照 30000 個 book 與查找表）

**全部正確：**

| 項目 | 驗證結果 |
|------|---------|
| RTP | 三個模式**精準 0.965**（base 0.965；bonus 193.0÷200；superspin 48.25÷50） |
| Max win | base/bonus 10000×、superspin 2000×，與 `config` 及 INFO 一致 |
| 成本 | 1× / 200× / 50×，前端 `config.betModes` 與數學一致 |
| 事件覆蓋 | 數學發出的 13 種事件**全部有 handler**，無遺漏 |
| 觸發 | 4 scatter → 12 轉、5 scatter → 15 轉；**無 3 scatter 觸發** |
| 再觸發 | 0 次 —— 規則文案「There are no retriggers」**正確** |
| Scatter 分布 | 五輪都會出現 —— 文案「appears on all five reels」**正確** |
| 倍率算法 | 多百搭同線是**相加**（[3,2] → `meta.multiplier=5` 而非 6）—— 文案 "added together" **正確** |
| 基礎遊戲百搭 | base 盤面 W 的 multiplier 一律為 1；所有擴展事件的 `gameType` 皆為 `freegame` —— 文案**正確** |
| 金幣獎值 | 1×–10000×，`prizeWinInfo.totalWin` 等於所有金幣加總（8990/9000 完全吻合） |

**找到並修掉一個：superspin 封頂沒有任何演出**

superspin 沒有標準的回合結束事件（base/bonus 收在 `freeSpinEnd`，superspin 收在剛好存在的 `prizeWinInfo`/`setWin`）。所以數學**不發 `setWin`** 的 superspin 結果，跑到最後什麼都沒演。這種結果有兩種：

- 1000 個 book 賠 0（§5.23 已處理）
- **10 個 book 打到 2000× 上限** —— 有 `prizeWinInfo`、有 `wincap`，但**沒有 `setWin`**，所以該模式最好的結果反而演出最弱（只有金幣脈衝加一個音效）

對照組：base/bonus 的封頂 book 是 `freeSpinEnd` 帶 winLevel **10 = 'max'**，MAX WIN 大獎牌正常演出。

修法：`finalWin` 改成用 `winPresented` 旗標（`setWin` 時設定）而非判斷金額，一個分支同時涵蓋兩種；封頂走 `winLevelMap[10]` 的完整 MAX 演出，零分走 TOTAL WIN 銅牌。判旗標比判金額穩健，數學的事件組合日後改變也不會失效。

另註：那 10 個封頂 book 板上金幣加總超過 10000×，實際只賠 2000×（封頂本來就這樣，數學正確），現在至少會有 MAX WIN 演出說明這是滿獎。

**待決：** `freeSpinRetrigger` handler 是死碼 —— 三個模式 30000 個 book 從未發出，規則文案也明說沒有再觸發。**未移除**（日後數學若加入再觸發即可直接用），但目前不可達。

## 5.27 供應商 logo 對齊 WildParty + 擴展百搭改「感染→合體」（2026-07-22 第十七輪）

### 先修一個 §5.24 造成的回歸

使用者截圖顯示擴展輪變成**空白暗欄只剩一隻小猴子**。成因是 §5.24 的交接：我把 spine `grow` 尾端的 `wx` 換圖拿掉，改由元件用遮罩捲開，但捲軸複本在 `unroll` 到 1 就停止繪製，而 spine 要 `phase` 翻到 `idle` 才顯示成品。兩者之間只要有時序落差，就會出現**沒有任何東西在畫**的空窗，底下又壓著不透明蓋板 —— 就是那個空白暗欄。這次改版把整個交接拿掉（見下）。

### 供應商 logo

`WildPartyLoader.svelte` 兩個專案 diff 後**只差字體宣告**（星星、777、SILVERSTARS STUDIO 皆已相同）。WildParty 寫的是：

```css
font-family: 'Cinzel, Georgia, serif', Arial, sans-serif;
```

整串 `Cinzel, Georgia, serif` 被引號包成**一個**字體名，匹配不到任何字體；而且 Cinzel **整個 workspace 都沒有載入**（WildParty 只拉 Typekit 的 proxima-nova kit）。所以它實際渲染成 **Arial**。GoBananas 這邊改成 `Arial, Helvetica, sans-serif` —— 語法正確、渲染結果與 WildParty 一致，並在檔案裡註明原因，避免日後有人「順手」把它改成遊戲字體。

### 擴展百搭改成「感染 → 合體」

依使用者指定的演法重寫，三個節拍：

1. **INFECT（840ms）** 百搭落地後，同輪其他圖案**逐格轉變成百搭** —— 依與落點的距離由近而遠擴散，每格一次閃光 + backOut 彈入 + 火花。不透明蓋板**只覆蓋已轉變的格子**，所以原符號是被「取代」而不是被「蓋住」
2. **MERGE（460ms）** 五個百搭被往輪中心拉（`cubicIn` 加速，是被吸進去不是飄過去），邊縮小邊淡出，兩道加法混色光條向中心收束
3. **LOCK（260ms）** 撞擊：爆裂 + 外框震動 + 音效，整輪 WILD 橫幅被撞開，倍率銅牌彈出

**整段由元件單一擁有，沒有任何交接**，所以不可能再出現前述的空窗。已用數值模擬驗證：落點在 row 1/3/5 三種情況下，結束時五格進度都是 1.00（不會有格子沒轉完）；總時長 1548ms，撞擊在 1289ms。

`gbSpWx` spine 因此不再有任何使用者（**尚未移除** assets.ts 的條目，仍會被預載）—— 要清掉可省下 `w_fg.png`(151KB) + `cudgel.png`(44KB) + atlas 的下載；`wx.png` 本身仍由 `gbWxPanel` 使用，不能刪。

## 5.28 Superspin 一律以 TOTAL WIN 牌收尾（2026-07-22 第十八輪）

先前只有「零分」與「封頂」兩種例外情況會補演出，一般中獎則是走 `setWin` 的獎級面板。使用者要求**不管得分多少，結束時都要有一塊總得分牌子，跟 FG 一樣**。

`finalWin` 改成：superspin 一律走與 `freeSpinEnd` **完全相同**的收尾序列 —— 收重轉牌 → `uiHide` → `freeSpinOutroShow` → 音效 → `freeSpinOutroCountUp` → `freeSpinOutroHide` → `uiShow`。

兩個實作重點：

1. **牌子的獎級沿用數學自己的分級**。旗標由布林 `winPresented` 改成 `lastWinLevel: WinLevel | null`（`setWin` 時記錄），牌子直接用它，不必在前端另外發明一套門檻。封頂回合沒有 `setWin`，會先補一段 `winLevelMap[10]` 的 MAX 大獎演出再進牌子（並把 level 記為 10）；零分則落到 `winLevelMap[1]`。

2. **不需要任何人工 hold**。`freeSpinOutroCountUp` 是等玩家 `PressToContinue` 才 resolve，**不是**等跑分結束 —— 所以即使是 `presentDuration = 0` 的零分牌也會停在畫面上直到玩家按下去。§5.24 為零分加的那段 `waitForTimeout(1.4s)` 其實是在玩家按完之後又多等 1.4 秒，屬於誤加，已移除。

三種結局的最終流程：

| 結局 | 流程 |
|------|------|
| 零分（1000 本） | 收重轉牌 → TOTAL WIN 0× (level 1) → 等玩家按 |
| 一般中獎（8990 本） | `setWin` 獎級面板 → 收重轉牌 → TOTAL WIN N× (該局 level) → 等玩家按 |
| 封頂 2000×（10 本） | MAX 大獎演出 → 收重轉牌 → TOTAL WIN 2000× (level 10) → 等玩家按 |

## 5.29 Superspin 收尾回主盤面 + UI 改側邊欄、盤面放大（2026-07-22 第十九輪）

### 1. Superspin 結束後回到主遊戲盤面

總得分牌被點掉之後，畫面仍停在 hold-and-spin 的盤面：黏住的金幣還蓋著，轉輪上還是 P（金幣）和 X（空箱）—— 這兩個符號**只有 superspin 才有**，留著就像回合沒結束。

`finalWin` 的 superspin 分支在收牌後補上：清黏性金幣 → `gameType` 轉回 `basegame` → `settle()` 換上一副 base 盤面 → `transition` 手榴彈過場蓋掉切換 → `uiShow`。與 `freeSpinEnd` 同樣的做法。

新的 `baseIdleBoard()` 從 `config.paddingReels.basegame` 的 80 格輪帶隨機取窗，形狀與數學的 reveal board 相同（5 可見列 + 上下各一 padding），所以每次結束看到的盤面都不一樣，不是固定畫面。

### 2. UI 改側邊欄 + 盤面放大

共用套件新增 `LayoutSideRail.svelte`，由主題的 `betBarLayout` 選用（**預設 `'bottom'`，WildParty 完全不受影響**；已重新 build WildParty 確認）。直向版面永遠用底部橫欄 —— 1080×1920 沒有橫向空間放側欄。

- **左欄**：選單（上方）、Buy Bonus（**垂直置中、scale 2.4，即原本 0.8 的 3 倍**）
- **右欄**：balance / win / bet 三個讀數，下方 spin pod（−、BET、+，再下面 autospin、turbo）
- 選單展開時往下長，留在左欄內
- 位置全部按 `mainLayoutStandard()` 的比例計算，所以 desktop / landscape / tablet 三種標準框共用同一個元件

盤面：`SYMBOL_SIZE` 96 → **118**，`boardLayout.y` 由 0.385 改 **0.5**（沒有底部橫欄要閃避了，直接置中）。

**實測驗證（1280×720）**：

| 項目 | 結果 |
|------|------|
| 外框 | x 300–980、y 20–700，正中央，**佔畫面高 94%** |
| UI 與外框重疊 | **無**（程式化交集檢查，逐一比對所有 UI 矩形） |
| 超出畫面 | **無** |
| 左側間隙 | Buy Bonus 右緣 253 → 外框 300，47px |
| 右側間隙 | 外框 980 → 右欄最左元件 1057，77px |
| Buy Bonus | 240×240，中心 y=360 正好垂直置中 |

playfield 由 428 → **526px**（+23% 線性、**+51% 面積**）。

## 5.30 側欄選單改由下往上彈、圓框不再相交（2026-07-22 第二十輪）

§5.29 的側欄選單有兩個問題：由上往下展開，且圓形選項的金色外框互相切到。

**相交的原因**：選單「選項」按鈕是 `UI_BASE_SIZE * 1.3 = 195`，不是我以為的 150。scale 0.8 後直徑 **156**，而我給的間距只有 132 —— 剛好重疊 24，與截圖吻合。（關閉鈕與選單鈕才是 150。）

修正：

- 選單鈕由 `box.height * 0.11` 移到 **`0.88`**（左欄底部）
- 選項改為 `y = -slot * MENU_STEP` 往上堆
- `MENU_STEP` 176 = 直徑 156 + 刻意留的 20 空氣

**幾何驗證**（實測選單鈕中心 y=634，反推標準框 1080 → 畫布 720 的縮放 0.6667）：

| 項目 | 實際像素 |
|------|---------|
| 選項圓直徑 | 104 |
| 相鄰圓心間距 | 117.3 |
| **圓框之間空隙** | **13.3 ✓ 不相交** |
| 關閉鈕 ↔ 第一個選項 | 22.8 ✓ |
| 垂直範圍 | 113 – 677（畫布 720，都在畫面內 ✓） |
| 選項圓水平範圍 | x 81–185，盤面外框左緣 300 → 間隙 115 ✓ |

註：間距是由**實測縮放比例**推算的，不是直接觀察展開後的選單 —— 測試環境無法觸發 pixi 的按鈕事件把選單打開。

## 5.31 FG 告示牌繩子 / 計數牌位置 / 倍率徽章（2026-07-22 第二十一輪）

### 1. FG 告示牌頂端的「兩根繩子」

`fs_sign` 有兩條 rope hanger：`(190,96)->(250,12)` 與 `(730,96)->(670,12)`。下端停在距牌面（y=130）還有 34px 的地方、上端接到空氣 —— **兩端都沒接到任何東西**，看起來就是兩截散落的繩子。**已移除**；銅角、鉚釘、外框本來就撐得住這塊牌子。

同時移除香蕉徽章：它在 `(460,205)`，而前端把標題畫在 ~y=260 —— 三片重疊的香蕉造型正好從「FREE」和「SPINS」中間探出來，變成兩截不相連的金色碎片（很可能使用者說的就是這個）。

驗證：原繩子區（y<110）不透明像素 **0**；原徽章位置中央帶只剩 (460,180) 那顆**鉚釘**（設計元素，本來就有）。

### 2. FG 計數牌與 Buy Bonus 重疊

計數牌原本錨在盤面上緣（`boardLayout().y - height*0.5 + SYMBOL_SIZE*0.2`）。改成側欄 UI 後 Buy Bonus 置中於左欄，加上盤面已佔畫面高 94%，兩者就撞在一起。改為錨在畫面上緣：`mainLayout().height * 0.05`。

驗證（遊戲空間 1422×800）：計數牌 y 40–227、Buy Bonus y 267–533，**間隙 40px**。

### 3. 擴展百搭倍率遮到金框

兩層原因，兩邊都修：

- **牌子本身**：原本是整輪寬、`0x0d1806` 不透明底、高 `SYMBOL_SIZE*0.52`，壓在外框上。改成**無填色的小圓環**（黃銅描邊 + 柔光暈），半徑 `SYMBOL_SIZE*0.26`，字級 0.4→0.27，並往上移到 `height - SYMBOL_SIZE*0.44`
- **底圖**：`wx.png` 的 WILD 字母原本字級 150、`y = 700 + i*150`，最後一個 D 基線落在 1150，下方只剩 130px —— 而倍率牌高度正好 0.52×256=133，必然重疊。字級改 130、`y = 640 + i*140`，D 基線移到 1080

驗證：重新產生的 `wx.png` 在 y≥1080 之後**完全沒有字母筆畫**，替倍率環清出 200px。

## 5.32 移除 FG 預告的香蕉飛越動畫（2026-07-22 第二十二輪）

`PreFreeGameHint.svelte`：金香蕉串（scatter spine `gbSpS`）從 `board.x + width*0.78` 飛到 `board.x - width*0.78` —— 即畫面右到左橫越盤面，由 `actor.ts` 的 `onPlayGame` 在**即將觸發免費遊戲的那一轉之前**以 40% 機率播放。**已整組移除**。

順帶一提，這個提示只在該轉「確定會觸發」時才出現，等於在轉輪停下前就先洩漏了結果 —— 移掉它同時消除了這個提前告知。

清理範圍（**無任何殘留**，已 grep 確認）：

- `src/components/PreFreeGameHint.svelte` 檔案刪除
- `Game.svelte` 的 import 與掛載
- `actor.ts` 的 `onPlayGame` 觸發區塊，以及隨之失效的 `PRE_FREEGAME_HINT_CHANCE` import
- `constants.ts` 的 `PRE_FREEGAME_HINT_CHANCE`
- `typesEmitterEvent.ts` 的 `EmitterEventPreFreeGameHint` import 與聯集成員

`onPlayGame` 簡化為只剩 `await playBet(bet)`。

## 5.33 Buy Bonus 放大 + Superspin 改逐格自轉（2026-07-22 第二十三輪）

### 1. Buy Bonus 卡片 +60%

卡片的 `.title` / `.description` / `.price` **本身都沒有 font-size**（繼承而來），所以只要在 `.bonus-card-wrap` 上設一次字級，三者就會等比放大、原本的比例完全保留。尺寸與間距同步 ×1.6；按鈕高度走 CSS 變數（`--height-value`）、標籤帶 inline font-size，兩個都要另外指名覆寫。

### 2. Superspin 改為逐格自轉

**可行，而且正好解掉紅底**。共用的轉輪機制是整欄垂直捲動 —— 對 hold-and-spin 來說是錯的：被押住的金幣必須完全靜止，但整欄捲動會把整條輪帶從它後面拖過去。那塊紅色底板存在的唯一理由，就是遮住這個掃過的畫面。

新做法（`SuperspinCells.svelte`）：

- `bookEventHandlerMap.reveal` 遇到 `gameType === 'superspin'` 時**完全跳過轉輪捲動**，直接 `settle()` 上最終盤面
- 覆蓋層只針對**未押住**的格子，每格各自在原地循環 X / P 兩種符號（superspin 輪帶實際只有這兩種，X 383 : P 17）
- 每格有自己的相位，五格不會同步；每輪比左邊晚 90ms 停，盤面仍是由左至右定案
- 押住的格子**根本不產生覆蓋層**，所以後面沒有任何東西經過 —— **紅底因此移除**

### 3. 金幣數字置中

原本 `StickyPrizes` 是 `y + SYMBOL_SIZE * 0.08`、`Symbol.svelte` 是 `y + 8`，都刻意往下偏。已改為正中。

### 4. 10× 以上的金幣：落地震動 + 換色

- **門檻**：`BIG_FROM = 10 * 100`（book 單位 100 = 1× 總注）
- **震動**：以 `log10(prize / BIG_FROM)` 決定振幅 —— 獎值跨三個數量級，線性映射在 10× 會看不見、在 10000× 會誇張到荒謬。x/y 用不同週期抖動，二次式衰減，420ms

| 獎值 | 振幅（格子 118px） |
|------|------|
| 10× | 5.9px |
| 100× | 12.4px |
| 1000× | 18.9px |
| 10000× | 25.4px |

- **顏色**：`GoldText` 新增 `fill` / `stroke` 覆寫（預設維持原金色漸層，其他用途不受影響），大獎改成較燙的琥珀橘 `[fff0c0, ffa93a, d44a12]`，並加一圈加法混色橘光

**⚠️ 未能實機驗證**：逐格自轉需要真的跑一局 superspin 且動畫時鐘要在跑，測試環境兩者都做不到。build、兩支檢查腳本、載入與 console 皆正常，但**演出本身完全沒被目視過**，屬本輪最高風險項。已加卸載保險（`pendingResolve`），避免元件在轉動中卸載導致 book 播放永久等待。

## 6. 待辦

- [x] math 正式跑完（2026-07-16）：`math-sdk/games/GoBananas/library/` 三模式 RTP 0.97、驗證全過；books 含 `newExpandingWilds`/`updateExpandingWilds`/`newStickySymbols`。注意 `game_config.py` 的 game_id 原是範例殘留 `0_0_expwilds`，已改 `GoBananas`
- [x] 新 books 已抽樣換進 `src/stories/data/`（2026-07-16，取自 library/publish_files 真數學；superspin 示範事件仍為手寫）
- [x] h1/h2/s 改用 curated 精修版（2026-07-16；精修檔帶純白不透明底，生成器只摳「均勻白底」再裁切縮放，畫面本體不動）
- [x] h4 金羅盤棋盤格已修（2026-07-16：`checkerBg` 判定「低飽和+亮」+ stepGate 220 跨棋盤格硬邊 + 關閉 enclosed 清除保住錶面白光）
- [x] superspin 模式前端呈現（2026-07-03，見 §5.5）
- [x] 背景/轉輪框/音效叢林軍事化（2026-07-16，見 §2.5）
- [ ] Stake 上架素材（Thumbnail/Foreground）尚未做
- [ ] 真機確認旋轉／中獎／FG 演繹（測試殼因分頁 hidden、動畫時鐘凍結而無法驗，見 §5.20）
- [ ] Pixi v8 棄用 API：Graphics 仍在用 `beginFill`/`endFill`/`lineStyle`/`drawRect`/`drawRoundedRect`/`drawEllipse`/`drawPolygon`，主控台每幀噴 deprecation warning。目前可運作，但 v9 會移除
