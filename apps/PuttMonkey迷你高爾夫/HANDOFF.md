# PuttMonkey迷你高爾夫 交接

## 2026-10-17 兩段 Turbo（Claude，比照 Saucer）

- 關 → 單顆閃電 → 並排雙閃電 → 關（共用套件的 `turboTiers`／`turboLevel`／`cycleTurbo`，Saucer 那次已加）。本款 `turboTiers: 2`、`turboKeylineColor: 0x3fb4e8`；兩段都保留原本的藍色亮底，只用一顆／兩顆閃電區分（示意 `design/qa/turbo_two_tier_putt_20261017.png`）。
- Turbo 2：停輪 `SPIN_OPTIONS_FAST_T2`／`SPIN_OPTIONS_TURBO_FREEGAME_T2`（轉速 ×1.2、輪間隔 ÷1.2）；高爾夫球收分 1.5 倍（Turbo 1 仍正常速度）。規則頁 Turbo 說明改三段。

## 2026-10-17 使用者追加五項（Claude，比照 Saucer）

- **低獎字母在旗面內**：另一個 session 已把字母烤進 `l*_flag_v2.png`（build_putt_art.py 安全矩形），Symbol 不再疊字；實測字母離旗邊 ≥5.7px（140 格），網格動作中字母跟旗布一起擺，間距不變。補修：WinWays 小圖示原本會在已有字母的旗子上再排一次字（雙字），已改成不排。
- **Turbo 不加速收分**：`BanditCollect.svelte` 虛擬時鐘拿掉 `isTurbo?2:1`；動畫需求單 218／230 行同步。
- **露齒笑＋笑時晃動加大**：`wp/tools/cast_mesh_spec.py` 的 putt mg/fg 加 `teeth_split`（237／269）與 `laugh_gain=2`，`build_cast_mesh.py Putt` 重建；只有 chestbeat 改變，其他動作與舊檔逐一比對相同。影格 `design/qa/laugh_teeth_{mg,fg}_20261017.png`。
- **獎圖網格更生動**：`meshWin/puttWins.ts` 各圖一次性動作加大，H1/H2/H4/W 加整體傾斜（順風、撲咬、乾杯、歪頭），都在 `--limits` 上限內、動完靜止。`design/qa/mesh_wins_livelier_20261017.png`（渲染工具對 H4/W 預設畫 l1 底牌，遊戲中沒有）。
- `npm run build` 通過（`design/build_20261017_five.log`）；未上機。

## 2026-10-17 動畫與音效覆核

- 收分音效按動作分段：飛碟有獨立週期吸力底音；高爾夫有碰球、草地滾動底音與 91% 動作進度的進洞音，抵達後才響加分音。收分停止／清理會結束循環音，並移除原本重複疊上的高爾夫杯聲。原創合成來源與格式在 `design/source/putt/audio/collection/`；`audio:build` 已包含新腳本。
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
- 密集收分：以18顆P、2個W的獨立合成呈現案例900002驗證Turbo，兩組各44、合計88，結束後原盤面恢復，console無error。此案例不屬於正式數學；測試圖片 `design/qa/dense_turbo_motion.jpg`、`dense_turbo_final.jpg`。
- 收分動態驗收：`design/qa/golf_collection.gif`。舊回放截圖不代表本次最高倍率排版的最終畫面。

## 2026-10-16 正式製作（Codex）

使用者已核准兩張風格稿並指示開始製作；其後追加飛碟「太空船吸上去」與高爾夫特色收分動畫，兩款均以專業動畫完成度為目標。

- 正式獨立符號、低獎底牌、背景、角色與8張表情、開場三格、購買海報、UI與封面已製作並替換runtime。原稿、prompt及原runtime備份在 `design/source/putt/`。
- 低獎：旗桿、旗面、草皮、球與球座，程式排字保持清楚。
- 本款角色使用連續加權mesh，沒有沿用Strike切割片；動畫由 `design/build_putt_cast.py` 重建，表情換圖僅更動內臉，身體與外輪廓保持註冊。
- 兩款分別產生自己的47支音樂／音效；音樂母帶與正規化紀錄在 `design/source/putt/audio/`。動物聲為合成設計，非實錄。
- 專屬收分程式、虛擬時鐘、來源符號暫暗、多收集者、Turbo與逐顆抵達才加分已接入。詳見動畫需求單末節。
- 重建：`pnpm art:build`、`pnpm audio:build`；檢查及完整打包：`pnpm preview:build`。當次紀錄 `design/production-build.log`。
- 資產與前端正在遊戲內驗證；未宣稱上傳或送審完成。

