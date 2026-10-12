<script lang="ts">
	/**
	 * The things that hang and grow in a background — lanterns, scrolls,
	 * plants (game/meshWin/bgProps.ts) — each drawn as a mesh over one small
	 * rectangle of the plate. Rendered straight after the background's own
	 * sprite, inside the same FadeContainer and with the same box, so it fades,
	 * drifts and blurs with the plate; at rest it IS the plate, its border
	 * pinned, so there is nothing to see where the two meet.
	 *
	 * Driven by the pixi ticker (Background.svelte's drift is rAF too: the review
	 * checker flags interval animation). A win sends a gust through the room.
	 */
	import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { buildRig, skin } from '../game/meshWin/meshRig';
	import { BG_CANVAS, type BgPropSpec } from '../game/meshWin/bgProps';

	type Props = {
		specs: BgPropSpec[];
		/** the plate's asset key: every prop draws from it */
		plate: string;
		/** the background sprite's box this frame */
		x: number;
		y: number;
		width: number;
		height: number;
	};
	const props: Props = $props();
	const context = getContext();
	const app = getContextApp();
	const parent = getContextParent();

	let gustAt = -1;
	let gustScale = 1;
	context.eventEmitter.subscribeOnMount({
		winLinesShow: () => {
			gustAt = performance.now();
			gustScale = 1;
		},
		backgroundWin: ({ amount }) => {
			if (amount <= 0) return;
			gustAt = performance.now();
			gustScale = Math.min(1.3, 1 + Math.log10(1 + amount / 100) * 0.13);
		},
	});

	// added in sibling order, straight after the background's sprite
	// (pixi-svelte's addToParent, which also destroys it on unmount)
	const root = new Container();
	root.label = `bgProps ${props.plate}`;
	parent.addToParent(root);

	$effect(() => {
		root.position.set(props.x, props.y);
		root.scale.set(props.width / BG_CANVAS[0], props.height / BG_CANVAS[1]);
	});

	onMount(() => {
		const rigs = props.specs.map((spec) => {
			const rig = buildRig(spec.rig);
			return { spec, rig, positions: new Float32Array(rig.rest), geometry: null as MeshGeometry | null };
		});
		const started = performance.now();
		let built = false;

		const tick = () => {
			if (!built) {
				// the plate may not be loaded when the background first mounts
				const texture = app.stateApp.loadedAssets?.[props.plate] as Texture | undefined;
				if (!texture) return;
				for (const r of rigs) {
					r.geometry = new MeshGeometry({ positions: r.positions, uvs: r.rig.uvs, indices: r.rig.indices });
					root.addChild(new Mesh({ geometry: r.geometry, texture }));
				}
				built = true;
			}
			const now = performance.now();
			const env = { t: now - started, gustT: gustAt < 0 ? -1 : now - gustAt, gustScale };
			for (const r of rigs) {
				skin(r.rig, r.spec.drive(r.rig, env), r.spec.feetY, r.positions);
				r.geometry!.getBuffer('aPosition').update();
			}
		};
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		tick();

		return () => {
			ticker?.remove(tick);
			for (const r of rigs) r.geometry?.destroy();
		};
	});
</script>
