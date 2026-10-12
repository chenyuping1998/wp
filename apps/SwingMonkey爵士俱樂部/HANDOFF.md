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
