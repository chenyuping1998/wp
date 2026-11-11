<script lang="ts">
  import { onMount } from 'svelte';
  import { Application, Assets, type Texture } from 'pixi.js';
  import { LayeredFigure, type LayeredRig } from '../game/layeredFigure';
  import type { CastReactionKind } from '../game/castMotion';
  let host: HTMLDivElement;
  let figure: LayeredFigure | undefined;
  let status = $state('載入中');
  let frozen = $state(false);
  let age = $state(300);
  let speed = $state(1);
  let kind = $state<CastReactionKind>('trigger');
  let showBody = $state(true);
  function react(next: CastReactionKind) {
    kind = next;
    if (!figure) return;
    figure.react(kind, frozen ? 1000 : performance.now(), speed);
    if (frozen) figure.update(1000 + age / speed);
  }
  function seek() {
    frozen = true;
    figure?.react(kind, 1000, speed);
    figure?.update(1000 + age / speed);
  }
  function toggleBody() {
    for (const part of figure?.view.children ?? []) if (part.label.startsWith('prisoner-body')) part.visible=showBody;
  }
  onMount(() => {
    let disposed = false;
    const app = new Application();
    void (async () => {
      await app.init({ width: 512, height: 1024, background: '#252924', antialias: true, resolution: 1 });
      if (disposed) { app.destroy(true); return; }
      host.appendChild(app.canvas);
      const response = await fetch('/assets/castLayers/prisoner_crossed/layers.json');
      if (!response.ok) throw new Error(`rig ${response.status}`);
      const rig = await response.json() as LayeredRig;
      const textures: Record<string, Texture> = {};
      for (const part of rig.layers) textures[part.name] = await Assets.load(`/assets/castLayers/prisoner_crossed/${part.texture}`);
      if (disposed) return;
      figure = new LayeredFigure(rig, textures);
      figure.view.scale.set(.5);
      app.stage.addChild(figure.view);
      figure.update(performance.now());
      app.ticker.add(() => { if (!frozen) figure?.update(performance.now()); });
      status = '4 張連續網格 · 共用正式骨架／動作 · 1024×2048';
    })().catch(error => status = String(error));
    return () => { disposed=true; figure=undefined; if (app.renderer) app.destroy(true, { children:true }); };
  });
</script>
<div class="review">
  <div class="controls">
    <h1>HARD TIME</h1><p>分層角色 · 可用版本</p><p>{status}</p>
    <div class="buttons"><button onclick={() => react('win')}>一般得獎</button><button onclick={() => react('winBig')}>大獎</button><button onclick={() => react('trigger')}>免費遊戲觸發</button></div>
    <label>速度 <select bind:value={speed}><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label>
    <label><input type="checkbox" bind:checked={frozen} onchange={() => frozen ? seek() : react(kind)}>定格檢查</label>
    <label>反應時間 {age} ms <input aria-label="反應時間" type="range" min="0" max="1400" step="10" bind:value={age} oninput={seek}></label>
    <label><input type="checkbox" bind:checked={showBody} onchange={toggleBody}>顯示身體（取消可看肩部及頸部補畫）</label>
    <p class="note">待機持續運作；按上方按鈕播放反應。此頁使用遊戲同一個 LayeredFigure，並非另外模擬的動畫。</p>
  </div>
  <div class="figure" bind:this={host}></div>
</div>
<style>
.review{min-height:100vh;box-sizing:border-box;padding:28px;background:#171b18;color:#e9e4d7;font:16px system-ui;display:flex;justify-content:center;gap:40px}.controls{max-width:410px}h1{font-size:34px;color:#d4be90;margin-bottom:0}.buttons{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}button,select{font:inherit;padding:10px 14px;border:1px solid #ad9c76;background:#2a312b;color:#f0e5d2;border-radius:5px}button:hover{background:#414b42}label{display:block;margin:18px 0}input[type=range]{display:block;width:100%;margin-top:12px}.note{line-height:1.7;color:#abb4aa}.figure :global(canvas){display:block;max-height:90vh;max-width:100%;width:auto;height:auto}.figure{max-width:50%}@media(max-width:650px){.review{padding:16px;gap:10px}.controls{max-width:50%;font-size:13px}.figure{max-width:50%}h1{font-size:22px}button{padding:8px}}
</style>
