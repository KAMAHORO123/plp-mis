import { Columns3, ListFilter, ArrowDownUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/shared/search-bar";
import { cn } from "@/lib/utils";

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  showColumns?: boolean;
  onColumns?: () => void;
  onFilter?: () => void;
  onSort?: () => void;
  className?: string;
}

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  showColumns,
  onColumns,
  onFilter,
  onSort,
  className,
}: TableToolbarProps) {
  const handleFilter = () => {
    if (onFilter) return onFilter();
    onSearchChange("");
    toast.success("Filters cleared");
  };

  const handleSort = () => {
    if (onSort) return onSort();
    toast.info("Click a column header to sort");
  };

  const handleColumns = () => {
    if (onColumns) return onColumns();
    toast.info("All table columns are currently visible");
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="w-full sm:max-w-md">
        <SearchBar value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
      </div>
      <div className="flex items-center gap-2">
        {showColumns && (
          <Button variant="secondary" size="sm" onClick={handleColumns}>
            Columns <Columns3 />
          </Button>
        )}
        <Button variant="primary" size="sm" onClick={handleFilter}>
          Filter <ListFilter />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSort}>
          Sort <ArrowDownUp />
        </Button>
      </div>
    </div>
  );
}
