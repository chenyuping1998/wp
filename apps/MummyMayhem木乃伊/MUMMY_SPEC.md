# MUMMY MAYHEM — 規格（2026-11-06）

從 GoBoomana 複製（前端 `wp/apps/MummyMayhem木乃伊`、數學 `math-sdk/games/MummyMayhem木乃伊`）。
`game_id` = `MummyMayhem`、套件 `mummy-mayhem`、dev **3051** / storybook **6051**、launch.json 名稱 `mummymayhem-dev`。
輪盤研究（兩個競品的逐秒節奏、龍王四級格子）：`E:\stake\proposals\輪盤雙機制\輪盤雙機制_整合研究.md`。

## 規則（使用者已確認）

| 項目 | 內容 |
|---|---|
| 盤面 | 5 輪 × 5 列，30 條固定連線（`game_config.py` `paylines`） |
| 符號 | H1–H4、L1–L5、W（百搭，5 個 W = H1 五連）、S（只在主遊戲） |
| 主遊戲 | 3/4/5 個 S → 10/12/15 次 FG，不能再觸發 |
| FG 倍率輪盤（SCARAB WHEEL） | 每局有連線必轉；值 2/4/6/8/10/12/14/16/32；取代目前倍數、只升不降、套用本局所有線、保留到 FG 結束；沒連線不轉也不歸零 |
| FG 輪盤互動 | 競品的「三選一猴臉」改成**一顆按鈕**；自動轉／Turbo 自動按，不按 3 秒後自動 |
| 稀有輪盤（SUN WHEEL） | 東海龍王四級 LEVEL UP 輪盤；主遊戲一局結束隨機出現（FG 之後），Hold & Spin 不會出 |
| Hold & Spin | 50× 獨立模式，GoBoomana 原樣（盤面變 5×5） |
| 買入 | 100× 買 10 次 FG；50× Hold & Spin |
| 激活（11-07） | 一直開著、每轉照倍數扣，按 Buy Bonus 按鈕關掉：**SCARAB5 5×**（主遊戲有連線就轉 Scarab Wheel，輪盤權重較重、平均約 7.5×）、**SCARAB10 10×**（每轉保證有連線＋轉輪盤）、**SUNBOOST 1.5×**（Sun Wheel 約 38 手一次；一般 257 手） |
| wincap | 10,000×（H&S 1,000×）；RTP 96% |

拿掉的：炸藥炸整輪、FG 階梯、三檔預存炸藥買入。

## 數學（math-sdk/games/MummyMayhem木乃伊）

- `run.py quick`：小量 books＋`check_books.py`（檢查輪盤規則與總額）；`run.py`：正式 10 萬本＋最佳化
- 事件：`multiplierWheel`（previous/value/eligibleValues，在 reveal 之後、winInfo 之前）、`rouletteInfo`（multiplier/level/path/amount，最後一筆贏分）
- 稀有輪盤在 base 有自己的 criteria `roulette`（最佳化器決定出現率，目標 1/360、RTP 6%）；FG 與買入局 3% 機率在結尾出
- 量測（2026-11-06 quick）：base 原始 0.598、命中 29%、FG 約 1/238 平均 69.9×、稀有輪盤 21.8×、H&S 50.9×、買入 104.7×、wincap 在 FRM 輪帶可達

## 前端狀態（11-07 美術／動畫／音效整合後）

- 已改：5 列盤面、連線顯示（`WinLines.svelte`）、FG 拱形輪盤（`FgArcWheel.svelte`）、稀有輪盤（`RareRoulette.svelte`）、事件處理、買入卡、規則頁、付費表、讀取頁提示
- 符號、拆層墓室背景、砂岩盤框、木乃伊貓、繃帶轉場、兩套輪盤、購買卡片、大獎牌與 68 檔取樣音效已整合；節奏數值在 `src/game/wheels.svelte.ts`。
- 交付、驗證與差異紀錄見 `design/MUMMY_DELIVERY_20261107.md`；原始生成提示見 `design/generated_sources.json`。舊素材已移出 static，保留於 design/source/legacy_boomana。
- 輪盤名稱已改：稀有輪盤 SUN WHEEL、FG 輪盤 SCARAB WHEEL（程式內部仍叫 RareRoulette／FgArcWheel）

