"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/session";

export async function createStaffAccount(name: string, email: string) {
  await requireSession();

  const { user } = await auth.api.createUser({
    body: { name, email, role: "user" },
    headers: await headers(),
  });

  await auth.api.requestPasswordReset({
    body: { email: user.email, redirectTo: "/reset-password" },
  });
}
