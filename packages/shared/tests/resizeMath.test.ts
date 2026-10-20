import { describe, expect, it } from "vitest";
import { computeResizeDimensions } from "../src/image/resizeMath.js";

describe("computeResizeDimensions", () => {
  it("returns source dimensions when no target is given", () => {
    expect(computeResizeDimensions(400, 200, undefined, undefined, true)).toEqual({ width: 400, height: 200 });
  });

  it("scales proportionally from width only, aspect locked", () => {
    expect(computeResizeDimensions(400, 200, 200, undefined, true)).toEqual({ width: 200, height: 100 });
  });

  it("scales proportionally from height only, aspect locked", () => {
    expect(computeResizeDimensions(400, 200, undefined, 50, true)).toEqual({ width: 100, height: 50 });
  });

  it("contains within a box when both dimensions are given and aspect is locked", () => {
    // 400x200 (2:1) into a 100x100 box -> limited by height ratio -> 100x50
    expect(computeResizeDimensions(400, 200, 100, 100, true)).toEqual({ width: 100, height: 50 });
  });

  it("stretches to exact dimensions when aspect ratio is not locked", () => {
    expect(computeResizeDimensions(400, 200, 100, 100, false)).toEqual({ width: 100, height: 100 });
  });

  it("defaults an omitted dimension to the source size when unlocked", () => {
    expect(computeResizeDimensions(400, 200, 150, undefined, false)).toEqual({ width: 150, height: 200 });
  });
});
