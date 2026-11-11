# Store art — thumbnail + cover re-composed with the thick-limb cast (2026-11-10, local files only)

thumbnail/SumoMonkey-Thumbnail-{BG,FG}.png (1024²) and cover/SumoMonkey-Cover-{BG,FG}.png (1920×1080) now use the
current MG/FG full figures (design/sumo_cast/*/full.png); same arena BG and figure heights as 10-30. Cover pair spread
a little (MG x .61→.59, FG .82→.835) so the thicker MG no longer hides half of FG; bottom-left and top-right stay clear.
check_thumbnail.py --upload: thumbnail BG mean 212.6, cover BG mean 190.0 — PASS. Script:
design/build_sumo_store_20261110.py; before/after: design/qa/store_20261110/; backup:
_upload_backups/SumoMonkey-before-store-20261110/store.tgz. art-source/cast/ refreshed to the current cast.
**Platform store art NOT updated** — stakecli has no image upload; upload BG + FG in the Stake Engine dashboard
(PREVIEW-only files are for looking at, not for upload). Frontend stays v15, math v1.

# Current package — UI fixes + wide A/J tags, PUBLISHED front v15 / math v1 (2026-11-10)

On top of v14 (thick-limb cast): one wordmark on screen at a time (top-right 260×65 on wide screens, beside the clock
in portrait / narrow / pop-out); the bet bar's three stray squares (Sushi retro-window buttons) removed; intro tagline
in ink on a paper slip; portrait intro text ≥12 px; Buy Feature subtitle "CHOOSE YOUR BOUT"; new wide A (hinoki ema)
and J (hexagonal plaque) tags, as wide as K (Codex generated, Claude cut out/exported, picks A_2 + J_3).
Uploaded 6 files + 1 obsolete bundle delete (427 unchanged), replan 0, published **front v15**; math v1 not
re-uploaded; no approval open, nothing submitted. Thumbnail/cover unchanged (still the earlier figures).
Previews refreshed: preview-current-desktop.jpg, preview-current-desktop-fg.jpg (FG 7 rows), preview-low-symbols-96px.png.
Sources + evidence: art-source/ui-nits-aj-20261110/. Backup: _upload_backups/SumoMonkey-before-ui-nits-20261110/.

# Current package — thick-limb cast, PUBLISHED front v14 / math v1 (2026-11-10)

Both casts (MG + FG) replaced by the thick-limb sumo bodies (角色生圖_相撲猴/四肢加粗_20261107): Codex generated the
full bodies and hidden-area repaints, Claude split them into the same 14 layers / joints / motion recipe, QA'd every
0.12 s of all six motions and the in-game desktop / portrait / DOSUKOI cut-in.
Uploaded 31 files + 1 obsolete bundle delete (402 unchanged), replan 0, published **front v14**; math v1 not
re-uploaded; no approval open, nothing submitted for review. Thumbnail/cover unchanged (they still show the
earlier figures). Previews: sumo-current-motion.gif (MG | FG, final renders), preview-thicklimbs-before-after.png,
preview-current-desktop.jpg, preview-current-desktop-fg.jpg, preview-current-portrait-cutin.jpg.
Spine 4.3 projects of the current cast: spine43/{mg,fg}/. Sources + evidence: art-source/thicklimbs-20261110/.
Older previews and the old SumoMonkey-Spine43.zip (previous cast) moved to archive-before-thicklimbs-20261110/.
Backup: _upload_backups/SumoMonkey-before-thicklimbs-20261110/.

# Current package — self-check fixes, PUBLISHED front v12 / math v1 (2026-11-03)

Fixes from the 11-03 self-check (wp-banandit/apps/SumoMonkey/design/qa/selfcheck_20261103/報告.md):
buy cards grey out when unaffordable; bar names the played feature (YOKOZUNA CLASH IS ON! / FREE SPINS ARE ON!);
clock+name shrink below 450px tall (400×225 no longer over the board); right-hand name hidden behind modals;
close × centred; no 4–5px page overflow; <title>Sumo Monkey</title>; two rules typos.
Uploaded 5 files + 3 deletes (replan 0), published front v12. Math not re-uploaded. No approval open.
Thumbnail/cover unchanged. Submission text: SUBMISSION_TEXT.md.
Backup: _upload_backups/SumoMonkey-before-selfcheck-fix-20261103.

# Current package — v7 glove order + high-symbol tiles, PUBLISHED front v7 / math v1 (2026-10-27 16:4x UTC)

Rear glove (fist_back) now draws above the head in both casts (layers.json); motion unchanged.
High symbols H1–H4 sit on the royals' paper tile with a salmon inner rule (design/sumo_frame_high_symbols.py).
Checks/images: wp-banandit/apps/SumoMonkey/design/v7_check/. Uploaded 7 files + 1 delete (replan 0), published front v7; math not re-uploaded. Plan: _upload_backups/SumoMonkey-publish-v7-20261027.
Backup of v6 staging + sources: _upload_backups/SumoMonkey-before-v7-20261028.

# Current package — v6 touch-up + knee-crack fix, 2026-10-27

Published frontend v6 / math v1 (math not re-uploaded), verified by publish receipt and get_game.
Touch-up (補畫_v5): knees, FG front thigh texture, no ink on covered joint ends, specks, MG elbow.
MG front-knee 1–2 px crack filled in mg leg_front_lower; motion/placement unchanged.
Checks and images: wp-banandit/apps/SumoMonkey/design/v6_check/ (報告.md).
No approval open; thumbnail/cover on platform unchanged. Earlier entries are historical.

# 2026-10-27 本機補畫更新

已完成補畫單 v5 的五項修正，419 檔前端與同版縮圖／封面已更新；數學7檔不變。**平台尚未更新。**

驗收報告：art-source/v5-detail-20261027/驗收報告.md。動作預覽：sumo-current-motion.gif。以下為歷史紀錄。

---

# Current package — Forearm correction, 2026-10-26

Published frontend v5 / math v1, verified by publish receipt and get_game.
Both MG/FG front/back upper/lower arm art corrected (8 layers).
All six motions and transitions visually reviewed; desktop/portrait local game verified.
Math unchanged, +5 retriggers / row growth unchanged. Auto Spins v4 fix retained.
Current preview: sumo-current-motion.gif; before/after: preview-forearm-before-after.png.
Current character source: art-source/cast/ and art-source/motion/.
Details, revision checks, screenshots and release receipts: art-source/forearm-fix/.
Local thumbnail/cover refreshed; platform store art left to user as instructed.
Earlier entries and their version-specific previews are historical.

# Current package — Auto Spins fix, 2026-10-25

Published frontend v4 / math v1, verified. Corrected invisible round options,
selected states, close glyph and mobile advanced-limit layout.
Details and release evidence: art-source/auto-modal-fix/.
Thumbnail/cover unchanged on platform, per user instruction.
Previous entries below are historical.

# Current package — 2026-10-25 presentation polish

Portrait layout, reward clarity, character transitions and background contrast updated.
Current frontend and previews are final; details: art-source/polish/README.md.
Runtime transition preview: sumo-polish-motion.gif. Official unchanged rigs: SumoMonkey-Spine43.zip.
Platform UPDATED: frontend v3 / math v1, verified by stakecli publish + get_game.
Thumbnail/cover will be uploaded by the user; platform store art unchanged.
Publication receipts: art-source/publish-20261025/. Older entries below are historical.

# Sumo Monkey

2026-10-24 boxing-stance redraw package. Source game Sushi Monkey retained separately.

- frontend/: production static frontend. No local RGS stub.
- math/: final optimized200k real books, all indexed files/hash checks passed.
- thumbnail/: separate BG/FG/provider-logo. One hero only.
- cover/: separate BG/FG, both cast featured.
- art-source/: original generated art, corrected layered character sources,
  generators, Spine4.3 JSON, motion reports and animation GIFs.
- SumoMonkey-Boxing-Spine43.zip: both new characters' Spine4.3 JSON/images,
  checked recipes, motion reports, HTML/GIF previews.
- sumo-boxing-motion.gif: actual evaluated MG/FG motion side by side.

FG meter thresholds4/8/12 each award5 spins and raise the board one row.
Rows4→5→6→7. Low10/J/Q become prize medallions progressively.
Collections and Ways use the actual enlarged board. Max win10,000×.
Bonus100× starts4rows; Superbonus150× starts5rows (no retrospective extra spins).
Weighted RTP96.02%/96.05%/96.08% for base/bonus/superbonus.

Built-in ImageGen produced the illustrations; the new spine-motion tool produced
both character skeletons and six animations. Both figures were first drawn as
complete coherent illustrations, then separated into14 registered layers.
Complete concealed head/chest anatomy and texture-backed rounded joint overlaps
replace the former independently generated parts. Both final motion reports PASS:
all12 animation checks score100, no joint gaps or joint warnings. Idle intensity
is0.80 MG/0.65 FG to avoid a folded-arm IK snap; the kit's celebration recipe
uses swing30. Runtime samples those Spine4.3 evaluated transforms
at30fps without changing the workspace's shared Spine4.2 runtime.

Local replay shell is outside the package at dist/sumomonkey-playtest/.
Platform: published 2026-10-25 as math v1 + front v1 (see end of file).

Manga revision: actual SushiMonkey assets used as style references. Ink, ivory,
sparse hatching and muted salmon throughout cast, symbols, arena and nativeUI.
All8symbols+arena pass unchanged color/softness/chroma/palette-fit/accent gates.
Both casts pass all six Spine-motion seam/motion checks; character style gates
also pass. Local full base+bonus replay finished without browser/network errors.
Boxing BASE+BONUS playback both completed wallet/end-round without browser or
HTTP errors. All4/5/6/7row states and+5 observed; all14parts per cast change
local/world transforms. Desktop,portrait7 and final mirrored cut-in checked. All seven math files SHA256verified
unchanged against _upload_backups/SumoMonkey-before-boxing-20261024/math.sha256.

Current reproduction: design/sumo_boxing_* prepares/validates whole-figure
derived layers; spine-motion character runs the basic checks;
design/sumo_generate_motion.ts uses the official kit API for the measured final
recipes; design/sumo_export_motion.ts evaluates/bakes the exact shipped rig.
Do not regenerate the current cast with legacy sumo_build_layers.py or the old
sumo_source/*_parts.png atlases. The original request, reference images,28 raw
extraction edits and final reconstruction evidence are in art-source/boxing/.

2026-10-25 00:15 Platform UPDATED (user typed 發布): first publish of sumo-monkey (team silver-stars). Compliance PASS 2★/3★ (0 failures). Uploaded front 419 files 49.8 MB + math 7 files 214 MB, re-plan 0 actions both; published math v1 (check_compliance) and front v1; get_game shows both versions, approval none, image none (store thumbnail/cover not set via stakecli).

2026-10-25 11:40 UI package refreshed: approved Sushi-size button plates and FG
4-row opening board/cast scale now included in root upload/SumoMonkey/frontend.
Fresh build + guards PASS (13 inherited type diagnostics, no regression).
All419 build files match staged hashes. Fresh real BASE collection round reached
wallet/end-round; browser/network errors [], all14 local cast transforms move.
Desktop/portrait evidence refreshed; prior FG4-7/aspect comparison evidence copied
to art-source/ui-20261025. Thumbnail/cover retained. Math unchanged.
Platform NOT updated this pass; published front/math remain v1 per prior record.

## 2026-10-25 re-split v2 completed (local package; no platform update)

Implemented the 11:50 requirements and 重拆_v2/重拆單.md. Both casts now
have complete upper arms, clean torso/chest/armpits, smooth black-fur thighs,
painted overlapping round knees and clean wrist/cuff edges. Removed glove
cheek/chest fragments and pelvis leg fragments. All28 source PNGs are single
visible components; each full.png exactly matches its actual layer assembly.
The edited master is retained separately with honest target-difference proof;
registered generated parts are not mislabeled as pixel-identical to the master.
Source/provenance: 角色生圖_相撲猴/重拆_v2/交件/{MG,FG}. Original 交件
top-level files refreshed after backup; stale celebrate.params override removed.

Official spine-motion CLI regenerated both Spine4.3 rigs: all12 clips score100,
seams/flips/joints PASS. Original joints and recipe animations/bones unchanged;
idle first-frame rear-shoulder18°MG/15°FG reminders remain. Trim -> actual
Spine4.3 bake -> alpha placement -> game-transform previews. Generator now reads
the installed recipes instead of obsolete October24 staging/hard-coded params.
Historical neck painting and atlas extraction must not regenerate this cast.

Style PASS at unchanged Sushi thresholds: MG colors50/soft39.9/chroma7.6/fit75.5%;
FG67/48.6/8.7/65.6%. Final FG front-thigh ink revision preserves alpha byte-for-
byte, all other13 layers and all baked matrix bytes unchanged. Final real-book
BASE+BONUS reached two wallet/end-rounds, errors[]/HTTPfailures[], rows4/5/6/7,
+5 EXTRA SPINS,14LOCAL+WORLD parts moving per cast; desktop and portrait7 checked.
Build/guards pass with13 inherited type diagnostics (no regression).

Root upload/SumoMonkey refreshed: all419 build files match stage,28 cropped
textures/source match,7 math hashes unchanged, new thumbnail/cover exposure PASS.
Current active artifacts: SumoMonkey-Spine43.zip, sumo-redissect-motion.gif,
art-source/redissect-v2 (including runtime QA, v2/Bandit comparison GIFs, prompts,
raw sources and release-manifest.json). Earlier cast/motion/ZIP retained under
art-source/legacy/before-redissect-v2. No debug/stub observer in production.
Platform was NOT uploaded/published/updated in this pass. The revised user brief
records previously published front v2; platform version was not queried here.
2026-10-29: FG calf restoration (補畫_v5 had trimmed FG calves). Frontend, cover, Spine zip and motion GIF restaged; thumbnail and math unchanged. The platform itself has NOT been updated. Evidence: art-source/calf-fix-20261029/.
2026-10-29 (later): buy-feature cards now show the dohyo + Prize Medallion (were sushi plates); Dohyo Clash buy/confirm buttons readable; rules controls use Sumo icons. Restaged; platform NOT updated.
Platform: 2026-10-29 15:2x UTC uploaded (7 files + 3 deletes, replan 0) and PUBLISHED front v8 (math stays v1, no approval open). Receipts: _upload_backups/SumoMonkey-publish-v8-20261029.
2026-10-29 (later 2): intro MAX WIN card — 10,000× moved off the trophy onto clear paper below it (all layouts). Restaged; platform still front v8 until uploaded.
Platform: 2026-10-29 15:50 UTC uploaded (3 files + 1 delete, replan 0) and PUBLISHED front v9 (intro MAX WIN off the trophy; math v1, no approval). Receipts: _upload_backups/SumoMonkey-publish-v9-20261029.
2026-10-30: MG+FG all four leg layers — 補畫_v5 straight chord cuts undone (outline blended back to 重拆_v2 away from the knee; v5 knee tuck kept). Copies 角色生圖_相撲猴/腿部重修_20261030/. Staged 423 files; cover/thumbnail refreshed. Platform still front v9 until uploaded. Backup _upload_backups/SumoMonkey-before-legfix2-20261030.
Platform: 2026-10-30 03:00 UTC uploaded (11 files + 1 delete, replan 0) and PUBLISHED front v10 (MG+FG leg fix; math v1, no approval). FG checked in-game desktop + portrait 390×844 cut-in before upload. Receipts: _upload_backups/SumoMonkey-publish-v10-20261030.


2026-11-02 Neon spin update: published frontend v11, math v1 retained. See RELEASE-RECEIPT-20261102-neon.json.
