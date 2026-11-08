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
 minAngle: 26*Math.PI/180,
 maxAngle: 154*Math.PI/180,
} as const;

// The hand-painted arch is not a perfect circle at its two lower ends.
// Keep the plates under its stone lips and stop before the raised end caps.
const outerProfile=[
 [26,.343],[30,.366],[36,.378],[45,.383],[60,.385],[72,.390],
 [110,.390],[130,.388],[145,.381],[150,.375],[154,.354],
]as const;
function outerRadius(angle:number){
 const degrees=angle*180/Math.PI;
 for(let i=1;i<outerProfile.length;i++){
  const [a,r]=outerProfile[i-1],[b,s]=outerProfile[i];
  if(degrees<=b)return r+(s-r)*Math.max(0,(degrees-a)/(b-a));
 }
 return outerProfile.at(-1)![1];
}

/** A curved tile, clipped to the half arch before it is drawn. */
export function scarabSector(angle:number,width:number,cx:number,cy:number){
 const half=Math.PI/SCARAB_LAYOUT.visibleSegments/2-.012;
 const a0=Math.max(SCARAB_LAYOUT.minAngle,angle-half),a1=Math.min(SCARAB_LAYOUT.maxAngle,angle+half);
 if(a1<=a0)return [];
 const points:number[]=[];
 const count=Math.max(2,Math.ceil((a1-a0)*48));
 for(let i=0;i<=count;i++){
  const a=a0+(a1-a0)*i/count,r=width*outerRadius(a);
  points.push(cx+Math.cos(a)*r,cy-Math.sin(a)*r);
 }
 for(let i=count;i>=0;i--){
  const a=a0+(a1-a0)*i/count,r=width*SCARAB_LAYOUT.innerRadius;
  points.push(cx+Math.cos(a)*r,cy-Math.sin(a)*r);
 }
 return points;
}
