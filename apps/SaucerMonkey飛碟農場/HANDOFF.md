# SaucerMonkey飛碟農場 交接

## 2026-10-23 使用者六項（Claude）

1. **讀取頁標題去底板**：`design/build_saucer_signs.py` 產 `logo_board.png`＝純字標（SAUCER 上拱、MONKEY 微凹；夕陽漸層＋下半網點＋深藍立體塊＋墨線＋米色外框＋淡綠光暈），無底板無小圖。字標填滿 1600×600，LoadingScreen 改 `LOGO_Y=0.19`、FeatureIntro 橫版寬度降到 520。
2. **觸發 FG 不丟東西**：TransitionAnimation 拿掉 mascotThrow 與飛出去的 gbL1（同 Putt 10-18），飛碟過場直接進。
3. **FG 牌**：同腳本產 `fg_intro/fg_total`：遊戲背景圖（intro=feature、total=base）在上方窗格，下緣用印刷網點散開進卡片紙紋，紅色雙線框住紙面，深藍外框；decor 圖寫空（不再有貼圖）。FreeSpinAnimation PAPER 改 `{100,536,1500,926}`、拿掉 FG_BOARD_DECOR、擺盪改 fgMotion.postcardSwing；Intro/Outro 照 Putt（紅字墨邊、stampSlam、totalPunch）。新增 `src/game/motionKit.ts`、`fgMotion.ts`（抄 Putt）。
4. **FG 小猴手破圖**（`design/arms/cut_arms.py`）：右臂舉高時前臂的手肘墊是袖口格子布、會轉到袖口下 → `fur_elbow`（手肘墊用前臂毛色補畫＋上墨，袖子切口也上墨）；右袖下殘留一條墨線 → `erase`；左手手電筒尾端原本切在前臂上、手腕一轉變紅色碎片 → 拆成獨立零件 `buttL`（掛 handL、畫在前臂上面），前臂該處補毛。check_seams 全過。
5. **升階動畫**（BanditMeter 重寫，`src/game/upgradeMotion.ts`）：在 FG 牌上演：低獎卡彈起 → 飛碟從右上俯衝（越來越快）撞卡、停格 60ms → CardShatter（從 Strike 搬來，新增 `carry`）碎裂＋FxBurst＋框震 → 飛碟彈起晃動懸停 → 光柱把乳牛放進空位落地擠壓＋光芒 → 階梯亮 → 飛走；右側 FG 小猴 Spine 播 control（手電筒打信號），結果播 cheer。曲線檢查加進 check_collection_motion.mjs。標題字 CROP CIRCLE! → SAUCER STRIKE!（comicPop 同改 KA-BLAM!）。
6. **HA 露齒**：`tools/build_cast_mesh.py` 新增 spec `teeth_hold`（Saucer 兩角色開）：第一聲 HA 到最後一聲消失都維持 laugh_teeth；Mascot 的 HA 字只在 animationName==='chestbeat' 時畫（被打斷就不再浮在閉嘴上）。

**同日第二輪**：FG 開場數字擺正（FreeSpinIntro 拿掉 -0.06 傾斜，只留 slam 的回正；升階 +N 也回正到 0）；FG 計數牌標題底色由亮綠改夜空藍 0x1f2a55＋綠細線。**FG 小猴手臂完全不動**（build_saucer_acting.mjs KID `armsStill`：連網格上臂都不 key）；手電筒改「鏡頭發亮＋短漫畫光芒」（cut_arms `light kind='lens'`，不再有光束），鍋蓋天線新增零件 `lightA`（紅球亮）＋`signalA`（左右三道電波，用骨頭 scale 一圈圈脈動），掛 mesh 的 antenna 骨；新片段 `ping`，Mascot 在 FG 的 winLinesShow 播它（主遊戲仍 nod）。第三輪加強：電波 4 道粗弧（r 32–98）、燈泡亮時星形爆光（bulb_burst）、脈動 0.7→1.3、ping 長 1.6s 四次脈衝。control（收集/升階畫面）＝鏡頭脈動＋天線電波循環。

