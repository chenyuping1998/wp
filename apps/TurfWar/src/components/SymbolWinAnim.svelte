<script lang="ts">
  import { Container, Graphics } from "pixi-svelte";
  import { onMount } from "svelte";
  import { featureTimeScale } from "../game/timeScale";
  import { SYMBOL_SIZE } from "../game/constants";
  import { getSymbolInfo } from "../game/utils";
  import { getSymbolWinMotion, HOLD_MS } from "../game/symbolWinMotion";
  import SymbolArt from "./SymbolArt.svelte";
  type Props = {
    x?: number;
    y?: number;
    symbolInfo: ReturnType<typeof getSymbolInfo>;
    symbolName: string;
    cell?: { reel: number; row: number };
    oncomplete?: () => void;
  };
  const props: Props = $props();
  let elapsed = $state(0);
  const motion = $derived(getSymbolWinMotion(props.symbolName));
  const frame = $derived(motion.frame(elapsed));
  const pulse = $derived(
    Math.sin(Math.PI * Math.min(1, elapsed / HOLD_MS)) ** 2,
  );
  const hit = $derived.by(() => {
    const u = Math.min(1, elapsed / HOLD_MS);
    const lerp = (a: number, b: number, x: number) =>
      a + (b - a) * (x * x * (3 - 2 * x));
    if (u < 0.09) return lerp(1, 0.96, u / 0.09);
    if (u < 0.23)
      return lerp(0.96, 1 + 0.22 * motion.hitScale, (u - 0.09) / 0.14);
    if (u < 0.48)
      return lerp(1 + 0.22 * motion.hitScale, 1.12, (u - 0.23) / 0.25);
    return lerp(1.12, 1, (u - 0.48) / 0.52);
  });
  const flash = $derived(
    elapsed > 80 && elapsed < 230
      ? 0.24 * Math.sin((Math.PI * (elapsed - 80)) / 150) ** 2
      : 0,
  );
  // Animation and completion use one duration. Timer also releases a hidden tab;
  // interruption resolves once, so an awaiting board cannot retain a dead cell.
  onMount(() => {
    const start = performance.now(),
      speed = featureTimeScale();
    let raf = 0,
      done = false;
    const finish = () => {
      if (done) return;
      done = true;
      elapsed = HOLD_MS;
      props.oncomplete?.();
    };
    const tick = (now: number) => {
      elapsed = Math.min(HOLD_MS, (now - start) * speed);
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const timeout = setTimeout(finish, HOLD_MS / speed);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
      finish();
    };
  });
  const HALF = SYMBOL_SIZE * 0.455,
    ARM = SYMBOL_SIZE * 0.14;
  const MARK = 0xd9d6ce,
    WHITE = 0xffffff;
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
</script>

<Container x={props.x} y={props.y}>
  <!-- The marker stays on the paying position: Neon Frames multiply positions. -->
  <Graphics
    draw={(g) => {
      g.clear()
        .roundRect(-HALF, -HALF, HALF * 2, HALF * 2, SYMBOL_SIZE * 0.08)
        .fill({ color: MARK, alpha: 0.04 + 0.05 * pulse })
        .stroke({ width: 1, color: MARK, alpha: 0.15 + 0.15 * pulse });
    }}
  />
  <Container
    scale={{ x: hit * frame.scaleX, y: hit * frame.scaleY }}
    rotation={frame.rotation}
    x={frame.dx * SYMBOL_SIZE}
    y={frame.dy * SYMBOL_SIZE}
  >
    <SymbolArt
      symbolInfo={props.symbolInfo}
      symbolName={props.symbolName}
      mode="win"
      t={elapsed}
      cell={props.cell}
    />
    {#if flash > 0.01}
      <SymbolArt
        symbolInfo={props.symbolInfo}
        symbolName={props.symbolName}
        mode="win"
        t={elapsed}
        overlayTint={0xffffff}
        overlayAlpha={flash}
      />
    {/if}
  </Container>
  <Graphics
    draw={(g) => {
      g.clear();
      for (const [width, color, alpha] of [
        [2.5, MARK, 0.5 + 0.4 * pulse],
        [1, WHITE, 0.25 + 0.45 * pulse],
      ]) {
        for (const [sx, sy] of corners) {
          const x = sx * HALF,
            y = sy * HALF;
          g.moveTo(x - sx * ARM, y)
            .lineTo(x, y)
            .lineTo(x, y - sy * ARM);
        }
        g.stroke({ width, color, alpha });
      }
    }}
  />
</Container>
