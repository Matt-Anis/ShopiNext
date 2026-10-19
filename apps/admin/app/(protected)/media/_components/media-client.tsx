"use client"

import { useRouter } from "next/navigation"
import { Image as ImageIcon } from "lucide-react"

import { DataTable } from "@repo/ui/data-table"
import type { MediaListItem } from "@/features/media/queries"
import { getColumns } from "./columns"
import { useBreadcrumb } from "../../_components/breadcrumb-provider"

interface MediaClientProps {
  media: MediaListItem[]
}

const breadcrumbItems = [{ label: "Media" }]

export function MediaClient({ media }: MediaClientProps) {
  useBreadcrumb(breadcrumbItems)
  const router = useRouter()

  const columns = getColumns({
    onViewProduct: (productId) => router.push(`/products/${productId}`),
  })

  return (
    <DataTable
      columns={columns}
      data={media}
      searchColumn="productName"
      searchPlaceholder="Search media by product..."
      emptyIcon={<ImageIcon />}
      emptyTitle="No media yet"
      emptyDescription="Images uploaded to products will appear here."
      emptyTestId="media-empty-state"
      tableId="media"
    />
  )
}
