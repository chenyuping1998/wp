# Strike Monkey（保齡球館）交接

## 最新完成狀態（2026-10-10）

- 原創保齡球漫畫場景、七款主獎圖、兩名角色、介面、FG 牌、轉場、封面及 39 個 WAV 音效、兩首 MP3 已建立。三張說明過場改為平塗漫畫圖卡；獎圖無閃光。
- 倍數球瓶的 1x–250x 數字已置於腹部圓牌，遊戲尺寸離線圖確認數字與球瓶均可辨認：`design/qa_strike_prize_badges.png`。
- 人物 Spine 網格已收斂角度，逐格檢查衣服、身體和尾巴接縫；`check_cast_flow.mjs` 八種動作通過，無網格反轉。圖騰上跳和 FG 牌擺動已調整。
- UI bar 採深色數值面與奶油色字；資產、音效、型別、網格、人物檢查及 Vite build 通過。
- 數學各模式各 10,000 本新 books，包含 10,000x 觸頂；SDK 驗證通過，LUT RTP 各模式皆為 96%。`smoke.py` 及 `check_copy_claims.py` C1–C9 通過。
- 2026-10-10 前端重播實測：開場補上 STRIKE MONKEY 名稱；FG 標題、次數、結算收為單一主牌；過場改為大型保齡球滾動遮幕，在全畫面遮住時切場。FG、得分動畫、資訊列已於瀏覽器走過；本機重播倍數單位修正為 20.2x／$20.20。下方「先前狀態」為施工前紀錄，以上述最新狀態為準。
- 依最新回饋移除 FG 開場及總獎牌面的直線紋理，保留單塊漫畫主牌、外框與清楚的數字。重新產圖和編譯完成；瀏覽器曾確認 FG 開場牌無直線，之後依要求停止預覽。

## 路徑

- 前端：`E:\stake\wp\apps\StrikeMonkey保齡球館`（package `strike-monkey`，dev 3037、storybook 6037，launch.json `strikemonkey-dev`）
- 數學：`E:\stake\math-sdk\games\StrikeMonkey保齡球館`；`games\StrikeMonkey` 是指向它的 junction（math-sdk 用 game_id 拼路徑，**別刪**）
- game_id：`StrikeMonkey`

## 先前狀態（施工前紀錄）

- 前端與數學都從 `SwingMonkey爵士俱樂部` 複製（茶樓底，數學全等）。books／LUT 是茶樓那份的複本，只手改了
  `library/configs` 的 gameID／gameName，`config_fe_SwingMonkey.json` 改名為 `config_fe_StrikeMonkey.json`。
  **上傳前要用新 game_id 重跑 `run.py`**（同時處理茶樓家族的「沒有觸頂 10,000× book」待辦，見下）。
- 從 Swing 複製是因為 Swing 已含茶樓家族的送審修正（featureTotal、Spin 光暈關閉、限制字詞形、重播 6 位小數、
  `pnpm check:claims`、漫畫擬聲字 ComicPop）。另外從 MonkeyKingRush 移植了 Sound.svelte（`loopWanted`、BGM 改 Web Audio 解碼迴圈）
  與 bookEventHandlerMap.ts（FG 結束切回 `bgm_main`），所以茶樓家族三個共有 bug 在本款都已修。
- 已改：package 名、port、`sync_math_config.mjs`、標題與遊戲名、`*_BET_MODE_META`、玩家可見文字（含中日文）、送審介紹、
  規則頁、WIN TABLE、Buy 選單、擬聲字（CRASH!／CLACK!／KA-POW!、ROLL OUT!、STRIKE!／SPARE!；計量表打擊字 BOOM!）、介面與元件色碼。
- 名詞：W=Bowler 球王猴、FG=Pinsetter 排瓶猴、P=Pin 球瓶、S=Golden Ball 金保齡球；H1 獎盃／H2 保齡球鞋／H3 計分卡／H4 櫻桃汽水；買入 Spare Round 100×／Perfect Game 150×。
- **美術與音效仍是 Swing Monkey 的**（音效資料夾已改名 `static/assets/audio/strike/`）。需求單 `STRIKE_美術需求單.md`、
  `STRIKE_音效需求單.md` 交給 Codex 執行；美術單第 12 節收錄了茶樓／Diner／MK 修過的坑。
