"use client"

import { motion, useScroll, useMotionValueEvent } from "motion/react"
import { useState } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@repo/ui/button"
import { Badge } from "@repo/ui/badge"
import { DrawerTrigger } from "@repo/ui/drawer"
import { CartDrawer } from "@/app/(shop)/_components/CartDrawer"
import { AccountLink } from "@/features/account/components/account-link"
import { useCart } from "@/features/cart/CartProvider"
import Logo from "./Logo"

export default function Navbar() {
  const [hidden, setHidden] = useState(false)
  const { scrollY } = useScroll()
  const { count } = useCart()

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    setHidden(latest > previous && latest > 64)
  })

  return (
    <motion.nav
      variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="h-17 pt-1 px-6 md:px-10 flex items-center justify-center bg-background/90 backdrop-blur-md fixed -top-1 w-full z-50 border-b-2 border-primary perspective-normal"
    >
      <div className="w-full h-full flex max-w-7xl items-center">
        <Link href="/">
          <Logo className="text-foreground size-8" />
        </Link>
        <div className="ml-auto flex items-center gap-0 md:gap-1">
          <CartDrawer>
            <DrawerTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  data-testid="cart-trigger"
                >
                  <ShoppingCart />
                  {count > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
                      data-testid="cart-badge"
                    >
                      {count}
                    </Badge>
                  )}
                </Button>
              }
            />
          </CartDrawer>
          <AccountLink />
        </div>
      </div>
    </motion.nav>
  )
}
