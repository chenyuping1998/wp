// Normalised to the board width. These radii sit inside the painted arch's
// teal channel, leaving both stone lips visible even at an off-centre stop.
export const SCARAB_LAYOUT = {
 innerRadius: .318,
 outerRadius: .390,
 labelRadius: .354,
 labelSize: .044,
 plateSize: .095,
 plateY: -.006,
 resultScale: 1.1,
 visibleSegments: 7,
} as const;

/** A curved tile, clipped to the half arch before it is drawn. */
export function scarabSector(angle:number,width:number,cx:number,cy:number){
 const half=Math.PI/SCARAB_LAYOUT.visibleSegments/2-.012;
 const a0=Math.max(0,angle-half),a1=Math.min(Math.PI,angle+half);
 if(a1<=a0)return [];
 const points:number[]=[];
 const count=Math.max(2,Math.ceil((a1-a0)*48));
 for(let i=0;i<=count;i++){
  const a=a0+(a1-a0)*i/count,r=width*SCARAB_LAYOUT.outerRadius;
  points.push(cx+Math.cos(a)*r,cy-Math.sin(a)*r);
 }
 for(let i=count;i>=0;i--){
  const a=a0+(a1-a0)*i/count,r=width*SCARAB_LAYOUT.innerRadius;
  points.push(cx+Math.cos(a)*r,cy-Math.sin(a)*r);
 }
 return points;
}
