<script lang="ts" module>
	import { buildRig, type Rig } from '../game/meshWin/meshRig';
	import { BANNER_TITLE } from '../game/meshWin/bannerTitle';

	// one rig for every tier: all five names sit in the same box
	let rig: Rig | undefined;
	const bannerRig = () => (rig ??= buildRig(BANNER_TITLE.rig));
</script>

<script lang="ts">
	/**
	 * A win-tier plaque whose NAME is jelly (game/meshWin/bannerTitle.ts): the
	 * plaque's own art through a mesh, the frame, satellite and amount well held
	 * still by the rig, the name stretching and squashing on the slam-in and
	 * jiggling on each flare. Replaces Win.svelte's plain plaque sprite and its
	 * additive self-copy, which is drawn here through the same geometry so the
	 * flare follows the name when it moves.
	 *
	 * Win.svelte owns the clock (its bannerPose timeline) and passes the time in
	 * the current beat and how hard to play it.
	 */
	import { Mesh, MeshGeometry, Container, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { skin } from '../game/meshWin/meshRig';
	import { BANNER_W, BANNER_H, bannerTitlePose } from '../game/meshWin/bannerTitle';

	type Props = {
		/** the plaque's sprite key (gbWinBannerBig ...) */
		textureKey: string;
		/** drawn size, board px */
		width: number;
		height: number;
		/** ms into the current beat, and the beat's strength */
		t: number;
		amp: number;
		/** alpha of the additive flare copy, 0 for none */
		blink: number;
		/** ms since the amount's well was struck, and how hard (bannerTitle.ts) */
		wellT?: number;
		wellAmp?: number;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const root = new Container();
	let mesh: Mesh | undefined;
	let flare: Mesh | undefined;
	let geometry: MeshGeometry | undefined;
	let positions: Float32Array | undefined;

	const texture = () => (app.stateApp.loadedAssets ?? {})[props.textureKey] as Texture | undefined;

	onMount(() => {
		const r = bannerRig();
		positions = new Float32Array(r.rest);
		geometry = new MeshGeometry({ positions, uvs: r.uvs, indices: r.indices });
		// empty until the plaque's texture has loaded (the $effect below swaps it
		// in), rather than never drawing if it mounted first
		const tex = texture() ?? Texture.EMPTY;
		mesh = new Mesh({ geometry, texture: tex });
		flare = new Mesh({ geometry, texture: tex });
		flare.blendMode = 'add';
		flare.alpha = 0;
		const content = new Container();
		// centred like the anchor-0.5 sprite it replaces
		content.position.set(-BANNER_W / 2, -BANNER_H / 2);
		content.addChild(mesh, flare);
		root.addChild(content);
		// the context's parent is the pixi container of the enclosing <Container>
		parent.parent.addChild(root);
		return () => {
			root.removeFromParent();
			root.destroy({ children: true });
			geometry?.destroy();
		};
	});

	$effect(() => {
		// read every prop the frame depends on, so the effect tracks them
		const { t, amp, blink, width, height } = props;
		const wellT = props.wellT ?? -1, wellAmp = props.wellAmp ?? 0;
		const tex = texture();
		if (!mesh || !flare || !geometry || !positions) return;
		if (tex && mesh.texture !== tex) {
			mesh.texture = tex;
			flare.texture = tex;
		}
		const r = bannerRig();
		skin(r, bannerTitlePose(r, t, amp, wellT, wellAmp), BANNER_TITLE.feetY, positions);
		geometry.getBuffer('aPosition').update();
		flare.alpha = blink;
		root.scale.set(width / BANNER_W, height / BANNER_H);
	});
</script>
