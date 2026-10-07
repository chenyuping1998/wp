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

**⚠️ 未能實機驗證**：逐格自轉需要真的跑一局 superspin 且動畫時鐘要在跑，測試環境兩者都做不到。已加卸載保險（`pendingResolve`），避免元件在轉動中卸載導致 book 播放永久等待。**因為無法目視，此模式預設關閉** —— 見 §5.34。

## 5.34 紅底移除改用「盤面同色遮擋」，逐格自轉降為可切換（2026-07-22 第二十四輪）

使用者提出替代方案：不改轉輪效果，也要能去掉紅底且不讓轉輪金幣干擾黏住的金幣。**可行，而且風險低得多**。

那塊底板的功能是**遮擋**，問題出在**顏色**。把它畫成盤面自己的底色（`frame_bg.png` 中央取樣 `#1c270d` → `BOARD_CELL_COLOR = 0x1e290e`），它就不再是「一塊紅色方塊」，而是看起來像一個正常空格子，同時照樣完整擋住後面掃過的轉輪。保留一圈細的黃銅邊標示「這格被押住」。

新增 `SUPERSPIN_CELL_SPIN` 開關（**預設 `false`**）：

| 開關 | 轉輪掃過黏住格 | 遮擋層 | 紅底 |
|------|------|------|------|
| `false`（預設） | 會 | **有**（盤面同色） | 無 |
| `true` | 不會 | **無**（不需要） | 無 |

兩條路徑的遮擋責任互斥且完整 —— 有掃過就有遮擋、沒掃過就不畫，不會露出也不會多餘。

預設選 `false` 的理由：它沿用既有的轉輪機制（連同停輪彈跳、塵土等既有打磨），而且**可以確定不會壞**；逐格自轉是行為變動大得多的路徑，而我沒辦法目視它。等真機確認過再把開關打開即可，只有一個常數。

## 5.35 金幣數字配色補完 + 消除停輪時的金幣殘影（2026-07-22 第二十五輪）

### 1. 10× 以上的數字顏色（上一輪只做了一半）

金幣的金額有**兩處**繪製，上一輪只改了其中一處：

- `StickyPrizes.svelte` —— 金幣**黏住之後**的覆蓋層（已改）
- `Symbol.svelte` —— 金幣**落在轉輪上**時（**漏掉**）

所以高倍金幣落地時仍是原本的金色，要等它黏住才變色。門檻與配色已抽到 `constants.ts`（`BIG_PRIZE_FROM` / `isBigPrize` / `BIG_PRIZE_FILL` / `BIG_PRIZE_STROKE`），兩處共用同一份定義，金幣不會在黏住的瞬間改變顏色。順帶把 `Symbol.svelte` 的 `y + 8` 偏移也拿掉（上一輪只置中了 StickyPrizes 那份）。

### 2. 黏住金幣下方的殘影

成因是**同一枚金幣被畫了兩次**。數學會把已收集的金幣留在盤面上，所以轉輪自己也帶著一份，而 `StickyPrizes` 又畫了一份覆蓋層。平常轉輪那份被遮擋層蓋住，但停輪時：

`reelBounceSizeMulti = 0.3` —— 停輪回彈會把整條輪帶推過定位 **0.3 格**（`SYMBOL_SIZE` 118 時約 38px），把轉輪那份金幣推到只有一格高的遮擋層**下緣之外**，於是在黏住的金幣下方露出來。

修法：轉輪不再繪製重複的那一份。靜止時符號的 index 等於其 row，所以可直接判斷。兩個刻意的例外：

- **轉動中不隱藏** —— 該狀態下 index 是跟著捲動的符號跑的，隱藏會變成一個往下移動的破洞
- **`win` 狀態不隱藏** —— 它的 `oncomplete` 是中獎動畫的 resolve 來源，卸載掉會永遠等不到（這個專案先前吃過同類的虧）

## 5.36 送審意見改進 — 第一階段：按鈕圖示 + Buy Bonus 解析度（2026-07-22 第二十六輪）

送審被指出 **poor bet ui bar** 與 **low quality asset**。查了實際成因後列出完整清單（見對話），共同根源是整套 UI/美術為程式化 SVG→PNG 平面向量風，加上按鈕圖示直接用文字/emoji 字元。路線定為「程式化生成 + 加質感」，本階段先做投報率最高的兩項：

### A1. 按鈕圖示：文字/emoji → 手繪黃銅貼圖

`UiButton` 原本用 `iconSymbolMap` 的字元當圖示：`≡ ✕ ⚙ 🔊 🔇 ▤ i ▶ ⚡ − +`。emoji 尤其糟 —— 各平台長相不一、且忽略 canvas 上色，無法主題化，是審核紅旗。

- 新增 `design/generate_ui_icons.mjs`：9 個圖示（menu / menuExit / settings / info / payTable / soundOn / soundOff / autoSpin / turbo），黃銅金屬漸層 + 深色描邊 + 頂部高光 + 柔和投影，256px 透明底，對齊盤面外框語彙
- 共用套件 `theme.svelte.ts` 新增 `icons` 欄位（**預設空 → WildParty 不受影響**，仍走 glyph）
- `UiButton`：`uiTheme.icons[icon]` 存在時畫 `<Sprite>`，否則退回原本的字元
- `−`/`+` 刻意保留為字元（乾淨的排版符號，非 emoji）
- 已驗：9 個圖示 PNG 全部預載（伺服器日誌 9 筆、零 404）、舊 glyph 從畫面消失、零 console 錯誤、WildParty 重新 build 通過

### B1. Buy Bonus 底盤解析度

`buybonus_plate.png` 原生只有 **300×300**，但側欄用 scale 2.4 顯示到 ~360px+ → 糊。它是現在左欄最大最顯眼的 UI 元素。重出 **640×640**（`generate_ui_plates.mjs` 的 `BS` 300→640）。
（過程一度誤把 ticker 的 `TW` 也一起加大，導致版面被橫向拉扁 4.47→7.01，已還原 —— ticker 652 寬在側欄縮 0.62 顯示本就足夠。）

### 尚未做（清單其餘項，依序進行）

- A2 按鈕立體底盤、A3 主旋轉鈕、A4 讀數牌加厚
- B2 生成器加質感層（框/背景/牌）—— 對「low quality」最治本，惠及所有面板
- B3/B4 符號打磨

## 5.37 圖示微調：autoSpin/±放大、turbo 回復簍空（2026-07-22 第二十七輪）

延續 §5.36 的按鈕圖示，三項調整（皆在共用 `UiButton`，用 per-icon 對照表，WildParty 不受影響）：

1. **autoSpin 圖示放大** — sprite 尺寸原本全部固定 `width * 0.62`，新增 `iconSpriteScaleMap`，autoSpin 設 0.82（播放三角形需要更多存在感），其餘維持 0.62
2. **`−`/`+` 放大** — 這兩個是排版字元不是 emoji（刻意保留），`iconFontSizeMultiplierMap` 由預設 1.1 提到 **1.7**
3. **turbo 回復簍空** — §5.36 把 `gbIconTurbo` 加進主題後，sprite 分支蓋掉了原本的向量分支，變成靜態填滿的圖示。從主題 `icons` 移除 turbo → 回到 `UiButton` 的向量分支：**關閉時只描邊（簍空）、開啟（active）時 `g.fill` 填色**。連帶清掉 `assets.ts` 的 `gbIconTurbo`、生成器的 turbo 形狀、`turbo.png`（資產 78→77）

驗證：check_undefined_refs / check_assets 全過、build 通過、實跑載入正常零 console 錯誤。

## 5.38 送審意見「bet control bar 不清楚/難用/不符 UX 慣例」— 稽核與第一批修正（2026-07-22 第二十八輪）

這條與先前的「poor bet ui bar / low quality asset」不同：前者講**美術品質**，這條講**可用性與慣例符合度**。逐一查程式碼後的稽核結果：

### 高風險（最可能被扣分，**尚未處理**，等使用者決定）

| # | 問題 | 證據 |
|---|------|------|
| U1 | **側欄佈局本身不符慣例** | 業界幾乎一律用底部橫向控制列。側欄是本專案自行改的，而這條意見出現在改動之後，時間點吻合。`betBarLayout: 'bottom'` 一行即可切回，`LayoutDesktop` 程式碼完整保留 |
| U2 | **主次關係顛倒** | 量測：BUY BONUS **360**、SPIN **155** —— 主要動作只有付費購買鍵的 **43%**。責任博弈角度亦不利 |
| U3 | **下注控制被拆散** | `−/BET/+`、Spin 在右欄，Buy Bonus 在左欄，相關動作橫跨整個畫面 |

