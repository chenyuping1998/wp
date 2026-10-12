# Diner Monkey（美式餐館）— 美術需求單

2026-10-09 開案。Jade Teahouse 的換皮，**數學全等**（5×4、1,024 Ways、W 收 P、FG 計量表 4／8／12），
只換美術、文字與音效。音效另見 `DINER_音效需求單.md`。

> 給執行者（Codex）：本專案是 `JadeTeahouse` 的整包複製。`static/assets/` 裡現在**全部還是茶樓／壽司的圖**，
> 資料夾也仍叫 `sushiXxx`。不用改資料夾名：照本單的檔名、尺寸**原封不動地替換同名檔**，程式就會直接吃新圖。
> 生成原稿放在 `design/source/diner/<類別>/`，再寫一支 `design/build_diner_art.py`
> （照 `design/build_jade_art.py` 的做法）把原稿裁切、縮放、套網點後輸出到 `static/assets/`。

---

## 0. 畫風方向：美漫有趣風

**1950 年代美國公路餐館 × Silver Age 美式漫畫。** 整個遊戲要像一本便宜、好笑、色很飽的週日漫畫增刊：
猴子廚師和溜冰鞋女服務生在鍍鉻餐館裡手忙腳亂地出餐。

關鍵字：**粗黑墨線、大片平塗、Ben-Day 圓點網點、套色故意印歪、誇張表情、速度線、擬聲字爆炸框。**

### 有趣感怎麼做（每張圖都要檢查）

1. **表情誇張**：眼睛大、嘴巴開到下巴、眉毛飛出頭。食物獎圖也可以有一點表情（漢堡肉在冒汗、奶昔吸管彎成問號），但**不要畫眼睛嘴巴**，以免跟角色搶戲。
2. **動勢**：物件稍微傾斜 5–12°，加 2–4 條漫畫速度線或冒汗、冒煙、星星小符號。
3. **擠壓與拉伸**：Q 彈的比例，漢堡稍微被壓扁、奶昔杯身略圓胖。不要寫實比例。
4. **爆炸框**：鋸齒爆炸框、對話框、雲朵框是本款的視覺母題。框內**一律留白**，字由程式排（POW!、DING!、ORDER UP!）。

### 色卡

| 色 | hex | 用途 |
|---|---|---|
| 新聞紙 | #F2E8CF／#FBF5E6 | 背景紙色、角色白衣、面板底 |
| 墨黑 | #1B1B1B | 所有輪廓、硬陰影、字的描邊 |
| 漫畫紅 | #E2342B | **價值色**：H1、W、大獎、Buy Bonus |
| 鉻黃 | #F7C531 | **只給 Scatter 服務鈴和大獎光芒**，其他地方不用 |
| 青藍 | #1FA3C8 | **機制色**：收集線、計量表、收集中的框 |
| 泡泡糖粉 | #F48FB1 | **只給 FG 升級**（10／J／Q 變成托盤的演出） |
| 薄荷綠 | #8FD3C1 | 餐館裝潢的輔色（皮沙發、磁磚），只在背景與 UI |

- 背景降飽和約 40%，網點對比低於盤面；**盤面上的符號永遠是全畫面最飽和、對比最高的東西。**
- 鉻黃面積在一般盤面上 ≤3%（只有 Scatter 有），讓服務鈴一落下就跳出來。
- 不用漸層、油亮反光、白光 bloom、寫實金屬。鍍鉻用「白＋淺灰＋一條黑色硬反光」的漫畫畫法。

### 筆法

- 外輪廓粗黑、有筆鋒粗細變化，約為畫布邊長的 2–2.5%；內線約外線的 50%。
- 每個物件：平塗底色＋一層墨黑硬陰影。中間調只用**網點**，不用漸層。
- **網點、套色錯位（2–4px 青／紅偏移）、新聞紙紋由程式統一套**（沿用 `design/screenprint_finish.py`、`design/build_print_fx.py` 的做法並調參數）。
  生圖只出乾淨的平塗線稿，避免各張圖網點粗細不一。
