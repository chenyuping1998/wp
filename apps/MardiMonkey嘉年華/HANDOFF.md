# Mardi Monkey（嘉年華）交接

## 最新完成狀態（2026-10-10）

- 依核准的 2D 漫畫方向建立原創場景、七款主獎圖、兩名角色、介面、FG 牌、轉場、封面及 39 個 WAV 音效、兩首 MP3。三張說明過場改為平塗漫畫圖卡，控制花俏與 AI 感；獎圖無閃光。
- 珠鍊倍數獎圖的 1x–250x 數字印在下方圓章，不遮住珠鍊；遊戲尺寸離線圖：`design/qa_mardi_prize_badges.png`。
- 人物 Spine 網格已收斂角度，逐格檢查衣服、身體和尾巴接縫；`check_cast_flow.mjs` 八種動作通過，無網格反轉。圖騰上跳和 FG 牌擺動已調整。
- UI bar 採深紫數值面與奶油色字；資產、音效、型別、網格、人物檢查及 Vite build 通過。
- 數學各模式各 10,000 本新 books，包含 10,000x 觸頂；SDK 驗證通過，LUT RTP 各模式皆為 96%。`smoke.py` 及 `check_copy_claims.py` C1–C9 通過。
- 2026-10-10 前端重播實測：開場補上 MARDI MONKEY 名稱；FG 標題、次數、結算收為單一主牌；過場改為平塗漫畫遊行布幕掃過，在全畫面遮住時切場。FG、得分動畫、人物換裝與資訊列已於瀏覽器走過；本機重播倍數單位修正為 20.2x／$20.20。下方「先前狀態」為施工前紀錄，以上述最新狀態為準。

## 路徑

- 前端：`E:\stake\wp\apps\MardiMonkey嘉年華`（package `mardi-monkey`，dev 3038、storybook 6038，launch.json `mardimonkey-dev`）
- 數學：`E:\stake\math-sdk\games\MardiMonkey嘉年華`；`games\MardiMonkey` 是指向它的 junction（math-sdk 用 game_id 拼路徑，**別刪**）
- game_id：`MardiMonkey`

## 先前狀態（施工前紀錄）

- 前端與數學都從 `SwingMonkey爵士俱樂部` 複製（茶樓底，數學全等）。books／LUT 是茶樓那份的複本，只手改了
  `library/configs` 的 gameID／gameName，`config_fe_SwingMonkey.json` 改名為 `config_fe_MardiMonkey.json`。
  **上傳前要用新 game_id 重跑 `run.py`**（同時處理茶樓家族的「沒有觸頂 10,000× book」待辦，見下）。
- 從 Swing 複製是因為 Swing 已含茶樓家族的送審修正（featureTotal、Spin 光暈關閉、限制字詞形、重播 6 位小數、
  `pnpm check:claims`、漫畫擬聲字 ComicPop）。另外從 MonkeyKingRush 移植了 Sound.svelte（`loopWanted`、BGM 改 Web Audio 解碼迴圈）
  與 bookEventHandlerMap.ts（FG 結束切回 `bgm_main`），所以茶樓家族三個共有 bug 在本款都已修。
- 已改：package 名、port、`sync_math_config.mjs`、標題與遊戲名、`*_BET_MODE_META`、玩家可見文字（含中日文）、送審介紹、
  規則頁、WIN TABLE、Buy 選單、擬聲字（CATCH!／WOO!／BEADS!、PARADE!、STRUT IT!／HOORAY!；計量表打擊字 STRUT!）、介面與元件色碼。
- 名詞：W=Marshal 遊行隊長猴、FG=Float Rider 花車猴、P=Bead 串珠、S=Golden Mask 金面具；H1 國王蛋糕／H2 小號／H3 遊行陽傘／H4 甜甜圈方塊；買入 Second Line 100×／Fat Tuesday 150×。
- **美術與音效仍是 Swing Monkey 的**（音效資料夾已改名 `static/assets/audio/mardi/`）。需求單 `MARDI_美術需求單.md`、
  `MARDI_音效需求單.md` 交給 Codex 執行；美術單第 12 節收錄了茶樓／Diner／MK 修過的坑。
- 標題字 **Fascinate**（2026-10-10 換，`static/fonts/sushi/Fascinate-Regular.ttf`，OFL）。低分字母網格已重烘，`lowLetters.ts` 的 A K Q J 10 形狀全部依新字重新量過（墨跡覆蓋率 ≥99.7%，`check_mesh_wins` 通過）。再換字型要重跑 `design/make_jade_mesh_layers.py`、重量形狀並跑 `check_mesh_wins.mjs`。
- 網格中獎骨架仍是 Swing 的 `swingWins.ts`，換圖後要依新剪影重調；`design/dump_cast_frames.mjs`、`render_cast_frames.py` 從 Diner 複製來，可離線檢查人物網格。
- 內部 asset 資料夾 `sushiXxx`、事件 key `banditMeter`、config 鍵 `jadeCupValues` 刻意保留，換圖只替換同名檔。

## 指令

```powershell
# from E:\stake\math-sdk
.\env\Scripts\python.exe games/MardiMonkey/smoke.py
.\env\Scripts\python.exe games/MardiMonkey/run.py --books 100

# from E:\stake\wp\apps\MardiMonkey嘉年華
E:\stake\tools\node-v22.23.1-win-x64\corepack.cmd pnpm build
```

## 數學待辦（茶樓家族共通）

- 買入模式的進場盤只放 Scatter、不結算（規則頁已說明）。
- 1 萬本樣本最高約 1,138.8×，**沒有觸頂 10,000× 的 book**；正式重跑時 game_config.py 每個模式加 wincap 分佈、強制觸頂，再跑 `pnpm check:claims`。

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