> 使用者決定：**佈局先不動**，先修其餘項目。

### 本輪已修

- **U4 BET 面板可點但看不出來** —— `LabelBet` 有 `onpress` 開 `betAmountMenu`（可正常運作，一度誤判為無入口），但 BALANCE / WIN / BET 三塊外觀完全相同、只有 BET 可點且無任何提示。`UiLabel` 新增 `interactive` prop，開啟時畫一個 chevron；由主題 `labelAffordance` 控制（**預設 false → WildParty 不受影響**）
- **U7 turbo/autoplay 開關狀態不明顯** —— `backgroundColor` 原本完全沒考慮 `active`，開啟時只有描邊 6→10 變粗。主題新增 `buttonFillActive`（**預設 null → 維持原行為**），GoBananas 設深琥珀 `0x6b4a10`，開啟時整顆按鈕換底色
- **U8 `−`/`+` 過小** —— 60 單位，比 autoSpin(90) 還小卻是最高頻操作。放大 0.4 → 0.5（60→75，連帶放大點擊區），與 spin 仍有約 13px 間隙

### 第二批（U5 / U6）

- **U5 賠付表與規則提到外層** —— 原本 PAYTABLE / INFO / SETTINGS / SOUND 全藏在漢堡選單，要兩層才點得到；審核通常要求賠付表容易取得。把 **PAYTABLE 與 INFO 直接放上左欄**（利用 Buy Bonus 上方 0–360 的空檔，scale 0.46），漢堡選單精簡為 SETTINGS + SOUND
- **U6 圖示加文字標籤** —— 所有直接位於欄上的純圖示按鈕都補上說明文字：PAYTABLE / INFO / MENU / AUTO SPIN / TURBO，選單內的 SETTINGS / SOUND ON·OFF 也有。字級 `UI_BASE_FONT_SIZE * 0.55`，用主題的 `labelFill`
- 音效標籤依 `stateSound.volumeValueMaster` 顯示 SOUND ON / SOUND OFF

> ⚠️ 過程中一度寫成 `i18nDerived.sound()`（該方法不存在，只有 `soundOn`/`soundOff`）。因為 python 腳本的 `cd` 失敗而沒實際寫入，build 照樣通過 —— **這類「方法不存在」是執行期才炸的錯，`check_undefined_refs` 抓不到**。已改用狀態判斷並實跑確認。

`LayoutSideRail` 只在 `betBarLayout === 'sideRail'` 時使用，而只有 GoBananas 設定它，所以這批改動天然不影響 WildParty（仍另行 build 確認）。

### 尚未處理

- U9 停用狀態僅靠 tint、U10 側欄在接近正方形視窗會被壓縮

## 5.39 INFO 警語改為 Stake 標準文字 + 押注按鈕組放大（2026-07-22 第二十九輪）

### 1. INFO 頁下方警語

改為 Stake Engine 的標準免責文字（含 disconnection / expected return / Remote Game Server 結算 / TM 版權宣告），取代先前自行撰寫的版本。

### 2. 押注按鈕組放大

`bet` 0.92 → **1.1**（155 → **185**，+19%）、`±` 0.5 → **0.58**（75 → **87**，+16%），間距 ±128 → **±148**。

放大幅度是**先算出上限再退一格**決定的。列出各組合對照後，`1.15 / ±155` 會讓外側按鈕正好貼在畫布邊界，因此採用前一級：

**實機量測驗證**（canvas 1280×720，實測 `−` 中心 1048、`+` 中心 1246，與計算完全吻合）：

| 檢查項 | 實測 | 狀態 |
|--------|------|------|
| bet ↔ ± 間隙 | 8.0px | ✓ 不相交 |
| ± 內緣 → 盤面外框(980) | 39.3px | ✓ 未遮盤面 |
| ± 外緣 → 畫布右緣(1280) | 5.3px | ✓ 未被裁切 |
| 上方 BET 讀數 / 下方 autoSpin | 156 / 57px（標準框） | ✓ |

## 5.40 測試殼的已知限制：鍵盤事件會給假陰性（2026-07-24）

送審意見提到「Space bar should be bound to the bet button」。用測試殼驗證時，攔截 `/wallet/play` 後送出合成的 `KeyboardEvent`，得到「滑鼠點擊 1 次下注、空白鍵 0 次」的對照結果，據此判定空白鍵沒有作用 —— **這個結論是錯的**。使用者在真機測試確認空白鍵可以正常下注。

程式碼本來就是接好的，可作為佐證：

- `Game.svelte` 掛載 `EnableHotkey`（全域 keydown/keyup → 廣播 `hotKey` 事件）
- `ButtonBet.svelte` 有 `<OnHotkey hotkey="Space" {disabled} {onpress} />`
- `EnableSpaceHold`（UIDefault）另外處理「長按空白鍵」＝ 連續快轉
- `disabled` 條件是 `betCost > 0 && betCost <= balance`，一般情況不成立

**教訓（供日後測試參考）**：測試殼可以可靠驗證載入、資產、版面座標、DOM/PIXI 節點結構，但**不能**用來判定輸入行為是否正常。已知兩個假陰性來源：

1. **合成事件與真實輸入不等價** —— 即使 `EnableHotkey` 確實收到並廣播了（用 `defaultPrevented` 驗證過），下游仍可能不作動
2. **動畫時鐘凍結** —— 分頁是 `visibilityState: hidden`，`document.timeline.currentTime` 恆為 0。一旦開始旋轉就永遠不會結束，後續按鍵會被當成「停止」而非新下注，計數因此失真

過程中還踩到第三個坑：在送出事件後**同步**讀取計數器。下注請求是非同步的，當下必為 0。要分成不同的指令讀取，讓真實時間經過。

**結論：輸入相關（鍵盤、點擊、手勢）一律以真機測試為準，測試殼的結果不足以推翻。**

## 5.41 移除漢堡選單層（2026-07-24）

§5.38 把 PAYTABLE / INFO 提到外層之後，漢堡選單只剩 SETTINGS 與 SOUND 兩項 —— 使用者反映「怪怪的」。查證後確認問題比「項目太少」更根本：

- `ModalSettings` 內容**只有三個音量滑桿**（主音量／音樂／音效）
- `ButtonSoundSwitch` 直接把 `stateSound.volumeValueMaster` 在 0 / 50 之間切換，**與 SETTINGS 的「主音量」是同一個值**

也就是說，整層選單只裝了「聲音」相關的兩個彼此重疊的控制項。**一個藏著兩個重疊音訊控制的選單層，比沒有選單更糟**，所以整層移除：

- 左欄改為：PAYTABLE(0.13) → INFO(0.25) → Buy Bonus(0.5) → **SOUND(0.76)** → **SETTINGS(0.90)**
- `buttonMenu` / `buttonMenuClose` / `stateUi.menuOpen` 覆蓋層在此版型中全部移除（底部橫欄版型仍照舊使用它們）
- 連帶清掉失效的 import：`stateUi`、`BLACK`、`Rectangle`

間距（1920×1080 標準框）：Buy Bonus 下緣 720 → SOUND 776–866（標籤到 891）→ SETTINGS 927–1017（標籤到 1042），三段淨空 56 / 37 / 38px，距畫布底 38px。

實跑確認畫面文字：`PAYTABLE / INFO / BUY BONUS / SOUND ON / SETTINGS / BALANCE / WIN / BET / − / + / AUTO SPIN / TURBO` —— 所有控制項同一層可見，零 console 錯誤。

**現在整個 UI 沒有任何隱藏層級**，這同時改善了先前稽核的 U5（賠付表易取得）與 U6（無標籤圖示）。

## 5.42 游標微亮回饋 + 旋轉鍵呼吸光暈（2026-07-24）

兩項都由主題開關控制（**預設 false → WildParty 不受影響**，已重新 build 確認）。

### 1. hover 微亮（`uiTheme.hoverHighlight`）

游標移到控制項上時疊一層淡白（alpha 0.16）。**用疊加而非 tint**：`tint` 是相乘的，只能讓東西變暗，做不出「變亮」。

套用範圍依指定：

| 有 hover | 無 hover |
|---------|---------|
| 左欄全部（PAYTABLE / INFO / BUY BONUS / SOUND / SETTINGS） | 大旋轉鍵 |
| 右欄 AUTO SPIN / TURBO | `−` / `+` 步進鍵 |
| BET 讀數牌（可點開注額選單） | |

- `UiButton` 新增 `noHover` prop，`ButtonDecrease` / `ButtonIncrease` 帶上它
- `ButtonBuyBonus` 不走 `UiButton`（自己組的），另外加了同樣的疊層
- `LabelBet` 不是按鈕（只是帶 `onpointerup` 的 Container），自行加 `onpointerover` / `onpointerout` 偵測，`UiLabel` 收 `hovered` prop