- 參考 Silver Age 漫畫的**技法**即可。不得模仿特定漫畫角色、特定名畫（例如 Lichtenstein 某幅作品）或任何真實品牌。

### 禁止事項

- **生圖不畫字**：招牌、菜單、小票、爆炸框、Logo 一律留白，字全部由程式排。
- 不出現真實品牌：可樂瓶的曲線字、黃色拱門、知名汽水 logo、真實車款標誌都不行。
- 不畫香蕉黃色系的大面積（避免跟 GoBananas 家族撞色），香蕉只當小道具。
- 透明資產必須是真正的 RGBA；新聞紙底色不可以用白色去背挖掉。

### 驗收

- 符號縮到 **70px** 與全盤 **200px 寬**時，4 個高分要靠**剪影**分得出來，不能只靠顏色。
- 跟 `wp/apps/JadeTeahouse`、`wp/apps/SushiMonkey` 放在一起看，第一眼要能看出是不同遊戲。
- 每批交件附一張 contact sheet（全部縮圖排一張），放在 `design/source/diner/_sheets/`。

---

## 1. 風格樣張（先做這張，核准後才開始量產）

`design/source/diner/style_test_v1.png`，1920×1080：完整盤面示意。

- 背景是餐館內景、盤面（5×4）、右側 MG 廚師猴、下方 UI 列的位置。
- 盤面上至少要有 H1–H4、W、P、S 各一個。
- 附上提詞 `style_test_v1_prompt.txt`。**使用者核准後才進入第 2 節之後的量產。**

---

## 2. 主題對照

| 原（茶樓／壽司） | Diner Monkey | 備註 |
|---|---|---|
| 茶樓／壽司店 | 公路邊的鍍鉻餐車館 | 紅皮沙發卡座、棋盤格地磚、吧台高腳椅、點唱機、窗外是沙漠公路與夕陽 |
| MG 角色：老茶師 | **快餐主廚猴 Short-Order Chef** | 壯、紙船帽、白 T 恤捲袖、沾油漬圍裙、叼牙籤 |
| FG 角色：學徒 | **溜冰鞋服務生猴 Carhop** | 瘦、活潑、溜冰鞋、條紋短洋裝或背心裙、領結、鉛筆夾耳後 |
| W 茶師圓章 | **Chef 圖章**：主廚猴大頭在紅色爆炸框裡 | 紅底黑框，最搶眼 |
| P 玉杯 | **Order Tray 點餐托盤**：圓托盤＋夾著一張空白小票 | 倍數由程式印在小票上，**不要預畫數字** |
| S 燈籠 | **Service Bell 櫃台服務鈴** | 鉻黃，唯一用黃的符號 |
| H1 茶壺 | **雙層起司漢堡** | 寬、疊層剪影 |
| H2 蓋碗 | **草莓奶昔**（高腳杯＋鮮奶油＋櫻桃＋彎吸管） | 高瘦剪影 |
| H3 蒸籠 | **熱狗**（芥末番茄醬波浪線） | 橫長剪影 |
| H4 茶盤 | **櫻桃派切片** | 三角楔形剪影 |
| L1–L5 A K Q J 10 | 餐館**菜單字母板**的塑膠字卡 | 字由程式排，只做底卡 |
| Buy：Tea Ceremony 100× | **Lunch Rush** | 10 轉、計量表 0 |
| Buy：Jade Ceremony 150× | **Blue Plate Special** | 10 轉、計量表 4，所有 10 開場就是托盤 |

名稱都已對過 Stake social 限制字（不能用 cash、pay、buy、bet、money 等）。**不要用「Cash Register／收銀機」當任何玩家看得到的名稱。**

---

## 3. 符號（`static/assets/sprites/sushiSymbols/`，皆 512×512 透明）

