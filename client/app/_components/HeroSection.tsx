"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";

import { Button } from "@/components/ui/button";

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function HeroSection() {
  return (
    <section className="flex items-center justify-center px-6 py-24 md:px-10 md:py-32">
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="flex max-w-2xl flex-col items-center gap-5 text-center"
      >
        <motion.h1
          variants={item}
          className="font-heading text-4xl leading-[1.05] font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Everything you need,
          <br />
          all in one place.
        </motion.h1>

        <motion.h2
          variants={item}
          className="text-lg font-medium text-muted-foreground sm:text-xl md:text-2xl"
        >
          Quality products, fair prices, fast delivery.
        </motion.h2>

        <motion.p
          variants={item}
          className="max-w-lg text-base text-muted-foreground sm:text-lg"
        >
          From everyday essentials to unique finds, explore a carefully curated
          catalog designed to make online shopping simple, secure, and
          enjoyable.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
        >
          <Button
            size="lg"
            className="font-bold"
            nativeButton={false}
            render={<a href="#products" />}
          >
            Browse Products
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Login
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
