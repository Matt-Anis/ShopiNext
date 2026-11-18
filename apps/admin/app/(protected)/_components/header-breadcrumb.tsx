"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/breadcrumb"
import { useBreadcrumbItems } from "./breadcrumb-provider"

export function HeaderBreadcrumb() {
  const items = useBreadcrumbItems()
  const section = usePathname().split("/")[1]
  const sectionTitle = section ? section.charAt(0).toUpperCase() + section.slice(1) : "Overview"
  const title = items.at(-1)?.label ?? sectionTitle

  return (
    <div className="min-w-0">
      <span className={items.length > 0 ? "block truncate text-sm font-semibold lg:hidden" : "block truncate text-sm font-semibold"}>
        {title}
      </span>
      {items.length > 0 && (
        <Breadcrumb className="hidden min-w-0 lg:block">
          <BreadcrumbList className="flex-nowrap">
            {items.map((item, index) => (
              <Fragment key={item.href ?? item.label}>
                {index > 0 && <BreadcrumbSeparator className="shrink-0" />}
                <BreadcrumbItem className="min-w-0">
                  {!item.href ? (
                    <BreadcrumbPage className="truncate font-semibold">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="truncate"
                      render={<Link href={item.href} />}
                    >
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </div>
  )
}
