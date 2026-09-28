import { MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showMenu?: boolean;
}

export function ChartCard({
  title,
  description,
  actions,
  children,
  className,
  showMenu = true,
}: ChartCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {showMenu && (
            <button
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Chart options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
}