原稿建議 1024×1024，物件占畫布約 78%，四周留透明邊。每張單獨生成。

| 檔名 | 內容 | 要點 |
|---|---|---|
| `h1.png` | 雙層起司漢堡 | 起司融化垂下、芝麻、冒熱氣捲線；最豪華 |
| `h2.png` | 草莓奶昔 | 粉紅杯身、鮮奶油、櫻桃、紅白條紋彎吸管 |
| `h3.png` | 熱狗 | 斜放、黃芥末＋紅番茄醬波浪線 |
| `h4.png` | 櫻桃派切片 | 格子派皮、櫻桃餡流出一點 |
| `w.png` | Chef 圖章 | 紅色鋸齒爆炸框底＋主廚猴大頭（張嘴大笑、眨眼）＋紙船帽。不畫字 |
| `p.png` | 點餐托盤 | 俯視 3/4 角度的圓鉻托盤，中央夾一張**空白**小票，留最大的平面給程式寫倍數 |
| `s.png` | 服務鈴 | 鉻黃半球鈴＋黑底座，旁邊 3 條「叮」的震動線 |
| `l1.png`–`l5.png` | 低分字卡底 | 黑色溝槽字母板上的一片白色塑膠字卡，**空白**；5 張只在邊條顏色不同（紅／青／薄荷／粉／灰） |
| `low_label.png` | 低分共用底卡 | 同上的通用版 |

另外：

- `sushiV8/back_h1.png`、`back_h2.png`、`back_s.png`（512×512）：高分與 Scatter 的**底卡**。
  H1／W 用漫畫紅底＋黑框，H2–H4 用新聞紙底＋紅框，S 用黑底＋鉻黃框。讓 70px 時一眼看得出價值高低。
- `jadeMesh/*_shadow.png`、`l*_subject.png`：網格中獎動畫用的陰影與主體，**由程式從新符號自動產生**
  （跑 `design/make_jade_mesh_layers.py`），不用生圖。
- 網格中獎的骨架在 `src/game/meshWin/`（h1Teapot、h2Gaiwan、h3Steamer、h4Tray、sLantern、wMaster），
  名字是茶樓的，但動作是通用的跳動與翻轉。換圖後要依新剪影重新調錨點：漢堡要上下彈、奶昔吸管晃、熱狗左右滑、派切片翻起來、服務鈴被拍一下後震動。

---

## 4. 角色（Spine，`static/assets/spines/sushiMaster/`、`sushiApprentice/`）

沿用現有骨架與 9 個動作：`idle`、`cheer`、`chestbeat`、`nod`、`throwit`、`flinch`、`alert`、`glance`、`flutter`。
做法跟茶樓一樣：**拿原本的壽司猴角色圖改服裝，保留解剖、姿勢、剪影**，再重新切圖、產生 atlas
（流程見 `design/cut_cast_layers.py`、`design/generate_monkey_spine.mjs`、`design/check_cast_flow.mjs`）。

| | MG 快餐主廚猴（`sushiMaster`） | FG 溜冰鞋服務生猴（`sushiApprentice`） |
|---|---|---|
| 體型 | 壯、圓肚、短眉、半閉自信眼、歪嘴笑 | 瘦、大眼、精神、耳朵較大 |
| 服裝 | 紙船帽、白 T 恤捲袖露前臂、及膝圍裙（油漬、口袋插溫度計） | 條紋短洋裝或背心裙＋白圍裙、領結、小帽、鉛筆夾耳後 |
| 腳 | 工作靴 | **溜冰鞋**（輪子要畫完整，腳底線跟 MG 對齊） |
| 會飄動的部位（flow） | 圍裙下襬、帽子 | 裙襬、領結、馬尾 |
| `throwit` 道具 | 一個漢堡（獨立透明圖 256×256） | 一個小托盤（獨立透明圖 256×256） |

