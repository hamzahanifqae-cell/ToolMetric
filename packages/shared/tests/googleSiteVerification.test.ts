import { describe, expect, it } from "vitest";
import { parseGoogleSiteVerification } from "../src/config/googleSiteVerification.js";

describe("parseGoogleSiteVerification", () => {
  it("treats an unset value as optional", () => {
    expect(parseGoogleSiteVerification(undefined)).toEqual({ ok: true, value: undefined });
    expect(parseGoogleSiteVerification("   ")).toEqual({ ok: true, value: undefined });
  });

  it("accepts a bare token", () => {
    expect(parseGoogleSiteVerification("aBcDeFghIJ-kLmNoPQ")).toEqual({
      ok: true,
      value: "aBcDeFghIJ-kLmNoPQ",
    });
  });

  it("extracts the token from the meta tag Google displays", () => {
    const tag = '<meta name="google-site-verification" content="AbCdEf1234567890_-" />';
    expect(parseGoogleSiteVerification(tag)).toEqual({ ok: true, value: "AbCdEf1234567890_-" });
  });

  it("extracts the token from a DNS TXT value", () => {
    expect(parseGoogleSiteVerification("google-site-verification=AbCdEf1234567890")).toEqual({
      ok: true,
      value: "AbCdEf1234567890",
    });
  });

  it("rejects placeholders and prose", () => {
    const result = parseGoogleSiteVerification("your verification string");
    expect(result.ok).toBe(false);
  });
});
