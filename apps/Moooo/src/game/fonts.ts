import { setFontKit, setLocalFonts } from 'pixi-svelte';

// Moooo ships one self-hosted display face.
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
export const GAME_FONT = '"Titan One", "Trebuchet MS", "Segoe UI", Tahoma, Arial, sans-serif';

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

// The rules and paytable modals are DOM, not Pixi, so they take their type from
// CSS. Mirroring both stacks into custom properties lets components/ui/Modals
// apply them without keeping a second copy of the font lists in SCSS — the
// shared components still declare the template's dead 'proxima-nova', which
// resolves to whatever sans the browser defaults to.
if (typeof document !== 'undefined') {
	const root = document.documentElement.style;
	root.setProperty('--moo-display-font', GAME_FONT);
	root.setProperty('--moo-body-font', BODY_FONT);
	root.setProperty('--moo-title-font', DISPLAY_FONT);
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
	`${GAME_FONT_WEIGHT} 16px "Titan One"`,
	`${DISPLAY_FONT_WEIGHT} 16px "Orbitron"`,
	'400 16px "Saira"',
]);
