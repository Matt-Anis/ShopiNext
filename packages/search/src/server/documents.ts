import type { OrderStatus } from "@repo/db/public/schema";
import type { ProductSearchStatus } from "../contracts";

export type PublicProductDocument = {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  categoryNames: string[];
};

export type CategoryDocument = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type AdminProductDocument = PublicProductDocument & {
  skus: string[];
  status: ProductSearchStatus;
  isActive: boolean;
};

export type OrderDocument = {
  id: string;
  reference: string;
  checkoutEmail: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  archivedAt: string | null;
};

export type CustomerDocument = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export type StaffDocument = CustomerDocument & {
  role: string | null;
  banned: boolean;
};
