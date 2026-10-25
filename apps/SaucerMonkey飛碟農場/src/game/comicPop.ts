export type ComicPopKind = 'collect' | 'trigger' | 'levelUp';
export type ComicPopShape = 'bubble' | 'brush' | 'notes';

// Saucer Monkey: a B-movie caption card bouncing on the beam
// (SAUCER_動畫需求單.md §4).
export const COMIC_POP = {
	shape: 'notes' as ComicPopShape,
	words: {
		collect: ['MOO!', 'WHOOSH!', 'ZAP!'],
		trigger: ['INCOMING!'],
		levelUp: ['KA-BLAM!', 'BLEEP!'],
	} satisfies Record<ComicPopKind, string[]>,
	fill: 0xf6f0dc, // film cream
	ink: 0x141a33,
	accent: 0xe8433a, // record red notes
	text: 0xe8433a,
	textStroke: 0x141a33,
	fontSize: 50,
	charWidth: 0.67, // Bowlby One, measured on these words
};
