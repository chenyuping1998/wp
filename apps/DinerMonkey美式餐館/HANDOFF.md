# Diner Monkey（美式餐館）交接

## 路徑

- 前端：`E:\stake\wp\apps\DinerMonkey美式餐館`（package `diner-monkey`，dev 3033、storybook 6033，launch.json `dinermonkey-dev`）
- 數學：`E:\stake\math-sdk\games\DinerMonkey美式餐館`；`games\DinerMonkey` 是指向它的 junction（math-sdk 用 game_id 拼路徑，**別刪**）
- game_id：`DinerMonkey`

## 狀態（2026-10-09）

- 從 JadeTeahouse 整包複製前端與數學（排除 node_modules／build）。數學全等，books／LUT 是茶樓那份的複本，
  只手改了 `library/configs` 的 gameID／gameName，`config_fe_JadeTeahouse.json` 改名為 `config_fe_DinerMonkey.json`。
  **上傳前要用新 game_id 重跑 `run.py`**。
- 已改：package 名、port、`sync_math_config.mjs` 路徑、頁面標題、遊戲名、規則頁標題、`DINER_MONKEY_BET_MODE_META`。
- `pnpm build` 通過。
- 2026-10-09 已完成：玩家可見文字換成餐館名詞（含中日文）、送審介紹、Bangers 標題字（Q 尾巴網格重對位）、介面配色。
- 美術與音效已換成 DINER MONKEY 主題。需求單：`DINER_美術需求單.md`、`DINER_音效需求單.md`；最新進度見文末。
- 內部 asset 資料夾 `sushiXxx`、事件 key `banditMeter`、config 鍵 `jadeCupValues` 刻意保留，換圖只替換同名檔。

## 指令

```powershell
# from E:\stake\math-sdk
.\env\Scripts\python.exe games/DinerMonkey/smoke.py
.\env\Scripts\python.exe games/DinerMonkey/run.py --books 100

# from E:\stake\wp\apps\DinerMonkey美式餐館
E:\stake\tools\node-v22.23.1-win-x64\corepack.cmd pnpm build
```

數學說明與 RTP 現況見 `SPEC.md` 與數學資料夾的 `README.md`（沿用茶樓的數字）。

## 2026-10-09 美術／音效進度

- 使用者已核准 `design/source/diner/style_test_v1.png`。原稿位於 `design/source/diner/`；`python design/build_diner_art.py` 會輸出符號、場景、UI、特效、封面與縮圖到遊戲使用的既有路徑。`design/source/diner/_sheets/` 有縮圖總覽、70px 符號與角色表情檢查圖。
- MG 主廚與 FG 溜冰服務生已切層、重建 Spine atlas；表情由 `python design/build_diner_faces.py` 對齊。`CAST=mg`／`CAST=fg` 執行 `node design/generate_monkey_spine.mjs E:\stake\tools\gen` 可重建圖集。
- 紅色 `sushiUi/spin_plate.png` 已接到 `uiTheme.sprites.bet` 作為 SPIN 按鈕；印刷版 UIBAR 的淺色圓鈕搭配深色圖示。實際在 1280×720 本機畫面檢查過主畫面。
- 標題頁、三格說明、進場彈簧門、FG 觸發牌及五階大獎牌已重製為同一套美漫餐館視覺。轉場在門合上時顯示程式排字的 `ORDER UP!` 爆炸徽章；FG 和 MAX WIN 的文字疊圖位置見 `design/source/diner/_sheets/fg_runtime_preview.png`、`win_runtime_preview.png`，整組交件見 `diner_presentation_contact.png`。素材可由 `python design/build_diner_art.py` 重建。
- 高分符號動畫已改為 Diner 專用 rig，背景透明分件（風扇、點唱機、OPEN 招牌、蒸氣）已接入。
- 39 個遊戲 cue 與兩首配樂已生成到 `static/assets/audio/diner/`，`Sound.svelte` 已切換路徑並以 Web Audio 迴圈播放 BGM。可重建腳本與母帶在 `design/source/diner/audio/`，音量清單在 `LEVELS.md`。
- `pnpm build` 通過：198 個資產路徑、39 個音效 cue、社交版禁詞、mesh 動作與角色動作檢查皆通過。音效起音、峰值、總容量與 MP3 解碼後的迴圈取樣數已自動檢查；仍待實機聆聽（連按 20 次 Spin、Turbo、耳機與筆電喇叭）。

