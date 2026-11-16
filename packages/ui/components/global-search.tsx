"use client";

import { useRef, useState } from "react";
import { SearchIcon } from "lucide-react";
import {
  SEARCH_SETUP_URL,
  SEARCH_UNAVAILABLE_MESSAGE,
} from "@repo/search/availability";
import { useIsMobile } from "../hooks/use-mobile";
import { useSearch, type SearchExecutor } from "../hooks/use-search";
import { cn } from "../lib/utils";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { SearchPanel } from "./search-panel";

type GlobalSearchProps = {
  search: SearchExecutor;
  available: boolean;
  onNavigate: (href: string) => void;
  label: string;
  className?: string;
};

export function GlobalSearch({
  search,
  available,
  onNavigate,
  label,
  className,
}: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobile = useIsMobile();
  const { state, setQuery, reset } = useSearch(search, available);
  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }
  const trigger = (
    <Button
      variant="outline"
      className="h-9 w-full justify-start gap-2 bg-background/70 font-normal text-muted-foreground"
      aria-label={label}
    >
      <SearchIcon aria-hidden="true" />
      <span className="truncate">{label}</span>
      {!available && <span className="ml-auto text-xs">Local demo</span>}
    </Button>
  );
  const content = available ? (
    <SearchPanel
      state={state}
      label={label}
      inputRef={inputRef}
      onQueryChange={setQuery}
      onClose={() => changeOpen(false)}
      onSelect={(result) => {
        changeOpen(false);
        onNavigate(result.href);
      }}
    />
  ) : (
    <div className="px-2 py-4 text-sm text-muted-foreground">
      <p>{SEARCH_UNAVAILABLE_MESSAGE}</p>
      <a
        href={SEARCH_SETUP_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block text-foreground underline underline-offset-4"
      >
        Local setup guide
      </a>
    </div>
  );
  return (
    <div className={cn("min-w-0", className)}>
      {mobile ? (
        <Dialog open={open} onOpenChange={changeOpen}>
          <DialogTrigger render={trigger} />
          <DialogContent
            initialFocus={available ? inputRef : undefined}
            className="inset-x-3 top-3 left-3 max-h-[calc(100dvh-1.5rem)] w-auto max-w-none translate-x-0 translate-y-0 gap-3 overflow-hidden p-3 pt-5 sm:max-w-none"
          >
            <DialogTitle className="px-2 pr-10">Search</DialogTitle>
            <DialogDescription className="sr-only">{label}</DialogDescription>
            {content}
          </DialogContent>
        </Dialog>
      ) : (
        <Popover open={open} onOpenChange={changeOpen}>
          <PopoverTrigger render={trigger} />
          <PopoverContent
            initialFocus={available ? inputRef : undefined}
            align="center"
            sideOffset={8}
            className="w-[min(32rem,calc(100vw-2rem))] max-w-(--available-width) gap-2 p-3"
          >
            <PopoverTitle className="sr-only">Search</PopoverTitle>
            <PopoverDescription className="sr-only">{label}</PopoverDescription>
            {content}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
