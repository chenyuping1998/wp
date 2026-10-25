# Treasure Monkey 建置交接

## 2026-10-23 · 金幣略放大與柔光

正式建置及全部 gates 通過：E:/stake/tmp/treasure-coins-glow-build.log，adapter-static ✔ done。

建置後重啟並重新載入檢視，瀏覽器 errors[]；目前保留寶箱特寫半速自動播放。此輪 owned dev PID 22064，往後停程序須先重新核對 command line。

依使用者要求，chestCoin 的 rx／ry 等比例放大 15%；H1 金幣外暈改為 6 層正常 alpha 暖金漸層，由 2.5 倍半徑柔收到 1.25 倍，亮度隨翻面輕微變化。原五枚路徑、翻面節奏、開蓋、970ms 與 reduced-motion 保留。手機 388ms 特寫已檢視，瀏覽器 errors[]，證據 design/reviews/chest_coins_enlarged_glow_20261023.png。check_chest_motion 與 TreasureSymbol 定點編譯通過（0 warnings）；含正式外層變換的 0.25ms 密集取樣確認外暈留在格內，上緣最少約留 8.9px。此輪未重跑全案 types；上輪 39 個既有錯誤的基準不變。

## 2026-10-23 · generator 動作已接入：人物、獎圖與局部海面

已接續恢復後的演出調校，將本機 E:/stake/spine-generator 的純數學動作離線烘焙到本款既有分件與網格。runtime 只讀 app 內的 JSON 資料與本地取樣 helper；未接入 Spine 4.3 runtime，也不是整套骨架／.skel 遷移。原始圖檔、低獎固定木牌與細版 A／K／Q／J、猴子局部 open／half／closed 換片和眨眼時窗均保留。

- 人物：breathe 與 chain-sway 烘成 4 秒循環，胸肩、頭部與尾鏈使用不同響應，尾鏈每節延遲 100ms。保留腰線／腳掌接點、共同握點、C2 中斷切換、原 scan／win／winBig／welcome 長度及 reduced-motion。兩角色全身 scan 與 winBig 關鍵姿勢已看過，未見明顯握持或胸腰接縫。
- 寶箱：strike 烘成 970ms 蓋鉸鏈，先壓蓋再快速開啟、小幅過衝、可讀停留後收回。加入只在開口內的暖金光、五枚金幣各自翻面與短高光，保留暖金幣身及蓋前圖層，沒有全盤白閃；reduced-motion 減弱蓋與內光並省略飛幣。
- 局部 rig：9 條獨立質量／延遲／收勢曲線，包含 H5 繩索與鑰匙、SW 柄／面板／線圈、旗根／旗尖、W 帽沿／笑臉。繩→鑰匙、柄→面板→線圈、旗根→旗尖分別承接，反光仍沿同一金屬 mapping。H3 保留作者的收氣、殼口先張、螺尖延遲承接與錯拍收勢 keys；不拿共用 generator 包絡蓋掉這段表演。
- 物件附件：12 條 spring／strike 次級 channel 接到四字母的落點、重量與回彈、紙面／卷邊回彈、吸管彎轉與轉面；固定牌底及吸管插入口不漂移，完整演出仍於 970ms 回原位，落地反應保留 240ms。
- 海面：7.2 秒的 wave／sum 僅帶動水域網格，520 個活動頂點，最大位移約 2.56px；天空、沙灘、燈塔與躺椅保持固定。兩張截圖區域比較 water_left／water_right 分別改變 14,354／16,492 像素，sky／beach／lighthouse／chair 像素差均 0。

可重建來源與資料對應：design/bake_cast_generator.mjs → src/game/data/treasureCastGenerator.json；design/bake_chest_generator.mjs → treasureChestGenerator.json；design/bake_rig_generator.mjs → treasureRigGenerator.json；design/bake_object_generator.mjs → treasureObjectGenerator.json；design/bake_beach_generator.mjs → treasureBeachGenerator.json（後四者同在 src/game/data/）。五支腳本實際匯入本機 generator 的 presets／motions 純數學來源，原參數／取樣來源保存在各資料檔，執行期不依賴 app 外的 generator 專案。

