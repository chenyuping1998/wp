export type ComicPopKind = 'collect' | 'trigger' | 'levelUp';
export type ComicPopShape = 'bubble' | 'brush' | 'notes';

// Pocha Monkey: variety-show caption cards (POCHA_美術需求單.md §0 漫符與擬聲).
// Hangul is set in Black Han Sans, which covers it. Words are decoration only:
// check_social_words still scans this file's folder, keep them clear of it.
export const COMIC_POP = {
	shape: 'bubble' as ComicPopShape,
	words: {
		collect: ['짠!', '와!', 'YUM!', '대박!'],
		trigger: ['대박!!', 'LATE NIGHT!'],
		levelUp: ['변신!', 'MORE!'],
	} satisfies Record<ComicPopKind, string[]>,
	fill: 0xfff8ec, // cream card
	ink: 0x231a2b,
	accent: 0x2bb5a0, // mint edge strip
	text: 0xff7a1a, // tent orange
	textStroke: 0x231a2b,
	fontSize: 52,
	charWidth: 0.72, // Black Han Sans runs wide; Hangul is near-square
};
