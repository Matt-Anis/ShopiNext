import assert from "node:assert/strict";
import test from "node:test";
import { projectCustomer, projectStaff } from "./people";

const profile = {
  id: "profile-id",
  name: "Taylor",
  email: "taylor@example.com",
  image: null,
};

test("customer documents contain only approved profile fields", () => {
  const source = {
    ...profile,
    password: "private-password",
    accessToken: "private-token",
    ipAddress: "192.0.2.1",
  };
  assert.deepEqual(projectCustomer(source), profile);
});

test("staff documents retain role and ban state without private auth metadata", () => {
  const source = {
    ...profile,
    role: "manager",
    banned: true,
    banReason: "private-reason",
    sessionToken: "private-token",
  };
  assert.deepEqual(projectStaff(source), {
    ...profile,
    role: "manager",
    banned: true,
  });
});

test("nullable staff ban state normalizes to false without inventing a role", () => {
  assert.deepEqual(projectStaff({ ...profile, role: null, banned: null }), {
    ...profile,
    role: null,
    banned: false,
  });
});
