import { setFontKit, setLocalFonts } from 'pixi-svelte';

// Circus wood type, two faces, both self-hosted (no third-party font request to
// fail) and both free for commercial use and embedding:
//
//   TITLE_FONT  Rye (SIL OFL, static/fonts/Rye-OFL.txt) — a Tuscan/Western wood
//               type with spurred serifs, the lettering of a screenprinted
//               circus bill and the same family of letter as the logo. Words
//               only: FREE SPINS, TOTAL WIN, the win tier names, plaques, BUY
//               BONUS, headings.
//   GAME_FONT   Ultra (Apache 2.0, static/fonts/Ultra-LICENSE.txt) — a fat
//               Clarendon, the other poster wood type. It carries every number
//               (win amounts, the watch dials, the spin counter, the bar
//               readouts): its digits are plain, wide and open, which Rye's
//               ornamented ones are not at bar size.
//
// The fallbacks matter: the game ships many locales, and browsers resolve a font
// stack per character. Rye has no Turkish/Polish/Czech accents, so those letters
// drop to Ultra (same weight and slab); scripts neither face covers (CJK, Thai,
// Cyrillic, Greek…) drop through to the system faces behind them — never tofu.
const SYSTEM_STACK = '"Trebuchet MS", "Segoe UI", Tahoma, Arial, sans-serif';

const FACES = { title: 'Rye', number: 'Ultra' };

export const GAME_FONT = `"${FACES.number}", ${SYSTEM_STACK}`;
export const TITLE_FONT = `"${FACES.title}", "${FACES.number}", ${SYSTEM_STACK}`;

// The primary number face, for code that has to ask document.fonts whether the
// face is resident before caching a measurement.
export const NUMBER_FACE_NAME = FACES.number;

// Both faces are single-weight. Asking for 700 makes the browser synthesise a
// bold by smearing the outline, which on faces this heavy turns counters to
// mud — so anything using GAME_FONT or TITLE_FONT must request 400.
export const GAME_FONT_WEIGHT = '400' as const;

// The rules and paytable modals carry real paragraphs, and a wood-type face is
// measurably harder to read at paragraph length, so body copy keeps a plain
// humanist stack.
export const BODY_FONT = SYSTEM_STACK;

// The modals are DOM, not Pixi, so they take their type from CSS. Mirroring the
// stacks into custom properties lets components/ui/Modals apply them without a
// second copy of the font lists in SCSS.
if (typeof document !== 'undefined') {
	const root = document.documentElement.style;
	root.setProperty('--gb-display-font', GAME_FONT);
	root.setProperty('--gb-title-font', TITLE_FONT);
	root.setProperty('--gb-body-font', BODY_FONT);
}

// Skip the template's Typekit request: nothing here needs it.
setFontKit(null);

// Block startup until both faces are resident. Pixi measures glyph advances when
// it builds a Text, so a face still downloading at that moment lays the first
// frame out on the fallback's metrics and never re-measures.
setLocalFonts([
	`${GAME_FONT_WEIGHT} 16px "${FACES.number}"`,
	`${GAME_FONT_WEIGHT} 16px "${FACES.title}"`,
	// the bet bar (MummyBar, bar v3): the weights it actually draws, so each is resident
	'600 16px "Nunito"',
	'700 16px "Nunito"',
	'800 16px "Nunito"',
	'900 16px "Nunito"',
]);

// The bet bar's face (bar v3, after Mummy Mayhem): a heavy rounded sans. Nunito
// is SIL OFL (static/fonts/Nunito-OFL.txt), self-hosted like the two above.
export const BAR_FONT = '"Nunito", "Arial Rounded MT Bold", "Segoe UI", Arial, sans-serif';