## 2026-10-16 開案（Claude）

- 從 `StrikeMonkey保齡球館` 複製（Strike 的前端在 git 上是乾淨版本，含送審修正、BGM 修正、每手音效截斷、網格動態、觸頂數學）。Strike 的施工紀錄移到 `design/HANDOFF_from_Strike.md`，那裡寫的是保齡球版的歷史。
- game_id `PuttMonkey`、dev 埠 3040（storybook 6040）、launch.json `puttmonkey-dev`。數學在 `math-sdk/games/PuttMonkey迷你高爾夫`，junction `games/PuttMonkey`（別刪）。
- 已換：玩家可見文字（英中日）、W=高球猴 Golfer、P=高爾夫球 Golf Ball、S=金球旗 Golden Flag、買入 Birdie Round 100×／Hole in One 150×、擬聲字、介面配色、Logo 文字、背景螢幕欄名；保齡球專屬音效 cue 已改名（見音效需求單「轉場與 FG」）。
- 以下為複製當下的歷史；正式資產已依上方施工紀錄替換。原始需求單：`PUTT_美術需求單.md`、`PUTT_音效需求單.md`、`PUTT_動畫需求單.md`。
- `pnpm build` 通過（含全部守門腳本）。

## 還沒做

- 數學 books：只產了前端 config，**上傳前要跑** `run.py --books 100000 --threads 8`（約 12 分鐘），再跑 `pnpm check:claims`。
- 標題字型仍是 Bowlby One；換字型要重烘低分字母網格（Q／J）。
- `design/GAME_DESCRIPTION.md`、`design/cover/game_spec_en.txt`、`SPEC.md` 內文仍是 Strike 的說法，美術定案後改寫。
- 內部相容名稱 `BowlingScoreboards.svelte`（新版已替換視覺）、未使用的底版 `strikeWins.ts`、`FxBurst` 的 `'strike'` 分支等內部名稱未改，動畫需求單裡有對應的替換項目。

## 2026-10-17 高爾夫收分改為逐球推桿

- 使用者認為多球同時移動太亂；改成包含起球在內、任何時間最多一顆球移動的推桿佇列。獎值由小至大，最高獎值留最後。
- 第一桿建立動作，中段依球數加快，最後一球以1.32秒完成繞洞、洞邊兩次輕晃及下沉；旗幟在實際抵達時輕跳。移除交錯尾跡、抵達大圓環，縮小數字彈跳，收分擬聲牌只出現一次。
- 每顆球進洞才計入原book獎值；多收集者、Turbo及取消清理沿用。1–20球各佇列移動段無重疊，單位收集者移動排程低於7秒；Turbo及第二位收集者更快。
- `check_collection_motion.mjs` 增加排程互斥、快速與收尾路徑連續性，以及長盤面時間上限；檢查通過。型別／音效記錄 `putt-queue-checks.log`，建置 `putt-queue-build.log`。

- 實機驗收：一般速度2W／5P正確32×；手機390×844、Turbo、2W／18P正確88×、餘額1000−1+88=1087，瀏覽器錯誤0。一般速度無聲片段 `design/qa/putt-queue-normal.gif`；密集完成截圖 `design/qa/putt-queue-dense-turbo-final.jpg`。


## 2026-10-17 小白球與旗內低獎

- P獎圖改用內建imagegen生成的白色凹洞球，移除紅色粗帶與大面積空白徽章；原稿保留在 design/source/putt/symbols/p_white_v2.png，完整提示詞在 design/source/putt/prompts/symbol_p_white_v2.txt。舊原稿p.png保留。
- A／K／Q／J／10以原生字型排進三角旗面的安全範圍；gbL1..5一對一對應正確旗面，使用版本化檔名避免舊圖快取。
- 低獎改用puttFlags.ts完整旗子網格，字與旗面同步飄動；移除Symbol及BanditMeter重複字與旗底。小白球獎值置中並加細白描邊。逐球收分排程保持原設定。
- 驗證：preview:build全套檢查通過（49音效、全部網格與收分動作檢查、型別維持既有14項）；實機球面及倍率見 design/qa/white-ball-flags-prizes.jpg，五種旗面見 white-ball-flags-desktop.jpg。

