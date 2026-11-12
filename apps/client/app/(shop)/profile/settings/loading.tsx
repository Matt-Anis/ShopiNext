import { Skeleton } from "@repo/ui/skeleton"
import { AccountPageLoading } from "../_components/account-page-loading"

export default function ProfileSettingsLoading() {
  return (
    <AccountPageLoading label="Loading account settings">
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-4 w-full max-w-80" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
    </AccountPageLoading>
  )
}