驗證完成：專屬局部 rig／附件／寶箱／人物／海面定點檢查通過，包含起訖原位、reduced-motion、密集網格不翻折、金屬反光對位與迴圈接縫。正式建置後重啟預覽，使用全新分頁測試正常及半速中獎，均完成 20/20，瀏覽器 error 日誌為 []；沒有沿用編輯途中 HMR 重載的半速結果。FG 五個音效節點均啟動一次，5 成功／0 失敗；開蓋聲已從 1740ms 改為 1860ms，對齊寶箱 1570ms 起演加 290ms release。

畫面證據在 design/reviews/：cast_digger_generator_20261023.png、cast_lifeguard_generator_20261023.png、chest_generator_20261023.png、shell_generator_20261023.png、key_generator_20261023.png、scroll_generator_20261023.png、letter_generator_20261023.png、monkey_generator_20261023.png。舊 cast_lifeguard_v4_20261022.png 實為普通 digger 盤面，不可當作 lifeguard 驗收依據；已以下方 v4 段的更正說明取代該引用。

另執行舊 check_symbol_motion.mjs 仍報 74 項整圖門檻失敗；該量測預期整張符號縮放／旋轉，與本款固定牌底、獨立字母及局部附件的演出方式不符。沒有調低或改寫這些門檻。實際 design/check_build.mjs 使用本款 check_symbol_rig、check_object_attachments、check_chest_motion、check_cast_refinement、check_beach_motion 等專屬 gate 驗證局部動作及固定接點。

正式 build 與全部專屬 gates 通過：E:/stake/tmp/treasure-generator-build.log，adapter-static 已寫出 build 並顯示 ✔ done。全案型別檢查仍為 39 errors／23 files、0 warnings，與本輪前基準相同，本輪動畫／背景／studio 檔案未報錯；紀錄 E:/stake/tmp/treasure-generator-types.log。最終整體畫面 design/reviews/generator_board_final_20261023.png。無有效 RGS session，正式平台完整回合仍未實測，不宣稱全域型別通過或商用 Spine 品質認證。

建置後全新預覽亦完成 FG 五音效節點（5 啟動／0 失敗）及場景交接，error 日誌仍為 []。本機預覽 http://127.0.0.1:3043/studio 已恢復，保留「藏寶圖｜收卷與展開」半速自動播放，可從特寫選單切換其餘 11 款，或用「人物特寫」檢視兩角色。此次 owned dev PID 為 9888；往後操作須重新核對 command line，不能僅依舊 PID 停程序。

## 2026-10-22 · v4 已恢復：獎圖細節與人物跟隨

已依使用者「繼續處理」恢復下方暫停點。本段保留當時的實作進度，後續整合及驗證以上方 2026-10-23 段為準；不能沿用 v3 紀錄宣稱這輪已完成驗收。下方暫停及 v3 紀錄保留作歷史。

- 低獎：A／K／Q／J 改為原創細版 code-native 向量輪廓，以細深棕邊、淡奶油色字面及小幅陰影取代厚重 Titan One 字體。木牌底圖在 idle／land／win 固定；只有獨立字母層各自做蓄力、跳步、側傾、扭轉或上挑，並有錯開的過衝及收勢。land 降低幅度，仍在原 240ms／970ms 契約內完成。
- 物件：藏寶圖 155ms 收卷、245ms 短暫合住、420–505ms 展開過衝，585–660ms 保持可讀，再小幅回收並於 970ms 回原位；仍用紙面裁切揭露，內容不被壓扁。吸管插入口固定，先預備、正反轉，再讓轉面和末端回彈錯拍；鑰匙反光在 290–330ms 與 690ms 左右短暫停留，掃光跟隨原蒙皮並限制在金屬。
- 盤邊人物：TreasureCastSkin／treasureCastSkin 增加局部胸肩與尾尖蒙皮；肩、頸附件共用 torso 映射，手與工具共用握持父節點，腳掌及腰部接點保留。頭部反向穩定、胸肩承重與尾尖延遲分開控制；CastPerformer 在快速換 cue 時延續姿態、速度與加速度，以 C2 過渡收束。
- 猴子眨眼：使用 open → half → closed → half → open 的局部眼部換片，355–376ms 半閉、376–428ms 全閉、428–456ms 半張。半閉稿及閉眼稿共用原臉蒙皮與羽化眼窩遮罩；不再用半透明閉眼稿疊出瞳孔重影，也不壓縮眼白。帽、鼻、嘴及外輪廓沿用原圖，reduced-motion 保持睜眼。
- 寶箱：H1 開蓋金幣增加奶油白窄高光、細亮邊與小範圍暖金暈，幣身保留暖金色。視覺檢查發現原粒子在箱蓋後方被擋，已改在 lid container 之後繪製，讓金幣顯示於蓋前；每枚生命前 12% 淡入、66% 後以 smoothstep 淡出，使彈跳高點保持清楚。使用正常 alpha，原 5 枚金幣的路徑、扁度、彈跳開始及總時長不變，沒有全盤白閃。

