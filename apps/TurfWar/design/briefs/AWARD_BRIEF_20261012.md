# Turf War — 得獎級素材需求單（2026-10-12）

來源：2026-10-12 三款體檢（報告 https://claude.ai/artifact/XSrbqABbX1VmV5LVv7y6W4）。
程式能修的已經修完（`docs/handoff/trilogy-polish-20261012.md`）；這份只列**要新素材**才能補的差距，依對審核星數的影響排序。
**數學一律不動**（Big Score 出現頻率與出現條件也不動，只改它「長什麼樣」）。

畫風照 `ART_BRIEF.md` §0「髒、冷、廉價」：一張圖最多兩個色相、塗鴉螢光色 ≤ 15% 面積、血紅 `#B22222` 只給 The Bruiser。
交件放 `design/_incoming/award_20261012/<區塊>/`，我負責去背、量尺寸、接進遊戲、過 `check_turf_art.py` 與其他檢查。

Turf 是三款裡美術最強的，主要差距在**動態**與**聲音**，另外要跟 Capo 拉開距離：審核員若先看過 Capo，
Turf 的流程（開場卡、免費遊戲牌、購買選單）幾乎一模一樣，要靠這份把「物件」換成街頭自己的東西。

---

## A. 聲音（影響最大）

| | 現在 | 目標 |
|---|---|---|
| 來源 | numpy 合成（`design/generate_game_sfx.py turf`、`generate_turf_audio.py`） | 實際錄音／製作級音樂庫 |
| 音效數 | 34 個 | ≥ 90 個 |
| 配樂 | 2 首，循環 24.6／21.8 秒，**單聲道** | 3 首（主遊戲、免費遊戲、Kingpin），2–3 分鐘、4 層強度、立體聲 |

### A.1 配樂（後半夜的 boom-bap／trap）

| 曲 | 速度 | 四層 |
|---|---|---|
| 主遊戲 | 88 bpm boom-bap，F 小調 | L0 808 低音＋黑膠雜訊／L1 ＋鼓組（kick、snare、hi-hat）／L2 ＋鋼琴或口哨主旋律／L3 ＋刮盤與合成器 stab（預中、大獎前） |
| 免費遊戲 | 140 bpm trap（半拍感 70） | 同上，L3 加警笛合成器 |
| Kingpin | 76 bpm 暗黑 trap，弦樂取樣 | L0 弦樂低音／L1 ＋鼓／L2 ＋銅管取樣／L3 ＋合唱 pad |

規格：48 kHz 立體聲，四層等長、樣本級無縫循環，交 WAV（我轉 m4a）。

### A.2 音效清單（括號內 = 變化數）

**轉輪**：spin_start(2)、reel_stop_1–5(各 2)、reel_stop_tease(2)、anticipation_riser（噴漆罐搖晃＋心跳，可循環）、anticipation_hit。

**符號落地**：噴漆圖示 spray_tag(4)；高賠 —— 皇冠金鍊 chain_rattle(2)、地盤樓 door_slam(2)、鈔票捲 cash_flick(3)、酒瓶 bottle_clink(2)、
低底盤車 hydraulic_hop(2)；Wild 指虎 knuckle_hit(2)；Scatter 收音機 boombox_bass_1–5（越多顆越重）。

**機制**：
- The Bruiser：bat_swing(2) → bat_impact(2) → wild_column_slam（金屬柱落下）、sticky_chain_lock（Kingpin 黏住的鎖鍊聲）。
- Loot Bag 框：bag_drop_1x1／2x2／3x3（帆布袋重擊）、bag_zip（拉鍊）、value_roll（倍數滾動，可循環）、value_land(3)、bag_double（兩音上揚）。
- **Big Score**：big_score_riser（1.2 秒，噴漆罐狂搖＋拉鍊）、big_score_slam（整盤錢袋罩下）、big_score_value_roll、big_score_reveal（重低音＋人聲 "Big score!"）。
- 觸發：fs_trigger_siren（短警笛）、shutter_down（鐵捲門落下）、shutter_up、padlock_click、fs_intro_lookout／muscle／kingpin、retrigger_sting(2)、fs_outro。