## 2026-10-09 網格動態（比照茶樓）

茶樓有做、餐館原本沒有的網格動作全部補上，皆以 Diner 美術重新量測：

- **落地**（`meshWin/lands.ts`，260ms、`fixedSpeed` 不受 Turbo 影響）：H1 上層麵包跳、H2 櫻桃吸管晃、H3 香腸尖翻、H4 派尖點、W 帽子震、S 按鈕彈、P 點單晃。`Symbol.svelte` 從茶樓整支複製。
- **待機**（`meshWin/idles.ts`＋`game/idleDirector.ts`＋`IdleDirector.svelte`）：盤面靜止後隨機挑格子做小動作（主廚脫帽致意、鈴被按一下、點單飄…），有獎金的 P 不動。
- **P 收集**（`meshWin/pTray.ts` P_PICK）：托盤朝主廚傾斜、點單甩動後才被收走（`BanditCollect.svelte`）。
- **FG 牌**（`meshWin/fgBoard.ts`）：板子仍是 sprite；角落裝飾層走 mesh —— 進場牌兩個服務鈴落地搖晃、按鈕響、旁邊的 ding 線閃；結算牌漢堡塔果凍晃、盤子堆一片片搖。
- **背景**（`meshWin/bgProps.ts`）：三盞吊燈擺動（中獎時有一陣風）、點唱機隨 120bpm 打拍壓扁；Codex 的透明分件（風扇、OPEN、蒸氣、點唱機霓虹拱）仍在 `DinerBgProps.svelte`，霓虹拱跟著點唱機一起壓。FG 夜景多了從點唱機飄出的音符（`FloatingNotes.svelte`，`design/make_diner_note.py` 產 `dinerMesh/note.png`）。
- **人物服飾飄動**（`design/source/{mg,fg}/rig.json` 的 `flow`）：主廚圍裙綁帶（兩節）＋圍裙下擺；服務生髮帶、腰間蝴蝶結、裙擺。幅度已掃到 `check_cast_flow` 的極限（主廚 0.7、髮帶 0.5、蝴蝶結 0.7、裙擺 1.25 倍）。改完要 `CAST=mg`／`CAST=fg` 重跑 `generate_monkey_spine.mjs`。
- **陰影重烘**：`jadeMesh/*_shadow.png` 原本還是茶樓圖的輪廓，已用 `python design/make_jade_mesh_layers.py` 依 Diner 圖重烘。換符號圖後要重跑。
- 讀取畫面 logo 改成載完淡出（茶樓同款修正，避免直式畫面兩塊招牌疊在一起）。
- 刪掉沒在用的茶樓／Boomana rig：h1Teapot…sLantern、fsSign、highJump、winFx、banner、BannerMesh.svelte。
- `pnpm build` 全部守門通過；**尚未上機看過**。

## 2026-10-09 實機回饋修正

