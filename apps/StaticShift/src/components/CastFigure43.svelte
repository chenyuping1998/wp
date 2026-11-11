<script lang="ts" module>
	import type { Texture } from 'pixi.js';
	import type { SkeletonData } from '../vendor/spine-core-4.3.13/index.js';
	import { CastSpine43, measureClip, readCastData, type CastRig } from '../game/castSpine43';

	export type CastWho = 'dj' | 'host';
	/** Skeleton-unit extents a placement needs (y UP, feet on 0, board on the left). */
	export type CastMeasure = {
		/** crown at rest */
		height: number;
		/** furthest reach toward the board (left) and away from it, over every clip this game plays */
		left: number;
		right: number;
		/** highest point of any clip */
		jump: number;
		/** the same reach toward / away from the board over every clip but the point (`gaze`): the body's own width.
		 *  The placement sizes the figure by this and steps him back for the point (Mascot.svelte). */
		bodyLeft: number;
		bodyRight: number;
	};
	export type CastLoaded = { rig: CastRig; data: SkeletonData; measure: CastMeasure };

	// The rigs and their packed drawings: design/cast_v2/build_game_cast.py.
	const RIG_URL: Record<CastWho, string> = {
		dj: new URL('../../assets/castSpine43/dj/cast.json', import.meta.url).href,
		host: new URL('../../assets/castSpine43/host/cast.json', import.meta.url).href,
	};
	export const CAST_PREFIX: Record<CastWho, string> = { dj: 'ss43dj_', host: 'ss43host_' };
	export const CAST_CLIPS = ['idle', 'idle_fidget', 'gaze', 'react_small', 'gaze_dud', 'win_big', 'win_big_loop', 'win_big_end'];

	const loads = new Map<CastWho, Promise<CastLoaded>>();
	/** The rig, parsed and measured once per figure for the whole session. */
	export const loadCast = (who: CastWho) => {
		let pending = loads.get(who);
		if (!pending) {
			pending = fetch(RIG_URL[who])
				.then((response) => {
					if (!response.ok) throw new Error(`Unable to load the ${who} cast rig: ${response.status}`);
					return response.json() as Promise<CastRig>;
				})
				.then((rig) => {
					const data = readCastData(rig);
					const boxes = new Map(CAST_CLIPS.map((clip) => [clip, measureClip(data, clip)]));
					const all = [...boxes.values()];
					const measure: CastMeasure = {
						height: boxes.get('idle')!.maxY,
						left: Math.max(...all.map((b) => -b.minX)),
						right: Math.max(...all.map((b) => b.maxX)),
						jump: Math.max(...all.map((b) => b.maxY)),
						bodyLeft: Math.max(...CAST_CLIPS.filter((c) => c !== 'gaze').map((c) => -boxes.get(c)!.minX)),
						bodyRight: Math.max(...CAST_CLIPS.filter((c) => c !== 'gaze').map((c) => boxes.get(c)!.maxX)),
					};
					return { rig, data, measure };
				});
			loads.set(who, pending);
		}
		return pending;
	};
</script>

<script lang="ts">
	import { getContextApp, getContextParent } from 'pixi-svelte';

	type Props = {
		who: CastWho;
		/** the point between the feet, in the parent container */
		x: number;
		y: number;
		scale: number;
		alpha?: number;
		/** the live figure once its rig and drawings are in, for reactions */
		onready?: (figure: CastSpine43) => void;
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const textures = $derived.by(() => {
		const assets = app.stateApp.loadedAssets as Record<string, unknown> | undefined;
		if (!assets?.[`${CAST_PREFIX[props.who]}torso`]) return null;
		return (name: string) => assets[name] as Texture | undefined;
	});

	let figure = $state<CastSpine43 | null>(null);

	// Re-mounts when the figure changes; the drawings are shared, the meshes are not.
	$effect(() => {
		const who = props.who;
		const texture = textures;
		if (!texture) return;
		let disposed = false;
		let mounted: CastSpine43 | null = null;
		const tick = () => mounted?.update(performance.now());
		void loadCast(who).then(({ rig, data }) => {
			if (disposed) return;
			mounted = new CastSpine43(rig, data, texture, `ss-cast-${who}`);
			// behind the shout and anything else drawn in the same container
			mounted.view.zIndex = -1;
			parent.parent.addChild(mounted.view);
			parent.parent.sortChildren();
			app.stateApp.pixiApplication?.ticker.add(tick);
			mounted.update(performance.now());
			figure = mounted;
			props.onready?.(mounted);
		});
		return () => {
			disposed = true;
			app.stateApp.pixiApplication?.ticker.remove(tick);
			mounted?.destroy();
			figure = null;
		};
	});

	$effect(() => {
		if (!figure) return;
		figure.view.position.set(props.x, props.y);
		figure.view.scale.set(props.scale);
		figure.view.alpha = props.alpha ?? 1;
	});
</script>
