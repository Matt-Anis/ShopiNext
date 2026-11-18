import { requirePermission } from "@/lib/auth/guards"
import { CreateStaffForm } from "./_components/create-staff-form"

export default async function NewStaffPage() {
  await requirePermission("user", "create")

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 sm:px-6 lg:py-9">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">New staff</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        They&apos;ll receive an email to set their own password.
      </p>
      <CreateStaffForm />
    </div>
  )
}
