# Swing Monkey（爵士俱樂部）交接

## 路徑

- 前端：`E:\stake\wp\apps\SwingMonkey爵士俱樂部`（package `swing-monkey`，dev 3036、storybook 6036，launch.json `swingmonkey-dev`）
- 數學：`E:\stake\math-sdk\games\SwingMonkey爵士俱樂部`；`games\SwingMonkey` 是指向它的 junction（math-sdk 用 game_id 拼路徑，**別刪**）
- game_id：`SwingMonkey`

## 狀態（2026-10-09）

- 數學從 JadeTeahouse 複製（全等），books／LUT 是茶樓那份的複本，只手改了 `library/configs` 的 gameID／gameName。
  **上傳前要用新 game_id 重跑 `run.py`**。
- 前端從 `PochaMonkey韓式路邊攤` 複製：同一天茶樓正被另一個工作階段重構網格動畫（idles／lands／pCup），
  直接複製茶樓會拿到改到一半、build 不過的版本，所以改用 Pocha 這份一致的快照，再換文字、配色、字型。
  **茶樓之後的網格動畫改動不在本款裡**，要的話等那邊完成再移植。
- 已改：package 名、port、`sync_math_config.mjs`、標題與遊戲名、`*_BET_MODE_META`、玩家可見文字（含中日文）、送審介紹、
  介面配色、標題字 Shrikhand（低分字母網格已重烘、J 勾子已重對位）。
- **美術與音效已於 2026-10-09 換成主題版**，按 `SWING_美術需求單.md`、`SWING_音效需求單.md` 製作；原稿見 `design/source/swing/`。三格漫畫、標誌、入場遮幕、FG 面板與階段演出均有專屬設計。共 39 個 WAV 效果音、2 首 MP3 配樂。再生腳本與驗收路徑見 `../../tools/THREE_THEME_DELIVERY.md`。
- 內部 asset 資料夾 `sushiXxx`、事件 key `banditMeter`、config 鍵 `jadeCupValues` 刻意保留，換圖只替換同名檔。

## 指令

```powershell
# from E:\stake\math-sdk
.\env\Scripts\python.exe games/SwingMonkey/smoke.py
.\env\Scripts\python.exe games/SwingMonkey/run.py --books 100

# from E:\stake\wp\apps\SwingMonkey爵士俱樂部
E:\stake\tools\node-v22.23.1-win-x64\corepack.cmd pnpm build
```

## 送審前修正（2026-10-09，Claude）

- **FG 結算金額含觸發轉**：`src/game/featureTotal.ts`（從 Boat 移植）。books 實測：主遊戲觸發的 FG 有 245／1,000 本結算面板少了觸發轉的獎金（付款本身一直是對的）。
- **Spin 鈕呼吸光暈關閉**（`uiTheme.ts` `spinButtonGlow: false`），避免 Deadwood 那種「poor UI」評語。
- **限制字詞形變化**：`design/check_social_words.mjs` 加上 buys／paying／wagered 等（照 Boat）。
- **重播面板金額全精度**：`ReplayIntro.svelte` 用 6 位小數（$0.01 × 125.9 = $1.259）。
- **說明對照 books**：`design/check_copy_claims.py`（`pnpm check:claims`）逐條驗證 9 條規則說法（收集值範圍、Wild 只在 2–5 輪、Scatter 五輪都有、3/4/5 個給 10/12/15 轉、每個 Wild 收全部、不重觸發、計量表 4/8/12 與 10→J→Q、買入起始狀態、10,000× 上限），全部成立。
  - 發現：買入模式的「進場盤」只放 Scatter、**不結算**；22.9% 看得到連線、4.8% 有 Wild 在收集符號旁卻沒收。玩家沒有損失，所以在規則頁「模式」下補一句說明，沒動數學。重跑數學時可考慮讓進場盤只放不成獎的符號。
  - 樣本裡最高一局 1,138.8×，**沒有任何一局打到 10,000× 上限**。上傳前重跑數學時要確認每個模式都有觸頂的 books（Stake 會檢查最大獎是否可達）。
- **漫畫擬聲字**：`src/components/ComicPop.svelte`＋`src/game/comicPop.ts`（字詞、形狀、顏色），收集、觸發 FG、計量表升級時在盤面上跳出。只聽現有事件、不擋流程。**尚未在瀏覽器看過**。

## 2026-10-10 過場布幕移除、FG 標題底板移除（Claude）

