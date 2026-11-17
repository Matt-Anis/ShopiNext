import {
  FolderTree,
  Package,
  Receipt,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { SearchPreview } from "@repo/search/contracts";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const icons = {
  product: Package,
  category: FolderTree,
  order: Receipt,
  customer: UserRound,
  staff: UsersRound,
};
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function SearchResultMetadata({ result }: { result: SearchPreview }) {
  switch (result.type) {
    case "product":
      return (
        <>
          {"status" in result && (
            <span className="capitalize">
              {result.isActive ? result.status : "Trashed"} ·{" "}
            </span>
          )}
          {result.categoryNames.join(", ")}
        </>
      );
    case "category":
      return <>Category</>;
    case "order":
      return (
        <>
          {result.checkoutEmail} · {money.format(result.totalAmount / 100)} ·{" "}
          {result.archivedAt ? "Archived" : result.status.replaceAll("_", " ")}
        </>
      );
    case "customer":
      return <>{result.email}</>;
    case "staff":
      return (
        <>
          {result.email} · {result.banned ? "Banned" : result.role}
        </>
      );
  }
}

export function SearchResult({ result }: { result: SearchPreview }) {
  const Icon = icons[result.type];
  const image =
    result.type === "product"
      ? result.thumbnailUrl
      : "image" in result
        ? result.image
        : null;
  return (
    <>
      <Avatar size="lg" className="rounded-lg after:rounded-lg">
        {image && <AvatarImage src={image} alt="" className="rounded-lg" />}
        <AvatarFallback className="rounded-lg">
          <Icon className="size-5" aria-hidden="true" />
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium">
          {result.title}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          <SearchResultMetadata result={result} />
        </span>
        {result.excerpt && (
          <span className="mt-1 line-clamp-2 text-xs font-normal text-muted-foreground">
            {result.excerpt.source === "sku" && "SKU: "}
            {result.excerpt.segments.map((segment, index) =>
              segment.matched ? (
                <mark
                  key={index}
                  className="rounded-sm bg-primary/15 px-0.5 text-foreground"
                >
                  {segment.text}
                </mark>
              ) : (
                <span key={index}>{segment.text}</span>
              ),
            )}
          </span>
        )}
      </span>
    </>
  );
}
