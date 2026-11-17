import { normalizeRecentQueries } from "../recent-queries";

export const PUBLIC_RECENT_SEARCH_KEY = "shopinext:search:public";
export const ADMIN_RECENT_SEARCH_PREFIX = "shopinext:search:admin:";

export type RecentSearchHistory = {
  read: () => string[];
  remember: (query: string) => string[];
  remove: (query: string) => string[];
  clear: () => void;
};

type HistoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function createRecentSearchHistory(
  getStorage: () => HistoryStorage,
  key: string,
): RecentSearchHistory {
  function read(): string[] {
    try {
      return normalizeRecentQueries(
        JSON.parse(getStorage().getItem(key) ?? "[]"),
      );
    } catch {
      return [];
    }
  }
  function write(queries: string[]): string[] {
    try {
      getStorage().setItem(key, JSON.stringify(queries));
    } catch {}
    return queries;
  }
  return {
    read,
    remember(query) {
      const valid = normalizeRecentQueries([query])[0];
      return valid ? write(normalizeRecentQueries([valid, ...read()])) : read();
    },
    remove(query) {
      const key = query.trim().toLowerCase();
      return write(read().filter((item) => item.toLowerCase() !== key));
    },
    clear() {
      try {
        getStorage().removeItem(key);
      } catch {}
    },
  };
}

export function createPublicSearchHistory(): RecentSearchHistory {
  return createRecentSearchHistory(
    () => window.localStorage,
    PUBLIC_RECENT_SEARCH_KEY,
  );
}

export function createAdminSearchHistory(
  accountId: string,
): RecentSearchHistory {
  return createRecentSearchHistory(
    () => window.sessionStorage,
    `${ADMIN_RECENT_SEARCH_PREFIX}${encodeURIComponent(accountId)}`,
  );
}

export function clearAdminSearchHistory(
  storage?: Pick<Storage, "length" | "key" | "removeItem">,
): void {
  try {
    const session = storage ?? window.sessionStorage;
    for (let index = session.length - 1; index >= 0; index -= 1) {
      const key = session.key(index);
      if (key?.startsWith(ADMIN_RECENT_SEARCH_PREFIX)) session.removeItem(key);
    }
  } catch {}
}
