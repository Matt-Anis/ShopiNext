interface ProductHistoryProps {
  createdAt: Date
  updatedAt: Date
}

function formatDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function ProductHistory({ createdAt, updatedAt }: ProductHistoryProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-medium tracking-wide text-foreground uppercase">
        History
      </h2>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Created</span>
          <span className="font-medium">{formatDateTime(createdAt)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Updated</span>
          <span className="font-medium">{formatDateTime(updatedAt)}</span>
        </div>
      </div>
    </section>
  )
}
