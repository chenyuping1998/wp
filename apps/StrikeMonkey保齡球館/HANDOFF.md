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

## 2026-10-18 BET 下箭頭 hover 反灰（Claude，比照 Putt）

- `uiTheme.ts` 加 `labelChevronHoverColor: 0x67645c`（共用鍵，預設不生效）。原本 hover 時箭頭不變色。建置紀錄 `design/build_20261018_chevron.log`；未上機。

## 2026-10-18 優化（Claude，比照 Saucer／Putt／茶樓）

- **笑臉露齒**：`design/whiten_laugh_teeth.py` — 主角的笑臉原本就畫了一排上牙，但顏色跟皮膚一樣（奶油色），遊戲尺寸看起來沒牙。腳本找出「貼著口腔、在口腔上半」的淡色區塊提亮成白色；副手的牙太細，整排平滑下推到 6px。幾乎閉嘴的 laugh_1 不動。原圖在 `design/source/_pre_teeth/`（腳本每次從這裡重做）。重新產 Spine 後 json/atlas 與現有檔相同，只換 `monkey.png`（舊貼圖也備份在 `_pre_teeth/spines/`）。**人物重切／重跑 redraw_cast_build 後要再跑一次這支，再 generate。**
- **HA 字幕**：照 Putt 修 Mascot.svelte — 只在 `chestbeat` 時畫，`play()` 切走就停；已在笑時不重啟字幕時鐘；換角色重置；HA 壽命 420→360ms。
- **獎圖網格**：`meshWin/strikeWins.ts` 改成 Putt 的寫法（`strongLeap`：蹲深、上升拉長、頂點放大、落地重壓扁＋小搖），每個獎圖一次性專屬動作：獎盃高舉搖兩下、鞋子踮腳跟走一步、計分卡鉛筆畫 X、汽水乾杯、球王側身耍帥、金球滾一圈、球瓶被撞到搖晃回正。關節上限照 `--limits`（鉛筆只能 7°，所以只用 5.5°）；櫻桃太小頂點不夠，併進奶油配件。
- **兩段 Turbo**：`uiTheme.turboTiers 2`、`turboKeylineColor 0x3fc4a8`（ON 底色）；`constants.ts` `SPIN_OPTIONS_*_T2`（速度 ×1.2、間隔 ÷1.2）；`BanditCollect.svelte` 改虛擬時鐘，Turbo 1 收分照常速、Turbo 2 收分 1.5 倍（本款收分原本就不吃 Turbo）。規則頁 Turbo 說明改三段。
- **FG 牌／計數牌／大獎牌**：`design/build_strike_fg_sign.py`、`design/build_strike_win_plaques.py`。拿掉角落小圖，改成「球館橱窗＋購買卡紙面」：上方從遊戲背景裁球館（FG 開場夜場紫光、結算一般燈光），下方奶油紙＋墨框＋青綠細線。大獎五級靠取景（球瓶區／Googie 招牌／整座夜間球館）與外框印色（米→米紅線→紅→青綠金線→金）升級。decor 全空並重跑 `make_decor_meshes.py`（全部 0）。計數牌換 `v8FgCounter`（表頭是計分螢幕）。標題改紅字墨邊。原圖在 `design/source/_pre_fg_sign/`。
- **升級動畫**：`BanditMeter.svelte` 從 Putt 移植，在 FG 牌上演：牌子落下 → 低獎卡在球道上彈出 → 排瓶猴（cut-in 網格）進場把金保齡球送出 → 撞飛低獎卡（FxBurst＋框震）→ 球瓶從上方落位、壓扁回彈、金色光芒＋金環 → 三顆金球依序點亮。時間點與音效照舊。舊版備份在 session scratchpad。
- **FG 過場**：新增 `LightRays.svelte`（從茶樓移植，金＋青綠），FreeSpinAnimation 加 `halo`／`rays`：開場蓋章時光暈閃、之後留餘光；結算數分時光芒慢轉，數完閃光＋框震後淡成靜光。
- **guard**：`check_social_words.mjs` 補上 pixi `text="…"` 屬性掃描（照 Diner），用探針確認會失敗。
- 數學：確認 10-16 已用 Diner 的方式重跑（每模式 10 萬本、各 20 本不同觸頂局、base 1/200萬、買入 1/10萬、RTP 96%），`check:claims` C1–C9 全過，本次沒動數學。
- `npm run build` 通過（`design/build_20261018.log`，型別 14 項、低於基準）。**未上機**：升級動畫、FG 牌文字位置、光芒都只算過，沒在瀏覽器看過。

## 2026-10-18 丟保齡球（Claude）

