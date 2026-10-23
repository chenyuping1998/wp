# Turf War 角色重畫需求單：雙臂交叉 × 兩隻（2026-10-20）

**2026-10-20 v1 因人物比例被退回，v2 已改為完整定稿切層**：見 [交件與驗證紀錄](../CROSSED_CAST_STATUS.md)。原始需求保留如下。

使用者 10-20：「Turf 姿勢重新弄 超醜 人物比例也很怪」。10-18 只靠調骨頭角度修，救不回來，
所以 **MG 和 FG 都整隻重生**。使用者選的方向：
- 兩隻都用 **#5 雙臂交叉**
- 比例改成 **Hacksaw 粗壯卡通**

這份文件**優先於** `mg/README.md`、`fg/README.md`（brief.py 產的通用版）。那兩份照樣要讀，
裡面的 §0 畫風、交件格式和分層規則照舊有效；只有下面列出的幾條換成這裡的版本。

| 通用版 | 換成 |
|---|---|
| §5 關節表（半身參考放大成全身，肩寬和軀幹大約寬了一倍） | `*/pose_guide_turf.png` ＋ `*/joints_turf.json` |
| §3 第 1、2 條（垂下的手要離開身體 48px） | 不適用：兩隻手都交叉在胸前 |
| `dangle_beard` 圖層 | MG 改成 `dangle_mask`＋`prop_bat`，FG 改成 `prop_cigar`＋`dangle_smoke`（見下面） |

## 兩隻共用

- **畫風**：照 `ART_BRIEF.md` §0 街頭貼紙（白邊模切貼紙、黑外框、平塗、一塊硬邊陰影、不畫漸層和質感、圖裡不能有字）。每次生圖都附上 `mg/style_frame/cast_head.png` 和 `h1.png`。
- **比例（這次重畫的重點）**：
  - **5.5 頭身**，1 頭＝272px（頭頂 178 → 下巴 450）。舊版 FG 只有 7.5 頭身，頭太小；舊版 MG 褲子又長又寬，看起來腿太長。
  - 肩寬大約 1.4 個頭，胸膛厚，**手掌和球鞋畫大一號**（Hacksaw 的打手手掌比真人大）。
  - 腿大約 2.6 個頭，**膝蓋以下不要比大腿長**。兩腳距離不超過肩寬，腳尖朝前或微微朝左，**不要外八、不要大字站**。
  - 骨盆在 y≈960，大約在身高 52% 的位置。
- **朝向**：角色站在盤面**右邊**，所以身體要 **3/4 側身轉向畫面左**，臉和視線也朝畫面左。程式不翻面，圖要直接畫成這個方向。
- **雙臂交叉**：上臂靠著身體兩側，手肘往外，前臂在胸口下緣交疊。**角色自己的左手（畫面右，`arm_l`）的前臂疊在上面**，手掌壓在另一隻手的二頭肌上；右手（`arm_r`）的手掌塞在左臂下面，只露出指尖。
- **手肘、前臂最外緣不能超出 x 150–874**（關節圖上那兩條直線）。
- 腳底 y=1673、頭頂 y≈178，跟現在一樣，換角色時腳底不會跳。兩隻的頭頂高度差在 5% 以內。
- **`body.png` 要把被手臂擋住的胸口和腹部完整畫出來**，就像沒有手臂一樣，手臂動的時候才不會露洞或出現殘影。

## MG：蒙面打手（主遊戲）

- 延用現在的造型：深灰帽 T、帽子戴起來、黑色面罩遮住口鼻（後腦打結，有一段結尾垂下來）、橘色金鍊＋王冠墜子、寬褲、白球鞋、腰間掛噴漆罐。
- **球棒斜背在背後**：棒頭從**畫面左肩後面**往上露出（關節圖 `prop_bat` 那一點）。握把從畫面右腰後面露出一小截。**球棒要離頭的輪廓 60px 以上**，不能從臉或頭後面穿過去。
- 表情：瞇眼、兇，眉頭壓低。
- 圖層（由後到前）：`prop_bat`、`body`、`arm_r`、`arm_l`、`head`、`dangle_chain`、`dangle_mask`

