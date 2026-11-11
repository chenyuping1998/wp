# Turf War 打手 — 扛棒手臂重生需求（2026-10-16）

現在的打手是**前臂直直往上、拳頭舉在肩膀外側**，球棒只能豎著，看起來像舉火把。
程式轉球棒試過 0–75°：轉小還是火把、轉大會插進臉裡 —— 問題在手的位置，必須重畫手臂。

**只重生 3 層：`arm_r.png`、`prop_bat.png`、`fingers_r.png`。** 身體、頭、左手、鍊子、面罩都不動。

## 附件（每張都附）

- `rearm_guide.png`：現有人物拿掉右臂＋新骨架線（橘＝手臂、青＝球棒）。**照這張的位置畫。**
- `rearm_base.png`：同上但沒有線、藍底 —— 新圖層疊上去要剛好接上這個身體。
- `style_frame/cast_head.png`、`../../_incoming/street_cast/mg/full.png`（袖子顏色、線寬照它）。

## 新姿勢（座標都是 1024×2048 畫布）

| 點 | 位置 | 說明 |
|---|---|---|
| 右肩（畫面左） | 410, 535 | 不變，跟身體接在這裡 |
| 手肘 | 305, 770 | 往外下方垂，手肘離身體約 75px |
| 握棒的手 | 395, 615 | **收在胸前、靠近鎖骨**，不是舉在肩膀外側 |
| 球棒握把末端 | 420, 690 | 在拳頭下方露出一小截 |
| 棒頭 | 190, 215 | 從握棒處往**後上方**斜過去，**靠在肩膀上**，棒頭朝外、遠離頭和臉 |

球棒和頭之間要看得到背景，不能碰到臉或面罩。棒子是**放鬆地擱在肩上**，不是舉起來。

## 提示詞

每張 = 共用開頭 + 該層句子。

```
Same game and same drawing style as the attached reference images: flat street cartoon
illustration, bold black outline, black interior lines at half the outline weight, flat colour
fills with no gradients, one hard-edged flat shadow shape per form, no lighting effects, no
reflections, no texture. Palette: ink black #121212, greys #55585D #9A9CA0 #D8D6D1, sticker
white #F7F5F0, warm brown skin in three flat tones, wood bat in sodium orange #9C5A22 #F5893D
#FFC38A with black tape on the grip. NO red anywhere, no neon colours, no text, no logos.
White sticker border ONLY along outlines that face the background, never along a cut edge where
another layer joins. 1024x2048 canvas matching the attached base figure exactly (feet at
y=1674, top of head at y=176); the part in its exact position, everything else pure blue
#0000FF. Pose: his right arm (image left) hangs from the shoulder at (410,535) with the elbow
out and down at (305,770), the forearm coming back up and inward so the fist rests in front of
the chest near the collarbone at (395,615); he holds a wooden baseball bat that leans back over
the top of his shoulder, the barrel tip up and outward at (190,215), clearly away from his head.
```

| 檔名 | 該層句子 |
|---|---|
| `arm_r.png` | `ONLY his right arm in the grey hoodie sleeve, shoulder to palm; the fingers that wrap the bat are NOT in this layer; extend 40px of sleeve into the shoulder with no outline there. Same sleeve colours and cuff as the reference.` |
| `prop_bat.png` | `ONLY the wooden baseball bat with black tape on the grip, drawn whole from knob to barrel tip, including the parts that the hand and shoulder will cover.` |
| `fingers_r.png` | `ONLY the fingers of his right hand that wrap around the bat grip, in front of the bat, at the fist position (395,615).` |

## 交件

放 `design/_incoming/street_cast/mg_rearm/`（三張 PNG，藍底或透明）。
我這邊：疊回身體檢查接縫 → 重建右臂骨架（肩 410,535 / 肘 305,770 / 握棒 395,615）→ 動作閘門 →
遊戲裡看待機與中獎反應 → 重做商店縮圖、cover、載入畫面 → 重新打包。