- **讀數縮小**：print skin `readoutScale` 0.85 → 0.8（balance/win/bet 不碰框線）。
- **新動畫 `bowl`／`airbowl`**（`design/generate_monkey_spine.mjs`，兩個角色共用）：近盤面那隻手做十瓶出手——變出球（BOWL_APPEAR 0.16s，道具 `ball` = 過場青綠球 `design/source/strike/props/ball.png`，136 單位、掛在掌下 40）→ 推出、後擺 54°、滑步下蹲、低位出手（BOWL_RELEASE 0.9s）→ 朝盤面送出、停住看球 → 走回原位（2.0s）。`airbowl` 同動作不拿球，idle 時 30% 機率取代 glance（空氣保齡球）。physics mix 0.45。產生器會印 `bowl ball appears at … released at …`，Mascot.svelte 的 `CASTS.*.bowl` 與 BanditMeter 的常數要跟著改。check_cast_flow 通過。骨架舊版備份在 session scratchpad。
- **FG 觸發**：`bookEventHandlerMap` 在 uiHide 後 `await mascotBowl` → Mascot 演 `bowl`、變球時畫一圈小爆點（drawPuff），出手時把座標交給新元件 `BowlingBallRoll.svelte`（畫在盤面上層；人物在盤面後面）：球落地小彈一下、沿盤框底線往左加速滾出畫面才 resolve（5 秒保底）。接著 `transition` 帶 `noThrow: true`，不再丟球瓶，巨球直接從左邊滾進來。人物不在畫面（平板/直式）時直接進過場。
- **FG 升階牌**（BanditMeter.svelte）：拿掉 cut-in 網格排瓶猴，改成真的 FG 角色 Spine（gbLookout）站在橱窗球道右側、每階 `{#key index}` 重播 `bowl`；球從手上落到球道、滾向低獎卡，命中時卡片碎裂（新 `CardShatter.svelte`：卡圖＋字母先烘進 canvas，再切成以撞擊點為中心的放射碎片，單一 Mesh）。CUT 由出手＋滾動距離算出（≈1257ms），STEP = CUT+1250、LEAD 520。音效：出手 effort 語音、落地滾動聲、命中照舊 chop。
- `npm run build` 通過（`design/build_20261018_bowl.log`）。**未上機**：動作只看過離線 contact sheet，滾球、碎裂、時間點都沒在瀏覽器看過。

### 2026-10-18 追加：空氣丟球手部＋讀取頁標題
- 使用者反映主遊戲人物空氣丟球手部怪：空手版開頭會「接球」把手舉在前面停住；近側手畫在身體前面，後擺 54° 會橫過肚子到右屁股（像抓癢）；送出後直臂平舉停太久、手肘有接縫。改成：`airbowl` 不做接球、後擺只到 14°（手留在大腿側，靠軀幹後仰 −8° 與下蹲表現力道）、送出 −30°/前臂 −9°、手腕上抬、較早放下。`bowl` 同步（保留接球）。check_cast_flow 面積 78–118%（原 60–135%）。出手座標更新：mg (−191,162)、fg (−329,337)，Mascot/BanditMeter 常數已更新。
- 讀取頁與「點擊繼續」頁的標題拿掉招牌底板：`design/bake_loading_title.py` 產生 `sushiV8/logo_title.png`（奶油字＋墨色粗描邊＋紅色錯位印），`v8LogoTitle`。FeatureIntro 原本的 LOGO_BOARD 網格改成這張圖，每 5 秒小跳一下。讀取條上移到標題下方。
- build 通過（`design/build_20261018_bowl2.log`）；未上機。

### 2026-10-18 追加：動畫細節
- **FG 排瓶猴另有手臂軌跡**：牠待機時手本來就平伸（招呼姿勢），共用角度讓球一直在胸口晃。`bowlClip` 對 `CAST === 'fg'` 改成：平伸 → 往下 36° → 臀側 54° → 低位出手 34°（前臂補彎 14/26/12）→ 抬回平伸（收尾 = 待機姿勢）。肩膀 84°、68° 都會把短袖網格擠到 < 50%（check_cast_flow 擋），54° 是上限。
- **出手交接無縫**：產生器現在印出手瞬間的球心（掛點偏移已隨骨頭轉）、世界角度、速度（`bowl release angle … ball velocity …`）。Mascot `CASTS.*.bowl` 帶 angle/vel，`BowlingBallRoll` 從手上那顆的角度與速度接著飛，落地後才加速滾；BanditMeter 改用 `laneDist()`（空中保持手速、落地 150ms 加速到滾速），CUT 由此反算（≈1520ms，STEP = CUT+1250）。
- 升階牌補上變球爆點（drawPuff，同主遊戲）。
- 現值：mg 出手 (−189,162) 2.2° (−425,−314)/s；fg (−165,249) 58.2° (−503,−202)/s。改動作後要照新印出的值改兩個元件。
- build 通過（`design/build_20261018_bowl3.log`）；未上機。

