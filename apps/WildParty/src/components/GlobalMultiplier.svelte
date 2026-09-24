<script lang="ts" module>
	export type EmitterEventGlobalMultiplier =
		| { type: 'globalMultiplierShow' }
		| { type: 'globalMultiplierHide' }
		| { type: 'globalMultiplierUpdate'; multiplier: number };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import {
		Container,
		Graphics,
		Sprite,
		SpineEventEmitterProvider,
		SpineProvider,
		SpineSlot,
		SpineTrack,
		Text,
	} from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { stateBetDerived } from 'state-shared';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { neonNumberStyle } from '../game/textStyles';

	type AnimationName = 'static' | 'win' | 'reset' | 'increment';

	const PANEL_WIDTH = SYMBOL_SIZE * 0.641;
	const FONT_SIZE = SYMBOL_SIZE * 4.3;
	// odometer row pitch in slot space
	const ROW_H = FONT_SIZE * 1.16;
	const context = getContext();
	const scale = $derived(context.stateLayoutDerived.isStacked() ? 1.28 : 1);
	const desktopPosition = $derived({
		x: context.stateGameDerived.boardLayout().width - PANEL_WIDTH * 1.3,
		y: -SYMBOL_SIZE * 0.47,
	});
	const portraitPosition = $derived({
		x: context.stateGameDerived.boardLayout().width - PANEL_WIDTH * 1.5,
		y: -SYMBOL_SIZE * 0.55,
	});
	const position = $derived(
		context.stateLayoutDerived.isStacked() ? portraitPosition : desktopPosition,
	);

	let show = $state(false);
	let animationName = $state<AnimationName>('static');
	// settled value (used for reset detection); base/rowCount/rollPos drive the wheel
	let multiplier = $state(1);
	let base = $state(1);
	let rowCount = $state(1);
	let rollPos = $state(0);
	let oncomplete = $state(() => {});

	// squash/punch scale, charge/flash glow, landing jolt
	const sq = new Tween(1);
	const glow = new Tween(0);
	const jolt = new Tween(0);

	type SoundName = Parameters<typeof context.eventEmitter.broadcast>[0] extends infer E
		? E extends { type: 'soundOnce'; name: infer N }
			? N
			: never
		: never;
	const sfx = (name: SoundName) => context.eventEmitter.broadcast({ type: 'soundOnce', name });

	// odometer roll: fast spin-up, long deceleration (the slow-mo anticipation
	// beat), slight over-roll, then a smooth settle back onto the target row.
	// Ticks sfx_multiplier_update every row boundary it passes.
	const OVERSHOOT = 0.22;
	const rollTo = (delta: number, durationMs: number) =>
		new Promise<void>((resolve) => {
			const start = performance.now();
			let lastTicked = 0;
			const total = delta + OVERSHOOT;
			const tick = (now: number) => {
				const t = Math.min(1, (now - start) / durationMs);
				if (t < 0.78) {
					const p = t / 0.78;
					rollPos = total * (1 - (1 - p) ** 3);
				} else {
					const p = (t - 0.78) / 0.22;
					rollPos = total - OVERSHOOT * (p * p * (3 - 2 * p));
				}
				const row = Math.min(delta, Math.floor(rollPos));
				if (row > lastTicked) {
					lastTicked = row;
					sfx('sfx_multiplier_update');
				}
				if (t >= 1) {
					rollPos = delta;
					resolve();
					return;
				}
				requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		});

	context.eventEmitter.subscribeOnMount({
		globalMultiplierShow: () => (show = true),
		globalMultiplierHide: () => (show = false),
		globalMultiplierUpdate: async (emitterEvent) => {
			const next = emitterEvent.multiplier;

			if (next === 1 && multiplier !== 1) {
				animationName = 'reset';
				await waitForTimeout(300);
				sfx('sfx_multiplier_reset');
				// Armed before the state that drives the animation — see
				// Transition.svelte for the race this shape produces.
				const settled = waitForResolve<void>((resolve) => {
					oncomplete = resolve;
				});
				multiplier = 1;
				base = 1;
				rowCount = 1;
				rollPos = 0;
				await settled;
				animationName = 'static';
				return;
			}

			if (next <= multiplier) {
				multiplier = next;
				base = next;
				return;
			}

			const ts = stateBetDerived.timeScale();
			const delta = next - multiplier;

			// 1) charge: number crouches, glow gathers, riser plays
			sfx('sfx_anticipation_start');
			glow.set(0.45, { duration: 280 / ts });
			await sq.set(0.82, { duration: 300 / ts, easing: cubicOut });

			// 2) roll: release the crouch into the odometer spin + slow-mo decel
			rowCount = delta + 1;
			sq.set(1, { duration: 140 / ts });
			await rollTo(delta, (620 + 230 * Math.min(delta, 6)) / ts);

			// 3) land: thud + bright ping, flash, punch, panel jolt
			multiplier = next;
			sfx('sfx_multiplier_landing');
			sfx('sfx_multiplier_up');
			glow.set(0.95, { duration: 50 / ts }).then(() => glow.set(0, { duration: 380 / ts }));
			jolt.set(SYMBOL_SIZE * 0.35, { duration: 60 / ts }).then(() =>
				jolt.set(0, { duration: 180 / ts }),
			);
			await sq.set(1.16, { duration: 70 / ts });
			await sq.set(1, { duration: 240 / ts, easing: cubicOut });
			base = next;
			rowCount = 1;
			rollPos = 0;
		},
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container {...position} {scale}>
			<SpineProvider key="globalMultiplier" width={PANEL_WIDTH}>
				<SpineTrack
					trackIndex={0}
					{animationName}
					timeScale={stateBetDerived.timeScale()}
					listener={{
						complete: () => {
							oncomplete();
						},
					}}
				/>
				<SpineEventEmitterProvider>
					<SpineSlot slotName="slot_multi">
						<Container
							y={jolt.current}
							scale={{ x: 1 + (1 - sq.current) * 0.5, y: sq.current }}
						>
						<!-- charge/flash glow sits outside the wheel mask -->
						<Sprite
							key="fxGlow"
							anchor={0.5}
							tint={0xffe9a8}
							blendMode="add"
							width={ROW_H * 2.6}
							height={ROW_H * 1.8}
							alpha={glow.current}
						/>
						<Container>
							<Graphics
								isMask
								draw={(g) => {
									g.rect(-ROW_H * 1.6, -ROW_H * 0.62, ROW_H * 3.2, ROW_H * 1.24).fill(0xffffff);
								}}
							/>
							{#each Array.from({ length: rowCount }) as _, i (i)}
								{@const y = (i - rollPos) * ROW_H}
								{#if Math.abs(y) < ROW_H * 1.5}
									<Text
										anchor={0.5}
										{y}
										text={`${base + i}×`}
										style={neonNumberStyle(FONT_SIZE)}
									/>
								{/if}
							{/each}
						</Container>
					</Container>
				</SpineSlot>
				</SpineEventEmitterProvider>
			</SpineProvider>
		</Container>
	</BoardContainer>
</FadeContainer>
