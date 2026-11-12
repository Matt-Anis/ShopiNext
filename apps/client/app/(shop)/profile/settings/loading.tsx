import { Skeleton } from "@repo/ui/skeleton"
import { AccountPageLoading } from "../_components/account-page-loading"

export default function ProfileSettingsLoading() {
  return (
    <AccountPageLoading label="Loading account settings">
      <div className="space-y-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-4 w-full max-w-80" />
          </div>
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-full max-w-80" />
          <Skeleton className="h-4 w-full max-w-96" />
          <Skeleton className="h-9 w-52 rounded-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-9 w-44 rounded-full" />
        </div>
      </div>
    </AccountPageLoading>
  )
}
