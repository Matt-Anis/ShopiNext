"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type OnChangeFn,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Columns3,
  Search,
} from "lucide-react";

import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./dropdown-menu";
import { Input } from "./input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";
import { cn } from "../lib/utils";

function getColumnVisibilityStorageKey(tableId: string) {
  return `data-table:${tableId}:column-visibility`;
}

function getColumnOrderStorageKey(tableId: string) {
  return `data-table:${tableId}:column-order`;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumn?: string;
  searchPlaceholder?: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon: React.ReactNode;
  emptyTestId?: string;
  tableId?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Search...",
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyTestId,
  tableId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([]);

  React.useEffect(() => {
    if (!tableId) return;
    try {
      const stored = window.localStorage.getItem(
        getColumnVisibilityStorageKey(tableId),
      );
      if (stored) setColumnVisibility(JSON.parse(stored));
    } catch {
      // localStorage unavailable or value malformed — fall back to all columns visible
    }
    try {
      const stored = window.localStorage.getItem(
        getColumnOrderStorageKey(tableId),
      );
      if (stored) setColumnOrder(JSON.parse(stored));
    } catch {
      // localStorage unavailable or value malformed — fall back to definition order
    }
  }, [tableId]);

  const handleColumnVisibilityChange: OnChangeFn<VisibilityState> =
    React.useCallback(
      (updater) => {
        setColumnVisibility((old) => {
          const next = typeof updater === "function" ? updater(old) : updater;
          if (tableId) {
            try {
              window.localStorage.setItem(
                getColumnVisibilityStorageKey(tableId),
                JSON.stringify(next),
              );
            } catch {
              // ignore storage write failures (e.g. private browsing quota)
            }
          }
          return next;
        });
      },
      [tableId],
    );

  const handleColumnOrderChange: OnChangeFn<ColumnOrderState> =
    React.useCallback(
      (updater) => {
        setColumnOrder((old) => {
          const next = typeof updater === "function" ? updater(old) : updater;
          if (tableId) {
            try {
              window.localStorage.setItem(
                getColumnOrderStorageKey(tableId),
                JSON.stringify(next),
              );
            } catch {
              // ignore storage write failures (e.g. private browsing quota)
            }
          }
          return next;
        });
      },
      [tableId],
    );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onColumnOrderChange: handleColumnOrderChange,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder,
    },
  });

  const rows = table.getRowModel().rows;

  const orderedColumnIds =
    columnOrder.length > 0
      ? [
          ...columnOrder.filter((id) => table.getColumn(id)),
          ...table
            .getAllLeafColumns()
            .map((column) => column.id)
            .filter((id) => !columnOrder.includes(id)),
        ]
      : table.getAllLeafColumns().map((column) => column.id);

  const reorderableColumns = orderedColumnIds
    .map((id) => table.getColumn(id))
    .filter((column): column is NonNullable<typeof column> =>
      Boolean(column?.getCanHide())
    );

  function moveColumn(columnId: string, direction: -1 | 1) {
    const currentIndex = orderedColumnIds.indexOf(columnId);
    const targetIndex = currentIndex + direction;
    const targetId = orderedColumnIds[targetIndex];
    if (!targetId || !table.getColumn(targetId)?.getCanHide()) return;

    const next = [...orderedColumnIds];
    [next[currentIndex], next[targetIndex]] = [
      next[targetIndex],
      next[currentIndex],
    ];
    handleColumnOrderChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {data.length > 0 && (
        <div className="flex items-center gap-4 pb-4">
          {searchColumn ? (
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={
                  (table.getColumn(searchColumn)?.getFilterValue() as string) ??
                  ""
                }
                onChange={(event) =>
                  table
                    .getColumn(searchColumn)
                    ?.setFilterValue(event.target.value)
                }
                className="pl-9"
                data-testid="data-table-search-input"
              />
            </div>
          ) : (
            <div />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="data-table-columns-button"
                >
                  <Columns3 />
                  Columns
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-64">
              {reorderableColumns.map((column, index) => {
                const label =
                  typeof column.columnDef.header === "string"
                    ? column.columnDef.header
                    : column.id;
                const isVisible = column.getIsVisible();

                return (
                  <div
                    key={column.id}
                    className="flex items-center gap-1 rounded-2xl px-1.5 py-1"
                  >
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm font-medium hover:bg-accent"
                      onClick={() => column.toggleVisibility(!isVisible)}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-sm border border-input",
                          isVisible && "border-primary bg-primary text-primary-foreground"
                        )}
                      >
                        {isVisible && <Check className="size-3" />}
                      </span>
                      {label}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={index === 0}
                      onClick={() => moveColumn(column.id, -1)}
                    >
                      <ChevronUp />
                      <span className="sr-only">Move {label} up</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={index === reorderableColumns.length - 1}
                      onClick={() => moveColumn(column.id, 1)}
                    >
                      <ChevronDown />
                      <span className="sr-only">Move {label} down</span>
                    </Button>
                  </div>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {data.length === 0 ? (
        <Empty className="border-none" data-testid={emptyTestId}>
          <EmptyHeader>
            <EmptyMedia variant="icon">{emptyIcon}</EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription className="max-w-xs text-pretty">
              {emptyDescription}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className={cn(
                            "flex items-center gap-1.5 font-medium",
                            "hover:text-foreground",
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sortDirection === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : sortDirection === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ChevronsUpDown className="size-3.5 text-muted-foreground/50" />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
