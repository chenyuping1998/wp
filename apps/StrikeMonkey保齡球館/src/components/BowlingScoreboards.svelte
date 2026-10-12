<script lang="ts" module>
	export type EmitterEventBowlingScoreboards =
		| { type: 'bowlingFrameStart' }
		| { type: 'bowlingFrameScore'; amount: number; /** a big win or above: the screen calls a STRIKE */ big?: boolean };
</script>

<script lang="ts">
	import { Container, Graphics, Text } from 'pixi-svelte';
	import { getContext } from '../game/context';
	import { NUMBER_FONT } from '../game/fonts';

	type Frame = { number: number; amount: number; total: number; strike: boolean; at: number };
	type Plate = { x: number; y: number; width: number; height: number };
	type Props = { parallax: Plate };
	const props: Props = $props();
	const context = getContext();

	// The five painted screens occupy the same positions on both background plates.
	// Each screen shows one of the latest five spins, like a row of lane scorecards;
	// the leftmost is the current one.
	// Values are the actual spin payout in bet multiples, not invented pinfall.
	const SCREEN_X = [493, 661, 827, 994, 1164];
	let frames = $state<Frame[]>([]);
	let nextFrame = 1;
	let total = 0;
	const feature = $derived(context.stateGame.gameType === 'freegame');
	const paper = $derived(feature ? 0xf4e7f8 : 0xffedce);
	const accent = $derived(feature ? 0xd9a4e9 : 0xf6a46a);

	context.eventEmitter.subscribeOnMount({
		bowlingFrameStart: () => {
			if (nextFrame > 10) {
				frames = [];
				total = 0;
				nextFrame = 1;
			}
			frames = [...frames, { number: nextFrame++, amount: 0, total, strike: false, at: 0 }].slice(-5);
		},
		bowlingFrameScore: ({ amount, big }) => {
			if (!frames.length) return;
			const prior = frames[frames.length - 1];
			const actual = Math.max(0, amount);
			total += actual - prior.amount;
			frames = frames.map((frame, index) =>
				index === frames.length - 1
					? { ...frame, amount: actual, total, strike: frame.strike || !!big, at: big ? performance.now() : frame.at }
					: frame,
			);
		},
	});

	// The LEFTMOST screen is the lane being bowled: it shows this spin's score
	// from the first spin on; the older frames step right, one screen each.
	// (It used to fill from the right, so the left screen read READY for the
	// first four spins and showed the oldest frame after.)
	// a clock for the STRIKE! flash, only while one is fresh
	let now = $state(0);
	$effect(() => {
		const f = frames[frames.length - 1];
		if (!f?.strike) return;
		let raf = 0;
		const tick = (t: number) => {
			now = t;
			if (t - f.at < STRIKE_FLASH_MS) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
	const STRIKE_FLASH_MS = 1600;
	/** 0..1 flash at the start of a strike, then steady */
	const strikePop = (f: Frame) => {
		const t = (now - f.at) / STRIKE_FLASH_MS;
		return t < 0 || t >= 1 ? 0 : (1 - t) * (0.5 + 0.5 * Math.cos(t * Math.PI * 8));
	};

	const frameAt = (screen: number) => frames[frames.length - 1 - screen];
	const scoreText = (amount: number) => {
		const multiple = amount / 100;
		const digits = multiple >= 100 ? multiple.toFixed(0) : multiple >= 10 ? multiple.toFixed(1) : multiple.toFixed(2);
		return `${digits.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')}×`;
	};
</script>

<Container x={props.parallax.x} y={props.parallax.y}
	scale={{ x: props.parallax.width / 1920, y: props.parallax.height / 1080 }}>
	{#each SCREEN_X as x, screen (screen)}
		{@const frame = frameAt(screen)}
		<Container {x} y={299}>
			<Graphics draw={(g) => {
				g.clear();
				g.roundRect(-57, -26, 114, 52, 5).fill({ color: 0x0c2e39, alpha: 0.78 });
			}} />
			{#if frame}
				<Text text={`FRAME ${String(frame.number).padStart(2, '0')}`} anchor={0.5} y={-17}
					style={{ fontFamily: NUMBER_FONT, fontSize: 10, fill: accent, letterSpacing: 1 }} />
				{#if frame.strike}
					<!-- a big win or above: the lane calls it, flashing as it lands -->
					{@const pop = strikePop(frame)}
					<Graphics draw={(g) => {
						g.clear();
						if (pop > 0) g.roundRect(-57, -26, 114, 52, 5).fill({ color: 0xe8502e, alpha: 0.55 * pop });
					}} />
					<Text text="STRIKE!" anchor={0.5} y={1} scale={1 + 0.18 * pop}
						style={{ fontFamily: NUMBER_FONT, fontSize: 24, fill: 0xf6a46a, letterSpacing: 1 }} />
				{:else}
					<Text text={scoreText(frame.amount)} anchor={0.5} y={1}
						style={{ fontFamily: NUMBER_FONT, fontSize: 22, fill: paper }} />
				{/if}
				<Text text={`TOTAL ${scoreText(frame.total)}`} anchor={0.5} y={19}
					style={{ fontFamily: NUMBER_FONT, fontSize: 10, fill: paper }} />
			{:else}
				<Text text={`LANE ${screen + 1}`} anchor={0.5} y={-12}
					style={{ fontFamily: NUMBER_FONT, fontSize: 12, fill: accent, letterSpacing: 1 }} />
				<Text text="READY" anchor={0.5} y={9}
					style={{ fontFamily: NUMBER_FONT, fontSize: 19, fill: paper }} />
			{/if}
		</Container>
	{/each}
</Container>