art:build 已接 build_saucer_signs.py（在 build_saucer_art.py 後），整條重跑素材雜湊不變；build ✔ done。未上機。`gbChefCutIn`、`v8Stamp` 現在沒人用（仍在 assets.ts 預載）。

## 2026-10-17 BET 反灰、兩段 Turbo（Claude，使用者要求）

- **BET 字樣與下箭頭在不能改注時反灰**：新元件 `BetLabelDim.svelte`（掛在 Game.svelte）在轉輪中把 `uiTheme.betAccent.label` 換成 #67645c（＝+/- 停用時的灰），停輪換回；共用套件沒改。
- **兩段 Turbo**（圖示選 D 並排雙閃電，示意 `design/qa/turbo_two_tier_options_20261017.png`）：關 → 單顆實心 → 雙閃電 → 關。
  - 共用：`state-shared` stateBet 新增 `turboLevel`（1/2，關閉時歸 1）；`components-ui-pixi` 新增 `turbo.ts cycleTurbo()`（按鈕與 T 鍵共用）、`uiTheme.turboTiers`（預設 1＝原本開/關）、`turboKeylineColor`；UiButton 的 `tier` 2 畫雙閃電。`isTurbo` 在兩段都為 true，其他讀它的地方不變。
  - 本款：`turboTiers: 2`；print 外觀 keyline #2c3a66。Turbo 2 停輪用 `SPIN_OPTIONS_FAST_T2`／`SPIN_OPTIONS_TURBO_FREEGAME_T2`（轉速 ×1.2、輪間隔 ÷1.2）；乳牛收分在 Turbo 2 以 1.5 倍播放（Turbo 1 仍正常速度）。規則頁 Turbo 說明改三段。
  - 空白鍵長按、停止鈕仍只開關 isTurbo；放開後回到 Turbo 1。

## 2026-10-17 工具列微調（Claude，使用者要求）

- **BALANCE／WIN／BET 往上 8 單位**：Anton 數值字比標籤高，整塊下緣貼著工具列框。共用 `components-ui-pixi` 新增 `uiTheme.readoutOffsetY`（預設 0，其他遊戲不變），本款設 -8。
- **Turbo 開啟改成「深藍圓底＋閃電實心」**（使用者選 B，示意 `design/qa/turbo_on_options_20261017.png`）：共用 `UiButton` 新增 `uiTheme.activeByIconOnly`（預設空陣列），列入的按鈕開啟時不換亮底圖、不加填色與外框，閃電用框的顏色填滿。本款只列 `turbo`，自動旋轉仍用綠色開啟底圖。

## 2026-10-17 版面微調（Claude，使用者要求）

- **CONTACT LOG 移到 Buy Bonus 正下方**：`BowlingScoreboards.svelte` 從背景視差座標（貼螢幕左緣）改成共用 bar 的 standard 座標，x 對齊 Buy Bonus 中心（railWidth/2），y 接在乳牛腳下方 14 單位（依 buyBonusButtonScale／PlateScale／RailScale 計算，不寫死）。直式仍隱藏。
- **盤面框外圍的米白底板裁掉**：`frame_bg.png` 原本是滿版 1280 米色方塊，框外露出約 78px 白邊；`design/build_saucer_art.py` 新增 `frame_bg()`，Saucer 時以 frame_edge 外緣圓角（78..1203、r35，4 倍取樣抗鋸齒）當遮罩，框外透明。只重產這一張，沒重跑整支美術腳本；Putt 輸出不變。

## 2026-10-17 優化巡檢（Claude）