## 下注列（2026-11-07）

照參考影片（`C:\Users\cheny\Videos\Captures\…08-15-56.mp4`，Paperclip Gaming《Private Jet》的 bar）重做，程式在 `src/components/ui/MummyBar.svelte`，由 `uiTheme.customLayout` 接上（共用套件只加了這個預設關閉的開關，並匯出 ButtonBetProvider 等行為元件）：
- 左邊黃色買入方塊（激活中顯示 ON，按下關掉）；深色浮動面板：選單（展開變 X、資訊／賠付表／設定＋音效／音樂滑桿）、餘額＋中獎金額、下注框＋等級進度條、上下箭頭
- 大白色旋轉鈕（轉動時圖示旋轉變灰；自動播放時變黑底顯示剩餘局數）、自動播放鈕（展開輪數面板 ∞/10/25/50/100/250/500/1000，選好按旋轉鈕開始）、Turbo
- 數值都從影片量（1920×1080 標準框）；買入圖示是佔位，**不使用對方的迴紋針標誌**
- 直式畫面改兩排（圓形按鈕一排、面板一排），按鈕不會縮到點不到
- 回饋只有顏色／狀態，沒有縮放（50fps 逐格量過）；字型 Nunito（`static/fonts`，OFL），`fonts.ts` 的 `BAR_FONT`
- 旋轉／自動播放圖示是兩道「尾細頭粗」的月牙箭頭（頭在 9 點半、3 點半），箭頭 90° 圓角、閃電斜切尖角，都照影片 8 倍放大描過
- 打開購買選單：bar 0.12 秒淡出，畫面底部中央出現深色膠囊（`ui/BuyMenuBetPill.svelte`：餘額／▼／下注＋等級線／▲），在選單裡就能改注額，卡片價格跟著變；原本標題旁的 +/- 已拿掉

## 文字與說明頁（2026-11-07）

- 讀取頁標題 **MUMMY MAYHEM**：MUMMY 繃帶米白、MAYHEM 綠松石稍微歪一點（好笑），深墓室綠描邊；進度條綠松石、提示字砂岩色；字型仍是 Titan One（本機已有；需求單建議的 Lilita One 要下載才有）
- 開場三格改墓室配色：FREE SPINS 砂岩、SCARAB WHEEL 綠松石、SUN WHEEL 太陽金；中間那格不再左右排（那是 Boomana 1:5 Wild 圖用的）
- 規則頁「Controls」改成第三版 bar 的六個控制項（`ui/BarIcon.svelte` 畫跟 bar 一樣的小圖示）；自動播放只選局數、Turbo 開啟是黑底金閃電；規則頁／付費表的金＋綠改成綠松石＋米白＋砂岩
- 付費表註解改寫 Scarab Wheel／Sun Wheel／H&S 上限；倍數顯示成「3 6×」
- 買入卡：拿掉 Boomana 的金庫／礦坑圖和金幣，改成程式畫的徽章（`ui/BuyEmblem.svelte`：青銅幣、Scarab 拱、聖甲蟲、全亮拱＋勾、太陽輪），墓室綠底＋砂岩地磚、外框砂岩；副標 CHOOSE YOUR CURSE。**PLACEHOLDER(art)**，美術到了換 §10 的卡片圖
- 預覽圖：`design/preview_bar_20261107/8～11`

## 美術上線後的檢查與修正（2026-11-07 下午）

