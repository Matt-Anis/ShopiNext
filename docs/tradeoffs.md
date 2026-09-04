# Known tradeoffs

Decisions I considered changing, looked at the alternative closely, and
kept as-is. Recorded so I don't have the same discussion with myself
twice, and so the decision gets revisited if its underlying assumption
changes.

## Eager-loading variants on the product listing

`getAllProducts` (in [`apps/client/features/products/queries.ts`](../apps/client/features/products/queries.ts))
loads each product's full `options` → `values` and `variants` →
`variantOptionValues` tree on every listing page, not just `minPrice` and
an image. `ProductCard` (in [`apps/client/components/ProductCard.tsx`](../apps/client/components/ProductCard.tsx))
uses that data to render an inline "Add to Cart" popover with a variant
picker directly on the grid, with no extra request.

**The supposed fix:** stop eager-loading variants on the listing query.
Denormalize a `products.minStock` (or `hasStock`) column the same way
`minPrice` is denormalized — see [`database.md`](./database.md) — and have
the "Add to Cart" popover fetch that product's variants on demand, only
when it's opened.

**Why I left it as-is:**

- **The payload savings are small at current catalog shape.** Products
  carry 3-5 variants typically. Eager-loading that tree costs a few KB per
  product per page — not enough to be worth trading away for what lazy
  loading costs.
- **Lazy-loading moves the cost to the wrong moment.** It would turn every
  "Add to Cart" click into a network round trip plus a loading state and
  error handling, on the exact interaction where latency and failure
  states hurt most (checkout intent), to save bandwidth on page load that
  wasn't a measured problem.
- **It adds a second trigger-maintained column and a new endpoint** for a
  saving that's currently theoretical, not observed.

**When to revisit:** if products start carrying variant counts far above
today's 3-5 (e.g. large color × size matrices), or if listing payload size
becomes a measured, real bottleneck. Until then this is deferred, not
rejected outright.
