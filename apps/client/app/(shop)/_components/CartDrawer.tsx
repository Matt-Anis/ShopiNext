"use client"

import { useRef, useState, useSyncExternalStore } from "react"
import { ShoppingCart } from "lucide-react"

import { Button } from "@repo/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@repo/ui/drawer"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/empty"
import { ScrollArea } from "@repo/ui/scroll-area"
import { useCart } from "@/features/cart/CartProvider"
import { checkoutCart } from "@/features/checkout/actions"
import { formatPrice } from "@/lib/utils"
import { CartItemCard } from "@/app/(shop)/_components/CartItemCard"
import { StripeCheckoutDialog } from "@/app/(shop)/_components/StripeCheckoutDialog"
import type { ReactNode } from "react"

export function CartDrawer({ children }: { children: ReactNode }) {
  const { items } = useCart()
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false)
  const checkoutFormRef = useRef<HTMLFormElement>(null)
  const isDesktop = useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(min-width: 768px)")
      query.addEventListener("change", onChange)
      return () => query.removeEventListener("change", onChange)
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false
  )

  const subtotal = items.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  )

  return (
    <Drawer swipeDirection={isDesktop ? "right" : "down"}>
      {children}
      <DrawerContent
        className="max-md:[--drawer-height:80vh]!"
        data-testid="cart-drawer-content"
      >
        <DrawerHeader>
          <DrawerTitle className="font-heading text-4xl font-bold tracking-tight">
            Cart
          </DrawerTitle>
        </DrawerHeader>

        {items.length === 0 ? (
          <Empty className="h-full border-none" data-testid="cart-empty-state">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingCart />
              </EmptyMedia>
              <EmptyTitle className="font-heading text-2xl font-bold tracking-tight">
                Your cart is empty
              </EmptyTitle>
              <EmptyDescription className="max-w-xs text-pretty">
                Items you add to your cart will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="min-h-0 flex-1 p-4">
            <div className="flex flex-col gap-6 py-4">
              {items.map((item) => (
                <CartItemCard key={item.variant.id} item={item} />
              ))}
            </div>
          </ScrollArea>
        )}

        {items.length > 0 && (
          <DrawerFooter>
            <div className="flex items-center justify-between py-2 font-heading text-xl font-semibold tracking-tight">
              <span>Subtotal</span>
              <span data-testid="cart-subtotal">{formatPrice(subtotal)}</span>
            </div>
            <form ref={checkoutFormRef} action={checkoutCart}>
              <Button
                type="button"
                size="lg"
                className="w-full font-semibold"
                onClick={() => setCheckoutDialogOpen(true)}
                data-testid="cart-checkout"
              >
                Checkout
              </Button>
            </form>
            <StripeCheckoutDialog
              open={checkoutDialogOpen}
              onOpenChange={setCheckoutDialogOpen}
              onConfirm={() => checkoutFormRef.current?.requestSubmit()}
            />
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
  )
}