- **規則頁／付費表殘留**：「every Captain collects every **Record**」（爵士猴版名詞）三處改成 Cow；「Cows land … on its label」改成 their collar tag。Putt 同樣三處（Record→Ball）一併修。
- **規則頁 Buy Bonus 圖示**改用乳牛按鈕 `buybonus_cow/rest.png`，字落在紙牌上。
- **Q 字色**：`design/make_jade_mesh_layers.py` 的 INK 還是茶樓墨色 #1e1b1a，Q（唯一預烤的字母）比其他字黑；改 #141a33 重產。
- **載入量**：assets.ts 移除 10 個沒有任何程式引用卻預載的項目（logo_stamp、soy_full/empty、title_free/total、fx_leaf、shutter、door、noren、bananas.json），開場少約 0.7MB；圖檔本身沒刪。
- **送審文件**：`design/GAME_DESCRIPTION.md`、`design/cover/game_spec_en.txt`、`SPEC.md` 從保齡球版改寫成飛碟版（數字取自 config.ts）。`design/cover/`、`design/thumbnail/` 裡 Strike/Sushi/Swing/Turf War 的舊圖移到各自的 `_from_base_game/`，避免上傳拿錯。
- **守門**：check_social_words 補上 pixi `text="…"` 屬性規則（Diner 版移植），注入 BETS 驗證會報錯；刪掉重複的 paytable 鍵。
- `pnpm check:claims` 全過（C1–C9，有觸頂 10,000× 的局）。`npm run build` 通過（`design/build_20261017_polish.log`）。
- 未做：標題字型仍 Bowlby One；縮圖只有合成版（沒有分開的 tile BG/FG/logo）；內部名稱 BowlingScoreboards、未用的 strikeWins.ts/BannerMesh。

## 2026-10-17 Buy Bonus 改成「被吸起的乳牛抱招牌」（方案 S-B，Claude）

- 美術：從已核准的三格說明原稿 `intro_receipt_cow_v2.png` 裁出飛碟＋光柱＋乳牛抱紙牌（清掉艦長的手、訊號弧線、地面）。`design/build_saucer_buybonus.py` 一次產出去背圖與 37 張 384px 影格（`static/assets/sprites/sushiUi/buybonus_cow/`，256 色共 1.2MB）：rest、off（光柱暗）、idle×16、hover×9、press×10。動作用加權旋轉的位移場（頭、尾、兩條後腿、飛碟），**紙牌權重為 0、所有影格都不動**，因為字是共用按鈕排的。
- 程式：共用套件沒改。`src/game/buyBonusCow.ts` 在 uiTheme.ts 最後（三種 skin 之後）設定 sprites 與按鈕參數；滑過用共用的 `buyBonusHoverFrames` 一次播放並停在最後一格；`src/components/BuyBonusCow.svelte`（掛在 Game.svelte）換 sprite 對照表播待機（每 6.5–9 秒一次，選單開著、轉輪中、買入模式中、分頁隱藏時不演）、按下（開啟購買選單時，同時播在底板與滑過定格上）、轉輪中切 off。sprites 型別只列 4 個鍵，新增的鍵用 `as` 斷言，型別錯誤數不變。
- 文字：仍由共用按鈕排（BUY BONUS／社交 PLAY BONUS／DISABLE／翻譯），Bowlby 13.4px，BUY/PLAY BONUS 一行、長翻譯兩行，位置量在紙牌中心。合成驗證 `design/qa/buybonus_cow_states_20261017.png`、動態 `buybonus_cow_motion_20261017.gif`。
- 音效：按下時在原 `safe_open` 上疊 `saucer_beam`（0.45）。
- 舊的保齡球招牌 SVG（gbUiBuyBonus*）仍登錄但不再使用。`npm run build` 通過（`design/build_20261017_buybonus.log`）；未上機。

## 2026-10-17 使用者追加四項（Claude）