### 2. 旋轉鍵呼吸光暈（`uiTheme.spinButtonGlow`）

原本旋轉鍵只有雙箭頭環在轉，沒有其他變化。在圖示後方加三層低透明度同心環當作光暈（無法用 Graphics 做模糊，靠疊層近似），並隨呼吸相位起伏：

| 狀態 | pulse 範圍 | 最內環 alpha | 呼吸週期 |
|------|-----------|-------------|---------|
| 閒置 | 0.08–0.40 | 0.018–0.088 | 3.14s |
| 旋轉中 | 0.18–0.82 | 0.040–0.180 | 1.34s |

刻意**放在旋轉容器之外** —— 會跟著轉的光暈讀起來是雜訊而不是光。光暈最大半徑 83 對按鈕半徑 84，剛好收在按鈕內不外溢。

### 驗證方式的註記

hover 的實測一度得到「無高光」的**假陰性** —— 在觸發 `onpointerover` 的同一個呼叫裡同步數節點，Svelte 還沒重繪。改成分兩次呼叫後確認 `167 → 168`（+1 節點）生效。這與 §5.40 記錄的是同一類陷阱。

## 5.43 送審意見「AI 美術／標準字體／emoji／漸層填充」— 稽核與 B 組質感升級（2026-07-24）

四項指控逐一對照程式碼的結果：

| 指控 | 實況 | 判定 |
|------|------|------|
| 標準字體 | `Trebuchet MS / Segoe UI / Tahoma / Arial`，專案內**零個字型檔** | ✗ **完全命中** |
| 漸層填充 | 7 支生成器共 **182 個漸層定義**，幾乎沒有表面細節疊在上面 | ✗ **完全命中** |
| AI 美術 | `design/source/realistic_symbols/` 的 h1–h4 / l1–l4 / s 是 AI 畫的 | △ 部分成立 |
| emoji 圖示 | GoBananas 8 個圖示**已全改手繪貼圖**，turbo 走向量 | ✓ 已修（審核可能看的是舊版） |

最糟的組合在 `GoldText`：**標準字體 + 漸層填充**同時中兩條，而金額／倍率／BIG WIN 全走它。

> 使用者決定：**字體先不碰**，B 組（漸層→質感）全面做。

### 新增 `design/surface.mjs` — 共用表面處理

問題的本質是「漸層就是全部」：一道線性漸層加一條描邊就結束了。真實的材質還有四件事，模組把它們都做成可重用的 SVG：

- **TOOTH** 細顆粒，讓大面積不再數學般平滑
- **WEAR** 斑駁與刮痕
- **OPTICS** 鏡面掃光與受光上緣
- **CONTACT** 交界處的環境遮蔽，讓零件「陷進」彼此而不是並排漂浮

並提供**材質預設**而非一體適用（一套通用處理正是程序化美術看起來程序化的原因）：

| 預設 | 用途 | 特徵 |
|------|------|------|
| `CANVAS_FINISH` | 橄欖帆布面板 | 顆粒 + 染色不均，幾乎無鏡面 |
| `BRASS_FINISH` | 黃銅飾條 | 拉絲 + 刮痕 + 真實高光 |
| `STEEL_FINISH` | 烤漆鋼件 | 介於兩者之間 |
| `BACKDROP_FINISH` | **盤面底板** | 只有質感，**鏡面 0**、邊光極低 |

`BACKDROP_FINISH` 是實測後補的：先用 `CANVAS_FINISH` 套盤面底板，前後對照發現多出一道斜向亮帶 —— 那是符號後方的表面，高光會跟符號搶視覺。量測顯示平均亮度不變（33→33）但明暗差由 32 擴大到 40，質感有進步，只是掃光位置不對，因此獨立成一個無鏡面的預設。

### 套用範圍

`ticker_plate`、`buybonus_plate`、`frame_bg`、`frame_edge`（拉絲+刮痕+斑駁）、黃銅環、UI 圖示（浮雕）、win banners。`generate_theme_jungle.mjs` 的 `svgWrap` 自動注入 `surfaceDefs`，之後新增的圖都能直接用。

### B5：`GoldText` 改三層堆疊（**未換字體**）

單一漸層填充 + 描邊正是被點名的樣子，而浮雕需要同一個字上同時有受光與背光 —— 一個 Text 節點表達不出來。改成三層：陰影層（下移、深色）→ 主體層（金色漸層 + 外框）→ 高光層（微上移、白金、低透明）。字型完全沒動。

### 驗證

兩支檢查腳本全過、GoBananas 與 WildParty 皆 build 通過、實跑 168 節點 UI 完整零 console 錯誤。表面細節量（相鄰像素平均差）ticker 0.80 / buybonus 1.12 / frame_bg 1.17，原本接近平滑。

### 仍未處理

- **A 組字體** —— 使用者決定暫緩。這是四條指控中最直接、最好修的一條
- **C 組 AI 美術** —— 需要外部美術重繪或加工

## 5.44 導入自有字體 Titan One（2026-07-24）

5.43 稽核出「標準字體」是四條指控中唯一完全命中且最好修的一條 —— 專案內**零個字型檔**，全部跑 `Trebuchet MS / Segoe UI / Tahoma / Arial`。這批把它補上。

### 選型過程

下載 10 支 OFL 候選，產兩張對照圖（都留在 `design/`）：

- `font_candidates.png` —— 10 支 + Trebuchet 基準線，用遊戲實際會畫的字串
- `font_incontext.png` —— 最強三支套進真實的 `ticker_plate` / `buybonus_plate` / `big.png`

渲染前先擋掉兩個會讓對照圖說謊的地方：

1. **家族名從 TTF 的 `name` 表讀出來**，不用猜。名字對不上 resvg 會靜默 fallback，整張圖就是假的
2. **字級依各字型 `OS/2` 表的 cap height 正規化**。display 字體在同一 font-size 下實際大小差很多，直接並排等於偏袒某幾支

另外逐支掃 `cmap` 驗字符覆蓋率。這抓到 **Staatliches 出局**：它的數字 `1` 與小寫 `l` 幾乎同形，`$1,284.50` 會讀成 `$l,284.50`。只有把真實金額字串排出來才看得到。

`design/` 沒有留選型腳本 —— 一次性的決策工具，留著只會變成沒人維護的死碼。

> 使用者選定 **Titan One**。

### 執行期接線

- `static/fonts/TitanOne.ttf` + `TitanOne-OFL.txt`（授權必須隨檔散布）
- `app.html` 加 `@font-face` 與 `<link rel=preload>`，**自架**不走第三方（模板的 Typekit 就是因為網域鎖死才 404）
- `pixi-svelte` 新增 `setLocalFonts()`，`preloadFont()` 一併 await。**這步不能省**：Pixi 建 `Text` 當下就量字寬，字型晚到的話第一幀用 fallback 的度量排版，而且事後不會重量。預設空陣列，WildParty 不受影響

### 字重：單一字重字型的連鎖修正

Titan One 只有一個字重，要求 700/900 只會拿到瀏覽器合成的假粗體，在本來就很重的字面上會把字腔糊掉。

- 新增 `GAME_FONT_WEIGHT = '400'`，GoBananas 端 10 處合成字重全部改讀它
- `theme.svelte.ts` 的 `fontWeight: '600' as const` 改成 union 型別。`as const` 把欄位型別釘死在字面量 `'600'`，等於**每個遊戲的覆寫都是型別錯誤** —— 現有的 `'700'` 一直沒被抓到，因為 vite build 不做型別檢查
- 共用套件另有 4 處寫死字重沒讀主題（時鐘、遊戲名、BUY BONUS、autospin 計數），改為 `uiTheme.fontWeight`

⚠️ **WildParty 有一處實際變動**：autospin 計數牌原本寫死 `'bold'`(700)，現在跟主題走 `'600'`。其餘三處預設值就是 `'600'`，零差異。這是刻意的取捨 —— 不改的話 GoBananas 會留一個合成粗體。要還原就是把 `ButtonBetAutoSpinsCounter.svelte` 那行改回 `'bold'`。

### 烤進圖裡的字

`generate_win_banners.mjs`（BIG WIN / SUPER WIN…）與 `generate_symbols_realistic.mjs`（wx 卡的 WILD 直排字母）都烤 Arial Black。兩支都改用 Titan One 並加 `fontDirs`。

兩個「先量再改」的判斷：

