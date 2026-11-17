import { headers } from "next/headers"
import Link from "next/link"
import { Footer } from "@repo/ui/footer"
import { auth } from "@/lib/auth"
import { storefrontFooter } from "@/lib/storefront-footer"
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
      <NavBar signedIn={Boolean(session)} />
      <main className="flex-1 pt-20">{children}</main>
      <Footer
        {...storefrontFooter}
        linkComponent={Link}
        className="[&>div]:max-w-[1440px] md:[&>div]:px-6 lg:[&>div]:px-10"
      />
    </CartProvider>
  )
}
