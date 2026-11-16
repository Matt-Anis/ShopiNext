import type { user } from "@repo/db/public/auth-schema";
import type { adminUser } from "@repo/db/admin/auth-schema";
import type {
  CustomerDocument,
  StaffDocument,
} from "@repo/search/server/documents";

type CustomerProjectionSource = Pick<
  typeof user.$inferSelect,
  "id" | "name" | "email" | "image"
>;

type StaffProjectionSource = Pick<
  typeof adminUser.$inferSelect,
  "id" | "name" | "email" | "image" | "role" | "banned"
>;

export function projectCustomer(
  customer: CustomerProjectionSource,
): CustomerDocument {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    image: customer.image,
  };
}

export function projectStaff(staff: StaffProjectionSource): StaffDocument {
  return {
    ...projectCustomer(staff),
    role: staff.role,
    banned: staff.banned ?? false,
  };
}
