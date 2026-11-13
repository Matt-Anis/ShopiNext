import { Skeleton } from "@repo/ui/skeleton"
import { AccountPageLoading } from "./_components/account-page-loading"

export default function ProfileLoading() {
  return (
    <AccountPageLoading label="Loading your profile">
      <div className="grid gap-6 sm:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full max-w-44" />
          </div>
        ))}
      </div>
    </AccountPageLoading>
  )
}
