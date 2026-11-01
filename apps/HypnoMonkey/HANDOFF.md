# Hypno Monkey — 更新至 2026-10-28

## 2026-10-30 PP 掉落消除對照與報獎補強

已比對 workspace 的 `research/pp-transcripts`、`research/goo1000_rhythm/筆記.md`、`research/goo1000_motion/README.md` 與現有程式。10/27 筆記的「尚未套用」為歷史狀態：目前已實作逐顆掉落、觸底過衝、mark/rest/flash/burst/empty/refill、懷錶隨補位落下及連消尾端乘法算式。

本輪只補強 ScatterWins 的紫色脈動中獎框（第 3 節起金色內框）、金額彈出與字級；將 sfx_wild_explode 從 tumbleBoard 事件起點移至 TumbleLayer 實際碎裂點，避免比畫面早 restMs + flashMs。未修改數學、角色來源或既有掉落時間。

本機直式 mock baseWin 已播放並看到報獎框／金額，console error 為空；證據 `/Users/stone/stake-engine/research/hypno-tumble-1030/portrait-win.png`。refs、字串、social、素材、motion、symbol-idle、360 組懷錶時序與 presentation 檢查通過。完整 build 被既有 check_assistant_revision 的 leg_r_upper.png hash 不一致阻擋；另 check_tumble_rule 仍是 Windows E: 路徑／MedusaGaze／6 rows 的舊檢查，不能算通過。尚未完成本輪桌機、FG、快轉實機回歸或角色全動作驗收；未打包、未更新平台。

## 2026-10-28 Codex：第二輪 A–E 補修

最新來源／驗收見 `design/cast_fg/qa/repairs-r2/README.md`。兩腕與前臂碎線／缺口、右肘圓球凸出、兩膝重疊亮弧已修正，六張手勢一併收邊；大腿遮蔽端的短褲金色殘點也清掉。改的是既有來源產生器的取樣與重疊幾何，沒有重新生不同造型。既有官方 Spine 4.3 rig、bones、IK、slots、skins、十段動畫、joints、配方與 620ms 出手保持原值。

十動作 × 十一部位 × 四格共 440 組原生同格對照，以及 idle 0s／gaze_dud .56s／fg_end .60s 指定格；新舊都採 Pixi 相同的線性取樣，避免舊雙三次取樣造成 alpha 邊 RGB 過衝。原退件 FAIL 及歷史證據保留，沒有把數值 100 當目視通過。桌機與 375×812 十動作、320×640 甩錶／大獎／退場之實際畫面及最終 hash 見該資料夾。上一輪 15 次 FG 回歸屬歷史，本輪不冒稱重新跑完整局。

最新版 spine-motion 不再含舊 stand34 / stand-idle，不能對此來源直接重跑預設拳擊 character。純來源修訂改走 `sync_source_images.py`，保留官方 rig 並以真正 4.3 runtime 重出矩陣／預覽，詳細順序已更新 README。未修改工具 repo 或大盜猴樣板。

**仍待 Stone 最終美術確認、正式人聲／人群聲；未打包 upload、未更新平台。**


## 2026-10-28 Codex：16:10 退件來源修正完成

MG 四段袖子補畫衣褶與連續輪廓；FG 尾根、短褲腰側、領口、四段手臂、手腕、膝部／大腿與背心下擺修正來源重疊。FG 正式手臂採獨立解剖部件，淘汰夾帶肢體的整臂稿。保留原 joints、骨架、IK、動作鍵、尺寸與 throw 620ms。FG 16 張／MG 4 張修正來源同步到分層、組裝圖、Spine images、runtime atlas、GIF；正式 HTML 預覽與報告同步十段配方，模板報告另存。

FG 十動作 × 十一部位 × 四格共 440 格原生比較，29 個非錶鏈部件各為單一連通輪廓；MG 八動作、桌機／375×812／320×640 實際畫面已檢視。來源 checker 尾巴第三節 S 形內側 368px² 提示及歷史退件 FAIL 均保留；正式配方流暢度十動作為 100、0 errors / 0 warnings，數值不取代目視驗收。最終 build 通過；mock baseTrigger 正常速度完成 15 次 FG、結算 $145.70 並返回 MG（餘額 $1,144.70），console errors 為空。

