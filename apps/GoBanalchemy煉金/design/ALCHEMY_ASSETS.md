# Go Banalchemy 美術交接

## 現行人物（2026-10-16）：Boomana 分件換裝 v3

依使用者指定，直接複用 `GoBoomana` 的人物分件、關節與動作，再換成煉金裝扮。本節取代下方單張 `alchemy_body` 角色與等待新版 PSD 的做法；獎圖、背景、文字、音效的其他改動照常保留。

- 遊戲仍載入 `static/assets/spines/goBananasMonkey/monkey.json`／`monkey.atlas`，圖片為 `monkey.png` 與新增的 `alchemist_parts.png`。骨架 hash 是 `gb-alchemist-boom-v3`，目前有 23 個可見獨立部件、10 種動作。手臂和軀幹分開，沒有全身共用皮膚。
- 原 Boomana 的骨頭父子關係、位置與設定角度保留；上臂、前臂分件沿用各自骨頭。柔性頭部與外套下襬另外使用網格；護目鏡、下巴、眨眼、香蕉、衣物及瓶罐跟隨各自關節／附屬動作。燒瓶與衣襬使用有界關鍵影格，避免急動時自由物理把部件甩離身體。
- `chestbeat` 保留原六下節奏，用固定骨段長度的雙關節解算，把左右可見手掌對到胸前。只是肩、肘旋轉，不拉長手臂；設定姿勢的關節未移動。投擲沿用 Boomana 的蓄力與甩臂，再整段重排到 380ms 離手，配合現有藥霧轉場。
- 可編輯來源、生成原稿、獨立 PNG、原版骨架與原版分件在 `design/source/boomana_reskin_v3/`。`assembled_rest.png` 是檢視用合成圖，遊戲不使用它。替換前的煉金人物完整保存在 `design/source/pre_boomana_v3/`。Boomana 原專案未修改。
- 使用內建 image_gen 做換裝、頭部眨眼及外套／燒瓶素材；提示與輸入角色在 `design/source/boomana_reskin_v3/PROMPTS.md`。`skin_manifest.json` 記錄來源與 atlas 尺寸。

- **捶胸重做（2026-10-16 晚）**：原本每一下只把出拳那隻手拉到胸口、兩下之間又掉回垂手（每隻手 0.38 秒上下約 220 單位，另一隻手還垂著），像活塞。`retarget_boom_chest.mjs` 改成：蓄力時（0.12–0.42s）兩手一起抬到胸前預備位，交替出拳時出拳的手加速拍到胸口、另一手往外退開蓄力，最後一下（1.98s）後一起放下。預備位 L(-85,124)／R(92,133)（手臂父空間）；再拉開會把右上臂袖子擠到 50% 以下。六下仍精準落在胸口（誤差 0px）。
- **漫畫撞擊**：`Mascot.svelte` 的撞擊星星與速度線重新掛回畫面（之前被拿掉），位置改成實測手掌落點 R(76,531)／L(-37,532)（骨架單位），半徑 62；每一下另外丟出一個擬聲字（BAM!／THUD!／POW!／BOOM!，Titan One 金字黑邊），往出拳那一側飄出淡掉。改了捶胸節奏或落點要同步改 `IMPACT_AT` 與 `BEAT_START_MS`／`BEAT_GAP_MS`。

重建 v3：`node design/prepare_boomana_reskin.mjs`（備份並準備參考）→ `node design/install_boomana_reskin.mjs`（裝配、綁骨與捶胸接觸重定向）→ `node design/measure_alchemist_cues.mjs`（從實際 `prop` 骨頭量測離手點）。新版不用舊 `refine_alchemist_motion.py`／`alchemist_blink.py` 重建，這兩個工具只適用舊全身網格。

驗收：`node design/check_alchemist_mesh.mjs` 依 v3 骨架選擇分件檢查，使用遊戲實際 Spine runtime 掃描一般與加速演出、附屬動作、眨眼、所有可見部件、骨段長度、肘部屈曲與六下掌心／胸部接觸。`/art-review` →「人物動作」可顯示關節、暫停及拖曳時間逐格檢視。最終數值以建置檢查輸出為準。

## 現行版本（2026-10-15）：煉金重繪、局部演出與人體關節

本節取代下方 2026-10-04 的切圖／整個主體翻轉流程。

