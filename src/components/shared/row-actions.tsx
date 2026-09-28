import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RowActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger" | "success" | "primary";
}

const VARIANT_CLASSES = {
  default: "text-muted-foreground hover:text-foreground",
  danger: "text-muted-foreground hover:text-destructive",
  success: "text-muted-foreground hover:text-success",
  primary: "text-muted-foreground hover:text-primary",
};

export function RowAction({
  icon: Icon,
  label,
  onClick,
  variant = "default",
}: RowActionProps) {
  return (
    <button
      type="button"
      onClick={onClick ?? (() => toast.info(`${label} action`))}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-md p-1.5 transition-colors hover:bg-secondary",
        VARIANT_CLASSES[variant]
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>;
}
