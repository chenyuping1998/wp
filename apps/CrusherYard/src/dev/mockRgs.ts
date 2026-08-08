/**
 * A fake RGS, for reproducing presentation bugs locally.
 *
 * Every presentation bug in this game so far has been reported from Stake
 * Engine and diagnosed by reading code, because `pnpm dev` on its own cannot
 * play a single round: the client needs a real RGS to hand it a book, so it
 * dies at authenticate and never mounts the game at all. That made the whole
 * class of "the win does not clear" bug unreproducible, which is why two of
 * them were found by guesswork instead of by looking.
 *
 * This answers the five endpoints the client calls, out of a handful of real
 * books lifted from the published set — including the specific shapes that are
 * hard to reach by playing: a fly-in cluster, a quench cluster, a feature
 * trigger. Nothing is synthesised; these are books the RGS could really serve.
 *
 * Enabled ONLY in dev and ONLY with ?mock=1 in the URL. In a production build
 * `import.meta.env.DEV` is statically false, so the branch, this module and the
 * book data are all dropped.
 *
 *   http://localhost:3003/?mock=1&sessionID=dev&rgs_url=mock.local&currency=USD&device=desktop
 *
 * Add &book=bonusFlyIn (or any key in devBooks.json) to force one shape; the
 * default cycles through everything in order.
 */

const API_AMOUNT_MULTIPLIER = 1_000_000;

type DevBook = { id: number; payoutMultiplier: number; state: unknown[] };

export const installMockRgs = async () => {
	if (!import.meta.env.DEV) return;
	const params = new URLSearchParams(window.location.search);
	if (!params.has('mock')) return;

	// Everything a console session needs, on one handle. Reaching these through
	// dynamic import from the devtools does not work: `state-shared` is a bare
	// specifier the browser cannot resolve, and importing by path would create a
	// second copy of every singleton rather than the ones the game is using.
	const [shared, game, emitter, utils, layout] = await Promise.all([
		import('state-shared'),
		import('../game/stateGame.svelte'),
		import('../game/eventEmitter'),
		import('../game/utils'),
		import('../game/stateLayout'),
	]);
	(window as unknown as Record<string, unknown>).__ef = {
		...shared,
		...game,
		...emitter,
		...utils,
		...layout,
	};

	// The press-to-continue gate is a Pixi hit area, which cannot be driven from a
	// headless console session. Skip straight to the game — the opening flare is
	// not what any of this is here to look at.
	if (params.has('skipLoading')) {
		queueMicrotask(() => {
			layout.stateLayout.showLoadingScreen = false;
		});
	}

	// Headless clock.
	//
	// A hidden tab gets no animation frames at all, and this game is animation
	// frames all the way down — Svelte's tweens, every effect timeline, Pixi's
	// ticker. Without this the reels stop mid-fall and every round looks like it
	// has hung, which is indistinguishable from the bug being hunted. Driving the
	// callbacks off a timer instead is not accurate to real frame pacing, but it
	// is enough to tell a round that finishes from one that does not.
	if (params.has('headless')) {
		const pending = new Map<number, FrameRequestCallback>();
		let nextId = 1;
		window.requestAnimationFrame = (callback: FrameRequestCallback) => {
			const id = nextId++;
			pending.set(id, callback);
			return id;
		};
		window.cancelAnimationFrame = (id: number) => void pending.delete(id);
		setInterval(() => {
			const due = [...pending.values()];
			pending.clear();
			const now = performance.now();
			for (const callback of due) callback(now);
		}, 16);
		console.log('[mockRgs] headless clock driving requestAnimationFrame');
	}

	const books = (await import('./devBooks.json')).default as Record<string, DevBook[]>;

	// Order matters: a base win first, so the very first spin exercises the path
	// that has been failing, then the feature shapes.
	const ORDER = [
		'baseWin',
		'baseTrigger',
		'bonusPlain',
		'bonusTank',
		'bonusQuench',
		'bonusRetrigger',
	];
	const forced = params.get('book');
	const sequence: DevBook[] = forced
		? (books[forced] ?? [])
		: ORDER.flatMap((key) => books[key] ?? []);

	if (sequence.length === 0) {
		console.error('[mockRgs] no books for', forced ?? ORDER);
		return;
	}

	let index = 0;
	let balance = 1000;

	const json = (body: unknown) =>
		new Response(JSON.stringify(body), {
			status: 200,
			headers: { 'content-type': 'application/json' },
		});

	const balanceBody = () => ({ amount: balance * API_AMOUNT_MULTIPLIER, currency: 'USD' });

	const realFetch = window.fetch.bind(window);

	window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

		if (!url.includes('mock.local')) return realFetch(input as RequestInfo, init);

		if (url.endsWith('/wallet/authenticate')) {
			return json({
				balance: balanceBody(),
				config: {
					minBet: 0.1 * API_AMOUNT_MULTIPLIER,
					maxBet: 100 * API_AMOUNT_MULTIPLIER,
					stepBet: 0.1 * API_AMOUNT_MULTIPLIER,
					defaultBetLevel: 1 * API_AMOUNT_MULTIPLIER,
					betLevels: [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100].map(
						(level) => level * API_AMOUNT_MULTIPLIER,
					),
					betModes: {},
					jurisdiction: {
						socialCasino: false,
						disabledFullscreen: false,
						disabledTurbo: false,
						disabledSuperTurbo: false,
						disabledAutoplay: false,
						disabledSlamstop: false,
						disabledSpacebar: false,
						disabledBuyFeature: false,
						displayNetPosition: false,
						displayRTP: false,
						displaySessionTimer: false,
						minimumRoundDuration: 0,
					},
				},
				round: null,
			});
		}

		if (url.endsWith('/wallet/play')) {
			const body = init?.body ? JSON.parse(String(init.body)) : {};
			const amount = (body.amount ?? API_AMOUNT_MULTIPLIER) / API_AMOUNT_MULTIPLIER;
			const book = sequence[index % sequence.length];
			index += 1;
			balance = balance - amount + amount * book.payoutMultiplier;
			console.log(
				`[mockRgs] serving book id=${book.id} payout=${book.payoutMultiplier}x (${index}/${sequence.length})`,
			);
			return json({
				balance: balanceBody(),
				round: {
					betID: 1000 + index,
					amount: amount * API_AMOUNT_MULTIPLIER,
					payout: amount * book.payoutMultiplier * API_AMOUNT_MULTIPLIER,
					payoutMultiplier: book.payoutMultiplier,
					active: true,
					state: book.state,
					mode: body.mode ?? 'base',
					event: null,
				},
			});
		}

		// Replay links (?replay=true). Authenticate calls this INSTEAD of
		// authenticate, so without it the replay path cannot be exercised at all
		// and ReplayIntro has nothing to hold.
		if (url.includes('/bet/replay/')) {
			const book = sequence[0];
			console.log(`[mockRgs] serving replay of book id=${book.id} (${book.payoutMultiplier}x)`);
			return json({ state: book.state, payoutMultiplier: book.payoutMultiplier });
		}

		if (url.endsWith('/wallet/end-round')) return json({ balance: balanceBody() });
		if (url.includes('/bet/event')) return json({ event: null });

		console.warn('[mockRgs] unhandled endpoint', url);
		return json({});
	};

	console.log(`[mockRgs] installed — ${sequence.length} books queued`);
};
