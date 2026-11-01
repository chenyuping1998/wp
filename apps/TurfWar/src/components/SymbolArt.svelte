<script lang="ts">
  import { Container, Sprite, Graphics, Text } from "pixi-svelte";
  import { SYMBOL_SIZE } from "../game/constants";
  import { TITLE_FONT, TITLE_FONT_WEIGHT } from "../game/fonts";
  import { HOLD_MS } from "../game/symbolWinMotion";
  import { getSymbolInfo } from "../game/utils";
  import {
    MESH_SYMBOLS,
    TAG_PATHS,
    tracePath,
    ease,
    bell,
    streetEnergy,
    streetPoint,
  } from "../game/streetSymbolMotion";
  import StreetSymbolMesh from "./StreetSymbolMesh.svelte";
  import GraffitiTrace from "./GraffitiTrace.svelte";
  type Props = {
    symbolInfo: ReturnType<typeof getSymbolInfo>;
    symbolName?: string;
    mode?: "win" | "land" | "none" | "idle";
    t?: number;
    overlayTint?: number;
    overlayAlpha?: number;
    scale?: number;
    cell?: { reel: number; row: number };
    big?: boolean;
    swayT?: number;
    idleAct?: number;
    idleU?: number;
    idleLoop?: number;
  };
  const props: Props = $props();
  const width = $derived(
    SYMBOL_SIZE * props.symbolInfo.sizeRatios.width * (props.scale ?? 1),
  );
  const height = $derived(
    SYMBOL_SIZE * props.symbolInfo.sizeRatios.height * (props.scale ?? 1),
  );
  const name = $derived(props.symbolName ?? "");
  const overlay = $derived(props.overlayAlpha !== undefined);
  const win = $derived(props.mode === "win");
  const idle = $derived(props.mode === "idle");
  const ms = $derived(
    win || props.mode === "land" ? (props.t ?? 0) : (props.swayT ?? 0),
  );
  const energy = $derived(streetEnergy(ms, props.idleU ?? -1, win));
  const active = $derived((win || idle) && !overlay);
</script>

