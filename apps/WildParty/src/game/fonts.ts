import { setFontKit, setLocalFonts } from 'pixi-svelte';

// Wild Party's display face.
//
// The face this replaces is Cinzel, which did load — routes/+layout.svelte
// registers it through the FontFace API and blocks startup on it, because Pixi
// measures glyphs when it builds a Text and never consults CSS. Orbitron is now
// registered the same way.
//
// Two reasons for the swap:
//
// 1. Theme. Square, wide and geometric is the Y2K club idiom. Cinzel is a
//    classical Roman serif — about as far from the brief as a typeface gets.
// 2. app.html additionally loaded `https://use.typekit.net/aba0ebl.css`, the
//    Stake template's Adobe Typekit kit, left over from the template. That kit
//    is locked to the template's account, so on any other origin it 404s on
//    every load — a dead third-party request on the critical path, and the exact
//    trap the sibling Hot Miami app documents. It is gone.
//
// Certification also flags system fonts: a slot rendered in the fallback stack
// reads as operating-system UI, not as a game. Self-hosting keeps that from
// being one failed request away.
//
// Self-hosted (no third-party request to break) and SIL Open Font Licence, which
// permits commercial use and embedding — see static/fonts/Orbitron-OFL.txt. The
// file is the same one Hot Miami ships.
export const GAME_FONT = '"Orbitron", "Trebuchet MS", "Segoe UI", Tahoma, Arial, sans-serif';

// Orbitron is a variable font with a 400..900 axis, so a real bold is available
// rather than a browser-synthesised one (which smears the outline and fills in
// the counters on a face this geometric).
export const GAME_FONT_WEIGHT = '700' as const;

// Display weight for titles, win callouts and the free-spin plaques.
export const DISPLAY_FONT_WEIGHT = '900' as const;

// Body copy stays on a plain humanist stack. The rules and paytable modals carry
// real paragraphs — the RTP disclaimer, the feature descriptions — and Orbitron
// is a display face: set a paragraph in it and it becomes measurably harder to
// read. Two faces with clearly separated jobs.
export const BODY_FONT = '"Trebuchet MS", "Segoe UI", Tahoma, Arial, sans-serif';

// Removing the <link> from app.html was NOT enough to kill the Typekit request.
// packages/pixi-svelte defaults `fontKitId` to the template's own kit id
// ('aba0ebl') and loads it at runtime through WebFont, so the kit was still
// being fetched — and still failing — with no <link> anywhere in the app. That
// is where the stray proxima-nova and brandon-grotesque faces came from.
//
// Passing null skips the request entirely, which removes both the failed load
// and the "Web font load inactive" console error.
setFontKit(null);

// Block startup until Orbitron is actually resident. Pixi measures glyph
// advances when it builds a Text, so a face still downloading at that moment
// gets the first frame laid out on the fallback's metrics and is never
// re-measured. Module scope, so this runs before the application mounts.
setLocalFonts([`${GAME_FONT_WEIGHT} 16px "Orbitron"`, `${DISPLAY_FONT_WEIGHT} 16px "Orbitron"`]);
