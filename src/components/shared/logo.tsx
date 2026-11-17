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
/** The full Peace and Love Proclaimers logo, the same one the website uses (with its dark-mode version). */
export function Logo({ className, showText = true, subtitle }: LogoProps) {
    useSiteLanguage();
    return (<div className={cn("flex flex-col items-start gap-1", className)}>
      <img src="/logo.svg" alt={translateUi("Peace and Love Proclaimers \u2014 Youth For Change")} width={124} height={70} className="plp-logo-light h-[62px] w-auto object-contain"/>
      <img src="/logo-dark.svg" alt="" aria-hidden="true" width={124} height={70} className="plp-logo-dark h-[62px] w-auto object-contain"/>
      {translateUi(showText && subtitle && (<p className="text-xs font-semibold text-primary">{translateUi(subtitle)}</p>))}
    </div>);
}
