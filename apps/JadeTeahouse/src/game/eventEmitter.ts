import { createEventEmitter } from 'utils-event-emitter';
import type { EmitterEventHotKey } from 'components-shared';
import type { EmitterEventUi } from 'components-ui-pixi';
import type { EmitterEventModal } from 'components-ui-html';

import type { EmitterEventGame } from './typesEmitterEvent';

export type EmitterEvent =
	| EmitterEventHotKey
	| EmitterEventUi
	| EmitterEventModal
	| EmitterEventGame;

export const { eventEmitter } = createEventEmitter<EmitterEvent>();

// ?flowlog: record every broadcast with a timestamp in window.__flow, to time
// a round's phases in the play shell. Off unless the query asks for it.
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('flowlog')) {
	const log: { t: number; type: string }[] = ((window as unknown as { __flow: typeof log }).__flow = []);
	const original = eventEmitter.broadcast.bind(eventEmitter);
	eventEmitter.broadcast = ((event: EmitterEvent) => {
		log.push({ t: Math.round(performance.now()), type: event.type });
		return original(event);
	}) as typeof eventEmitter.broadcast;
	const originalAsync = eventEmitter.broadcastAsync.bind(eventEmitter);
	eventEmitter.broadcastAsync = (async (event: EmitterEvent) => {
		const t = Math.round(performance.now());
		log.push({ t, type: `${event.type}>` });
		const r = await originalAsync(event);
		log.push({ t: Math.round(performance.now()), type: `${event.type}<` });
		return r;
	}) as typeof eventEmitter.broadcastAsync;
}
