import { describe, expect, it } from "vitest";
import { convertLength } from "../src/converters/length.js";
import { convertMass } from "../src/converters/mass.js";
import { convertTemperature } from "../src/converters/temperature.js";
import { convertArea } from "../src/converters/area.js";

describe("convertLength", () => {
  it("converts meters to feet using the reference factor", () => {
    expect(convertLength(1, "meter", "foot")).toBeCloseTo(3.28084, 4);
  });

  it("round-trips without drift", () => {
    const value = 123.456;
    const converted = convertLength(convertLength(value, "mile", "meter"), "meter", "mile");
    expect(converted).toBeCloseTo(value, 9);
  });

  it("is a no-op for identical units", () => {
    expect(convertLength(42, "kilometer", "kilometer")).toBe(42);
  });
});

describe("convertMass", () => {
  it("converts kilograms to pounds using the reference factor", () => {
    expect(convertMass(1, "kilogram", "pound")).toBeCloseTo(2.20462, 4);
  });

  it("round-trips without drift", () => {
    const value = 77.7;
    const converted = convertMass(convertMass(value, "stone", "gram"), "gram", "stone");
    expect(converted).toBeCloseTo(value, 6);
  });
});

describe("convertTemperature", () => {
  it("converts freezing and boiling points of water", () => {
    const freezing = convertTemperature(0, "celsius", "fahrenheit");
    expect(freezing.ok).toBe(true);
    if (freezing.ok) expect(freezing.value).toBeCloseTo(32);

    const boiling = convertTemperature(100, "celsius", "fahrenheit");
    expect(boiling.ok).toBe(true);
    if (boiling.ok) expect(boiling.value).toBeCloseTo(212);
  });

  it("supports negative values", () => {
    const result = convertTemperature(-40, "celsius", "fahrenheit");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeCloseTo(-40);
  });

  it("converts kelvin correctly", () => {
    const result = convertTemperature(0, "kelvin", "celsius");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeCloseTo(-273.15);
  });

  it("rejects sub-absolute-zero values", () => {
    const result = convertTemperature(-300, "celsius", "kelvin");
    expect(result.ok).toBe(false);
  });
});

describe("convertArea", () => {
  it("converts square meters to square feet using the reference factor", () => {
    expect(convertArea(1, "square_meter", "square_foot")).toBeCloseTo(10.7639, 3);
  });

  it("converts acres to square meters", () => {
    expect(convertArea(1, "acre", "square_meter")).toBeCloseTo(4046.8564, 3);
  });
});
