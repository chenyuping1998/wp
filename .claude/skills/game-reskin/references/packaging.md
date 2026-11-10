# Packaging: the repeatable pipeline

Every math change, however small, invalidates the frontend's compiled config,
the playtest stub, and every downstream zip. This sequence ran identically
five separate times shipping Capo Nostra's math retargets in one session —
worth writing as a script per-game (`design/ship.sh` or similar) on the FIRST
pass rather than retyping it each time. Paths below are the pattern; adjust
the game/app names.

**打包 = stage into `/Users/stone/stake-engine/upload/<Game>/` and stop.** Not
`wp/upload/`, not the app's `build/`, and no zips unless Stone asks for them.

## 0. What every game's `design/ship.sh` must do

Each lineage grew its own script and each one had a different hole (Turf's did
not deploy the playtest, had no `--check`, and did not copy store art; Sumo
Monkey ran Sushi's script for weeks; Pickle's stage script did not copy the
math). When scaffolding, make the new game's `ship.sh` do all of this, with its
own paths, game name, win cap and contamination word list:

- no arguments: math → build (with the guard chain) → stage frontend → store art
  check → README → sanity checks. **No zips.**
- `--zip`: the same, then the zips. `--check`: sanity checks only, no rebuild.
- `SKIP_STUB=1` / `SKIP_MATH_CHECKS=1` skip the memory-heavy steps when the math
  has not changed (the stub builder has used 13 GB on this 8 GB machine).
- copies `thumbnail/` (three files) and `cover/` (BG + FG) and fails if any is
  missing; writes the README with the platform state.
- fails, never passes, when a tool it needs is missing: Sushi's `--check`
  printed "all clean" while `rg` was not installed.
- its contamination greps cover the whole `assets/` tree (audio too) and the
  SOURCE game's theme words, not only its name.

Then `scripts/preflight.py <app> --upload upload/<Game>` on the staged result.

## 1. Sync the math config into the frontend

```bash
cd wp/apps/<Game> && \
  <math-sdk-python> design/sync_math_config.py /path/to/math-sdk
```

Writes `src/game/config.ts` from the math-sdk's own
`library/configs/config_<game>.json` — this is the ONLY place the frontend's
RTP figures, paylines, symbol paytable, and per-mode cost/max-win come from.
Never hand-edit `config.ts`; it says at its own top where it's generated from.

## 2. Copy the math library into the upload package

```bash
cp math-sdk/games/<game>/library/publish_files/* upload/<Game>/math/
```

## 3. Rebuild the playtest stub data

```bash
cd wp/apps/<Game> && \
  <math-sdk-python> design/build_playtest_stub_data.py
```

This regenerates the sampled-book catalogue the local playtest shell serves
in place of a real RGS. It reads whatever's in `library/publish_files/`, so
it must run AFTER step 2, not before. Expect it to take a couple of minutes
on a full library — background it. **It loads a whole books bundle into memory
(one run reached 13 GB): tell Stone before starting it, never run two at once,
and skip it (`SKIP_STUB=1`) when the math has not changed.**

## 4. Run the frontend build + guards

```bash
cd wp/apps/<Game> && pnpm run build
```

This chains the design-time guard scripts (`check_undefined_refs`,
`check_assets_exist`, `check_sprite_keys`, `check_social_words`,
`check_symbol_weight`, motion/anticipation/idle-sway checks, whatever the
game accumulated) before `vite build`. A green build here does not by itself
mean the game LOOKS right — see `stake-engine-slot`'s note on trusting a
green build too much — but a failing one means don't proceed to packaging.

## 5. Deploy the playtest build

```bash
rsync -a --exclude stub-data.js --exclude stub.js --delete-after \
  wp/apps/<Game>/build/ dist/<game>-playtest/
cp wp/apps/<Game>/design/playtest_stub.js dist/<game>-playtest/stub.js
```

