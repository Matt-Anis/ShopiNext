import { Card, CardContent, CardHeader } from "@repo/ui/card"
import { Skeleton } from "@repo/ui/skeleton"

export default function OrderDetailLoading() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading order details</span>
      <div aria-hidden="true" className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-44" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-44" />
          </CardHeader>
          <CardContent className="space-y-5">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-6"
              >
                <Skeleton className="h-12 w-1/2" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-5">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-5 w-full max-w-80" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
