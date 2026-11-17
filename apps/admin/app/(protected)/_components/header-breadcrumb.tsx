"use client"

import { Fragment } from "react"
import Link from "next/link"

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

  if (items.length === 0) {
    return null
  }

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem
              className={index === items.length - 1 ? "min-w-0" : "shrink-0"}
            >
              {!item.href ? (
                <BreadcrumbPage className="truncate">
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
  )
}