Then confirm `index.html` still has the stub scripts injected before
`</head>` (the rsync overwrites `index.html` from the fresh build, which
strips them — re-inject if missing, don't assume they survived):

```html
<script src="./stub-data.js"></script>
<script src="./stub.js"></script>
```

## 6. Deploy the upload frontend

```bash
rsync -a --delete wp/apps/<Game>/build/ upload/<Game>/frontend/
```

**Only on the FIRST staging.** After that, look at what is already staged
before overwriting it. A reskin's `static/` still carries the source game's
leftovers (Deadwood Express's `build/` had Hot Miami's `hotMiami*` sprites,
spines, cast rigs and audio — 190 files the game never loads), and the first
staging pass usually prunes them and swaps the full-size art for
resized/palette-compressed copies (Deadwood: 66 MB → 31 MB, symbols 1254 px
RGBA → 512 px indexed). `rsync --delete build/` puts all of that straight back
and nothing downstream fails — the game still boots, the greps in step 7 still
pass, the zip is just twice the size and full of the old game.

For a code-only rebuild, replace just the code and leave the assets:

```bash
B=wp/apps/<Game>/build; U=upload/<Game>/frontend
tar czf _upload_backups/<Game>-frontend-$(date +%m%d-%H%M).tgz -C upload/<Game> frontend
cp $B/index.html $U/index.html
rm -rf $U/_app/immutable && cp -R $B/_app/immutable $U/_app/immutable
# anything the new bundle references that the pruned staging lacks?
(cd $B && find . -type f -not -path './_app/*' | sed 's|^\./||') | while read f; do
  [ -e "$U/$f" ] || ! grep -rqF "$f" $U/_app $U/index.html || echo "PRUNED BUT REFERENCED: $f"
done
```

If art genuinely changed, re-run whatever produced the compressed copies (the
game's `design/export_upload_art.mjs` or equivalent) rather than copying from
`build/`. Tell-tale that you got this wrong: `cmp` reports every PNG in
`assets/<game>/` as changed when you only touched code.

**Before writing anything into `upload/<Game>/`, look at what is there**
(`ls -l`). On 2026-10-04 a cover script overwrote the cover Stone had placed in
`upload/CapoNostra/cover` seven minutes earlier. A file newer than your own last
output is somebody else's: stop and ask. Back up what you replace
(`_upload_backups/<Game>-<part>-<MMDD-HHMM>.tgz`); the math library is not in
git, so a LUT that is overwritten without a backup is gone.

**Vite bundles every `new URL('…', import.meta.url)` in `assets.ts`
unconditionally.** Turning `preload` off does not keep a file out of the build
(Capo shipped 4.5 MB of Hot Miami parts that way, Hard Time 7.5 MB). Delete the
registry entry and the file. Do not write `assets/…` paths in comments either:
`check_assets_exist.mjs` reads comments too and fails the build on them. Move
retired assets out of `static/` into `design/_legacy_assets/`, or the next
staging uploads them again (Turf nearly re-uploaded 79 old cast files).

**A SvelteKit build is not byte-reproducible**: comparing sha256 of two builds
says nothing about whether the code changed. Compare sizes or normalise first.
And a background job's "exit 0" is the wrapper's; write `$?` into the log.

## 6b. Cover art — every game ships one

The game's Stake Engine page shows a wide **cover art** banner ("Change cover
art" in the dashboard). It is separate from the square thumbnail and every game
needs its own (user, 2026-10-04 — it used to be whatever image was at hand).
The docs give no size; make it **1920×1080**, delivered as TWO layers like the
thumbnail: `<Game>-Cover-BG.png` (opaque backdrop) and `<Game>-Cover-FG.png`
(cast + props on transparency, no title — the page sets the name). Keep clear
what the page draws over it:

- top-right ~16% × 14%: the star-rating pill
- bottom-left ~24% × 34%: the square game thumbnail tile

Compose it from the game's own finished art (backdrop, BOTH cast figures — the
cover may show both; the square THUMBNAIL shows exactly one character, house rule G1b,
a feature symbol, the title in the game's display face) and separate the figures from the
backdrop with a hard ink offset shadow — NOT a pale spotlight panel, which the
user rejected on Go Banandit as a white slab behind the character. Reference implementation:
`wp-banandit/apps/GoBanandit/design/build_cover_art.py` (writes
`design/cover/<Game>-Cover-BG.png`, `-FG.png` + `_preview_overlays.png` with the
two overlays drawn on — check that preview). Stage both as `upload/<Game>/cover/`.

**Store art is not uploaded by stakecli.** Stone places the thumbnail and cover
by hand in the studio. Every package README and every upload report states
whether the platform's store art has been changed, and after any change to a
character the thumbnail, cover, buy card, cut-in and win plaque are redone
together (Sumo Monkey's store art still showed the old thin-limbed figures after
the cast was redrawn). The provider logo file in `thumbnail/` is the studio's
logo, identical in every game: Turf War's `Silverstars-Logo.png` was the game's
own title for five weeks and was copied into three more games before anyone
looked (`preflight.py` compares it against the other games' copies).

**Not dark — thumbnail or cover.** Before staging, run

```bash
python3 wp/.claude/skills/game-reskin/scripts/check_thumbnail.py --upload upload/<Game>
```

It measures every `thumbnail/*-BG.png` and `cover/*-BG.png` at 200 px high and
FAILS on mean luma < 80 or > 30% of pixels below 32 (WARN under mean 100).
A dark upload is not rejected, it is silently rewritten: Turf War's first cover
(mean 18, a night plate pushed further toward black behind the cast) came back
"automatically lightened by 35%" (2026-10-11). Night-themed games still need a
bright backdrop here — lift the plate (gamma + pale haze, strongest behind the
cast) instead of darkening it; a lit backdrop also separates a dark figure
better than a black one.

## 7. Sanity checks on the staged package — these are the actual gate

```bash
cd upload
grep -c "<old game name>" <Game>/frontend/index.html            # must be 0
grep -oE "localhost:[0-9]+|stub\.local" <Game>/frontend/index.html  # must be empty
ls <Game>/frontend | grep -iE "stub|playtest"                    # must be empty
```

If any of these fail, the upload package still has playtest-only or
old-game-name contamination — it is not ready to upload.

Also confirm the staged build is the current one: staged later than the last
change to `src/`, to the assets AND to the shared `packages/` (Capo was staged
before a shared LabelWin fix and nobody noticed; Hard Time's rig fix waited
three days for a restage). `preflight.py` compares `build/index.html` with the
staged one and flags a `src/` newer than the build.

## 8. Zip — only when Stone asks for zips (`ship.sh --zip`)

The staged folder is the deliverable; uploading goes through stakecli, which
reads the folder. A zip made "just in case" goes stale and becomes a second,
wrong copy of the truth (Capo's zips were two weeks older than its staging).

```bash
cd upload
rm -f <Game>-frontend.zip <Game>-math.zip <Game>-upload.zip
zip -qr <Game>-frontend.zip <Game>/frontend
zip -qr <Game>-math.zip <Game>/math
zip -qr <Game>-upload.zip <Game>
```

`<Game>-upload.zip` is the combined one (frontend + math + thumbnail +
README) — check what the platform's actual submission flow expects before
assuming all three are needed; some flows want the combined zip only, others
want frontend/math separately.

## 9. Verify live, not just via file greps

Start the playtest server, open it with the RGS-stub query params it needs
(`?rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en`), and actually
look at the panels that changed — RTP figures in the rules modal, paytable
labels against their art, a spin through at least the mode that was just
retargeted. A rebuilt zip that was never opened is not verified.

## 10. Update the handoff doc as part of packaging, not after

Whatever running-log doc this game keeps (HANDOFF.md or equivalent) should
get its "last updated" line and a short section for whatever just changed —
written at packaging time, with the actual measured before/after numbers,
while they're still on screen. Reconstructing exact retarget numbers from a
`git diff` after the fact is much slower than writing two sentences now.