同版證據／SHA256：`design/cast_fg/qa/repairs-1610/verification.json`；完整預覽：`design/cast_fg/preview.gif`。使用內建 ImageGen；最終手臂／身體提示詞：`design/cast_fg/source/generated-repairs-1028/FINAL_ARM_PROMPTS.md`、`BODY_REPAIR_PROMPTS.md`。仍待 Stone 最終美術確認，**正式人聲／人群聲待交；未打包 upload、未上傳或更新平台。**


## 2026-10-28 Codex：新版素材與 FG 助手已整合（人聲待交）

Stone 已確認沿用 FG 女助手造型與眨眼待機、甩錶、作廢噘嘴、小獎、大笑甩錶、鞠躬進出場。已完成32層與十段 Spine4.3 動畫，接入正式FG，MG原有修復保留；布幕遮住MG／FG換人。29張場景／介面／Loading素材、新紙片與催眠音效、MG／FG合成音樂、分層上架圖已製作。盤面仍為6×5。詳見 `design/demedusa_1028/README.md` 和 `design/cast_fg/README.md`。

實際mock baseTrigger完成15次FG與結算並返回MG；桌面／直式手機檢查與同版來源SHA256留存。角色正式男／女人聲與廣場人群聲仍待錄音，保持靜音。**未打包到upload、未更新平台，未宣稱全部需求結案。** 以下較早記錄為歷史，尤其「FG仍是梅杜莎」不再是當前狀態。


## 2026-10-28 最新：獨立驗收五項來源補畫

原 `QA_CLAUDE_1028.md` 的 FAIL 保留；後續記錄見 `design/cast_mg/QA_REPAIR_1028.md`。袖子改為曲線收窄與衣褶、尾巴補繪收進尾身並保持描邊、笑臉外陰影清除、插腰手收邊、右手腕碎線清除。三倍解析度同姿勢 before/after 與完整動作聯絡表在 `qa/repaired_1028/`。

joints、params、bones 與全部 animation keys 未改，未縮小動作或角色。同步重建 Spine images、runtime atlas、完整合成與 GIF，並以來源 SHA256 封存預覽。head_grin 僅清外側陰影，其他表情不跟著裁切，不再以五頭 alpha 全同作為視覺品質證據。

保留協作者的直式上半身構圖與 da72cccf 懷錶第一列／結算牌避讓；「只畫頭像」為歷史狀態，上半身不是誤顯示。FG 助手、馬戲背景及完整 UI 仍待換皮，未打包、上傳或更新平台。

## 2026-10-28 最新：每款圖騰要在靜止盤面獨立演出

依更新後 game-reskin 共用規範（2026-10-27 Turf 5.3 review），補上十款 ambient + act，非只有 1% 呼吸、落定或得獎動畫。程式在 `symbolIdleMotion.ts`、共用 `symbolIdleClock.svelte.ts` 與 `SymbolIdleAccents.svelte`；接到真實 ReelSymbol／SymbolSprite 靜止分支，含減少動態、隱藏分頁 dt、停用預告與得獎等狀態。

同時將 v5 保留的十種馬戲圖騰註冊為 runtime RGBA，來源 hash 及實際 alpha convex hull 見 `design/hypno-symbols-manifest.json`；暖灰盤底同步，paytable 名稱跟著實際圖片更正，數學賠率未改。這批風格尚未由 Stone 核准，不冒稱最終風格交件。

新增 `pnpm check:symbol-idle` 並接入 build：十款動作各異、ambient 可見、act 達幅度標準、28 組格子相位、120s 無縫及實際輪廓不出格。來源圖片有足夠演出邊界，未縮小角色或角色動作。`design/symbol_idle_review/` 有六個真實時間點、十圖騰原生畫面條帶與實際遊戲 GIF，四種比例及 MG／FG 截圖。

