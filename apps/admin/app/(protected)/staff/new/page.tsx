import { CreateStaffForm } from "./_components/create-staff-form"

export default function NewStaffPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">New staff</h1>
      <div className="max-w-md">
        <CreateStaffForm />
      </div>
    </div>
  )
}