- 14 張獎圖以原有構圖重繪，收斂高光、紋理與細碎亮點。原始生成圖保存在 `design/source/repaint_v2/`，替換前資產在 `design/source/before_repaint_v2/`；遊戲內使用 512px 素材。
- H1–H4、W、S、L1–L5 使用固定外框的 panel 網格。藥液／香蕉、水晶、夾爪／寶珠、蒸餾器、護目鏡／下巴及字形筆畫分別演出；移除整個主體翻面與全板縮放。一般落輪也使用 360ms 局部演出，靜止獎圖不再整塊呼吸縮放。
- `game/potionVapor.ts` 提供 1–5 輪的確定性時序。`ReelBlast.svelte` 用多層柔邊藥霧覆蓋，完全不透明時才換圖，保留 Scatter 並檢查取消世代；移除裂痕、碎石和膨脹底板。全盤與模式切換也改為煉金反應的表現。
- `design/generate_audio_alchemy.py` 產生 86 段原創合成立體聲音效／音樂（44.1kHz、16-bit PCM），包含玻璃共振、氣泡、氣壓與 D Dorian 配樂。播放使用 Web Audio，支援多音、無縫循環、背景樂交叉淡化、反應時壓低音樂、設定音量同步與取消中的迴圈載入；不再回退到叢林聲音。音量與循環資訊在 `static/assets/audio/alchemy/mix_manifest.json`。
- 人物保留 1305 頂點的單一網格，重新分配上臂／前臂／手掌、腿／小腿／腳的權重，平滑關節附近的權重梯度，並對齊畫面上的肩肘腕。九種動作重排節奏，重建 Spine 4 的絕對座標貝茲控制點，避免縮小關鍵影格後中間幀仍沿用舊拉伸幅度。肢體長度允許範圍為設定姿勢的 95%–105%，所有有圖像的三角形面積必須維持 50%–160%，禁止翻面。
- 投擲離手為 380ms；`design/measure_alchemist_cues.mjs` 從實際加權手掌位置產生 `game/alchemistCues.ts`，人物、轉場道具與聲音共用此時序。調整人物後建置會自動重新量測。
- 本機檢視：執行 `npm run dev` 後開啟 `http://localhost:3021/art-review`。可切換中獎、待機、藥霧、人物八種主要動作、關節顯示及音效試聽。此頁只在開發模式提供檢視功能。

重建順序：`node design/install_repaint_v2.mjs` → `python design/refine_alchemist_motion.py` → `node design/measure_alchemist_cues.mjs`。音效另外執行 `python design/generate_audio_alchemy.py`。人物腳本從備份讀取，重跑不會累積增幅；Python 需 numpy。

驗收：`npm run build` 包含資產、音效、型別基線、所有網格、人物物理／肢體長度、待機落輪，以及 `check_alchemy_presentation.mjs` 的不透明換圖、固定邊界與 WAV 音量／循環檢查。型別檢查沿用專案既有基線，並不宣稱整個專案沒有既有型別錯誤。

本專案由 GoBoomana 複製。遊戲 ID 是 `GoBanalchemy`，前端開發埠為 3021。

## 人物

- 可編輯 PSD：`design/source/GoBanalchemy_alchemist.psd`
- 高解析原稿：`design/source/alchemist_mascot_v1.png`
- 遊戲骨架：`static/assets/spines/goBananasMonkey/monkey.json`；新增 `alchemy_body` 加權網格，沿用 Boom 的九種骨架動作。舊礦工附件在設定姿勢中隱藏。
- 驗證：`node design/check_alchemist_mesh.mjs`，檢查所有動作的網格翻面及靜止姿勢。

## 獎圖與場景

- `static/assets/sprites/goBanalchemySymbols/`：H1–H4 高分圖分別是綠、紫、青、琥珀主色；L1–L5 用低彩度陶瓷底和黑字。W、S、B、P、X 都已換成煉金主題。
- `static/assets/sprites/goBanalchemyBackground/`：一般、免費遊戲、Hold and Spin 三張背景。
- `static/assets/sprites/goBananasFrame/`：新銅管與綠寶石盤面框，素材鍵沿用原遊戲以保留佈局與盤面動態。
- `static/assets/sprites/goBananasUi/`：主 UI bar 與 Buy Bonus 按鈕面板。
- `static/assets/sprites/goBanalchemyUi/`：Bonus Buy 卡牌場景、試劑與金幣插畫。