姿勢限制（照抄壽司版，這是骨架能動的前提）：

- 站在盤面右側、面向左；全身，雙腳完整。
- 雙手自由下垂、肘微彎，**前臂和軀幹之間至少留 48px 空隙**（以 1024 寬為準）。
- **不拿鍋鏟、不拿刀、不插口袋、手不貼在身上**。道具全部另交。
- 原稿 1024×1668 透明 RGBA；可以交整張，也可以交 24 層分件（關節要重疊，被擋住的衣料要補畫）。
- 兩隻同光向、同腳底線，頭頂高度差 ≤5%。

**表情**（每隻 7 張頭部，跟身體同比例、同角度，各 512×512 透明）：
`neutral`、`blink`、`grin`、`shock`（flinch 用）、`laugh_inhale`、`laugh_rising`、`laugh_peak`、`laugh_settle`（後四張照 `design/source/v9/laugh/` 的流程接上）。
表情要誇張到像漫畫：大笑時嘴巴占半張臉，嚇到時眼睛變成兩個圓圈、帽子彈起來。

---

## 5. 背景與場景（`sushiBackground/`、`sushiScene/`、`sushiFrame/`）

| 檔名 | 尺寸 | 內容 |
|---|---|---|
| `sushiBackground/bg_base.png` | 1920×1080 | 白天的餐館內景：吧台、紅皮高腳椅、點唱機、牆上空白菜單板、窗外沙漠公路。中間留空給盤面，右側留空給角色 |
| `sushiBackground/bg_feature.png` | 1920×1080 | 同一個鏡位改成夜晚：窗外夜空、霓虹燈亮起、氣氛更熱鬧（顧客剪影塞滿卡座） |
| `sushiFrame/frame_bg.png` | 1280×1280 | 盤面底：淡新聞紙底＋極淡的棋盤格 |
| `sushiFrame/frame_edge.png` | 1280×1280 | 盤面框：鍍鉻邊框＋紅色滾邊，四角有鉚釘，中央**透明**。框的形狀、開口要跟現在的檔案一樣 |
| `sushiScene/noren.png` | 1920×420 | 畫面上緣的紅白條紋遮陽篷，下緣是扇貝形 |
| `sushiScene/door.png` | 1400×1080 | 廚房的雙開彈簧門（各有一個圓形舷窗），轉場用 |
| `sushiScene/shutter.png` | 1920×1080 | 全螢幕的**漫畫跨頁**：紅黃放射狀爆炸背景＋中央大爆炸框（留白）。進 FG 時整片拍進畫面 |
| `sushiScene/chef_cut_in.png` | 1024×1024 | 服務生猴踩溜冰鞋急煞滑進畫面、單手高舉托盤，背後速度線 |
| `sushiScene/fs_plate.png` | 1000×600 | 掛在牆上的**黑板「今日特餐」板**，中央留白給 FS 次數 |

背景要求：背景線稿和網點的對比**低於**盤面，角色旁邊留乾淨的牆面；縮到 200px 時盤面還是最搶眼。
背景模糊度：`Game.svelte` 的 `BLUR_BASE`／`BLUR_FEATURE` 目前是 0.6／1.0，維持這個量級，不要調高，否則背景會糊。

**背景小動態**（`src/game/meshWin/bgProps.ts`，原本是燈籠、字畫、竹子）：改成點唱機燈閃爍、吊扇轉動、
霓虹 OPEN 招牌閃、咖啡壺冒煙。每個動態物件**另交一張透明分件**（約 256–512px），放 `design/source/diner/bg_props/`。

---

## 6. 介面（`sushiUi/`、`sushiIcons/`、`sushiV8/`）

