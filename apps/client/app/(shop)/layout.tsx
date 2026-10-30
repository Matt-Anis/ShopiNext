import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import NavBar from "@/components/NavBar"
import { CartProvider } from "@/features/cart/CartProvider"
import { getCart } from "@/features/cart/actions"

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const session = await auth.api.getSession({ headers: await headers() })
  const initialCartItems = await getCart()

  return (
    <CartProvider
      key={session?.user.id ?? "guest"}
      initialItems={initialCartItems}
    >
      <NavBar />
      <main className="pt-16">{children}</main>
    </CartProvider>
  )
}