`src/game/assets.ts`、`src/game/uiTheme.ts`、`src/components/ui/ModalBuyBonus.svelte` 已接入上述素材。

## 建置

在本專案執行 `npm run build`。目前透過本機 `node_modules` junction 共用 Boom 的工作區依賴；若換機，請依工作區方式重新安裝依賴。

## 網格動態（2026-10-04）

- **得分不再有亮光**：`SymbolMeshWin.svelte` 拿掉整圖加法閃光、掃光、光暈、光束、發光粒子、外框流光、角落星芒；`ImpactDust` 拿掉加法地面閃光。舊的 `*_glow / *_sheen / h3_plate…` 圖層已從 `assets.ts` 移除。
- **每個得分獎圖各自的網格動作**（全部 panel 模式，照新畫作重描）：`h1Lantern`（燈籠搖、藥水晃、香蕉轉）、`h2Crystal`（兩側水晶張開、主柱膨脹）、`h3Tongs`（夾子開合兩次、法杖寶珠充能）、`h4Cart`（礦車蹲跳、燒瓶晃、銅線圈彈）、`wGorilla`（護目鏡彈起、咬香蕉）、`sMedallion`（圓章搖、香蕉串跳）、`lowLetters`（座標微調）。`landS`、`landB`、`coinP` 也改成新圖座標。
- **待機小動作**（移植自 Boat）：`meshWin/idles.ts` + `game/idleDirector.ts` + `IdleDirector.svelte`；`Symbol.svelte` 讓靜止可見格子登記。
- **背景**：一般背景左右兩盞壁燈搖晃（`bgProps.ts` 的 `BG_BASE` / `BG_BASE_R`，`Background.svelte` 掛載）；免費遊戲背景沒有懸掛物，不做。
- **人物飄動**：`design/alchemist_flow.py`（由 `build_alchemist_mascot.py` 呼叫）把身體網格加密到 28×44，新增 `coatL1/2`、`coatR1/2`、`flask`、`vials`、`goggles` 骨頭，並把香蕉、下巴畫進網格；物理 14 條各自 order，`flutter` 軌加關鍵影格。飾品只接手「非手臂」權重（手臂權重保留），否則捶胸/丟東西時拳頭邊緣會被扯開。
- 驗證：`check_mesh_wins.mjs`（含待機動作）、`check_alchemist_mesh.mjs`（跑物理＋flutter，量飾品三角形與擺幅）都已接進 `npm run build`。離線渲染：`design/render_mesh_wins.py`。本機沙盒（假登入）確認可開機、待機動作與背景燈籠實際有播放；**中獎動作未在實機轉過**（沙盒不能轉）。

## 第二輪（2026-10-04）：背景清晰、圖案本身跳

- **背景清晰**：`Game.svelte` 拿掉背景模糊濾鏡（原 0.6／1.0）；三張背景用 Lanczos＋輕銳化離線放大到 1920×1080（原圖備份在 `design/source/backgrounds_1672/`）。
- **格子不動、圖案跳**：`design/make_alchemy_layers.py` 把 H1–H4、L1–L5 從底板切下（底板補洞，光暈一起挖掉重補），S 圓章本身就是去背主體；輸出 `static/assets/sprites/goBanalchemyMesh/{n}_plate|subject|shadow.png`，已加進 `assets.ts`。
- 各獎圖改成切圖模式（cut）：主體整個跳起（`meshRig.leap`），空中招式——H1 後空翻、H2 像卡片翻轉、H3 繞交叉點轉一圈、H4 像衝下坡的礦車點頭、S 像拋硬幣轉兩圈、字母跳起懸停；落地壓扁＋小二次彈，底板上有影子。W 猩猩是滿版肖像無法切，仍在格內演但不再整格震動。
- `SymbolMeshWin.svelte` 拿掉整格放大／彈跳與 `highJump.ts`（已刪）。`meshRig.settled` 收尾前先把角度取 360 餘數，否則翻完會倒轉一圈。
- 改了美術要重跑：`python design/make_alchemy_layers.py`，再跑 `node design/check_mesh_wins.mjs` 與 `render_mesh_wins.py` 看圖。