- **低獎字母不碰電視框**：`constants.ts` 新增 `LOW_LETTER_SCALE=0.78`／`LOW_LETTER_DY=-2/140`（量自 l1.png 奶油色螢幕 x120..395、y137..360／512）。靜態切圖（SymbolSprite）、中獎（SymbolWinAnim）、網格（SymbolMeshWin，root 縮放＋位移）、WinWays 小圖示全部共用。字母網格跳躍高度 22→6，整段動作頂點實測離螢幕邊 ≥5.7（256 畫布），靜止 ≥16。對照圖 `design/qa/low_letters_tv_{before,after}_20261017.png`。Q 字圖 `jadeMesh/l3_subject.png` 仍是純黑（其他字是 #141a33），本次沒動。
- **Turbo 不加速乳牛收分**：`BanditCollect.svelte` 虛擬時鐘拿掉 `isTurbo?2:1`。Turbo 仍縮短轉輪與中獎演出。動畫需求單 220／232 行已同步。
- **笑聲露齒**：`wp/tools/build_cast_mesh.py` 依 `cast_mesh_spec.py` 的 `teeth_split`（mg 237、fg 289）把 laugh_peak 的瞇眼＋grin 的露齒在鼻下 8px 羽化合成 `registered/laugh_teeth.png`，每聲 HA（laughTiming beats）切這張、+0.15s 回 laugh_rising。atlas 改 4×3 頁（2256×2748）。
- **笑時身體晃動加大**：`laugh_gain=2`：根骨每聲 HA 上抖 11px、隔拍以腳為支點左右搖 ±1.6°（根骨不變形），擠壓加倍；關節本身受破圖上限（軀幹 ±4°），配件幅度維持原樣（加大會在手與尾巴重疊處翻面）。自動縮放的誤差值改為翻面時仍可比較，不再卡住。Putt 沒有這兩個 key，重建結果不變。離線影格 `design/qa/laugh_teeth_{mg,fg}_20261017.png`。
- **獎圖網格更生動**：`meshWin/saucerWins.ts` 各圖一次性動作加大（蓄力更深、出手與回彈更明顯），都在 `--limits` 量到的破圖上限一半內；H2 頭盔、H3 錫箔帽多一個整體轉頭／調頻的傾斜；仍是一次動作後靜止，沒有循環晃動。`design/qa/mesh_wins_livelier_20261017.png`。
- `npm run build` 通過（`design/build_20261017_lowfit.log`）；未上機。

## 2026-10-17 動畫與音效覆核

- 收分音效按動作分段：飛碟有獨立週期吸力底音；高爾夫有碰球、草地滾動底音與 91% 動作進度的進洞音，抵達後才響加分音。收分停止／清理會結束循環音，並移除原本重複疊上的高爾夫杯聲。原創合成來源與格式在 `design/source/saucer/audio/collection/`；`audio:build` 已包含新腳本。
- 播放中的單次音效與複製音效即時跟隨靜音；隱藏頁面會暫停自訂播放器與 AudioContext，離開元件會清理複製音效、事件和循環聲。首次互動可恢復瀏覽器音訊。
- 實機抓到並修正：進度小圖直接設 Sprite scale 導致回到原圖大小、遮擋盤面；兩款字圖 +/$ 索引反置；飛碟升級船身與標題碰撞。字圖建置改以 v8Digits 的實際字元排字，不再使用另一份順序表。
- 技術驗收：`animation-audio-verification.log` 全套通過；後續修正型別與聲音門檻見 `animation-audio-final-checks.log`，最終打包 `animation-audio-final-bundle.log`。既有14項型別錯誤，無新增。
- `qa/audio-level-audit.json`：所有本款 PCM 解碼、無削波；兩首 BGM 約 -18 LUFS，真峰值 <= -1 dBTP。僅代表音訊檔技術品質，不等於人工聽感定稿。
- 本機假 RGS 上跑過觸發、轉場、兩收集者收分、兩段升級、免費遊戲結算與回主場景。縮短驗收情境 900010／最高獎 900011 僅放 `build-playtest`，不是正式數學。音訊觀測器、假資料不進 `build/`。
- 最高獎已實機觀測兩款6秒 `win_max.wav` 完整播放與自然結束，記錄 `qa/audio-max-browser-log.json`。長金額縮至版面46%安全寬，標題改深墨色並避開上方主題圖；升級獎勵牌手機尺寸與位置也縮回卡片內。
- 實際瀏覽器播放／停止記錄在 `qa/audio-feature-browser-log.json`；高爾夫已觀測20次進洞與20次抵達加分。靜音按鈕驗收在高爾夫 `qa/audio-mute-browser-log.json`。GIF 為無聲畫面，不能當成音訊錄音。

