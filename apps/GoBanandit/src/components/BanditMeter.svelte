<script lang="ts" module>
	export type EmitterEventBanditMeter = {
		type: 'banditLevelUp';
		level: number;
		mult: number;
		spinsAdded: number;
	};
</script>

<script lang="ts">
	// The rung-up moment in free spins: the meter crossed a threshold, so the
	// feature just got longer AND every later collection got bigger. That is the
	// best news the feature can give short of a big collection, so it gets the
	// screen: a paper poster slams onto the board with "+10 EXTRA SPINS" and the
	// new "COLLECT ×N", holds, and lifts away. The ticket (FreeSpinCounter)
	// updates underneath it.
	//
	// One rAF clock, no setInterval; the handler awaits the whole beat.
	import { MainContainer } from 'components-layout';
	import { Container, Graphics, Rectangle, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import { gameText } from '../game/i18nText';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	const PAPER = 0xf2e8d0;
	const RED = 0xd24a2c;
	const GREEN = 0x1f5c4a;
	const INK = 0x1e1b1a;
	const YELLOW = 0xf4c21b;

	const IN_MS = 380;
	const HOLD_MS = 1500;
	const OUT_MS = 320;

	let active = $state(false);
	let t = $state(0);
	let mult = $state(1);
	let spins = $state(0);
	let topRung = $state(false);

	const W = SYMBOL_SIZE * 4.2;
	const H = SYMBOL_SIZE * 2.3;

	const easeOutBack = (x: number) => {
		const c1 = 1.9;
		const c3 = c1 + 1;
		return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
	};

	const pose = $derived.by(() => {
		if (t < IN_MS) {
			const k = t / IN_MS;
			return { scale: 1.8 - 0.8 * easeOutBack(k), alpha: Math.min(1, k * 2), rot: -0.12 * (1 - k), scrim: k };
		}
		if (t < IN_MS + HOLD_MS) return { scale: 1, alpha: 1, rot: 0, scrim: 1 };
		const k = Math.min(1, (t - IN_MS - HOLD_MS) / OUT_MS);
		return { scale: 1 - 0.1 * k, alpha: 1 - k, rot: 0.06 * k, scrim: 1 - k };
	});

	context.eventEmitter.subscribeOnMount({
		banditLevelUp: (event) =>
			new Promise<void>((resolve) => {
				mult = event.mult;
				spins = event.spinsAdded;
				topRung = event.level >= 3;
				active = true;
				const start = performance.now();
				const step = (now: number) => {
					t = now - start;
					if (t < IN_MS + HOLD_MS + OUT_MS) {
						requestAnimationFrame(step);
					} else {
						active = false;
						resolve();
					}
				};
				requestAnimationFrame(step);
			}),
	});

	const layout = $derived(context.stateLayoutDerived.mainLayout());
</script>

{#if active}
	<MainContainer>
		<Rectangle
			width={layout.width}
			height={layout.height}
			backgroundColor={INK}
			alpha={0.45 * pose.scrim}
		/>
		<Container x={layout.width / 2} y={layout.height * 0.45} scale={pose.scale} rotation={pose.rot} alpha={pose.alpha}>
			<Graphics
				draw={(g) => {
					g.clear();
					g.roundRect(-W / 2 + 10, -H / 2 + 10, W, H, 20).fill(topRung ? YELLOW : RED);
					g.roundRect(-W / 2, -H / 2, W, H, 20).fill(PAPER).stroke({ width: 6, color: INK });
					g.roundRect(-W / 2 + 16, -H / 2 + 16, W - 32, H * 0.3, 10).fill(GREEN);
				}}
			/>
			<Text
				anchor={0.5}
				y={-H / 2 + 16 + H * 0.15}
				text={`+${spins} ${gameText('extraSpins')}`}
				style={{ fontFamily: GAME_FONT, fontSize: W * 0.075, fontWeight: GAME_FONT_WEIGHT, letterSpacing: 2, fill: PAPER }}
			/>
			<Text
				anchor={0.5}
				y={H * 0.08}
				text={gameText('collect')}
				style={{ fontFamily: GAME_FONT, fontSize: W * 0.07, fontWeight: GAME_FONT_WEIGHT, letterSpacing: 2, fill: INK }}
			/>
			<Text
				anchor={0.5}
				y={H * 0.3}
				text={`×${mult}`}
				style={{ fontFamily: NUMBER_FONT, fontSize: W * 0.17, fontWeight: '400', letterSpacing: 2, fill: RED }}
			/>
		</Container>
	</MainContainer>
{/if}
