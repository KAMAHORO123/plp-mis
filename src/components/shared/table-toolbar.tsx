import { translateUi, useSiteLanguage } from '../../i18n/language';
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
export function TableToolbar({ search, onSearchChange, searchPlaceholder, showColumns, onColumns, onFilter, onSort, className, }: TableToolbarProps) {
    useSiteLanguage();
    const handleFilter = () => {
        if (onFilter)
            return onFilter();
        onSearchChange("");
        toast.success(translateUi("Filters cleared"));
    };
    const handleSort = () => {
        if (onSort)
            return onSort();
        toast.info(translateUi("Click a column header to sort"));
    };
    const handleColumns = () => {
        if (onColumns)
            return onColumns();
        toast.info(translateUi("All table columns are currently visible"));
    };
    return (<div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="w-full sm:max-w-md">
        <SearchBar value={search} onChange={onSearchChange} placeholder={translateUi(searchPlaceholder)}/>
      </div>
      <div className="flex items-center gap-2">
        {translateUi(showColumns && (<Button variant="secondary" size="sm" onClick={handleColumns}>{translateUi(" Columns ")}<Columns3 />
          </Button>))}
        <Button variant="primary" size="sm" onClick={handleFilter}>{translateUi(" Filter ")}<ListFilter />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSort}>{translateUi(" Sort ")}<ArrowDownUp />
        </Button>
      </div>
    </div>);
}
