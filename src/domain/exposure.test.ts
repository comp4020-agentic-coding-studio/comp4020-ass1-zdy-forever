import { describe, expect, it } from "vitest";
import {
  applyExposureToLinear,
  calculateStops,
  classifyExposure,
  clamp01,
  exposureLabel,
  linearToSrgb,
  srgbToLinear,
} from "./exposure";
import type { CameraSettings } from "./types";

const base: CameraSettings = { iso: 100, aperture: 4, shutterSeconds: 1 / 125 };

describe("calculateStops", () => {
  it("is zero at base settings", () => {
    const stops = calculateStops(base, base);
    expect(stops.isoStops).toBe(0);
    expect(stops.apertureStops).toBe(0);
    expect(stops.shutterStops).toBe(0);
    expect(stops.totalStops).toBe(0);
  });

  it("doubling ISO adds exactly one stop", () => {
    const stops = calculateStops({ ...base, iso: 200 }, base);
    expect(stops.isoStops).toBeCloseTo(1, 10);
    expect(stops.totalStops).toBeCloseTo(1, 10);
  });

  it("widening aperture by one full stop (f/4 -> f/2.8) adds one stop", () => {
    const stops = calculateStops({ ...base, aperture: 2.8 }, base);
    expect(stops.apertureStops).toBeCloseTo(1, 1);
  });

  it("narrowing aperture reduces stops (more light needed)", () => {
    const stops = calculateStops({ ...base, aperture: 8 }, base);
    expect(stops.apertureStops).toBeLessThan(0);
  });

  it("doubling shutter duration adds exactly one stop", () => {
    const stops = calculateStops({ ...base, shutterSeconds: 1 / 62.5 }, base);
    expect(stops.shutterStops).toBeCloseTo(1, 10);
  });

  it("combines all three contributions additively", () => {
    const settings: CameraSettings = { iso: 400, aperture: 2.8, shutterSeconds: 1 / 60 };
    const stops = calculateStops(settings, base);
    expect(stops.totalStops).toBeCloseTo(stops.isoStops + stops.apertureStops + stops.shutterStops, 10);
  });
});

describe("srgbToLinear / linearToSrgb", () => {
  it("round-trips 0 and 255 exactly", () => {
    expect(linearToSrgb(srgbToLinear(0))).toBe(0);
    expect(linearToSrgb(srgbToLinear(255))).toBe(255);
  });

  it("round-trips mid-tones within rounding tolerance", () => {
    for (const value of [1, 16, 64, 128, 200, 254]) {
      expect(Math.abs(linearToSrgb(srgbToLinear(value)) - value)).toBeLessThanOrEqual(1);
    }
  });

  it("is monotonic increasing", () => {
    expect(srgbToLinear(50)).toBeLessThan(srgbToLinear(150));
  });
});

describe("clamp01", () => {
  it("clamps below 0 and above 1", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(1.5)).toBe(1);
    expect(clamp01(0.5)).toBe(0.5);
  });
});

describe("applyExposureToLinear", () => {
  it("leaves mid-grey roughly unchanged at zero stops", () => {
    const result = applyExposureToLinear(0.18, 0);
    // Reinhard tone-mapping compresses even at 0 stops, so this is close but
    // not identical to the input — assert it's in the right neighbourhood.
    expect(result).toBeGreaterThan(0.1);
    expect(result).toBeLessThan(0.25);
  });

  it("brightens as stops increase", () => {
    const dim = applyExposureToLinear(0.1, 0);
    const bright = applyExposureToLinear(0.1, 2);
    expect(bright).toBeGreaterThan(dim);
  });

  it("darkens as stops decrease", () => {
    const base = applyExposureToLinear(0.5, 0);
    const darker = applyExposureToLinear(0.5, -2);
    expect(darker).toBeLessThan(base);
  });

  it("never exceeds 1 or drops below 0 no matter how extreme the stops", () => {
    expect(applyExposureToLinear(1, 20)).toBeLessThanOrEqual(1);
    expect(applyExposureToLinear(1, 20)).toBeGreaterThanOrEqual(0);
    expect(applyExposureToLinear(0, -20)).toBeGreaterThanOrEqual(0);
  });

  it("rolls off toward white at high stops rather than jumping straight to 1", () => {
    const bright = applyExposureToLinear(0.5, 4);
    const brighter = applyExposureToLinear(0.5, 8);
    expect(brighter).toBeGreaterThan(bright);
    expect(brighter).toBeLessThan(1);
  });
});

describe("classifyExposure", () => {
  it("classifies the five bands at their boundaries", () => {
    expect(classifyExposure(-4)).toBe("very-dark");
    expect(classifyExposure(-2)).toBe("dark");
    expect(classifyExposure(0)).toBe("balanced");
    expect(classifyExposure(2)).toBe("bright");
    expect(classifyExposure(4)).toBe("clipped");
  });

  it("has labels for every level", () => {
    for (const level of ["very-dark", "dark", "balanced", "bright", "clipped"] as const) {
      expect(exposureLabel(level).length).toBeGreaterThan(0);
    }
  });
});
