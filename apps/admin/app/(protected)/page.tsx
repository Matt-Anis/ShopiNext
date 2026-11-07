import { redirect } from "next/navigation"
import { requireSession } from "@/lib/session"
import { hasRolePermission } from "@/lib/permissions"
import { Button } from "@repo/ui/button"

export default async function Page() {
  const session = await requireSession()

  if (!hasRolePermission(session.user.role, "analytics", "read")) {
    if (hasRolePermission(session.user.role, "orders", "read")) {
      redirect("/orders")
    }
    redirect("/unauthorized")
  }

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}