當時定點靜態／純函數檢查通過，包含角色蒙皮不翻折、附件與接點、C2 中斷及獎圖時序；TreasureSymbol client 定點編譯為 0 warnings。瀏覽器正常速度中獎完成回呼 20/20，error 日誌為 []。畫面證據包含 design/reviews/low_letters_v4_20261022.png、monkey_blink_v4_20261022.png、cast_digger_v4_20261022.png。更正：cast_lifeguard_v4_20261022.png 實為 digger 普通盤面，不能證明 lifeguard；lifeguard 全身動作改看 design/reviews/cast_lifeguard_generator_20261023.png。當時全案 types／build 尚待補結果，未宣稱全域型別通過或正式 RGS 回合已測試。

## 2026-10-22 · 使用者要求一分鐘內暫停：v4 工作中檢查點

已停止追加工作，以下尚未定稿。前一版正式建置紀錄仍是 treasure-attachments-v3-build.log，本輪未跑完整 types／build、也尚未做瀏覽器畫面驗證，不可當作驗收完成。

- 猴子：移除壓縮眼白／瞳孔的 wink bone。新增正常雙眼閉合稿 static/assets/treasure/attachments/monkey_blink_closed_v4.png（ImageGen，以 w.png 為參考，僅改眼睛，原始生成檔 exec-7954874b-6dd5-4b20-b4b0-cedf74ca078e.png）。TreasureMonkeyBlink 以局部羽化眼窩遮罩及同一蒙皮座標疊眼瞼，保留原臉、帽、鼻子、嘴與徽章；需優先檢查 350–480ms 是否對位、是否有殘影、卸載是否清理完整。
- 低獎：TreasureLetter 改為原創細筆畫向量 A/K/Q/J，移除 Titan One 的粗膠條輪廓和雙重厚邊。J 有清楚頂橫與彎鉤；木牌固定，動畫 props 保留。向量設計合成稿 E:/stake/tmp/painted-letter-preview.png，尚非瀏覽器證據。
- 物件：treasureObjectMotion 與 check_object_attachments 已更新，字母各有獨立預備／主動作／延遲收勢，land 幅度降低，卷軸加閉合及讀圖停頓，吸管轉面與反彈錯拍。定點檢查已通過。
- 盤邊人物：TreasureFigure、treasureMotion 的 cast 區域新增胸肩局部蒙皮、頭部穩定與尾尖延遲，CastPerformer 嘗試延續中斷加速度。新 helper treasureCastSkin.ts／TreasureCastSkin.svelte 與 check_cast_refinement.mjs。人物代理已中斷停止；須接續審查測試與實際接縫，尤其握持點、腰線、尾巴根部、快速換 cue。
- 暫停前 TreasureFigure／TreasureMonkeyBlink／TreasureLowSymbol／TreasureLetter 已做 Svelte client 語法編譯通過。check_symbol_rig、check_object_attachments、check_undefined_refs 通過。本輪沒有全案型別／正式建置結果，不要覆寫上一輪已驗證紀錄。

## 2026-10-22 · 物件分件 v3／固定低獎牌框

正式建置與全部 gates 通過（E:/stake/tmp/treasure-attachments-v3-build.log，adapter-static ✔ done）。型別檢查為 39 個既有錯誤／23 檔、0 warnings，這輪附件／動畫元件沒有型別錯誤（E:/stake/tmp/treasure-attachments-v3-types.log）；沒有宣稱全案型別通過。

建置後重新載入預覽，瀏覽器 error 0；最新截圖 design/reviews/object_acting_v3_20261022.png。預覽保留「藏寶圖｜收卷與展開」半速自動播放，可切換其餘獎圖。

