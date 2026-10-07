# 裝到另一台電腦

## 1. 放進 skills 目錄

解開的資料夾**整個**（含 `SKILL.md`）放到：

| 範圍 | 路徑 |
|---|---|
| 個人（所有專案都能用）| `~/.claude/skills/hacksaw-character-motion/` |
| | Windows：`C:\Users\<你>\.claude\skills\hacksaw-character-motion\` |
| 單一專案 | `<專案>/.claude/skills/hacksaw-character-motion/` |

解開後長這樣，**`SKILL.md` 必須在最外層**：

```
hacksaw-character-motion/
├─ SKILL.md
├─ INSTALL.md
├─ rig/            路線 A 的工具鏈（自帶驗證）
├─ gallery/        角色挑選頁（index.html）＋每段動作一張 GIF 示意圖
├─ spineplay/      動作庫（motionlib.py）＋自己寫的 Spine 播放器
│  └─ packs/       六隻角色的動作資料（純動作，沒有貼圖）
│                  （比對官方 runtime 需要 `spine-webgl-3.8.js` /
│                   `spine-webgl-4.0.js`，見該目錄的 README）
├─ references/     動作庫說明（motion-library.md）、生圖提詞、Le Bandit 規格
└─ scripts/        dump38.py
```

## 2. 裝相依

```bash
pip install numpy pillow scipy
```

`node` 只有 `rig/parity.py` 需要，沒有的話跳過那一項。

## 3. 開新對話，先驗證

```bash
cd ~/.claude/skills/hacksaw-character-motion
python rig/reproduce.py    # everything reproduced
python rig/parity.py       # PARITY OK
python rig/check.py rig/example/character.rig.json   # all checks passed
python spineplay/constraint_selftest.py             # constraint selftest OK
for c in 1 2 3 4 5 6; do
  python spineplay/motionlib.py -c $c --verify         # 六隻都要 OK（骨骼＋網格）
done
python spineplay/motionlib.py --list                # 帶編號的角色清單
```

角色挑選頁與 GIF 示意圖：用瀏覽器打開 `gallery/index.html`。
要在這台機器重新產生：`python spineplay/motionlib.py --gallery`（不需要任何原作素材）。

**全部都綠才代表這台機器算出來的東西跟原機一模一樣。**
`reproduce.py` 會逐項斷言（去背保留 7807 px 同色像素、697 頂點 1280 三角形、
尖峰上臂 +5.8%…），對方的 numpy 或 Pillow 重採樣方式不同就會直接指出來，
而不是安靜地產出一個有點不一樣的動畫。

## 完整研究包（`hacksaw-motion-kit.zip`）

如果這個 skill 是從完整研究包裡拿出來的，研究包最外層還有：

* `materials/` —— 六隻角色的原始骨架／atlas／貼圖、Miami 分層原稿、驗證用的測試圖
  （Hacksaw 的美術，**私人研究用，不散布、不進產品**）
* `acceptance/run_all.py` —— 把上面這些驗證加上素材路線全部跑一遍；`--rebuild` 用原始骨架
  重建 6 個 pack 逐項比對，`--eval` 跑浣熊輪廓範本的完整驗收

skill 本身不需要 `materials/` 也能用（pack 已經帶著全部動作）。

## 4. 確認 agent 看得到

新開一個對話，問類似「我要讓角色立繪動起來」「生圖提詞怎麼設才能綁骨」，
skill 應該會自己被叫起來。沒有的話直接打 `/hacksaw-character-motion`。

---

## 不要動 `rig/example/`

那兩張圖不是 Hacksaw 的，是 `reproduce.py` 的斷言基準。
**刪掉就失去零誤差的驗證能力**，整個 skill 的保證跟著沒了。
