import ProductDetail from "./_components/ProductDetail";

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;

  return <ProductDetail slug={slug} />;
}
