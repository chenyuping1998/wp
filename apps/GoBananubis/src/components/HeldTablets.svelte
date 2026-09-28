<script lang="ts" module>
	import type { Position, SymbolName } from '../game/types';

	export type EmitterEventHeldTabletsPending = {
		// The cells whose seals are breaking right now. This overlay draws held
		// cells at rest, and until the break has played those cells are still
		// sealed on the board — drawing them here would put the revealed symbol on
		// screen ahead of the animation that is supposed to name it.
		type: 'heldTabletsPending';
		positions: Position[];
	};

	export type EmitterEventHeldTabletsOpened = {
		// every seal in that batch has finished breaking; the board draws them now
		type: 'heldTabletsOpened';
	};

	export type EmitterEventHeldTabletsShow = {
		// WHAT TO DRAW, decided by MysteryReveal rather than by this component.
		//
		// It used to read the reveal event itself, which meant it applied this
		// spin's multipliers the instant the event arrived — before the seals had
		// broken and before the wheels had rolled to those very values. The reveal
		// owns the order of that sequence, so it owns what is on screen at each
		// step of it.
		type: 'heldTabletsShow';
		symbol: SymbolName;
		cells: { reel: number; row: number; mult: number }[];
	};
</script>

<script lang="ts">
	/**
	 * Held tablets, drawn OVER the reels while they are turning.
	 *
	 * THE PROBLEM THIS SOLVES
	 *
	 * A cell the run has opened is fixed for the rest of the round — the maths
	 * stamps the run's seal into it before the lines are read, every spin. But
	 * the client's reels do not know that. Every free spin, a held cell spun with
	 * the rest of its reel, blurred past a dozen unrelated symbols, stopped on
	 * whatever the strip drew, and only THEN snapped back to the seal when the
	 * mysteryReveal event landed.
	 *
	 * So the one thing the feature is about — the board filling up with a symbol
	 * that stays — was invisible while the board was moving, which is most of the
	 * time the player is looking at it. It read as "nothing is sticky", which is
	 * exactly what it was reported as.
	 *
	 * WHAT THIS DOES
	 *
	 * Holds the last mysteryReveal's `held` snapshot and draws each of those cells
	 * on top of the board, at rest. The symbol art is opaque and fills its cell,
	 * so it occludes whatever the reel is doing behind it without needing a plate
	 * of its own — the cell simply never moves, ever.
	 *
	 * ALWAYS ON, NOT ONLY WHILE THE REELS TURN.
	 *
	 * The first pass drew these only while a reel was in motion, on the argument
	 * that once it stopped the board's own symbol was correct and could take over.
	 * It is not correct yet at that moment, and that is the whole problem: the
	 * spin promise resolves when the reels land, and the mysteryReveal event that
	 * stamps the held cells is the NEXT book event, handled after it. Between the
	 * two the board is showing whatever the strip drew in those cells, so every
	 * single spin ended with the held tablets flashing back to random symbols
	 * before snapping into place.
	 *
	 * There is no window where handing the cell back is safe, so it is never
	 * handed back — with one exception, below.
	 *
	 * THE EXCEPTION IS THE WIN ANIMATION. The win presentation animates the
	 * BOARD's symbols, so a cell that is part of a winning line has to be visible
	 * underneath. A held cell drops out of this overlay for exactly as long as its
	 * board symbol is in the `win` state, and the board is showing the same symbol
	 * by then, so nothing changes on screen when it does.
	 */
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import Symbol from './Symbol.svelte';

	const context = getContext();

	// visible padded row r sits at (r - 0.5) * SYMBOL_SIZE — the same mapping
	// MysteryReveal and StickyPrizes use
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;

	// ── A HELD CELL IS SEALED ────────────────────────────────────────────────
	//
	// These cells are drawn at rest on purpose (see above), and the side effect
	// was that the most important thing in the feature — the tablets that have
	// opened and are staying open, each carrying 2X to 50X — had nothing marking
	// them out from the ordinary symbols around them.
	//
	// So each one gets a gold frame on its cell boundary, plus a soft bed under
	// it. A FRAME rather than the corner brackets the win and the Scatter hold
	// use: those two mean "this is live", and this means the opposite — it is
	// boxed in for the rest of the run.
	//
	// STEADY, NOT BREATHING. It was a slow pulse first, and a mark that spends
	// half of its cycle dim is a mark the player has to wait for; these cells
	// need to be findable at a glance while the rest of the board is moving.
	// Nothing to animate also means no clock, so this costs nothing per frame.
	const HOLD_GOLD = 0xffd75e;

	// ── LOCKING IN ───────────────────────────────────────────────────────────
	//
	// The one exception to "nothing animates here": the moment a newly opened
	// tablet JOINS the held set. It used to just acquire its frame, so a spin
	// that added a tablet to the run looked the same as one that did not, and the
	// player had to count frames to notice. Now the frame slams in from a size
	// larger onto the cell and flares as it seats, with a low pluck under it —
	// once per batch, not per cell, so four opening together is one hit.
	//
	// Timed with a short-lived interval (only while a lock is playing) and
	// Date.now, so a backgrounded tab finishes the lock instead of freezing it
	// half-seated.
	const LOCK_MS = 640;
	let locks = $state<Record<string, number>>({});
	let now = $state(0);
	let braceAt = $state(0);
	let glintCell = -1;
	let glintAt = $state(0);
	let glintKey = $state('');
	let nextGlintAt = 0;
	let clock: ReturnType<typeof setInterval> | undefined;

	// ── ONE CLOCK, ONLY WHILE SOMETHING IS HELD ──────────────────────────────
	//
	// The frames used to be steady and cost nothing. They are a little alive now:
	// pegs slam in when a tablet joins, the whole set braces when the reels
	// launch, and a glint crosses one tablet at a time. So there is a clock — but
	// it exists only while the run holds a tablet, at ~40fps, and drawing a
	// handful of rectangles per tick is nothing. A timer and not rAF, so the lock
	// finishes in a hidden tab instead of freezing half-seated.
	const runClock = () => {
		if (clock) return;
		now = Date.now();
		clock = setInterval(() => {
			now = Date.now();
			const live = Object.entries(locks).filter(([, t0]) => now - t0 < LOCK_MS);
			if (live.length !== Object.keys(locks).length) locks = Object.fromEntries(live);
			// a glint every ~2.4s, walking round the held tablets in turn
			if (held.length > 0 && now >= nextGlintAt) {
				glintCell = (glintCell + 1) % held.length;
				glintKey = `${held[glintCell].reel},${held[glintCell].row}`;
				glintAt = now;
				nextGlintAt = now + 2400 + Math.random() * 900;
			}
		}, 25);
	};
	const stopClock = () => {
		clearInterval(clock);
		clock = undefined;
	};
	$effect(() => {
		if (held.length > 0) runClock();
		else stopClock();
	});
	$effect(() => () => stopClock());

	const startLocks = (keys: string[]) => {
		if (!keys.length) return;
		const at = Date.now();
		locks = { ...locks, ...Object.fromEntries(keys.map((k) => [k, at])) };
		// the low thud of a peg going home, and the multiplier's own landing note
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
		context.eventEmitter.broadcast({ type: 'soundStoneCrack', step: 0 });
		runClock();
	};
	// 0 → 1 across the lock, or -1 for a cell that is simply held
	const lockProgress = (key: string) => {
		const t0 = locks[key];
		if (t0 === undefined) return -1;
		return Math.min(1, Math.max(0, (now - t0) / LOCK_MS));
	};

	// ── THE REELS LAUNCH, AND THE TABLETS BRACE ──────────────────────────────
	// Every free spin the rest of the board leaves and these stay. The frames
	// tighten and the pegs flare for a beat as the first reel goes, which is the
	// board saying, out loud, "not these".
	let prevMotion = '';
	$effect(() => {
		const motion = context.stateGame.board[0]?.reelState.motion ?? '';
		if (prevMotion && prevMotion !== 'spinning' && motion === 'spinning' && held.length > 0) {
			braceAt = Date.now();
			runClock();
		}
		prevMotion = motion;
	});
	const BRACE_MS = 380;
	const brace = () => {
		const p = (now - braceAt) / BRACE_MS;
		if (!braceAt || p < 0 || p > 1) return 0;
		return Math.sin(p * Math.PI);
	};

	// a diagonal band of light crossing a square, clipped to it: the polygon of
	// the band c-w <= (x + y) <= c+w inside [-h, h]^2
	const bandPoly = (h: number, c: number, w: number) => {
		const pts: number[] = [];
		const lines = [c - w, c + w];
		const corners: [number, number][] = [
			[-h, -h],
			[h, -h],
			[h, h],
			[-h, h],
		];
		const inside = (x: number, y: number) => x + y >= lines[0] && x + y <= lines[1];
		for (let i = 0; i < 4; i++) {
			const [ax, ay] = corners[i];
			const [bx, by] = corners[(i + 1) % 4];
			if (inside(ax, ay)) pts.push(ax, ay);
			for (const l of lines) {
				const da = ax + ay - l;
				const db = bx + by - l;
				if (da * db < 0) {
					const t = da / (da - db);
					pts.push(ax + (bx - ax) * t, ay + (by - ay) * t);
				}
			}
		}
		return pts;
	};

	// a four-pointed glint, for where a peg meets the stone
	const spark = (g: PixiGraphics, x: number, y: number, r: number, alpha: number) => {
		g.poly([
			x, y - r,
			x + r * 0.28, y - r * 0.28,
			x + r, y,
			x + r * 0.28, y + r * 0.28,
			x, y + r,
			x - r * 0.28, y + r * 0.28,
			x - r, y,
			x - r * 0.28, y - r * 0.28,
		]).fill({ color: 0xfff3c4, alpha });
	};

	const CORNERS = [
		[-1, -1],
		[1, -1],
		[1, 1],
		[-1, 1],
	];

	const drawFrames = (g: PixiGraphics) => {
		now;
		g.clear();
		const braced = brace();

		for (const cell of covered) {
			const key = `${cell.reel},${cell.row}`;
			const cx = getSymbolX(cell.reel);
			const cy = rowCenterY(cell.row);
			// ON the cell boundary, not inside it. At 0.455 the frame fell within
			// the plate art's own footprint, and the plate is opaque — so the first
			// version was drawn every frame and covered up every frame, which is why
			// it could not be seen in the game while the code looked correct.
			const base = SYMBOL_SIZE * 0.5 - 2;
			const lp = lockProgress(key);
			const fresh = lp >= 0;
			// the frame closes in from 1.35x over the first 45% of the lock
			const slam = !fresh ? 0 : 1 - Math.min(1, lp / 0.45);
			const half = base * (1 + 0.35 * slam * slam);
			// the moment it seats, and how long the light of that lasts
			const seated = !fresh ? -1 : lp < 0.45 ? -1 : (lp - 0.45) / 0.55;
			const flare = seated < 0 ? 0 : 1 - seated;

			if (flare > 0) {
				g.rect(cx - half - 6, cy - half - 6, (half + 6) * 2, (half + 6) * 2).stroke({
					width: 10 * flare,
					color: 0xfff3c4,
					alpha: 0.7 * flare,
				});
				// a shockwave off the cell: the stone taking the blow
				const wave = SYMBOL_SIZE * (0.5 + 0.55 * seated);
				g.rect(cx - wave, cy - wave, wave * 2, wave * 2).stroke({
					width: 3.5 * flare,
					color: 0xffd75e,
					alpha: 0.55 * flare,
				});
			}
			g.rect(cx - half, cy - half, half * 2, half * 2).stroke({
				width: 4.5 + 2.4 * braced,
				color: HOLD_GOLD,
				alpha: 0.92,
			});
			// a paler line just outside it: one line alone reads as a border, two
			// read as gilding — the same pair the buy cards and the symbol plates use
			g.rect(cx - half - 4, cy - half - 4, (half + 4) * 2, (half + 4) * 2).stroke({
				width: 1.4,
				color: 0xfff3bd,
				alpha: Math.min(1, 0.38 + 0.4 * braced),
			});

			// ── FOUR GOLD PEGS, DRIVEN INTO THE CORNERS ─────────────────────────
			//
			// What says "this tablet is now fixed to the board for the rest of the
			// run" is something being fixed to it. On a lock the pegs come in from
			// outside along the diagonals and seat with a glint; afterwards they stay
			// as four studs on the frame — the permanent mark that these cells are
			// pinned, and one a player can find at a glance among moving reels.
			for (const [sx, sy] of CORNERS) {
				const drive = !fresh ? 0 : Math.max(0, 1 - lp / 0.4);
				const off = SYMBOL_SIZE * 0.32 * drive * drive;
				const px = cx + sx * (base + off);
				const py = cy + sy * (base + off);
				const r = 5.2 + 1.8 * braced + 2.2 * (fresh && lp < 0.5 ? 1 - lp * 2 : 0);
				g.circle(px, py, r + 1.6).fill({ color: 0x3a2c08, alpha: 0.9 });
				g.circle(px, py, r).fill({ color: 0xe8ae3c });
				g.circle(px - r * 0.3, py - r * 0.3, r * 0.42).fill({ color: 0xfff3c4, alpha: 0.9 });
			}
			// glints at each corner as the pegs seat, and a few sparks thrown outward
			if (seated >= 0 && flare > 0) {
				for (const [sx, sy] of CORNERS) {
					spark(g, cx + sx * base, cy + sy * base, 13 * flare + 3, flare);
					for (let k = 0; k < 3; k++) {
						const a = Math.atan2(sy, sx) + (k - 1) * 0.55;
						const d = seated * SYMBOL_SIZE * (0.22 + k * 0.05);
						g.circle(cx + sx * base + Math.cos(a) * d, cy + sy * base + Math.sin(a) * d, 2.2 * flare).fill({
							color: 0xffe08a,
							alpha: flare,
						});
					}
				}
			}

			// ── THE GLINT: one tablet at a time catches the light ────────────────
			if (glintKey === key && glintAt) {
				const p = (now - glintAt) / 620;
				if (p >= 0 && p <= 1) {
					const c = -base * 2 + 4 * base * p;
					const poly = bandPoly(base, c, base * 0.22);
					if (poly.length >= 6) {
						g.poly(poly.map((v, i) => (i % 2 === 0 ? cx + v : cy + v))).fill({
							color: 0xffffff,
							alpha: 0.32 * Math.sin(p * Math.PI),
						});
					}
				}
			}
		}
	};

	type Held = { reel: number; row: number; symbol: SymbolName; mult: number };
	let held = $state<Held[]>([]);
	// keys of cells whose seal has not finished breaking yet
	let pending = $state(new Set<string>());

	// The hold belongs to one run. Cleared on the way out rather than on a
	// dedicated event so a round that ends any way at all — the last spin, a
	// wincap, a resumed bet that lands back in the base game — cannot leave a
	// tablet from a finished feature painted over a fresh board.
	$effect(() => {
		if (context.stateGame.gameType !== 'freegame' && held.length) held = [];
	});

	// Everything held, minus whatever is currently playing its win animation on
	// the board underneath.
	const covered = $derived.by(() => {
		const board = context.stateGame.board;
		return held.filter(
			(cell) =>
				!pending.has(`${cell.reel},${cell.row}`) &&
				board[cell.reel]?.reelState.symbols[cell.row]?.symbolState !== 'win',
		);
	});

	context.eventEmitter.subscribeOnMount({
		heldTabletsPending: ({ positions }) => {
			pending = new Set(positions.map((position) => `${position.reel},${position.row}`));
		},
		// Raised when the last seal has finished breaking: from here the board is
		// showing those cells itself, so the overlay takes them back over.
		heldTabletsOpened: () => {
			startLocks([...pending]);
			pending = new Set();
		},
		// The whole snapshot, every time — the reveal sends it in full precisely so
		// a client can rebuild cells it never saw open.
		heldTabletsShow: ({ symbol, cells }) => {
			held = cells.map((cell) => ({
				reel: cell.reel,
				row: cell.row,
				symbol,
				mult: cell.mult,
			}));
		},
	});
</script>

<BoardContainer>
	<!-- a soft bed under the plates, so the frame has something to sit on -->
	{#each covered as cell (`${cell.reel},${cell.row}`)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={getSymbolX(cell.reel)}
			y={rowCenterY(cell.row)}
			width={SYMBOL_SIZE * 1.35}
			height={SYMBOL_SIZE * 1.35}
			tint={HOLD_GOLD}
			blendMode="add"
			alpha={0.22}
		/>
	{/each}

	{#each covered as cell (`${cell.reel},${cell.row}`)}
		<Container>
			<!--
				Drawn through Symbol so a held cell is the same component the board
				draws for it: same art, same multiplier badge, same position. Anything
				hand-rolled here would be a second place for the held cell's
				appearance to be defined, and the two would drift.
			-->
			<Symbol
				x={getSymbolX(cell.reel)}
				y={rowCenterY(cell.row)}
				state="postWinStatic"
				rawSymbol={{ name: cell.symbol, multiplier: cell.mult }}
			/>
		</Container>
	{/each}

	<!-- and the frame that says it is sealed, over them -->
	<Container zIndex={5}>
		<Graphics draw={drawFrames} />
	</Container>
</BoardContainer>
