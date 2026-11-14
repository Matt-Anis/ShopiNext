import type { FooterProps } from "@repo/ui/footer"

export const storefrontFooter = {
  brandName: "ShopiNext",
  homeHref: "/",
  headline: "Something else catch your eye?",
  action: { label: "Keep exploring", href: "/#products" },
  groups: [
    {
      title: "Shop",
      links: [
        { label: "All products", href: "/#products" },
        { label: "Categories", href: "/categories" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Your account", href: "/profile" },
        { label: "Your orders", href: "/orders" },
      ],
    },
    {
      title: "Help",
      links: [
        { label: "Contact", href: "mailto:matt.anis.dev@gmail.com" },
        { label: "Privacy policy", href: "/privacy-policy" },
        { label: "Terms of service", href: "/term-of-service" },
      ],
    },
  ],
  copyright: "© ShopiNext. All rights reserved.",
} satisfies FooterProps
