import { describe, expect, it } from "vitest";
import {
  classifyMotionBlur,
  handheldShakeStrength,
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

describe("handheldShakeStrength", () => {
  it("is zero at or faster than the handheld threshold", () => {
    expect(handheldShakeStrength(1 / 60, 60)).toBe(0);
    expect(handheldShakeStrength(1 / 125, 60)).toBe(0);
  });

  it("grows once the shutter drops below the threshold", () => {
    expect(handheldShakeStrength(1 / 15, 60)).toBeGreaterThan(0);
  });

  it("increases as the shutter gets even slower", () => {
    const moderate = handheldShakeStrength(1 / 15, 60);
    const slower = handheldShakeStrength(1 / 4, 60);
    expect(slower).toBeGreaterThan(moderate);
  });
});

describe("motionBlurKernelLength", () => {
  it("is zero at zero strength", () => {
    expect(motionBlurKernelLength(0)).toBe(0);
  });

  it("reaches the max length at full strength", () => {
    expect(motionBlurKernelLength(1, 32)).toBe(32);
  });

  it("clamps out-of-range strength", () => {
    expect(motionBlurKernelLength(2, 32)).toBe(32);
    expect(motionBlurKernelLength(-1, 32)).toBe(0);
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