- 過場（`TransitionAnimation.svelte`）上方的布幕（`smNoren`，`sushiScene/noren.png`）整段拿掉，使用者覺得 AI 感太重；門板本身就蓋滿畫面，不會露空。assets.ts 已不再載入它（圖檔還在）。
- FG 開場／結算面板：標題底板（`v8TitleFree`／`v8TitleTotal`）幾乎和面板一樣寬、橫跨在面板中間，看起來像兩塊板疊在一起。拿掉底板，標題直接寫在面板紙面上。開場面板的文字區 `PAPER.x0` 140→200，讓文字中心對齊紙面（x 800）。
- `pnpm build` 全過；未上機。

## 2026-10-10 收集音效只留在該手（Claude）

- 使用者回報：Wild 收分後，收集的音效拖到下一手還在響。原因是一次性音效（收集叮噹、大聖/主角笑聲、算盤跑分 2.2s、大獎號角 2–6s）都會播到結束，沒人停。
- 修法：每手 reveal 送 `soundSpinCut`，`Sound.svelte` 的 `cutSpinSounds()` 把 `SPIN_SCOPED` 清單裡的音效（含 `coin_in` 的疊播複本）在 160ms 內淡出停止。轉輪、停輪、Scatter、FG 觸發鈴、過場門不在清單內。
- 茶樓底七款（Jade／Diner／Pocha／MK／Swing／Mardi／Strike）同步修；未上機。

## 高分樂器的演奏動態（2026-10-10，Claude）

- H1–H4 中獎改成「樂器自己在演奏」，骨架在 `src/game/meshWin/instrumentWins.ts`（W／S／P 仍在 `swingWins.ts`）：
  - H1 薩克斯風：兩聲吹奏，喇叭口外擴、音符被吹起來搖擺、兩道閃線向外閃；中間按鍵依序按下（指法）。
  - H2 低音提琴：四次撥弦，弦在琴頸與琴橋之間抖動（兩端固定，權重沿弦 sin 分布）、拉弦記號拉開再彈回、琴身鼓一下、琴頭點頭、整把在尾針上搖。
  - H3 小鼓：兩支鼓棒以握把端為軸抬起再敲下（左右交替，最後一組雙擊）、鼓面受擊下沉、敲擊線向外炸開、整顆鼓往被敲的一側震。
  - H4 斑鳩琴：四次刷弦，弦抖動、鼓皮共鳴、刷弦記號外閃、琴頸點頭。
- 座標來自符號圖的色塊圖（256 畫布）；**換符號圖要重量**。
- 心得：會動的部件 priority 要明顯高於底下的部件（鼓棒 20 vs 鼓面 8），否則 soft-min 只分到約 6 成權重，角度給 7° 實際只動一半。
  細小線條（火花、敲擊線）要把周圍空氣一起劃進區域，混合邊界才會落在透明處，不會把線條拉裂。
- 離線驗證：`check_mesh_wins` 通過，另用軟體光柵化逐格渲染過（無撕裂）；**尚未上機**。

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
- 得分時讓舞台中央原有暖色聚光區作一次約 1.8 秒的柔和亮度起伏；不移動舞台物件或切割鼓組、布幕。
- check_types 與 vite build 通過；未開瀏覽器預覽。

## 2026-10-10 直式介面可讀性
- `print` 介面直式讀數面板原為奶油底搭奶油字，標籤對比 1:1；改為深色唱片底，奶油字對比約 16.32:1。check_types 通過，未開瀏覽器預覽。

## 2026-10-10 背景網格巡檢
- 目前場景是爵士舞台，但背景網格仍引用茶樓燈籠、竹子等座標，會切過鼓組與布幕；停用這組不適用的網格，保留背景緩慢位移。
- check_types 通過；依使用者先前指示未開瀏覽器。

## 網格動態補齊（2026-10-10，Claude）

比照 Diner／茶樓補上本款缺的網格動態，全部離線驗證、未上機：

