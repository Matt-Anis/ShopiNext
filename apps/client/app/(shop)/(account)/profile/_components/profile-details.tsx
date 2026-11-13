import { Badge } from "@repo/ui/badge"
import { Card, CardContent, CardHeader } from "@repo/ui/card"

type ProfileDetailsProps = {
  name: string
  email: string
  emailVerified: boolean
  createdAt: Date
}

export function ProfileDetails({
  name,
  email,
  emailVerified,
  createdAt,
}: ProfileDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-lg font-semibold">Account details</h2>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-muted-foreground">Full name</dt>
            <dd className="mt-1 font-medium break-words">{name}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="mt-1 font-medium break-words">{email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email verification</dt>
            <dd className="mt-1">
              <Badge variant={emailVerified ? "secondary" : "outline"}>
                {emailVerified ? "Verified" : "Not verified"}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Member since</dt>
            <dd className="mt-1 font-medium">
              <time dateTime={createdAt.toISOString()}>
                {createdAt.toLocaleDateString("en-US", {
                  dateStyle: "medium",
                  timeZone: "UTC",
                })}
              </time>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
