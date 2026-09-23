# Packaging: the repeatable pipeline

Every math change, however small, invalidates the frontend's compiled config,
the playtest stub, and every downstream zip. This sequence ran identically
five separate times shipping Capo Nostra's math retargets in one session —
worth writing as a script per-game (`design/ship.sh` or similar) on the FIRST
pass rather than retyping it each time. Paths below are the pattern; adjust
the game/app names.

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
on a full library — background it.

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

## 7. Sanity checks BEFORE zipping — these are the actual gate, not the zip step

```bash
cd upload
grep -c "<old game name>" <Game>/frontend/index.html            # must be 0
grep -oE "localhost:[0-9]+|stub\.local" <Game>/frontend/index.html  # must be empty
ls <Game>/frontend | grep -iE "stub|playtest"                    # must be empty
```

If any of these fail, the upload package still has playtest-only or
old-game-name contamination — do not zip until they're clean.

## 8. Zip

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
