import { CalendarDays, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeRangeTabs, type TimeRange } from "@/components/shared/time-range-tabs";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  rangeOptions?: TimeRange[];
  onSelectDates?: () => void;
  onFilters?: () => void;
  className?: string;
}

export function FilterBar({
  range,
  onRangeChange,
  rangeOptions = ["all", "12m", "30d", "7d", "24h"],
  onSelectDates,
  onFilters,
  className,
}: FilterBarProps) {
  const handleSelectDates = () => {
    if (onSelectDates) return onSelectDates();
    onRangeChange("30d");
  };

  const handleFilters = () => {
    if (onFilters) return onFilters();
    const idx = rangeOptions.indexOf(range);
    const next = rangeOptions[(idx + 1) % rangeOptions.length];
    onRangeChange(next);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <TimeRangeTabs value={range} onChange={onRangeChange} options={rangeOptions} />
      <div className="flex items-center gap-2.5">
        <Button variant="secondary" size="sm" onClick={handleSelectDates}>
          <CalendarDays />
          Select dates
        </Button>
        <Button variant="secondary" size="sm" onClick={handleFilters}>
          <SlidersHorizontal />
          Filters
        </Button>
      </div>
    </div>
  );
}