- banner 字級**維持 128 不動**。我原本以為 Titan One 較寬會撐出黃銅框，寫了註解說要降到 108 —— 實測最長的 SUPER WIN 只有 727px，框內淨寬 876px，根本沒問題。假設是錯的，註解已改成量測值
- `x.png` 的 **✕ 維持原字型**。Titan One 沒有 U+2715（有 U+00D7 但那是不同字元），換過去會變空白。這是查 `cmap` 查出來的，看圖看不出來

符號重生成有風險：`generate_symbols_realistic.mjs` 也會寫 h1/h2/s（策展美術，不得覆蓋）。做法是**跑前記全部 16 個檔的 md5、跑後比對** —— 結果只有 `wx.png` 變動，h1/h2/s 位元完全相同。

### DOM 彈窗：雙字體

規則/賠付表彈窗是 DOM 不是 Pixi。共用元件寫死 `'proxima-nova'`（那支永遠載不到的 Typekit 字），所以一直落在瀏覽器預設字。

改成標題 `h1`–`h4` 走 display 字、`p`/`li`/`td` 走可讀 sans。**內文刻意不用 Titan One** —— 這幾頁有整段散文（功能說明、RTP 警語），粗圓體排小字散文會明顯難讀。字型堆疊由 `fonts.ts` 寫進 CSS 變數，避免在 SCSS 再抄一份。

### 驗證

不是看圖看起來對，是量的：

- `document.fonts.check` 為 true；canvas `measureText('BALANCE 5,000.00')` 在 Titan One 是 469.3px、假字型 fallback 406.7px、Trebuchet 393.9px —— 三者互異，證明**沒有靜默 fallback**
- 實跑 harness 走訪 Pixi 場景圖：169 節點、18 個文字節點**全部** `Titan One`，字重只剩 400 / normal，合成粗體歸零
- 彈窗 `getComputedStyle`：`h2`/`h3` = Titan One 400，`p` = Trebuchet MS ✔
- 兩支檢查腳本全過、GoBananas 與 WildParty 皆 build 通過、零 console 錯誤

### 仍未處理

**C 組 AI 美術** —— `design/source/realistic_symbols/` 的 h1–h4 / l1–l4 / s 仍是 AI 畫的，需要外部美術重繪或加工。這是四條指控裡唯一還沒動的。

## 5.45 選單收納、擴展百搭中獎高亮、閒置重播連線（2026-07-24）

### 1. 左側四個按鈕收回選單

PAYTABLE / INFO / SOUND / SETTINGS 從側欄收回選單，只留 BUY BONUS 與 MENU。

先前把它們全攤在外面是為了「一鍵可達」，但代價是側欄變成五個同尺寸圓鈕的直排，功能 CTA 被埋在其中。收起來之後，左欄只剩一個東西在跟 BUY BONUS 搶注意力。

選單放在側欄下方**往上彈出**，項目由下而上是 SOUND → SETTINGS → INFO → PAYTABLE：最常反覆切換的緊鄰剛按下的按鈕，兩個查閱型面板放最遠。順序與底部欄版面由上而下讀是一致的。關閉鈕落在選單鈕原位，游標不用移動。

間距 130（版面單位）對上直徑約 90 的按鈕 —— 實測畫布座標下按鈕直徑 46px、相鄰間距 86–87px，**外框完全不相交**（這是上一版看起來壞掉的原因）。

### 2. 擴展百搭中獎時整輪框亮起

原本鎖定轉輪在連線時只有 `winFlash` —— 一次性閃爍，160→220→180→420ms 後歸零。但一般中獎符號走 `SymbolWinAnim`，是**持續呼吸**直到演繹結束。結果就是：造成這次中獎的那一輪，反而是全盤唯一沒亮著的東西。

新增 `winHold`，`winLinesShow` 時設起、`winLinesHide`/`winLinesClear` 時清掉，期間畫一個持續呼吸的整輪外框。刻意用與 `SymbolWinAnim` 相同的零件組成（柔光底 + 亮環 + 白色內線，同步呼吸），只是改成矩形包住整輪 —— 因為這裡「贏的單位」是整條轉輪。一次性閃爍保留，當作命中的瞬間重音。

### 3. 得分後閒置時重播連線

回合結束後盤面靜止等玩家再轉，而連線早就清掉了。中間看漏的人沒有任何方法知道剛才是哪幾條線贏。

`playBet` 在所有 book event 跑完後啟動重播迴圈：間隔 1600ms、快速演繹、無限循環，直到下一次 `playBet` 取消。

刻意**驅動既有的 `winLinesShow`/`Hide` 事件**而不是另開一條重播路徑 —— 這樣所有已經在監聽這兩個事件的東西（符號中獎動畫、上面第 2 點的鎖定轉輪高亮）全部自動跟上。回合音效是 `winInfo` 發的、不是 `winLinesShow`，所以重播不會每輪重轟一次。

取消用遞增 token：迴圈只在仍持有當前 token 時繼續。

### 順帶修掉的真缺陷

`winLinesShow` 會 await 整段演繹後才跑收尾的「安全網」`animatePositions`。沒有防護的話，**那個收尾呼叫在演繹被取消後仍會執行** —— 而重播隨時可能被玩家按下一手打斷，於是中獎動畫會灑在已經重新轉動的盤面上。加了 generation 計數器擋掉，非重播路徑也一併受惠。

### 驗證

| 項目 | 結果 |
|------|------|
| 選單 | 四項齊全，按鈕直徑 46px、間距 86–87px，不相交 ✔ |
| 閒置重播 | 連線層以 **2.1 秒**穩定週期反覆出現（1.6s 間隔 + ~0.5s 演繹），連續 11 循環 ✔ |
| 重播取消 | 演繹進行中按下一手，連線 ~450ms 內清空，整段轉動期間為 0 ✔ |
| **擴展百搭高亮** | **未能實機驗證** ⚠ |

第 2 點沒能驗到：harness 裡買入按鈕吃不到合成 pointer 事件（§5.40 記過的限制），改用 stub 的 `__FORCE_MODE` 強制發 BONUS book 後確實進得了免費遊戲，但整段取樣沒能捕捉到「連線正穿過擴展百搭」的瞬間。它依賴的接線（`winLinesShow`/`Hide` 確實觸發、以及與既有 `phase` 相同的 `$state` 變更模式）是驗過的，但**亮起來的框本身沒有目視確認**。

過程中還有一次自我糾錯值得記著：第一版 glow 探針用 `texture.label.includes('fxGlow')` 比對，但實際 label 是完整 URL，永遠不成立 —— 量出來的「glow 全程為 0」是假陰性。修正成比對 `fx_glow.png` 後才發現探針本來就是壞的。**探針要先自我驗證能抓到目標，再拿它的零值當結論。**

## 5.46 底部橫條版面（compactBottom）+ 一鍵切回機制（2026-07-24）

依使用者提供的參考截圖，把控制列改成盤面下方一條橫帶。這正面回應了先前標為 **U1** 的風險（側欄不合業界慣例），也就是送審講的「does not conform to expected UX standards」。

### 先量再做：這筆帳的代價

側欄之所以能把盤面撐大，是因為它吃的是**水平方向的閒置空間**：

- 遊戲區 1422×800，盤面連框佔 755×755
- 垂直已用 **94%**，水平只用 **53%**

所以改回底部橫條**一定要付出盤面高度**。而且不能只是把盤面往上推——遊戲區與畫布是 1:1 對應，推出上緣會被裁掉而不是溢出到背景。只能縮小。

實測調校（不是猜的）：`BOARD_SHRINK = 0.96` 時盤面上下距畫布頂與橫條各只剩 **2px**，畫面上看得過去但等於零餘裕，換個視窗比例就會被壓到條下面。收到 **0.94** 後上下各留 9px。相對側欄版盤面線性小約 6%。

### 版面

`LayoutBottomBar.svelte`（新檔，共用套件）：

- **左**：漢堡選單 → BALANCE → WIN
- **右**：BET（唯一有外框的讀數，因為只有它按下去會開東西）→ **直式 ± 上下疊** → 旋轉鍵（最大且上下都溢出橫條，不靠說明字就讀得出是主要動作）→ AUTOSPIN → TURBO

幾個刻意的取捨：

- **讀數不用既有的黃銅牌**。那張圖是 4.5:1，塞進這麼淺的條裡會爆掉，改用純文字（參考圖也是）。只有 BET 加一個簡單外框。
- **± 保留 + / −，不改成 ▲▼**。參考圖用箭頭，但上下箭頭放在金額旁邊有歧義（是改注額還是捲清單？）。直式排列的**省空間效果照拿**，語意不犧牲。
- **圓鈕不加說明字，讀數保留小標**。送審講「bet control bar is unclear」是靠說明字解掉的，全拿掉會回頭踩雷；參考圖的作法（讀數有標、圓鈕靠圖示）是兩邊都顧的折衷。
- **Buy Bonus 不進條裡**（使用者指定保留原位）。理由本來就成立：買功能是偶爾為之、金額大、需要慎重的動作，不該緊鄰玩家每幾秒就按一次的鍵。

