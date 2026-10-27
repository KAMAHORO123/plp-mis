import { translateUi, useSiteLanguage } from '../../i18n/language';
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}
function getPageItems(page: number, totalPages: number): (number | "...")[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: (number | "...")[] = [1, 2];
    if (page > 4)
        items.push("...");
    const start = Math.max(3, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++)
        items.push(i);
    if (page < totalPages - 3)
        items.push("...");
    items.push(totalPages);
    return Array.from(new Set(items)) as (number | "...")[];
}
export function Pagination({ page, totalPages, onPageChange, className, }: PaginationProps) {
    useSiteLanguage();
    if (totalPages <= 1)
        return null;
    const items = getPageItems(page, totalPages);
    return (<nav aria-label={translateUi("Pagination")} className={cn("flex items-center justify-center gap-1 sm:justify-between", className)}>
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40">
        <ArrowLeft className="h-4 w-4"/>
        <span className="hidden sm:inline">{translateUi("Prev")}</span>
      </button>

      <div className="flex items-center gap-1">
        {translateUi(items.map((item, idx) => item === "..." ? (<span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">{translateUi(" \u2026 ")}</span>) : (<button key={item} onClick={() => onPageChange(item)} aria-current={page === item ? "page" : undefined} className={cn("inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2.5 text-sm font-medium transition-colors", page === item
                ? "bg-secondary text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
              {translateUi(item)}
            </button>)))}
      </div>

      <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40">
        <span className="hidden sm:inline">{translateUi("Next")}</span>
        <ArrowRight className="h-4 w-4"/>
      </button>
    </nav>);
}
