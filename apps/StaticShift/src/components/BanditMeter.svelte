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
	import { Container, Rectangle, Sprite, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import { gameText } from '../game/i18nText';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	const PAPER = 0xe5e2d6;
	const RED = 0xe7aa53;
	const GREEN = 0x535e88;
	const INK = 0x15191f;
	const YELLOW = 0xf4c21b;

	const IN_MS = 240;
	const HOLD_MS = 1350;
	const OUT_MS = 240;

	let active = $state(false);
	let t = $state(0);
	let mult = $state(1);
	let spins = $state(0);
	let topRung = $state(false);

	// the same radio faceplate (fs_plate, 920×720) as the free-spins intro and
	// the opening cards, so the feature's news reads as one family of plaques;
	// its paper sits at x .18–.87 / y .09–.92, so text centres on (.525, .505)
	const W = SYMBOL_SIZE * 4.6;
	const H = (W * 720) / 920;
	const PX = W * 0.025;
	const fit = (text: string, size: number, width: number) => Math.min(size, width / (text.length * 0.62));

	const easeOutBack = (x: number) => {
		const c1 = 1.9;
		const c3 = c1 + 1;
		return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
	};

	const pose = $derived.by(() => {
		if (t < IN_MS) {
			const k = t / IN_MS;
			return { scale: k<.72?1.7-.7*(1-(1-k/.72)**2):1, alpha: Math.min(1, k * 2), rot: -0.12 * (1 - k), scrim: k };
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
                let hit=false;
				const step = (now: number) => {
					t = now - start;
                    if(!hit && t>=IN_MS*.72){hit=true;
                     context.eventEmitter.broadcast({type:'soundLadderUp',level:event.level});
                     context.eventEmitter.broadcast({type:'boardFrameImpact',kind:'upgrade',strength:event.level>=3?1.65:1.1});
                     performance.mark('staticshift:upgrade-contact');
                    }
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
			<Sprite key="gbFsSign" anchor={0.5} width={W} height={H} />
			<Text
				anchor={0.5}
				x={PX}
				y={-H * 0.22}
				text={`+${spins} ${gameText('extraSpins')}`}
				style={{ fontFamily: GAME_FONT, fontSize: fit(`+${spins} ${gameText('extraSpins')}`, W * 0.075, W * 0.62), fontWeight: GAME_FONT_WEIGHT, letterSpacing: 2, fill: GREEN }}
			/>
			<Text
				anchor={0.5}
				x={PX}
				y={H * 0.02}
				text={gameText('collect')}
				style={{ fontFamily: GAME_FONT, fontSize: fit(gameText('collect'), W * 0.065, W * 0.62), fontWeight: GAME_FONT_WEIGHT, letterSpacing: 2, fill: INK }}
			/>
			<Text
				anchor={0.5}
				x={PX}
				y={H * 0.23}
				text={`×${mult}`}
				style={{ fontFamily: NUMBER_FONT, fontSize: W * 0.17, fontWeight: '400', letterSpacing: 2, fill: topRung ? YELLOW : RED, stroke: { color: INK, width: 5 } }}
			/>
		</Container>
	</MainContainer>
{/if}
