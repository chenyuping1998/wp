#!/bin/zsh
set -euo pipefail

generated=/Users/stone/.codex/generated_images/01a07518-43b2-7671-b251-b8b437e9ba6d
app=/Users/stone/stake-engine/wp/apps/TurfWar
upload=/Users/stone/stake-engine/upload/TurfWar

install_png() {
  local src=$1 dst=$2 width=$3 height=$4
  /usr/bin/sips --resampleHeightWidth "$height" "$width" "$src" --out "$dst" >/dev/null
}

install_png "$generated/exec-496da56a-e526-4b9b-9eed-22e526b57b75.png" "$app/static/assets/sprites/turfSymbols/h2.png" 512 512
install_png "$generated/exec-d5f360c3-866f-4553-8431-a7e9acd6bc79.png" "$app/static/assets/sprites/turfSymbols/h3.png" 512 512
install_png "$generated/exec-5f917c54-77c2-42e6-9458-fd0261bd04be.png" "$app/static/assets/sprites/turfSymbols/l1.png" 512 512
install_png "$generated/exec-e9992b71-c43b-441c-8b98-93440de8eb3c.png" "$app/static/assets/sprites/turfSymbols/l2.png" 512 512
install_png "$generated/exec-51aebb00-fbb9-485d-9e89-a286835781f2.png" "$app/static/assets/sprites/turfSymbols/l3.png" 512 512
install_png "$generated/exec-eeb9e34b-8176-4587-a167-310c803f6b3b.png" "$app/static/assets/sprites/turfSymbols/l4.png" 512 512
install_png "$generated/exec-11368421-a2d7-4b2b-9dfc-50b4afa23090.png" "$app/static/assets/sprites/turfFx/sw_locked.png" 256 1024

# Bright early-morning background replaces the rejected dark thumbnail layer.
install_png "$generated/exec-9fda7a4c-c7a3-42c1-a7a4-db3b61125fd4.png" "$app/static/assets/sprites/turfBrand/tile_background.png" 1024 1024
install_png "$generated/exec-9fda7a4c-c7a3-42c1-a7a4-db3b61125fd4.png" "$upload/thumbnail/TurfWar-BG.png" 1000 1000

/Applications/anaconda3/envs/math-sdk/bin/python "$app/design/postprocess_art_revision.py"

cp "$app/static/assets/sprites/turfBrand/tile_foreground.png" "$upload/thumbnail/TurfWar-FG.png"
cp "$app/static/assets/sprites/turfBrand/logo.png" "$upload/thumbnail/Silverstars-Logo.png"
