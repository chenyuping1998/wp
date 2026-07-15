<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';
	import rig from '../game/hostessParts.json';

	const context = getContext();

	const IMG_W = rig.imageWidth;
	const IMG_H = rig.imageHeight;
	const ASPECT = IMG_W / IMG_H;
	// lavender grade pulling the artwork toward the scene palette
	const GRADE = 0xf2e9fb;
	// approximate champagne-glass mouth in sprite space (from bottom-center anchor)
	const GLASS_OFFSET = { x: -0.38, y: -0.85 };

	const layout = $derived.by(() => {
		const board = context.stateGameDerived.boardLayout();
		const main = context.stateLayoutDerived.mainLayout();
		const canvas = context.stateLayoutDerived.canvasSizes();
		// feet on the visible canvas bottom edge, head near the canvas top —
		// the figure fills the whole right side (full body always visible
		// because the height is derived from the visible canvas itself)
		const visibleHeight = canvas.height / main.scale;
		const feetY = main.height * 0.5 + visibleHeight * 0.5;
		const height = visibleHeight * 0.94;
		const width = height * ASPECT;
		return {
			width,
			height,
			// just clear of the reel frame's right edge
			x: board.x + board.width * 0.5 + SYMBOL_SIZE * 0.9 + width * 0.45,
			y: feetY,
		};
	});

	let now = $state(0);
	let toastStart = -1;
	// eased 0→1 excitement while in free games: livelier idle, brighter rim
	let excite = $state(0);
	let sparkles = $state<{ id: number; born: number; dx: number; dy: number }[]>([]);
	let nextSparkleAt = 0;
	let nextSparkleId = 0;

	onMount(() => {
		let raf = 0;
		const tick = (t: number) => {
			now = t;
			const exciteTarget = context.stateGame.gameType === 'freegame' ? 1 : 0;
			excite += (exciteTarget - excite) * 0.03;
			if (t >= nextSparkleAt) {
				// occasional champagne-bubble glint at the glass
				sparkles = [
					...sparkles.filter(({ born }) => t - born < 700),
					{
						id: nextSparkleId++,
						born: t,
						dx: (Math.random() - 0.5) * 0.05,
						dy: (Math.random() - 0.5) * 0.04,
					},
				];
				nextSparkleAt = t + 2400 - 1300 * excite + Math.random() * 1800;
			} else {
				const alive = sparkles.filter(({ born }) => t - born < 700);
				if (alive.length !== sparkles.length) sparkles = alive;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// raise-the-glass toast on wins (subtle — a swirl from the wrist).
	// boardWithAnimateSymbols fires on EVERY win presentation; winShow only
	// on big-tier pop-ups. Debounced: the FG trigger celebration replays the
	// scatter shake three times — she should toast once, not three times.
	const startToast = () => {
		if (toastStart >= 0 && now - toastStart < 3500) return;
		toastStart = now;
	};
	context.eventEmitter.subscribeOnMount({
		boardWithAnimateSymbols: () => startToast(),
		winShow: () => startToast(),
	});

	const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;
	const smooth = (p: number) => p * p * (3 - 2 * p);

	// idle: breathing + weight sway (whole figure), lagged head tilt, glass
	// micro-swirl; all amplitudes kept small so the cut seams stay hidden
	const pose = $derived.by(() => {
		const breath = Math.sin((now / 3100) * Math.PI * 2);
		const sway = Math.sin((now / 5400) * Math.PI * 2);
		// extra quick bob layered on during free games (amps scale with excite
		// rather than changing base periods, so the mode switch never pops)
		const bob = excite * 0.004 * Math.sin((now / 1400) * Math.PI * 2);

		// toast envelope shared by the glass lift and the head lean
		let toast = 0;
		if (toastStart >= 0) {
			const t = (now - toastStart) / 1000;
			if (t < 0.3) toast = easeOutCubic(t / 0.3);
			else if (t < 1.3) toast = 1;
			else if (t < 2.0) toast = 1 - smooth((t - 1.3) / 0.7);
		}

		// head follows the body sway late (follow-through) + its own slow nod;
		// leans toward the glass during the toast
		const headRot =
			(0.032 * Math.sin((now / 5400) * Math.PI * 2 - 0.9) +
				0.012 * Math.sin((now / 2300) * Math.PI * 2)) *
				(1 + 0.4 * excite) -
			0.06 * toast;

		const glassRot =
			0.03 * (1 + 1.1 * excite) * Math.sin((now / 3900) * Math.PI * 2 + 0.6) + 0.24 * toast;

		return {
			scaleX: 1 - 0.004 * breath,
			scaleY: 1 + 0.007 * (1 + 0.4 * excite) * breath + bob,
			rotation: 0.014 * (1 + 0.6 * excite) * sway,
			headRot,
			glassRot,
			rimAlpha: 0.5 + 0.24 * excite,
		};
	});

	const sparkleState = (born: number) => {
		const p = Math.min(1, (now - born) / 700);
		return {
			size: SYMBOL_SIZE * 0.34 * Math.sin(p * Math.PI),
			alpha: Math.sin(p * Math.PI),
			rot: p * 1.8,
		};
	};

	// image-pixel → figure-local placement for a rig part, pivot at its joint
	const partPlacement = (part: { x: number; y: number; w: number; h: number; pivotX: number; pivotY: number }, s: number) => ({
		anchor: { x: (part.pivotX - part.x) / part.w, y: (part.pivotY - part.y) / part.h },
		x: (part.pivotX - IMG_W / 2) * s,
		y: (part.pivotY - IMG_H) * s,
		width: part.w * s,
		height: part.h * s,
	});
</script>

{#if ['desktop', 'landscape'].includes(context.stateLayoutDerived.layoutType())}
	<MainContainer>
		<Container
			x={layout.x}
			y={layout.y}
			scale={{ x: pose.scaleX, y: pose.scaleY }}
			rotation={pose.rotation}
		>
			{@const s = layout.height / IMG_H}
			<!-- soft ground-contact shadow so she doesn't float on the scene -->
			<Sprite
				key="fxGlow"
				anchor={0.5}
				y={-layout.width * 0.02}
				tint={0x000000}
				width={layout.width * 1.15}
				height={layout.width * 0.28}
				alpha={0.38}
			/>
			<!-- magenta rim light: additive copies peeking out on the lit side.
			     Body and head each get their own rim that follows the part — a
			     single full-figure rim would show through the body's part
			     holes as a ghost copy. The glass gets NO rim: an offset copy
			     of a translucent flute reads as a double image -->
			{#each [{ key: 'partyHostessBody', rotation: 0, placement: null }, { key: 'partyHostessHead', rotation: pose.headRot, placement: rig.parts.head }] as rim (rim.key)}
				<Sprite
					key={rim.key}
					{...(rim.placement
						? partPlacement(rim.placement, s)
						: { anchor: { x: 0.5, y: 1 }, width: layout.width, height: layout.height })}
					x={(rim.placement ? (rim.placement.pivotX - IMG_W / 2) * s : 0) - layout.width * 0.022}
					y={(rim.placement ? (rim.placement.pivotY - IMG_H) * s : 0) - layout.height * 0.006}
					rotation={rim.rotation}
					tint={0xb04ef0}
					blendMode="add"
					alpha={pose.rimAlpha}
				/>
			{/each}
			<!-- 2.5D rig: body base + glass (wrist pivot) + head (neck pivot) -->
			<Sprite
				key="partyHostessBody"
				anchor={{ x: 0.5, y: 1 }}
				width={layout.width}
				height={layout.height}
				tint={GRADE}
			/>
			<Sprite
				key="partyHostessGlass"
				{...partPlacement(rig.parts.glass, s)}
				rotation={pose.glassRot}
				tint={GRADE}
			/>
			<Sprite
				key="partyHostessHead"
				{...partPlacement(rig.parts.head, s)}
				rotation={pose.headRot}
				tint={GRADE}
			/>
			{#each sparkles as sparkle (sparkle.id)}
				{@const state = sparkleState(sparkle.born)}
				<Sprite
					key="fxStar"
					anchor={0.5}
					x={layout.width * (GLASS_OFFSET.x + sparkle.dx)}
					y={layout.height * (GLASS_OFFSET.y + sparkle.dy)}
					rotation={state.rot}
					tint={0xffe9a8}
					blendMode="add"
					width={state.size}
					height={state.size}
					alpha={state.alpha}
				/>
			{/each}
		</Container>
	</MainContainer>
{/if}
