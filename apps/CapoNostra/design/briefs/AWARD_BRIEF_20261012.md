# Capo Nostra — 得獎級素材需求單（2026-10-12）

來源：2026-10-12 三款體檢（報告 https://claude.ai/artifact/XSrbqABbX1VmV5LVv7y6W4）。
程式能修的已經修完（見 `docs/handoff/trilogy-polish-20261012.md`）；這份只列**要新素材**才能補的差距，
依對審核星數的影響排序。**數學一律不動。**

畫風沿用 `ART_BRIEF.md` §0（Art Deco 海報造型＋黑白四階＋紅只給金庫倍數框）。每則圖像提示詞 =
`ART_BRIEF.md` §0.6 `[STYLE]` ＋下面的主體段＋§0.7 `[NEG]`，並附 `design/style_frame/` 三張定稿圖。
交件放 `design/_incoming/award_20261012/<區塊>/`，我負責去背、量化、量尺寸、接進遊戲、過檢查。

---

## A. 聲音（影響最大，Capo 第一次被退就有「音效弱」）

### A.1 現況與目標

| | 現在 | 目標 |
|---|---|---|
| 來源 | 全部 numpy 正弦波合成（`design/generate_*_audio.py`） | 實際錄音或製作級音樂庫／作曲 |
| 音效數 | 32 個 | ≥ 90 個（Hacksaw 中位數 106；同題材《Cash Crew》136） |
| 配樂 | 2 首，循環 16.6 秒／14.5 秒 | 3 首（主遊戲、免費遊戲、The Don），每首 2–3 分鐘、4 層強度 |
| 變化 | 每個動作 1 種 | 常出現的動作 3–5 種隨機輪播 |

### A.2 配樂（1930 年代犯罪爵士）

編制：弱音小號、單簧管、低音提琴、刷鼓、鋼琴、顫音琴；The Don 加弦樂。

| 曲 | 速度／調性 | 四層（同一首的分軌，依場面疊加） |
|---|---|---|
| 主遊戲 | 118 bpm swing，D 小調 | L0 低音提琴＋刷鼓（待機）／L1 ＋鋼琴伴奏（轉輪中）／L2 ＋弱音小號旋律（中獎）／L3 ＋全團重音（預中、大獎前） |
| 免費遊戲（Soldier／Capo） | 136 bpm，G 小調，緊張 | 同上四層，L3 加銅管齊奏 |
| The Don | 96 bpm，C 小調，黑色電影 | L0 弦樂頑固低音／L1 ＋鋼琴／L2 ＋單簧管／L3 ＋銅管與定音鼓 |

規格：48 kHz 立體聲，每層等長、樣本級無縫循環，交 WAV（我轉 m4a），各層對齊同一小節線。

### A.3 音效清單（括號內 = 變化數）

**轉輪**：spin_start(2)、reel_stop_1–5(各 2，五條音高略異)、reel_stop_tease(2)、anticipation_riser（弦樂顫音＋心跳，可循環 3 秒）、anticipation_hit。

**符號落地**：籌碼 chip_clack(4)；高賠各一組 —— 權戒 ring_ting(2)、天際線 neon_buzz(2)、公事包 latch_click(2)、
威士忌 ice_clink(3)、轎車 engine_rev(2)；Wild 軟呢帽 hat_flip(2)；Scatter 金庫轉盤 dial_click_1–5（隨顆數升高）。

**機制**：
- 琴盒 case_latch(2) → case_lid_open → string_stab(2) → wild_column_fill（弦樂上行 0.8 秒）。
- 金庫倍數框 frame_drop_1x1 / 2x2 / 3x3（鋼門重擊，越大越沉）、frame_dial_spin（轉盤滾動，可循環）、
  frame_value_land(3)、frame_double（兩音上揚）、frame_sticky_lock（鎖扣）。
- 觸發 fs_trigger_bell、vault_door_close、vault_door_open（液壓嘶聲＋重鐵）、fs_intro_soldier／capo／don（三支不同長度的爵士短句）、
  retrigger_sting(2)、fs_outro。

