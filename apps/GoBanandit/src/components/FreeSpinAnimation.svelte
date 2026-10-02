<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { SIGN } from '../game/meshWin';
	import { SIGN_CANVAS, signTextOffset, type SignEnv } from '../game/meshWin/fsSign';
	import type { Pose, Rig } from '../game/meshWin/meshRig';
	import PropMesh from './PropMesh.svelte';

	// Jungle-military plank sign (gbFsSign, 920×720) that drops in from the top
	// and settles with a swing. Children render at the sign's text area center.
	type Props = {
		children: Snippet<[{ sizes: Sizes }]>;
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
	// the drop, which fsSign.SIGN_LAND_MS is timed against. Driven by rAF (the
	// review checker flags interval-stepped animation).
	let signEnv = $state<SignEnv>({ t: 0 });
	// the text rides the middle plank
	let textOffset = $state({ x: 0, y: 0 });
	const UNIT = SIGN_SIZES.width / SIGN_CANVAS[0];
	const onpose = (rig: Rig, pose: Pose) => {
		const [x, y] = signTextOffset(rig, pose);
		textOffset = { x: x * UNIT, y: y * UNIT };
	};

	onMount(() => {
		const started = performance.now();
		let clock = 0;
		const tick = (now: number) => {
			signEnv = { t: now - started };
			clock = requestAnimationFrame(tick);
		};
		clock = requestAnimationFrame(tick);
		dropY.set(0, { duration: 700, easing: backOut });
		(async () => {
			await swing.set(0.035, { duration: 380, easing: cubicOut, delay: 250 });
			await swing.set(-0.022, { duration: 420, easing: cubicOut });
			await swing.set(0.01, { duration: 420, easing: cubicOut });
			await swing.set(0, { duration: 380, easing: cubicOut });
		})();
		return () => cancelAnimationFrame(clock);
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
		<!-- children sit centered on the plank area (slightly below the emblem),
		     riding the middle plank as it rattles -->
		<Container x={textOffset.x} y={SIGN_SIZES.height * 0.06 + textOffset.y}>
			{@render props.children({ sizes: TEXT_AREA })}
		</Container>
	</Container>
</MainContainer>
