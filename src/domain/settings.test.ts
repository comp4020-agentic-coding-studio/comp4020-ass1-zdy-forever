import { describe, expect, it } from "vitest";
import {
  APERTURE_VALUES,
  ISO_VALUES,
  SHUTTER_VALUES,
  formatAperture,
  formatIso,
  formatSettings,
  formatShutter,
  isValidSettingValue,
  isValidSettings,
  nearestAllowedValue,
  stepSetting,
} from "./settings";

describe("value tables", () => {
  it("are sorted ascending", () => {
    expect([...ISO_VALUES]).toEqual([...ISO_VALUES].sort((a, b) => a - b));
    expect([...APERTURE_VALUES]).toEqual([...APERTURE_VALUES].sort((a, b) => a - b));
    expect([...SHUTTER_VALUES]).toEqual([...SHUTTER_VALUES].sort((a, b) => a - b));
  });
});

describe("nearestAllowedValue", () => {
  it("returns an exact match unchanged", () => {
    expect(nearestAllowedValue("iso", 800)).toBe(800);
  });

  it("snaps to the closest table entry", () => {
    expect(nearestAllowedValue("iso", 750)).toBe(800);
    expect(nearestAllowedValue("aperture", 3)).toBe(2.8);
  });

  it("clamps beyond the table's ends to the nearest end", () => {
    expect(nearestAllowedValue("iso", 1)).toBe(100);
    expect(nearestAllowedValue("iso", 100000)).toBe(6400);
  });
});

describe("isValidSettingValue / isValidSettings", () => {
  it("accepts values from the tables", () => {
    expect(isValidSettingValue("iso", 1600)).toBe(true);
    expect(isValidSettingValue("aperture", 5.6)).toBe(true);
    expect(isValidSettingValue("shutterSeconds", 1 / 60)).toBe(true);
  });

  it("rejects values off the tables", () => {
    expect(isValidSettingValue("iso", 150)).toBe(false);
  });

  it("requires all three settings to be on-table", () => {
    expect(isValidSettings({ iso: 100, aperture: 4, shutterSeconds: 1 / 125 })).toBe(true);
    expect(isValidSettings({ iso: 150, aperture: 4, shutterSeconds: 1 / 125 })).toBe(false);
  });
});

describe("stepSetting", () => {
  it("steps to the next value up", () => {
    expect(stepSetting("iso", 400, 1)).toBe(800);
  });

  it("steps to the next value down", () => {
    expect(stepSetting("iso", 400, -1)).toBe(200);
  });

  it("clamps at the top of the table", () => {
    expect(stepSetting("iso", 6400, 1)).toBe(6400);
  });

  it("clamps at the bottom of the table", () => {
    expect(stepSetting("iso", 100, -1)).toBe(100);
  });

  it("snaps an off-table current value before stepping", () => {
    expect(stepSetting("aperture", 3, 1)).toBe(4);
  });
});

describe("formatting", () => {
  it("formats ISO", () => {
    expect(formatIso(400)).toBe("ISO 400");
  });

  it("formats aperture", () => {
    expect(formatAperture(2.8)).toBe("f/2.8");
  });

  it("formats fast shutter speeds as a fraction", () => {
    expect(formatShutter(1 / 250)).toBe("1/250s");
  });

  it("formats shutter speeds of a full second or slower directly", () => {
    expect(formatShutter(1)).toBe("1s");
  });

  it("combines all three into one readable string", () => {
    expect(formatSettings({ iso: 400, aperture: 2.8, shutterSeconds: 1 / 250 })).toBe(
      "ISO 400, f/2.8, 1/250s",
    );
  });
});