| 檔名 | 尺寸 | 內容 |
|---|---|---|
| `sushiUi/bar_strip.png` | 1600×200 | 下方 UI 列：鍍鉻吧台邊＋紅色塑膠貼皮 |
| `sushiUi/spin_plate.png` | 256×256 | Spin 鈕底：紅色圓形，像點唱機的大按鈕 |
| `sushiUi/button_plate.png` | 256×256 | 一般圓鈕底：新聞紙色＋黑框 |
| `sushiUi/button_print.png`／`button_print_on.png` | 256×256 | Turbo／Auto 鈕底：關（新聞紙）／開（青藍填滿） |
| `sushiUi/buybonus_plate.png`／`_lit.png` | 512×512 | **UI 列上的 Buy Bonus 鈕**：吊在兩條鏈子上的小霓虹招牌，中央留白；`_lit` 是霓虹亮起的版本 |
| `sushiUi/card_bonus.png` | 600×840 | Buy 選單卡片 Lunch Rush：直式菜單卡，上方畫一份漢堡套餐，下方留白 |
| `sushiUi/card_superbonus.png` | 600×840 | Blue Plate Special：同款但更豪華（藍色餐盤＋滿滿一盤），邊框改紅 |
| `sushiUi/ticker_plate.png` | 652×146 | 訊息跑馬燈底：點唱機的歌名窗 |
| `sushiIcons/*.png`（13 個） | 256×256 | autoSpin、decrease、increase、info、menu、menuExit、payTable、replay、settings、soundOff、soundOn、spin、turbo。**細線條、留開口**，30–48px 時不能糊成一團（不要用粗實心圖示） |
| `sushiV8/menu_frame.png` | 740×1024 | 規則／賠率表的外框：護貝過的餐館菜單，棋盤格邊條 |
| `sushiV8/logo_board.png` | 1600×600 | Logo 底：鍍鉻＋霓虹燈管的餐館招牌，中央留白給「DINER MONKEY」 |
| `sushiV8/logo_stamp.png` | 512×512 | 小一號的圓形招牌（主廚猴頭像），給載入頁與封面 |
| `sushiV8/soy_empty.png`／`soy_full.png` | 512×512 | 波動度圖示：一杯咖啡，空杯／滿杯冒煙 |
| `sushiV8/stamp.png` | 512×512 | 紅色鋸齒爆炸框，留白（程式寫「ORDER UP!」） |

**Buy Bonus 按鈕和 Buy 選單卡是兩組不同的資產，兩組都要交。** 交件後要檢查每一套 UI skin 都有吃到圖（見 game-reskin skill 的 §6）。

---

## 7. 開場與 FG 面板（`sushiV8/`）

| 檔名 | 尺寸 | 內容 |
|---|---|---|
| `intro_collect.png` | 1024×640 | 開場第 1 格「玩法」：主廚猴雙手把一排托盤往懷裡掃，托盤飛起、速度線 |
| `intro_slice.png` | 1024×640 | 第 2 格「獎勵遊戲」：服務生猴溜冰滑過，把一張「10」字卡（字卡**留白**）甩飛，原位冒出托盤，粉色速度線 |
| `intro_receipt.png` | 1024×640 | 第 3 格「最大贏分」：一張超長的點餐單從出單機一路吐到地上，**空白** |
| `fg_intro.png`＋`fg_intro_decor.png` | 1600×1000 | FG 開場面板：漫畫的一格大分鏡框＋四周爆炸框裝飾（底板與裝飾分開） |
| `fg_total.png`＋`fg_total_decor.png` | 1600×1000 | FG 結算面板：同家族，裝飾換成一堆空盤子疊高 |
| `title_free.png`／`title_total.png` | 1600×500 | 標題緞帶：紅色漫畫緞帶，留白 |

---

## 8. 大獎五階（`sushiV8/win_*.png`＋`*_decor.png`、`sushiWinBanners/*.png`）

1000×560，底板和裝飾分件（程式要做 0.9s 進場、2s 循環、0.5s 退場）。**每一階的外形都要不同，越上面越大越滿**：

