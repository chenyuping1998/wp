
export const installErrorLogging = () => {
	if (typeof window === 'undefined') return;
	if ((window as unknown as Record<string, boolean>).__purrfiaErrorLogging) return;
	(window as unknown as Record<string, boolean>).__purrfiaErrorLogging = true;

	window.addEventListener('error', (event) => {
		console.error('[Purrfia] uncaught error', {
			message: event.message,
			source: `${event.filename}:${event.lineno}:${event.colno}`,
			error: event.error,
		});
	});

	window.addEventListener('unhandledrejection', (event) => {
		console.error('[Purrfia] unhandled rejection', event.reason);
	});
};
