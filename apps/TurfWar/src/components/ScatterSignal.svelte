<script lang="ts">
  import { onMount } from 'svelte';
  import { Container, Graphics } from 'pixi-svelte';
  import { SYMBOL_SIZE } from '../game/constants';
  import { featureTimeScale } from '../game/timeScale';
  type Props = { x: number; y: number; delay: number; oncomplete: () => void };
  const props: Props = $props();
  let elapsed = $state(-1);
  const duration = 820;
  onMount(() => {
    const speed = featureTimeScale();
    const start = performance.now() + props.delay / speed;
    let raf = 0, done = false;
    const finish = () => { if (done) return; done = true; elapsed = duration; props.oncomplete(); };
    const tick = (now: number) => {
      elapsed = (now - start) * speed;
      if (elapsed >= duration) finish();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const timer = setTimeout(finish, (duration + props.delay) / speed + 40);
    return () => { done = true; cancelAnimationFrame(raf); clearTimeout(timer); };
  });
</script>

<Container x={props.x} y={props.y}>
  <Graphics draw={g => {
    g.clear(); if (elapsed < 0 || elapsed >= duration) return;
    const size = SYMBOL_SIZE * 1.08;
    // Centres measured on fs.png; the wave travels out of the two speakers.
    for (const [cx,cy,direction] of [[-.2,.15,Math.PI],[.3,.19,0]]) {
      for (let i = 0; i < 3; i++) {
        const u = (elapsed - i * 125) / 540;
        if (u <= 0 || u >= 1) continue;
        const radius = size * (.13 + .18 * (1 - (1-u)**2));
        const alpha = Math.min(1,u/.12)*(1-u);
        for (const [width,color,a] of [[7,0x121212,alpha],[3.5,0xf5893d,alpha]]) {
          g.arc(cx*size,cy*size,radius,direction-.72,direction+.72);
          g.stroke({width,color,alpha:a,cap:'round'});
        }
      }
    }
    // Tape-deck meters pulse twice and settle, rather than orbiting the board.
    const envelope = Math.sin(Math.PI*Math.min(1,elapsed/duration))**2;
    for (let i=0;i<5;i++) {
      const height = size*(.018+.055*envelope*(.5+.5*Math.sin(elapsed/48+i*.85)));
      const x = size*(-.075+i*.038), y = -size*.13;
      g.rect(x-1,y-height-2,size*.023+2,height+4).fill({color:0x121212,alpha:envelope});
      g.rect(x,y-height,size*.023,height).fill({color:i===4?0xf5893d:0xf7f5f0,alpha:envelope});
    }
  }}/>
</Container>
