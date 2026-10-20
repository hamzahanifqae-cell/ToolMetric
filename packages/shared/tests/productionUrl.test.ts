import { describe, expect, it } from "vitest";
import { validateProductionUrl } from "../src/config/productionUrl.js";

describe("validateProductionUrl: accepted public hostnames", () => {
  it("accepts a real HTTPS domain", () => {
    const result = validateProductionUrl("https://toolmetric.com");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("https://toolmetric.com");
  });

  it("accepts a real HTTPS domain with a trailing slash and normalizes it away", () => {
    const result = validateProductionUrl("https://toolmetric.com/");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("https://toolmetric.com");
  });

  it("accepts a subdomain", () => {
    const result = validateProductionUrl("https://www.toolmetric.com");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("https://www.toolmetric.com");
  });

  it("accepts a multi-level public suffix domain", () => {
    expect(validateProductionUrl("https://toolmetric.co.uk").ok).toBe(true);
  });

  it("accepts a domain containing (but not equal to or a subdomain of) a reserved word", () => {
    // "testtool.com" is a real-looking domain; it must not be caught by a
    // naive substring match against the reserved "test" TLD.
    expect(validateProductionUrl("https://testtool.com").ok).toBe(true);
    expect(validateProductionUrl("https://mytest.com").ok).toBe(true);
    expect(validateProductionUrl("https://example-tools.com").ok).toBe(true);
  });

  it("normalizes using the URL parser's own origin serialization", () => {
    const result = validateProductionUrl("HTTPS://ToolMetric.com");
    expect(result.ok).toBe(true);
    // The URL parser lowercases the hostname as part of normalization.
    if (result.ok) expect(result.value).toBe("https://toolmetric.com");
  });
});

describe("validateProductionUrl: rejections", () => {
  it("rejects an unset value", () => {
    expect(validateProductionUrl(undefined).ok).toBe(false);
    expect(validateProductionUrl("").ok).toBe(false);
    expect(validateProductionUrl("   ").ok).toBe(false);
  });

  it("rejects a malformed URL", () => {
    expect(validateProductionUrl("not a url").ok).toBe(false);
    expect(validateProductionUrl("toolmetric.com").ok).toBe(false); // missing scheme
  });

  it("rejects plain HTTP", () => {
    const result = validateProductionUrl("http://toolmetric.com");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("HTTPS");
  });

  it("rejects embedded credentials", () => {
    const result = validateProductionUrl("https://user:pass@toolmetric.com");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("credentials");
  });

  it("rejects a query string", () => {
    const result = validateProductionUrl("https://toolmetric.com?ref=test");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("query string");
  });

  it("rejects a fragment", () => {
    const result = validateProductionUrl("https://toolmetric.com#section");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("fragment");
  });

  it("rejects a non-root base path", () => {
    const result = validateProductionUrl("https://toolmetric.com/app");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("base path");
  });

  it("rejects localhost by name", () => {
    expect(validateProductionUrl("https://localhost").ok).toBe(false);
    expect(validateProductionUrl("https://localhost:4321").ok).toBe(false);
    expect(validateProductionUrl("https://sub.localhost").ok).toBe(false);
  });

  it("rejects any IPv4 literal, loopback or otherwise", () => {
    expect(validateProductionUrl("https://127.0.0.1").ok).toBe(false);
    expect(validateProductionUrl("https://127.5.5.5").ok).toBe(false);
    expect(validateProductionUrl("https://0.0.0.0").ok).toBe(false);
    // Private/RFC1918 ranges.
    expect(validateProductionUrl("https://10.0.0.5").ok).toBe(false);
    expect(validateProductionUrl("https://172.16.0.1").ok).toBe(false);
    expect(validateProductionUrl("https://192.168.1.1").ok).toBe(false);
    // Link-local.
    expect(validateProductionUrl("https://169.254.1.1").ok).toBe(false);
    // A public IP is rejected too — ToolMetric requires a domain name, not any IP.
    expect(validateProductionUrl("https://8.8.8.8").ok).toBe(false);
  });

  it("rejects any IPv6 literal, loopback or otherwise", () => {
    expect(validateProductionUrl("https://[::1]").ok).toBe(false);
    expect(validateProductionUrl("https://[fe80::1]").ok).toBe(false); // link-local
    expect(validateProductionUrl("https://[fc00::1]").ok).toBe(false); // unique local
    expect(validateProductionUrl("https://[2001:db8::1]").ok).toBe(false); // publicly routable
  });

  it("rejects reserved documentation/example domains", () => {
    expect(validateProductionUrl("https://example.com").ok).toBe(false);
    expect(validateProductionUrl("https://example.org").ok).toBe(false);
    expect(validateProductionUrl("https://example.net").ok).toBe(false);
    expect(validateProductionUrl("https://example.edu").ok).toBe(false);
    expect(validateProductionUrl("https://my-site.example").ok).toBe(false);
    expect(validateProductionUrl("https://staging.test").ok).toBe(false);
    expect(validateProductionUrl("https://anything.invalid").ok).toBe(false);
  });

  it("rejects subdomains of reserved documentation/example domains", () => {
    expect(validateProductionUrl("https://www.example.com").ok).toBe(false);
    expect(validateProductionUrl("https://staging.example.org").ok).toBe(false);
    expect(validateProductionUrl("https://deep.sub.example.net").ok).toBe(false);
    expect(validateProductionUrl("https://foo.bar.test").ok).toBe(false);
  });

  it("rejects a hostname with no dot (not a real registered domain)", () => {
    expect(validateProductionUrl("https://toolmetric").ok).toBe(false);
  });
});