- **落地／待機／收集**：`src/game/meshWin/acts.ts`，由本款各符號中獎骨架的配件自動產生（落地壓扁＋配件依序回彈；盤面靜止時隨機挑格子做小動作，由 `game/idleDirector.ts` + `IdleDirector.svelte` 排程；收集物先跳起並朝收集者傾斜再飛走）。`Symbol.svelte` 換成 Diner 版、`ReelSymbol` 傳 row、`SymbolMeshWin` 加 `fixedSpeed`、`BanditCollect` 改用 `P_PICK`。
- **FG 面板與大獎牌匾的裝飾層**：`meshWin/decorMeshes.ts`，由 `design/make_decor_meshes.py` 從裝飾圖的 alpha 自動找出每個獨立物件（換裝飾圖後要重跑）。落地／砸下時晃一下，之後各自慢擺。
- **背景道具**：`meshWin/bgProps.ts` 末段依本款背景重量的道具（`sway`/`drape` helper）；Background.svelte 兩張背景都掛上。
- **人物服飾飄動**：rig.json `flow`（尾巴、帽羽、燕尾、腰帶尾、頭巾尾、圍裙綁帶等，`design/add_flows.py` 依顏色從身體層擷取多邊形）。尾巴用單一骨頭、長距離漸入（兩段骨頭在捲曲處會剪開）；幅度已掃到 check_cast_flow 的極限。
- 保齡球館／嘉年華的符號中獎骨架改成依本款圖量的 `strikeWins.ts`／`mardiWins.ts`（原本還是 Swing 樂器的座標）。
- `check_mesh_wins` 對 idle:/land:/:pick 的「動得不夠明顯」規則豁免（同 Diner）。

## 2026-10-18 工具列（Claude，比照 Putt）

- `uiTheme.ts`：`readoutOffsetY: -8`（BALANCE／WIN／BET 上移）、`labelChevronHoverColor: 0x67645c`（BET 右邊下箭頭 hover 反灰；共用鍵在 Putt 那次新增，預設不生效）。本款沒有 COURSE CARD 類背景牌，不適用。
- `pnpm build` 通過（`design/build_20261018_bar.log`，型別 14 項同基準）；未上機。

## 2026-10-18 使用者五項（Claude）

- **讀取頁標題去底板**：`design/build_swing_wordmark.py` 把字從舊奶油牌上剝下來（原檔 `design/source/_pre_wordmark/logo_board.png`），同畫布同位置，改成獨立字標：紅字自帶墨線＋奶油外框＋墨色外框＋右下墨色投影塊＋柔和暗影。`v8LogoBoard` 檔名不變。`meshWin/signs.ts` 字母框加大（TOP 226／FOOT 374、首尾框外擴、reach 30）讓外框跟著字擺。讀取頁與三格說明頁標題後面加一層暖色聚光（新貼圖 `fxSoftGlow` = `sushiFx/fx_soft_glow.png`；**本款原本的 `fxGlow` 是硬邊白圓**，不能拿來當光暈）。讀取條上移到 logo 下 0.15w。
- **FG 開場牌／結算牌**：`design/build_swing_fg_sign.py`，改成「演出門票」：上方是遊戲背景裁的舞台窗景（開場＝聚光燈布幕＋低音提琴＋鼓組，結算＝台下桌燈與雞尾酒），下方奶油紙面＋左右半月缺口＋紅色虛線撕線＋紅色內框。decor 全空、重跑 `make_decor_meshes.py`（全 0）。`FreeSpinAnimation.svelte` 換成 Strike 版（halo/rays/落地壓扁）＋開場時一道聚光燈從舞台左側掃到中央後留著微光；PAPER = x90–1510／y526–930。FG 開場/結算文字改紅字墨邊（`FreeSpinIntro/Outro` 從 Strike 移植，顏色換本款）。`LightRays.svelte` 從 Strike 複製，預設色改聚光金＋布幕紅。原圖在 `design/source/_pre_fg_sign/`。
- **大獎牌**：`design/build_swing_win_plaques.py`，五級都是門票窗景，等級靠取景＋外框印色：big 台下桌燈／米框、super 低音提琴＋鼓／米框紅線、mega 聚光布幕／紅框米線、epic 舞台地板聚光＋樂團／墨框金線、max 整座舞台／金框＋一圈跑馬燈泡。Win.svelte 拿掉 decor PropMesh，等級名在窗景與紙面交界（SEAM_Y -0.025），epic/max 金字、其餘紅字墨邊。
- **觸發 FG 不再丟東西 → 謝幕鞠躬**：新動作 `bow`（`design/bow_motion.mjs`；`design/add_bow_clip.mjs` 直接寫進兩個 monkey.json，產生器也已 import）：預備小起身 → 下彎（髖下沉、軀幹壓扁、頭低、面盤面那隻手攤開引介、另一手收到肚前）＋閉眼微笑 → 停住 → 起身小回彈。頭部是單一網格（helmet 骨沒有頂點），所以做不了脫帽。踢踏舞猴的右手不收（會撕到尾巴）。`TransitionAnimation.svelte` 拿掉唱片飛行，改送 `mascotBow`，幕在 480ms 開始落、正好落在鞠躬停住時。離場（FG 結束）時踢踏舞猴也鞠躬。check_cast_flow 兩角色 bow 皆 0 翻面；離線姿勢圖用 `design/render_bow.mjs`（借茶樓 `check_cast_motion.mjs` 的光柵器，已複製到本款 design/）。
- **升級動畫用唱片打破**：`BanditMeter.svelte` 拿掉手杖／斜劈線。踢踏舞猴端著唱片（P 圖）滑進來 → 往後蓄力 → 甩出（RELEASE = CUT-260）→ 唱片低弧旋轉飛到低獎卡 → CUT 撞碎（原有兩半裂開＋碎片、粉色衝擊環＋八道墨色衝擊線）→ 唱片反彈旋轉往左上飛走淡出。音效時間點不變（soundChefSlice 在甩出前、soundChefChop 在撞擊）。舊版在 session scratchpad。
- **唱片倍率分色**：`SackBadge.svelte` 照 Saucer 乳牛牌的區間：1–3 綠、5–10 藍、15–30 紫、40–50 紅、100+ 金；畫在唱片中央標籤上（實測橢圓 274.4,235.2／90×66／轉 40°，留中心孔），數字奶油色＋該級深色描邊。收集飛行中的數值也同色。
- 舊產圖腳本保護：`../../tools/build_three_theme_art.py`（swing）與 `design/build_jade_art.py` 不再覆寫 logo_board／fg_*／win_*。
- `pnpm build` 通過（`design/build_20261018_swing5.log`；型別 14 項同基準）。**未上機**：FG 牌文字位置、聚光燈掃動、唱片飛行路徑、鞠躬與落幕時間都只算過／離線渲染過，沒在瀏覽器看過。

