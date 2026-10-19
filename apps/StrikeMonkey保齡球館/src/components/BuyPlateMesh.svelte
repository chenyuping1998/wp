<script lang="ts">
	/**
	 * The Buy Bonus plate's picture acting (game/meshWin/signs.ts) — without
	 * touching the shared bet bar that draws it. Ported from Jade Teahouse's
	 * swinging bamboo plate, 2026-10-16.
	 *
	 * ButtonBuyBonus (components-ui-pixi) draws the plate as a Sprite whose
	 * texture it looks up by key in this game's loaded assets. So this swaps
	 * those two assets (the plate and its lit hover copy) for render textures
	 * of the same size, and every frame redraws the art into them through the
	 * mesh. The button's box, hit area, label and states are exactly as before;
	 * only the picture inside moves. On unmount the original textures go back.
	 *
	 * Draws nothing itself. Skips the redraw in free spins, where the button is
	 * hidden.
	 */
	import { Container, Mesh, MeshGeometry, RenderTexture, type Texture } from 'pixi.js';
	import { getContextApp } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { BUY_PLATE, BUY_PLATE_CANVAS, BUY_PLATE_KEYS } from '../game/meshWin';
	import { buildRig, skin } from '../game/meshWin/meshRig';

	const KEYS = BUY_PLATE_KEYS;

	const app = getContextApp();
	const context = getContext();

	let pushAt = -1;
	context.eventEmitter.subscribeOnMount({
		// every new round gives it a push
		boardWinAnimCancel: () => {
			pushAt = performance.now();
		},
	});

	onMount(() => {
		const renderer = app.stateApp.pixiApplication?.renderer;
		const assets = app.stateApp.loadedAssets;
		if (!renderer || !assets) return;
		const started = performance.now();
		const plates = KEYS.flatMap((key) => {
			const original = assets[key] as Texture | undefined;
			if (!original) return [];
			const spec = BUY_PLATE(key);
			const rig = buildRig(spec.rig);
			const positions = new Float32Array(rig.rest);
			const geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });
			const holder = new Container();
			holder.addChild(new Mesh({ geometry, texture: original }));
			holder.scale.set(original.width / BUY_PLATE_CANVAS[0], original.height / BUY_PLATE_CANVAS[1]);
			const target = RenderTexture.create({
				width: original.width,
				height: original.height,
				resolution: original.source.resolution,
			});
			return [{ key, original, spec, rig, positions, geometry, holder, target }];
		});

		const draw = () => {
			if (context.stateGame.gameType === 'freegame') return;
			const now = performance.now();
			const env = { t: now - started, pushT: pushAt < 0 ? -1 : now - pushAt };
			for (const p of plates) {
				skin(p.rig, p.spec.drive(p.rig, env), p.spec.feetY, p.positions);
				p.geometry.getBuffer('aPosition').update();
				renderer.render({ container: p.holder, target: p.target, clear: true });
			}
		};
		// fill the textures before the button ever shows them
		draw();
		for (const p of plates) assets[p.key] = p.target;

		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(draw);
		return () => {
			ticker?.remove(draw);
			for (const p of plates) {
				if (app.stateApp.loadedAssets) app.stateApp.loadedAssets[p.key] = p.original;
				p.holder.destroy({ children: true });
				p.geometry.destroy();
				p.target.destroy(true);
			}
		};
	});
</script>
