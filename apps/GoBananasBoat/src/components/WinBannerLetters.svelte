<script lang="ts">
	/**
	 * THE TIER NAME ON A BIG-WIN PLAQUE, LETTER BY LETTER.
	 *
	 * The name used to be baked into the plaque, one flat picture that could
	 * only scale with it. design/generate_win_banners.mjs now cuts it out
	 * (the plaque without it, and every letter cropped into one strip, with
	 * their boxes in game/winBannerLetters.ts), and here the letters HOP:
	 *
	 *   · on the slam, a wave left to right — each letter crouches, springs up
	 *     stretched, and lands squashed, 60ms after the one before it
	 *   · then a smaller wave each time the plaque flares (Win.svelte's blink,
	 *     every 2.3s), so the name keeps answering the light
	 *
	 * Squash and stretch are about each letter's FOOT, so a letter lands on the
	 * line it stands on rather than scaling about its middle. At rest every
	 * letter sits exactly where the baked plaque had it (the generator checks
	 * the cut: plate + letters recompose the plaque to within a pixel or two
	 * where strokes overlap).
	 *
	 * Drawn with pixi objects directly, as SymbolMeshWin is: each letter is a
	 * frame of the strip, which pixi-svelte's Sprite (by asset key) cannot say.
	 * The clock is its own; nothing waits on it.
	 */
	import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { WIN_BANNER_LETTERS, WIN_BANNER_SIZE } from '../game/winBannerLetters';

	type Props = {
		alias: string;
		/** the strip's asset key */
		stripKey: string;
		/** the plaque's drawn size */
		width: number;
		height: number;
		/** Win.svelte's flare, 0..1: the letters light with the plaque */
		blink: number;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const ENTER_AT = 0.2; // s: the first letter leaves as the plaque's slam peaks
	const STAGGER = 0.06;
	const HOP = 0.46; // s, one letter's hop
	const WAVE_EVERY = 2.3; // Win.svelte's blink period
	const WAVE_FIRST = 2.3 + 0.4; // the second blink: the entrance has the first

	// one hop, u 0..1: [lift as a fraction of the letter's height, scaleX, scaleY]
	const hop = (u: number, size: number): [number, number, number] => {
		if (u <= 0 || u >= 1) return [0, 1, 1];
		// crouch 0..0.16, air 0.16..0.74, land 0.74..1
		if (u < 0.16) {
			const k = Math.sin((Math.PI * u) / 0.16);
			return [0, 1 + 0.16 * size * k, 1 - 0.24 * size * k];
		}
		if (u < 0.74) {
			const a = (u - 0.16) / 0.58;
			const lift = Math.sin(Math.PI * a);
			// stretched on the way up, round at the top, a little on the way down
			const stretch = 0.14 * size * Math.cos(Math.PI * a) * (a < 0.5 ? 1 : 0.5);
			return [0.3 * size * lift, 1 - stretch * 0.6, 1 + stretch];
		}
		const b = (u - 0.74) / 0.26;
		const k = Math.sin(Math.PI * b) * (1 - b * 0.3);
		return [0, 1 + 0.12 * size * k, 1 - 0.18 * size * k];
	};

	const root = new Container();

	onMount(() => {
		const letters = WIN_BANNER_LETTERS[props.alias] ?? [];
		const strip = app.stateApp.loadedAssets?.[props.stripKey] as Texture | undefined;
		if (!strip || !letters.length) {
			console.error(`WinBannerLetters: ${props.stripKey} not loaded`);
			return;
		}
		const made = letters.map((L) => {
			const texture = new Texture({ source: strip.source, frame: new Rectangle(L.ax, L.ay, L.w, L.h) });
			const face = new Sprite(texture);
			const glow = new Sprite(texture);
			for (const s of [face, glow]) s.anchor.set(0.5, 1);
			glow.blendMode = 'add';
			root.addChild(face);
			root.addChild(glow);
			return { L, face, glow, texture };
		});
		root.label = `winBannerLetters ${props.alias}`;
		parent.parent.addChild(root);

		const started = performance.now();
		const tick = () => {
			const t = (performance.now() - started) / 1000;
			const kx = props.width / WIN_BANNER_SIZE.width;
			const ky = props.height / WIN_BANNER_SIZE.height;
			// which wave is running: the entrance, or the latest flare's
			const waveStart = t < WAVE_FIRST ? ENTER_AT : WAVE_FIRST + Math.floor((t - WAVE_FIRST) / WAVE_EVERY) * WAVE_EVERY;
			const size = t < WAVE_FIRST ? 1 : 0.45;
			made.forEach(({ L, face, glow }, i) => {
				const u = (t - waveStart - i * STAGGER) / HOP;
				const [lift, sx, sy] = hop(u, size);
				const x = (L.x + L.w / 2 - WIN_BANNER_SIZE.width / 2) * kx;
				const y = (L.y + L.h - WIN_BANNER_SIZE.height / 2) * ky - lift * L.h * ky;
				for (const s of [face, glow]) {
					s.position.set(x, y);
					s.scale.set(kx * sx, ky * sy);
				}
				// the flare, and a flash of its own as each letter lands
				const landed = u > 0.7 && u < 1 ? Math.sin((Math.PI * (u - 0.7)) / 0.3) : 0;
				glow.alpha = Math.min(1, props.blink + 0.35 * size * landed);
				glow.visible = glow.alpha > 0.01;
			});
		};
		tick();
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		return () => {
			ticker?.remove(tick);
			root.removeFromParent();
			root.destroy({ children: true });
			// the frames are ours; the strip's source belongs to the loader
			for (const m of made) m.texture.destroy(false);
		};
	});
</script>
