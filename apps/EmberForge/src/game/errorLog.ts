/**
 * Make a broken round say so.
 *
 * There are two failure modes and the round's own try/catch can only see one of
 * them. A book event handler that throws is caught where it is awaited. A Svelte
 * RENDER or effect error is not: it is raised while flushing effects, nowhere
 * near the await chain, so the sequence simply stops with no rejection anyone
 * can catch — which on screen is a game that has frozen for no stated reason.
 *
 * These two listeners are the only place that class of failure becomes visible
 * without a debugger attached. They log and nothing else; recovery is not
 * something a global handler can do honestly.
 */
export const installErrorLogging = () => {
	if (typeof window === 'undefined') return;
	if ((window as unknown as Record<string, boolean>).__emberForgeErrorLogging) return;
	(window as unknown as Record<string, boolean>).__emberForgeErrorLogging = true;

	window.addEventListener('error', (event) => {
		console.error('[EmberForge] uncaught error', {
			message: event.message,
			source: `${event.filename}:${event.lineno}:${event.colno}`,
			error: event.error,
		});
	});

	window.addEventListener('unhandledrejection', (event) => {
		console.error('[EmberForge] unhandled rejection', event.reason);
	});
};