背景繼續使用原有神殿雲層／FG 火焰與事件碎裂，dt 已加 100ms 上限；這不等於馬戲團背景換皮完成。FG 助手、場景／盤框／標題／片頭／完整 UI 仍待換皮。未打包、上傳或更新平台。


## 2026-10-28 需求更新落地：6×5 示意與懷錶時序

新增 `design/board_preview_v5_6x5/`：正確 6 輪 × 5 格、暖灰盤底、全部十種圖騰、目前正式拆層男猴。用獨立背景／盤框／圖騰／角色／UI 真正合成，背景不烤角色；舊 5×6 示意保留為歷史。此圖非 runtime 截圖，未核准美術風格、未整款換皮。

已新增獨立銅／銀／金懷錶素材（`design/watch_art/`），取代實際載入的三色倍率球；空白錶面由 runtime 繪製 book 數字，文字 anchor 對齊錶面中心。桌機／320×640 實測補位與結算，證據在 `design/watch_review/`。懷錶補位與逐顆累加流程沿用 e15f99a6，不重寫已有功能。新增 `check_hypno_watch_timing.mjs` 並接入 build：核對正式 Spine throw 620ms、360 組 MG／FG 正常／快轉補位時序及 7 個 book 最終獎金單位。

實測發現本機 mockRgs 將 book 40 誤當 40x，畫面獎金卻是 0.40x；已將測試錢包與回傳 payout 的 book 百分之一單位換算修正。只改 dev mock，不改正式數學或平台。


## 2026-10-28 最新狀態（以下舊輪次為歷史）

男催眠師 MG 已完成 32 層程式拆圖／校正，官方 stand34 八動作及主遊戲整合。來源、Spine images、runtime atlas 與動作預覽統一；詳見 `design/cast_mg/README.md` 與 manifest。桌機／320×640 直式已查看八動作，mock 回合能結束且 console 無 error；建置通過。未縮小動作幅度來隱藏來源問題。

FG 助手、背景、圖騰、標題、片頭及其他 UI 仍有舊梅杜莎素材，尚待換皮；美術未冒稱 Stone 已核准。未打包、上傳或更新平台。實際最新 config 為 6 輪 × 5 格，沿用既有更正；沒有在本輪擅自翻轉盤面。


狀態：實作中。Stone 已選擇保留絹印風，要求角色更誇張、更有個性；據此修改雙角色，並新增 `ART_BRIEF.md` 展開正式製作需求。

## 最新：修正參考身份並重新學四款

- 使用者「1234」是六圖接觸表前四張：**Chaos Crew 2、Donut Division、Dr Zappo、Red Rascal**。先前誤讀成候選網頁的 1–4；**Toshi 不在本次選擇中**。
- 使用者認為原稿完全不像參考、AI 感重。V1–V3 和暖灰盤面均為歷史試稿，不得當成已核准風格。
- 已逐款重看完整畫面及角色／圖騰局部，拆解在 `design/style_study_four/STUDY.md`；機器可讀身份在 selection.json。研究接觸表只在 workspace research，不進產品或生圖參考。
- `ART_BRIEF.md` 新 §0 取消強制全圖固定七色／全平塗規則，改驗角色完整站姿、道具互動、材料、世界觀盤框與場景層次。沒有變更玩法。
- 第一張全景試樣偏童書插畫、細節紋理和柔化背景仍過多，已標 rejected，不能用作新方向證據。改以更集中的角色／道具小樣驗證。 角色／三道具測試已存 `design/style_study_four/focused-character-test.png`，只是方向驗證，並非認可的 style frame。

## 最新：盤底辨識度修正

- Stone 指出藍底與部分藍色圖騰混色；示意盤格及圖鑑底改為暖灰 `#B8B1A4`。最新成品在 `design/board_preview_v2/`，附 70px 同素材對照。
- 已核對：十種圖騰及背景／角色貼圖逐 byte 相同；主圖差異只在 6×6 格內。正式 runtime 尚未套用。

## 完整盤面示意

