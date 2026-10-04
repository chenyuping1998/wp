<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { verticalFill } from '../game/gradientFill';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Container, Graphics, Sprite, Text, getContextApp } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import PlaqueMesh from './PlaqueMesh.svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, HOLD_AND_SPIN_MODE_KEY } from '../game/constants';
	import { gameText } from '../game/i18nText';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	// brass plaque left of the board (fs_counter_panel.png, 824×622)
	const PANEL_RATIO = 824 / 622;
	const panelWidth = $derived(SYMBOL_SIZE * 2.1);
	const panelSizes = $derived({ width: panelWidth, height: panelWidth / PANEL_RATIO });
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const position = $derived(
		isPortrait
			? {
					// portrait: centered above the board (no room at the side)
					x: context.stateGameDerived.boardLayout().x - panelSizes.width * 0.5,
					y:
						context.stateGameDerived.boardLayout().y -
						context.stateGameDerived.boardLayout().height * 0.5 -
						panelSizes.height * 1.28 -
						SYMBOL_SIZE * 0.3,
				}
			: {
					x:
						context.stateGameDerived.boardLayout().x -
						context.stateGameDerived.boardLayout().width * 0.5 -
						panelSizes.width -
						SYMBOL_SIZE * 0.6,
					// Pinned near the top of the screen rather than to the board's top
					// edge. With the side-rail UI the Buy Bonus button is centred in
					// the left rail, and the board now fills 94% of the height — the
					// old board-relative position put this plaque straight through it.
					y: context.stateLayoutDerived.mainLayout().height * 0.05,
				},
	);

	// ── IT HANGS (2026-09-27) ────────────────────────────────────────────────
	//
	// The plaque was screwed to nothing — a plate floating beside the board. It
	// now hangs from a hook on a short chain, two chains in a V down to its top
	// rivets, and it is a PENDULUM: every spin spent knocks it and it swings
	// and settles; spins added hit it hard, it swings wide and the plate
	// squashes on its chains. Between knocks it sways a little in the wind off
	// the water, so it is never dead still through a feature.
	//
	// The swing is rigid (the whole assembly turns about the top of the chain);
	// the plate's lower edge LAGS the swing through a mesh (PlaqueMesh) — the
	// plate turns a touch more at the bottom than at the top while it moves.
	//
	// Plate-local coordinates: the texture's box, (0,0) at its top-left. The
	// rivets are at (108, 155) and (1172, 155) of the 1280x966 art.
	const RIVET = { x: 108 / 1280, y: 155 / 966 };
	const hookY = $derived(-panelSizes.height * 0.1);
	// how far above the plate the chain is fixed: in landscape, the top of the
	// screen (the plaque is pinned near it); in portrait, a short drop
	const lift = $derived(isPortrait ? panelSizes.height * 0.34 : Math.max(position.y + 12, panelSizes.height * 0.2));

	// the pendulum, in radians; and the squash spring
	let angle = $state(0);
	let bend = $state(0);
	let squash = $state(0);
	let omega = 0;
	let squashV = 0;
	let side = 1;
	const SWING_HZ = 0.85;
	const K = (2 * Math.PI * SWING_HZ) ** 2;
	const C = 2 * 0.1 * Math.sqrt(K);
	const SQ_K = (2 * Math.PI * 4.5) ** 2;
	const SQ_C = 2 * 0.22 * Math.sqrt(SQ_K);
	const kick = (strength: number) => {
		// alternate sides, so a run of spins does not always push it one way
		side = -side;
		omega += side * (strength > 0.5 ? 0.85 : 0.3);
		if (strength > 0.5) squashV += 7;
	};

	const app = getContextApp();
	onMount(() => {
		const ticker = app.stateApp.pixiApplication?.ticker;
		let t = 0;
		const tick = () => {
			const dt = Math.min(0.05, (ticker?.deltaMS ?? 16) / 1000);
			t += dt;
			// a slow sway it is always being pushed toward: wind, not a clock
			const target = 0.013 * Math.sin((2 * Math.PI * t) / 3.4) + 0.006 * Math.sin((2 * Math.PI * t) / 1.9);
			omega += (-K * (angle - target) - C * omega) * dt;
			angle += omega * dt;
			squashV += (-SQ_K * squash - SQ_C * squashV) * dt;
			squash += squashV * dt;
			// the bottom lags what the top is doing
			bend = Math.max(-0.06, Math.min(0.06, -omega * 0.11));
		};
		ticker?.add(tick);
		return () => ticker?.remove(tick);
	});

	// the chains: a hook-to-rivet V and the drop from the fixing to the hook,
	// drawn as links, alternately face-on and edge-on
	const drawChains = (g: PixiGraphics) => {
		g.clear();
		const w = panelSizes.width, h = panelSizes.height;
		const hook = { x: w / 2, y: hookY };
		const link = Math.max(6, w * 0.045);
		const chain = (ax: number, ay: number, bx: number, by: number) => {
			const len = Math.hypot(bx - ax, by - ay);
			const n = Math.max(2, Math.round(len / (link * 0.72)));
			const ux = (bx - ax) / len, uy = (by - ay) / len;
			for (let i = 0; i < n; i++) {
				const cx = ax + ux * (i + 0.5) * (len / n), cy = ay + uy * (i + 0.5) * (len / n);
				const along = link * 0.55, across = i % 2 ? link * 0.12 : link * 0.3;
				const pts: number[] = [];
				for (let k = 0; k < 14; k++) {
					const a = (k / 14) * Math.PI * 2;
					const ex = Math.cos(a) * along, ey = Math.sin(a) * across;
					pts.push(cx + ex * ux - ey * uy, cy + ex * uy + ey * ux);
				}
				g.poly(pts);
				g.stroke({ width: Math.max(2, link * 0.16), color: i % 2 ? 0x8a5a1c : 0xd8a334, alpha: 1 });
			}
		};
		chain(w / 2, -lift, hook.x, hook.y);
		chain(hook.x, hook.y, w * RIVET.x, h * RIVET.y);
		chain(hook.x, hook.y, w * (1 - RIVET.x), h * RIVET.y);
		// the hook itself: a brass ring
		g.circle(hook.x, hook.y, link * 0.45);
		g.stroke({ width: Math.max(3, link * 0.22), color: 0xffd75e, alpha: 1 });
	};

	let show = $state(false);
	// `current` = spins USED + 1 (set by the updateFreeSpin handler); `total` = window size
	let current = $state(1);
	let total = $state(0);

	const isSuperspin = $derived(stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY);
	// hold and spin: what matters is how many respins REMAIN
	// (3 → 2 → 1, snapping back to 3 whenever a coin lands)
	const remaining = $derived(Math.max(0, total - (current - 1)));
	const title = $derived(isSuperspin ? gameText('respins') : gameText('freeSpins'));

	// ── the counter MOVES ────────────────────────────────────────────────────
	//
	// It was a static readout: the number changed between spins and nothing else
	// happened, including on a retrigger, the one moment in the feature where the
	// player is being handed something. A spin being spent gets a small knock;
	// spins being ADDED get a hard punch and a light wash over the plaque, because
	// those are two different pieces of news.
	let punchAt = $state(0);
	let punchForce = $state(0);
	let now = $state(0);
	let clock = 0;

	const PUNCH_MS = 520;

	const knock = (force: number) => {
		punchAt = Date.now();
		punchForce = force;
		now = punchAt;
		clearInterval(clock);
		// a timer rather than requestAnimationFrame: rAF stops dead in a hidden
		// tab, and this runs unattended through a whole feature
		clock = setInterval(() => {
			now = Date.now();
			if (now - punchAt > PUNCH_MS) {
				clearInterval(clock);
				clock = 0;
			}
		}, 16) as unknown as number;
	};

	$effect(() => () => clearInterval(clock));

	// 1 -> 0 over PUNCH_MS, springy at the start
	const punch = $derived.by(() => {
		const p = (now - punchAt) / PUNCH_MS;
		if (punchAt === 0 || p < 0 || p > 1) return 0;
		return Math.sin(p * Math.PI) * (1 - p) * punchForce;
	});

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			const gained = emitterEvent.total !== undefined && emitterEvent.total > total && total > 0;
			const spent = emitterEvent.current !== undefined && emitterEvent.current !== current;
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
			if (gained) {
				knock(1);
				kick(1);
			} else if (spent) {
				knock(0.38);
				kick(0.38);
			}
		},
	});

	// hold-and-spin pips: one slot per respin in the window, lit while still available
	const drawPips = (g: PixiGraphics) => {
		g.clear();
		if (!isSuperspin || total <= 0) return;
		const gap = panelSizes.width * 0.14;
		const startX = panelSizes.width * 0.5 - ((total - 1) * gap) / 2;
		const y = panelSizes.height * 0.78;
		for (let i = 0; i < total; i++) {
			const lit = i < remaining;
			// PIXI v8 API, and this was a READOUT being drawn wrong, not just a
			// weaker effect: lit and unlit pips differ only by fill colour, and the
			// v7 shim gives every shape in the Graphics the last fill — so all the
			// pips came out the same and the player could not count their remaining
			// respins off the plaque at all.
			g.circle(startX + i * gap, y, panelSizes.width * 0.035);
			// unlit is the plaque's own steel, not the jungle olive it used to be —
			// an empty socket in the plate rather than a dark green dot on it
			g.fill({ color: lit ? 0xffd75e : 0x26323b, alpha: lit ? 1 : 0.85 });
			g.stroke({ width: 2, color: 0x54330a, alpha: 1 });
		}
	};
