const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export function formatPrice(priceInCents: number) {
  return currencyFormatter.format(priceInCents / 100)
}
