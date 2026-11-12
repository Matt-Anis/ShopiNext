const orderDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

export function formatOrderReference(id: string): string {
  return `Order #${id.slice(0, 8)}`
}

export function formatOrderDate(date: Date): string {
  return orderDateFormatter.format(date)
}