## 2026-10-17 收尾與使用者追加

- 三格說明頁最高倍率：使用者要求數字必須在紙上且清晰。依本款原稿紙面單獨量測位置，改用深色實心Anton數字；手機第三格插圖加大、說明移到右側。入口 `src/components/FeatureIntro.svelte`。
- 購買按鈕文字回到可見牌面內；背景記分牌避開購買按鈕，窄螢幕隱藏背景記分牌。
- 免費遊戲進度圖示換成實際W，不再畫保齡球瓶；手機上方專注顯示主題收集進度，剩餘局數由下方介面呈現。
- 升級表演已移除保齡球與斜切紙牌：飛碟以光束吸起低獎牌並轉換乳牛，高爾夫以球洞／球旗與滾球完成替換；保留原book事件與計量規則。
- 本機驗收腳本 `design/prepare_local_review.py` 產生 `build-playtest/` 與 `build-replaytest/`，以少量既有book檢查呈現。兩者均不屬於正式數學包、不應上傳；`build/` 不注入mock。測試目錄已排除於型別檢查和Git追蹤。
- 最終建置 `pnpm preview:build` 已通過（exit 0）：資產、音效、引用、文案、型別門檻、mesh、Spine flow、收分路徑、Vite及Spine壓縮。最高倍率桌面／手機實機截圖在 `design/qa/intro_maxwin_*_final.jpg`。
- 完整檢查紀錄 `design/final-verification.log`。型別門檻沿用底版；目前既有14項型別錯誤，無新增，不等於零錯誤。
- 使用者認為飛碟吐紙不自然；另做「被吸起的乳牛死抱巨型獎金紙牌」新版示意。沿用紙面清晰倍率要求，新稿與提詞另存 `design/source/saucer/intro/intro_receipt_cow_v2.png` 及對應prompt，原圖保留。2026-10-17 使用者核准新版，已接入第三格 MAX WIN；美術建置腳本使用 cow_v2 原稿，倍率以 Anton 原生排字對齊紙牌中心（0.669、0.657）、旋轉 -1.5 度。新版使用獨立 runtime 檔名 intro_receipt_cow_v2.png 避免舊圖快取；桌機1440×900、手機390×844皆驗收，截圖 design/qa/intro_cow_integrated_{desktop,mobile}.jpg。完整檢查 cow-intro-verification.log，最終素材路徑打包 cow-intro-vite.log 均成功。
- 收分動態驗收：`design/qa/saucer_collection_mobile.gif`。舊回放截圖不代表本次最高倍率排版的最終畫面。

## 2026-10-16 正式製作（Codex）

使用者已核准兩張風格稿並指示開始製作；其後追加飛碟「太空船吸上去」與高爾夫特色收分動畫，兩款均以專業動畫完成度為目標。