**贏分**：win_line_tick(3)、win_count_loop（計數循環）、win_end_low（贏分 < 下注）、win_end_over（≥ 下注）、win_end_high（大獎收尾）、
big_win_big／super／mega／epic／max（銅管齊奏逐級加長加厚）、coin_shower_loop（銀幣）、bigwin_impact。

**介面**：ui_click(3)、ui_hover、bet_up、bet_down、bet_max、menu_open、menu_close、buy_menu_open、buy_confirm、autoplay_start、turbo_toggle。

**環境**：speakeasy_room（人聲低語、杯子、遠處爵士，60 秒循環）、rain_window（30 秒循環）、vault_room_hum（免費遊戲）。

**人物短句**（配音員或有商用授權的語音生成）：
- Don：「Capisce?」「That's how it's done.」低笑(2)、嘆氣(1，連續 10 手沒中時偶爾)、「Now we're talking.」（大獎）
- 女主人：「Welcome, darling.」（進免費遊戲）、「Oh my!」（大獎）、輕笑(2)、「Encore!」（結算）

規格：44.1 kHz／16-bit WAV，峰值 −1 dBTP，短音效前端不留靜音（停輪對拍子），檔名照上面。

### A.4 授權

音樂庫或生成工具都要確認**授權涵蓋真錢博弈遊戲商用**，交件附授權證明。

---

## B. 符號動畫（「動畫不足」的主因：現在所有符號都是靜態圖）

每個符號交**落地 0.5 秒**與**中獎 1.0 秒**兩段，24 fps 序列圖（512×512／格，洋紅底），
或交分件圖（我用程式做骨架動畫，需標樞紐點）。四張籌碼共用一套中獎動畫。

| 符號 | 落地 | 中獎 |
|---|---|---|
| H1 權戒 | 落下壓一下 | 戒指轉 15°、紙白反光沿斜面掃過、戒面放射線展開 |
| H2 天際線 | 落下 | 窗戶由下往上一層層亮、頂端探照光束轉一圈 |
| H3 公事包 | 落下彈一下 | 蓋子掀開 20°、鈔票扇形翹起再落回 |
| H4 威士忌雪茄 | 冰塊叮一下 | 冰塊浮沉、雪茄冒一縷煙（三階明暗的 Deco 煙）、杯緣反光 |
| H5 轎車 | 落下避震一壓 | 車頭燈閃兩下、車身上下彈 |
| W 軟呢帽 | 落下 | 帽沿一掀（脫帽致意）、背後扇形轉一格 |
| SW 琴盒 | 落下 | 扣環彈開、蓋子開 30° 透出紙白光（接 C.2） |
| S 金庫轉盤 | 轉盤喀一格 | 轉盤轉一圈、插銷縮回 |
| L1–L4 籌碼 | 落下 | 籌碼立起翻面（橫向縮放 1→0→1 看到背面）、花色閃一下 |

提示詞（每格序列用同一張底圖延伸，例：H3）：
```
[STYLE] + "A 1930s leather briefcase full of banknotes, front three-quarter view, frame 1 of 12:
lid closed; by frame 6 the lid is open 20 degrees and the banknotes fan upward; frame 12 back to rest.
Same object, same scale, same light in every frame, centred, magenta #FF00FF background" + [NEG]
```

---

## C. 招牌鏡頭

### C.1 金庫倍數框（全款唯一的紅）
現在：紅框在轉輪還在轉的時候就先出現，數字直接印上。
目標：停輪後框從上方砸下（0.25 秒）→ 框內小轉盤滾數字（0.6 秒，滾動中紅光逐亮）→ 定格一記重音。2×2／3×3 更沉、加灰塵。
需要的圖：三種框的「砸下」殘影 2 張、框內轉盤刻度環（可旋轉單件）、落定時的紅色衝擊環（Deco 放射狀，3 張序列）。

### C.2 琴盒展開
現在：一道灰光柱。
目標：琴盒落定 → 扣環彈開 → 蓋子開（序列 4 格）→ 紙白階梯光從盒中往下灌滿整條（Deco 三階光帶，不是柔光）→ 軟呢帽 Wild 由上往下一格格蓋章。
需要的圖：琴盒開蓋 4 格序列、階梯光帶（可縱向拉伸的單件，透明底）。

