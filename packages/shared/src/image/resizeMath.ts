export interface ResizeTarget {
  width: number;
  height: number;
}

/**
 * Computes output pixel dimensions for a resize operation, given an
 * optional target width and/or height and whether the aspect ratio should
 * be locked. Pure math — no canvas or Node.js dependency — so it is usable
 * identically on the client (to size an OffscreenCanvas) and in tests.
 *
 * - Neither target given: dimensions are unchanged.
 * - `lockAspectRatio: false`: stretches to exactly the given dimension(s),
 *   defaulting any omitted dimension to the source size.
 * - `lockAspectRatio: true` with only one target given: scales
 *   proportionally from that one dimension.
 * - `lockAspectRatio: true` with both given: contains the image within that
 *   box without exceeding either dimension (same as sharp's `fit: "inside"`).
 */
export function computeResizeDimensions(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number | undefined,
  targetHeight: number | undefined,
  lockAspectRatio: boolean
): ResizeTarget {
  if (targetWidth === undefined && targetHeight === undefined) {
    return { width: sourceWidth, height: sourceHeight };
  }

  if (!lockAspectRatio) {
    return {
      width: targetWidth ?? sourceWidth,
      height: targetHeight ?? sourceHeight,
    };
  }

  const aspect = sourceWidth / sourceHeight;

  if (targetWidth !== undefined && targetHeight !== undefined) {
    const boxAspect = targetWidth / targetHeight;
    if (boxAspect > aspect) {
      return { width: Math.max(1, Math.round(targetHeight * aspect)), height: targetHeight };
    }
    return { width: targetWidth, height: Math.max(1, Math.round(targetWidth / aspect)) };
  }

  if (targetWidth !== undefined) {
    return { width: targetWidth, height: Math.max(1, Math.round(targetWidth / aspect)) };
  }

  return { width: Math.max(1, Math.round(targetHeight! * aspect)), height: targetHeight! };
}
