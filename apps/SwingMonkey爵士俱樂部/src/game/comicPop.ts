export type ComicPopKind = 'collect' | 'trigger' | 'levelUp';
export type ComicPopShape = 'bubble' | 'brush' | 'notes';

// Swing Monkey: a bouncing show card with a note either side, swaying on the
// beat (SWING_美術需求單.md §0 音符與動作線).
export const COMIC_POP = {
	shape: 'notes' as ComicPopShape,
	words: {
		collect: ['SCAT!', 'BOP!', 'DOO-WOP!'],
		trigger: ['SHOWTIME!'],
		levelUp: ['SWING IT!', 'HOT!'],
	} satisfies Record<ComicPopKind, string[]>,
	fill: 0xf8f1e0, // film cream
	ink: 0x161412,
	accent: 0xd9342b, // record red notes
	text: 0xd9342b,
	textStroke: 0x161412,
	fontSize: 50,
	charWidth: 0.66, // Shrikhand is fat
};
