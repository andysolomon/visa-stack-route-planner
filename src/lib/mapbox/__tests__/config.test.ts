import { describe, expect, it, vi, beforeEach } from "vitest";

describe("mapbox config", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws when NEXT_PUBLIC_MAPBOX_TOKEN is not set", async () => {
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    await expect(
      import("@/lib/mapbox/config")
    ).rejects.toThrow("NEXT_PUBLIC_MAPBOX_TOKEN is not set");
  });

  it("exports correct values when token is set", async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test_token_123";
    const config = await import("@/lib/mapbox/config");

    expect(config.mapboxToken).toBe("pk.test_token_123");
    expect(config.mapStyle).toBe("mapbox://styles/mapbox/dark-v11");
    expect(config.defaultCenter).toEqual([10, 48]);
    expect(config.defaultZoom).toBe(3);
  });

  it("exports values of correct types", async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.type_check";
    const config = await import("@/lib/mapbox/config");

    expect(typeof config.mapboxToken).toBe("string");
    expect(Array.isArray(config.defaultCenter)).toBe(true);
    expect(config.defaultCenter).toHaveLength(2);
    expect(typeof config.defaultZoom).toBe("number");
  });
});
