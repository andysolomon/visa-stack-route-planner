import { describe, expect, it } from "vitest";
import { users } from "@/lib/db/schema";
import type { User, NewUser } from "@/lib/db/schema";

describe("users table schema", () => {
  it("has the expected column names", () => {
    const columnNames = Object.keys(users);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("clerkId");
    expect(columnNames).toContain("email");
    expect(columnNames).toContain("createdAt");
    expect(columnNames).toContain("updatedAt");
  });

  it("exports User select type with expected fields", () => {
    const user: User = {
      id: "00000000-0000-0000-0000-000000000000",
      clerkId: "clerk_test_123",
      email: "test@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(user.id).toBeDefined();
    expect(user.clerkId).toBeDefined();
    expect(user.email).toBeDefined();
  });

  it("allows NewUser with only required fields", () => {
    const newUser: NewUser = {
      clerkId: "clerk_test_456",
      email: "new@example.com",
    };
    expect(newUser.clerkId).toBe("clerk_test_456");
    expect(newUser.email).toBe("new@example.com");
    // id, createdAt, updatedAt should be optional (have defaults)
    expect(newUser.id).toBeUndefined();
  });
});
