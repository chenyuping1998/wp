# Fangtastic Night × Alchemy engine visual test

This is an independent skin and animation comparison build. It copies the GoBanalchemy frontend engine and uses Fangtastic Night study artwork for the courtyard, reel symbols, reel frame palette, UI palette, and vampire mascot. The Alchemy reel spin timing and state machine remain in place.

## Run

From this folder: `npm run dev` (port 3022). For the static upload package use `build/` or the matching ZIP in `E:\stake\deliverables`.

## Scope

- The reel grid, rounds, features, math and RGS calls are still Alchemy's 5×4 implementation. This build compares visual motion and rendering performance only.
- Alchemy's feature art and sound atlas remain in some feature and modal flows. The Fangtastic symbol wins use the common sprite win animation, since Alchemy's deformed mesh animations are tied to its original symbol paintings.
- `design/make_fang_skin.py` regenerates the Fangtastic art from `../FangtasticNight測試/static/assets`. Rebuild with `npm run build` after regenerating.
