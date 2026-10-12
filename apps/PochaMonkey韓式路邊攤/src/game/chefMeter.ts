import config from './config';

const LABELS: Record<string, string> = { L5: '10', L4: 'J', L3: 'Q' };

export const removedSymbolsAtLevel = (level: number): string[] =>
	config.banditMeter.replacements.slice(0, level);

export const removedLabelsAtLevel = (level: number): string =>
	removedSymbolsAtLevel(level).map((symbol) => LABELS[symbol] ?? symbol).join(' / ');

export const removedLabelAtLevel = (level: number): string => {
	const symbol = config.banditMeter.replacements[level - 1];
	return LABELS[symbol] ?? symbol ?? '';
};
