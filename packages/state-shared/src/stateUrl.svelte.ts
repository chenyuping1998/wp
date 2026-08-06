import { locales } from 'config-lingui';
import { page } from '$app/state';

export type Language = (typeof locales)[number];

export type Key =
	// keys for play
	| 'sessionID'
	| 'rgs_url'
	| 'lang'
	| 'currency'
	| 'device'
	| 'social'
	| 'demo'
	// keys for replay 
	| 'replay'
	| 'amount'
	| 'game'
	| 'mode'
	| 'version'
	| 'event'
	;

const getUrlSearchParam = (key: Key) => page.url.searchParams.get(key) as string;

// params for play
const social = () => getUrlSearchParam('social') === 'true';

const lang = (): Language => {
	// Social play is English-only, whatever the host asks for.
	if (social()) return 'en';

	const raw = getUrlSearchParam('lang');
	// 'br' is Stake's code for Brazilian Portuguese; lingui calls it 'pt'
	const requested = raw === 'br' ? 'pt' : raw;

	// Anything not in the catalogue falls back to English rather than being cast
	// through. An unrecognised code used to be returned as-is, and everything
	// downstream trusted it: messagesMap[code] is undefined, which lingui then
	// activates as a locale with no messages, and any Intl call made with it can
	// throw outright. A bad ?lang= is a typo, not a reason to break the game.
	return (locales as readonly string[]).includes(requested) ? (requested as Language) : 'en';
};

const sessionID = () => getUrlSearchParam('sessionID') || '';
const rgsUrl = () => getUrlSearchParam('rgs_url') || '';

// Only replay needs this. In normal play the currency comes back from
// authenticate, which is authoritative; a replay never authenticates, so without
// the URL value every amount on screen would be formatted as USD.
const currency = () => getUrlSearchParam('currency') || '';

// params for replay
const replay = () => getUrlSearchParam('replay') === 'true';
const amount = () => Number(getUrlSearchParam('amount')) || 0;
const game = () => getUrlSearchParam('game') || '';
const version = () => getUrlSearchParam('version') || '';
const mode = () => getUrlSearchParam('mode') || '';
const event = () => getUrlSearchParam('event') || '';

export const stateUrlDerived = {
	// states for play
	lang,
	sessionID,
	rgsUrl,
	social,
	// states for replay
	replay,
	amount,
	currency,
	game,
	mode,
	version,
	event,
};