### 一鍵切回的機制

使用者要求「方便之後改回來」。這個架構本來就有正確做法，不需要另外發明備份：

1. **`LayoutSideRail` 完全沒動**，仍然掛在選擇器上。改回去就是 `uiTheme.betBarLayout` 從 `'compactBottom'` 換成 `'sideRail'`，**一個字**。
2. **執行期覆寫**，不用重建就能當場比較：
   ```
   localStorage.setItem('betBarLayout', 'sideRail')        舊版
   localStorage.setItem('betBarLayout', 'compactBottom')   新版
   localStorage.removeItem('betBarLayout')                 回到遊戲自己的設定
   ```
3. 切換前的狀態有 tag：`gobananas-backup-2026-07-24-titanone-menu-replay`。

盤面的縮放與位移都掛在 `betBarLayout === 'compactBottom'` 判斷下，切回側欄時盤面自動回到原尺寸——**不會留下半套狀態**。

橫條高度與盤面讓位比例是**同一個來源**（`uiTheme.barHeight` 推導），不是兩個各自寫死的數字，所以日後調高度不會忘了調另一個。

### 驗證

| 項目 | 結果 |
|------|------|
| 盤面讓位 | 外框 639px，上緣 9px、距橫條 9px，對稱 ✔ |
| 條內元素 | 讀數 y=670/688、直式 ± 在 (960,668)/(960,708)，全在條內 ✔ |
| Buy Bonus | (133,331) 維持原位 ✔ |
| 選單 | 四項間距 86–87px、按鈕直徑 40px，不相交 ✔ |
| **切回舊版** | localStorage 設 `sideRail` 後側欄完整復原（讀數回右側 x=1147、橫式 ±、說明字回來）；清掉後回到橫條 ✔ **雙向都驗過** |
| 建置 | GoBananas 與 WildParty 皆通過，零 console 錯誤 ✔ |

### 已知取捨

- 盤面比側欄版**小約 6%**。這是底部條的必然代價，不是可以繞過的。要換回大盤面就切回 `sideRail`。
- 選單展開時會蓋到（變暗的）Buy Bonus。與側欄版相同，是標準 modal 疊層行為。
- 直向（portrait）不走這個版面，仍用原本的完整底部欄——寬度不夠。

## 5.47 底部條改為單一外框面板（2026-07-24）

依使用者標註的紅框，把整條 UI 收進**一個外框**，內部各讀數的框拿掉。

### 順手抓到的既有 bug

使用者截圖裡 BALANCE 顯示成「BALANCI / $1,000.0」被切掉。原因不是字太長，是 **BALANCE 的牌子和 WIN 的牌子重疊**，WIN 的牌子畫在 BALANCE 的字上面。

`LabelBalance` / `LabelWin` / `LabelBet` 都**寫死 `tiled`**，我 5.46 排版時誤以為沒有牌子，用了純文字的間距（265 / 500），但牌子實際寬 362，一定相撞。三個元件改成 `tiled?: boolean` 預設 true（其他版面不受影響），底部條傳 `tiled: false`。

### 外框

`uiTheme.barFill` 的圓角矩形 + 厚黃銅邊 + 內側細亮線 + 上下兩排鉚釘，語彙比照原本的讀數牌。

**沒有直接拉伸讀數牌的圖**：那張是 652×146（約 4.5:1），這個外框接近 17:1，硬縮會像當初 ticker plate 被拉寬那次一樣變形。九宮格切法能保住四角，但它邊緣有整排鉚釘會被抹掉，所以改成程式繪製，任何寬度都正確。

### 量測驅動的三輪修正

排版不是看順眼就收工，每一輪都量：

1. **外框底邊貼齊畫布底部** → 圓角與下排鉚釘被切掉。加 `FRAME_BOTTOM = 18`，框四邊都收邊（畫布底部留 12px）。
2. **直式 ± 上下各凸出外框 7px**。條內淨高 63px，而 0.36 縮放 + 30 位移的按鈕對高達 77px，塞不下。改 `STEP_SCALE 0.28` / `STEP_DY 22`。
3. **旋轉鍵底部超出畫布**。0.92 超出 8px，退到 0.8 仍超出 1px，最後定 **0.78**。它刻意上下溢出外框（這是它不靠說明字就讀得出是主要動作的原因），但不能溢出畫布。

另外 BET 與 ± 之間只剩 11px 偏擠，間距加大 29 單位。

### 最終幾何（1280×720 stage 實測）

| 項目 | 數值 |
|------|------|
| 外框 | x 27–1253、y 640–708，畫布底部留 12px |
| 盤面 | 605px，上緣 18px、距外框 18px，**對稱** |
| 右側叢集水平間距 | 30 / 25 / 24 / 25 —— 勻 |
| 超出畫布的控制項 | **0** |
| 溢出外框的控制項 | 1（旋轉鍵，刻意） |

`barHeight` 96 → 120（外框比純色帶高），`BOARD_SHRINK` 0.94 → **0.89**。盤面比側欄版線性小約 11%。

### 切回舊版仍然有效

`LayoutSideRail` 依然沒動。`uiTheme.betBarLayout` 改 `'sideRail'`，或執行期 `localStorage.setItem('betBarLayout','sideRail')`。

## 5.48 讀取頁字體修正 + 輪播機制字樣 + 去重複指示（2026-07-24）

讀取頁副標（14px）與讀取行（12px）沿用了 5.44 的 Titan One —— display 粗圓體在這尺寸字腔糊掉，`10,000X` 尤其難認。這正是 `BODY_FONT` 當初留下的用途，只是那時只接了彈窗。改用 `BODY_FONT`（一般 sans）並微放大，52px 標題維持 Titan One。

依 WildParty 加輪播提示（沿用既有 32ms tick、前後 12% 淡入淡出），六則對過規則彈窗 —— 特別注意 GoBananas 是 **4 或 5 個 Scatter 給 12/15 次**（非 WildParty 的 3 個），倍率是**相加**不是相乘，照抄會錯。

順手去重：讀取行原本完成後從 `LOADING xx%` 換成 `TAP TO CONTINUE`，與底部大字 `PRESS ANYWHERE TO CONTINUE` 重複。改成只留百分比，完成後退場、提示行上移填補。

附帶發現（未處理）：`AssetsLoader` 是 `{#if preLoaded}` 才渲染，讀取畫面本身要等預載完成才出現，所以 `LOADING xx%` 幾乎看不到、進度條動畫實為裝飾。屬載入策略，未動。

## 5.49 bet bar 打磨：hover 修正、分割線、選單上移、± 提亮、FG 不重播（2026-07-24）

一批 bet bar 細修，加一個中獎重播的行為修正。

**① BET hover 溢出格子**：`tiled: false`（緊湊條）時牌子不畫，但 hover 高亮仍照牌子尺寸（約 603×135）畫，遠大於分割線圍出的 BET 格。`UiLabel` 改成無牌時用貼合上下兩行文字的緊湊框。

**② 分割線取代鉚釘**：上下兩排鉚釘橫向連成兩條虛線，正好綁住要分組的內容。改成四條垂直分割線 `選單│BALANCE│WIN│（空格）│BET`，每條做右側細亮邊如刻進面板的凹槽。WIN↔BET 空白依使用者選擇（選項 F）維持留白，只在正中加一條更細更淡的「呼吸中線」（僅框高中段三分之一，不作分隔用）。

**③ 選單選項上移**：第一項從外框上方 40 提到 110，說明字不再與關閉叉叉重疊。

**④ ± 游標提亮**：`ButtonIncrease`/`Decrease` 拿掉 `noHover`，跟其他控制項一致。

**⑤ 外框加大**：`barHeight` 120→140、內縮收緊到 24/12，外框更貼近盤面；`BOARD_SHRINK` 連動，盤面讓位由 barHeight 推導不重複寫死。

**⑥ 向下箭頭保留**：整格可點，但箭頭是唯一區分「BET 可點 vs BALANCE/WIN 靜態」的信號，且為慣例，故留。

**FG 結束不重播連線**：閒置重播（5.45）記的是回合最後一次 winInfo 的連線，但免費遊戲/超級轉結束後盤面已重置成 base idle，重播會畫在對不上的盤面。雙重防護：winInfo 只在 base game 記錄、feature 一律清空；且進入 FG（freeSpinTrigger）先清一次，擋掉「觸發那手 base 中獎、FG 全程沒中獎就不會被覆寫」的邊角。