- 按 Stone 要求補齊 H2/H3/H4/H5/L2/L3/L4，連同 V3 的 H1/L1/S，現有全部十種圖騰概念圖。
- `design/board_preview_v1/HypnoMonkey-full-board.png` 是完整 6×6 背景盤面及下排全圖鑑；同目錄另有放大圖騰圖鑑、來源、提示詞、manifest 及處理後 sprites。
- 主盤面只放 MG 男角色；FG 助手在場外圖鑑參考區。圖為美術示意，並未宣稱正式 runtime、動作或平台更新已完成。

## 風格庫比對與 v3 改稿

- Stone 要求降低 AI 感；已看本機 `Toshi Ways Club`、`Donut Division`、`Le Bandit` 盤面，文字依據見 `design/style_test/characters_v3/REFERENCE_NOTES.md`。競品圖片只在 workspace research 中閱讀，未作生成輸入或遊戲資產。
- 雙角色改為瘦長臉老江湖／短寬臉機靈助手，半垂眼與歪嘴笑；頭形、表情和線條都變更，不只是壓色票。
- 禮帽移除複雜放射尖芒、票根／散付減少裝飾、懷錶移除捲紋並修完整鏈、背景減少群眾和微型細節，保持七件打樣同一方向。
- V3 來源、原始 image_gen 提示詞、處理後預覽與 hash 皆在 `design/style_test/characters_v3/`。`ART_BRIEF.md` 已同步最新方向。前兩版仍保留，不能拿舊預覽當新版證據。
- 僅為風格改稿，尚未完成正式分層／Spine／遊戲整合，未打包、未上傳及未更新平台。

## 本輪落地

- 依 `SPEC.md` 與 `design/STYLE_TEST_SCREENPRINT.md` 生成七件絹印風打樣，原圖在 `design/style_test/`。採內建 image_gen，沒有使用 API fallback。
- 票根第一稿多出猴臉、男角色第一稿裁到帽頂，已透過 image_gen 修改，舊稿以 `*-before-fix.png` 保留。最終七張檔案與 hash 在 `design/style_test/review/manifest.json`。
- `design/build_hypno_style_review.py` 可重建去綠幕、固定色票、亮／暗底聯絡表、70px 符號及 200px 商店尺寸試排。背景與非催眠符號排除紫色。程式不覆寫生成母圖。
- 購買模式文案改讀 `config.betModes.bonus.rtp`，修掉沿用一般模式 96.03% 的錯誤。規則及購買說明現在顯示 bonus 96.06%。
- 訊息列改短版倍率提示，移除各語系的梅杜莎姓名。
- 手機盤框標題改靠左留角色空間，旋轉／版面切換時更新；桌機保留置中。

## 雙角色造型修正 v2

- Stone 的方向選擇已記錄於 `design/style_test/CHARACTER_REVISION.md`，完整後續規格見 `ART_BRIEF.md`。
- 新母圖與本次實際 image_gen 提示詞放 `design/style_test/characters_v2/`，不覆寫第一批母圖。
- 男猴加強歪帽、翹鬍鬚、大小眉與咧嘴笑；女猴加強挑眉、眨眼、開口笑與留白倍率懷錶。女猴另修羽毛構圖與髮色雜點。
- 本次重建指令：`python3 design/build_hypno_style_review.py --source design/style_test/characters_v2 --label V2 --status character_revision_review`。目前 `characters.jpg`、`contact.jpg`、`size-check.jpg` 和 `board-mockup.jpg` 為同一批來源；每張來源 hash 在 `review/manifest.json`。
- 這次只變更造型來源、需求文件及 review 工具，尚未把新頭肩圖冒當完整角色 rig 裝進遊戲。

## 驗證與限制

