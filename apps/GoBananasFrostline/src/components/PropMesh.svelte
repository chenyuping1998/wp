<script lang="ts" generics="Env">
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
		anchor?: number;
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const root = new Container();
	const body = new Container();
	root.addChild(body);
	parent.addToParent(root);

	const rig = buildRig(props.spec.rig);
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
		if (!mesh) return;
		skin(rig, props.spec.drive(rig, env), props.spec.feetY, positions);
		geometry!.getBuffer('aPosition').update();
	});

	$effect(() => {
		const anchor = props.anchor ?? 0;
		root.position.set(props.x ?? 0, props.y ?? 0);
		body.scale.set(props.width / 256, props.height / 256);
		body.position.set(-props.width * anchor, -props.height * anchor);
	});

	onDestroy(() => geometry?.destroy());
</script>
