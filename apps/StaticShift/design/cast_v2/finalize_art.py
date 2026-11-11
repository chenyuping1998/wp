"""Stage the reviewed art locally, write a handoff and verify preview provenance."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,subprocess,sys
P=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(P/'prepare_delivery.py'),'--reuse-reviewed','--stage-art'],check=True)
manifest=json.loads((P/'精修/delivery-manifest.json').read_text())
expected={'arm_l_upper','arm_l_lower','hand_l_hip','hand_l_point','hand_l_open','leg_l_upper','leg_l_lower','foot_l','pelvis','leg_r_upper','leg_r_lower','foot_r','neck','torso','head_idle','head_blink','head_spiral','head_grin','head_annoyed','arm_r_upper','arm_r_lower','hand_r_pinch','hand_r_open','hand_r_grip','hand_r_hatheld'}
for ch,prop in [('dj','hat'),('host','glasses')]:
 D=P/'交件'/ch;assert {f.stem for f in (D/'layers').glob('*.png')}==expected|{prop}
 for name,h in manifest['characters'][ch]['qa_sha256'].items():assert hashlib.sha256((D/'qa'/name).read_bytes()).hexdigest()==h
 assert (D/'master.png').read_bytes()==(D/'assembled.png').read_bytes()
(P/'交件/README.md').write_text('''# Static Shift — 角色美術交件（2026-11-05）

正式使用 `dj/layers/`、`host/layers/` 與各自的 `assembled.png`：每位 26 張，共 52 張 1024×1536 真透明 PNG。同畫布原位，鞋底 y=1456。另有共用接口／疊序 layout.json 與來源雜湊。

- `qa/*-light-dark.jpg`：各層亮暗底。
- `qa/native-*-joints.png`、`qa/joint-*.png`：原生尺寸的靜態來源接合檢查，並非 Spine 動畫驗收。
- `qa/alpha-diffs/`：初稿到精修的 alpha 差異。
- `qa/source-repaint/`：初版褲子到新版生圖的輪廓變化；腿部保留檢查則以新版來源為準。
- `raw/`、`reference-master.png`：保留的初版來源，不能代替正式 layers／assembled。初稿的退件紀錄另存於上一層 source-qa-notes.md。

製程與使用說明見 `../DELIVERY.md`；內建 image_gen 的完整提示詞見 `../精修/source/joint-generation-prompts.json` 及初稿 generation-complete-manifest.json。沒有使用 CLI/API。

本次只交美術，未接 Spine、未整合遊戲、未打包 upload，也未更新平台。依需求單第 5.3，後續六組實際動畫與桌機／手機遊戲驗收由整合端執行。
''')
# Preview uses ONLY the exact staged assemblies, never the reference masters.
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',28);preview=Image.new('RGBA',(2048,1596),'#eeeade');draw=ImageDraw.Draw(preview);draw.text((45,22),'Static Shift — character art / 2026-11-05',font=font,fill='#20242b');proof={}
for i,ch in enumerate(['dj','host']):
 f=P/'交件'/ch/'assembled.png';im=Image.open(f).convert('RGBA');preview.alpha_composite(im,(i*1024,60));proof[ch]=hashlib.sha256(f.read_bytes()).hexdigest()
preview.convert('RGB').save(P/'交件/preview.jpg',quality=96);(P/'交件/preview-source-hashes.json').write_text(json.dumps(proof,indent=2)+'\n')
(P.parent/'ART_DELIVERY_2026-11-05.md').write_text('''# Static Shift 美術交件 — 2026-11-05

本次範圍僅兩份需求單的美術交件。

- UI：`source-ui-1104/` 七張透明 PNG；七檔尺寸、框體一致性、透明開口、底卡不透明中心均通過 check_delivery.py。
- 角色：`cast_v2/交件/dj/`、`cast_v2/交件/host/`，每位 26 層、1024×1536，共 52 層；各附同版 assembled.png、layout.json、亮暗底與來源檢查圖。
- 預覽：`cast_v2/交件/preview.jpg`，由本次正式圖層合成的 assembled 製成，附來源 SHA-256。
- 角色細節、補繪來源與完整提示詞：`cast_v2/DELIVERY.md`、`cast_v2/精修/source/GENERATION.md`。

程式驗證包含：全部非零 alpha 只有一個連續部件、沒有觸邊、透明 RGB 清零、預設合成逐像素一致、每個關節／全部換手／全部換頭接口至少 40px 重疊，以及新版腿部來源實體零刪除。數值檢查不冒稱實際動畫驗收。

本次未套 Spine、未接遊戲、未更新 upload 或平台。實際六組動畫、烘焙與桌機／手機遊戲驗收依角色需求單第 5.3 交由後續整合端。
''')
print('LOCAL ART DELIVERY VERIFIED: 52 layers, 2 assemblies, QA hashes, preview provenance; UI remains in source-ui-1104/')
