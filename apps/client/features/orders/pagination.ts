export const CUSTOMER_ORDERS_PAGE_SIZE = 10

export function parseOrdersPage(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return 1
  }

  const page = Number(value)
  return Number.isSafeInteger(page) ? page : 1
}

export function ordersPageHref(page: number): string {
  return page === 1 ? "/orders" : `/orders?page=${page}`
}
