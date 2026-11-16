import {
  MeilisearchApiError,
  type KeyCreation,
  type Meilisearch,
} from "meilisearch";
import {
  ADMIN_SEARCH_INDEX_UIDS,
  PUBLIC_SEARCH_INDEX_UIDS,
  SEARCH_INDEX_UIDS,
} from "@repo/search/server/indexes";

type KeyDefinition = KeyCreation & { uid: string };

const keyDefinitions = {
  publicSearch: {
    uid: "f49ab2d1-42d4-43ae-9cbc-f4c31be0f401",
    name: "ShopiNext public search",
    actions: ["search"],
    indexes: PUBLIC_SEARCH_INDEX_UIDS,
    expiresAt: null,
  },
  adminSearch: {
    uid: "f49ab2d1-42d4-43ae-9cbc-f4c31be0f402",
    name: "ShopiNext admin search",
    actions: ["search"],
    indexes: ADMIN_SEARCH_INDEX_UIDS,
    expiresAt: null,
  },
  worker: {
    uid: "f49ab2d1-42d4-43ae-9cbc-f4c31be0f403",
    name: "ShopiNext search worker",
    actions: [
      "indexes.get",
      "documents.get",
      "documents.add",
      "documents.delete",
      "tasks.get",
    ],
    indexes: SEARCH_INDEX_UIDS,
    expiresAt: null,
  },
  setup: {
    uid: "f49ab2d1-42d4-43ae-9cbc-f4c31be0f404",
    name: "ShopiNext search setup",
    actions: ["indexes.get", "indexes.create", "settings.update", "tasks.get"],
    indexes: SEARCH_INDEX_UIDS,
    expiresAt: null,
  },
} satisfies Record<string, KeyDefinition>;

function hasSameValues(actual: string[], expected: string[]): boolean {
  return (
    actual.length === expected.length &&
    expected.every((value) => actual.includes(value))
  );
}

async function ensureKey(
  client: Meilisearch,
  definition: KeyDefinition,
): Promise<string> {
  let key;
  try {
    key = await client.getKey(definition.uid);
  } catch (error) {
    if (
      !(error instanceof MeilisearchApiError) ||
      error.cause?.code !== "api_key_not_found"
    ) {
      throw error;
    }
    key = await client.createKey(definition);
  }

  if (
    !hasSameValues(key.actions, definition.actions) ||
    !hasSameValues(key.indexes, definition.indexes) ||
    key.expiresAt !== null
  ) {
    throw new Error(
      `Search key ${definition.uid} has unexpected permissions or expiration. Remove that local key explicitly before running setup again.`,
    );
  }

  if (!key.key) {
    throw new Error(
      `Meilisearch did not return the credential for search key ${definition.uid}.`,
    );
  }

  return key.key;
}

export async function initializeCredentials(client: Meilisearch) {
  const publicSearchKey = await ensureKey(client, keyDefinitions.publicSearch);
  const adminSearchKey = await ensureKey(client, keyDefinitions.adminSearch);
  const workerKey = await ensureKey(client, keyDefinitions.worker);
  const setupKey = await ensureKey(client, keyDefinitions.setup);

  return { publicSearchKey, adminSearchKey, workerKey, setupKey };
}

export type SearchCredentials = Awaited<
  ReturnType<typeof initializeCredentials>
>;
