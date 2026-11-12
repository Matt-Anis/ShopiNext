import { Card, CardContent, CardHeader } from "@repo/ui/card"
import { Skeleton } from "@repo/ui/skeleton"

export default function OrdersLoading() {
  return (
    <div
      className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-16"
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading your orders</span>
      <div aria-hidden="true">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-full max-w-80" />
        </div>
        <div className="space-y-5">
          {[0, 1, 2].map((index) => (
            <Card key={index}>
              <CardHeader className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full max-w-80" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-9 w-32 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
