export const shapeVariant = <
  T extends {
    stock: number
    maxPerOrder: number
    variantOptionValues: { optionValueId: string }[]
  },
>(
  variant: T
) => {
  const { variantOptionValues, stock, maxPerOrder, ...rest } = variant
  return {
    ...rest,
    maxPerOrder: Math.min(stock, maxPerOrder),
    optionValueIds: variantOptionValues.map((v) => v.optionValueId),
  }
}
