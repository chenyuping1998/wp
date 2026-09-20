import { setFontKit, setLocalFonts } from 'pixi-svelte';

// Hot Miami ships one self-hosted display face.
//
// History: the Stake template pulled `proxima-nova` from Adobe Typekit via a
// <link> in app.html. That kit is locked to the template's account, so on any
// other origin it 404s and every Text silently fell back to Arial. The first fix
// was to drop webfonts altogether and run on the system stack — which removed
// the 404, but certification then flagged "standard fonts", correctly: a slot
// rendered in Trebuchet/Segoe reads as operating-system UI, not as a game.
//
// Titan One is the answer to both. It is self-hosted (no third-party request to
// break), SIL Open Font Licence (commercial use and embedding permitted, see
// static/fonts/TitanOne-OFL.txt), and its heavy rounded forms are the display
// idiom players expect from a slot. Chosen over the other candidates because its
// digits stay legible at bet-bar size and fit inside the 603x135 brass readout
// plate without crowding — see design/font_candidates.png and font_incontext.png
// for the comparison this was picked from.
export const GAME_FONT = '"Saira", "Arial Narrow", Arial, sans-serif';

// Titan One does the numeric work, but it is a rounded bubble face — the same
// file the sibling GoBananas app ships — and this game is 80s Miami, whose type
// idiom is square, wide and geometric. Orbitron is that idiom, and is also
// self-hosted and SIL OFL (see static/fonts/Orbitron-OFL.txt).
//
// It is deliberately NOT the whole game's face. Titan One was picked because its
// digits stay legible in the bet bar (see the note above), and Orbitron's
// geometric figures are narrower and harder to read at that size. So: Orbitron
// for display — titles, the free-spin plaques, big-win callouts — and Titan One
// everywhere a number has to be read at a glance.
export const DISPLAY_FONT = '"Orbitron", "Titan One", "Trebuchet MS", Arial, sans-serif';

// Orbitron ships as a variable font with a 400..900 weight axis, so unlike
// Titan One a real bold is available rather than a synthesised one.
export const DISPLAY_FONT_WEIGHT = '800' as const;

// Titan One is a single-weight family. Asking for 700 makes the browser
// synthesise a bold by smearing the outline, which on a face this heavy just
// turns counters to mud — so anything using GAME_FONT must request 400.
export const GAME_FONT_WEIGHT = '400' as const;

// Display faces are for display. The rules and paytable modals carry real
// paragraphs — the RTP disclaimer, the feature descriptions — and setting body
// copy in a heavy rounded face makes it genuinely harder to read. Two faces with
// clearly separated jobs is the normal arrangement, not a compromise.
//
// But "not a display face" was being read as "no webfont": this stack used to
// start at "Trebuchet MS" and every paragraph in the game rendered in the
// operating system's default sans. That is the same "standard fonts" finding
// recorded at the top of this file, still live — the fix that followed it only
// replaced the display face, and the body text it did not touch is the larger
// share of the words on screen.
//
// Saira is self-hosted, SIL OFL, variable 300..700, and drawn for running text.
// The system stack stays behind it as the fallback it always should have been.
// Declared in app.html; licence in static/fonts/Saira-OFL.txt.
export const BODY_FONT = '"Saira", "Trebuchet MS", "Segoe UI", Tahoma, Arial, sans-serif';

/**
 * TITLE_FONT — the face for WORDS on plaques, banners and splashes.
 *
 * The rule this game now follows: **letters follow the art, digits follow
 * legibility.**
 *
 * Every piece of lettering drawn into the artwork — the FREE SPINS plaque, the
 * SOLDIER / CAPO / THE DON wordmarks, the five win banners, the logo — is Art
 * Deco inscriptional capitals. Runtime titles were being set in Titan One
 * (rounded, bubble) or Orbitron (square, techno), so every screen carrying both
 * had two unrelated alphabets on it. On the free-spin plaque they did not just
 * sit side by side, they overlapped.
 *
 * Cinzel is cut from classical Roman inscriptions and belongs to the same
 * register as those drawn capitals. Self-hosted, variable 400..900, SIL OFL
 * (static/fonts/Cinzel-OFL.txt); declared in app.html.
 *
 * NUMBERS stay on DISPLAY_FONT. A Roman serif's figures are narrower and lose
 * at the sizes the bet bar and the frame multipliers are read at, and a value
 * the player has to read is not the place to spend legibility on unity.
 */
