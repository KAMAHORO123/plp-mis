import { translateUi, useSiteLanguage } from '../../i18n/language';
import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
export interface Crumb {
    label: string;
    href?: string;
    icon?: React.ComponentType<{
        className?: string;
    }>;
}
interface BreadcrumbProps {
    items: Crumb[];
    className?: string;
}
export function Breadcrumb({ items, className }: BreadcrumbProps) {
    useSiteLanguage();
    return (<nav aria-label={translateUi("Breadcrumb")} className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1.5 text-sm">
        {translateUi(items.map((item, index) => {
            const isLast = index === items.length - 1;
            const Icon = item.icon;
            return (<Fragment key={item.label}>
              <li className="flex items-center gap-1.5">
                {translateUi(Icon && <Icon className="h-4 w-4 text-muted-foreground"/>)}
                {translateUi(item.href && !isLast ? (<Link to={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {translateUi(item.label)}
                  </Link>) : (<span className={cn(isLast
                        ? "font-medium text-foreground"
                        : "text-muted-foreground")} aria-current={isLast ? "page" : undefined}>
                    {translateUi(item.label)}
                  </span>))}
              </li>
              {translateUi(!isLast && (<ChevronRight className="h-4 w-4 text-muted-foreground/50"/>))}
            </Fragment>);
        }))}
      </ol>
    </nav>);
}