**ExpandingWilds v8 API**：5.45 加的中獎框高亮用了 Pixi v7 的 `beginFill`/`lineStyle`（會把填色漏到整條路徑，bottom bar 就是這樣變成整片黃銅），改成 v8 的 shape→fill/stroke。

驗證缺口：這批的實機外觀（外框與盤面框的實際間距、hover 貼合、呼吸中線觀感）未能截圖 —— Browser 面板隱藏、動畫時鐘凍結跑不出主盤面。版面座標以靜態計算確認（群組左到右嚴格遞增、控制項不出畫布、盤面距框推算約 12px），兩個 app build 通過。使用者已知並改以上傳檢驗。

## 5.50 讀數放大 + 擴展百搭中獎框「方案 B」（2026-07-24）

**讀數放大**：底部條 BALANCE/WIN/BET 的 `READOUT_SCALE` 0.6→0.68（+13%）。不是憑感覺——用 resvg 量 Titan One 在各分割線圍出的格子裡的實際字寬：最寬的 `$1,000.00` 161、`$10,000.00` 大獎 177（WIN 格可用約 210）、`$100.00` 押注 130（清過向下箭頭），全部在格內。再高會讓最大獎碰到 WIN 分隔線。

**擴展百搭中獎框方案 B**：5.45 的 winHold 用的是和 idle 相同的 `auraPulse`（週期約 3.4s），所以中獎時只是變亮、節奏沒變，落差不夠。方案 B 補上這個落差：

- 新增 `winPulse`，週期約 1.3s（約 idle 的 2.5 倍快），中獎框改用它 —— idle→中獎 讀作「節奏變快」而非只是變亮。
- 中獎時**關掉 idle 呼吸光**（`phase==='idle' && !winHold`），讓亮框獨佔、對比乾淨。
- 把一次性 `winFlash` 的值疊進中獎框（fill/halo/ring/inner 四層都加 `fl` 項），邊框在中獎落定的瞬間衝到最亮 —— 這就是「啪一下亮起」的 flash-on。
- 主亮環顏色由 `0xffe050` 提到 `0xfff3bd`（更白更烫），峰值 alpha 到 ~0.95。

順帶修：獨立的 winFlash 淡出尾巴區塊原本用 Pixi v7 的 `lineStyle`/`drawRoundedRect`（在共用 Graphics 上會漏狀態），改成 v8 shape→stroke，並加 `&& !wild.winHold` 條件，讓它只在 winHold 清除後負責淡出，不和新框重複畫。

驗證缺口：中獎框實機外觀未截圖（面板隱藏跑不出 FG 中獎的瞬間）。接線與數值邏輯正確、build 通過。使用者改以上傳檢驗。

## 5.51 修正：中獎亮框改描「卡片自己的金框」而非轉輪光暈（2026-07-24）

5.50 的方案 B 我理解錯位置：畫成整條轉輪外圍的發光框。使用者要的是**擴展百搭卡片（wx 圖）自己那圈金框**在參與得分時亮 —— 「不然百搭有參與連線玩家會沒感覺」。

核對卡片幾何：wx.png 256×1280，畫在盤面 SYMBOL_SIZE×BOARD_SIZES.height（118×590，等比 0.461）。源圖金框 `<rect x=14 y=14 w=228 h=1252 rx=20 stroke-width=8>`，換算到畫面：往內 inset `118×14/256 = 6.45px`、圓角 `118×20/256 = 9.2px`、金框線寬 `8×0.461 = 3.7px`。

改法：把 winHold 的亮框從「轉輪框（含往外 +14 的 halo 與寬 fxGlow sprite）」改成**精確描在卡片金框線上**（inset 6.45、圓角 9.2）：外層柔光暈 12px + 金框亮線 5px（0xfff3bd）+ 白色高光 2px，全部疊在那條金邊。12px 柔光暈的外緣剛好到卡片邊、不溢出。節奏保留 5.50 的 winPulse 快脈衝 + winFlash flash-on。淡出尾巴同步改成描卡片金框、移除往轉輪外的光暈。**畫面上不再有任何東西超出卡片範圍。**

驗證缺口同前：實機未截圖（面板隱藏），幾何以源圖座標靜態核對命中金框，build 通過。

## 5.52 修正：擴展百搭中獎框「亮不起來」的真因（反應性 + 時序）（2026-07-24）

使用者回報卡片金框始終不亮。查了 book 資料與程式,找到兩個真因(都不是幾何):

**資料面(排除誤解)**:解析實際 BONUS book,大多數中獎是 reels 0,1,2 的左置三連,而百搭常在 reel 4 —— 這種情況百搭「沒參與連線」,不亮是正確的。但百搭是黏性的,好的免費遊戲後期會累積到 3–4 輪(book 540 index 56:百搭在 0,1,3,4,連線跨 0,1,交集有值),那時就會參與。所以 `winningReels` 判斷本身沒錯。

**程式 bug(真因)**:亮框原本用 `{#if wild.winHold}` 這個**純 boolean** 當條件,問題有二:
1. `winHold` 在 `for (const entry of wilds)` 迴圈裡直接 `entry.winHold = true`。Svelte 5 對「陣列元素的純值屬性就地賦值」的反應性**不保證觸發** —— 同迴圈的 `badgeScale.set()`/`winFlash.set()` 能動純粹是因為 Tween 自帶反應性,不靠 entry 的 proxy。
2. `winLinesHide` 在連線演繹一結束就把 `winHold` 設回 false,而免費遊戲走 FAST 時序(整段約 0.5s),亮框可能一閃就被清掉。

**修法**:整個亮框改由 **`winFlash`(Tween)單一驅動**。Tween 的 `.current` 一定有反應性;包絡改成「瞬間全亮 → 持平 0.72 撐 520ms → 480ms 淡出」,約 1.1s 明確可見、不受 `winLinesHide` 影響。所有 alpha 乘上 `winGlow = winFlash.current`,峰值明確亮、結束確實歸零,`winPulse` 只負責疊在上面的微閃。`winHold` 欄位完全移除,idle 呼吸光改用 `winFlash.current <= 0.01` 當閘門。合併原本分開的「sustained 框 + tail」兩區塊為一。

驗證缺口:實機未截圖(面板隱藏)。book 資料交集邏輯已靜態確認、反應性改用 Tween 消除疑慮、build 通過。若仍不亮,下一個假設是 winLinesShow 未達 ExpandingWilds 或 phase 非 idle,但反應性是最高機率的原因。

## 5.53 巡查：修 phase 反應性真 bug + pulse 計時器優化 + 更正錯誤歸因（2026-07-24）

一輪主動巡查,鎖定我已證實會造成實際畫面錯誤的兩類問題(Pixi v7/v8 混用、Svelte 5 陣列元素反應性)。

### 真 bug:runTakeover 寫在原始物件上,phase 不發信號

`expandingWildNew` 建的是普通物件字面值,推進 `wilds` 後把**原始參照**傳給 `runTakeover`。Svelte 把陣列 proxy 化了,但該參照仍指向 proxy 底下的原始物件 —— 寫 `entry.phase = 'idle'` 繞過 set trap,**不觸發重繪**。

`phase` 正是這兩個區塊的開關:不透明蓋板(line 321)、底下個別 W 符號(line 340)。所以它們停在舊狀態直到陣列下次被整體重建(例如又有新百搭出現)。

**這解釋了先前回報過的症狀** —— 「下層還是有圖案轉出,看起來會很不自然」、任務 #17「結束不露底下個別 W」。當時是用蓋板繞過,沒有根治。

修法:`const entry = wilds.find((w) => w.reel === created.reel) ?? created` —— 從 state 陣列取回 proxy 再改。對照組佐證診斷:`expandingWildsUpdate` 本來就用 `wilds.find()`(proxy),它的倍率更新從來沒出過問題。

### 更正 5.52 的錯誤歸因

5.52 我把中獎框不亮歸因於「`for...of` 迴圈對元素賦值沒有反應性」—— **這個說法是錯的**。`for (const entry of wilds)` 迭代的是 proxy,元素也是 proxy,寫入會正常發信號。

真正讓框不亮的原因較可能是**時序**(`winLinesHide` 在約 0.5s 的快速演繹結束就清掉)或**測試的那幾手百搭剛好沒參與連線**。改成 Tween 驅動確實修掉時序那條,但成因歸因講錯了,在此更正,避免錯的解釋留在紀錄裡。

### 效能:pulse 計時器改為按需運轉

