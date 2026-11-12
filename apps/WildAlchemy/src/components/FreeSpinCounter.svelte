<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { DISPLAY_FONT, DISPLAY_FONT_WEIGHT, TITLE_FONT, TITLE_FONT_WEIGHT } from '../game/fonts';
	import { canvasLine, gameText } from '../game/i18nText';
	import { HUD_ART } from '../game/assetsHud';
	import { hudLayout } from '../game/hudLayout';
	import GoldText from './GoldText.svelte';

	// FREE SPINS n / N on the dark-field brass plaque (ui-fs-counter-b). Placed by
	// game/hudLayout.ts with the rest of the feature HUD: under the flask in the
	// left column on landscape, under the ladder in the portrait strip. Both
	// lines sit inside the plaque's dark field.
	const context = getContext();
	const box = $derived(hudLayout(context).counter);

	let show = $state(false);
	// `current` = spins used + 1 (set by the updateFreeSpin handler); `total` = window size
	let current = $state(1);
	let total = $state(0);
	/** the +3 lands as a short pop on the number */
	let bump = $state(0);
	let bumpRaf = 0;
	const startBump = () => {
		cancelAnimationFrame(bumpRaf);
		const start = performance.now();
		const frame = (now: number) => {
			const p = Math.min(1, (now - start) / 420);
			bump = Math.sin(Math.PI * p);
			if (p < 1) bumpRaf = requestAnimationFrame(frame);
		};
		bumpRaf = requestAnimationFrame(frame);
	};

	const title = canvasLine(gameText('freeSpins'));

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) {
				if (show && total > 0 && emitterEvent.total > total) startBump();
				total = emitterEvent.total;
			}
		},
	});

	const fieldW = $derived(box.width * HUD_ART.fsCounter.fieldW);
	const fieldH = $derived(box.height * HUD_ART.fsCounter.fieldH);
	const cy = $derived(box.height * HUD_ART.fsCounter.fieldCy);
</script>

<MainContainer>
	<FadeContainer {show} x={box.x} y={box.y}>
		<Sprite key="waFsCounter" width={box.width} height={box.height} />
		<GoldText
			x={box.width / 2}
			y={cy - fieldH * 0.25}
			text={title}
			fontSize={fieldH * 0.34}
			maxWidth={fieldW}
			letterSpacing={2}
			fill={0xc9ac78}
			fontFamily={TITLE_FONT}
			fontWeight={TITLE_FONT_WEIGHT}
		/>
		<Container x={box.width / 2} y={cy + fieldH * 0.2} scale={1 + 0.18 * bump}>
			<GoldText
				text={`${Math.min(Math.max(current, 0), total)} / ${total}`}
				fontSize={fieldH * 0.5}
				maxWidth={fieldW}
				fontFamily={DISPLAY_FONT}
				fontWeight={DISPLAY_FONT_WEIGHT}
			/>
		</Container>
	</FadeContainer>
</MainContainer>
