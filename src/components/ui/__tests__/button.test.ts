import { describe, expect, it } from "vitest";

describe("shadcn/ui button", () => {
  it("exports Button component and buttonVariants", async () => {
    const mod = await import("@/components/ui/button");
    expect(mod.Button).toBeDefined();
    expect(typeof mod.Button).toBe("function");
    expect(mod.buttonVariants).toBeDefined();
    expect(typeof mod.buttonVariants).toBe("function");
  });
});
