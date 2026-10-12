<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Graphics, type Sizes } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { SIGN } from '../game/meshWin';
	import { SIGN_CANVAS, signTextOffset, type SignEnv } from '../game/meshWin/fsSign';
	import type { Pose, Rig } from '../game/meshWin/meshRig';
	import PropMesh from './PropMesh.svelte';

	// Neon report sign: one physical landing, then its border powers on in two
	// directions. The count-up drives a small travelling current along that border.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
		counting?: boolean;
		finishAt?: number;
	};

	const props: Props = $props();

	const context = getContext();
	const SIGN_RATIO = 920 / 720;
	const SIGN_WIDTH = SYMBOL_SIZE * BOARD_DIMENSIONS.x * 0.98;
	const SIGN_SIZES = { width: SIGN_WIDTH, height: SIGN_WIDTH / SIGN_RATIO };
	// inner plank area (in sign source pixels 100..820 × 130..670) mapped to sprite space
	const TEXT_AREA = {
		width: SIGN_SIZES.width * (720 / 920),
		height: SIGN_SIZES.height * (540 / 720),
	};

	const dropY = new Tween(-SIGN_SIZES.height * 1.2);
	const swing = new Tween(0);

	// The sign's MESH (game/meshWin/fsSign.ts): it lands — the board squashes,
	// the planks rattle top to bottom — then breathes. Its clock starts with
	// the drop, which fsSign.SIGN_LAND_MS is timed against. setInterval, not
	// the frame loop, like the other meshes: it keeps time in a hidden tab.
	let signEnv = $state<SignEnv>({ t: 0 });
	// the text rides the middle plank
	let textOffset = $state({ x: 0, y: 0 });
	const UNIT = SIGN_SIZES.width / SIGN_CANVAS[0];
	const onpose = (rig: Rig, pose: Pose) => {
		const [x, y] = signTextOffset(rig, pose);
		textOffset = { x: x * UNIT, y: y * UNIT };
	};
	const ease = (value: number) => {
		const t = Math.max(0, Math.min(1, value));
		return t * t * (3 - 2 * t);
	};
	const drawCircuit = (g: PixiGraphics) => {
		g.clear();
		const w = SIGN_SIZES.width;
		const h = SIGN_SIZES.height;
		const left = -w * 0.39;
		const right = w * 0.39;
		const top = -h * 0.355;
		const bottom = h * 0.355;
		const litTop = ease((signEnv.t - 300) / 370);
		const litBottom = ease((signEnv.t - 405) / 390);
		if (litTop > 0) {
			g.moveTo(left, top).lineTo(left + (right - left) * litTop, top)
				.stroke({ width: 3, color: 0x59e3ff, alpha: 0.52 });
		}
		if (litBottom > 0) {
			g.moveTo(right, bottom).lineTo(right - (right - left) * litBottom, bottom)
				.stroke({ width: 3, color: 0xff3fd0, alpha: 0.45 });
		}
		if (props.counting && signEnv.t > 760) {
			const phase = ((signEnv.t - 760) % 1080) / 1080;
			const x = left + (right - left) * phase;
			const length = w * 0.075;
			g.moveTo(Math.max(left, x - length), top).lineTo(x, top)
				.stroke({ width: 12, color: 0x59e3ff, alpha: 0.18, cap: 'round' });
			g.moveTo(Math.max(left, x - length), top).lineTo(x, top)
				.stroke({ width: 3, color: 0xe8fbff, alpha: 0.8, cap: 'round' });
		}
		const finishAge = props.finishAt && props.finishAt > 0 ? Date.now() - props.finishAt : Infinity;
		if (finishAge >= 0 && finishAge < 620) {
			// Four contacts answer the amount's final hit, once, in order.
			for (const [index, x, y, dx, dy] of [
				[0, left, top, -1, -1], [1, right, top, 1, -1],
				[2, right, bottom, 1, 1], [3, left, bottom, -1, 1],
			] as const) {
				const age = finishAge - index * 65;
				if (age < 0 || age > 400) continue;
				const flash = (1 - age / 400) ** 2;
				g.circle(x, y, w * 0.05).fill({ color: 0xff3fd0, alpha: 0.16 * flash });
				g.circle(x, y, w * 0.018).fill({ color: 0xe8fbff, alpha: 0.8 * flash });
				g.moveTo(x + dx * 8, y + dy * 8)
					.lineTo(x + dx * (19 + age * 0.035), y + dy * (19 + age * 0.035))
					.stroke({ width: 2.5, color: 0x59e3ff, alpha: 0.7 * flash, cap: 'round' });
			}
		}
	};

	onMount(() => {
		const started = Date.now();
		const clock = setInterval(() => (signEnv = { t: Date.now() - started }), 16);
		dropY.set(0, { duration: 700, easing: backOut });
		(async () => {
			await swing.set(0.018, { duration: 220, easing: cubicOut, delay: 260 });
			await swing.set(-0.008, { duration: 290, easing: cubicOut });
			await swing.set(0, { duration: 300, easing: cubicOut });
		})();
		return () => clearInterval(clock);
	});
</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y + dropY.current}
		rotation={swing.current}
	>
		<!-- drawn through its mesh (game/meshWin/fsSign.ts), same box -->
		<PropMesh spec={SIGN} env={signEnv} anchor={0.5} {...SIGN_SIZES} {onpose} />
		<Graphics draw={drawCircuit} />
		<!-- children sit centered on the plank area (slightly below the emblem),
		     riding the middle plank as it rattles -->
		<Container x={textOffset.x} y={SIGN_SIZES.height * 0.06 + textOffset.y}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>