- 依使用者明確要求，低獎木牌在 win／land／idle 保持固定，只讓 A、K、Q、J 各自蓄力、跳躍／側轉／扭轉／上挑後收勢。取消外層變換、呼吸與整面亮底。四款新無字木牌由 ImageGen 補出乾淨木紋，字母為獨立高解析文字層，放大檢視時 resolution 4。
- 藏寶圖改為紙面＋左右卷軸附件，先收到約 27% 寬，再展開略過衝並回原位；紙面裁切揭露，地圖不被水平壓縮。椰子底圖已完整移除吸管，吸管以固定插入口旋轉往返並衰減，液面遮擋末端、加入接觸陰影。繩索鑰匙的掃光與閃點共用實際蒙皮座標，輪廓遮罩限制在金屬。
- 三張附件 atlas 保留 ImageGen 原始透明像素，僅用 index_treasure_attachments.py 讀取 alpha 邊界建立 subtexture frame JSON；art:build 會重建索引。來源說明 design/source/treasure/attachment_sources_v3.json。runtime 的 static／land／win／轉輪殘影共用同套組件，避免回到舊版整張圖。
- 正常、半速中獎完成皆 20/20。手機特寫已檢查紙卷開合、吸管接點、鑰匙反光及高解析字母；兩張低獎原位／動作截圖的柱子、上緣木紋、底部貝殼四個不透明區域像素差皆 0。證據 design/reviews/low_fixed_rest_v3_20261022.png、low_fixed_action_v3_20261022.png、scroll_closed_v3_20261022.png、scroll_open_v3_20261022.png、coconut_straw_v3_20261022.png、key_shine_20261022.png。
- check_object_attachments.mjs 已納入 build，驗證固定木牌、四種字母、卷收幅度、往返動作、起訖狀態、反光座標與 atlas 邊界。保留 970ms 完成、主次演出、reduced-motion 與一次性回呼。這是分離附件＋程式骨架演出，並非 Spine Editor 專案；正式平台回合仍待有效 RGS session。

## 2026-10-22 · 獎圖骨架整合

正式建置完成：E:/stake/tmp/treasure-symbol-rig-build.log，全部 gates 通過，adapter-static 已寫出 build 並顯示 ✔ done。

2026-10-22 建置後重新啟動預覽並檢查特寫操作，瀏覽器 error 0；最新畫面 design/reviews/symbol_rig_20261022.png。預覽保留椰子特寫自動播放，骨架疊圖預設關閉。

- 10 種原本平面獎圖與獨立旗布新增加權網格，寶箱保留分件鉸鏈並加強開蓋透視；使用程式骨架與頂點權重，不是 Spine Editor 輸出的 .skel 檔。
- 椰子吸管／傘／花葉、繩索鑰匙、海螺、藏寶圖紙卷、探測器、四張木牌各有局部關節與延遲；W 增加臉／帽沿／嘴部與局部眨眼。眼部權重已調整，減少變形輪廓皺折。旗布有兩節傳遞，不再僅整張旋轉。
- 保留 970ms 中獎完成契約、主次獎圖節奏、共享時鐘、半速與 reduced-motion；idle／轉輪仍用原 Sprite，僅 win 建立網格。頂點更新重用陣列並釋放本次 geometry，不銷毀共用 texture。
- studio 新增「獎圖特寫」，有十二獎圖選擇、暫停、逐格與骨架疊圖；其他演出按鈕會退出特寫。畫面檢查過椰子、猴子、藏寶圖與旗布，正常及半速中獎皆 20/20 完成，瀏覽器 runtime error 0。截圖 design/reviews/symbol_rig_20261020.png、symbol_wink_20261020.png。
- check_symbol_rig.mjs 已加入 build gates，驗證權重總和、起訖原位、有限範圍、整段三角形不翻折及 reduced-motion。全案型別檢查仍為 46 errors／30 files、0 warnings，新骨架與預覽元件未報錯；紀錄 E:/stake/tmp/treasure-symbol-rig-types.log。正式 RGS 仍無有效 session，不宣稱平台完整回合已實測。

## 2026-10-19 · 網格與人物流暢度

