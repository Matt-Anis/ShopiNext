"use client";

import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";

import Logo from "./Logo";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@repo/ui/alert-dialog";
import { Skeleton } from "@repo/ui/skeleton";
import { Badge } from "@repo/ui/badge";
import { DrawerTrigger } from "@repo/ui/drawer";
import { CartDrawer } from "@/app/(shop)/_components/CartDrawer";

import {
  LogOutIcon,
  SettingsIcon,
  ShoppingCart,
  User,
  UserIcon,
} from "lucide-react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { useCart } from "@/features/cart/CartProvider";

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { scrollY } = useScroll();
  const { data: session, isPending } = authClient.useSession();
  const { count } = useCart();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 64) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.nav
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
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
          {isPending ? (
            <Skeleton className="size-9 rounded-full" />
          ) : session ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="user-menu-trigger"
                    >
                      <User />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem render={<Link href="/profile" />}>
                    <UserIcon />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/profile/settings" />}>
                    <SettingsIcon />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setLogoutDialogOpen(true)}
                    data-testid="logout-menu-item"
                  >
                    <LogOutIcon />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialog
                open={logoutDialogOpen}
                onOpenChange={setLogoutDialogOpen}
              >
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                      <LogOutIcon />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Log out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You&apos;ll need to sign in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      variant="outline"
                      data-testid="logout-cancel-button"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => authClient.signOut()}
                      data-testid="logout-confirm-button"
                    >
                      Log out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button
                className="md:hidden"
                variant="ghost"
                size="icon"
                nativeButton={false}
                render={<Link href="/login" />}
                data-testid="signin-nav-button-mobile"
              >
                <User />
              </Button>
              <Button
                className="hidden md:inline-flex"
                variant="outline"
                nativeButton={false}
                render={<Link href="/login" />}
                data-testid="signin-nav-button"
              >
                login
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