## 2026-10-18 使用者五項（Claude）

- **過場不丟東西**：`TransitionAnimation.svelte` 拿掉丟出的金旗與 `mascotThrow`（LEAD 0，球直接滾入；蓋住時間改 IN+80）。Mascot 的 throwit 處理仍在但沒人觸發。
- **HA 對齊笑聲**：`Mascot.svelte` 的 HA 只在 `animationName === 'chestbeat'` 時畫；任何切走（大獎 cheer 蓋掉、動畫播完回 idle、FG 換角色）都會停掉字幕時鐘；已在笑時再觸發不再重啟時鐘（Spine 同名動畫不會重播，舊版會讓字幕跑在臉前面）。HA 壽命 420→360ms，最後一聲在 settle 臉之前消失。原 bug：collect 觸發笑＋同一手大獎 cheer → 臉已停但 HA 還在跳。
- **獎圖網格加強**：`meshWin/puttWins.ts` 改用本檔 `strongLeap`（蹲更深、上升拉長、頂點放大 9%、落地重壓扁＋落地後小搖），跳高 14–22→24–32；整體旋轉（不會撕網格）各加大一倍左右；關節表上限照 `--limits` 實測調整（H1 帆 8、H2 鼻 10／顎 11、H3 球桿 14、W 毛球 17、S 旗尖 15）。S 旗尖再大會在旗尖折到 <50%，已退回 13°。`check_mesh_wins` 通過。
- **FG 牌子重做**：新 `design/build_putt_fg_sign.py`（已接進 `art:build`，在 build_putt_art 之後）。fg_intro／fg_total 改成 Buy Bonus 明信片卡的橫式版：上方是球場風景（開場用夕陽 FG 背景、結算用白天背景）、下方是卡片原畫的紙面（左右角草叢 1:1，中段拉長）、墨框照卡片實測。角落小圖拿掉，decor 圖寫成空白並重跑 `make_decor_meshes.py`（只有 FG 兩塊變 0 個）。FreeSpinAnimation 的 PAPER 改成 x200–1400／y452–950，標題改紅字墨邊（同 logo）。FG 計數牌也改成卡片紙＋卡片草皮表頭（`fg_counter.png`／`v8FgCounter`），拿掉紅色錯位印與平塗色帶。
- **升級動畫重做**：`BanditMeter.svelte` 改在明信片牌子上演：牌子落下回彈 → 低獎旗卡在風景草地上彈出 → 球童從右邊進場、後擺推桿 → 真的高爾夫球滾過草地（白色速度線）撞飛旗卡（翻滾飛出＋FxBurst＋框震）→ 獎球從上方落進空位、壓扁回彈、金色光芒在後面轉＋一圈金環 → 三段金旗 rung 點亮。結算：「+N SPINS」字圖落在獎球旁，拿掉紅色方塊印章。時間點與音效（roll／cup／ladder／stamp）完全照舊。
- `pnpm preview:build` 通過（`design/build_20261018_fg.log`，型別仍是既有 14 項）。**未上機**：升級動畫與 FG 牌子的版面位置只算過、沒在瀏覽器看過。（大獎牌匾見下一節）

## 2026-10-18 大獎牌匾重做（Claude）

- 新 `design/build_putt_win_plaques.py`（已接進 `art:build`，在 build_putt_fg_sign 之後；`board()` 改成可指定尺寸／比例／風景橫向範圍）。五級都是明信片：上方風景、下方卡片紙面，等級靠風景內容與外框印色往上爬，不再塞小圖：big 白天風車／米框、super 白天恐龍＋火山／米框紅線、mega 夕陽圍籬／紅框米線、epic 火山噴發／綠框金線、max 整片夕陽球場／金框墨線。
- decor 圖全部空白並重跑 make_decor_meshes（WIN_DECOR 全為 0）；Win.svelte 拿掉 PropMesh 迴圈。等級名放在風景與紙面交界（`SEAM_Y -0.057`），紅字墨邊、epic/max 金字；金額在紙面 `bh*0.22`。
- `pnpm preview:build` 通過（`design/build_20261018_winplaques.log`，型別仍 14 項）；未上機。

