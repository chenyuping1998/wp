<script lang="ts">
	/**
	 * One cast figure standing in the band beside the board (2026-11-10): the old
	 * alchemist in the main game, the homunculus in the free games. Spine 4.3
	 * rigs from spine-motion-kit (stand34 robe template, flask motion set) run on
	 * the vendored 4.3 runtime (game/castSpine43.ts); nothing is baked.
	 *
	 * Cues (stateGame.castReaction, SPEC §4 / §2.3–2.4) → clips:
	 *   transIn    trans_in → trans_loop (free games: second set half the time)
	 *   transOut   trans_out; its `cast_release` event (0.2 s) empties the
	 *              figure's place, as in the reference
	 *   transBack  fades back in on trans_back → idle
	 *   win01…03   win_01 / win_02 / win_025 / win_03 → idle (a rig without the
	 *              clip plays the nearest it has)
	 */
	import { AlphaFilter, Graphics, type Texture } from 'pixi.js';
	import { getContextApp } from 'pixi-svelte';
	import { featureTimeScale } from '../game/timeScale';

	import { getContext } from '../game/context';
	import { CastSpine43 } from '../game/castSpine43';
	import { CAST_PREFIX, loadCast, type CastMeasure, type CastWho } from '../game/castRig43';
	import { stateGame, type CastCue } from '../game/stateGame.svelte';
	import { uiTheme } from 'components-ui-pixi';

	type Props = {
		who: CastWho;
		/** top of the figure's art box, standard-box y */
		topY: number;
		/** standard-box height of the figure's art box (the ink is 0.82 of it) */
		height: number;
		/** the board ink edge on the figure's side, standard-box x */
		innerEdge: number;
	};
	const props: Props = $props();
	const app = getContextApp();
	const context = getContext();
	const std = $derived(context.stateLayoutDerived.mainLayoutStandard());

	const BOARD_GAP = 40; // standard px kept clear between the housing and anything the figure does
	const SCREEN_GAP = 12;
	// The spin dial stands this far (standard px) above the bar's nominal top. The soles rest just above it,
	// so no control covers the figure at any landscape size (acceptance 2026-11-11: on the bar's edge the dial
	// hid the whole front boot). A soft contact shadow under the feet keeps the figure on the floor.
	const DIAL_RISE = 38;
	const FADE_OUT_S = 0.12;
	const FADE_IN_S = 0.35;

	const textures = $derived.by(() => {
		const assets = app.stateApp.loadedAssets as Record<string, unknown> | undefined;
		if (!assets?.[`${CAST_PREFIX[props.who]}torso`]) return null;
		return (name: string) => assets[name] as Texture | undefined;
	});

	let figure = $state<CastSpine43 | null>(null);
	let shadow: Graphics | null = null;
	let measure = $state<CastMeasure | null>(null);
	let clips = new Set<string>();
	let targetAlpha = 1;
	let secondSet = false;

	$effect(() => {
		const who = props.who;
		const texture = textures;
		const pixi = app.stateApp.pixiApplication;
		if (!texture || !pixi) return;
		let disposed = false;
		let mounted: CastSpine43 | null = null;
		let last = performance.now();
		let shown = 1;
		let filtered = false;
		const fade = new AlphaFilter({ alpha: 1 });
		const fadeFilters = [fade];
		const tick = () => {
			if (!mounted) return;
			const now = performance.now();
			const dt = Math.min(0.1, (now - last) / 1000);
			last = now;
			// the reference plays its cast videos at full length in turbo too (timeScale.ts)
			mounted.state.timeScale = mounted.current() === 'idle' ? 1 : featureTimeScale();
			mounted.update(now);
			const view = mounted.view;
			// The figure is ~22 overlapping layers: fading the container's own alpha lets the hidden ones
			// (legs behind the robe, the sleeve behind the chest) show through. It is flattened first and the
			// whole picture is faded as one (AlphaFilter), only while it is neither fully shown nor fully hidden.
			if (shown !== targetAlpha) {
				const step = dt / (targetAlpha < shown ? FADE_OUT_S : FADE_IN_S);
				shown = targetAlpha < shown ? Math.max(targetAlpha, shown - step) : Math.min(targetAlpha, shown + step);
			}
			if (shadow) shadow.alpha = shown;
			view.visible = shown > 0;
			if (shown > 0 && shown < 1) {
				fade.alpha = shown;
				if (!filtered) view.filters = fadeFilters;
			} else if (filtered) {
				view.filters = [];
			}
			filtered = shown > 0 && shown < 1;
		};
		void loadCast(who).then((loaded) => {
			if (disposed) return;
			mounted = new CastSpine43(loaded.rig, loaded.data, texture, `wa-cast-${who}`);
			mounted.onEvent = (name) => {
				if (name === 'cast_release') targetAlpha = 0;
			};
			// behind the board's housing, above the room (same slot the Hard Time rigs used)
			const at = Math.min(2, pixi.stage.children.length);
			shadow = new Graphics().ellipse(0, 0, 100, 100).fill({ color: 0x2a1c10, alpha: 0.2 });
			shadow.label = `wa-cast-shadow-${who}`;
			pixi.stage.addChildAt(shadow, at);
			pixi.stage.addChildAt(mounted.view, at + 1);
			pixi.ticker.add(tick);
			clips = loaded.clips;
			measure = loaded.measure;
			targetAlpha = 1;
			figure = mounted;
		});
		return () => {
			disposed = true;
			pixi.ticker.remove(tick);
			mounted?.destroy();
			shadow?.destroy();
			shadow = null;
			figure = null;
		};
	});

	// ── cues ────────────────────────────────────────────────────────────────
	const has = (name: string) => clips.has(name);
	const firstOf = (...names: string[]) => names.find(has) ?? null;

	const onCue = (kind: CastCue) => {
		if (!figure) return;
		const set = secondSet && has('trans_in_02') ? '_02' : '';
		switch (kind) {
			case 'transIn': {
				// the reference picks its second gesture on half the free-game conversions
				secondSet = stateGame.gameType === 'freegame' && has('trans_in_02') && stateGame.spinRandom() < 0.5;
				const s = secondSet ? '_02' : '';
				targetAlpha = 1;
				figure.play(`trans_in${s}`, [`trans_loop${s}`]);
				break;
			}
			case 'transOut':
				figure.play(`trans_out${set}`, []);
				break;
			case 'transBack':
				targetAlpha = 1;
				figure.play('trans_back', ['idle'], false, true);
				break;
			case 'win01':
			case 'win02':
			case 'win025':
			case 'win03':
			case 'trigger': {
				const clip =
					kind === 'win01' ? firstOf('win_01')
					: kind === 'win02' ? firstOf('win_02', 'win_01')
					: kind === 'win025' ? firstOf('win_025', 'win_02')
					: firstOf('win_03', 'win_02');
				targetAlpha = 1;
				if (clip) figure.play(clip, ['idle']);
				break;
			}
			default:
				break;
		}
	};

	let seen = stateGame.castReaction.seq;
	$effect(() => {
		const { seq, kind } = stateGame.castReaction;
		if (!figure || seq === seen) return;
		seen = seq;
		onCue(kind);
	});

	// ── placement ───────────────────────────────────────────────────────────
	// The band runs from the housing's ink edge (plus a gap) to the screen edge.
	// The figure keeps its natural size unless everything it reaches for over all
	// of its clips would not fit the band; it never crosses the housing.
	$effect(() => {
		if (!figure || !measure) return;
		const toCanvasX = (x: number) => std.x + (x - std.width * std.anchor) * std.scale;
		const canvas = context.stateLayoutDerived.canvasSizes();
		const leftLimit = toCanvasX(props.innerEdge + BOARD_GAP);
		const rightLimit = canvas.width - SCREEN_GAP * std.scale;
		const band = Math.max(0, rightLimit - leftLimit);
		const natural = (props.height * 0.82 * std.scale) / measure.height;
		const reach = measure.left + measure.right;
		const top = std.y + (props.topY - std.height * std.anchor) * std.scale;
		// feet on the natural floor line whatever the scale (a figure shrunk to fit stands lower, not in the air),
		// and never behind the bet bar or its dial. The bar lives in the standard box (not at the canvas bottom
		// on 4:3), so the floor is taken in standard units.
		const toCanvasY = (y: number) => std.y + (y - std.height * std.anchor) * std.scale;
		const floor = toCanvasY(std.height - uiTheme.barHeight - DIAL_RISE);
		const feet = Math.min(top + measure.height * natural, floor);
		// and the highest thing it ever reaches for (the raised flask, the hop) stays under the corner logo:
		// on wide, short windows the figure gives way rather than the logo
		const fitsUnderLogo = feet >= floor - 1 ? (floor - top) / measure.top : Infinity;
		const s = Math.max(0, Math.min(natural, band / reach, fitsUnderLogo));
		figure.view.scale.set(s);
		figure.view.x = leftLimit + measure.left * s + (band - reach * s) / 2;
		figure.view.y = feet;
		if (shadow) {
			// only where the whole figure stands in view (portrait shows it waist-up behind the housing)
			shadow.visible = figure.view.y >= floor - 1;
			shadow.position.set(figure.view.x, figure.view.y + 4 * s);
			shadow.scale.set(2.5 * s, 0.2 * s);
		}
	});
</script>
