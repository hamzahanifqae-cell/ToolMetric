import { describe, expect, it } from "vitest";
import { calculateOhmsLaw } from "../src/electrical/ohmsLaw.js";
import { calculatePower } from "../src/electrical/power.js";
import { seriesResistance, parallelResistance } from "../src/electrical/resistance.js";
import { calculateEnergyCost } from "../src/electrical/energy.js";

describe("calculateOhmsLaw", () => {
  it("solves for resistance given voltage and current", () => {
    const result = calculateOhmsLaw({ voltage: 12, current: 2 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.resistance).toBeCloseTo(6);
      expect(result.value.power).toBeCloseTo(24);
      expect(result.value.solvedFor).toBe("resistance");
    }
  });

  it("solves for current given voltage and resistance", () => {
    const result = calculateOhmsLaw({ voltage: 10, resistance: 5 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.current).toBeCloseTo(2);
  });

  it("solves for voltage given current and resistance", () => {
    const result = calculateOhmsLaw({ current: 3, resistance: 4 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.voltage).toBeCloseTo(12);
  });

  it("rejects zero resistance when solving for current", () => {
    const result = calculateOhmsLaw({ voltage: 5, resistance: 0 });
    expect(result.ok).toBe(false);
  });

  it("rejects zero current when solving for resistance", () => {
    const result = calculateOhmsLaw({ voltage: 5, current: 0 });
    expect(result.ok).toBe(false);
  });

  it("rejects when not exactly two inputs are given", () => {
    const result = calculateOhmsLaw({ voltage: 5 });
    expect(result.ok).toBe(false);
  });
});

describe("calculatePower", () => {
  it("computes DC power as V × I", () => {
    const result = calculatePower({ mode: "dc", voltage: 12, current: 2 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.watts).toBeCloseTo(24);
  });

  it("computes single-phase AC power with power factor", () => {
    const result = calculatePower({ mode: "single-phase-ac", voltage: 230, current: 10, powerFactor: 0.9 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.watts).toBeCloseTo(2070);
  });

  it("computes balanced three-phase AC power with sqrt(3)", () => {
    const result = calculatePower({ mode: "three-phase-ac", voltage: 400, current: 10, powerFactor: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.watts).toBeCloseTo(Math.sqrt(3) * 400 * 10);
  });

  it("requires power factor for AC modes", () => {
    const result = calculatePower({ mode: "single-phase-ac", voltage: 230, current: 10 });
    expect(result.ok).toBe(false);
  });

  it("rejects power factor outside (0, 1]", () => {
    expect(calculatePower({ mode: "single-phase-ac", voltage: 230, current: 10, powerFactor: 0 }).ok).toBe(false);
    expect(calculatePower({ mode: "single-phase-ac", voltage: 230, current: 10, powerFactor: 1.5 }).ok).toBe(false);
  });
});

describe("resistance", () => {
  it("sums series resistances", () => {
    const result = seriesResistance([10, 20, 30]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(60);
  });

  it("computes parallel resistance of equal resistors", () => {
    const result = parallelResistance([10, 10]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeCloseTo(5);
  });

  it("returns 0 for a short circuit (one resistor is 0 Ω) in parallel", () => {
    const result = parallelResistance([10, 0]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(0);
  });

  it("rejects negative resistance values", () => {
    expect(seriesResistance([10, -5]).ok).toBe(false);
    expect(parallelResistance([10, -5]).ok).toBe(false);
  });
});

describe("calculateEnergyCost", () => {
  it("computes kWh and cost", () => {
    const result = calculateEnergyCost(1000, 5, 0.15);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kilowattHours).toBeCloseTo(5);
      expect(result.value.estimatedCost).toBeCloseTo(0.75);
    }
  });

  it("rejects negative inputs", () => {
    expect(calculateEnergyCost(-1, 5, 0.15).ok).toBe(false);
    expect(calculateEnergyCost(1000, -5, 0.15).ok).toBe(false);
    expect(calculateEnergyCost(1000, 5, -0.15).ok).toBe(false);
  });
});
