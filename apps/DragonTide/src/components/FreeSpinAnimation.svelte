<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Sprite, type Sizes } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { keyframes } from '../game/keyframes';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import geometry from '../game/artGeometry.json';

	// The plaque (mgFsSign) swings in like 天使奧丁's FG_Board_Start In
	// (research/xinstar-angelodin docs/anim_keys.md): from -35° it overshoots to
	// +2° at 0.38 s, back to -0.3° and rests at 0.75 s, while it grows in.
	// Children render centred on its interior and get the panel clock `ms`, so
	// the title and the count can run their own bounces on the same clock.
	type Props = {
		children: Snippet<[{ sizes: Sizes; ms: number }]>;
		/** intro: the four palace doors round the plaque; outro: the gold water gate */
		sign?: 'intro' | 'outro';
	};

	const props: Props = $props();

	const context = getContext();
	// Both panels share a 1706x922 canvas; the cream plaque inside each is measured on the
	// art (build_final_art.py) and the text block is fitted to it.
	const SIGN_SOURCE = { width: 1706, height: 922 };
	const SIGN_RATIO = SIGN_SOURCE.width / SIGN_SOURCE.height;
	const SIGN_WIDTH = SYMBOL_SIZE * BOARD_DIMENSIONS.x * 1.06;
	const SIGN_SIZES = { width: SIGN_WIDTH, height: SIGN_WIDTH / SIGN_RATIO };
	const well = $derived(props.sign === 'outro' ? geometry.fsOutro : geometry.fsIntro);
	const TEXT_AREA = $derived({ width: SIGN_SIZES.width * well.w * 0.94, height: SIGN_SIZES.height * well.h * 0.94 });
	// how far the plaque's centre sits from the sprite's centre
	const TEXT_OFFSET_Y = $derived(SIGN_SIZES.height * (well.y - 0.5));
	const DEG = Math.PI / 180;
	let ms = $state(0);
	const rotation = $derived(keyframes(ms, [[0, -35 * DEG], [380, 2 * DEG], [560, -0.3 * DEG], [750, 0]]));
	const scale = $derived(keyframes(ms, [[0, 0.55], [380, 1.03], [560, 0.995], [750, 1]]));
	const alpha = $derived(keyframes(ms, [[0, 0], [170, 1]]));

	onMount(() => {
		let raf = 0;
		let last = performance.now();
		const tick = (now: number) => {
			ms += Math.min(100, Math.max(0, now - last));
			last = now;
			if (ms < 2000) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y}
		{rotation}
		{scale}
		{alpha}
	>
		<Sprite key={props.sign === 'outro' ? 'mgFsSignOut' : 'mgFsSign'} anchor={0.5} {...SIGN_SIZES} />
		<!-- children sit centred on the measured interior -->
		<Container y={TEXT_OFFSET_Y}>
			{@render props.children({ sizes: TEXT_AREA, ms })}
		</Container>
	</Container>
</MainContainer>
