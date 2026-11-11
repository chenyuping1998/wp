# Hard Time 人物重切需求單（Spine v2，照 Iron Jaw 的做法）

2026-10-20。兩個角色（囚犯、典獄長）已經改成 Spine 骨架並同時站在盤面兩側（`design/build_cast_spine.py`、
`src/components/CastSpine.svelte`），會動也會反應。但現在的圖層太粗：

- 囚犯只有「頭」和「身體」兩層，雙手交叉、毛巾、兩條腿全黏在身體上。
- 典獄長的腿和身體同一層，扛警棍那隻手整隻畫在身體後面，往盤面一揮就被身體擋住。

Iron Jaw 每個角色切成 17–20 塊，每塊被擋住的地方都畫好。這份需求單就是把我們兩個角色切到同樣的程度。

**不重畫角色。** 角色長相、衣服、畫風都照現在遊戲裡的樣子。能直接從現有圖切出來的部件我自己切，
需要你生成的只有「被擋住、現在看不到的部分」，也就是下面 §3 的幾張補畫圖。

附件（都在這個資料夾）：

| 檔案 | 用途 |
|---|---|
| `full_prisoner.png`、`full_warden.png` | 現在遊戲裡的兩個人，1024×2048 原位畫布。**生圖時當底圖附上** |
| `cut_guide_prisoner.png`、`cut_guide_warden.png` | 切線（紅虛線）、關節（藍點）、每塊的名字（黃底） |
| `make_cut_guides.py` | 重產上面四張圖 |

---

## 1. 囚犯要切成 15 塊（由後到前）

| # | 名稱 | 內容 | 誰做 |
|---|---|---|---|
| 1–2 | `thigh_r`、`thigh_l` | 大腿：外套下襬到膝蓋，往上多 40px 伸進外套底下，往下多 40px 伸到小腿後面 | 我切；被外套擋住的那 40px 用 §3 的 P3 |
| 3–4 | `shin_r`、`shin_l` | 小腿：膝蓋到腳踝，往下多 30px 伸進鞋子 | 我切 |
| 5–6 | `shoe_r`、`shoe_l` | 鞋子 | 我切 |
| 7 | `pelvis` | 褲頭到胯下，往上多 40px 伸進外套下襬 | 我切＋P3 |
| 8 | `torso` | 外套軀幹（含領口內的上衣），**手臂和毛巾拿掉後畫完整** | **P1 補畫** |
| 9–10 | `upper_arm_r`、`upper_arm_l` | 上臂：肩膀到手肘，肩端多 40px 伸進軀幹 | 我切＋P2 |
| 11 | `forearm_under` | 下面那隻前臂（角色**右**手，畫面左邊伸過來的那隻）連手掌，**被上面那隻擋住的部分畫完整** | **P2 補畫** |
| 12 | `forearm_over` | 上面那隻前臂（角色**左**手）連手掌 | 我切 |
| 13 | `towel` | 掛在肩上的白毛巾（掛肩那段＋垂下那段） | 我切 |
| 14 | `head` | 頭、臉、頭髮、脖子（脖子多 30px 伸進領口） | 現有那層 |
| 15 | `blink` | **閉眼的眼皮**，只有兩眼那一小塊 | **P4 補畫** |

## 2. 典獄長要切成 20 塊（由後到前）

| # | 名稱 | 內容 | 誰做 |
|---|---|---|---|
| 1–6 | `thigh_r/l`、`shin_r/l`、`shoe_r/l` | 同囚犯；大腿往上伸進皮帶底下 40px | 我切＋W3 |
| 7 | `upper_arm_r` | 扛警棍那隻手的**上臂**（畫面左），肩到手肘，**在身體後面** | 我切＋W2 |
| 8 | `torso` | 襯衫軀幹，**哨子、無線電線、兩隻手臂拿掉後畫完整**，下緣多 40px 伸進皮帶底下 | **W1 補畫** |
| 9 | `pelvis` | 皮帶＋褲頭到胯下，**鑰匙拿掉後畫完整** | **W3 補畫** |
| 10 | `keys` | 鑰匙圈（會晃） | 我切 |
| 11 | `whistle` | 哨子＋掛繩（會晃） | 現有那層 |
| 12 | `upper_arm_l` | 空手那隻的上臂（畫面右），肩到手肘 | 我切 |
| 13 | `forearm_l` | 空手那隻的前臂，手肘到手腕 | 我切 |
| 14 | `hand_l` | 空手那隻的手掌（手腕可以彎） | 我切；手腕接縫用 W2 |
| 15 | `radio_cord` | 耳機捲線（會晃） | 現有那層 |
| 16 | `forearm_r` | 扛警棍那隻手的**前臂連手掌**，**改到身體前面**（這樣往盤面揮不會被擋住） | 我切＋W2 |
| 17 | `baton` | 警棍，整支 | 現有那層 |
| 18 | `fingers_r` | 握在警棍前面的手指 | 現有那層 |
| 19 | `head` | 頭、臉、帽子、脖子 | 現有那層 |
| 20 | `blink` | 閉眼的眼皮 | **W4 補畫** |

## 3. 要生的圖（共 8 張）

每張都是**拿 `full_<角色>.png` 去改**：同一張畫布、同一個人、同樣的位置與大小，只把指定的東西拿掉、把底下畫出來。
輸出 **1024×2048 PNG**，背景透明或純洋紅 `#FF00FF`（我去背）。如果生圖工具改了尺寸或位置也沒關係，我會用影像比對對回原位，
但人物比例、姿勢不能變。

