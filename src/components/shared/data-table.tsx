import * as React from "react";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

export interface Column<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
}

export type SortDirection = "asc" | "desc";

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectChange?: (ids: string[]) => void;
  sort?: { id: string; direction: SortDirection } | null;
  onSortChange?: (sort: { id: string; direction: SortDirection } | null) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonRows?: number;
  rowClassName?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  loading,
  selectable,
  selectedIds = [],
  onSelectChange,
  sort,
  onSortChange,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or filters to find what you're looking for.",
  skeletonRows = 8,
  rowClassName,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => {
    if (!onSelectChange) return;
    onSelectChange(allSelected ? [] : data.map(getRowId));
  };

  const toggleRow = (id: string) => {
    if (!onSelectChange) return;
    onSelectChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id]
    );
  };

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSortChange) return;
    if (sort?.id !== column.id) {
      onSortChange({ id: column.id, direction: "asc" });
    } else if (sort.direction === "asc") {
      onSortChange({ id: column.id, direction: "desc" });
    } else {
      onSortChange(null);
    }
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-y border-border">
            {selectable && (
              <th className="w-10 px-4 py-3 text-left">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.id}
                className={cn(
                  "px-4 py-3 text-left text-xs font-medium text-muted-foreground",
                  column.headerClassName
                )}
              >
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column)}
                    className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                  >
                    {column.header}
                    {sort?.id === column.id ? (
                      sort.direction === "asc" ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i} className="border-b border-border/70">
                {selectable && (
                  <td className="px-4 py-3.5">
                    <Skeleton className="h-4 w-4 rounded" />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.id} className="px-4 py-3.5">
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)}>
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const id = getRowId(row);
              const selected = selectedIds.includes(id);
              return (
                <tr
                  key={id}
                  data-state={selected ? "selected" : undefined}
                  className={cn(
                    "border-b border-border/70 transition-colors hover:bg-secondary/40 data-[state=selected]:bg-primary/5",
                    rowClassName
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleRow(id)}
                        aria-label="Select row"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn(
                        "px-4 py-3 align-middle text-foreground",
                        column.className
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