### 2026-10-18 追加：低獎字母置中
- 使用者反映 A/K/J/10 在圓圈裡偏下。圖卡圓圈本身是正中的；原因是 pixi Text anchor 0.5 置中的是整個行框，而 pixi 的字型高度是量 `|ÉqÅ` 的實際外框（重音很高、q 下伸很深），Bowlby One 的大寫字就落在框的下半。
- 新增 `src/game/letterCentre.ts`：`letterNudge(letter, size)` 以 pixi 自己的字型量測＋canvas 實際字形外框，算出讓字形墨跡中心對準錨點的 y 位移（字型載入後才快取）；`inkBaseline()` 給 canvas 用。套用在 SymbolSprite、SymbolWinAnim、SymbolMeshWin（網格字母貼圖）、WinWays 圖示、BanditMeter 低獎卡、CardShatter。Q 是圖檔不受影響；賠率表是 DOM（用 hhea 度量，本來就幾乎置中）不改。
- build 通過（`design/build_20261018_letters.log`）；未上機，實際位移量要在畫面上確認。

### 2026-10-18 追加：FG 開場牌、Turbo、球瓶獎圖、進度格
- **FG 開場牌太亮**：FreeSpinAnimation 的光暈／光芒包在 `{#if halo||rays}` 裡，開場後才掛載 → pixi-svelte 把晚掛載的區塊加在父層**最後**，加亮的 fxGlow 蓋在牌子上面（鋸齒白光）。拿掉 fxGlow，光芒層改成永遠掛載、用 alpha 控制；FreeSpinIntro/Outro 的 halo 一併移除。
- **FG 張數**：不再歪（原 rotation −0.06），改成 Bowlby One 紅字＋墨色粗描邊＋墨色錯位陰影（取代 v8 數字圖 InkNumber role fs），用 letterNudge 置中，蓋章縮放照舊。
- **Turbo**：`activeByIconOnly: ['turbo']`（照飛碟），開啟時圓鈕不變青色、只有閃電內部填亮；turbo 2 的切口色改為深色圓鈕 #14262e。
- **球瓶獎圖**：底板改 `gbPinPaper`（`design/build_pin_plate.py` 把 l1.png 的兩圈圓用紙色填掉）；`SackBadge` 依倍率把球瓶肚子的圓標籤塗色（照飛碟區間：1–4 青綠、5–14 藍、15–39 紫、40–99 紅橘、100+ 金），數字奶油色＋同色系深描邊。
- **FG 左上進度格**：改畫真正的保齡球瓶輪廓（Catmull-Rom 半寬剖面鏡像），點亮＝奶油瓶身＋兩道紅頸帶＋墨線，未點亮＝淡輪廓。
- build 通過（`design/build_20261018_fixes.log`）；未上機。

### 2026-10-18 追加：W 收分加強
- **飛行**（BanditCollect.svelte）：球瓶像被撞飛一樣整圈翻滾著飛向 W（依方向順/逆轉，落地時頭朝上），弧高依距離 0.30–0.62 格；肚子上的倍率標籤跟著轉（SackBadge 加 rotation）。
- **連鎖節奏**：每支起飛間隔 110ms 起每支 −12ms、最低 55ms，收越多越快；起飛與落地事件排在同一虛擬時鐘上（Turbo 2 仍 1.5 倍）。
- **命中**：每支落地 → 漫畫撞擊星（大獎金色）＋四片木屑（紅/木色）＋「+N×」往上飄（520ms），計分牌照舊跳。
- **音效**（`design/generate_pin_collect_audio.py`，原創合成）：`pin_whoosh` 起飛破風（小聲、隨機音高）；`pin_clack` 調音木頭敲擊（C5），每支沿 C 大調五聲音階往上（`soundPinClack step`），收一串會變成一段上行旋律；收 ≥4 支時最後一支接 `bowling_pins` 全倒聲＋框震。取代原本的 coin_in。兩個新音效列入每手截斷清單。
- **漫畫字**：ComicPop 改在每個 W 的最後一支落地時才跳（新事件 `banditCollectFinale`），原本是收分一開始就跳。
- 守門腳本全過；未上機，聽感與節奏要實際播放確認。

### 2026-10-18 追加：笑聲重做
- 使用者反映笑 HA 時笑聲太小或沒有。原因：笑臉動畫照 `laughTiming.json` 跑 10 拍（首拍 480ms、每 280ms、3650ms 收），舊 `voice_laugh.wav` 只有約 1.1 秒聲音且沒有分明音節，第三個 HA! 之後就是無聲張嘴。壽司猴的笑聲能被聽見是因為一聲一聲很分明（0.65 秒 6 個合成短音）。
- 新 `design/generate_laugh_voice.py`（原創共振峰合成，讀 laughTiming.json）：10 聲「ha」各對準一個 HA! 拍點（氣音 h → 母音 a，F1–F4），音高往中段爬升再落下，每聲先個別拉平音量再套漸強/漸弱，最後一口吸氣；3.73s，峰值 0.92。舊檔備份在 session scratchpad。改 laughTiming 後要重跑。
- 接法（soundMascotVoice roar → voice_laugh，gain 1）沒動。未上機聽過。
