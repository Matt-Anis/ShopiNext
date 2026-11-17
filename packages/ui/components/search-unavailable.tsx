import {
  SEARCH_SETUP_URL,
  SEARCH_UNAVAILABLE_MESSAGE,
} from "@repo/search/availability";

export function SearchUnavailable() {
  return (
    <div className="px-3 py-4 text-sm text-muted-foreground">
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
}
