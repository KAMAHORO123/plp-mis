import { cn } from "@/lib/utils";

export type TimeRange =
  | "all"
  | "5y"
  | "3y"
  | "12m"
  | "30d"
  | "7d"
  | "24h";

const ALL_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "5y", label: "5 Years" },
  { value: "3y", label: "3 Years" },
  { value: "12m", label: "12 months" },
  { value: "30d", label: "30 days" },
  { value: "7d", label: "7 days" },
  { value: "24h", label: "24 hours" },
];

interface TimeRangeTabsProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  options?: TimeRange[];
  className?: string;
}

export function TimeRangeTabs({
  value,
  onChange,
  options,
  className,
}: TimeRangeTabsProps) {
  const list = options
    ? ALL_OPTIONS.filter((o) => options.includes(o.value))
    : ALL_OPTIONS.filter((o) => o.value !== "5y" && o.value !== "3y");

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-card",
        className
      )}
    >
      {list.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
            value === option.value
              ? "bg-secondary text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
