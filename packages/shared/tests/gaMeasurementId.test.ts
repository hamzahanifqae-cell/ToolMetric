import { describe, expect, it } from "vitest";
import { parseGaMeasurementId } from "../src/config/gaMeasurementId.js";

describe("parseGaMeasurementId", () => {
  it("treats an unset value as optional", () => {
    expect(parseGaMeasurementId(undefined)).toEqual({ ok: true, value: undefined });
    expect(parseGaMeasurementId("  ")).toEqual({ ok: true, value: undefined });
  });

  it("accepts a measurement ID and normalizes case", () => {
    expect(parseGaMeasurementId("g-psw1my7hb4")).toEqual({ ok: true, value: "G-PSW1MY7HB4" });
  });

  it("rejects Search Console tokens and AdSense publisher IDs", () => {
    expect(parseGaMeasurementId("AbCdEf1234567890").ok).toBe(false);
    expect(parseGaMeasurementId("ca-pub-4998739298306378").ok).toBe(false);
  });
});
