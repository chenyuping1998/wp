export type ComicPopKind = 'collect' | 'trigger' | 'levelUp';
export type ComicPopShape = 'bubble' | 'brush' | 'notes';

// Strike Monkey: a bouncing show card with a note either side, swaying on the
// beat (STRIKE_美術需求單.md §0 音符與動作線).
export const COMIC_POP = {
	shape: 'notes' as ComicPopShape,
	words: {
		collect: ['CRASH!', 'CLACK!', 'KA-POW!'],
		trigger: ['ROLL OUT!'],
		levelUp: ['STRIKE!', 'SPARE!'],
	} satisfies Record<ComicPopKind, string[]>,
	fill: 0xfff4de, // film cream
	ink: 0x14262e,
	accent: 0xe8502e, // record red notes
	text: 0xe8502e,
	textStroke: 0x14262e,
	fontSize: 50,
	charWidth: 0.67, // Bowlby One, measured on these words
};
