import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

const COLLAGE = {
  march: "/auth/march.jpg",
  speaker: "/auth/speaker.jpg",
  basketball: "/auth/basketball.jpg",
  icyeza: "/auth/icyeza.jpg",
  selfie: "/auth/selfie.jpg",
};

export function AuthLayout({ actions }: { actions?: ReactNode } = {}) {
  return (
    <div className="grid h-screen overflow-hidden bg-background lg:grid-cols-2">
      {/* Form side */}
      <div className="relative flex h-screen flex-col px-6 py-5 sm:px-8">
        {actions && <div className="absolute right-6 top-6">{actions}</div>}
        <img
          src="/logo.svg"
          alt="Peace and Love Proclaimers"
          className="h-16 w-auto shrink-0 self-start object-contain"
        />

        <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto py-6">
          <Outlet />
        </main>

        <p className="shrink-0 text-xs text-muted-foreground">
          © PLP Rwanda 2026
        </p>
      </div>

      {/* Collage side */}
      <div className="relative hidden bg-background p-2 lg:block">
        <div className="grid h-full grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <img
              src={COLLAGE.march}
              alt="PLP community march"
              className="min-h-0 w-full flex-[52] rounded-[20px] object-cover"
              loading="lazy"
            />
            <img
              src={COLLAGE.speaker}
              alt="PLP youth speaker"
              className="min-h-0 w-full flex-[48] rounded-[20px] object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col gap-2">
            <img
              src={COLLAGE.basketball}
              alt="PLP sports activity"
              className="min-h-0 w-full flex-[28] rounded-[20px] object-cover"
              loading="lazy"
            />
            <img
              src={COLLAGE.icyeza}
              alt="PLP Icyeza students"
              className="min-h-0 w-full flex-[46] rounded-[20px] object-cover"
              loading="lazy"
            />
            <img
              src={COLLAGE.selfie}
              alt="PLP celebration"
              className="min-h-0 w-full flex-[26] rounded-[20px] object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Soft white glow overlay to fade the collage */}
        <img
          src="/auth/glow.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />

        {/* Top fade so the top images blend into the background like the bottom */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
      </div>
    </div>
  );
}