- `pnpm build` 全流程成功：數學同步、字串、social、素材、動態、背景、倍率與音效檢查皆執行。這些原有動態檢查驗的是梅杜莎模板，不能當作新猴子動畫驗收。
- 本機 `?mock=1` 已啟動並查看約 320px 寬手機盤面；標題與模板角色頭像間有間距。規則 DOM 實際讀到一般 96.03%、購買 96.06%，購買模式段落也顯示 96.06%。
- 盤框 scene 檢查 desktop → portrait → desktop，位置會隨版面回復。
- 未執行新角色的六動作驗收，因為本批只有頭肩打樣，尚無正式全身拆層。不得把這批當成角色動作交件。

## 尚待完成

1. 依 `ART_BRIEF.md` 製作正式圖層；Stone 的角色方向修改已記錄，毋須再次詢問是否保留絹印風。
2. 正式九款得分符號、散付與三階懷錶、MG/FG 背景分層、兩位角色全身與乾淨拆層、UI、片頭、縮圖與封面。
3. 新角色依 spine-motion-kit 能力選擇合適骨架／配方；目前側面拳擊自動模板不能直接硬套催眠姿勢。
4. 整合催眠、紙片撕裂、懷錶倍率、助手 FG 演出，清掉梅杜莎素材與文字；桌機及手機完整實玩驗收。
5. 驗收通過後才打包到 `/Users/stone/stake-engine/upload/HypnoMonkey/`。

`review/board-mockup.jpg` 是三個打樣符號重複排成 6×6 的美術示意，**不是遊戲截圖**。目前 runtime 仍使用梅杜莎素材，不可宣稱整款完成或可送審。此次沒有打包、上傳或更新平台。


## 2026-10-27 整體盤面示意 V3

使用者要求整體盤面示意圖，已完成 `design/board_preview_v3/HypnoMonkey-overall-board.png`。用自有最新全身角色小樣作生圖參考，未使用競品圖片；暖灰 6×6、全部十種圖騰、完整男角色、場景與控制列已目視核對。概念圖而非 runtime 截圖，未定稿、未分層或接入遊戲。提示詞與來源記錄在同資料夾。


## 2026-10-27 5×6 概念與背景／角色分開

依使用者要求，`design/board_preview_v4_5x6/` 新增 5 欄 × 6 列整體示意、純背景、獨立 RGBA 男角色。目視核對 30 格及十種符號；純背景無角色與盤面；透明角色在亮暗底檢查未見場景殘留。三張是生圖變體，預覽非獨立素材逐像素合成，未宣稱 rig 同版本。後續需以獨立角色層合成，禁止把角色燒入背景；此輪只改概念圖，正式遊戲 math/runtime 仍未改為 5×6。

## 2026-10-27 更正：盤面是 6 輪 × 5 列（Claude）

Stone 更正：「5X6 是 5 列 6 行」＝ 5 列（橫）× 6 行（直）＝ 6 輪、每輪 5 格，跟 Gates of Olympus 一樣。之前的「5 欄 × 6 列」是看反了。math（math-sdk/games/hypno_monkey）與前端 INITIAL_BOARD 已改回 6 輪 × 5 列；`design/board_preview_v4_5x6/` 的盤面概念圖是 5 欄 × 6 列，需要照 6 欄 × 5 列重出。

## 2026-10-28 Claude：MG 32 層獨立驗收＋直式構圖

- `design/cast_mg/QA_CLAUDE_1028.md`：**不通過**，5 項要補畫——手臂水管＋圓球關節、尾巴接點鼓包、`head_grin` 下巴外陰影殘片、`hand_l_hip` 毛邊、右手三張手腕碎線。證據在 `design/cast_mg/qa/claude_1028/`。
- 直式手機改成 Capo 式上半身：`HypnoCastView.svelte`（放大 0.5、腰部以下用遮罩藏在盤框上緣 y=-34 後面）、`hypnoCastScene.ts`（拿掉「直式只畫頭帽鏡」的過濾，新增 `setHidden`，直式藏尾巴）。這兩個檔案是 Codex 還沒提交的，我沒有提交，請一併收進去。
- 懷錶優先落第一列，蓋到結算牌的會先往上移（commit da72cccf）。

## 2026-10-28 Claude：清除梅杜莎（不需新圖的部分）＋需求單

