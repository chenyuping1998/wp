# Sushi Monkey → Jade Teahouse visual coverage

> Historical Jade Teahouse template audit. This app has since received its own theme art and audio. See `../HANDOFF.md` and `../../../tools/THREE_THEME_DELIVERY.md` for the current delivery.

Checked against `wp/apps/SushiMonkey` on 2026-10-09. The two `assets.ts` manifests contain the same 109 sprite/Spine keys. All 172 Jade asset paths resolve. Of 162 referenced asset files, 154 differ from Sushi Monkey. The eight identical files are five neutral FX masks (`glow`, `leaf`, `star`, `streak`, `vignette`), the generic menu icon, audio metadata, and the win-plate atlas metadata; the atlas image itself is recolored.

| Sushi Monkey visual/animation location | Jade Teahouse counterpart |
| --- | --- |
| Loading sign, progress, three feature cards, continue | Hand-inked bilingual teahouse sign, jade/gold bar, three hanging bamboo-scroll cards with the source's gentle sway; existing reveal/continue transitions remain |
| Base and feature backgrounds, scene parallax | Pale manga teahouse and lantern-lit feature scene, retaining parallax |
| Board frame, reel cells, symbol backings | Celadon frame, paper/tea backing and tea symbols; five low-rank cards have distinct trim, and Q uses a centred short-tail glyph in every state |
| High symbols, scatters and wild | Separate cleaned teapot, gaiwan and tray art; lantern, cup and Tea Master medallion; win motion remains |
| Tea Master and Apprentice acting | Both new Spine atlases, with all nine original named animations: `idle`, `cheer`, `chestbeat`, `nod`, `throwit`, `flinch`, `alert`, `glance`, `flutter` |
| Collect, multiplier meter, trigger cut-in | Jade Cup collect art, tea-master cut-in, paper meter and original timing/effects |
| Door/shutter transition, free-spin intro and outro | Tea lattice door, paper panels and title plaques, preserving cover/swap timing |
| Win count, five big-win tiers and particles | Jade/gold numeral set, text-free tier plaques, tea-leaf/confetti particles and rays; count-up and tier animation remain |
| UI bar, Buy Bonus and toggles | Pale teahouse UI, enlarged hanging bamboo Buy Bonus plate with a matching hit area and lit hover state; auto arrowhead enlarged and the active Turbo/Auto disc filled in gold |

The source cast cut composite was checked after the knee-seam change; both lower legs meet the trousers cleanly. The thigh cloth layers now use rigid region attachments, which stops separate cloth-mesh warping at the knee while keeping the original bone animation. The generated Spine JSON/atlases include all nine animations for both characters.

Verification: `check_assets.mjs`, `check_audio.mjs`, `check_undefined_refs.mjs`, `check_social_words.mjs`, `check_types.mjs` (15 errors, below recorded baseline), `check_mesh_wins.mjs`, and the SvelteKit production build passed. This is a source/asset/build audit; no extra test entry was added.
