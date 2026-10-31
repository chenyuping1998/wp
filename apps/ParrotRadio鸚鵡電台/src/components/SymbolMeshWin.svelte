<script lang="ts">
	/**
	 * A winning symbol, acted by the objects inside its own drawing (src/game/symbolActing.ts, user 2026-10-31): the
	 * art is one dense mesh, each object a soft-weighted region of it, plus an additive copy of the acting object for
	 * the light. It replaces the swap to the separately painted parts, which were a different drawing and made every
	 * win start with a jump. The beat is lit by game/winFx.ts (halo, shine, shadow). 640ms; the mic's trigger beat 820ms.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { getContextParent } from 'pixi-svelte';
	import { Container, Graphics, Mesh, MeshGeometry, Sprite, type Texture } from 'pixi.js';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { GLOW, GRID, rigWeights, skinSymbol, symbolAct } from '../game/symbolActing';
	import { SHINE_BANDS, drawBand, drawShadow, haloTexture, winLight } from '../game/winFx';
	import type { getSymbolInfo } from '../game/utils';

	const props: { x?: number; y?: number; name: string; symbolInfo: ReturnType<typeof getSymbolInfo>; oncomplete?: () => void } = $props();
	const context = getContext(), parent = getContextParent();
	let root: Container | undefined, raf = 0, timer: ReturnType<typeof setTimeout> | undefined, finished = false;
	const geometries: MeshGeometry[] = [];
	const finish = () => {
		if (!finished) { finished = true; props.oncomplete?.(); }
	};

	onMount(() => {
		const loaded = context.stateApp.loadedAssets as Record<string, Texture>;
		const texture = loaded[props.symbolInfo.assetKey];
		if (!texture) throw Error('Missing symbol art ' + props.symbolInfo.assetKey);
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const w = SYMBOL_SIZE * props.symbolInfo.sizeRatios.width, h = SYMBOL_SIZE * props.symbolInfo.sizeRatios.height;
		root = new Container();
		root.position.set(props.x ?? 0, props.y ?? 0);
		root.eventMode = 'none';
		parent.parent.addChild(root);

		// the art grid, and the triangles the light covers (the acting object's region)
		const rig = rigWeights(props.name), B = rig.bones.length, V = (GRID + 1) ** 2;
		const positions = new Float32Array(V * 2), uvs = new Float32Array(V * 2), all: number[] = [], lit: number[] = [];
		const glowBone = rig.bones.indexOf(GLOW[props.name] ?? '');
		for (let gy = 0, i = 0; gy <= GRID; gy++) for (let gx = 0; gx <= GRID; gx++, i += 2) {
			uvs[i] = gx / GRID;
			uvs[i + 1] = gy / GRID;
			if (gx < GRID && gy < GRID) {
				const a = gy * (GRID + 1) + gx, quad = [a, a + 1, a + GRID + 2, a, a + GRID + 2, a + GRID + 1];
				all.push(...quad);
				if (glowBone >= 0 && (rig.weights[a * B + glowBone] + rig.weights[(a + GRID + 2) * B + glowBone]) / 2 > 0.4) lit.push(...quad);
			}
		}
		const geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(all) });
		const mesh = new Mesh({ geometry, texture });
		geometries.push(geometry);
		// the beat's light (game/winFx.ts): a contact shadow and a soft halo behind the art, and a band of light
		// sweeping across the art itself (an additive copy of it, seen through a soft band mask)
		const shadow = new Graphics();
		const halo = new Sprite({ texture: haloTexture(), anchor: 0.5, blendMode: 'add', tint: 0x8fe6ff, alpha: 0 });
		root.addChild(shadow, halo);
		root.addChild(mesh);
		let glowGeometry: MeshGeometry | undefined, glow: Mesh<MeshGeometry> | undefined;
		if (lit.length) {
			// shares the art's position array: one skin per frame feeds both
			glowGeometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(lit) });
			glow = new Mesh({ geometry: glowGeometry, texture });
			glow.blendMode = 'add';
			glow.alpha = 0;
			geometries.push(glowGeometry);
			root.addChild(glow);
		}

		const shines = SHINE_BANDS.map(([width]) => {
			const mesh = new Mesh({ geometry, texture });
			mesh.blendMode = 'add';
			mesh.visible = false;
			const band = new Graphics();
			drawBand(band, width, SYMBOL_SIZE);
			mesh.mask = band;
			root!.addChild(mesh, band);
			return { mesh, band };
		});
		const duration = reduced ? 180 : props.name === 'S' ? 820 : 640;
		const start = performance.now();
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / duration), pose = symbolAct(props.name, reduced ? 0 : t);
			skinSymbol(pose, rig, w, h, SYMBOL_SIZE, positions);
			geometry.getBuffer('aPosition').update();
			const light = winLight(props.name, reduced ? 0 : t);
			drawShadow(shadow, reduced ? 0 : t, SYMBOL_SIZE, pose.root.ty);
			halo.alpha = light.halo;
			halo.width = halo.height = SYMBOL_SIZE * 1.05 * light.haloScale;
			halo.y = pose.root.ty * 0.6;
			shines.forEach(({ mesh, band }, i) => {
				mesh.visible = band.visible = light.shine !== null;
				if (light.shine === null) return;
				mesh.alpha = light.shineAlpha * SHINE_BANDS[i][1];
				band.position.set(light.shine * SYMBOL_SIZE * 0.5, pose.root.ty - light.shine * SYMBOL_SIZE * 0.22);
			});
			if (glow && glowGeometry) {
				glow.alpha = pose.glow;
				if (pose.glow > 0) glowGeometry.getBuffer('aPosition').update();
			}
			if (t < 1) raf = requestAnimationFrame(tick);
			else finish();
		};
		tick(start);
		timer = setTimeout(finish, duration + 140);
	});

	onDestroy(() => {
		clearTimeout(timer);
		cancelAnimationFrame(raf);
		root?.destroy({ children: true });
		for (const g of geometries) g.destroy();
	});
</script>
