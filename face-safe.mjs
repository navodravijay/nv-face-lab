/**
 * Face-safe rendering geometry. This module never receives or stores images;
 * it only derives a transient exclusion rectangle from in-memory landmarks.
 */
export const FX_PLACEMENTS = Object.freeze(['focused', 'cinematic']);
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

export function faceExclusionRect(points, project, width, height, placement = 'focused') {
  if (!(width > 0 && height > 0)) throw new RangeError('Canvas dimensions must be positive');
  const focused = placement !== 'cinematic';
  const coords = Array.isArray(points) && typeof project === 'function'
    ? points.map(project).filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y)) : [];
  let left, right, top, bottom;
  if (coords.length >= 6) {
    left = Math.min(...coords.map(p => p.x)); right = Math.max(...coords.map(p => p.x));
    top = Math.min(...coords.map(p => p.y)); bottom = Math.max(...coords.map(p => p.y));
    const padX = Math.max(focused ? 36 : 26, (right-left)*(focused ? .28 : .19));
    const padY = Math.max(focused ? 42 : 28, (bottom-top)*(focused ? .22 : .15));
    left -= padX; right += padX; top -= padY; bottom += padY;
  } else {
    // Match the idle wireframe's proportions; keep the same clean center
    // even when camera is stopped or tracking temporarily disappears.
    const rx = Math.min(width*.155,height*.245);
    const ry = Math.min(height*.31,width*.19);
    const pad = focused ? 1.52 : 1.32;
    left = width*.5-rx*pad; right=width*.5+rx*pad;
    top=height*.43-ry*pad; bottom=height*.43+ry*pad;
  }
  const x=clamp(left,0,width), y=clamp(top,0,height);
  return {x,y,width:clamp(right,0,width)-x,height:clamp(bottom,0,height)-y};
}

export function outsideFace(rect, point) {
  return point.x < rect.x || point.x > rect.x+rect.width ||
    point.y < rect.y || point.y > rect.y+rect.height;
}

/** One fixed decorative ornament in the top-left of the stage. */
export function peripheralAnchors(width, height) {
  if (!(width > 0 && height > 0)) return [];
  return [{x:width*(width <= 560 ? .16 : .135), y:height*(width <= 560 ? .21 : .24)}];
}