## 2026-10-10 動畫演繹修整
- 大獎和 FG 總獎的香蕉粒子改為主題素材：保齡球瓶／嘉年華珠飾，沿獎金牌兩側慢速飄動，避免擋住標題與數字。大獎移除泛用旋轉光芒和重複粒子層。
- 大獎牌入場震動改為衰減的規律擺動，避免隨機抖動；FG 牌子的裝飾貼齊底板，同步落下，不再各自平移或旋轉。
- 補齊裝飾網格 Thing 的 area 型別。兩款 `vite build` 成功，`check_types` 回到既有 14 錯誤基準內，`check_assets` 各 186 路徑通過。依使用者要求，本輪未開瀏覽器預覽；動態視覺仍待下次允許預覽時確認。


## 2026-10-10 線條巡檢
已檢查 FG 牌、獎金牌與功能牌的內部裝飾線。保留外輪廓、側燈及漫畫式墨線；移除妨礙標題或副標閱讀的多餘線條。五款素材路徑檢查與靜態建置通過，依使用者要求未開瀏覽器。

## 2026-10-10 FG 開場與收集節奏巡檢
- FG 牌子落下後依序呈現標題、獎勵數字、底部說明；底部文字改在蓋印後淡入，避免提早蓋住尚未完成的入場演出。
- 收集獎圖仍逐顆預備、飛向收集者、逐次加值，倍率蓋印維持在加值之後；飛行路徑按主題調整，保齡球低弧、嘉年華高拋微擺、韓式路邊攤短弧、爵士雙拍微擺。保留平塗漫畫視覺，沒有新增閃光或多餘牌層。
- 已通過 vite build、check_assets、check_mesh_wins、check_cast_flow、check_types；依使用者目前指示未開瀏覽器預覽，動態觀感尚待預覽確認。
## 2026-10-10 音效節奏與主題收分
- 收集倍率的蓋印音效從蓋印開始移至圖章真正落下（約延後 182ms），與數字跳值同步。
- FG 總獎收分聲改在牌子落定（700ms）播放，音量調至 0.72；FG 入場短曲在下一轉開始時淡出，避免跨轉殘留。
- 保齡球、嘉年華、韓式路邊攤、爵士的收集起手、逐顆入帳、蓋印、小獎與總收分音已按主題重新合成；美式餐館保留既有餐館收銀音，將較響的收集起手調低。新 FG 入場短曲對齊落牌節奏，並避開數字蓋印聲。
- 五款 check_audio、check_assets、vite build 通過；WAV 長度、峰值、結尾與格式已檢查。依使用者先前指示沒有開瀏覽器，實際聽感仍待播放確認。
## 2026-10-10 五款共用效果再客製化
- 轉輪落定、門檻升級預備與擊中三個高頻音效重新按主題合成；門檻擊中改用單一主題聲，移除原本同時疊上的蓋印聲。
- 觸發獎圖和讀取頁交接時的泛用發光星星，改為平塗漫畫小物件：保齡球瓶／遊行珠飾／訂單票券／碗筷／音符；去除全畫面白閃，保留五欄依序揭開的節奏。
- 五款音效檔均互不相同，WAV 格式、峰值與結尾檢查通過；check_audio、check_assets、check_types 與 vite build 通過。依使用者先前指示未開瀏覽器，實際演出觀感仍待播放確認。

## 2026-10-10 場景得分回應
- `setWin` 的實際派彩讓原有上方布幔網格再作一次小幅擺動；擺幅依派彩金額緩慢增加，上限為原本的 1.3 倍，邊界仍固定在原圖。
- 不加閃光或新的珠串圖層。check_types 與 vite build 通過；未開瀏覽器預覽。

## 網格動態補齊（2026-10-10，Claude）

比照 Diner／茶樓補上本款缺的網格動態，全部離線驗證、未上機：

- **落地／待機／收集**：`src/game/meshWin/acts.ts`，由本款各符號中獎骨架的配件自動產生（落地壓扁＋配件依序回彈；盤面靜止時隨機挑格子做小動作，由 `game/idleDirector.ts` + `IdleDirector.svelte` 排程；收集物先跳起並朝收集者傾斜再飛走）。`Symbol.svelte` 換成 Diner 版、`ReelSymbol` 傳 row、`SymbolMeshWin` 加 `fixedSpeed`、`BanditCollect` 改用 `P_PICK`。
- **FG 面板與大獎牌匾的裝飾層**：`meshWin/decorMeshes.ts`，由 `design/make_decor_meshes.py` 從裝飾圖的 alpha 自動找出每個獨立物件（換裝飾圖後要重跑）。落地／砸下時晃一下，之後各自慢擺。
- **背景道具**：`meshWin/bgProps.ts` 末段依本款背景重量的道具（`sway`/`drape` helper）；Background.svelte 兩張背景都掛上。
- **人物服飾飄動**：rig.json `flow`（尾巴、帽羽、燕尾、腰帶尾、頭巾尾、圍裙綁帶等，`design/add_flows.py` 依顏色從身體層擷取多邊形）。尾巴用單一骨頭、長距離漸入（兩段骨頭在捲曲處會剪開）；幅度已掃到 check_cast_flow 的極限。
- 保齡球館／嘉年華的符號中獎骨架改成依本款圖量的 `strikeWins.ts`／`mardiWins.ts`（原本還是 Swing 樂器的座標）。
- `check_mesh_wins` 對 idle:/land:/:pick 的「動得不夠明顯」規則豁免（同 Diner）。
