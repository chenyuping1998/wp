<script lang="ts">
  import {
    Container,
    Sprite,
    Graphics,
    ColorMatrixFilter,
    type Texture,
  } from "pixi.js";
  import { getContextApp, getContextParent } from "pixi-svelte";
  import { onMount } from "svelte";
  import { TAG_PATHS, tracePath, ease } from "../game/streetSymbolMotion";
  type Props = {
    assetKey: string;
    name: string;
    width: number;
    height: number;
    u: number;
  };
  const props: Props = $props(),
    app = getContextApp(),
    parent = getContextParent();
  const root = new Container();
  root.label = `turfPaintTrace ${props.name}`;
  parent.addToParent(root);
  const mask = new Graphics();
  let paint: Sprite | undefined;
  let ready = $state(false);
  const ink = new ColorMatrixFilter();
  ink.brightness(1.62, false);
  onMount(() => {
    const texture = app.stateApp.loadedAssets?.[props.assetKey] as
      | Texture
      | undefined;
    if (!texture) return;
    paint = new Sprite(texture);
    paint.anchor.set(0.5);
    paint.filters = [ink];
    root.addChild(paint, mask);
    paint.mask = mask;
    ready = true;
    return () => ink.destroy();
  });
  $effect(() => {
    if (!ready) return;
    const u = props.u,
      alpha = ease(u / 0.12) * (1 - ease((u - 0.78) / 0.22));
    root.visible = u >= 0 && alpha > 0.001;
    root.alpha = alpha;
    paint!.setSize(props.width, props.height);
    mask.clear();
    for (const [i, path] of (TAG_PATHS[props.name] ?? []).entries()) {
      const delay = props.name === "L2" ? i * 0.07 : i * 0.18;
      const p = ease((u - delay) / (0.43 - delay * 0.25));
      if (p <= 0) continue;
      const points = tracePath(path, p);
      mask.moveTo(
        (points[0][0] - 0.5) * props.width,
        (points[0][1] - 0.5) * props.height,
      );
      for (const [x, y] of points.slice(1))
        mask.lineTo((x - 0.5) * props.width, (y - 0.5) * props.height);
      mask.stroke({
        color: 0xffffff,
        width: props.width * 0.095,
        cap: "round",
        join: "round",
      });
    }
  });
</script>