### 藥液預熱沸騰
`reagentBoil.ts` 與 `reagentBoilLayer.ts` 共用玻璃區域網格及上升氣泡，瓶框、銅管與繩索固定。B 獎圖、輪軸預熱、人物投擲藥劑皆使用同一圖層；預熱提高沸騰強度，煙霧遮蔽後換圖。`/art-review` 的「藥液沸騰」可放大檢視。`check:alchemy` 同時驗證玻璃外頂點固定、三角形面積及氣泡遮罩。

### 得分動作加強（2026-10-15）
`meshWin/winEmphasis.ts` 對得分演出分部位加大約 1.45–2 倍的轉角／位移，保持 frame 與整張獎圖的 rigid transform 固定。H1、H3、H4、W 的權重做空間平滑，避免放大動作後局部折痕；液體、臉部與接近邊框的部位另設較低增益。落輪沿用原始 pose，得分幅度獨立調整。幾何門檻維持原本 50–160% 面積、零翻面與連續性檢查。

人物肩部／前臂演出加大約 30%，投擲的蓄力、出手與軀幹轉動加強，手臂不使用 translate／scale。投擲釋放點須以 `measure_alchemist_cues.mjs` 重新量測，維持藥劑從手中飛出。`check_alchemist_mesh.mjs` 繼續限制骨段長度偏差 5%、肘部轉角 35 度及所有身體三角形的變形範圍。

### 第三輪（2026-10-16）：獎圖加大、藥水沸騰、人物飄動
- **獎圖整個跳起**：panel 模式內部彎折幅度有限，改用重繪後的畫作重切圖層（`python design/make_alchemy_layers.py`；燈籠玻璃內暗紋用 `SOLID` 橢圓補洞、字母底板的殘影已處理；`LAYERS_OUT=<資料夾>` 可先輸出到別處檢查）。`meshWin/leapWin.ts` 只包中獎（H1–H4、S、L1–L5）：主體離開底板跳 22–28px、空中放大 6%、傾斜 7–13°（不翻面），落地壓扁＋二次小跳，部件動作照舊。落輪與待機仍是 panel。W 仍是 panel。S 在 cut 模式下不能再放大香蕉串位移（會擠壞圓章面），`winEmphasis` 的 S 增益設 1。
- **藥水沸騰**：`meshWin/potionBoil.ts` — H1 燈籠藥液、H4 三個燒瓶冒泡（從底部升起、變大、到液面破成漣漪），氣泡與玻璃遮罩都經過網格插值，跟著跳躍與晃動；液體骨頭（`elixir`、`load`）同時翻滾。中獎全力、落輪／待機小滾。B 本來就有 `reagentBoil`。
- **人物飄動加大**：`refine_alchemist_motion.py` 的 `FLOW_GAIN`（衣擺、燒瓶、試管、護目鏡 1.5–2 倍，物理放鬆）；左衣擺靠近左拳，增益保守。

### 第四輪（2026-10-16）：眨眼、衣服、背景
- **眨眼**：`design/alchemist_blink.py`（由 `refine_alchemist_motion.py` 呼叫）。眼睛只有約 20×12px，比身體網格的一格還小，所以眼皮是用眼周膚色「畫」出來的（半閉／全閉兩張，`alchemy_lids.png`，圖集多一頁）。`lids` 網格的每個頂點都是身體網格同位置頂點的複本（權重相同），任何動作下都貼在臉上（檢查量到 0px）。`blink` 動畫在 Mascot 的 track 2 循環 5.6 秒（單眨＋雙眨）；它每幀都會設定 `lids` slot，所以其他動畫不能 key 這個 slot。
- **衣服**：新增 `flapL`（左前襟，從腰帶垂下，在左拳旁）與 `skirtR`（右側燒瓶後方的內襯下擺），兩根都有物理與 flutter 擺動；手臂權重保留。refine 開頭會重新呼叫 `flow.add_bones()` / `add_motion()`，備份的骨架才會有新骨頭。
- **Hold & Spin 背景吊燈**：`bgProps.ts` 的 `BG_VAULT_L/R`，兩盞籠燈慢慢擺（4.5°）。
- **背景玻璃器皿冒泡**：`potionBoil.ts` 的 `BG_POTIONS` 與 `BgBubbles.svelte`；一般背景的桌上燒瓶、架上綠瓶／琥珀罐，免費遊戲的四支發光管，Hold & Spin 的綠瓶與琥珀瓶。座標是 1920×1080 原圖像素，量在液面而不是玻璃上。

