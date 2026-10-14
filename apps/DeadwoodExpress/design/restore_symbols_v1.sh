#!/bin/sh
# Put the v1 symbol art (the set submitted in rounds 1 and 2) back into the game,
# and switch the pay-table names to match it. Run from anywhere:
#   sh wp/apps/DeadwoodExpress/design/restore_symbols_v1.sh
# Then rebuild (pnpm --dir wp/apps/DeadwoodExpress build), re-stage index.html +
# _app/immutable, and re-export the 512px upload copies:
#   node wp/apps/DeadwoodExpress/design/export_upload_art.mjs <tmp>/deadwood <tmp>/thumb
#   then copy <tmp>/deadwood/symbol_*.png into upload/DeadwoodExpress/frontend/assets/deadwood/
set -e
APP="$(cd "$(dirname "$0")/.." && pwd)"
cp "$APP"/design/_backup_symbols_v1/symbol_*.png "$APP"/static/assets/deadwood/
sed -i '' "s/^export const SYMBOL_SET: 'v1' | 'v2' = '[a-z0-9]*';/export const SYMBOL_SET: 'v1' | 'v2' = 'v1';/" "$APP"/src/game/symbolSet.ts
grep -q "= 'v1';" "$APP"/src/game/symbolSet.ts
for f in "$APP"/design/_backup_symbols_v1/symbol_*.png; do
  cmp -s "$f" "$APP/static/assets/deadwood/$(basename "$f")" || { echo "restore failed: $(basename "$f")"; exit 1; }
done
echo "v1 symbols restored (11 files) and SYMBOL_SET = 'v1'."
echo "Next: rebuild, re-stage, and re-export symbols with design/export_upload_art.mjs."