<Container>
  {#if MESH_SYMBOLS.has(name) && props.mode !== "none"}
    {#key props.symbolInfo.assetKey}
      <StreetSymbolMesh
        assetKey={props.symbolInfo.assetKey}
        {name}
        {width}
        {height}
        {ms}
        actU={props.idleU ?? -1}
        {win}
        tint={overlay ? props.overlayTint : 0xffffff}
        alpha={overlay ? props.overlayAlpha : 1}
      />
    {/key}
  {:else}
    <Sprite
      key={props.symbolInfo.assetKey}
      anchor={0.5}
      {width}
      {height}
      tint={overlay ? (props.overlayTint ?? 0xffffff) : 0xffffff}
      alpha={overlay ? props.overlayAlpha : 1}
    />
  {/if}
  {#if active && TAG_PATHS[name]}
    {#key props.symbolInfo.assetKey}
      <GraffitiTrace
        assetKey={props.symbolInfo.assetKey}
        {name}
        {width}
        {height}
        u={win ? Math.min(1, ms / HOLD_MS) : (props.idleU ?? -1)}
      />
    {/key}
  {/if}
  {#if active}
    <Graphics
      draw={(g) => {
        g.clear();
        const w = width;
        const h = height;
        const a = energy;
        if (TAG_PATHS[name]) {
          const u = win ? Math.min(1, ms / HOLD_MS) : (props.idleU ?? -1);
          if (u < 0) return;
          const ink = ease(u / 0.12) * (1 - ease((u - 0.78) / 0.22));
          const paths = TAG_PATHS[name];
          for (let i = 0; i < paths.length; i++) {
            const delay = name === "L2" ? i * 0.07 : i * 0.18;
            const p = ease((u - delay) / (0.43 - delay * 0.25));
            const points = tracePath(paths[i], p);
            // A sodium-orange paint tip follows the off-white painted stroke.
            // Colour reveal uses the original texture alpha in GraffitiTrace.
            // The wide trace mask cannot grow a white edge outside the source icon.
            const tip = points.at(-1)!;
            if (p > 0 && p < 1) {
              g.circle((tip[0] - 0.5) * w, (tip[1] - 0.5) * h, w * 0.025).fill({
                color: 0xf5893d,
                alpha: ink,
              });
              for (let j = 0; j < 3; j++) {
                const z = (u * 3 + j * 0.31) % 1;
                g.circle(
                  (tip[0] - 0.5 + 0.04 * z) * w,
                  (tip[1] - 0.5 + 0.03 * (j - 1)) * h,
                  w * 0.006,
                ).fill({ color: 0xf7f5f0, alpha: (1 - z) * ink * 0.7 });
              }
            }
          }
        } else if (name === "H2") {
          // Window glass polygons measured on this building, not generic floating squares.
          const windows = [
            [
              [0.191, 0.382],
              [0.226, 0.366],
              [0.225, 0.466],
              [0.192, 0.477],
            ],
            [
              [0.301, 0.333],
              [0.333, 0.322],
              [0.332, 0.425],
              [0.301, 0.438],
            ],
            [
              [0.487, 0.295],
              [0.53, 0.299],
              [0.53, 0.397],
              [0.487, 0.397],
            ],
            [
              [0.488, 0.508],
              [0.53, 0.515],
              [0.529, 0.621],
              [0.487, 0.618],
            ],
            [
              [0.661, 0.562],
              [0.689, 0.577],
              [0.689, 0.65],
              [0.661, 0.644],
            ],
            [
              [0.284, 0.753],
              [0.315, 0.744],
              [0.315, 0.838],
              [0.284, 0.845],
            ],
          ];
          for (let i = 0; i < windows.length; i++) {
            const u = win ? ms / HOLD_MS : (props.idleU ?? -1);
            const light =
              ease((u - i * 0.055) / 0.14) * (1 - ease((u - 0.75) / 0.25));
            g.poly(
              windows[i].flatMap(([x, y]) => [(x - 0.5) * w, (y - 0.5) * h]),
            ).fill({ color: i % 2 ? 0xffc38a : 0xf7d88c, alpha: light * 0.72 });
          }
        } else if (name === "H1" || name === "W") {
          const u = win ? ms / HOLD_MS : (props.idleU ?? -1);
          if (u < 0) return;
          const x = name === "W" ? 0.2 + 0.6 * u : 0.23 + 0.55 * u;
          const y =
            name === "W" ? 0.59 - 0.15 * u : 0.46 + 0.2 * Math.sin(Math.PI * u);
          const rr = w * 0.055 * bell(u),
            px = (x - 0.5) * w,
            py = (y - 0.5) * h;
          g.poly([
            px,
            py - rr,
            px + rr * 0.18,
            py - rr * 0.18,
            px + rr,
            py,
            px + rr * 0.18,
            py + rr * 0.18,
            px,
            py + rr,
            px - rr * 0.18,
            py + rr * 0.18,
            px - rr,
            py,
            px - rr * 0.18,
            py - rr * 0.18,
          ]).fill({ color: 0xf7f5f0, alpha: a });
        } else if (name === "H5") {
          // Headlights are registered on the car's front, not on its wheels.
          for (const [x, y] of [
            [0.487, 0.554],
            [0.551, 0.549],
            [0.856, 0.536],
            [0.91, 0.527],
          ]) {
            const [px, py] = streetPoint(
              name,
              x,
              y,
              ms,
              props.idleU ?? -1,
              win,
            );
            g.ellipse(
              (px - 0.5) * w,
              (py - 0.5) * h,
              w * 0.016,
              h * 0.022,
            ).fill({ color: 0xffd9a3, alpha: a * 0.6 });
          }
        } else if (name === "S") {
          // Small meter bars above the tape slot, tied to the same membrane beat.
          for (let i = 0; i < 5; i++) {
            const hh =
              h * (0.006 + 0.014 * a * (0.5 + 0.5 * Math.sin(ms / 100 + i)));
            g.rect(
              (0.499 + i * 0.025 - 0.5) * w,
              (0.531 - 0.5) * h - hh,
              w * 0.014,
              hh,
            ).fill({ color: i === 4 ? 0xf5893d : 0xf7f5f0, alpha: 0.8 * a });
          }
        }
      }}
    />
  {/if}
  {#if name === "W" && !overlay}
    <Text
      text="WILD"
      anchor={0.5}
      y={height * 0.18}
      style={{
        fontFamily: TITLE_FONT,
        fontWeight: TITLE_FONT_WEIGHT,
        fontSize: width * 0.13,
        fill: 0xf7f5f0,
        stroke: { color: 0x121212, width: 2 },
      }}
    />
  {/if}
</Container>