## 2026-10-18 細部巡檢（Claude，第二輪）

- **HA 字幕對齊笑聲**（照 Putt/Strike）：`Mascot.svelte` 的 HA 只在 `chestbeat` 時畫；`play()` 切走就停字幕時鐘；已在笑時不重啟；換角色重置；壽命 420→360ms。
- **FG 計數牌**：新 `fg_counter.png`（`v8FgCounter`，`build_swing_fg_sign.py` 的 `counter_plate()`）：票面紙＋墨框，表頭是舞台布幔與聚光燈的一條窗景＋紅色細線，取代程式畫的紅色錯位印＋青綠色帶。標題奶油字墨邊，置於表頭中心（H*0.142）。
- **升級動畫底板**：新 `meter_board.png`（`v8MeterBoard`，1000×770，舞台窗景＋門票紙面，接縫 0.62H），取代程式畫的米色四邊形和兩道黃色光柱。踢踏舞猴改站在舞台邊（DANCER_Y -0.12H），低獎卡懸在舞台上，進度圓點／標籤移到票面內（RUNG_Y 0.28H、標籤 +0.075H），標題改奶油字墨邊（結果時金字）放在布幔上。
- **讀取頁／說明頁標題放大**：去底板後字只佔畫布約 60%，寬度改 min(0.92w, 880)。離線合成圖確認不壓到三格卡片。
- **兩段 Turbo**（照 Saucer/Putt/Strike）：`uiTheme.turboTiers 2`、`turboKeylineColor 0x926543`（亮起按鈕的棕色）；`constants.ts` `SPIN_OPTIONS_*_T2`；`BanditCollect.svelte` 改虛擬時鐘，Turbo 1 收分照常速、Turbo 2 收分 1.5 倍；規則頁 Turbo 說明改三段。
- **guard**：`check_social_words.mjs` 補 pixi `text="…"` 屬性掃描（照 Strike），插入 `text="PAYOUT"` 探針確認會擋、已還原。
- 檢查過沒動的：笑臉有露牙（主角明顯、踢踏舞猴小）；預期框是跑馬燈泡框，跟主題相符先保留。
- `pnpm build` 通過（`design/build_20261018_swing_detail.log`，型別 14 項同基準）；**未上機**。

## 2026-10-18 亮光調暗（Claude）

- 使用者：有些牌子的亮光太亮。四處加法光都降：FG 牌後光暈 ×0.7→×0.32（開場閃光峰值約 0.32、留光約 0.14）；開場窗景聚光燈峰值 0.6→0.22、留光 0.3→0.1、色調改暖（0xffcf8a）；結算光芒每道 0.16→0.08（`LightRays.svelte`）；讀取／說明頁標題後暖光 0.42→0.26。牌子美術本身量過沒有過曝像素，未改。
- `pnpm build` 通過（`design/build_20261018_swing_glow.log`）；未上機。