**贏分**：win_line_tick(3)、win_count_loop、win_end_low／over／high、big_win_big／super／mega／epic／max（逐級加 808 與刮盤）、coin_shower_loop（金幣＋鈔票嘩啦）、bigwin_impact。

**介面**：ui_click(3)、ui_hover、bet_up、bet_down、bet_max、menu_open/close、buy_menu_open、buy_confirm、autoplay_start、turbo_toggle。

**環境**：alley_night（遠處車流、狗吠、電線嗡嗡，60 秒循環）、rain_drip（30 秒）、Kingpin 用 warehouse_hum。

**人物短句**：
- 混混：「Yo.」「Easy money.」口哨(2)、嘖一聲(1，連續 10 手沒中時偶爾)、「Let's go!」（大獎）
- Kingpin：「My turf.」（進免費遊戲）、低笑(2)、「That's business.」（結算）

規格：44.1 kHz／16-bit WAV，峰值 −1 dBTP，短音效前端不留靜音。授權須涵蓋真錢博弈遊戲商用。

---

## B. 符號動畫

每個符號交落地 0.5 秒與中獎 1.0 秒，24 fps 序列圖（512×512／格，洋紅底）或分件圖＋樞紐點。

| 符號 | 落地 | 中獎 |
|---|---|---|
| H1 皇冠金鍊 | 落下鍊子晃 | 金鍊甩一圈、鍍金反光掃過、掉一小片鍍層（街頭的假金） |
| H2 地盤樓 | 落下 | 窗戶燈一格格亮、屋頂水塔滴水 |
| H3 鈔票捲 | 彈一下 | 橡皮筋崩斷、鈔票散開再收回 |
| H4 酒瓶 | 叮 | 瓶身轉半圈、紙袋皺一下、瓶口冒氣 |
| H5 低底盤車 | 避震一壓 | 液壓跳兩下、車燈閃 |
| W 指虎 | 落下 | 指虎一記重拳前推、WILD 字閃 |
| SW The Bruiser | 落下 | 揮棒（接 C.2） |
| S 收音機 | 低音震一下 | 喇叭震動、天線晃、音波環 |
| L1–L4 噴漆圖示 | 噴一下 | 噴漆滴落重畫一次（序列 8 格），**加一點塗鴉色**（目前四個都是純灰，偏平） |

低賠補色（只改圖，面積守 15%）：靶心＝酸綠描邊、骷髏＝洋紅滴、星星＝青、閃電＝鈉燈橘。

---

## C. 招牌鏡頭

### C.1 The Big Score（Turf 自己的招牌，現在只是一行字）
現況：盤面中央一行「THE BIG SCORE 8×」，停不到 1 秒。
目標（1.6 秒，不改數學）：
1. 盤面四角噴漆罐滋滋作響、邊框燈閃（0.4 秒）；
2. 一個巨大的帆布錢袋從畫面上方罩下整個盤面，拉鍊拉起（0.4 秒）；
3. 錢袋正面用噴漆寫出 **BIG SCORE**（手繪字，序列 6 格）＋倍數滾動定格（0.5 秒）；
4. 混混揮棒敲盤框、畫面震一下（0.3 秒）。
需要的圖：整盤尺寸錢袋（正面空白，留噴漆字的位置）、拉鍊序列 4 格、BIG SCORE 噴漆字序列 6 格、四角噴漆罐單件。

### C.2 The Bruiser 揮棒
現況：紅色光柱＋指虎疊起來。
目標：Bruiser 從上方揮棒落下（3 格殘影）→ 砸中格子濺出水泥碎塊 → 整條變成指虎 Wild（由上往下）。Kingpin 黏住時多一道鐵鍊纏繞＋掛鎖。
需要：揮棒殘影 3 格、水泥碎塊粒子 6 種、鐵鍊纏繞序列 4 格、掛鎖單件。

