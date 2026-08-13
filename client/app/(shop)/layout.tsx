import NavBar from "@/components/NavBar";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <NavBar />
      <main className="pt-16">{children}</main>
    </>
  );
}