- 需求單：`ART_REQUEST_DEMEDUSA.md`，逐項列出還需要新圖或新音效的梅杜莎素材（背景、盤框、介面牌、大獎牌、FG 女助手、MG 手臂補畫、人聲、音樂、上架圖），附尺寸與新檔路徑。盤面是 6×5，ART_BRIEF 裡的 6×6 以需求單為準。
- 已改（commit 3abbe2ba）：文字全面換成 Hypno Monkey／催眠師／Hypno Spiral；中獎改成淡紫加螺旋、碎片保留原色；特效綠色改成紫色；梅杜莎人聲、蛇聲、石頭聲先靜音；Loading 字標與三張卡片改用過渡版（`design/interim/build_loader.py`，素材在 `static/assets/sprites/hypnoInterim/`）；favicon 改成螺旋。
- 注意：rules／paytable／betModeMeta 連同 Codex 先前的文字修改一起提交了。MedusaThrow 沒有提交 Codex 的 symbolIdleClock 那兩行，那部分還在工作區。

## 2026-10-28 下午 Claude：驗收 demedusa_1028 交件

- 背景、道具、木框、介面牌、大獎牌、字標：亮底／暗底乾淨，直式 MG／FG 實玩正常。
- `hypnoUi/fs_counter_panel.png` 底下有一排半透明雜點（約 2400 px），我已就地清掉；請把同樣的清理放進 `design/demedusa_1028/build_assets.py`，不然重建會再出現。
- 直式 FG 總倍率牌原本壓在新字標上，已移到 FREE SPINS 次數牌左邊（commit 086bf0f6）。
- 還沒交的：FG 女助手（只有母圖 `source/fgMasterClean.png`，還要拆層＋stand34）、MG 手臂補畫、三張正式開場卡片（目前用過渡版）、FG 聚光燈、人聲／音效／音樂、上架縮圖與封面。FG 角色目前仍顯示梅杜莎。

## 2026-10-28 深夜 Claude：第一次打包（upload/HypnoMonkey）

- `design/ship.sh`：同步數學、建置、複製前端，刪掉沒載入的梅杜莎素材資料夾，再做上架圖和檢查。只打包，不壓縮檔（要的話加 `--zip`）。
- `src/game/assets.ts`：拿掉兩個沒人用、卻還在預載的梅杜莎素材：`mgCastAtlas`（梅杜莎角色圖集，`MedusaRigView` 已沒有任何地方引用）和 `mgBgFlame`（神殿火焰）。這個檔案混著 Codex 未提交的修改，所以這兩處刪除沒有提交，請連同 Codex 的部分一起提交。
- 上架圖：`design/store_upload/build_upload_store.py`，跟其他遊戲同一套格式。
  - 縮圖 1024²：背景層＋催眠師半身＋Silverstars logo。
  - 封面 1920×1080：背景層＋兩個角色。
  - 都不放字標。`demedusa_1028/store` 的 200×200 版沒有用。
- 打包後仍留在包裡的內部名稱：`medusaFx`、`medusaUiIcons` 資料夾，`audio/medusa` 的共用音效，事件名 `soundMedusa`，console 前綴 `[MedusaGaze]`，`petrify` 屬性名。玩家看不到也聽不到，之後一次改名。

## 2026-10-30 前端 v6 已上傳發布

完整 pnpm build 與打包 sanity checks 通過；先前 FG 來源版本不一致已由最新素材同步解除，32 層來源／Spine／runtime／預覽雜湊一致。上傳 5 檔、刪除舊 bundle 1 檔、186 檔不變，共 7,611,674 bytes；重新 plan_upload 為 0 actions。publish 回傳 front v6，get_game 再查已確認。數學 plan_upload 為 0 actions，保留 math v1；三模式合規 PASS（96.03%／96.06%／96.08%）。縮圖／封面已重建並納入 upload；此次平台操作是前端發布，未另更新商店圖片。此為版本發布，非新增送審；完整官方逐項動態稽核與上一輪提及的桌機／FG／快轉回歸仍不能冒稱已完成。