export const TITLE_FONT = '"Saira", "Arial Narrow", Arial, sans-serif';
export const TITLE_FONT_WEIGHT = 700;

/**
 * BAR_LABEL_FONT / BAR_VALUE_FONT — the bet bar, split the same way.
 *
 * ART_BRIEF §9.5 used to record GAME_FONT (Titan One) as "僅剩共用套件的下 bar
 * 標籤（平台 chrome，刻意維持中性）" — the one place deliberately left on the
 * shared package's neutral face, on the reasoning that the platform chrome skin
 * wants to be game-agnostic. That exception is withdrawn: the bar is the strip a
 * player looks at on every spin, and leaving it in a rounded bubble face while
 * every plaque, banner and modal heading in the game is Roman inscriptional
 * capitals is two alphabets on one screen — the exact defect Cinzel was brought
 * in to fix everywhere else.
 *
 * The bar gets the same rule as the rest of the game rather than a third answer:
 *
 *   BALANCE / WIN / BET, BUY BONUS, the menu captions   words  -> Cinzel
 *   $1,000.00, $0.00, $1.00, the autoplay counter       digits -> Orbitron
 *
 * Two constants rather than reusing TITLE_FONT/DISPLAY_FONT directly so the bar
 * can be retuned (weight, fallback order) without moving the plaques with it —
 * they are read at very different sizes.
 *
 * Weight: Cinzel is variable 400..900 and 400 is a thin engraved face that
 * disappears at caption size against a dark plate, so the captions take 700, the
 * same weight as the drawn lettering they now match. Orbitron takes 700 rather
 * than DISPLAY_FONT_WEIGHT's 800 — the frame multipliers are read at a glance
 * mid-spin and want the heaviest cut available, a balance figure is read at rest
 * and 800 turns its counters to slabs at bet-bar size.
 *
 * To revert the bar to the neutral face: point these two at GAME_FONT /
 * GAME_FONT_WEIGHT. Nothing else has to change — game/uiTheme.ts reads only
 * these four names.
 */
export const BAR_LABEL_FONT = TITLE_FONT;
export const BAR_LABEL_FONT_WEIGHT = '700' as const;
export const BAR_VALUE_FONT = DISPLAY_FONT;
export const BAR_VALUE_FONT_WEIGHT = '700' as const;

// The rules and paytable modals are DOM, not Pixi, so they take their type from
// CSS. Mirroring both stacks into custom properties lets components/ui/Modals
// apply them without keeping a second copy of the font lists in SCSS — the
// shared components still declare the template's dead 'proxima-nova', which
// resolves to whatever sans the browser defaults to.
if (typeof document !== 'undefined') {
	const root = document.documentElement.style;
	root.setProperty('--gb-display-font', GAME_FONT);
	root.setProperty('--gb-body-font', BODY_FONT);
	root.setProperty('--hm-title-font', TITLE_FONT);
	root.setProperty('--hm-number-font', DISPLAY_FONT);
}

// Skip the template's Typekit request: nothing here needs it, and it removes
// both the 404 and the "Web font load inactive" console error.
setFontKit(null);

// Block startup until Titan One is actually resident. Pixi measures glyph
// advances when it builds a Text, so a face still downloading at that moment
// gets the first frame laid out on the fallback's metrics and never re-measured.
// Module scope, so this runs well before InitialiseApplication mounts.
// Saira is in this list for the same reason as the other two: LoadingScreen sets
// its subtitle and its rotating tips in BODY_FONT, and those are pixi Texts.
setLocalFonts([
	`${DISPLAY_FONT_WEIGHT} 16px "Orbitron"`,
	'400 16px "Saira"',
	'700 16px "Saira"',
]);
