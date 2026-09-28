import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface EntityCellProps {
  name: string;
  subtitle?: string;
  image?: string;
  square?: boolean;
}

export function EntityCell({ name, subtitle, image, square }: EntityCellProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className={square ? "h-9 w-9 rounded-md" : "h-9 w-9"}>
        {image && <AvatarImage src={image} alt={name} className={square ? "rounded-md" : ""} />}
        <AvatarFallback className={square ? "rounded-md" : ""}>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