- 正式獨立符號、低獎底牌、背景、角色與8張表情、開場三格、購買海報、UI與封面已製作並替換runtime。原稿、prompt及原runtime備份在 `design/source/saucer/`。
- 低獎：實體雷達控制牌含旋鈕與雷達角標，程式排字保持清楚。
- 本款角色使用連續加權mesh，沒有沿用Strike切割片；動畫由 `design/build_saucer_cast.py` 重建，表情換圖僅更動內臉，身體與外輪廓保持註冊。
- 兩款分別產生自己的47支音樂／音效；音樂母帶與正規化紀錄在 `design/source/saucer/audio/`。動物聲為合成設計，非實錄。
- 專屬收分程式、虛擬時鐘、來源符號暫暗、多收集者、Turbo與逐顆抵達才加分已接入。詳見動畫需求單末節。
- 重建：`pnpm art:build`、`pnpm audio:build`；檢查及完整打包：`pnpm preview:build`。當次紀錄 `design/production-build.log`。
- 資產與前端正在遊戲內驗證；未宣稱上傳或送審完成。

## 2026-10-16 開案（Claude）

- 從 `StrikeMonkey保齡球館` 複製（Strike 的前端在 git 上是乾淨版本，含送審修正、BGM 修正、每手音效截斷、網格動態、觸頂數學）。Strike 的施工紀錄移到 `design/HANDOFF_from_Strike.md`，那裡寫的是保齡球版的歷史。
- game_id `SaucerMonkey`、dev 埠 3039（storybook 6039）、launch.json `saucermonkey-dev`。數學在 `math-sdk/games/SaucerMonkey飛碟農場`，junction `games/SaucerMonkey`（別刪）。
- 已換：玩家可見文字（英中日）、W=艦長 Captain、P=乳牛 Cow、S=金飛碟 Golden Saucer、買入 Close Encounter 100×／Mothership 150×、擬聲字、介面配色、Logo 文字、背景螢幕欄名；保齡球專屬音效 cue 已改名（見音效需求單「轉場與 FG」）。
- 以下為複製當下的歷史；正式資產已依上方施工紀錄替換。原始需求單：`SAUCER_美術需求單.md`、`SAUCER_音效需求單.md`、`SAUCER_動畫需求單.md`。
- `pnpm build` 通過（含全部守門腳本）。

## 還沒做

- 數學 books：只產了前端 config，**上傳前要跑** `run.py --books 100000 --threads 8`（約 12 分鐘），再跑 `pnpm check:claims`。
- 標題字型仍是 Bowlby One；換字型要重烘低分字母網格（Q／J）。
- `design/GAME_DESCRIPTION.md`、`design/cover/game_spec_en.txt`、`SPEC.md` 內文仍是 Strike 的說法，美術定案後改寫。
- 內部相容名稱 `BowlingScoreboards.svelte`（新版已替換視覺）、未使用的底版 `strikeWins.ts`、`FxBurst` 的 `'strike'` 分支等內部名稱未改，動畫需求單裡有對應的替換項目。

## 2026-10-18 art:build 人物還原問題（Claude）

- `art:build` 會跑 Codex 的 `build_saucer_cast.py`，它把 sushiMaster/sushiApprentice 的 Spine 寫回舊版（舊權重、6 拍笑、沒露齒）。已在它後面接上 `../../tools/build_cast_mesh.py Saucer`；重跑後 monkey.json 雜湊與現有檔完全相同，遊戲不變。

## 2026-10-18 笑聲對齊 10 拍 HA!（Claude）
- 笑臉動畫照 `laughTiming.json` 跑 10 拍（首拍 480ms、每 280ms、3650ms 收），舊 `saucer/voice_laugh.wav` 太短（≤1.45s）且無分明音節，第三個 HA! 之後無聲張嘴。比照保齡球猴重做。
- `design/generate_laugh_voice.py`（從 StrikeMonkey 移植，原創共振峰合成，讀 laughTiming.json）：10 聲各對一拍，每聲個別拉平音量、音高中段最高，尾巴吸氣；3.73s。本款音色：較高、帶 6Hz 小顫音的傻氣「嘿哈」（基頻 345Hz、/æ/、每聲 0.19s）。舊檔備份在 session scratchpad。改 laughTiming 後要重跑。接法未動；未上機聽過。
