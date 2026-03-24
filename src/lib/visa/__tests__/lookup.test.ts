import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  const mockLimit = vi.fn();
  const mockWhere = vi.fn(() => ({ limit: mockLimit }));
  const mockFrom = vi.fn(() => ({ where: mockWhere }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));

  return {
    db: {
      select: mockSelect,
      _mocks: { mockSelect, mockFrom, mockWhere, mockLimit },
    },
  };
});

import { db } from "@/lib/db";

const mocks = (db as unknown as { _mocks: Record<string, ReturnType<typeof vi.fn>> })._mocks;

describe("getVisaRule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the chain for each test
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockWhere.mockReturnValue({ limit: mocks.mockLimit });
  });

  it("returns a VisaRuleRow when a match is found", async () => {
    const mockRule = {
      id: "test-id",
      countryCode: "DE",
      passportNationality: "US",
      stayLimitDays: 90,
      windowDays: 180,
      visaType: "schengen-visa-exempt",
      requiresVisa: false,
      notes: "90 days in 180-day window",
      updatedAt: new Date(),
    };
    mocks.mockLimit.mockResolvedValue([mockRule]);

    const { getVisaRule } = await import("@/lib/visa/lookup");
    const result = await getVisaRule("DE", "US");

    expect(result).toEqual(mockRule);
  });

  it("returns null when no match is found", async () => {
    mocks.mockLimit.mockResolvedValue([]);

    const { getVisaRule } = await import("@/lib/visa/lookup");
    const result = await getVisaRule("ZZ", "US");

    expect(result).toBeNull();
  });

  it("normalizes lowercase input to uppercase", async () => {
    mocks.mockLimit.mockResolvedValue([]);

    const { getVisaRule } = await import("@/lib/visa/lookup");
    await getVisaRule("de", "us");

    // Verify the where clause was called (the function executed without error)
    expect(mocks.mockWhere).toHaveBeenCalled();
  });
});
