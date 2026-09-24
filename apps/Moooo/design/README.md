# Moooo build gates

Seven checks: four copied from Hot Miami's `design/` on day one as the brief
asked, and three of Moooo's own. Each exists because something specific went wrong once.

| Gate | Catches | Why it exists |
| :-- | :-- | :-- |
| `check_undefined_refs.mjs` | a Svelte template using an identifier the script never declares | `Game.svelte` shipped `filters={backgroundBlur}` after a patch silently failed to insert the declaration. `vite build` and `svelte-check` both passed; the game died at runtime. |
| `check_assets_exist.mjs` | `new URL('../../assets/…')` pointing at a file that is not there | Vite does not fail the build for a missing asset — it defers the URL to runtime, so the build is green and the game 404s on load. |
| `check_sprite_keys.mjs` | `key="…"` naming something absent from `src/game/assets.ts` | Pixi logs `key "x" is not found in the loadedAssets` and draws nothing. A stale `gbH2` (a GoBananas key) meant every winning line animated with an invisible token. |
| `check_social_words.mjs` | gambling terms in social-facing copy | Certification came back three times — "pay", then "buy"/"cost", then "funds". The third lived in a shared package no game's build was looking at. |
| **`check_provenance.mjs`** | **anything that came from another game or another studio** | **New. See below.** |
| `check_volatility.py` | a buy menu whose volatility labels contradict the shipped maths | New. The menu tells the player which buy is the calmer ride — a claim about a distribution, not a piece of copy. It quietly stopped being the interesting claim the moment Super was repriced from 175x to 250x, so it is measured against the lookup tables instead of remembered. |
| `check_math_bundle.py` | an upload bundle whose books and lookup tables disagree | Stake rejected a publish with `ERR_MATH_OUTSIDE_RANGE`. The maths were fine; the bundle had been copied while `run.py` was still writing it, so two modes shipped the *previous* run's lookup tables. |

## Running them

```bash
node design/run_gates.mjs
```

Add the math bundle by passing its path. It needs `zstandard`, which lives in
the math-sdk environment rather than a bare `python3`:

```bash
PYTHON=/Applications/anaconda3/envs/math-sdk/bin/python node design/run_gates.mjs ../../../math-sdk/games/moooo/library/publish_files
```

The five `.mjs` gates belong in `package.json` as the `build` script once the app
is scaffolded — the exact line is in the header of `run_gates.mjs`. The math gate
does not: it checks an upload bundle rather than the source tree, so it belongs
immediately before the copy into `upload/Moooo/math`, which is the step that
went wrong.

While `wp/apps/Moooo/src` does not exist, the three gates that read it say so and
pass. They start checking the moment there is something to check.

## The provenance gate

The Hot Miami submission shipped third-party template assets to Stake for
months: a `MiningMayhem_by_KICK` spine, a `TWIST GAMES` path, an `SD2_Coin`
sheet. They arrived with the starter template, nothing looked at them, and they
are still in four sibling apps today. The actual leak in the spine was not the
filename — it was this, inside the JSON:

```
"audio": "D:/BigTech Media Dropbox/Kevin Tran/BigTech Media/WickedGames/
          Kick/0007_MiningMayhem_by_KICK/Assets/Animation/Anticipation/img"
```

Another studio's name, their employee's name and their Dropbox layout, published
on a live casino. A filename check would never have found it.

Five rules, cheapest and most certain first:

1. asset keys are inside this game's `moooo*` namespace
2. no path or filename carries a sibling-app or known-template marker
3. no text asset embeds an absolute filesystem path or a foreign studio name
4. no PNG carries `tEXt`/`iTXt`/`zTXt` metadata (authoring tools write these)
5. no file is **byte-identical** to a file in a sibling app

Rule 5 is the one that cannot be talked around. Renaming a copied asset defeats
every other check here and defeats a human reviewer; it does not defeat a hash.
It is the brief's instruction — *do not copy assets from WildParty / GoBananas /
HotMiami* — turned into something a machine can decide.

### It was verified by aiming it at the apps that have the bug

```bash
node design/check_provenance.mjs ../../MarginCall
```

finds all three known leaks, and one nobody had recorded — `/Users/a.drobysh/
Desktop/buy_buttom_animation` inside `spines/bonusButton/buy_button.json`.
Aimed at `../../HotMiami` it reports 15 files byte-identical to CrusherYard's.

**Neither of those is Moooo's problem to fix**, and this gate does not touch
them. They are here as evidence that the gate works on real contamination rather
than on a test fixture — a gate that has only ever passed has never been tested.
