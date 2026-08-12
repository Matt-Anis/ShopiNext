"use client";

import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";

import Logo from "./Logo";
import { Button } from "./ui/button";

import { ShoppingCart, User } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

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
          <Button variant="ghost" size="icon">
            <User />
          </Button>
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
