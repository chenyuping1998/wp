export type ComicPopKind = 'collect' | 'trigger' | 'levelUp';
export type ComicPopShape = 'bubble' | 'brush' | 'notes';

// Mardi Monkey: a bouncing show card with a note either side, swaying on the
// beat (MARDI_美術需求單.md §0 音符與動作線).
export const COMIC_POP = {
	shape: 'notes' as ComicPopShape,
	words: {
		collect: ['CATCH!', 'WOO!', 'BEADS!'],
		trigger: ['PARADE!'],
		levelUp: ['STRUT IT!', 'HOORAY!'],
	} satisfies Record<ComicPopKind, string[]>,
	fill: 0xfff3e0, // film cream
	ink: 0x1e1030,
	accent: 0xa83fd6, // record red notes
	text: 0xa83fd6,
	textStroke: 0x1e1030,
	fontSize: 50,
	charWidth: 0.62, // Fascinate, measured on these words
};