`ExpandingWilds` 的 pulse 計時器從掛載起一直跑,每秒約 42 次更新 `$state`。但 `pulse` 只被 `auraPulse`/`winPulse` 使用,而兩者只在 `{#each wilds}` 內呼叫 —— 基礎遊戲百搭數為 0,等於整場都在更新沒人讀的狀態。改用 `$effect` 綁 `wilds.length`,清理函式停表。

### 過期註解(會誤導)

- `railWidth` 標「sideRail only」,實際 compactBottom 也用它定位 Buy Bonus
- `betBarScale` 只提「sideRail 時忽略」,漏了 compactBottom

### 檢查通過、非缺陷

- **Pixi v7 舊 API 103 處**,但逐個 `draw` 函式檢查過 —— **沒有任何單一函式混用 v7/v8**,只是 deprecated 能跑。技術債非缺陷。
- 計時器/rAF 清理全部正常(`rAF=2/cancel=1` 是「起始+遞迴重掛+一個清理」的正常樣式)。
- `StickyPrizes` 的 `landedAt` 也寫在原始物件上,但被每幀 rAF 輪詢讀取、不靠信號 —— 脆弱但目前正確,優先度低。
- 兩支檢查腳本通過(77 資源路徑、無未定義引用)、無 TODO/FIXME、主題欄位無死碼。

### 待決定(未動)

1. **`LOADING xx%` 幾乎看不到**:`AssetsLoader` 是 `{#if preLoaded}` 才渲染子元件,讀取畫面出現時預載已完成,進度條動畫實為裝飾。要處理得動載入策略。
2. **`pixi-svelte/dist` 進 git**(60 檔、無 gitignore)。因 `main` 指向 dist 且無 `prepare` 腳本,**現在必須 commit 否則新 clone 會壞**。乾淨解是加 `"prepare": "svelte-package"` 再 gitignore,但動到 repo 結構且 WildParty 也吃,未擅自改。

## 5.54 送審第四批：移除 Stake Engine loader、social 術語、XEC、重播模式（2026-08-04）

四項審核意見，使用者一律選 A 案；另外指明「供應商標誌是我們自己的，要留著」。

### ① 移除 Stake Engine 開場畫面

`+layout.svelte` 拿掉 `LoaderStakeEngine`，刪 `static/stake-engine-loader.gif`。**`WildParty­Loader` 留著** —— 那是自家工作室標誌，跟 Stake Engine 的 splash 是兩回事，檔案裡留了註解說明，免得下次又被一起清掉。

### ② social 模式的 pay 系列術語

`ModalGameRules` 的 `T` 詞彙表補上 `payline / paylines / payTable / payTableCaps / pay / pays / paid / payout`，模板裡 16 處 pay 字全部改走詞彙表；`components-ui-pixi/src/i18n/i18nDerived.ts` 的 `payTable()` 加 social 分支（`PLAY TABLE`）。順手把先前 `T.pays.replace('s','')` 那個把戲換成正式的 `T.pay` 條目。

### ③ XEC 顯示為 SC

`utils-shared/amount.ts` 的 `NO_LOCALISATION_CURRENCY_MAP` 加 `XEC: 'SC'`。這張表同時是「不走 Intl、不加 `$`」的名單，所以 4 位小數的贏分規則自動一併適用，不需另外改。

### ④ 重播模式（Replay Mode）

四個要求各自對應一處改動：

| 要求 | 改動 |
|------|------|
| 發起重播時帶語言參數 | `rgs-requests` 的 `requestReplay` 新增選填 `language`，接成 `?lang=`；`Authenticate` 傳 `stateUrlDerived.lang()` |
| 序列結束後要有重播按鈕 | bet bar 上一顆**常駐** Replay 鍵（`ButtonReplay`），位於 BET 左側那格，播放中自動禁用 |
| 開頭要顯示花費、倍率、最終金額 | `ReplayIntro.svelte`（DOM 卡片）：Mode / Base Bet / Cost Multiplier / Total Bet Cost / Payout Multiplier / Total Win |
| Stake.us 術語與模式名稱 | social 時 `Base Play` / `Feature Multiplier` / `Final Multiplier`；模式名用 `Base Game` / `Free Spins` / `Super Spin` |

**卡片只出現一次**（開播前）。第一版是播完再蓋一次、按鈕改成 Replay Again，但那張面板每次都擋住盤面，不利於重看，所以改成常駐按鈕。

**為什麼 `stateReplay` 放在 `state-shared`**：xstate 的 `resumeGame` 一啟動就把 `stateBet.betToResume` 設成 `null`，重播第二次就沒資料了，所以另存一份 `stateReplay.round`，每次開播前塞回去。而按鈕本身住在共用套件的 `UIReplay` 裡，也得讀同一份狀態 —— 兩邊都要用，就不該只放在單一遊戲。`enabled` 是保險絲：沒有接管重播播放的遊戲永遠不會設它，WildParty 的重播畫面完全維持原樣。

**閘門位置**：`ResumeBet.svelte`。原本一掛載就 broadcast `resumeBet`，現在只有非重播才這麼做；重播改成把資料存進 `stateReplay` 並亮出卡片。**真正的續玩（玩家中途離開的實際回合）維持自動續播** —— 那筆錢已經下注了，不該讓玩家決定要不要跑完。

**播放中／結束的判定**：機器在整段演繹（中獎牌、免費遊戲結算牌）期間都停在 `resumeBet`，回到 `idle` 才是真的播完，所以用 `resumeBet → idle` 的轉換當訊號，不需要另外埋事件。`stateReplay.running` 就是這樣維護的，按鈕靠它禁用。

**重播前要清場**：`resumeGame` 這條路徑不會經過 `onNewGameStart`（那是 `newGame` 專屬），而清黏性金幣與擴展百搭的邏輯正是寫在那裡。所以重播第二次以後，上一輪的黏性百搭會留在盤面上。`ResumeBet` 的啟動 effect 自己補了這段清理。

**踩到的坑**：第一版「回到 idle 就當作播完」的偵測沒有限定重播模式。一般對局的 `ResumeBet` 也會 broadcast `resumeBet`，機器發現沒有可續玩的回合就立刻掉回 `idle` —— 於是每次正常開場都被判定成重播結束，卡片直接蓋住整個畫面。現在 `isReplay` 讀一次存起來，掛載分支和狀態偵測都吃它。

**重播模式改用遊戲本體的 bar**：`stateUi.config.mode === 'replay'` 原本會切到範本的 `UIReplay`（置中的 WIN / BET 疊放，左欄 menu + turbo）。那個版面既不像實際遊戲，也沒有地方擺重播鍵。現在 `UI.svelte` 在 `stateReplay.enabled` 時改用 `UIDefault`，於是重播走的是 GoBananas 自己的 `LayoutBottomBar`（portrait 則是 `LayoutPortrait`）。

**下注控制項在重播模式全部移除**：旋轉鍵、± 步進、AUTO SPIN、BUY BONUS。重播沒有 sessionID，按下旋轉只會拿到錯誤。TURBO 留著（可加速播放），並從最右端移到旋轉鍵的位置，否則右半邊會空一大段。`LabelBet` 也不再可點（重播的注額是錄好的，而且重播模式伺服器沒送 betLevels，選單會是空的）。

**BALANCE 格改成 MULTIPLIER**：重播不 authenticate，餘額會是 $0.00，看起來像壞掉。改放該模式的 cost multiplier（`LabelReplayMultiplier`），與旁邊的 BET 合起來就是規範要的「bet cost and applied multiplier」，不必回頭開卡片。

**Replay 鍵位置**：`LayoutBottomBar` 中 Win→Bet 之間那格刻意留白的空間（`GAP_CENTER`），也就是 BET 正左方。1920 標準框下該格 x 656→1182 寬 526，按鈕 0.66 倍（99px）落在 803.5–902.5、垂直 954.5–1053.5，框內緣是 940–1068。文字說明擺在圖示**右側**而非下方 —— 框高只有 128，放得下大按鈕就放不下一行字，但格子有 526 寬，橫向空間綽綽有餘。加說明的理由：重播模式下它是唯一能讓遊戲動起來的控制項，一顆沒標籤的環形箭頭擺在閃電旁邊很容易被讀成「重轉」。

Portrait（Popout S 也可能落在這個版面）同樣處理：整組 spin pod 收成 `[REPLAY][turbo]`，BALANCE 換成 MULTIPLIER。

圖示走既有的 `design/generate_ui_icons.mjs`（黃銅風格），新增 `replay`：把 `autoSpin` 的弧鏡射成逆時針、拿掉播放三角形 —— 三角形正是 `autoSpin`「繼續跑」的語意，兩者不能混淆。

