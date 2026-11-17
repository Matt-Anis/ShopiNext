import type { Hit } from "meilisearch";
import type { AdminSearchPreview } from "../contracts";
import { createSearchExcerpt } from "../excerpts";
import { categoryPreview, productPreview } from "../previews";
import type { AdminSearchAccess, AdminSearchGroup } from "./admin-queries";
import type {
  AdminProductDocument,
  CategoryDocument,
  CustomerDocument,
  OrderDocument,
  StaffDocument,
} from "./documents";

export type AdminSearchDocument =
  | AdminProductDocument
  | CategoryDocument
  | CustomerDocument
  | OrderDocument
  | StaffDocument;

export function adminPreview(
  group: AdminSearchGroup,
  hit: Hit<AdminSearchDocument>,
  maskEmail: AdminSearchAccess["maskEmail"],
): AdminSearchPreview {
  const email = (value: string) => (maskEmail ? maskEmail(value) : value);
  const id = encodeURIComponent(hit.id);
  switch (group) {
    case "product": {
      const product = hit as Hit<AdminProductDocument>;
      return {
        ...productPreview(product, `/products/${id}`),
        status: product.status,
        isActive: product.isActive,
        excerpt: createSearchExcerpt(product, [
          "skus",
          "categoryNames",
          "description",
        ]),
      };
    }
    case "category":
      return categoryPreview(
        hit as Hit<CategoryDocument>,
        `/categories?categoryId=${id}`,
      );
    case "order": {
      const order = hit as Hit<OrderDocument>;
      return {
        type: "order",
        id: order.id,
        title: `Order ${order.reference}`,
        href: `/orders/${id}`,
        reference: order.reference,
        checkoutEmail: email(order.checkoutEmail),
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        archivedAt: order.archivedAt,
      };
    }
    case "customer": {
      const customer = hit as Hit<CustomerDocument>;
      return {
        type: "customer",
        id: customer.id,
        title: customer.name,
        href: `/customers/${id}`,
        email: email(customer.email),
        image: customer.image,
      };
    }
    case "staff": {
      const staff = hit as Hit<StaffDocument>;
      return {
        type: "staff",
        id: staff.id,
        title: staff.name,
        href: `/staff/${id}`,
        email: email(staff.email),
        image: staff.image,
        role: staff.role,
        banned: staff.banned,
      };
    }
  }
}