### 第五輪（2026-10-16）：背景清晰
- 遊戲裡沒有模糊濾鏡；看起來糊的原因是：背景原圖只有 1672px，先放大到 1920 再被 GPU 放大約 1.24 倍、全畫面暗角 0.9（四角約 80% 黑）、22 顆大顆加法光點飄在前面。
- `design/sharpen_backgrounds.py`：從 `design/source/backgrounds_1672/` 一次放大到 2560×1440（Lanczos），加兩段銳化（細邊＋局部對比），輸出 JPEG q94（`bg_*.jpg`，每張 1.3–1.9MB）。舊的 1920 PNG 移到 `design/source/backgrounds_1920_png/`。
- `game/crispPlate.ts`：背景貼圖載入後開 mipmap，縮小時不閃。暗角 0.9 → 0.4（`Game.svelte`），overscan 1.08 → 1.04，光點 22 顆 12–58px → 14 顆 5–14px。
- 一般背景左桌的綠布會微微飄動（`bgProps.ts` 的 `BG_CLOTH`）；靠畫面左緣那側釘住，所以往室內擺得多、往邊緣擺得少。

### 第六輪（2026-10-16）：燈柱不扭、音量
- **背景燈籠旁的柱子不再跟著扭**：燈籠畫在石柱前面，原本燈籠外約 5 個單位（約 50px）都跟著擺，柱子的直邊被拉彎。`bgProps.ts` 的 `LANTERN_HALO` 1.4／`LANTERN_SOFT` 0.45，只剩燈籠輪廓外一圈薄邊跟著動；一般背景燈籠擺幅改 1.7°、震動踢 2（幅度太大薄邊會摺）。Hold & Spin 籠燈同樣設定。
- **音量**（`Sound.svelte`）：停輪音一般 0.72、turbo 0.32，60ms 內接連的停輪音再減半（turbo 五輪幾乎同時停，疊起來約大 7dB）。得分：每次得分 `sfx_winlevel_small` 1.35、結算 1.2、Scatter 得分 1.2、大獎等級 1.1–1.3、金幣聲 0.9；音量上限由 1 放寬到 1.5（檔案峰值 −3.2dBFS，仍不爆音）。

### 第七輪（2026-10-16）：W 猩猩眨眼
- `design/w_blink.py` 用吉祥物同一套畫法（`alchemist_blink.paint_region`）畫出 W 的半閉／全閉眼皮，輸出成與 `w.png` 同尺寸的透明圖（`goBanalchemyMesh/w_lid_half.png`、`w_lid_closed.png`）。`SymbolMeshWin.svelte` 用 W **同一份幾何**多畫一層眼皮網格，所以點頭、咬香蕉時眼皮跟著臉彎。時間在 `wGorilla.ts` 的 `W_BLINKS`：中獎時蓄力瞇眼＋落定眨一次；待機時轉頭眨一次、推護目鏡時再眨一次。重繪 `w.png` 後要重跑 `python design/w_blink.py`（眼睛座標在檔頭）。

### 第八輪（2026-10-16）：背景水晶、金幣堆、藤蔓、人物毛髮
- **免費遊戲背景水晶**（`bgProps.ts` 的 `crystalBed`）：只挑沒被黃銅擋住的六根——地上兩根、左下角兩根、右側大柱（只取黃銅帶以上）與一根小尖晶。每根從底部慢慢長高 10–19%、略微擺動，各自週期不同；不加光。
- **Hold & Spin 金幣堆**（`BG_COINS`）：新金幣黏上盤面時（`stickyPrizesNew`，`BgProps.svelte` 監聽）金幣堆往下壓再彈回、右側散落的金幣滑一下；平常不動。架上的卷軸是平放的，任何明顯的動作看起來都不對，所以沒做。
- **一般背景藤蔓**：左上角垂下的暗色藤蔓併進左燈籠的同一個網格（分開做會互相蓋掉燈籠的擺動），從上緣垂掛擺動。
- **人物**：`alchemist_flow.py` 新增 `crown`（頭頂毛）、`furL`/`furR`（兩頰毛）、`strap`（護目鏡左側皮帶）、`furArmL`/`furArmR`（前臂外緣長毛，掛在 torso 上、手臂權重保留，所以不會撕裂）。頭部毛髮物理調得較硬（尖端擺幅 6–9px），皮帶 16px、前臂毛 7–8px。