### C.3 觸發免費遊戲
三個金庫轉盤同時發亮 → 盤面變暗 → 既有金庫門關上時轉盤轉到「OPEN」→ 開門進免費遊戲。
需要：金庫門中央轉盤的「OPEN」刻字版（字由我排，這裡只要轉盤空白版的高解析單件）。

---

## D. 人物表演

現在只有贏／大贏／觸發三種反應，而且幅度小。目標詞彙（Hacksaw 人物反應約 2.1 秒）：

| 時機 | Don | 女主人（免費遊戲） |
|---|---|---|
| 待機（每 6–10 秒隨機） | 抽雪茄吐一個 Deco 煙圈、整理袖口 | 麥克風架輕晃、撥頭髮 |
| 預中 | 轉頭看轉輪、身體前傾 | 手摀胸口 |
| 金庫框落下 | 用雪茄指向盤面 | — |
| 一般中獎 | 嘴角上揚、點頭 | 微笑 |
| 大獎 | 仰頭大笑、張開雙臂 | 抬手唱高音姿勢 |
| 進免費遊戲 | 壓帽沿點頭（把場子交給她） | 飛吻（開場卡上） |
| 結算 | — | 鼓掌 |
| 連續 10 手沒中 | 搖頭、看錶 | — |

需要的分件（照 `design/cast_brief/` 的分層規則，與現有骨架對位）：Don 頭部表情 4 種（平常／微笑／大笑／皺眉）、
眨眼 3 格、雪茄手 2 個姿勢、張臂用的左右前臂；女主人頭部表情 3 種、眨眼 3 格、飛吻手、鼓掌手。

---

## E. 大獎牌、結算、開場卡、數字

**大獎五級**（現在五級共用一塊素面黑框）：做成戲院霓虹招牌（marquee）——
BIG 一排燈泡框、SUPER 雙排、MEGA 加側翼、EPIC 加放射頂飾、MAX 全螢幕紅絨布幕開啟。
字由我排；請交**空白招牌**＋**燈泡遮罩**（我做跑馬燈）。

**結算 TOTAL WIN**：戲院售票亭造型牌（空白）。
**再觸發**：「+N SPINS」用的金庫門牌（空白）。

**數字**：裝飾藝術風數字 0–9、×、$、.、, 三套（銀＝大獎計數、紅＝倍數、紙白＝計數器），每字 256 px 高、透明底、字距一致。

**開場說明卡**（三張，照 Hacksaw 慣例）：每張上半一張大圖、下面 2–4 行字。
1) 金庫倍數框：紅框套在權戒上的特寫；2) 琴盒：開蓋、光灌下的瞬間；3) 最高贏分：大大的「20 000×」裝飾數字（字由我排，這張只要底圖的鋼門牌）。
波動度圖示改成 5 根雪茄（交雪茄單件：亮、暗兩版）。

---

## F. 商店縮圖

現在 FG 層的 Don 在胸口下方被一條水平直線切斷、浮在放射線上。重新構圖二選一：
1) Don 全身入框、四邊留邊；2) Don 半身，身體自然延伸出底邊（底邊以下才裁切）。
提示詞：
```
[STYLE] + "Portrait of a 1930s mob boss in a grey double-breasted suit, fedora, white scarf, cigar in
hand, standing three-quarter view, figure fully inside the frame with generous margin on all sides,
transparent background" + [NEG]
```
交 1024×1024 透明底（FG）。背景層不用改。

---

## G. 交件後我做的程式工作（對帳用）

- 音效：接新清單（變化輪播、四層配樂依場面疊加、人物短句觸發點）、轉 m4a、更新 `check_sounds.mjs` 與音量平衡。
- 符號：序列圖接進 SymbolSprite（落地／中獎狀態），保留現有程式動態當備援。
- 招牌鏡頭：NeonFrames 改成停輪後砸下＋轉盤滾數；WildColumns 換琴盒序列＋階梯光；觸發轉盤 OPEN。
- 人物：新增反應表與觸發時機（預中、框落下、結算、連續沒中）。
- 大獎牌：五級招牌＋跑馬燈；TOTAL WIN 與再觸發牌換新圖；數字字型改圖片字。
- 開場卡：三格大圖版＋雪茄波動度。
- 縮圖：換 FG 層並重跑 `check_thumbnail.py --upload`。