- FG 結束後 FG BGM 在主遊戲一直循環 → transition cover 切回 `bgm_main`；`playCnLoop` 解碼期間被 stop 會永遠循環 → `loopWanted`。
- UI BAR（print 皮）：字改奶油色＋黑邊（Win 白），跑馬燈奶油＋黑邊；讀數 `readoutScale` 0.84、跑馬燈 `barMessageScale` 0.74（共用套件新 key，預設 0.68／0.6 不影響別款）。−／+ 改繪製圖示（`design/make_step_icons.py`）。
- 服務生切符號的擬聲字「ザクッ!」→「CHOP!」。
- Buy Bonus 改直立菜單卡（`design/build_buybonus_menu.py`，舊圖備份在 session scratchpad）；`buyBonusBoxAspect` 1.6（共用新 key，預設 1），點擊範圍跟著變直。直式畫面縮到 0.72，**尚未上機確認直式位置**。
- Big-win 牌匾裝飾層走 mesh（`meshWin/winDecor.ts`，Win.svelte）：漢堡果凍晃、鈴搖＋按鈕響、熱狗、奶昔、星星閃、MAX 兩隻猴臉大笑點頭。
- 讀取頁三格說明改成壽司猴式插畫場景（`design/build_diner_intro_scenes.py`；Codex 原版爆炸框備份在 `design/source/diner/intro_burst/`）：主廚＋櫃檯＋滑來的托盤、服務生溜冰切開「10」牌換成托盤、GUEST CHECK 帳單（FeatureIntro 在留白處排 10,000×，旋轉 5°）。標題／內文字放大。
- 說明卡網格（`meshWin/introCards.ts`，整張場景一個 mesh）：主廚晃身點頭、三個托盤在櫃檯上輪流搖（不跳，跳會拖動櫃檯欄杆）、服務生溜冰起伏＋舉托盤的手搖、切開的「10」兩半漂移、閃光；帳單本身**刻意不動**（10,000× 是另外排的字，不跟 mesh），改讓漢堡果凍晃、鉛筆搖。座標取自 build_diner_intro_scenes.py 的排版，**改排版要重量**。
- **人物接縫修正（2026-10-09）**：笑／投擲時圍裙裂、褲襠黑塊、手臂旁碎片。原因是切層時藏在手臂／大腿下的像素是橫向拖影，且前臂圖帶走了一條圍裙邊。修法：
  - `design/clean_cast_trunk.py`（會先跑 `clean_cast_arms.py`）：前臂去掉圍裙／洋裝碎片並貼回軀幹（或大腿），軀幹被手臂蓋住處垂直延伸重建、上臂下方只留墨線、大腿下改純黑褲（服務生保留原樣）。原圖在 `design/source/<cast>/_orig/`，腳本每次從原圖重算。
  - `generate_monkey_spine.mjs`：軀幹腰下逐漸交給 hip 骨（`TRUNK_HIP_FROM/OVER/MAX` = -60/420/0.45，掃描出能過 check_cast_flow 的值）。
  - 檢查工具：`design/dump_cast_frames.mjs <mg|fg> <anim|setup> out.json [fps]` ＋ `design/render_cast_frames.py`（`TINT=1` 依 slot 上色）可離線看真實網格逐格圖；靜止姿勢與原圖比對差異約 300–500px（毛邊）。

## 2026-10-10 收集音效只留在該手（Claude）

- 使用者回報：Wild 收分後，收集的音效拖到下一手還在響。原因是一次性音效（收集叮噹、大聖/主角笑聲、算盤跑分 2.2s、大獎號角 2–6s）都會播到結束，沒人停。
- 修法：每手 reveal 送 `soundSpinCut`，`Sound.svelte` 的 `cutSpinSounds()` 把 `SPIN_SCOPED` 清單裡的音效（含 `coin_in` 的疊播複本）在 160ms 內淡出停止。轉輪、停輪、Scatter、FG 觸發鈴、過場門不在清單內。
- 茶樓底七款（Jade／Diner／Pocha／MK／Swing／Mardi／Strike）同步修；未上機。

## 人物網格重切（2026-10-10，Claude）