## FG：Kingpin 老大（免費遊戲）

- 跟 MG 是**不同的人**：光頭漸層、短鬍子、嘴角叼雪茄、長版黑大衣（敞開）、黑上衣、粗的橘色古巴鏈、戒指、白球鞋。
- 比 MG 寬、比 MG 壯，但頭身一樣是 5.5；**頭不能畫小**。
- 雪茄叼在嘴角、朝畫面左；煙是一縷，往上飄。
- 大衣下襬只到膝蓋上面，不要拖到小腿（舊版大衣太長，看起來腿短身體長）。
- 圖層（由後到前）：`body`、`arm_r`、`arm_l`、`head`、`prop_cigar`、`dangle_smoke`

## 交件

- 交到 `design/_incoming/street_cast_crossed/mg/` 和 `.../fg/`
- 每個資料夾放：每個圖層一張 PNG（1024×2048 完整畫布、零件在原位、其他地方透明）、`full.png`（全部合併）、`layers.json`（實際的關節位置）
- 去背用藍幕 `#0000FF`（色票裡有洋紅和綠，不能用綠幕），邊緣要有反鋸齒：在 2 倍畫布上畫完再縮回來

## 生圖提示詞（英文給模型，先生全身圖，通過後再拆圖層）

**MG 全身**
> Full-body character for the Turf War slot game, flat die-cut vinyl sticker style matching the attached style frames: off-white #F7F5F0 sticker border, bold black #121212 outline, flat fills, one hard-edged shadow per form, no gradients, no texture, no text. Chunky stylised cartoon proportions, 5.5 heads tall, big hands, big sneakers, broad shoulders, short sturdy legs, feet no wider than the shoulders, toes forward. Masked street thug: dark grey hoodie with the hood up, black bandana over nose and mouth knotted behind the head, orange chain with a crown pendant, baggy dark trousers, white sneakers, a spray can clipped at the hip. Three-quarter view turned toward screen-LEFT, head and eyes looking screen-left, arms folded across the chest (his left forearm on top), a wooden baseball bat slung diagonally across his back, the barrel rising behind his screen-left shoulder well clear of his head. Narrowed eyes, menacing. Standing on a level ground line, whole figure visible head to shoes. Pure flat blue #0000FF background. 1024x2048, head top at y=178, soles at y=1673.

**FG 全身**
> Full-body character for the Turf War slot game, same flat die-cut vinyl sticker style as the attached style frames (off-white border, bold black outline, flat fills, one hard shadow, no gradients, no texture, no text). Chunky stylised cartoon proportions, 5.5 heads tall — a large head, not small — big hands, big sneakers, very broad heavy shoulders, short sturdy legs, feet no wider than the shoulders. Crime boss "Kingpin": bald fade, short full beard, cigar in the corner of his mouth pointing screen-left with a thin wisp of smoke, open black knee-length overcoat, black tee, thick orange Cuban-link chain, rings, white sneakers. Three-quarter view turned toward screen-LEFT, arms folded across the chest (his left forearm on top), chin up, unimpressed. Whole figure visible head to shoes on a level ground line. Pure flat blue #0000FF background. 1024x2048, head top at y=178, soles at y=1673.

**拆圖層**：用全身圖當底，一層一層補畫。每一層都要附上 `full.png` 和該角色的 `pose_guide_turf.png`，照上面的圖層表和通用版 §2 的要點畫（肩端往軀幹多畫 40px、脖子往衣領多畫 30px、切口處不畫外框和白邊）。

## 收到圖之後（我這邊做）

1. `check_layered_art.py` 驗收（反鋸齒、對齊、補畫是否完整）
2. `build_layered_rig.py` 建骨架，關節用交件的 `layers.json`
3. 改 `CastFigureMesh.svelte` 的圖層清單，**把 MG_REST/FG_REST 歸零**（新圖本身就是正確姿勢），重寫交叉手臂的反應動作表（#5：0.7 秒的「抖一下」）
4. 跑閘門 → 在瀏覽器確認朝向、16:10/4:3 不疊到盤面、FG 開場卡
5. 重做縮圖、cover、loading（`build_street_brand.py`）
