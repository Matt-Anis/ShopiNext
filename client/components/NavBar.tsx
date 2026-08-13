"use client";

import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";

import Logo from "./Logo";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
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
} from "./ui/alert-dialog";
import { Skeleton } from "./ui/skeleton";

import {
  LogOutIcon,
  SettingsIcon,
  ShoppingCart,
  User,
  UserIcon,
} from "lucide-react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { scrollY } = useScroll();
  const { data: session, isPending } = authClient.useSession();

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
      className="h-17 pt-1 px-6 md:px-10 flex items-center justify-center bg-background/50 backdrop-blur-md fixed -top-1 w-full z-50 border-b-2 border-primary perspective-normal"
    >
      <div className="w-full h-full flex max-w-7xl items-center">
        <Link href="/">
          <Logo className="text-foreground size-8" />
        </Link>
        <div className="ml-auto flex items-center gap-0 md:gap-1">
          {isPending ? (
            <Skeleton className="size-9 rounded-full" />
          ) : session ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon">
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
                      You&apos;ll need to sign in again to access your
                      account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel variant="outline">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => authClient.signOut()}
                    >
                      Log out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Sign in
            </Button>
          )}
          <Button className="md:hidden" variant="ghost" size="icon">
            <ShoppingCart />
          </Button>
          <Button className="hidden md:inline-flex font-bold">
            <ShoppingCart data-icon="inline-start" />
            Cart
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
