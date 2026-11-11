<script lang="ts">
  import { Container, Mesh, MeshGeometry, type Texture } from "pixi.js";
  import { getContextApp, getContextParent } from "pixi-svelte";
  import { onMount } from "svelte";
  import { streetPoint } from "../game/streetSymbolMotion";
  type Props = {
    assetKey: string;
    name: string;
    width: number;
    height: number;
    ms: number;
    actU?: number;
    win?: boolean;
    tint?: number;
    alpha?: number;
  };
  const props: Props = $props();
  const app = getContextApp(),
    parent = getContextParent();
  const root = new Container();
  root.label = `turfSymbol ${props.name}`;
  parent.addToParent(root);
  const size = 40,
    count = (size + 1) ** 2,
    pos = new Float32Array(count * 2),
    uvs = new Float32Array(count * 2),
    ids: number[] = [];
  for (let y = 0; y <= size; y++)
    for (let x = 0; x <= size; x++) {
      const i = (y * (size + 1) + x) * 2;
      uvs[i] = x / size;
      uvs[i + 1] = y / size;
    }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = y * (size + 1) + x;
      ids.push(i, i + 1, i + size + 1, i + 1, i + size + 2, i + size + 1);
    }
  let geo: MeshGeometry | undefined, mesh: Mesh | undefined;
  let ready = $state(false);
  onMount(() => {
    const texture = app.stateApp.loadedAssets?.[props.assetKey] as
      | Texture
      | undefined;
    if (!texture) {
      console.error(`StreetSymbolMesh missing ${props.assetKey}`);
      return;
    }
    geo = new MeshGeometry({
      positions: pos,
      uvs,
      indices: new Uint32Array(ids),
    });
    mesh = new Mesh({ geometry: geo, texture });
    root.addChild(mesh);
    ready = true;
    return () => geo?.destroy();
  });
  $effect(() => {
    if (!ready) return;
    for (let i = 0; i < count; i++) {
      const [x, y] = streetPoint(
        props.name,
        uvs[i * 2],
        uvs[i * 2 + 1],
        props.ms,
        props.actU ?? -1,
        props.win ?? false,
      );
      pos[i * 2] = (x - 0.5) * props.width;
      pos[i * 2 + 1] = (y - 0.5) * props.height;
    }
    geo!.getBuffer("aPosition").update();
    mesh!.tint = props.tint ?? 0xffffff;
    mesh!.alpha = props.alpha ?? 1;
  });
</script>