</script>

<MainContainer>
	<!-- hung from the top of its chain: everything below turns about it -->
	<FadeContainer {show} x={position.x + panelSizes.width / 2} y={position.y - lift}>
		<Container rotation={angle}>
		<!-- squashes about the plate's top edge, where the chains take it -->
		<Container y={lift} scale={{ x: 1 + 0.3 * squash, y: 1 - 0.3 * squash }}>
		<Container x={-panelSizes.width / 2}>
		<Graphics draw={drawChains} />
		<!-- its own container: PlaqueMesh adds to its parent's end, and it must
		     draw under the title and the count -->
		<Container>
			<PlaqueMesh
				key="gbFsPanel"
				width={panelSizes.width}
				height={panelSizes.height}
				pivotX={panelSizes.width / 2}
				pivotY={-lift}
				{bend}
			/>
		</Container>

		<!-- title on the upper plank area, auto-shrunk for long locales -->
		<Text
			anchor={0.5}
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.33}
			text={title}
			style={{
				fontFamily: GAME_FONT,
				fontSize: Math.min(panelSizes.width * 0.115, (panelSizes.width * 1.35) / Math.max(1, title.length)),
				fontWeight: GAME_FONT_WEIGHT,
				letterSpacing: 2,
				fill: verticalFill(
					[0xfff3bd, 0xffd75e, 0xc9821a],
					Math.min(panelSizes.width * 0.115, (panelSizes.width * 1.35) / Math.max(1, title.length)),
				),
				stroke: 0x54330a,
				strokeThickness: 4,
				wordWrap: false,
			}}
		/>

		<!-- the plaque takes the news too: a light wash on a retrigger, a hint of
		     one when a spin is spent -->
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.5}
			width={panelSizes.width * 1.5}
			height={panelSizes.height * 1.9}
			tint={0xffd75e}
			blendMode="add"
			alpha={0.42 * punch}
		/>

		{#if isSuperspin}
			<!-- big remaining-respins number (the hold'n'spin heartbeat) -->
			<Container x={panelSizes.width * 0.5} y={panelSizes.height * 0.55} scale={1 + 0.26 * punch}>
				<GoldText x={0} y={0} text={remaining} fontSize={panelSizes.width * 0.3} />
			</Container>
			<Graphics draw={drawPips} />
		{:else}
			<!-- free game: current spin of total -->
			<Container x={panelSizes.width * 0.5} y={panelSizes.height * 0.58} scale={1 + 0.26 * punch}>
				<GoldText
					x={0}
					y={0}
					text={`${Math.min(current, total)} / ${total}`}
					fontSize={panelSizes.width * 0.19}
					maxWidth={panelSizes.width * 0.72}
				/>
			</Container>
		{/if}
		</Container>
		</Container>
		</Container>
	</FadeContainer>
</MainContainer>
