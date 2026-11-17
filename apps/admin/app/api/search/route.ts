import { isSearchAvailable } from "@repo/search/availability"
import { auth } from "@/lib/auth"
import { createAdminSearchHandler } from "@/lib/search/handler"
import { searchAdminCatalog } from "@/lib/search/service"

export const GET = createAdminSearchHandler({
  isAvailable: () => isSearchAvailable(process.env.NODE_ENV),
  getSession: (headers) => auth.api.getSession({ headers }),
  search: searchAdminCatalog,
})
