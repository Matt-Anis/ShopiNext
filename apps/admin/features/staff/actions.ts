"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireActionPermission } from "@/lib/auth-guard";

export async function createStaffAccount(name: string, email: string) {
  await requireActionPermission("user", "create");

  const { user } = await auth.api.createUser({
    body: { name, email, role: "staff" },
    headers: await headers(),
  });

  await auth.api.requestPasswordReset({
    body: { email: user.email, redirectTo: "/reset-password" },
  });
}
