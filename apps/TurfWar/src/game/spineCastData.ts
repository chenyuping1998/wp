import {
  MeshAttachment, RegionAttachment, Skeleton, SkeletonJson, TextureRegion, type AttachmentLoader,
} from '@esotericsoftware/spine-core';

/** Cast textures are already separate Pixi textures, so an atlas is unnecessary.
 * Spine still owns the weighted meshes and all animation evaluation. */
export const castAttachmentLoader: AttachmentLoader = {
  newMeshAttachment: (_skin, _placeholder, name, _path, sequence) => {
    const region = new TextureRegion();
    region.u2 = region.v2 = 1;
    sequence.regions.fill(region);
    return new MeshAttachment(name, sequence);
  },
  // spine-motion-kit boxer rigs: one cropped image per region. A unit region makes
  // Spine size the quad from the attachment's own width/height.
  newRegionAttachment: (_skin, _placeholder, name, _path, sequence) => {
    const region = new TextureRegion();
    region.u2 = region.v2 = 1;
    region.width = region.height = region.originalWidth = region.originalHeight = 1;
    sequence.regions.fill(region);
    return new RegionAttachment(name, sequence);
  },
  newBoundingBoxAttachment: () => { throw new Error('Cast has no bounding box attachments'); },
  newPathAttachment: () => { throw new Error('Cast has no path attachments'); },
  newPointAttachment: () => { throw new Error('Cast has no point attachments'); },
  newClippingAttachment: () => { throw new Error('Cast has no clipping attachments'); },
};

export type CastSpineJson = {
  skeleton: { spine: string };
  turf: {
    figureBox: [number, number, number, number];
    /** canvas position of skeleton (0,0); absent = canvas-space bones (v3) */
    origin?: [number, number];
    /** reaction -> animation name for full-body rigs (absent = additive v3 names) */
    reactions?: Record<string, string>;
    idle?: string;
    /** playback rate per animation (absent = 1) */
    speed?: Record<string, number>;
    envelope: [number, number];
    generator: string;
  };
};

export function readCastSkeleton(json: CastSpineJson) {
  if (!json.skeleton.spine.startsWith('4.3.')) throw new Error('Turf cast requires Spine 4.3');
  const data = new SkeletonJson(castAttachmentLoader).readSkeletonData(json);
  return new Skeleton(data);
}
