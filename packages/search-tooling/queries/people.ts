import type { SearchReadDatabase } from "../db/client";
import type { SearchPageOptions } from "./pagination";

export function readCustomersPage(
  db: SearchReadDatabase,
  page: SearchPageOptions,
) {
  return db.query.user.findMany({
    columns: { id: true, name: true, email: true, image: true },
    where: (customer, { and, eq, gt }) =>
      and(
        page.entityId ? eq(customer.id, page.entityId) : undefined,
        page.afterId ? gt(customer.id, page.afterId) : undefined,
      ),
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
    where: (staff, { and, eq, gt }) =>
      and(
        page.entityId ? eq(staff.id, page.entityId) : undefined,
        page.afterId ? gt(staff.id, page.afterId) : undefined,
      ),
    orderBy: (staff, { asc }) => [asc(staff.id)],
    limit: page.limit,
  });
}
