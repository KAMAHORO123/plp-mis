import { translateUi, useSiteLanguage } from '../../i18n/language';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
interface EntityCellProps {
    name: string;
    subtitle?: string;
    image?: string;
    square?: boolean;
}
export function EntityCell({ name, subtitle, image, square }: EntityCellProps) {
    useSiteLanguage();
    return (<div className="flex items-center gap-3">
      <Avatar className={square ? "h-9 w-9 rounded-md" : "h-9 w-9"}>
        {translateUi(image && <AvatarImage src={image} alt={translateUi(name)} className={square ? "rounded-md" : ""}/>)}
        <AvatarFallback className={square ? "rounded-md" : ""}>
          {translateUi(getInitials(name))}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{translateUi(name)}</p>
        {translateUi(subtitle && (<p className="truncate text-xs text-muted-foreground">{translateUi(subtitle)}</p>))}
      </div>
    </div>);
}