### C.3 觸發免費遊戲
現有鐵捲門很好；補「鐵捲門落下時噴上當期地盤名」（LOOKOUT／MUSCLE／KINGPIN 噴漆字由我排，這裡要噴漆滴落的遮罩序列 6 格）。

---

## D. 人物表演

現況：SUPER WIN 34 倍期間連拍 12 格幾乎看不出動作。

| 時機 | 混混（主遊戲） | Kingpin（免費遊戲） |
|---|---|---|
| 待機（每 6–10 秒） | 球棒在肩上換手、左右張望 | 吐雪茄煙、整理皮衣領子 |
| 預中 | 球棒指向轉輪、身體前傾 | 摘下墨鏡 |
| Bruiser 出現 | 跟著揮棒 | — |
| 一般中獎 | 點頭、比手勢 | 冷笑 |
| 大獎 | 跳起來、球棒舉高 | 張開雙臂、金鍊晃 |
| 進免費遊戲 | 讓位（往旁邊退） | 從鐵捲門後走出（開場卡上） |
| 連續 10 手沒中 | 踢地上的罐子 | — |

需要的分件（照 `design/cast_brief/` 分層，與現有骨架對位）：混混頭部（面罩下的眼神 3 種）、眨眼 3 格、球棒換手姿勢、
舉高手臂；Kingpin 表情 3 種、墨鏡單件、張臂前臂。

---

## E. 大獎牌、結算、開場卡、數字

**大獎五級**：現在的噴漆字 SUPER WIN 是三款最好的範例，保留字的做法，底板逐級升級：
BIG 貼紙、SUPER 噴漆牆塊、MEGA 加鐵絲網框、EPIC 加警示膠帶與閃燈、MAX 整面牆被噴滿＋警燈旋轉。交空白底板＋閃燈遮罩。

**結算 TOTAL WIN**：現有生鏽鐵框＋警示膠帶很好，補一張「錢袋倒出來」的動態序列（6 格）放在牌子下緣。
**再觸發**：「+N SPINS」用的鐵捲門小牌（空白）。

**數字**：噴漆模板字 0–9、×、$、.、, 兩套（鈉燈橘＝大獎計數、骨白＝計數器），每字 256 px 高、透明底。

**開場說明卡**（現在跟 Capo 同一個版型）：改成**牆上的三張海報**，被膠帶貼歪、角落翹起：
1) Loot Bag：錢袋套在高賠上的特寫；2) The Bruiser：揮棒瞬間；3) The Big Score：整盤錢袋＋大大的「20 000×」（字由我排）。
波動度圖示改成 5 個噴漆罐（交亮、暗兩版單件）。

---

## F. 背景氛圍

現況：主遊戲背景暗到接近純黑，三款共用同一份背景動畫（慢速推移＋上升光點）。
需要：主遊戲背景提亮一級（鈉燈照到的牆面要看得到塗鴉），另交三個可動的單件 —— 閃爍的鈉燈燈頭（亮、暗兩版）、
地面水窪反光遮罩、免費遊戲用的紅藍警燈光斑。我用程式做燈閃、蒸汽、警燈掃過。

---

## G. 交件後我做的程式工作（對帳用）

- 音效：接新清單、四層配樂、人物短句、Big Score 的四段音效時間軸，轉 m4a。
- 符號：序列圖接進 SymbolSprite；低賠新色過 `check_symbol_weight.py`。
- Big Score：BigScore.svelte 改成四段式鏡頭（不改出現時機）；Bruiser 揮棒序列與鐵鍊。
- 人物：反應表與觸發時機。
- 大獎牌五級底板＋閃燈；結算錢袋序列；數字改圖片字。
- 開場卡改三張海報＋噴漆罐波動度。
- 背景：鈉燈閃爍、水窪反光、警燈。
