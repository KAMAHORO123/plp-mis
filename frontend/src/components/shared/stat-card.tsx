import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Trend } from "@/types";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  trend?: Trend;
  caption?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  trend = "up",
  caption = "vs last month",
  className,
}: StatCardProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <Card
      className={cn(
        "p-4 transition-shadow hover:shadow-card-hover",
        className
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/60 text-muted-foreground">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <p className="mt-3 text-[13px] font-medium text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {change && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold",
              trend === "up" ? "text-success" : "text-destructive"
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {change}
          </span>
          <span className="text-muted-foreground">{caption}</span>
        </div>
      )}
    </Card>
  );
}
