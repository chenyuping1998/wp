<script lang="ts" module>
	/**
	 * Serpent Ladder (SPEC 3-5), free game only. Every applied orb grows one snake;
	 * at each threshold Medusa climbs a level: +spins and a higher minimum orb.
	 */
	export type EmitterEventSerpentLadder =
		| { type: 'serpentLadderShow'; snakes: number }
		| { type: 'serpentLadderHide' }
		| { type: 'serpentLadderUpdate'; snakes: number }
		| { type: 'serpentLevelUp'; level: number; snakes: number; floor: number; spinsAdded: number };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Sprite, Text } from 'pixi-svelte';
	

	import { getContext } from '../game/context';
	import { BOARD_SIZES } from '../game/constants';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { gameText } from '../game/i18nText';
	import config from '../game/config';
	import BoardContainer from './BoardContainer.svelte';

	// Placeholder panel drawn in code; Codex supplies the carved-marble panel,
	// snake pips and level badges (MEDUSA_新機制_Codex需求單.md §3).
	const context = getContext();
	const ladder = config.ladder;
	const thresholds: number[] = ladder.thresholds;
	const maxSnakes = thresholds[thresholds.length - 1];
	const floors = ladder.floors as Record<string, number>;
	const levelFor = (snakes: number) => 1 + thresholds.filter((t) => snakes >= t).length;

	const W = 200,
		H = 64,
		PIP = 13.5,
		GROUP_GAP = 9;
	const portrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	// Landscape: under Medusa's running-total plate (MedusaThrow.svelte), left of
	// the board. Portrait: above that plate, left corner above the board.
	const pos = $derived(
		portrait ? { x: 200 * 0.45, y: -125 * 0.72 - 125 * 0.5 - H * 0.5 - 8 } : { x: -200 * 0.62, y: BOARD_SIZES.height * 0.45 + 125 * 0.5 + H * 0.5 + 14 },
	);

	let show = $state(false);
	let snakes = $state(0);
	let pop = $state(0);
	let banner = $state<{ text: string; t: number } | null>(null);
	const level = $derived(levelFor(snakes));
	const floor = $derived(floors[String(level)] ?? 0);

	let alive = true;
	const timers = new Set<ReturnType<typeof setTimeout>>();
	onDestroy(() => {
		alive = false;
		for (const t of timers) clearTimeout(t);
	});
	const animate = (ms: number, step: (t: number) => void) =>
		new Promise<void>((resolve) => {
			const start = performance.now();
			let done = false;
			const end = () => {
				if (done) return;
				done = true;
				step(1);
				resolve();
			};
			const frame = (now: number) => {
				if (done || !alive) return;
				const t = Math.min(1, (now - start) / ms);
				step(t);
				if (t < 1) requestAnimationFrame(frame);
			};
			requestAnimationFrame(frame);
			const timer = setTimeout(() => {
				timers.delete(timer);
				end();
			}, ms + 30);
			timers.add(timer);
		});

	const pipX = (i: number) => {
		const group = thresholds.findIndex((t) => i < t);
		const span = maxSnakes * PIP + (thresholds.length - 1) * GROUP_GAP;
		return -span / 2 + i * PIP + Math.max(0, group) * GROUP_GAP + PIP / 2;
	};


	const levelUp = async (e: { level: number; snakes: number; spinsAdded: number }) => {
		snakes = e.snakes;
		if (e.spinsAdded > 0) {
			banner = { text: `+${e.spinsAdded} ${gameText('freeSpins')}`, t: 0 };
			context.eventEmitter.broadcast({ type: 'soundMedusa', cue: 'ladderUp' });
			context.eventEmitter.broadcast({ type: 'medusaAction', animation: 'react_small' });
		}
		await animate(e.spinsAdded > 0 ? 1100 : 500, (t) => {
			pop = Math.sin(Math.min(1, t * 2) * Math.PI);
			if (banner) banner = { ...banner, t };
		});
		banner = null;
		pop = 0;
	};

	context.eventEmitter.subscribeOnMount({
		serpentLadderShow: (e) => {
			snakes = e.snakes;
			show = true;
		},
		serpentLadderHide: () => (show = false),
		serpentLadderUpdate: async (e) => {
			if (e.snakes === snakes) return;
			snakes = e.snakes;
			context.eventEmitter.broadcast({ type: 'soundMedusa', cue: 'snakeGrow', value: e.snakes });
			await animate(320, (t) => (pop = Math.sin(t * Math.PI)));
			pop = 0;
		},
		serpentLevelUp: levelUp,
	});
</script>

<!-- Always mounted (a late {#if} mount lands on top of every layer in pixi v8). -->
<BoardContainer>
		<Container x={pos.x} y={pos.y} scale={1 + 0.05 * pop} visible={show}>
			<Sprite key="mgLadderPanel" anchor={0.5} width={W} height={H}/>
            {#each Array.from({length:maxSnakes},(_,i)=>i) as i}
             <Sprite key={i < snakes ? 'mgSnakePipOn' : 'mgSnakePipOff'} anchor={.5} x={pipX(i)} y={14} width={13} height={13} scale={i < snakes && i === snakes-1 ? 1+.35*pop : 1}/>
            {/each}
            <Sprite key={(['mgLadderLv1','mgLadderLv2','mgLadderLv3','mgLadderLv4'] as const)[Math.min(3,Math.max(0,level-1))]} anchor={.5} y={-H/2-62} width={82} height={82} visible={banner!==null} alpha={banner ? 1-Math.max(0,banner.t-.6)/.4 : 0} scale={1+.18*pop}/>
			<Text
				anchor={{ x: 0, y: 0.5 }}
				x={-W / 2 + 14}
				y={-12}
				text={`LV ${level}`}
				style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT, fontSize: 20, fill: 0xffe08a, stroke: { color: 0x10272d, width: 4 } }}
			/>
			{#if floor > 0}
				<Text
					anchor={{ x: 1, y: 0.5 }}
					x={W / 2 - 14}
					y={-12}
					text={`MIN ×${floor}`}
					style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT, fontSize: 17, fill: 0xb8ff5a, stroke: { color: 0x10272d, width: 4 } }}
				/>
			{/if}
			{#if banner}
				<Text
					anchor={0.5}
					x={0}
					y={-H / 2 - 112 - 16 * banner.t}
					alpha={1 - Math.max(0, banner.t - 0.6) / 0.4}
					text={banner.text}
					style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT, fontSize: 22, fill: 0xffe08a, stroke: { color: 0x2a1f24, width: 5 } }}
				/>
			{/if}
		</Container>
</BoardContainer>