### 第九輪（2026-10-16）：讀取頁、UI bar、Bonus 按鈕
- **Bonus 按鈕底板冒泡**：`design/make_bonus_bubbles.py` 烘出 20 張 320px 底板（青色玻璃裡有氣泡慢慢升起、到頂消失，無縫循環），`game/buyBonusBubbles.ts` 每 120ms 把 `uiTheme.sprites.buyBonus` 指到下一張（共用按鈕不動，做法同 Bananubis 的 hover 光）。hover 層讀同一個 slot，所以也會冒泡。轉輪期間（按鈕變暗，判斷同按鈕本身的 `!isIdle()`）停在當下那張，回合結束再接著冒。
- **貼圖縮小**：Bonus 底板 1254→512px、計數框底板 2170→1085px（原圖存在 `design/source/buybonus_plate_full.png`、`ticker_plate_full.png`）；畫面上只顯示一兩百像素，省顯示記憶體。
- **讀取頁**：深色遮罩 0.68 → 0.42，背景看得清楚；讀取頁背景也掛上燈籠、藤蔓、桌布擺動和燒瓶冒泡（同 `BgProps` / `BgBubbles`，盒子以讀取頁背景的左上角計算）。

### 第十輪（2026-10-16）：文字網格、說明卡獎圖
從 GoBananeon 移植 `TextMesh.svelte` + `game/meshWin/textMesh.ts`（文字先畫到貼圖，再用 32×8 網格變形；預設色改成本款的金色）與 `FeatureSymbolMesh.svelte`。
- **讀取頁說明卡**：第一格 S 循環播放中獎跳躍（離開底板），第二格加上 B 試劑落地（含沸騰），中間有停頓。
- **免費遊戲開場**：標題落下後像泡在液體裡緩慢波動，次數數字「砸」上去；**結算**：標題同樣落下波動，總額滾動時字一個個上下跳、停下時壓扁回彈。
- **大獎與一般中獎金額**：滾動時數字依序上下跳，停下時壓扁、果凍回彈（`AMOUNT_ACT`）。
- **讀取頁標題**：「GO BANALCHEMY」合成一個網格，讀取時字母像在液體中緩慢波動，出現與讀取完成時各彈一下。

### 第十一輪（2026-10-16）：其餘文字也上網格
- **中獎路數標籤**（`WinWays.svelte`「N WAYS」）：每換到下一個中獎圖案，字母依序跳一下（`LABEL_ACT`）。
- **全盤反應大字**（`FullBoard.svelte`「TRANSMUTED」）：蓋章落下時壓扁、從中間往兩側震開、果凍回彈（`STAMP_ACT`）。
- **免費遊戲／Hold & Spin 計數牌**（`FreeSpinCounter.svelte`）：標題隨計數牌的震動輕微動、平常緩慢波動；次數每用掉一轉字母依序跳、加轉時整個拉高回彈（`TITLE_ACT` / `COUNT_ACT`）。
- Hold & Spin 金幣上的數值維持一般文字（字小、本身已在金幣網格上跳動）。

### 第十二輪（2026-10-16）：停輪音、燈籠、人物 PSD 需求
- **停輪音再小聲**：`Sound.svelte` 一般 0.5、turbo 0.24（60ms 內連續的再減半，不變）。
- **背景燈籠不晃**（使用者要求）：一般背景兩盞、Hold & Spin 兩盞都不再擺動。左燈籠的網格只剩旁邊的藤蔓會動，藤蔓輪廓往右縮到 x≥51，擺動時不會扯到燈籠邊緣。右燈籠與金庫籠燈的網格整個拿掉。
- **人物捶胸／丟炸藥手臂幾乎不動的原因**：目前 `GoBanalchemy_alchemist.psd` 只有一張成品圖，附帶的「left arm／right arm」等圖層只是同一張圖的長方形裁切，手臂和外套連在一起，只能用單一網格加權，手臂一大幅轉動就會把軀幹拉壞。實測拳頭在捶胸時只移動 17–35px（人物 884px 高）。
- **處理方式**：照使用者決定，改請美術重畫一份與 GoBoomana 炸藥人物結構完全相同的分件 PSD。需求清單在 `design/psd_brief/ALCHEMIST_PSD_需求.md`（24 個圖層名稱與順序、關節座標、分件畫法規則、裝扮對照、建議加做的外套下襬／燒瓶／眼皮圖層），參考圖 `ref_boom_full.png`、`ref_boom_parts.png`、`ref_boom_joints.png` 在同資料夾。拿到新 PSD 後用 `design/extract_monkey_psd.py` 拆圖、套炸藥人物的骨架與九種動作，再重量捶胸落點與丟擲出手點（`measure_alchemist_cues.mjs`）。手臂從現有成品圖重切的做法已暫停。

