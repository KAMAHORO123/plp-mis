import { translateUi, useSiteLanguage } from '../../i18n/language';
import { cn } from "@/lib/utils";
interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}
export function PageHeader({ title, description, actions, className, }: PageHeaderProps) {
    useSiteLanguage();
    return (<div className={cn("plp-dashboard-heading flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="space-y-1">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-[22px]">
          {translateUi(title)}
        </h1>
        {translateUi(description && (<p className="text-sm text-muted-foreground">{translateUi(description)}</p>))}
      </div>
      {translateUi(actions && (<div className="flex flex-wrap items-center gap-2.5">{translateUi(actions)}</div>))}
    </div>);
}