- 標題字 **Bowlby One**（2026-10-10 換，`static/fonts/sushi/BowlbyOne-Regular.ttf`，OFL）。低分字母網格已重烘，`lowLetters.ts` 的 A K Q J 10 形狀全部依新字重新量過（墨跡覆蓋率 ≥99.7%，`check_mesh_wins` 通過）。再換字型要重跑 `design/make_jade_mesh_layers.py`、重量形狀並跑 `check_mesh_wins.mjs`。
- 網格中獎骨架仍是 Swing 的 `swingWins.ts`，換圖後要依新剪影重調；`design/dump_cast_frames.mjs`、`render_cast_frames.py` 從 Diner 複製來，可離線檢查人物網格。
- 內部 asset 資料夾 `sushiXxx`、事件 key `banditMeter`、config 鍵 `jadeCupValues` 刻意保留，換圖只替換同名檔。

## 指令

```powershell
# from E:\stake\math-sdk
.\env\Scripts\python.exe games/StrikeMonkey/smoke.py
.\env\Scripts\python.exe games/StrikeMonkey/run.py --books 100

# from E:\stake\wp\apps\StrikeMonkey保齡球館
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

## 2026-10-10 Buy Bonus 招牌造型
- 把原本的圓角矩形底改為單塊 Googie 尖頂球館招牌：墨線輪廓、櫻桃橘紅／奶油配色，上緣一顆保齡球，中央留白給多語系 `BUY BONUS`／`DISABLE`。
- 目前的 print／platform skin 用奶油招牌，舊 boomana skin 用深色招牌；四張 SVG 分別對應一般與亮起狀態，滑過時整張同輪廓替換，沒有閃光或第二塊牌。
- 圖面比例調至接近可點擊範圍，文字向下移開保齡球圖記；原 PNG 保留作舊素材，執行時改讀 SVG。
- SVG XML、check_assets、check_types、vite build 通過；依先前指示未開瀏覽器，實際尺寸和多語系換行尚待畫面驗證。

## 2026-10-10 過場保齡球滾動音
- 新增 `design/generate_bowling_roll.py` 與原創 `static/assets/audio/strike/bowling_roll.wav`。球進場時播放 0.76 秒木質球道滾動聲，依進場的 smoothstep 速度包絡起伏，並在中央停球／碰撞提示音前收尾。
- `TransitionAnimation.svelte` 於球開始進畫面的幀只觸發一次 `soundBowlingRoll`；`Sound.svelte` 以既有音效音量設定播放，強度為 0.72。
- `check_audio`、`check_types`、`vite build` 通過；依使用者先前指示未開瀏覽器。

## 2026-10-10 背景計分螢幕
- 五個原本空白的球道螢幕加入計分介面，顯示最近五轉的局數、本局實際派彩倍率、累計倍率；轉輪停止開新局，`setWin` 結算時更新。沒有虛構擊瓶或全倒資料。
- 計分內容跟隨背景 cover／緩慢位移，基本與 FG 背景的同位置螢幕都可顯示；保留原本平面配色與小尺寸高對比文字。
- check_types、check_assets、vite build 通過；依使用者先前指示未開瀏覽器，實際可讀性仍待預覽確認。

## 網格動態補齊（2026-10-10，Claude）

比照 Diner／茶樓補上本款缺的網格動態，全部離線驗證、未上機：

- **落地／待機／收集**：`src/game/meshWin/acts.ts`，由本款各符號中獎骨架的配件自動產生（落地壓扁＋配件依序回彈；盤面靜止時隨機挑格子做小動作，由 `game/idleDirector.ts` + `IdleDirector.svelte` 排程；收集物先跳起並朝收集者傾斜再飛走）。`Symbol.svelte` 換成 Diner 版、`ReelSymbol` 傳 row、`SymbolMeshWin` 加 `fixedSpeed`、`BanditCollect` 改用 `P_PICK`。
- **FG 面板與大獎牌匾的裝飾層**：`meshWin/decorMeshes.ts`，由 `design/make_decor_meshes.py` 從裝飾圖的 alpha 自動找出每個獨立物件（換裝飾圖後要重跑）。落地／砸下時晃一下，之後各自慢擺。
- **背景道具**：`meshWin/bgProps.ts` 末段依本款背景重量的道具（`sway`/`drape` helper）；Background.svelte 兩張背景都掛上。
- **人物服飾飄動**：rig.json `flow`（尾巴、帽羽、燕尾、腰帶尾、頭巾尾、圍裙綁帶等，`design/add_flows.py` 依顏色從身體層擷取多邊形）。尾巴用單一骨頭、長距離漸入（兩段骨頭在捲曲處會剪開）；幅度已掃到 check_cast_flow 的極限。
- 保齡球館／嘉年華的符號中獎骨架改成依本款圖量的 `strikeWins.ts`／`mardiWins.ts`（原本還是 Swing 樂器的座標）。
- `check_mesh_wins` 對 idle:/land:/:pick 的「動得不夠明顯」規則豁免（同 Diner）。

## 2026-10-11 BUY BONUS 按鈕重設計
- `design/build_bowling_buybonus.py` 產生奶油／深色兩組 SVG，每組有一般、兩格滾動、撞瓶四張。單塊 Googie 球館徽章上半部用保齡球、三支無表情球瓶和速度線；下半部是完整留白的計分卡面，文字仍由程式排。
- 滑過時球往前、球瓶傾斜，並用平塗換色呈現撞擊，不使用閃光或第二塊疊牌。`uiTheme.ts` 將文字中心下移到卡面中央。
- 素材、型別檢查及 Vite 建置通過；已在瀏覽器按實際 135px 按鈕尺寸確認文字排版。回放模式隱藏 BUY BONUS，實際遊戲按鈕仍需非回放畫面確認。

## 2026-10-11 BUY BONUS 動畫清晰度
- 滑過改成 90ms 一格的三段球路：滾近、接近球瓶、撞倒球瓶，最後停在撞瓶畫面；移開時回到一般狀態。全程維持一塊招牌與穩定文字區，無閃光。
- `design/qa_buybonus_preview.html` 現在排出四格，已在瀏覽器以實際 135px 尺寸確認球位置、球瓶傾角及 `BUY BONUS` 可辨。八張 SVG XML、193 個素材路徑與完整建置通過。
- 非回放遊戲需要有效 RGS 回應；用 `mock.local` 直接開啟時請求失敗，故本次沒有把實際遊戲滑過畫面當作已驗證。

## 2026-10-11 保齡球過場與球館背景音
- `TransitionAnimation.svelte` 球進場起點觸發 `bowling_roll.wav`；球到中央遮幕後 80ms 播放原創 `bowling_pins.wav`，不再觸發門板碰撞聲。最新動畫／音檔時長見下方使用者回報修正。
- `Sound.svelte` 在背景音樂播放時偶爾加入較小聲的遠處撞瓶聲；最新間隔、音量與略過條件見下方使用者回報修正。
- 新音檔由 `design/generate_bowling_pins.py` 產生，0.92 秒木質球瓶連鎖碰撞、短室內尾音。音效路徑檢查及完整建置通過。

## 2026-10-11 使用者回報修正
- BUY BONUS 滑過白框：`UiSprite` 的 key 是 `uiTheme.sprites` 槽位，不是直接的資產 key。動畫畫格改用 `buyBonusRoll1`／`buyBonusRoll2`／`buyBonusGlyph` 槽位，base、platform、print 三種皮膚都補齊對應；三組映射檢查通過。
- 球館遠處撞瓶聲改為進場後約 4.5–7 秒首次嘗試、其後每 12–19 秒嘗試；取消幾乎永遠無法滿足的長時間閒置條件，音量由 0.18 提至 0.34（仍低於過場主音）。音效獨立於結果聲池，不會在下一次轉輪開始時被截斷。背景分頁、靜音、選單及過場期間仍不播。
- 過場球進場延至 900ms、停球 380ms、離場 850ms；滾動音重製為 0.9 秒，入場結尾後約 80ms 播放撞瓶聲。素材、音效、型別檢查與完整建置通過。

## 2026-10-11 全倒聲替換
- 使用者要的是全倒的球瓶連續散落聲，先前合成的五次短敲不夠像。`bowling_pins.wav` 已改用 SieuAmThanh 的實錄 Bowling Strike（Freesound #514385，CC0），處理為 1.26 秒雙聲道並保留連鎖碰撞與室內尾音；來源與授權記在 `design/source/audio/README.md`。
- 過場仍在 0.9 秒球滾動聲結束後約 80ms 接全倒聲，背景偶爾播放同一錄音的較輕版本。

## 2026-10-11 封面交件
- `design/cover/game_spec_en.txt`：86 個英文單字的遊戲規格說明，對照現行 5x4、1,024 Ways、W 收 Pin、FG 計量表、96% RTP 與 10,000x 上限。
- `design/cover/StrikeMonkey-Cover-FG-v2.png`：新封面球王猴動作版，真正 RGBA 去背，1672x941；原 `StrikeMonkey-Cover-FG.png` 保留不覆蓋。
- 背景沿用已完成的 `design/cover/StrikeMonkey-Cover-BG.png`（1920x1080，RGB），保持與遊戲場景相同的球館風格。`StrikeMonkey-Cover-Preview.html` 可預覽兩層疊合；已在瀏覽器確認人物全身、球、透明邊緣與左側留白。
