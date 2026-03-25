import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const result = rateLimit("test-ip-1");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(59);
  });

  it("tracks requests per IP", () => {
    const ip = "test-ip-2";
    for (let i = 0; i < 60; i++) {
      const result = rateLimit(ip);
      expect(result.success).toBe(true);
    }
  });

  it("blocks after exceeding limit", () => {
    const ip = "test-ip-3";
    for (let i = 0; i < 60; i++) {
      rateLimit(ip);
    }
    const result = rateLimit(ip);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("isolates different IPs", () => {
    const ip1 = "test-ip-4";
    const ip2 = "test-ip-5";
    for (let i = 0; i < 60; i++) {
      rateLimit(ip1);
    }
    const result = rateLimit(ip2);
    expect(result.success).toBe(true);
  });
});
