import { setFontKit } from 'pixi-svelte';

// GoBananas ships no webfont on purpose.
//
// The Stake template pulled `proxima-nova` from Adobe Typekit via a <link> in
// app.html. That kit is locked to the template's account, so on any other origin
// it 404s and every Text silently falls back to Arial — the game looked fine in
// the template repo and wrong everywhere else. Rather than swap one hosted font
// for another (same failure mode, plus a licence to track), everything renders
// on fonts the OS already has.
//
// Trebuchet leads the stack: humanist, slightly rugged, and wide enough at
// weight 700 to hold up as slot display type. Segoe UI / Tahoma cover Windows
// fallbacks, Arial the rest.
export const GAME_FONT = '"Trebuchet MS", "Segoe UI", Tahoma, Arial, sans-serif';

// pixi-svelte preloads the template's Typekit kit before the first frame unless
// told otherwise. Nothing here needs it, so skip the request — that removes both
// the 404 and the "Web font load inactive" error from the console. Module-scope
// so it runs well before InitialiseApplication mounts.
setFontKit(null);