### FG 牌面更新（2026-10-16）
- 依使用者要求，FG 進入牌與左上計數牌統一換為青綠琺瑯、銅框、綠寶石角飾，配合遊戲盤框與 Buy Bonus 按鈕。新素材為 `static/assets/sprites/goBanalchemyUi/fg_plaque.png`，原始圖與生成提示保存在 `design/source/fg_plaques_v1/`。
- `FreeSpinAnimation` 保持牌框固定，以畫面淡入呈現；`FreeSpinIntro`、`FreeSpinOutro` 與 `FreeSpinCounter` 的文字改為靜態排字，取消先前的字形網格跳動、波動及回彈。結算數值仍正常累計。
- 左上牌移除頂部炸藥與底部炸藥條，等級進度改以綠點顯示；Free Spins 與 Respins 的原有計數事件及直橫向定位保留。
- `/art-review` 新增「FG 牌面」檢視，使用實際 Sprite、GoldText 與 AlchemyFreeSpinPlaque 元件；驗證截圖保存在 `design/qa/fg-plaques-review.png`。

### 數學（2026-10-16）：RTP 0.96，與 GoBoomana 同一份分布
- `math-sdk/games/GoBanalchemy` 的程式與轉輪原本就是 GoBoomana 的複本，但沒跟上炸藥那邊兩個更新：10-09 的 RTP 0.96（多的 1% 全給一般遊戲：0.005／0.28／0.675），以及 10-08 審查修正（最高獎金局不再強制 20 轉、能量條不預先填滿）。已把 `game_config.py`、`game_override.py`、`game_optimization.py`、`match_boat_distribution.py` 等同步成炸藥版（只改遊戲名稱），並直接沿用炸藥的 `library`（牌局書與查表完全相同），用 `resync_from_library.py` 以本款 ID 重新產生設定並跑 RGS 驗證（五個模式 SHA 與 payout hash 全過）。舊輸出保留在 `library_before_boom_sync_20261016/`。
- 前端由 `npm run build` 的 `sync_math_config.mjs` 同步，`config.ts` 各模式 RTP 0.96；規則與買入視窗的 RTP 文字是讀設定動態顯示。

### Game Info 改版（2026-10-17，審查意見：game info should be more polished）
- **規則頁**（`ModalGameRules.svelte`）：開頭改成實驗室插畫標頭（`buy_art_lab.png`）＋四格重點數據（路數、RTP、最高獎金、免費遊戲次數，全部讀設定）。試劑、Wild、Scatter、Hold & Spin 各配對應獎圖；試劑附「整輪變成同一圖案」前後對照，反應能量條附 1→5 輪示意，買入三方案改成卡片（價格、轉數、起始能量條）。「不能再觸發」改成醒目提示框。認證要求的文句、各模式 RTP／最高獎金表、操作說明、法律聲明全部保留；操作說明移到最後並改兩欄。
- **賠付表**（`ModalPayTable.svelte`）：同一套標頭，獎圖改兩欄卡片，倍數改成一行一級的銅框標籤，ways 範例與配色統一。
- **配色**：規則、賠付表與所有彈窗外框統一為 UI bar 的煉金色（青綠玻璃 #0f3438／#0b252b、銅 #c58b55／#e7b47c、奶油 #f4f4df、薄荷 #5fd6a8）。`Modals.svelte` 補上關閉鈕、輸入框、捲軸、買入卡片與買入按鈕（原為炸藥紅，改銅色）。拿掉標題閃光與呼吸光暈等持續動畫。
- 改前版本在暫存區備份；尚未上機看過實際排版（手機寬度有 460／520px 斷點）。
