import type { SearchEntityType } from "@repo/db/admin/schema";

export function isCanonicalEntityId(
  type: SearchEntityType,
  id: string,
): boolean {
  if (type === "customer" || type === "staff") return id.length > 0;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(
    id,
  );
}
