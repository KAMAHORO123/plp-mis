// The language is chosen on the public website and carried into sign-in and the Hub.
import { translateUi, useSiteLanguage } from '../i18n/language';
import type { ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
const COLLAGE = {
    march: "/auth/march.jpg",
    speaker: "/auth/speaker.jpg",
    basketball: "/auth/basketball.jpg",
    icyeza: "/auth/icyeza.jpg",
    selfie: "/auth/selfie.jpg",
};
export function AuthLayout({ actions }: {
    actions?: ReactNode;
} = {}) {
    useSiteLanguage();
    // The sign-in form always fits the screen, so it stays still; longer forms such as signup scroll.
    const still = useLocation().pathname === "/auth/login";
    return (<div className="grid h-[100dvh] overflow-hidden overscroll-none bg-background lg:grid-cols-2">
      {/* Form side */}
      <div className="relative flex h-[100dvh] flex-col px-5 py-4 sm:px-8 sm:py-5">
        <div className="absolute right-5 top-5 flex items-center gap-3 sm:right-6 sm:top-6">{actions}</div>
        <Link to="/" className="shrink-0 self-start rounded-md" aria-label={translateUi("Peace and Love Proclaimers home")}>
          <img src="/logo.svg" alt="" className="plp-logo-light h-11 w-auto object-contain sm:h-16"/><img src="/logo-dark.svg" alt="" aria-hidden="true" className="plp-logo-dark h-11 w-auto object-contain sm:h-16"/>
        </Link>

        <main className={`flex min-h-0 flex-1 items-center justify-center py-4 sm:py-6 ${still ? "overflow-hidden" : "overflow-y-auto"}`}>
          <Outlet />
        </main>

        <p className="shrink-0 text-xs text-muted-foreground">{translateUi(" \u00A9 PLP Rwanda 2026 ")}</p>
      </div>

      {/* Collage side */}
      <div className="relative hidden bg-background p-2 lg:block">
        <div className="grid h-full grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <img src={COLLAGE.march} alt={translateUi("PLP community march")} className="min-h-0 w-full flex-[52] rounded-[20px] object-cover" loading="lazy"/>
            <img src={COLLAGE.speaker} alt={translateUi("PLP youth speaker")} className="min-h-0 w-full flex-[48] rounded-[20px] object-cover" loading="lazy"/>
          </div>
          <div className="flex flex-col gap-2">
            <img src={COLLAGE.basketball} alt={translateUi("PLP sports activity")} className="min-h-0 w-full flex-[28] rounded-[20px] object-cover" loading="lazy"/>
            <img src={COLLAGE.icyeza} alt={translateUi("PLP Icyeza students")} className="min-h-0 w-full flex-[46] rounded-[20px] object-cover" loading="lazy"/>
            <img src={COLLAGE.selfie} alt={translateUi("PLP celebration")} className="min-h-0 w-full flex-[26] rounded-[20px] object-cover" loading="lazy"/>
          </div>
        </div>

        {/* Soft white glow overlay to fade the collage */}
        <img src="/auth/glow.png" alt={translateUi("")} aria-hidden="true" className="plp-auth-glow pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"/>

        {/* Top fade so the top images blend into the background like the bottom */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent"/>
      </div>
    </div>);
}
