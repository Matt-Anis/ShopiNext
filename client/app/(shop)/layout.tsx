import NavBar from "@/components/NavBar";
import { CartProvider } from "@/features/cart/CartProvider";
import { getCart } from "@/features/cart/actions";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const initialCartItems = await getCart();

  return (
    <CartProvider initialItems={initialCartItems}>
      <NavBar />
      <main className="pt-16">{children}</main>
    </CartProvider>
  );
}
