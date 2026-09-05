import { CreateStaffForm } from "./_components/create-staff-form"

export default function NewStaffPage() {
  return (
    <div className="px-8 pt-9">
      <div className="max-w-[480px]">
        <h1 className="text-2xl font-semibold tracking-tight">New staff</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          They&apos;ll receive an email to set their own password.
        </p>
        <CreateStaffForm />
      </div>
    </div>
  )
}