| 編號 | 角色 | 拿掉什麼、要畫出什麼 |
|---|---|---|
| **P1** | 囚犯 | 拿掉**兩隻手臂和毛巾**，畫出完整的外套前胸、兩側腰身和肩膀。外套的鈕扣、口袋、胸前空白名牌照原樣延續。肩膀到袖口的位置畫成沒有袖子的外套肩線（手臂之後會疊回去）。 |
| **P2** | 囚犯 | 只畫**兩隻手臂**，**不要身體**：上臂從肩膀到手肘、前臂連手掌，雙手交叉的姿勢跟原圖一樣；**下面那隻前臂（角色右手）被擋住的部分要畫完整**，像上面那隻是透明的。 |
| **P3** | 囚犯 | 只畫**褲子和鞋子**，**不要外套**：把外套下襬擋住的褲頭、腰部畫出來，往上畫到外套下襬上方 60px。 |
| **P4** | 囚犯 | 同一張臉，**眼睛閉起來**（自然眨眼的閉眼，不是瞇眼或睡著）。其他地方完全不動。 |
| **W1** | 典獄長 | 拿掉**兩隻手臂、警棍、哨子、耳機捲線**，畫出完整的襯衫軀幹：兩個胸袋、肩章、空白胸章與臂章、鈕扣排照原樣延續，襯衫下緣往下畫到皮帶下方 40px。 |
| **W2** | 典獄長 | 只畫**兩隻手臂**，**不要身體和警棍**：扛棍那隻手（畫面左）上臂與前臂連手掌完整畫出、手勢照原圖（握著一根看不見的棍子）；空手那隻（畫面右）照原圖垂下。 |
| **W3** | 典獄長 | 只畫**皮帶、褲子和靴子**，**不要鑰匙、不要襯衫**：鑰匙擋住的皮帶與褲子畫出來，褲頭往上畫到皮帶上方 40px。 |
| **W4** | 典獄長 | 同一張臉，**眼睛閉起來**。其他地方完全不動，帽子、八字鬍都不變。 |

### 英文提詞

**共用開頭（每張前面都貼）：**

```
Edit the attached image. Keep EVERYTHING about the character exactly the same: same person, same face,
same clothes, same proportions, same pose, same position and size on the 1024x2048 canvas, same
semi-realistic painted rendering, same line weight, same matte cloth and rusty texture, same single
light from the upper left. Do not add text, numbers or logos. Do not add any cold white-cyan light or
glow. Output a 1024x2048 PNG on a plain #FF00FF background.
```

**P1：** `Remove both arms and the white towel. Paint the complete khaki prison jacket underneath: full chest, both sides of the waist and both shoulders, continuing the buttons, pockets and the blank name patch exactly. Where the sleeves joined, end the jacket at a clean shoulder line.`

**P2：** `Show ONLY the two arms in exactly the same crossed-arms pose, no body, no towel, no head. Upper arms from shoulder to elbow, forearms with hands. Paint the lower forearm (his right arm, coming from the left of the image) complete, including the part normally hidden under the other forearm, as if the top arm were transparent.`

**P3：** `Show ONLY the trousers and the shoes, no jacket. Paint the waistband and hips that the jacket hem normally covers, up to 60 px above where the jacket hem was.`

**P4：** `Close his eyes in a natural blink (relaxed closed lids, not squinting, not asleep). Change nothing else.`

**W1：** `Remove both arms, the nightstick, the whistle on its lanyard and the coiled earpiece cord. Paint the complete slate blue-grey uniform shirt underneath: both chest pockets, epaulettes, the blank badge and blank shoulder patch, the button line, and the shirt continuing 40 px below the top of the belt.`

**W2：** `Show ONLY his two arms in exactly the same pose, no body, no nightstick. The raised right arm (image left) complete from shoulder to hand, the hand closed as if gripping a stick that is not there; the hanging left arm (image right) complete from shoulder to fingertips.`

**W3：** `Show ONLY the belt, trousers and boots, no shirt and no keys. Paint the belt and trousers that the key ring normally covers, and the waistband 40 px above the belt.`

**W4：** `Close his eyes in a natural blink. Change nothing else; keep the cap and the moustache exactly as they are.`

## 4. 交件

放進 `wp/apps/HardTime/design/_incoming/spine_v2/`，檔名用編號：`P1.png`、`P2.png`…`W4.png`。
一張生得不理想就先交能用的，其他我可以先用現有的圖撐著。

## 5. 收到後我做什麼

1. 每張對回原位（影像比對），跟 `full_*.png` 比，人或位置跑掉的退回重生。
2. 照 §1、§2 切成 15 塊和 20 塊，每塊關節處互相重疊 30–40px；跑殘影閘門（`check_cast_underlay.py`）確認手一動不會露出假手臂。
3. 改 `design/build_cast_spine.py`：
   - 腿改成大腿、小腿兩節，膝蓋可以往鏡頭方向彎。
   - 囚犯雙手交叉可以收緊、鬆開，毛巾獨立晃。
   - 典獄長的警棍真的往盤面揮。
   - 兩人每 3–6 秒隨機眨眼一次。
4. 重新擷取動作 GIF、在 playtest 驗證 4:3／16:10／16:9，再給你看。
