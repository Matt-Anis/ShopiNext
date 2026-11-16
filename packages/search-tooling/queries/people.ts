import type { SearchReadDatabase } from "../db/client";
import type { SearchPageOptions } from "./pagination";

export function readCustomersPage(
  db: SearchReadDatabase,
  page: SearchPageOptions,
) {
  return db.query.user.findMany({
    columns: { id: true, name: true, email: true, image: true },
    where: (customer, { gt }) =>
      page.afterId ? gt(customer.id, page.afterId) : undefined,
    orderBy: (customer, { asc }) => [asc(customer.id)],
    limit: page.limit,
  });
}

export function readStaffPage(db: SearchReadDatabase, page: SearchPageOptions) {
  return db.query.adminUser.findMany({
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      banned: true,
    },
    where: (staff, { gt }) =>
      page.afterId ? gt(staff.id, page.afterId) : undefined,
    orderBy: (staff, { asc }) => [asc(staff.id)],
    limit: page.limit,
  });
}