- 關鍵姿勢改用 quintic Hermite，維持移動鍵的速度並讓加速度在接點連續。反應末段以 260ms 接入當下 idle，不在結束瞬間換回另一姿態。
- CastPerformer 取代單純 110ms 姿勢混合；220ms 過渡同時延續姿勢與角速度，可連續中斷／重觸發。換角色清除前一角色的慣性；預覽逐格仍可直接取原始關鍵姿勢。
- 中獎物件依地面接觸點或懸掛點縮放／旋轉。各格加入最多 56ms 的細微交錯，重排在同一 970ms 內完成，圖層分件與外部動作共用時間，不延長評獎回呼。
- presentationClock 統一人物、正式中獎與 studio 時鐘；20 格共用單一 requestAnimationFrame。最後取消訂閱即停止，分頁可見性切換重設時間基準，隱藏時間不累計。
- check_motion_flow.mjs 涵蓋加速度接點、動作中斷速度、idle 銜接、20 格收束時刻、單一排程及隱藏／恢復，已加入 build gates。無改動共用 packages 或評獎規則。
- 正常與半速展示已確認 20/20 格完成；逐格確認人物 440ms／獎圖 410ms 的接觸點與姿勢，無新增瀏覽器錯誤。截圖 `design/reviews/motion_flow_20261019.png`。
- 型別檢查紀錄 `E:/stake/tmp/treasure-flow-types.log`：48 個錯誤／31 檔，包含共用套件 Lingui 預處理與既有 donor 型別問題；本輪改動檔案未報型別錯誤。此紀錄取代先前 41 個錯誤的狀態，不宣稱全域型別通過。

## 最新追加：動畫演繹強化 · 2026-10-18

- 主預覽仍為 `/studio`，新增「完整演出」「半速」「角色逐格」「符號逐格」。後者直接使用正式 SymbolWinAnim 的逐格入口，沒有評獎或平台 session。
- 改為四組獨立關鍵姿勢，頭先帶視線、腰部承重、手臂／工具連動、尾巴延遲收勢；腳掌固定，上半身採同一腰部階層。中斷以 110ms 混合接續，不直接跳回 neutral。FG 角色朝向盤面，工具改演鏟子下壓、承重、提起，與 MG 探測掃描分開。
- 內建 ImageGen 製作兩張眨眼稿與兩組符號分件 atlas，原圖與完整提詞在 `design/source/treasure`。`build_treasure_motion_art.py` 匯出兩張對位眨眼、寶箱 body/lid、沙堡 body/flag；`pnpm art:build` 會接續執行。靜止 h1/h2 由同一套分件合成，逐像素對照避免換圖閃動。
- 正式中獎元件改為本款 970ms 的預備、發力、讀取、收勢，移除 donor 的 1.45 倍通用放大／白閃。完成與卸載走同一個一次性 finish，保留原來 caller contract。新增 reduced-motion、隱藏時暫停。
- 探測器先尋位再掃描，顆粒與格線回應跟隨原轉換時鐘；Scatter 保留及取消 generation 保護不變，卸載也取消後續轉換。探測區按順序落點、描邊、倍率牌落定，升級只強調牌子，不縮放覆蓋範圍。
- 新增連續性、四組獨立演出、頭先／尾隨、回到靜止、reduced-motion、動畫圖層一致性及眨眼輪廓對位檢查。最近全域型別檢查為 41 個既有 donor／共用錯誤（24 檔），本輪新元件未報型別錯誤；紀錄 `E:/stake/tmp/treasure-acting-types-final.log`。
- 本輪屬可操作、可逐格檢閱的動畫強化，不能將靜態檢查通過當成專業品質評定。仍需正式數學／RGS 整場實測；其餘符號目前並非全部具備內部骨架。

## 最新整合狀態 · 2026-10-18

以下是目前狀態；後方開案紀錄保留作歷程。

