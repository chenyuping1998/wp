export function waveWipePose(time:number,width:number,height:number){
 const reveal=time>=680;
 const textureHeight=height*1.08,textureWidth=Math.max(width*1.08,textureHeight*1.5);
 const progress=Math.max(0,Math.min(1,(time-(reveal?680:0))/(reveal?600:500)));
 const ease=progress*progress*(3-2*progress);
 // Both painted edges travel completely off screen before the phase changes.
 // The hold therefore swaps only opaque water, never a visible foam edge.
 const edge=-textureWidth+(width+textureWidth*2)*ease;
 const imageLeft=reveal?edge+textureWidth:edge-textureWidth;
 const seam=reveal?imageLeft-textureWidth*.25:imageLeft+textureWidth*.25;
 return {reveal,textureHeight,textureWidth,imageLeft,seam};
}
