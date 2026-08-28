import { setFontKit, setLocalFonts } from 'pixi-svelte';

import { isCoveredByDisplayFont } from './fontCoverage';

// Soul Seal ships one self-hosted display face.
//
// History: the Stake template pulled `proxima-nova` from Adobe Typekit via a
// <link> in app.html. That kit is locked to the template's account, so on any
// other origin it 404s and every Text silently fell back to Arial. The first fix
// was to drop webfonts altogether and run on the system stack — which removed
// the 404, but certification then flagged "standard fonts", correctly: a slot
// rendered in Trebuchet/Segoe reads as operating-system UI, not as a game.
//
// Cinzel answers both, and matches this game specifically. It is self-hosted (no
// third-party request to break) and SIL Open Font Licence — commercial use and
// embedding permitted, see static/fonts/OFL-Cinzel.txt.
//
// Chosen because the SYMBOLS decide it. The low symbols are A K Q J 10 drawn as
// carved gold Roman letterforms, and Cinzel is inscriptional Roman capitals — the
// UI is then set in the same alphabet the board is showing, rather than beside
// it. The scaffold arrived on a heavy rounded arcade face; against
// ornate gold artwork it read as a different game's interface bolted on.
//
// Two candidates were tried and rejected first: the repo's own font generator
// (EmberForge / CrusherYard use it) builds glyphs from straight segments only, so
// O, S, C and G come out faceted and no amount of parameter tuning makes it a
// serif; and WildParty's copy of Cinzel is woff2, which design/check_font_coverage
// cannot parse — it reads a raw SFNT cmap.
export const GAME_FONT = '"Cinzel", "Times New Roman", Georgia, serif';

// Cinzel is a VARIABLE font with a 400–900 weight axis, so 700 is a real
// instance rather than a synthesised bold. Display text wants the weight: at
// bet-bar size the 400 master is too fine to hold against the gold artwork.
export const GAME_FONT_WEIGHT = '700' as const;

/**
 * The face to set a given string in.
 *
 * Anything drawn from the localised tables (game/i18nText) has to go through
 * this rather than naming GAME_FONT directly. Cinzel covers Latin through Latin
 * Extended-A; seven of Stake's sixteen locales contain characters it cannot draw
 * (Cyrillic, CJK, Arabic, Devanagari, Vietnamese), and the browser resolves those
 * per glyph - which sets one word in two faces. Falling
 * the whole string back to the body stack is not as pretty as the display face,
 * but it is one typeface instead of two, which is the difference between "a
 * plainer font" and "broken".
 *
 * Fixed English copy (titles, "MAX WIN") can keep GAME_FONT directly; it is
 * covered by definition.
 */
export const displayFontFor = (text: string): string =>
	isCoveredByDisplayFont(text) ? GAME_FONT : BODY_FONT;

/**
 * Weight to pair with `displayFontFor`. Both sides want 700 now that the display
 * face has a real bold - kept as a function because the two used to differ and
 * every caller already routes through it.
 */
export const displayWeightFor = (text: string): '400' | '700' =>
	isCoveredByDisplayFont(text) ? GAME_FONT_WEIGHT : '700';

// Display faces are for display. The rules and paytable modals carry real
// paragraphs — the RTP disclaimer, the feature descriptions — and setting body
// copy in a heavy rounded face makes it genuinely harder to read. Those keep a
// plain humanist stack. Two faces with clearly separated jobs is the normal
// arrangement, not a compromise.
export const BODY_FONT = '"Trebuchet MS", "Segoe UI", Tahoma, Arial, sans-serif';

// The rules and paytable modals are DOM, not Pixi, so they take their type from
// CSS. Mirroring both stacks into custom properties lets components/ui/Modals
// apply them without keeping a second copy of the font lists in SCSS — the
// shared components still declare the template's dead 'proxima-nova', which
// resolves to whatever sans the browser defaults to.
if (typeof document !== 'undefined') {
	const root = document.documentElement.style;
	root.setProperty('--gb-display-font', GAME_FONT);
	root.setProperty('--gb-body-font', BODY_FONT);
}

// Skip the template's Typekit request: nothing here needs it, and it removes
// both the 404 and the "Web font load inactive" console error.
setFontKit(null);

// Block startup until the display face is actually resident. Pixi measures glyph
// advances when it builds a Text, so a face still downloading at that moment
// gets the first frame laid out on the fallback's metrics and never re-measured.
// Module scope, so this runs well before InitialiseApplication mounts.
setLocalFonts([`${GAME_FONT_WEIGHT} 16px "Cinzel"`]);
