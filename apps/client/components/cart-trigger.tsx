"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@repo/ui/button"
import { Badge } from "@repo/ui/badge"
import { DrawerTrigger } from "@repo/ui/drawer"
import { CartDrawer } from "@/app/(shop)/_components/CartDrawer"
import { useCart } from "@/features/cart/CartProvider"

export function CartTrigger() {
  const { count } = useCart()

  return (
    <CartDrawer>
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative size-10"
            aria-label={
              count > 0
                ? `Open cart, ${count} ${count === 1 ? "item" : "items"}`
                : "Open cart"
            }
            data-testid="cart-trigger"
          >
            <ShoppingCart aria-hidden="true" />
            {count > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
                aria-hidden="true"
                data-testid="cart-badge"
              >
                {count}
              </Badge>
            )}
          </Button>
        }
      />
    </CartDrawer>
  )
}