| 階 | 物件 |
|---|---|
| BIG | 一張點餐單插在出單釘上 |
| SUPER | 對話框泡泡＋兩顆服務鈴 |
| MEGA | 鋸齒爆炸框，四周飛出漢堡和薯條 |
| EPIC | 霓虹招牌全亮，兩側有火焰紋賽車條 |
| MAX | 整頁漫畫跨頁：放射線＋超大爆炸框，兩隻猴子從兩側探頭 |

字樣區全部留白（BIG WIN 等字由程式排）。`sushiWinBanners/` 下的五張跟 `sushiV8/win_*.png` 同內容，可以共用。

---

## 9. 數字、粒子、特效

- **手繪數字 4 套**（`sushiV8/digit_<set>_<0-15>.png`，高 256，寬照現在的檔案）：
  `count`（大獎跑分）、`fs`（FS 次數）、`plate`（托盤倍數）、`receipt`（小票上的數字）。
  0–9 是數字，10–15 是標點（. , × + $ /，以 `design/normalize_v8_digits.py` 為準）。
  風格：粗黑描邊、內部白色或紅色、加一層 3px 的錯位陰影，**像漫畫標題字**。`receipt` 那套要像出單機印的點陣字。
- **粒子**（`sushiV8/particle_0`–`15.png`，128×128）：漢堡、薯條、櫻桃、星星、音符、氣泡、小爆炸框、咖啡豆……混搭。
- `sushiV8/ray.png`（1024×1024）：漫畫放射線，紅黃交替。
- `sushiWinPlates/bananas.png`（1280×512）：中獎飛出的道具圖集，換成薯條與硬幣狀的杯墊。
- `sushiFx/collect_bananas.png`（128×128）：收集時飛向 W 的小東西，換成一顆小漢堡。
- `sushiFx/fx_glow`、`fx_leaf`、`fx_star`、`fx_streak`、`fx_vignette`：通用遮罩，**保留不用改**。

---

## 10. 封面與商店縮圖（`design/thumbnail/`、`design/cover/`）

- BG 1024×1024：明亮的餐館外觀（白天、粉藍天空、鍍鉻車身），**不要用夜景壓暗**。
- FG：只放 MG 主廚猴一隻的透明全身圖，不放字和 Logo。
- 16:9 封面（送審必交）：同主題，橫幅構圖。
- 縮到 200×200 要過 `scripts/check_thumbnail.py` 的三項亮度門檻（平均亮度 ≥80、P10 ≥35、暗部 ≤30%）。

---

## 11. 程式端（2026-10-09 已由 Claude 完成，Codex 不用再做）

- 字型：標題改 **Bangers**（`static/fonts/sushi/Bangers-Regular.ttf`，OFL），介面數字用 Anton，內文 Archivo。
  低分字母的網格骨架已依 Bangers 重新烘焙（`make_jade_mesh_layers.py`），Q 的尾巴重新對位。
- 玩家可見文字已換成 Chef／Order Tray／Service Bell／Lunch Rush／Blue Plate Special（含中、日文），送審介紹 `design/GAME_DESCRIPTION.md` 已改寫。
- 介面配色已換成第 0 節色卡（`uiTheme.ts` 與各元件內的色碼）：墨黑底、炭灰圓鈕、漫畫紅強調、新聞紙字、開啟中的 Turbo／Auto 用青藍。
- `pnpm build` 通過（資產、音效、限制字、型別、網格中獎、角色飄動六個守門腳本全過）。

Codex 換完圖之後仍要做的：

- 收尾跑「還有沒有舊遊戲的東西」檢查：`grep -ri "jade\|teahouse\|tea master\|sushi"` 玩家可見字串應為 0（內部 key、資料夾名可保留）。
- 網格中獎骨架（`src/game/meshWin/`）依新符號剪影重調；背景動態（`bgProps.ts`）改成第 5 節的點唱機、吊扇等。
- 客製樣式只寫在本 app，不要改 `wp/packages`。