- `/studio` 為主要檢視頁：正式圖檔及實際 Pixi 元件的轉輪沙粒、急停、探測器、倍率區、符號中獎、兩位角色、海浪與音訊；純演出預覽，不送出投注或評獎。
- 已建立獨立 1920×1080 海灘、12 個透明符號、兩位正式工作／救生制服人物的 16 個分件、木質框及三階標題。來源圖、提詞及輸出流程在 `design/source/treasure`、`design/build_treasure_art.py`。
- 人物分件使用關節動作，左手與工具共用轉軸；有短促 idle、scan、win、winBig、welcome。符號各有不同整體姿態；目前沒有宣稱符號內部骨架或表情換件已完成。
- 轉輪沙粒接實際 spinning 狀態。探測器取代原槍械演出，擴展保留 Scatter；倍率區使用沙地標記。背景保持穩定。
- 海浪轉場 500ms 推入、180ms 完全覆蓋、600ms 揭開，維持 oncover/oncomplete 一次的切換契約。最終改用依背景參考生成的手繪不規則白色碎浪素材（wave_surf_v2.png），含大小泡沫孔洞與細碎飛沫，取代規則線條／捲花；`/studio` 的「浪花逐格」只用於視覺檢查，不觸發場景切換。
- 33 個獨立音效、兩首原創合成配樂與 52 個後備 sprite cue 已接入。執行音訊約 6.43 MB；來源母帶與製作說明在 `design/source/treasure/audio`。是合成樂器，非真人錄奏；峰值、起音與格式檢查不等於聆聽定稿。
- 建置保留通用完整性檢查，原 donor 主題專用檢查改為本款實際美術／動畫／音訊檢查。無修改共用 packages。
- 待完成：正確 Capo 數學來源／books、正式 RGS 全流程、人物關節接縫與最終演出調校、裝置端混音聆聽。共享套件及 donor 的既有型別問題仍須另行處理，不能宣稱整個 workspace 型別檢查通過。

完整建置已通過：E:/stake/tmp/treasure-media-build.log。型別檢查仍有 51 個 donor／共用錯誤（32 檔），新展示元件未報型別錯誤：E:/stake/tmp/treasure-media-types.log。最終手繪碎浪替換後的驗證另見 treasure-wave-build.log。

## 初始建置紀錄（以下描述早期狀態）

2026-10-18：由 Capo Nostra 的目前工作目錄複製獨立前端與 runtime 素材；未修改 donor 或共用 packages。

啟動：`E:/stake/tools/node-v22.23.1-win-x64/corepack.cmd pnpm --dir E:/stake/wp/apps/TreasureMonkey海灘尋寶 dev`

- 開案預覽：`http://127.0.0.1:3043/setup`；不需要 RGS session。
- 引擎入口：`http://127.0.0.1:3043/`；沿用正式 Authenticate 流程，需要有效平台 session，沒有偽造本機 RGS。
- build 使用 E 槽 Node 與 math-sdk Python，保留 donor 原有檢查；check:bootstrap 額外檢查新身份、英文 junction、5×4／14 線與三階成本，並比較 donor config。
- 相依套件連結指向目前 pnpm store，新 app 有自己的 node_modules 與 Vite cache；workspace lock 加入同 donor 版本的 importer。
- 原始企畫保留原位；本 app 內有 design/brief 快照。最新規格見 SPEC.md。
- 重要：Capo app/math 其實是含 Collector 的 Hot Miami 舊來源，與 Capo 前端的 SW／大框契約不符；本案刻意不複製此來源冒充已完成數學。此機器 math-sdk/games 中沒有 capo_nostra。需找回正確 Capo 數學來源／正式 books 後再建立 TreasureMonkey 數學分支、跑評獎與 RTP 驗證。
- 現有 runtime 畫面、三檔標題圖、角色與音效仍是 donor。風格樣張是構圖提案，並未當成背景或切成符號塞入引擎。
- 尚待：風格樣張核准、Capo 符號映射（5H／4L／SW）、新角色分件與 Le 動作、主題介面、探測區演出、音訊、正式 math 與 RGS 實測。

## 本輪追加

2026-10-20 演繹與混音：新增四個原創程序擬音與重建腳本（detector_lock、sand_reveal、chest_open、plaque_flip），目前 37 個獨立 cue、2 首解碼配樂、音訊約 6.56MB。FG 聲音改為 180／1180／1740／2060／3200ms，入場短句由 FreeSpinIntro 單一持有，去除 book handler 的重複播放。倍率在新數字揭露時發聲，FoleyGate 合併同格群密集敲擊；Sound 加入 SFX 壓縮、音樂短句避讓與卸載清理，保留原 72ms 停輪排程。中獎 runner 改為青綠探測光點與沙尾，平滑速度及轉折方向，仍沿真實獎線且保留各輪／完成回呼；共用 presentationClock 並支援半速及 reduced-motion。

