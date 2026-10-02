<script lang="ts" module>
	type Cell = { reel: number; row: number };
	export type EmitterEventBanditCollect =
		| {
				type: 'banditCollect';
				collectors: Cell[];
				/** value in book units (100 = 1x bet) */
				sacks: (Cell & { value: number })[];
				perCollector: number;
				mult: number;
				amount: number;
		  }
		| { type: 'banditCollectClear' };
</script>

<script lang="ts">
	// The Bandit's collection: every Sack on the board flies into every Bandit.
	//
	// Three beats, all on one rAF clock (no setInterval — the review checker
	// flags it, and rAF pauses with the tab instead of piling frames up):
	//   1. PICK  (0..PICK_MS)       every Sack hops, so the player sees what is
	//                               about to be taken
	//   2. FLY   (per Bandit)       a copy of each Sack flies into the Bandit,
	//                               staggered, and the Bandit's tag counts up
	//                               one Sack at a time
	//   3. STAMP (free spins only)  the tag is stamped "xN" and jumps to the
	//                               multiplied figure
	// The tags stay up through the spin's win (the setWin that follows carries
	// the total), then fade as that win is put away. They used to stay until the
	// next spin's reveal — through the whole idle, sitting on the Bandits' faces
	// long after the money had moved to the WIN box.
	import { onDestroy } from 'svelte';
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, isBigPrize } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import SackBadge from './SackBadge.svelte';
	import { NUMBER_FONT } from '../game/fonts';

	const context = getContext();

	const PAPER = 0xf2e8d0;
	const RED = 0xd24a2c;
	const INK = 0x1e1b1a;

	const PICK_MS = 420;
	const FLY_MS = 460;
	const STAGGER_MS = 90;
	const STAMP_MS = 520;
	const HOLD_MS = 450;

	// visible padded row r sits at (r - 0.5) * SYMBOL_SIZE
	const cellY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;
	const cellX = (reel: number) => getSymbolX(reel);

	type Tag = { x: number; y: number; shown: number; stamped: boolean; pop: number };
	type Flyer = { fromX: number; fromY: number; toX: number; toY: number; start: number; done: boolean };

	let sacks = $state<{ x: number; y: number; value: number }[]>([]);
	let tags = $state<Tag[]>([]);
	let flyers = $state<Flyer[]>([]);
	let mult = $state(1);
	let clock = $state(0);
	let pickStart = $state(-1);
	let stampStart = $state(-1);
	// 1 while the tags are up; eased to 0 once the spin's win is put away
	let tagAlpha = $state(1);
	let collected = false;
	const TAG_FADE_MS = 320;

	let raf = 0;
	let running = false;
	const loop = (now: number) => {
		clock = now;
		raf = requestAnimationFrame(loop);
	};
	const startClock = () => {
		if (running) return;
		running = true;
		clock = performance.now();
		raf = requestAnimationFrame(loop);
	};
	const stopClock = () => {
		running = false;
		cancelAnimationFrame(raf);
	};
	onDestroy(stopClock);

	// Wait on the rAF clock, so a hidden tab pauses the collection rather than
	// letting timers race ahead of what is drawn.
	const waitMs = (ms: number) =>
		new Promise<void>((resolve) => {
			const until = performance.now() + ms;
			const check = (now: number) => (now >= until ? resolve() : requestAnimationFrame(check));
			requestAnimationFrame(check);
		});

	const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
	const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

	const pickHop = (i: number) => {
		if (pickStart < 0) return 0;
		const t = (clock - pickStart - i * 40) / PICK_MS;
		if (t <= 0 || t >= 1) return 0;
		return Math.sin(t * Math.PI);
	};

	const flyerPos = (f: Flyer) => {
		const t = Math.min(1, Math.max(0, (clock - f.start) / FLY_MS));
		const e = easeInOut(t);
		// a lob, not a straight line: sacks are thrown, and the arc keeps crossing
		// paths readable when several Bandits collect at once
		const lift = Math.sin(t * Math.PI) * SYMBOL_SIZE * 0.7;
		return {
			x: f.fromX + (f.toX - f.fromX) * e,
			y: f.fromY + (f.toY - f.fromY) * e - lift,
			scale: 0.42 + 0.18 * Math.sin(t * Math.PI),
			visible: t > 0 && t < 1,
		};
	};

	const stampScale = () => {
		if (stampStart < 0) return 0;
		const t = Math.min(1, (clock - stampStart) / STAMP_MS);
		// slams in oversized and settles, like a rubber stamp hitting paper
		return t < 0.35 ? 2.2 - 1.3 * easeOutCubic(t / 0.35) : 0.9 + 0.1 * easeOutCubic((t - 0.35) / 0.65);
	};

	context.eventEmitter.subscribeOnMount({
		banditCollect: async (event) => {
			startClock();
			collected = false;
			tagAlpha = 1;
			mult = event.mult;
			stampStart = -1;
			sacks = event.sacks.map((s) => ({ x: cellX(s.reel), y: cellY(s.row), value: s.value }));
			tags = event.collectors.map((c) => ({
				x: cellX(c.reel),
				y: cellY(c.row) - SYMBOL_SIZE * 0.36,
				shown: 0,
				stamped: false,
				pop: 0,
			}));
			flyers = [];

			pickStart = performance.now();
			await waitMs(PICK_MS + sacks.length * 40);

			// one Bandit at a time: with two or three collecting at once, every Sack
			// flying everywhere at the same moment is unreadable
			for (let b = 0; b < tags.length; b++) {
				const tag = tags[b];
				const base = performance.now();
				flyers = sacks.map((s, i) => ({
					fromX: s.x,
					fromY: s.y,
					toX: tag.x,
					toY: tag.y + SYMBOL_SIZE * 0.36,
					start: base + i * STAGGER_MS,
					done: false,
				}));
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
				for (let i = 0; i < sacks.length; i++) {
					await waitMs(i === 0 ? FLY_MS : STAGGER_MS);
					tag.shown += sacks[i].value;
					tag.pop = performance.now();
				}
				await waitMs(120);
				flyers = [];
			}

			if (mult > 1) {
				stampStart = performance.now();
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
				await waitMs(STAMP_MS * 0.35);
				for (const tag of tags) {
					tag.stamped = true;
					tag.shown = event.perCollector * mult;
					tag.pop = performance.now();
				}
				await waitMs(STAMP_MS * 0.65);
			}
			await waitMs(HOLD_MS);
			pickStart = -1;
			collected = true;
			stopClock();
		},
		// The setWin after a collection shows the spin's total; when it is put
		// away, the tags have done their job.
		winHide: async () => {
			if (!collected || tags.length === 0) return;
			collected = false;
			const t0 = performance.now();
			await new Promise<void>((resolve) => {
				const step = (now: number) => {
					tagAlpha = Math.max(0, 1 - (now - t0) / TAG_FADE_MS);
					if (tagAlpha > 0) requestAnimationFrame(step);
					else resolve();
				};
				requestAnimationFrame(step);
			});
			tags = [];
			stampStart = -1;
			tagAlpha = 1;
		},
		banditCollectClear: () => {
			collected = false;
			tagAlpha = 1;
			sacks = [];
			tags = [];
			flyers = [];
			stampStart = -1;
			pickStart = -1;
			stopClock();
		},
	});

	const tagPop = (tag: Tag) => {
		const t = (clock - tag.pop) / 220;
		return t >= 0 && t < 1 ? 1 + 0.25 * Math.sin(t * Math.PI) : 1;
	};
