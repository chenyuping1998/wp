<script lang="ts" generics="Env">
	/**
	 * A single prop drawn through its mesh (game/meshWin: dynamiteProp, fsSign,
	 * fsCounter) in place of the Sprite it replaces, with the same box.
	 *
	 * It keeps no clock of its own: the parent already runs one for the prop's
	 * motion (TransitionAnimation's rAF, the sign's and the counter's
	 * intervals) and hands this the env for the frame, and the mesh is posed
	 * whenever that changes. So the mesh can never drift from the transform
	 * that carries it.
	 *
	 * Added through pixi-svelte's addToParent, which queues the add in this
	 * component's onMount — so it lands in sibling order, where the Sprite was —
	 * and destroys it on unmount.
	 */
	import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onDestroy } from 'svelte';

	import { buildRig, skin, type MeshWinSpec, type Pose, type Rig } from '../game/meshWin/meshRig';

	type Props = {
		spec: MeshWinSpec & { drive: (rig: Rig, env: Env) => Pose };
		env: Env;
		x?: number;
		y?: number;
		width: number;
		height: number;
		/** 0.5 centres it on (x, y), like an anchor-0.5 Sprite; 0 puts its top
		 *  left there */
		anchor?: number;
		rotation?: number;
		tint?: number;
		alpha?: number;
		/** the pose, each time it is taken — for things drawn on top of the prop
		 *  that must ride with it (the sign's text) */
		onpose?: (rig: Rig, pose: Pose) => void;
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const root = new Container();
	root.label = `propMesh ${props.spec.symbol}`;
	const body = new Container();
	root.addChild(body);
	parent.addToParent(root);

	const rig = buildRig(props.spec.rig);
	const canvas = props.spec.rig.canvas ?? [256, 256];
	const positions = new Float32Array(rig.rest);
	let geometry: MeshGeometry | null = null;
	let mesh: Mesh | null = null;

	$effect(() => {
		const env = props.env;
		if (!mesh) {
			const texture = app.stateApp.loadedAssets?.[props.spec.sprite ?? props.spec.key] as Texture | undefined;
			if (texture) {
				geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });
				mesh = new Mesh({ geometry, texture });
				body.addChild(mesh);
			}
		}
		const pose = props.spec.drive(rig, env);
		props.onpose?.(rig, pose);
		if (!mesh) return;
		skin(rig, pose, props.spec.feetY, positions);
		geometry!.getBuffer('aPosition').update();
		mesh.tint = props.tint ?? 0xffffff;
	});

	$effect(() => {
		const anchor = props.anchor ?? 0;
		root.position.set(props.x ?? 0, props.y ?? 0);
		root.rotation = props.rotation ?? 0;
		root.alpha = props.alpha ?? 1;
		body.scale.set(props.width / canvas[0], props.height / canvas[1]);
		body.position.set(-props.width * anchor, -props.height * anchor);
	});

	onDestroy(() => geometry?.destroy());
</script>
