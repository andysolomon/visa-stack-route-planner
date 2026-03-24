import { describe, expect, it, vi, beforeEach } from "vitest";

const mockReturning = vi.fn();
const mockOnConflictDoUpdate = vi.fn(() => ({ returning: mockReturning }));
const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }));
const mockInsert = vi.fn(() => ({ values: mockValues }));

vi.mock("@/lib/db", () => ({
  db: { insert: mockInsert },
}));

vi.mock("@/lib/db/schema", () => ({
  users: { clerkId: "clerk_id" },
}));

describe("syncUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts a user with clerkId and email", async () => {
    const mockUser = {
      id: "test-uuid",
      clerkId: "clerk_123",
      email: "test@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([mockUser]);

    const { syncUser } = await import("@/lib/auth/sync-user");
    const result = await syncUser("clerk_123", "test@example.com");

    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith({
      clerkId: "clerk_123",
      email: "test@example.com",
    });
    expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  it("returns the upserted user", async () => {
    const mockUser = {
      id: "existing-uuid",
      clerkId: "clerk_456",
      email: "updated@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([mockUser]);

    const { syncUser } = await import("@/lib/auth/sync-user");
    const result = await syncUser("clerk_456", "updated@example.com");

    expect(result.id).toBe("existing-uuid");
    expect(result.email).toBe("updated@example.com");
  });
});