- 使用者回報擺動時衣服重疊、身體跑掉。原因：多數角色沿用別款的方框切線與關節點（壽司猴的 neck 207、hand 118,558），手臂層帶走了身體、尾巴、鞋尖，關節不在畫上的位置。
- 修法：在 `design/cut_cast_layers.py` 依本款原圖逐列掃描墨線重切（袖子沿腋下縫線、前臂沿身體間隙、大腿從衣襬／肚子下緣、鞋子完整）；rig.json 加 `joints`（實測肩肘髖膝踝）、`sleeveHem:false`、`gusset`、`legBlend`／`kneeBlend`（無衣襬的連身褲）、`underlay`（被手臂遮住的身體改填乾淨衣色並描邊；`hidden` 補畫被手遮住的尾巴段）。
- 流程：`python design/cut_cast_layers.py <mg|fg>` → `python design/fill_cast_underlay.py <mg|fg>` →（Diner mg 另跑 `clean_cast_trunk.py` + `fix_apron_hem.py`）→ `CAST=<mg|fg> node design/generate_monkey_spine.mjs E:/stake/tools/gen`。頭部切線保留（笑臉表情對齊頭框）。
- 驗證：`check_cast_flow` 全過；離線逐格渲染量「脫離身體的碎片」，各角色最大值降到 ≤300px（原本茶樓 ~470、Diner 31,000、Pocha 11,000、Swing 30,000）。未上機。
- 原版備份在 session scratchpad（cast_backup/），未進 git。


## 2026-10-10 演繹修整
- 過場改用單張主題門面／布幕由上落下、完全遮場後升起；移除左右鏡像造成的重複圖案與中央接縫。
- FG 底板、裝飾與文字使用同一旋轉容器，避免落牌後文字與邊飾對位漂移。
- 得分粒子改為該款的主題圖案，在獎金牌兩側緩慢飄動，移除泛用旋轉光芒與香蕉噴灑；大獎震動改為衰減擺動。
- 靜態檢查：build、check_types 基準、check_assets、check_mesh_wins、check_cast_flow 通過。本輪遵照使用者要求未開瀏覽器，實際播放視覺仍待預覽。


## 2026-10-10 線條巡檢
已檢查 FG 牌、獎金牌與功能牌的內部裝飾線。保留外輪廓、側燈及漫畫式墨線；移除妨礙標題或副標閱讀的多餘線條。五款素材路徑檢查與靜態建置通過，依使用者要求未開瀏覽器。

## 2026-10-10 音效節奏與主題收分
- 收集倍率的蓋印音效從蓋印開始移至圖章真正落下（約延後 182ms），與數字跳值同步。
- FG 總獎收分聲改在牌子落定（700ms）播放，音量調至 0.72；FG 入場短曲在下一轉開始時淡出，避免跨轉殘留。
- 保齡球、嘉年華、韓式路邊攤、爵士的收集起手、逐顆入帳、蓋印、小獎與總收分音已按主題重新合成；美式餐館保留既有餐館收銀音，將較響的收集起手調低。新 FG 入場短曲對齊落牌節奏，並避開數字蓋印聲。
- 五款 check_audio、check_assets、vite build 通過；WAV 長度、峰值、結尾與格式已檢查。依使用者先前指示沒有開瀏覽器，實際聽感仍待播放確認。
## 2026-10-10 美式餐館音效客製化
- 重做收集起手、逐顆入帳、倍率蓋印、小獎／中獎、FG 入場及總收分七個短音效：餐盤滑行、餐具碰撞、訂單紙蓋印、服務鈴與收銀機組成餐館聲音語彙。
- FG 入場聲避開數字蓋印既有音效的時間點；收集起手從約 -11.65 LUFS 降至 -18.65 LUFS，避免蓋掉入帳聲。`design/source/diner/audio/LEVELS.md` 已更新七個音檔的量測值。
- `check_audio`、`check_assets`、`check_types` 與 `vite build` 通過。依使用者先前指示未開瀏覽器預覽，實際播放聽感仍待確認。
## 2026-10-10 五款共用效果再客製化
- 轉輪落定、門檻升級預備與擊中三個高頻音效重新按主題合成；門檻擊中改用單一主題聲，移除原本同時疊上的蓋印聲。
- 觸發獎圖和讀取頁交接時的泛用發光星星，改為平塗漫畫小物件：保齡球瓶／遊行珠飾／訂單票券／碗筷／音符；去除全畫面白閃，保留五欄依序揭開的節奏。
- 五款音效檔均互不相同，WAV 格式、峰值與結尾檢查通過；check_audio、check_assets、check_types 與 vite build 通過。依使用者先前指示未開瀏覽器，實際演出觀感仍待播放確認。

