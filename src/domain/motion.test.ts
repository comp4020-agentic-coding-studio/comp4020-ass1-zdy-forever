import { describe, expect, it } from "vitest";
import {
  classifyMotionBlur,
  motionBlurKernelLength,
  shutterSlownessStops,
  subjectMotionBlurStrength,
} from "./motion";

describe("shutterSlownessStops", () => {
  it("is zero at the baseline", () => {
    expect(shutterSlownessStops(1 / 250, 1 / 250)).toBe(0);
  });

  it("is positive for a slower shutter", () => {
    expect(shutterSlownessStops(1 / 30, 1 / 250)).toBeGreaterThan(0);
  });

  it("is negative for a faster shutter", () => {
    expect(shutterSlownessStops(1 / 1000, 1 / 250)).toBeLessThan(0);
  });
});

describe("subjectMotionBlurStrength", () => {
  it("is zero at or below baseline", () => {
    expect(subjectMotionBlurStrength(0)).toBe(0);
    expect(subjectMotionBlurStrength(-2)).toBe(0);
  });

  it("reaches full strength five stops slower than baseline", () => {
    expect(subjectMotionBlurStrength(5)).toBeCloseTo(1, 5);
  });

  it("increases monotonically with slowness", () => {
    expect(subjectMotionBlurStrength(1)).toBeLessThan(subjectMotionBlurStrength(3));
  });
});

describe("motionBlurKernelLength", () => {
  it("is zero at zero strength", () => {
    expect(motionBlurKernelLength(0)).toBe(0);
  });

  it("reaches the max length at full strength", () => {
    expect(motionBlurKernelLength(1, 18)).toBe(18);
  });

  it("eases in gently at moderate semantic strength", () => {
    expect(motionBlurKernelLength(0.4, 18)).toBeLessThan(8);
  });

  it("clamps out-of-range strength", () => {
    expect(motionBlurKernelLength(2, 18)).toBe(18);
    expect(motionBlurKernelLength(-1, 18)).toBe(0);
  });
});

describe("classifyMotionBlur", () => {
  it("classifies the five bands", () => {
    expect(classifyMotionBlur(0)).toBe("frozen");
    expect(classifyMotionBlur(0.2)).toBe("slight");
    expect(classifyMotionBlur(0.4)).toBe("visible");
    expect(classifyMotionBlur(0.7)).toBe("strong");
    expect(classifyMotionBlur(0.95)).toBe("extreme");
  });
});
