import { XIcon } from "lucide-react";
import { Button } from "./button";

type SearchHistoryProps = {
  queries: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClear: () => void;
};

export function SearchHistory({
  queries,
  onSelect,
  onRemove,
  onClear,
}: SearchHistoryProps) {
  return (
    <section aria-label="Recent searches" className="px-2 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">
          Recent searches
        </h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear all
        </Button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {queries.map((query) => (
          <li
            key={query.toLowerCase()}
            className="flex max-w-full items-center rounded-full border border-border"
          >
            <Button
              variant="ghost"
              size="sm"
              className="min-w-0 rounded-r-none"
              onClick={() => onSelect(query)}
            >
              <span className="truncate">{query}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="mr-1 shrink-0"
              aria-label={`Remove ${query} from recent searches`}
              onClick={() => onRemove(query)}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
