// @ts-nocheck -- standalone local QA controls use the game's debug globals.
/* Local playtest controls only. NEVER copied to build/ or upload/. */
(() => {
  const boot=setInterval(()=>{
    const app=window.__PIXI_APP__;
    if(!app||!window.__HM_CAST__)return;
    clearInterval(boot);
    const box=document.createElement('div');box.id='cast-v2-qa';
    box.style.cssText='position:fixed;top:0;left:0;z-index:999999;background:#222c;color:white;font:12px sans-serif;padding:4px';
    const figs=()=>app.stage.children.filter(n=>n.label?.startsWith('ht-cast-'));
    const button=(name,fn)=>{const b=document.createElement('button');b.textContent=name;b.onclick=fn;box.append(b);};
    button('Warden reaction',()=>window.__HM_CAST__('warden'));
    button('Prisoner reaction',()=>window.__HM_CAST__('winBig'));
    button('Hold reaction peak',()=>{for(const s of figs()){s.state.clearTrack(1);const e=s.state.setAnimation(1,'reactBig',false);e.mixDuration=0;e.trackTime=.433;e.timeScale=0;}});
    button('Hold blink',()=>{for(const s of figs()){s.state.clearTrack(2);const e=s.state.setAnimation(2,'blink',false);e.mixDuration=0;e.trackTime=.05;e.timeScale=0;}});
    button('Release cast',()=>{for(const s of figs()){s.state.setEmptyAnimation(1,.2);s.state.setEmptyAnimation(2,0);}});
    button('Save cast view',async()=>{
      const data=await app.renderer.extract.base64({target:app.stage});
      await fetch('http://127.0.0.1:4242/',{method:'POST',body:JSON.stringify({name:'game_'+innerWidth+'x'+innerHeight+'.png',data})});
      status.textContent='saved '+innerWidth+'x'+innerHeight;
    });
    const status=document.createElement('span');box.append(status);document.body.append(box);
    setInterval(()=>{if(status.textContent.startsWith('saved'))return;
      status.textContent=figs().map(s=>{const b=s.getBounds();return s.label+': '+Math.round(b.x)+','+Math.round(b.y)+' '+Math.round(b.width)+'x'+Math.round(b.height);}).join(' | ');
    },250);
  },200);
})();
