"use client";

import { useSyncExternalStore } from "react";
import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/features/cart/CartProvider";
import { checkoutCart } from "@/features/checkout/actions";
import { formatPrice } from "@/lib/utils";
import { CartItemCard } from "@/app/(shop)/_components/CartItemCard";
import type { ReactNode } from "react";

export function CartDrawer({ children }: { children: ReactNode }) {
  const { items } = useCart();
  const isDesktop = useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(min-width: 768px)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false,
  );

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  return (
    <Drawer swipeDirection={isDesktop ? "right" : "down"}>
      {children}
      <DrawerContent
        className="max-md:[--drawer-height:80vh]!"
        data-testid="cart-drawer-content"
      >
        <DrawerHeader>
          <DrawerTitle>Cart</DrawerTitle>
        </DrawerHeader>

        {items.length === 0 ? (
          <Empty className="h-full border-none" data-testid="cart-empty-state">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingCart />
              </EmptyMedia>
              <EmptyTitle>Your cart is empty</EmptyTitle>
              <EmptyDescription className="max-w-xs text-pretty">
                Items you add to your cart will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-4 py-4">
              {items.map((item) => (
                <CartItemCard key={item.product.id} item={item} />
              ))}
            </div>
          </ScrollArea>
        )}

        {items.length > 0 && (
          <DrawerFooter>
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Subtotal</span>
              <span data-testid="cart-subtotal">{formatPrice(subtotal)}</span>
            </div>
            <form action={checkoutCart}>
              <Button
                type="submit"
                className="w-full"
                data-testid="cart-checkout"
              >
                Checkout
              </Button>
            </form>
            <DrawerClose
              render={
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid="cart-drawer-close"
                >
                  Close
                </Button>
              }
            />
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