本機沙盒（build 複本＋假錢包 service worker＋**數學真實 books**）＋headless Chrome（硬體 GPU）實際玩過：主遊戲中獎／空局、Sun Wheel、FS 觸發與買入、H&S、Scarab 5×／10×、Sun Boost，全部正常結算。修掉的：
- 背景白霧：`fx_vignette` 被生成成白色（疊在背景上 0.9）→ 改回暗色（`build_mummy_art.py` 也修）
- 小額中獎時「PRESS ANYWHERE」壓在 bar 上 → 只在大獎顯示、位置移到盤面下緣（`PressToContinue showLabel`）
- 跑分顯示四位小數 → `bookEventAmountToCountUpString`（Win、FreeSpinOutro）
- Scarab Wheel 等按時空白鍵沒反應 → 加 Space
- 人物 v3（`design/fix_mummy_joints.py`）：肩膀照圖擬合、頭以領口為軸（headBase 560／neckBase 610）、補繃帶脖子、領口另成一層蓋在手臂和頭巾上、去掉接縫的青綠描邊；mascot-rig 檢查全過；v2 備份在 `mascot_versions/`
- 高獎 H1–H4 改切圖模式（`design/cut_mummy_symbols.py` 切主體／底板凹槽／陰影；`src/game/meshWin/mummyActing.ts` 三拍 1.5 s：蹲→跳出框→落地壓扁→二次小跳，各有晚一拍的末端動作）；W、S、低獎仍是整張網格。離線逐格：`design/render_cut_wins.py`
- 背景：布條拆成 6 片各自以上方為軸慢擺（7–19 s 不規則）、6 把火焰用疊加光複本伸縮閃爍（`design/build_mummy_bg_motion.py` → `src/game/bgMotionParts.ts`、`MummyAmbience.svelte`）

- 第二輪（同日）：低獎 L1–L5 也走切圖模式（石磚本身就是主體、空底板＋影子；蹲→跳 9 px→落地壓扁→小彈，繃帶結甩，字母交錯左右傾）；W 半身像（整張網格）頭晚一拍點頭歪頭＋0.27 s 單眼眨；S 金面具三拍脈衝（中間最大）＋微傾＋金色光澤。全部在 `mummyActing.ts`，`check_mesh_wins` 全過；低獎沙盒實拍確認
- 第三輪（使用者：要圖案本身動，不是整塊動）：整塊只留 3 px／1.5 % 托底節拍，改由零件演：H1 雙眼眨＋兩耳先後抖＋貓爪拍兩下＋蝴蝶結甩；H2 瞇眼笑＋頭左右歪＋耳抖＋圍巾甩；H3 球心扭轉＋線頭／繃帶甩；H4 咬兩下＋眨眼＋魚尾拍；W 張嘴笑兩下＋單眼眨＋耳抖＋歪頭；S 藍寶石眼／聖甲蟲／領口寶石脹亮＋耳微動；低獎石磚不動、字母本身彈＋繃帶結甩。`check_mesh_wins` 全過
- 第四輪：用 `check_mesh_wins --limits` 量各零件安全轉幅，推到約八成：H3 球心 5°→12°、H2 歪頭 4°→6°、H1 貓爪加左右搖、W 耳朵 5°→10° 並加笑到下巴左右晃、S 聖甲蟲扭動、字母左右搖晃 6°；停輪落地已有一支整塊曲線，不再疊網格落地；人物 2 倍以上中獎就笑（笑聲仍 5 倍以上）
- 第六輪（使用者：不要聖甲蟲、要圖案本身跳，統一跳起轉一圈）：低獎字母從石磚切出（`cut_mummy_symbols.py` 的 `l*_letter.webp`，底板＝原石磚，凹槽留著），照高爾夫猴 strongLeap：蹲→跳 20 px、放大 1.1→空中左右轉一整圈（兩面都是正字）→落回槽壓扁→小跳；五個字母動作一致。`SymbolMeshWin` 保留移植自 Putt 的 `props` 欄位（目前無人使用）。讀取頁標題改回水平
- 連線改繃帶風格（`WinLines.svelte`）：米白繃帶＋焦褐邊＋斜纏紋、綠松石光墊底、中獎格綠松石圓珠（砂岩框）、一道亮光沿線跑一次；金額改砂岩王名框（cartouche）深色字
- 人物排程（眨眼、閒置揮手、大獎大笑）已完整，新動作要改共用 mascot-rig 動作庫，未動

仍待：Scarab Wheel 每次約 10 秒（照競品量的節奏，玩家按空白鍵可縮短）；實機聲音與手機效能沒驗。

## 需求單（2026-11-06）

- 美術：`design/MUMMY_ART_REQUIREMENTS.md`（主角木乃伊貓、正面、套版骨架）
- 人物圖層：`design/MUMMY_CAT_RIG_SPEC.md`
- 音效：`design/MUMMY_AUDIO_REQUIREMENTS.md`
- 節奏與動態：`design/MUMMY_RHYTHM_REQUIREMENTS.md`
