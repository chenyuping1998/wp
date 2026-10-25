import { setFontKit, setLocalFonts } from 'pixi-svelte';

// One self-hosted display face: Titan One, SIL Open Font Licence (commercial use
// and embedding permitted, see static/fonts/TitanOne-OFL.txt). Self-hosting
// means there is no third-party request to break, and a rounded heavy face suits
// the sitcom-cartoon art direction while keeping digits legible at bet-bar size.
//
// The fallbacks matter: the game ships many locales, and browsers resolve a font
// stack per character, so scripts Titan One does not cover drop through to the
// system faces behind it.
export const GAME_FONT = '"Titan One", "Trebuchet MS", "Segoe UI", Tahoma, Arial, sans-serif';

// Large lettering (loading prompt, free-game plaques) uses the same face. Kept as
// its own name so a dedicated title face can be dropped in without touching
// every caller.
export const TITLE_FONT = GAME_FONT;

// Titan One is a single-weight family. Asking for 700 makes the browser
// synthesise a bold by smearing the outline, which on a face this heavy turns
// counters to mud — so anything using GAME_FONT must request 400.
export const GAME_FONT_WEIGHT = '400' as const;

// The rules and paytable modals carry real paragraphs, and a heavy rounded face
// is measurably harder to read at paragraph length, so body copy keeps a plain
// humanist stack.
export const BODY_FONT = '"Trebuchet MS", "Segoe UI", Tahoma, Arial, sans-serif';

// The modals are DOM, not Pixi, so they take their type from CSS. Mirroring both
// stacks into custom properties lets components/ui/Modals apply them without a
// second copy of the font lists in SCSS.
if (typeof document !== 'undefined') {
	const root = document.documentElement.style;
	root.setProperty('--gb-display-font', GAME_FONT);
	root.setProperty('--gb-body-font', BODY_FONT);
}

// Skip the template's Typekit request: nothing here needs it.
setFontKit(null);

// Block startup until the face is resident. Pixi measures glyph advances when it
// builds a Text, so a face still downloading at that moment lays the first frame
// out on the fallback's metrics and never re-measures.
setLocalFonts([`${GAME_FONT_WEIGHT} 16px "Titan One"`]);
