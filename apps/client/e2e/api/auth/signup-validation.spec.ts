import { test, expect } from "@playwright/test";
import { resetAuthTables } from "../../utils/db-reset";

test.beforeEach(async () => {
  await resetAuthTables();
});

test.describe("POST /api/auth/sign-up/email — server-side validation", () => {
  test("accepts a valid payload without confirmPassword", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        password: "password123",
      },
    });

    expect(response.ok()).toBe(true);
  });

  test("rejects a name longer than 20 characters", async ({ request }) => {
    const response = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "A".repeat(21),
        email: "jane.doe@example.com",
        password: "password123",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toBe("Name must be at most 20 characters");
  });

  test("rejects a name containing digits", async ({ request }) => {
    const response = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "Jane123",
        email: "jane.doe@example.com",
        password: "password123",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toBe("Name can only contain letters");
  });

  test("rejects an email longer than 50 characters", async ({ request }) => {
    const response = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "Jane Doe",
        email: `${"a".repeat(45)}@a.com`,
        password: "password123",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toBe("Email must be at most 50 characters");
  });

  test("rejects a malformed email", async ({ request }) => {
    const response = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "Jane Doe",
        email: "not-an-email",
        password: "password123",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toBe("Enter a valid email address");
  });

  test("rejects a password shorter than 8 characters", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        password: "short1",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toBe("Password must be at least 8 characters");
  });

  test("rejects a password longer than 20 characters", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        password: "a".repeat(21),
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toBe("Password must be at most 20 characters");
  });

  test("does not apply sign-up validation rules to sign-in", async ({
    request,
  }) => {
    // A sign-in request with bad credentials should fail for its own
    // reason (401 invalid credentials), not get intercepted by the
    // sign-up-only schema check — proves the `ctx.path` scoping in
    // `hooks.before` doesn't leak onto other auth endpoints.
    const response = await request.post("/api/auth/sign-in/email", {
      data: {
        email: "nobody@example.com",
        password: "whatever123",
      },
    });

    expect(response.status()).toBe(401);
  });
});
