import { describe, expect, it } from "vitest";
import { validateOperatorEmail } from "../src/config/operatorEmail.js";

describe("validateOperatorEmail: accepted addresses", () => {
  it("accepts a simple real-looking address", () => {
    const result = validateOperatorEmail("ops@toolmetric.com");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("ops@toolmetric.com");
  });

  it("accepts a plus-tagged address", () => {
    expect(validateOperatorEmail("hello+toolmetric@gmail.com").ok).toBe(true);
  });

  it("accepts a dotted local part and subdomain", () => {
    expect(validateOperatorEmail("first.last@mail.toolmetric.com").ok).toBe(true);
  });

  it("accepts a role address on a non-reserved domain containing 'test'", () => {
    // Local-part heuristics are deliberately not used, and "testtool.com" is
    // not a reserved domain or subdomain of one.
    expect(validateOperatorEmail("test@testtool.com").ok).toBe(true);
  });

  it("accepts a multi-level public suffix domain", () => {
    expect(validateOperatorEmail("ops@toolmetric.co.uk").ok).toBe(true);
  });
});

describe("validateOperatorEmail: rejections", () => {
  it("rejects an unset value", () => {
    expect(validateOperatorEmail(undefined).ok).toBe(false);
    expect(validateOperatorEmail("").ok).toBe(false);
    expect(validateOperatorEmail("   ").ok).toBe(false);
  });

  it("rejects addresses with no @ or more than one @", () => {
    expect(validateOperatorEmail("not-an-email").ok).toBe(false);
    expect(validateOperatorEmail("a@b@c.com").ok).toBe(false);
  });

  it("rejects a missing or invalid local part", () => {
    expect(validateOperatorEmail("@toolmetric.com").ok).toBe(false);
    expect(validateOperatorEmail(".ops@toolmetric.com").ok).toBe(false);
    expect(validateOperatorEmail("ops.@toolmetric.com").ok).toBe(false);
    expect(validateOperatorEmail("op..s@toolmetric.com").ok).toBe(false);
  });

  it("rejects a missing or invalid domain", () => {
    expect(validateOperatorEmail("ops@").ok).toBe(false);
    expect(validateOperatorEmail("ops@toolmetric").ok).toBe(false); // no dot
    expect(validateOperatorEmail("ops@-toolmetric.com").ok).toBe(false); // label starts with hyphen
    expect(validateOperatorEmail("ops@toolmetric-.com").ok).toBe(false); // label ends with hyphen
    expect(validateOperatorEmail("ops@toolmetric.123").ok).toBe(false); // numeric TLD
    expect(validateOperatorEmail("ops@toolmetric.c").ok).toBe(false); // single-letter TLD
  });

  it("rejects embedded whitespace anywhere", () => {
    expect(validateOperatorEmail("ops @toolmetric.com").ok).toBe(false);
    expect(validateOperatorEmail("ops@ toolmetric.com").ok).toBe(false);
    expect(validateOperatorEmail(" ops@toolmetric.com").ok).toBe(false);
    expect(validateOperatorEmail("ops@toolmetric.com ").ok).toBe(false);
    expect(validateOperatorEmail("op s@toolmetric.com").ok).toBe(false);
  });

  it("rejects embedded control characters", () => {
    expect(validateOperatorEmail("ops@toolmetric.com\n").ok).toBe(false);
    expect(validateOperatorEmail("ops@toolmetric.com\u0000").ok).toBe(false);
    expect(validateOperatorEmail("o\tps@toolmetric.com").ok).toBe(false);
  });

  it("rejects obvious placeholder/example addresses by reserved domain", () => {
    expect(validateOperatorEmail("you@example.com").ok).toBe(false);
    expect(validateOperatorEmail("name@example.com").ok).toBe(false);
    expect(validateOperatorEmail("test@example.org").ok).toBe(false);
    expect(validateOperatorEmail("ops@mysite.example").ok).toBe(false);
    expect(validateOperatorEmail("ops@staging.test").ok).toBe(false);
    expect(validateOperatorEmail("ops@anything.invalid").ok).toBe(false);
    expect(validateOperatorEmail("ops@localhost").ok).toBe(false);
  });

  it("rejects placeholder addresses on subdomains of reserved domains", () => {
    expect(validateOperatorEmail("ops@mail.example.com").ok).toBe(false);
    expect(validateOperatorEmail("ops@sub.example.net").ok).toBe(false);
  });

  it("rejects an overly long local part", () => {
    expect(validateOperatorEmail(`${"a".repeat(65)}@toolmetric.com`).ok).toBe(false);
  });
});
