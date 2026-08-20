import { notFound } from "next/navigation";
import { ResetPasswordForm } from "../_components/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  return <ResetPasswordForm token={token} />;
}
