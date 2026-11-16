export type IndexDocument = { id: string };

export type DocumentPage<T extends IndexDocument = IndexDocument> = {
  documents: T[];
  nextCursor: string | null;
};

export function projectDocumentPage<
  T extends IndexDocument,
  D extends IndexDocument,
>(rows: T[], limit: number, project: (row: T) => D | null): DocumentPage<D> {
  const documents: D[] = [];
  for (const row of rows) {
    const document = project(row);
    if (document !== null) documents.push(document);
  }

  return {
    documents,
    nextCursor: rows.length === limit ? (rows.at(-1)?.id ?? null) : null,
  };
}