本輪全案型別檢查為 46 errors／30 files、0 warnings；比上次多出共用套件 Lingui preprocessing 設定載入診斷，本輪新增／修改的動畫及聲音元件沒有型別錯誤（bookEventHandlerMap 仍有原有事件聯集／readonly board 問題，沒有宣稱全案型別通過）。紀錄 E:/stake/tmp/treasure-audio-direction-types.log。

正式建置及全部素材／動作／音訊 gates 通過，adapter-static 已寫出 build 並顯示 ✔ done：E:/stake/tmp/treasure-audio-direction-build.log。

studio 已檢查正常／半速中獎 20/20、FG 五個 cue 依序啟動且播放失敗 0、立即略過不再發後段聲音；瀏覽器 runtime error 0。check_audio_direction.mjs 已納入 build，涵蓋擬音去重、避讓長度、曲線與低影格率回呼。音訊資產檢查與 FG 時序檢查通過；畫面 design/reviews/acting_audio_20261020.png，離線混音試聽 design/reviews/sound_direction_20261020.wav（峰值 −7.76dBFS，非平台實錄）。無有效 RGS session，正式 Sound 混音圖與真實平台回合仍待實測。

- 人物裝備修訂樣張：design/source/treasure/style_test_v2.png（內建 imagegen；完整提詞為同名 _prompt.txt）；已在 /setup 引用，尚待使用者確認。
- 轉輪沙粒第一版已接入實際 spinning → stop；一般、Turbo、reduced-motion 與粒子上限／回落清空均有行為檢查。實際 Pixi renderer 可在 /animationlab 檢視，已於手機寬度操作一般、Turbo、急停。此頁使用 WebGL，避開內嵌瀏覽器 WebGPU 截圖卡住的問題。
- 動畫總方向與逐段驗收見 design/ANIMATION_DIRECTION.md。其他本款演出尚未完成；不能將沿用 donor 動畫稱為本款專業動畫。
- 修正本 app 靜態素材 URL：static/assets 並非 app/assets，改依 document.baseURI 解析，避免 build 通過但 runtime 404。素材檢查會拒絕零引用。
- 修正 donor 檢查腳本的 Windows ESM file URL、CRLF 解析，以及 Windows Node/Python 呼叫。
- 首次完整 build 與原有檢查已通過；後續變動另做增量建置。check:types 仍有 donor／共用套件的既有型別與 Lingui 設定錯誤，不能宣稱全專案型別檢查通過；完整紀錄 E:/stake/tmp/treasure-types.log。

最終增量建置通過（E:/stake/tmp/treasure-build-final.log，adapter-static ✔ done）。素材檢查已擴至 src 全部 76 個靜態引用，包括兩個角色 rig JSON；另通過 bootstrap、沙粒行為、未定義引用、sprite key、social 與停輪音效檢查。新版樣張與本機 /setup、WebGL /animationlab 已可開啟。首次取得專案時先執行 pnpm setup:local（建立英文 junction 與 .env），再按 workspace 慣例安裝相依套件；英文 junction 不納入 Git。

最終手繪碎浪整合建置已通過（E:/stake/tmp/treasure-wave-build.log，adapter-static done）。77 個素材引用、92 個 registry keys、8 張來源圖及音訊／演出檢查通過；推浪、完全覆蓋、退浪與切換後角色已於 /studio 視覺確認，截圖 design/reviews/wave_surf_v2.png。

動畫強化最終建置通過：E:/stake/tmp/treasure-acting-build.log（adapter-static done）。83 個素材引用、98 個 registry keys、12 張來源圖與新增動作／分件檢查均通過。正常中獎與半速全段實際檢查，正式 SymbolWinAnim 的 20 格皆回報完成；截圖 design/reviews/acting_sequence_final.png，另有探測 440ms 姿勢 design/reviews/acting_scan_440ms.png。全域型別檢查仍為 41 個既有錯誤／24 檔，本輪新增與重寫元件無新型別錯誤。

2026-10-19 網格／人物流暢度最終建置通過：E:/stake/tmp/treasure-flow-build.log（adapter-static done）。動作連續性、同畫面重觸發、970ms 完成時刻與共享時鐘檢查均通過。

