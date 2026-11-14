import type { ComponentProps, ComponentType } from "react"
import { ArrowUpRight } from "lucide-react"

import { cn } from "../lib/utils"

type FooterLink = {
  label: string
  href: string
}

type FooterLinkGroup = {
  title: string
  links: readonly FooterLink[]
}

type FooterAnchorProps = ComponentProps<"a"> & { href: string }

type FooterProps = Omit<ComponentProps<"footer">, "children"> & {
  brandName: string
  homeHref: string
  headline: string
  action: FooterLink
  groups: readonly FooterLinkGroup[]
  copyright: string
  linkComponent?: ComponentType<FooterAnchorProps> | "a"
}

const footerLinkClassName =
  "inline-flex min-h-11 items-center rounded-sm text-sm text-zinc-300 underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"

function FooterGroup({
  group,
  linkComponent: Link,
}: {
  group: FooterLinkGroup
  linkComponent: ComponentType<FooterAnchorProps> | "a"
}) {
  return (
    <nav aria-label={group.title}>
      <h3 className="mb-3 text-xs font-medium tracking-widest text-zinc-400 uppercase">
        {group.title}
      </h3>
      <ul>
        {group.links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={footerLinkClassName}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Footer({
  brandName,
  homeHref,
  headline,
  action,
  groups,
  copyright,
  linkComponent: Link = "a",
  className,
  ...props
}: FooterProps) {
  return (
    <footer
      data-slot="footer"
      className={cn(
        "mt-auto shrink-0 border-t border-zinc-800 bg-zinc-950 text-zinc-50",
        className
      )}
      {...props}
    >
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-16 md:px-10">
        <div className="grid gap-12 border-b border-zinc-800 pb-12 lg:grid-cols-2 lg:gap-20 lg:pb-16">
          <div className="flex flex-col items-start gap-6">
            <h2 className="max-w-sm font-heading text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
              {headline}
            </h2>
            <Link
              href={action.href}
              className="group inline-flex min-h-12 items-center gap-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              {action.label}
              <ArrowUpRight
                aria-hidden="true"
                className="size-5 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-focus-visible:translate-x-0.5 motion-safe:group-focus-visible:-translate-y-0.5"
              />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3">
            {groups.map((group) => (
              <FooterGroup
                key={group.title}
                group={group}
                linkComponent={Link}
              />
            ))}
          </div>
        </div>
        <Link
          href={homeHref}
          aria-label={`${brandName} home`}
          className="mt-8 block w-fit max-w-full rounded-sm font-heading text-[clamp(3rem,15vw,12rem)] leading-none font-semibold tracking-[-0.075em] text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          {brandName}
        </Link>
        <p className="mt-6 text-xs text-zinc-400">{copyright}</p>
      </div>
    </footer>
  )
}

export { Footer }
export type { FooterProps }
