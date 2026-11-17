"use client";

import { useId } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

type CatalogControlsProps = {
  query: string;
  sortBy: string;
  sortOptions: readonly { value: string; label: string }[];
  maxQueryLength: number;
  onQueryChange: (query: string) => void;
  onSortChange: (sortBy: string) => void;
  onReset: () => void;
  canReset: boolean;
  variant?: "default" | "storefront";
};

export function CatalogControls({
  query,
  sortBy,
  sortOptions,
  maxQueryLength,
  onQueryChange,
  onSortChange,
  onReset,
  canReset,
  variant = "default",
}: CatalogControlsProps) {
  const id = useId();
  const storefront = variant === "storefront";
  const labelClassName = storefront
    ? "font-mono text-xs tracking-wider text-muted-foreground uppercase"
    : undefined;

  return (
    <div
      className={storefront ? "mb-8 border-b border-border pb-8" : "mb-8"}
      role="group"
      aria-label="Product discovery"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor={`${id}-query`} className={labelClassName}>
            Filter products by name
          </Label>
          <Input
            id={`${id}-query`}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            maxLength={maxQueryLength}
            placeholder="Product name"
            className={storefront ? "h-12 rounded-md bg-card" : undefined}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label
            id={`${id}-sort-label`}
            htmlFor={`${id}-sort`}
            className={labelClassName}
          >
            Sort products
          </Label>
          <Select
            value={sortBy}
            items={[...sortOptions]}
            onValueChange={(value) => {
              if (value) onSortChange(value);
            }}
          >
            <SelectTrigger
              id={`${id}-sort`}
              aria-labelledby={`${id}-sort-label`}
              className={
                storefront
                  ? "w-full rounded-md bg-card data-[size=default]:h-12 sm:w-52"
                  : "w-full sm:w-52"
              }
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sortOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="py-2.5"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          className={storefront ? "h-12" : undefined}
          onClick={onReset}
          disabled={!canReset}
        >
          Reset filters
        </Button>
      </div>
    </div>
  );
}
