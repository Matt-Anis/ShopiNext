"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function createStaffAccount(name: string, email: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const { user } = await auth.api.createUser({
    body: { name, email, role: "user" },
    headers: await headers(),
  });

  await auth.api.requestPasswordReset({
    body: { email: user.email, redirectTo: "/reset-password" },
  });
}