## 2026-10-10 背景點餐黑板
- 原本空白的餐館黑板加入最近三轉的訂單號和實際派彩倍率；轉輪停下時新增一筆，結算時更新該筆數字。FG 夜景保留原有霓虹框，字色改成較冷的粉筆色。
- 文字跟隨背景 cover 與緩慢位移；沒有另加浮動牌層、閃光或與遊戲結果無關的假數字。
- check_types、check_assets、vite build 通過；未開瀏覽器，畫面中的實際可讀性尚待預覽確認。

## 2026-10-10 可讀性與主題文字
- 點餐黑板的標題與欄名改用手繪漫畫展示字，派彩數字保留易讀數字字體。
- 直式讀數面板的紅色略加深，奶油字對比由約 4.06:1 提升到約 4.94:1；FG 夜景的提示文字由午餐尖峰改為晚餐尖峰。
- check_types 通過；未開瀏覽器預覽。
- **2026-10-10 說明卡**：三格說明改回靜態 Sprite（網格已移除：圖被切壞），外框改單一墨線＋一條細紅線（`build_diner_intro_scenes.py` 產 `menu_frame.png`）。`build_diner_art.py` 的 `OWNED_ELSEWHERE` 讓它**不再覆蓋** intro_* 與 menu_frame（2026-10-10 下午曾被重跑蓋回爆炸框舊圖）。

## 2026-10-10 點餐單過場
- 舊雙門板改為一張大型廚房點餐單：從上方拍到鏡頭前、短暫蓋滿畫面以切換 base／FG 場景，再向下抽走。保留人物拋盤時序，等拋盤動作結束才換場。
- 新增 `sushiScene/transition_ticket.svg` 與紙張滑動、落定、抽走三段專屬音效；舊門板／布簾／徽章不再預載或出現在過場。
- SVG 結構、素材與音效路徑、型別及 vite build 通過；依先前指示未開瀏覽器，動態觀感仍需畫面驗證。

## 2026-10-10 傳單過場與 J 得分修正
- 依預覽修正：傳單從人物手部座標起飛，以弧線與輕微擺動飛近鏡頭，蓋滿畫面後向右上方揭走；讀取頁沒有角色時從右側起飛。傳單改成可辨識的餐館宣傳單，縮小漢堡圖並加入主標題，避免滿版時只剩放大漢堡。
- 三段過場聲改為紙張飛行、貼合、揭起；不再呼叫舊的拉門聲或拋盤聲。
- J 獎圖的網格移除單獨拉扯下鉤的骨頭，改為整個字形輕微擺動，避免墨線接縫被切開。
- 在本機回放預覽實際觀看傳單起飛、蓋畫面與 J 得分；`vite build`、素材／音效檢查、J 網格檢查通過。

## 2026-10-11 得分牌與盤框修正
- BIG WIN 右側伸出的黑線來自 `win_big_decor.png` 的裝飾網格；停用該線條群，保留左側漢堡。
- 原版小數點圖檔在底緣被裁切，`InkNumber.svelte` 改由 Pixi 畫在字框內，BIG WIN 與 TOTAL WIN 共用。
- 盤框重繪後移除四角外凸黑影；改以 `frame_edge_clean.png` 新檔名載入，避免瀏覽器沿用舊快取。回放已確認四角乾淨，Vite 建置通過。
