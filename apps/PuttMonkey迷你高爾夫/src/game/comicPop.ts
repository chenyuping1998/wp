export type ComicPopKind = 'collect' | 'trigger' | 'levelUp';
export type ComicPopShape = 'bubble' | 'brush' | 'notes';

// Putt Monkey: a bouncing course sign
// (PUTT_動畫需求單.md §4).
export const COMIC_POP = {
	shape: 'notes' as ComicPopShape,
	words: {
		collect: ['PLINK!', 'PLOP!', 'SINK IT!'],
		trigger: ['TEE TIME!'],
		levelUp: ['KABOOM!', 'FORE!'],
	} satisfies Record<ComicPopKind, string[]>,
	fill: 0xfff6df, // film cream
	ink: 0x1b2a22,
	accent: 0xe5432f, // record red notes
	text: 0xe5432f,
	textStroke: 0x1b2a22,
	fontSize: 50,
	charWidth: 0.67, // Bowlby One, measured on these words
};
