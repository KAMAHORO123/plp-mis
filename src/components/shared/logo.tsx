import { translateUi, useSiteLanguage } from '../../i18n/language';
import { cn } from "@/lib/utils";
interface LogoProps {
    className?: string;
    showText?: boolean;
    subtitle?: string;
}
export function LogoMark({ className }: {
    className?: string;
}) {
    useSiteLanguage();
    return (<img src="/favicon.svg" alt={translateUi("Peace and Love Proclaimers")} className={cn("h-7 w-7 object-contain", className)}/>);
}
export function Logo({ className, showText = true, subtitle }: LogoProps) {
    useSiteLanguage();
    return (<div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="text-primary"/>
      {translateUi(showText && (<div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-foreground">{translateUi(" PLP MIS ")}</p>
          <p className="text-xs font-medium text-primary">
            {translateUi(subtitle ?? "National Dashboard")}
          </p>
        </div>))}
    </div>);
}
