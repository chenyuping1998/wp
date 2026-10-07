# Provenance

Read this before shipping anything built with these tools.

## What was measured, and from what

Every number in `motion.py`, and every threshold in `inspect_art.py` and
`check.py`, came from reading the Spine skeletons and the compiled bundle of
**Hacksaw Gaming's *Miami Mayhem*** (gameId 1824, v1.23.2) — loop lengths,
key spacing, the rise/fall ratio of the idle wave, the snap/hold/release shape
of the reaction, per-joint amplitudes, and the mesh-weighting structure.

The two write-ups those numbers come from are bundled in `reference/`.

## The line this package draws

**Motion data is craft. Artwork is property.**

- **Timings, ratios, amplitudes, and structural decisions are ported.** That a
  reaction snaps in 17% and holds to 57%, that a limb's follow-through runs at
  roughly twice the amplitude of its parent and lags it, that a highlight
  should peak at 15% alpha rather than 100% — these are the observations that
  make the difference between something that reads as alive and something that
  reads as a tween. They are the reason this package exists.

- **No Hacksaw artwork is included, and none should be.** Not their character
  images, not their atlases, not their PSDs, not their `bat` / `bat_highlight`
  slices. Those were opened during the analysis to understand the method; they
  are not in this package and they must not end up in a product.

The bundled example (`example/character.png`, `example/bat.png`) is **not**
Hacksaw art. It exists so `reproduce.py` has something to assert against.

## What this means in practice

| you want to | do |
| :-- | :-- |
| use the idle/reaction timing model | fine — that is what this is for |
| use the gate thresholds | fine |
| trace over their character to make yours | **no** |
| ship any file out of their bundle | **no** |
| copy their layer/slot naming as a convention | fine — names are not art |

If you are unsure whether something is craft or property, the test that has
worked here is: **could a person who had only watched the game, never opened
it, have arrived at this?** A timing, a ratio, a structural insight — yes. A
pixel, an outline, a curve someone drew — no.

## Accuracy

The measurements are from files, not from running the game. Where a conclusion
rests on reading the minified bundle rather than observing behaviour, the
reference documents say so explicitly. Treat those as informed readings, not as
verified facts.

---

## `spineplay/packs/` 的六個 motion pack

2026-09 加入。它們是從 Hacksaw 的骨架檔（Le Bandit 的 raccoon、
Miami Mayhem 的五隻角色）抽出來的，**實驗與研究用途**。

pack 裡**沒有任何美術**：沒有貼圖頁、沒有 atlas、沒有 uv，
一個像素都沒有（網格頂點與零件輪廓格見下面兩則更新）。有的是骨骼階層、約束設定、關鍵幀曲線，以及每一層
在 bind pose 的方框（那是「使用者自己畫的那張圖要擺在哪」的幾何）。

那條線還是同一條：

* **時序、比例、幅度、結構決定是手藝** —— 只看過遊戲的人，反覆觀察與量測
  也能得出同樣的結論，照著做是公平的。
* **美術是財產** —— 貼圖、atlas、切好的零件，一律不進包、不進產品。

但 pack 描述的畢竟是別人角色的骨架結構，**不要進產品，也不要散布**。
要重新產生需要原始骨架檔：

```bash
python spineplay/export_pack.py <skeleton.json> --name <角色名> -o spineplay/packs/
```

### 2026-09 更新：pack 現在帶網格幾何

為了讓 Miami 的角色能被正確複製（網格投影），pack 加上了**網格幾何**：
頂點（綁哪幾根骨、權重、bind 位置）、三角形、deform 時間軸、clipping 多邊形。

舊版刻意不帶這些。這一版帶了，因為不帶就複製不了 —— 剛性片實測只有
IoU 0.43–0.57。頂點與權重屬於綁骨架的手藝，跟骨骼位置同一類；但頂點的外框
大致描出了原角色每個零件的輪廓，這點要知道。

**uv、貼圖、atlas、任何一個像素，仍然都沒有。** 使用者的 uv 是執行時把
bind pose 頂點投影到他自己的圖上算出來的。

### 2026-09 再更新：零件輪廓格變細（64×64）

浣熊是「每個零件一張圖」，使用者要照著畫的是每個零件的**輪廓**。
以前 pack 只帶 24×24 的粗格子給示意圖用，照它做成的範本，38 張裡只有 13 張
過得了檢查 —— 範本自己都過不了，使用者照畫也不會過。現在帶 64×64 的佔有格
（黑白兩值，沒有顏色、沒有細節），`--guide` 從它畫出每個零件的輪廓範本，
檢查門檻也拿範本一起校準過。

這比以前多描了一點原作零件的外形（小零件在 64 格下接近原本的輪廓）；
它仍然只是形狀，不是美術 —— 但一樣：**不要進產品，也不要散布**。
對話框裡的字只存外框（一個比例正確的矩形），不存原作的字形。

**照範本畫 = 你的角色剪影跟原作一樣。** 實驗可以；要變成自己的作品，
零件外形要換成自己的設計，改用 `joints.json` 對位（見 `references/motion-library.md`）。