2026-10-19 探測儀上方面板已接入 DetectorPanelLight：背光／掃描線／訊號條與狀態燈沿用左臂座標、共享時鐘、半速與逐格時間。探測後收回待機，reduced-motion 穩定亮光。/studio 680ms 與 1100ms 實際檢查貼合；截圖 design/reviews/detector_panel_20261019.png。完整建置與 gates 通過（E:/stake/tmp/treasure-panel-build.log，adapter-static ✔ done）。


2026-10-19 使用者選擇程式動畫製作 FG 開場，AI 影片計畫延後；未連接或使用 Runway。新增 TreasureFeatureOpening／TreasureFeatureCard，正式 FreeSpinIntro 的初次入場與 /studio 共用元件，重觸發保留短版。事件轉數與三階規則未變。4480ms 掃描、沙粒、寶箱、推鏡、標題、原創音效與碎浪；3700ms 全覆蓋才換卡。/studio 有 FG 開場、FG 逐格、三階選擇、半速、略過與返回。手機版尋寶構圖、最高階說明、3700ms 全覆蓋、正常／半速完成與略過已實際驗證。check_feature_opening.mjs 已加入建置，驗證跨影格率回呼、略過／reduced-motion、取消與切換時刻。最後型別檢查為 39 個既有錯誤／23 檔、0 警告，本輪元件沒有型別錯誤；紀錄 E:/stake/tmp/treasure-fg-types-final.log。正式 RGS 入場尚無有效 session 可做端到端驗證。

最後正式建置通過：E:/stake/tmp/treasure-fg-final-build.log（adapter-static ✔ done）。新 FG 開場與現有素材、動作、音訊檢查均通過。畫面證據 design/reviews/fg_opening_discovery_20261019.png。


2026-10-19 FG 後續演繹檢查：新增倍率 320ms 翻牌（舊數字退場／新數字回彈），數值仍即時由事件管理，方框覆蓋格數固定；中斷依當下可讀數字延續。DetectorSweep 準備弧線與起跑掃描線重疊前 15%，保留線性 Wild 轉換時間。兩項支援 reduced-motion；倍率沿用共享時鐘、正式 featureTimeScale 與 studio 半速。新增 check_mechanic_motion.mjs（已納入 build）驗證邊界、有限幅度與交接連續性。studio 新增倍率翻牌／倍率逐格；0ms 舊 10×、200ms 新 20×與實際半速更新已檢查，瀏覽器 0 個 runtime error。截圖 design/reviews/mechanic_acting_20261019.png。全專案型別檢查仍 39 個既有錯誤／23 檔、0 警告，本輪元件無型別錯誤（E:/stake/tmp/treasure-mechanics-types.log）。

後續演繹整合建置通過：E:/stake/tmp/treasure-mechanics-build.log（adapter-static ✔ done；/、/setup、/studio、/animationlab 皆 200）。


2026-10-19 視線與主次演繹追加：TreasureGaze 以原眼白內部 stencil 畫可動瞳孔，跟隨頭部同一 transform；保留原眨眼圖。TreasureFigure 以臨界阻尼保留追焦速度，掃描時追列、勝利時看最高獎額主線中心；救生員鏡像方向與 reduced-motion 已處理。WinLines 使用 rankWinningLines 排序並保持獎額／格位不變；主線先出、次線筆觸退讓，重疊金額牌只保留高優先者。SymbolWinAnim 於掛載時固定主次身分，次線延後 44ms 再壓回原 970ms 完成視窗，避免線條先清除時動作變速。studio 新增視線檢查近景／左右上下控制，符號逐格與中獎預覽可看固定主次樣本。兩角色極端方向與 1455ms 閉眼檢查通過，實際中獎回呼20/20、瀏覽器 runtime error為0；截圖 design/reviews/gaze_digger_20261019.png 與 gaze_lifeguard_20261019.png。check_attention.mjs 已加入 build，驗證追焦、重設、獎額排序不變量、金額牌避讓與原完成時刻。型別檢查維持39既有錯誤／23檔、0警告（包含 WinLines 既有 readonly payline 轉型錯誤），紀錄 E:/stake/tmp/treasure-attention-types.log。無有效 RGS session，正式平台多線觸發仍待實測。

視線與主次演繹最終建置通過：E:/stake/tmp/treasure-attention-build.log（adapter-static ✔ done，四個入口皆200）。