**順手補的洞**：`stateUrl` 的 `Key` 型別早就列了 `currency`，卻沒有對應的存取器。重播不會呼叫 authenticate，`stateBet.currency` 於是永遠停在預設的 `'USD'` —— 卡片上的金額會用錯幣別顯示。補了 `currency()` 並只在 `handleReplay` 裡套用，正常對局仍以 authenticate 回傳的為準。

**另一個實測抓到的缺陷：重播請求失敗會整個白畫面**。`authenticate()` 有 try/catch，`handleReplay()` 沒有 —— 一 reject 就從 `onMount` 拋出去，`authenticated` 永遠停在 false，`{#if authenticated}` 底下什麼都不渲染。實測 `?replay=true` 配一個連不上的 `rgs_url`，pixi stage 的節點數是 **0**：沒有畫面、沒有錯誤訊息、當然也沒有重播按鈕。已補上 try/catch（連同 `data.error` 的檢查），失敗時照樣渲染遊戲並跳錯誤視窗。

### 驗證方式（這批有實機跑過）

前三次改動都只靠 build 通過就回報，結果連錯位置都沒發現。這次用 dev server 實測，方法記在這裡以便重用：

Vite dev 會把工作區套件以 `/@fs/<絕對路徑>` 供應，app 自己的檔案則是 `/src/...`，**兩者是不同的 module id**。用對路徑就能在 console 裡 `await import(...)` 拿到**同一個** `$state` 實例並直接改它 —— 一開始我用 `/@fs/.../apps/GoBananas/src/game/stateApp.ts` 讀到的是複本，`loaded` 永遠是 false，差點誤判成資源載入壞掉。

pixi 的部分：`globalThis.__PIXI_APP__` 由 `InitialiseApplication` 掛上。瀏覽器面板沒顯示時 ticker 不跑，`worldTransform` 會全是 0 —— 要先 `app.renderer.render(app.stage)` 再讀 `getBounds()`。另外 `renderer.resolution` 是 1.25，所以 **stage 座標是 CSS 的 1280×720，不是 backing store 的 1600×900**；派送 PointerEvent 時直接用 stage 座標當 clientX/Y，不要再乘 `rect.width / canvas.width`。

實測結果（1280×720 stage 座標）：

| 元素 | x 範圍 |
|---|---|
| MULTIPLIER / 200x | 128–254 |
| WIN / $0.00 | 327–393 |
| replay 圖示 | 542–596 |
| REPLAY 字樣 | 610–685 |
| BET / $1.00 | 837–887 |

按鈕在 BET 左側，前後留白 149 / 152。點擊依序廣播 `soundPressGeneral` → `expandingWildsClear` → `resumeBet`。

### 5.54.1 本機重播測試台（`design/make_replay_harness.mjs`）

重播只能對著會服務 `/bet/replay/{game}/{version}/{mode}/{event}` 的 RGS 跑，而 Stake Engine 只對**真實存在的歷史投注**服務這個端點。等於整段重播演繹在本機無法測——而那正好就是連續改壞三次的地方。

做法：把 `build/` 複製成 `build-replaytest/`，在複本裡塞一個 service worker，攔 `/bet/replay/` 的請求並用 repo 裡 `src/stories/data/` 的真實 book 回應。**要上傳的 `build/` 完全不動**，複本已進 `.gitignore`。

用 service worker 而不是架 stub 伺服器，是因為 `rgs-fetcher` 把網址寫死成 `https://${rgsUrl}` —— 本機 stub 需要瀏覽器信任的憑證，而 worker 可以直接對跨來源請求回一個合成 response，只要 localhost 就夠。

```bash
pnpm --dir apps/GoBananas build && node apps/GoBananas/design/make_replay_harness.mjs
```

腳本會印出可直接開的網址（`gobananas-replaytest` 這個 launch 設定把複本服務在 4174）。目前有 base×5、bonus×3 共 8 個 book，含 x540 那手。`event` 參數是 book 陣列的索引，不是真實投注 id。

**已驗**：worker 確實攔截並回傳正確 book（`https://mock.local/bet/replay/GoBananas/1/bonus/1?lang=en` → book 217、70x、57 個事件）。

**未驗**：實際播放畫面。瀏覽器面板沒有顯示時貼圖載入不會前進（資源停在 17 atlas + 19 json，一張 PNG 都沒抓），所以在這個環境裡跑不完。**已排除是測試台的問題** —— 不含 worker 的純 `build/` 預覽卡在完全一樣的位置。要看播放效果得在真正顯示出來的瀏覽器裡開上面那些網址。

## 5.55 修：social 詞彙表重構漏掉一個變數，整個遊戲開不起來（2026-08-06）

症狀：供應商標誌畫面出現後就沒有畫面了。

真因是 `ModalGameRules.svelte` 的一行漏改。把 `T` 詞彙表抽到 `socialTerms.ts` 時，元件裡的 `const social = stateUrlDerived.social()` 被移除，但下面這行還在用它：

```js
const entryVerb = social ? 'Play' : 'Buy';
```

production bundle 裡 `social` 是未定義識別字，元件初始化就丟 ReferenceError。**代價遠大於一個彈窗**：Svelte 5 的 effect flush 被例外中斷，整棵樹後續的初始化全部沒跑 —— 沒有 canvas、沒有資產載入，連 `WildPartyLoader` 自己那顆 1.6 秒的淡出計時器都沒觸發，所以標誌就永遠停在畫面上。修法是把 `entryVerb` 也收進詞彙表（`pick('Buy', 'Play')`）。

### 為什麼 build 和守門腳本都沒攔到

- `vite build` 不做型別檢查，未定義識別字對打包器來說是合法的自由變數。
- `check_undefined_refs.mjs` **只掃模板引用**。而且它第 183 行有一條刻意的逃生門：「只要這個名字出現在 script 裡任何地方就放行」。這個 bug 正好在 script 裡，兩層都穿過去了。

### 診斷過程值得記的兩點

1. **「載入卡住」的假象**：一開始看到資源只抓了 40 個、一張 PNG 都沒有，我歸因成「瀏覽器面板沒合成所以貼圖載入不前進」。錯的 —— 真相是 `<Game>` 根本沒掛載。判斷關鍵是 `document.querySelector('canvas')` 為 null 而 WebGL2 明明可用。**先確認元件有沒有掛載，再談載入。**
2. **二分法比推理快**：`git stash push -u -- apps/GoBananas packages` → build → 測 → `git stash pop`，一輪就確定「是我的改動」；再還原三個檔案一輪就鎖定到批次。前面花在推敲 `page.url`、循環相依、service worker 的時間全是白費。

## 5.56 送審回覆：social 限制字第二輪（buy / cost）+ 加守門腳本（2026-08-06）

審核截圖標了 GAME RULES 社交版裡的 `Buy Bonus`、`cost`。掃過一遍發現不只截圖那兩處：

| 位置 | 一般 | social |
|---|---|---|
| Controls 條目名 | Buy Bonus | **Play Bonus** |
| Controls 說明 | The **cost** is shown | The **total** is shown |
| 買入區塊標題／內文 | Buy Bonus | **Play Bonus** |
| 買入 ticker | BONUS **BUY** ACTIVATED | BONUS ACTIVATED |
| superspin 說明 | （原本社交版就寫 "added up and **paid** out"） | added up and **awarded** |
| 重播卡片 | Total Bet Cost | **Total Play Amount**（原本社交版是 "Total Play **Cost**"，仍帶限制字） |

`buyBonusName` 刻意對齊 bar 上按鈕實際顯示的字 —— `i18nDerived.buyBonus()` 在社交模式回 `PLAY BONUS`，說明頁不能還叫它 Buy Bonus。

### 新增 `design/check_social_words.mjs`（已接進 `pnpm build`）

同一類問題連續兩輪被退（先是 pay，再來是 buy/cost），因為這些字散在沒人會重讀的長段文案裡。兩條可機械檢查的規則：

1. **模板裡的字面文字兩種模式都會顯示**，所以不得含限制字；要隨模式變的一律走 `{…}` 運算式。
2. **`pick(normal, social)` 的第二個參數**不得含限制字。

第 2 條當場就抓到 superspin 那個 `paid out` —— 那是先前那批漏掉的，截圖裡也沒標。

限制字表：bet/buy/cost/pay/payout/payline/wager/stake/gamble/cash/purchase/price 及其變化型。誤判只處理了一個：`Stake Engine` 是平台自己的名字，出現在必要的版權標示行，比對前先替換掉。

**這條檢查抓不到的**：從變數帶進來的字。它是保險絲，不是證明。

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
