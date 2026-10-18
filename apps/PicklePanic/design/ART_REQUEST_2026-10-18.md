# Pickle Panic — 剩餘平塗素材需求單（2026-10-18）

2026-10-18 latest repair: F–H implemented and verified (quiet tile, 894x200 phone tickets, narrow bottom-anchored rays). Print theme now maps base_ticker to the actual ticket sprite. H4 middle spear rotates independently +/-0.22 rad. Steam 1/5/6 soft: 20.7/20.8/29.9%; FG wall peak local contrast: 5.31%; tile inner luminance range: 5.04%. Nine UI/steam style gates pass. Production build passes with 15 existing type diagnostics, no new errors; review tags: 0 FAIL / 8 WARN (7 retired assets and existing portrait sizing reminder). Alpha/atlas audits pass. Local MG/FG, 375x812 tickets, EPIC/MAX and H4 book preview inspected with no observed console errors. Evidence: design/qa/review_1018/. Originals and exact prompts: design/source/review_1018/prompts_full.json. Package: /Users/stone/stake-engine/upload/PicklePanic/, including current 10/17 cover and thumbnail. Math unchanged. Platform NOT updated. Three-unfamiliar-human H4 recognition and real platform/touch-device checks remain outstanding.

Earlier audit/history below is superseded by the repair results above.

接 `ART_REQUEST_2026-10-17.md`（A–E 已交件、已 QA、已打包，commit bd003a8）。
本單是 10-18 用 `check_review_tags.py` 掃全遊戲，再逐一查程式**實際還在畫面上用**的平塗素材（2 色以內的向量感圖）。審核「Low quality assets」的定義包含「gradient fills / flat vector next to painted art」，這幾張是最後剩下的。

畫風、色卡、閘門同 `ART_BRIEF.md` §0：粗墨線美式地下漫畫、外線約內線 2 倍、平塗兩色調＋墨黑、少量乾筆斷墨、無漸層無 glow；新圖 colors95 ≤ 140、soft ≤ 38%、palette-fit ≥ 60%。原檔留 `*_pre1018.png`。**不要把文字或數字畫進圖**，全部由執行期排字。

已確認**不用畫**：門閂 `door_latch_v2.png` 已是新畫法（10-17 截圖看起來淡，是滑入動畫中途的透明度）。`button.png`、`button_on.png`、`buybonus.png`、`door.png`、`frame_bg.png`、`warning_bar.png`、`streak.png` 在程式裡已被 v2 圖取代或沒有顯示，不必重畫。

---

## 優先順序

| 級 | 檔案 | 在哪裡看到 | 為什麼 |
|---|---|---|---|
| P1 | **F. `low_label.png` 圖騰底紙籤** | 每一格圖騰底下（盤面 20 張，每一手都在） | 現在是兩色平塗方塊＋細墨框，全盤最大面積的「向量感」 |
| P1 | **G. `ticker.png` 數值框** | 手機直式的 WIN／BALANCE／BET 三個框 | 兩色平塗長條，而且被程式拉成 4.47:1，比例會變形 |
| P2 | **H. `ray.png` 大獎光束** | 大獎畫面後方 8 道放射（14% 透明度） | 一根平塗奶油色叉形，跟手繪墨線爆炸 `gbWinBurstV2` 不同調 |

---

## F. 圖騰底紙籤 `low_label.png`（P1）

所有圖騰（高分、低分、Wild 以外的 H1／H2／S 也共用）都疊在這張上，盤面靠它成格。

- **物件**：餐館點單紙籤／便條紙。奶油紙 #FFF0CF，粗墨外框（胖瘦不均、四角略圓、某一角有小折角或小撕口），左上到右下一道很淡的紙面明暗（**用平塗第二色調做，不是漸層**），1–2 處乾筆斷墨。
- **安靜**：它是底，不能搶圖騰。內部不要格線、圖案、紋理、污漬；明度變化 ≤ 6%。圖騰放上去之後，70px 灰階表的圖騰辨識度不能比現在差。
- **規格**：512×512 透明，**不透明區域邊盒必須維持 (36,36)–(468,469)**（程式用 PLATE_SCALE 1.1 把格間距收到約 10px，邊盒一變，格子就會黏在一起或縫變大）。正方形，不要歪斜到超出這個邊盒。
- **中獎時**程式會在外面畫芥末＋墨線框（`WinCellFrame.svelte`，約 0.9 格寬），紙籤外框不要用芥末色，以免跟中獎框混在一起。
- 驗收：盤面截圖（MG、FG 各一）＋ 70px 灰階表，附 colors95／soft／fit。

## G. 數值框 `ticker.png`（P1）

手機直式下 WIN／BALANCE／BET 的底框（`UiLabel.svelte` 的 `base_ticker`，程式固定畫成寬:高 = 326:73 ≈ 4.47:1，**整張拉伸，不是九宮**）。

- **物件**：出餐台上的點單票卡條。奶油紙底、粗墨外框、兩端各一顆小鉚釘或小夾子，跟下注列 `ui_bar_v2` 同一套語言。
- 中央 70% 寬、60% 高要乾淨（放兩行字：標題＋金額）。
- **規格**：**改成 894×200 透明**（4.47:1，避免被拉伸變形；程式不用改）。四邊留 ≥ 6px 透明。
- 驗收：375×812 手機直式截圖，三個框字都在框內置中、框沒有變形。

## H. 大獎光束 `ray.png`（P2）

`BigWinFx.svelte` 以底部中心為軸、8 道旋轉排列、透明度 0.14 疊在大獎招牌後面。

- **物件**：手繪墨線放射光束，一道細長楔形，奶油色 #FFF0CF 填色、外緣一條粗墨線，尖端有一兩處斷墨；和 `gbWinBurstV2`（手繪放射墨線）同一枝筆。不要現在的叉形尾巴。
- **規格**：256×256 透明，楔形**底部置中貼齊畫布下緣、尖端朝上**（程式 anchor x 0.5、y 1），寬度約畫布 35%。
- 驗收：EPIC／MAX 大獎截圖（`?qa_win_tier=9`、`10`）。

---

## 交件後由 Claude 做

建置、`check_review_tags.py`（這三張不能再出現 flat-fill WARN）、桌面＋手機實機截圖、重新打包到 `upload/PicklePanic`。平台上傳等使用者說「上傳」。