</script>

{#snippet ink(text: string, size: number, fill: number)}
	<Text
		anchor={0.5}
		{text}
		style={{ fontFamily: NUMBER_FONT, fontSize: size, fontWeight: '400', letterSpacing: 1, fill }}
	/>
{/snippet}

<BoardContainer>
	<!-- 1. the Sacks hop in place before they are taken -->
	{#each sacks as sack, i (i)}
		{@const hop = pickHop(i)}
		{#if hop > 0}
			<Sprite
				key="gbP"
				anchor={0.5}
				x={sack.x}
				y={sack.y - hop * SYMBOL_SIZE * 0.12}
				width={SYMBOL_SIZE * 0.88 * (1 + hop * 0.12)}
				height={SYMBOL_SIZE * 0.88 * (1 + hop * 0.12)}
			/>
			<!-- the copy lies over the reel's sack, so it carries the value too -->
			<SackBadge
				prize={sack.value / 100}
				x={sack.x}
				y={sack.y - hop * SYMBOL_SIZE * 0.12 - SYMBOL_SIZE * 0.1 * (1 + hop * 0.12)}
				scale={1 + hop * 0.12}
			/>
		{/if}
	{/each}

	<!-- 2. copies in flight -->
	{#each flyers as flyer, i (i)}
		{@const p = flyerPos(flyer)}
		{#if p.visible}
			<Sprite
				key="gbP"
				anchor={0.5}
				x={p.x}
				y={p.y}
				width={SYMBOL_SIZE * p.scale}
				height={SYMBOL_SIZE * p.scale}
			/>
			<!-- the value it carries, so the count-up on the tag can be followed -->
			<SackBadge
				prize={(sacks[i]?.value ?? 0) / 100}
				x={p.x}
				y={p.y - SYMBOL_SIZE * 0.1 * (p.scale / 0.88)}
				scale={p.scale / 0.88}
			/>
		{/if}
	{/each}

	<!-- 3. each Bandit's tag: a paper ticket with a red offset print, the way
	     the screenprint plates are built (flat inks, no glow) -->
	<Container alpha={tagAlpha}>
	{#each tags as tag, i (i)}
		{#if tag.shown > 0}
			{@const s = tagPop(tag)}
			<Container x={tag.x} y={tag.y} scale={s}>
				<Graphics
					draw={(g) => {
						g.clear();
						const w = SYMBOL_SIZE * 0.92;
						const h = SYMBOL_SIZE * 0.34;
						g.roundRect(-w / 2 + 4, -h / 2 + 4, w, h, 8).fill(RED);
						g.roundRect(-w / 2, -h / 2, w, h, 8).fill(PAPER).stroke({ width: 3, color: INK });
					}}
				/>
				{@render ink(bookEventAmountToCurrencyString(tag.shown), 30, isBigPrize(tag.shown) ? RED : INK)}
			</Container>
			{#if tag.stamped || stampStart >= 0}
				{@const st = stampScale()}
				{#if st > 0}
					<Container x={tag.x + SYMBOL_SIZE * 0.38} y={tag.y - SYMBOL_SIZE * 0.22} scale={st} rotation={-0.18}>
						<Graphics
							draw={(g) => {
								g.clear();
								g.circle(0, 0, SYMBOL_SIZE * 0.2).fill(RED).stroke({ width: 3, color: INK });
							}}
						/>
						{@render ink(`×${mult}`, 30, PAPER)}
					</Container>
				{/if}
			{/if}
		{/if}
	{/each}
	</Container>
</BoardContainer>
