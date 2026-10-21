import { db } from "@/db"

export async function getAllMediaList() {
  const media = await db.query.images.findMany({
    with: {
      product: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: (images, { asc }) => [asc(images.order)],
  })

  return media.map((item) => ({
    id: item.id,
    url: item.url,
    altText: item.altText,
    order: item.order,
    productId: item.productId,
    productName: item.product?.name ?? "Unknown Product",
    productSlug: item.product?.slug ?? "",
  }))
}

export type MediaListItem = Awaited<ReturnType<typeof getAllMediaList>>[number]
