import { setContextEventEmitter, getContextEventEmitter } from 'utils-event-emitter';
import { setContextXstate, getContextXstate } from 'utils-xstate';
import { setContextLayout, getContextLayout } from 'utils-layout';
import { setContextApp, getContextApp } from 'pixi-svelte';
import { stateMeta } from 'state-shared';

import { eventEmitter, type EmitterEvent } from './eventEmitter';
import { stateXstate, stateXstateDerived } from './stateXstate';
import { stateLayout, stateLayoutDerived } from './stateLayout';
import { stateApp } from './stateApp';

import { stateGame, stateGameDerived } from './stateGame.svelte';
import { MOOOO_BET_MODE_META } from './betModeMeta';
import { i18nDerived } from '../i18n/i18nDerived';

export const setContext = () => {
	setContextEventEmitter<EmitterEvent>({ eventEmitter });
	setContextXstate({ stateXstate, stateXstateDerived });
	setContextLayout({ stateLayout, stateLayoutDerived });
	setContextApp({ stateApp });

	// Restrict the buy screen to the modes the Moooo math supports (base plus the
	// two feature buys); otherwise the shared template defaults expose extra
	// unplayable buy options.
	stateMeta.betModeMeta = MOOOO_BET_MODE_META;

	// Blank the shared game-rule metadata.
	//
	// `stateMeta.gameRuleMeta` defaults to DEFAULT_GAME_RULE_META in
	// packages/state-shared, and that default is TEMPLATE CONTENT: rules for a
	// game Moooo is not, illustrated with
	//
	//     https://staging-1-0.twist-game.app/_app/immutable/assets/wild.<hash>.png
	//
	// — the template vendor's own staging server. Left alone, Moooo boots and
	// immediately makes three requests to a third party's host for artwork that
	// is not ours and no longer exists, which is how they showed up as 404s in
	// the console the first time this app ran.
	//
	// Moooo draws its own rules and paytable (components/ui/ModalGameRules.svelte
	// and ModalPayTable.svelte), so nothing reads this — but "nothing reads it"
	// is exactly the state the third-party spine was in when it shipped to Stake
	// for months. What ships is what a reviewer can open, so it is emptied here
	// rather than merely ignored.
	//
	// Fixed app-side, not in packages/: the shared default is five other games'
	// behaviour too, and the standing rule is that packages changes default to
	// the old behaviour. Those apps still carry this. See moooo_STATE.md.
	stateMeta.gameRuleMeta = { gameRules: [], payTable: [], splashScreen: [] };
};

export const getContext = () => ({
	...getContextEventEmitter<EmitterEvent>(),
	...getContextLayout(),
	...getContextXstate(),
	...getContextApp(),
	stateGame,
	stateGameDerived,
	i18nDerived,
});