## 2026-10-18 細節（Claude）

- `art:build` 原本會跑 Codex 的 `build_putt_cast.py`，把人物 Spine 寫回舊版（6 拍笑、無露齒，HA 對齊會再壞掉）。已在後面接 `../../tools/build_cast_mesh.py Putt`；重跑後 monkey.json 雜湊與現有檔相同。Saucer 同樣修了。
- 升級動畫：球童 x .35W→.30W（直式畫面全寬時右緣會出框）、球起點跟著移、三段金旗往左收（-.29／-.12／.05W），避開球童與紙面左下草叢。

## 2026-10-18 工具列與 COURSE CARD（Claude）

- **COURSE CARD 移到 Buy Bonus 正下方**：`BowlingScoreboards.svelte` 改用 standard 主版面座標（與 bet bar 放 Buy Bonus 同一個 box：x=railWidth/2，牌底由 buyBonus* 主題鍵算出，下方留 14），並從 Background（模糊層）移到 Game.svelte 背景之後、盤面之前，字不再被背景模糊。空間不夠時縮小、比底部列頂端高 12；直式仍隱藏。
- **BALANCE／WIN／BET 上移**：`readoutOffsetY: -8`（同 Saucer）。
- **BET 右邊下箭頭 hover 反灰**：共用套件新增 `uiTheme.labelChevronHoverColor`（預設 undefined＝不變，UiLabel 只在 hovered 時換箭頭色）；本款設 0x67645c（步進鍵停用的灰）。
- Putt `preview:build` 通過（`design/build_20261018_bar.log`）；Saucer、JadeTeahouse `vite build` 通過；其他款未逐一建置（新鍵預設不生效）。未上機。

## 2026-10-18 笑聲對齊 10 拍 HA!（Claude）
- 笑臉動畫照 `laughTiming.json` 跑 10 拍（首拍 480ms、每 280ms、3650ms 收），舊 `putt/voice_laugh.wav` 太短（≤1.45s）且無分明音節，第三個 HA! 之後無聲張嘴。比照保齡球猴重做。
- `design/generate_laugh_voice.py`（從 StrikeMonkey 移植，原創共振峰合成，讀 laughTiming.json）：10 聲各對一拍，每聲個別拉平音量、音高中段最高，尾巴吸氣；3.73s。本款音色：明亮俐落的「哈」（基頻 275Hz、/a/、每聲 0.2s）。舊檔備份在 session scratchpad。改 laughTiming 後要重跑。接法未動；未上機聽過。

## 2026-10-19 笑聲與 Turbo（Claude）

- **笑聲換成 Diner 的錄音式笑聲並重新對齊**：原本是共振峰合成的 10 拍「HA」（3.7 秒、每 280ms 一聲，generate_laugh_voice.py），聽起來機械。改用 Diner 的 voice_laugh（`design/source/putt/audio/voice_laugh_recorded.wav`，由 `design/install_laugh_voice.py` 安裝，已接在 `audio:build` 最後）。從波形量到 5 聲 HA 的起音在 0／210／420／630／840ms、約 1150ms 收尾，`laughTiming.json` 改成 startMs 260、gapMs 210、beats 5、endMs 1500、`voiceDelayMs 260`（聲音在 chestbeat 開始 260ms 後才播，先吸一口氣）。人物 Spine 用 `build_cast_mesh.py Putt` 重建：張嘴露齒格在 0.26/0.47/0.68/0.89/1.10s，正好是 5 聲起音；動畫長 1.85s。HA 字幕同一份時間表，壽命改成 1.5 倍拍距。
- 共用工具 `wp/tools/build_cast_mesh.py`：起笑時間與身體抖動寬度、張嘴停留改成跟拍距走（`min(原值, 依拍距)`），Saucer 重建後 monkey.json 雜湊不變。
- **Turbo 改成只亮閃電**：`activeByIconOnly: ['turbo']`（同飛碟）——開啟時圓盤維持未開啟的綠色，閃電內部填滿奶油白；Turbo 2 前閃電的切口色改為綠盤色 0x3e7a45（print skin）。Autoplay 仍是藍色亮盤。
- `pnpm preview:build` 通過（`design/build_20261019_laugh_turbo.log`，型別 14 項同基準）；未上機。
