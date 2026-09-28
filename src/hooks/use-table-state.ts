import { useMemo, useState } from "react";
import type { Column, SortDirection } from "@/components/shared/data-table";

interface UseTableStateOptions<T> {
  data: T[];
  columns: Column<T>[];
  searchFields: (row: T) => string;
  pageSize?: number;
}

export function useTableState<T>({
  data,
  columns,
  searchFields,
  pageSize = 9,
}: UseTableStateOptions<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    id: string;
    direction: SortDirection;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter((row) => searchFields(row).toLowerCase().includes(term));
  }, [data, search, searchFields]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((c) => c.id === sort.id);
    if (!column?.sortValue) return filtered;
    const next = [...filtered].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      if (av < bv) return sort.direction === "asc" ? -1 : 1;
      if (av > bv) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
    return next;
  }, [filtered, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize]
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return {
    search,
    setSearch: handleSearch,
    page: currentPage,
    setPage,
    totalPages,
    sort,
    setSort,
    selectedIds,
    setSelectedIds,
    rows: paginated,
    totalCount: sorted.length,
  };
}
