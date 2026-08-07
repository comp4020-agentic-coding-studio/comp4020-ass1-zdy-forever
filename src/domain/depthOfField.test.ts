import { describe, expect, it } from "vitest";
import {
  BLUR_LEVELS_PX,
  apertureWideningStops,
  blurStrength,
  classifyDepthOfField,
  depthDistanceFromFocus,
  incrementalBlurStrength,
  selectBlurLevelIndex,
  selectBlurPx,
} from "./depthOfField";

describe("apertureWideningStops", () => {
  it("is zero when unchanged from base", () => {
    expect(apertureWideningStops(4, 4)).toBe(0);
  });

  it("is positive when wider than base (smaller f-number)", () => {
    expect(apertureWideningStops(1.4, 4)).toBeGreaterThan(0);
  });

  it("is negative when narrower than base (larger f-number)", () => {
    expect(apertureWideningStops(11, 4)).toBeLessThan(0);
  });
});

describe("blurStrength", () => {
  it("is zero when not wider than base", () => {
    expect(blurStrength(0)).toBe(0);
    expect(blurStrength(-2)).toBe(0);
  });

  it("reaches full strength at four widening stops", () => {
    expect(blurStrength(4)).toBeCloseTo(1, 5);
  });

  it("increases monotonically with widening stops", () => {
    expect(blurStrength(1)).toBeLessThan(blurStrength(3));
  });
});

describe("incrementalBlurStrength", () => {
  it("adds only residual blur on top of a source photo's existing depth of field", () => {
    expect(incrementalBlurStrength(3)).toBeLessThan(blurStrength(3));
    expect(incrementalBlurStrength(4)).toBeCloseTo(0.7, 5);
  });
});

describe("selectBlurLevelIndex / selectBlurPx", () => {
  it("selects the sharpest level at the focus plane", () => {
    expect(selectBlurLevelIndex(0, 1)).toBe(0);
    expect(selectBlurPx(0, 1)).toBe(0);
  });

  it("selects the strongest level far from focus at full strength", () => {
    expect(selectBlurLevelIndex(1, 1)).toBe(BLUR_LEVELS_PX.length - 1);
    expect(selectBlurPx(1, 1)).toBe(BLUR_LEVELS_PX[BLUR_LEVELS_PX.length - 1]);
  });

  it("stays sharp everywhere when strength is zero", () => {
    expect(selectBlurLevelIndex(1, 0)).toBe(0);
  });

  it("increases blur with distance from focus at fixed strength", () => {
    const near = selectBlurLevelIndex(0.2, 0.8);
    const far = selectBlurLevelIndex(0.9, 0.8);
    expect(far).toBeGreaterThanOrEqual(near);
  });

  it("only returns values present in the blur pyramid", () => {
    for (let d = 0; d <= 1; d += 0.1) {
      for (let s = 0; s <= 1; s += 0.1) {
        expect(BLUR_LEVELS_PX).toContain(selectBlurPx(d, s));
      }
    }
  });
});

describe("classifyDepthOfField", () => {
  it("classifies the five bands", () => {
    expect(classifyDepthOfField(0)).toBe("very-deep");
    expect(classifyDepthOfField(0.2)).toBe("deep");
    expect(classifyDepthOfField(0.4)).toBe("moderate");
    expect(classifyDepthOfField(0.7)).toBe("shallow");
    expect(classifyDepthOfField(0.95)).toBe("very-shallow");
  });
});

describe("depthDistanceFromFocus", () => {
  it("is zero exactly at the focus plane", () => {
    expect(depthDistanceFromFocus(0.4, 0.4)).toBe(0);
  });

  it("is the absolute difference otherwise", () => {
    expect(depthDistanceFromFocus(0.9, 0.3)).toBeCloseTo(0.6, 10);
    expect(depthDistanceFromFocus(0.1, 0.7)).toBeCloseTo(0.6, 10);
  });

  it("clamps out-of-range inputs into [0, 1] first", () => {
    expect(depthDistanceFromFocus(-1, 2)).toBeCloseTo(1, 10);
  });
});