## 2026-10-18 鞠躬停頓、唱片收分旋轉（Claude）

- **過場**：鞠躬做完（約 1.76s 站直）再停 1 秒才降幕（`TransitionAnimation.svelte` `BOW_DONE_MS 1760 + BOW_PAUSE_MS 1000`，原本 480ms 就開始降、幕落在鞠躬中）。這段停頓中人物會回到 idle（可能偶爾觸發 glance）。
- **唱片收分時旋轉**：`SackBadge.svelte` 新增 `spin`／`spinAlpha`：在唱片自己的斜面上畫兩組溝紋反光＋標籤上兩段印刷弧和一個點，繞軸轉，像唱片在轉盤上播放。唱片圖本身不轉（圖上的唱片外圈和標籤中心差約 23px，整張轉會晃）。`BanditCollect.svelte`：每張唱片跳完（PICK）後開始轉，380ms 加速到 1.25 轉/秒，一直轉到收分結束，最後的 HOLD 450ms 內淡出；飛行中的複本 2.4 轉/秒。走虛擬時鐘（Turbo 2 時也跟著快 1.5 倍）。
- `pnpm build` 通過（`design/build_20261018_swing_spin.log`）；未上機。

## 2026-10-18 獎圖動畫加強（Claude）

- **W（樂隊指揮徽章）、S（金麥克風）**：`meshWin/swingWins.ts` 改用 `strongLeap`（照 Putt/Strike：蹲深、上升拉長、頂點放大、落地重壓扁＋小搖），跳高 W 21→28、S 17→24。各自一次性動作：W 在空中兩個搖擺拍（整體傾斜 +7°／−5°）、帽子往上抬 6px 並傾斜（脫帽）、領結抖動；S 像歌手左右搖（−6°／+5°）、兩個音符被吹起來再落回。力道放在 rigid（不會撕網格），配件仍在 5° 上限內。S 左音符上抬會把網格拉到 168%（上限 160%），已縮到 −2.5px（現 159.2%）。P 維持原本的普通跳（收分旋轉由 SackBadge 畫）。
- **H1–H4 樂器**：`instrumentWins.ts` 開頭的彈出 5%→8%，並新增「跟著自己的拍點彈跳」：薩克斯風每次吹奏、低音提琴每次撥弦、小鼓右手每擊、斑鳩琴每次刷弦，整件樂器先蹲一下再彈起（9／6／5／6px），只用 rigid。
- 離線渲染（`check_mesh_wins --dump` + `render_mesh_wins.py`）看過 W、S、H1、H2；`pnpm build` 通過（`design/build_20261018_swing_anim.log`，check_mesh_wins 全過）；未上機。

## 2026-10-18 UI bar 去黃線黃點、英文機制說明（Claude）

- `sushiUi/bar_strip.png`：拿掉上緣的金色橫線和一排金色圓點，只留紅邊深色底。改在 `../../tools/build_three_theme_art.py`（swing 不再畫線和點），並只重畫這一張（與舊圖只差上緣 10–49 列）；舊圖在 `design/source/_pre_bar_20261018/`。`design/build_jade_art.py` 也不再覆寫 bar_strip。
- 英文機制說明（96 字）寫進 `design/GAME_DESCRIPTION.md`「機制說明」一節。
- `pnpm build` 通過（`design/build_20261018_swing_bar2.log`）；未上機。

## 2026-10-18 笑聲對齊 10 拍 HA!（Claude）
- 笑臉動畫照 `laughTiming.json` 跑 10 拍（首拍 480ms、每 280ms、3650ms 收），舊 `swing/voice_laugh.wav` 太短（≤1.45s）且無分明音節，第三個 HA! 之後無聲張嘴。比照保齡球猴重做。
- `design/generate_laugh_voice.py`（從 StrikeMonkey 移植，原創共振峰合成，讀 laughTiming.json）：10 聲各對一拍，每聲個別拉平音量、音高中段最高，尾巴吸氣；3.73s。本款音色：低沉渾厚的「呵哈」（基頻 205Hz、/ɔ-a/、每聲 0.23s）。舊檔備份在 session scratchpad。改 laughTiming 後要重跑。接法未動；未上機聽過。
