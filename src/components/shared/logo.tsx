import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  subtitle?: string;
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/favicon.svg"
      alt="Peace and Love Proclaimers"
      className={cn("h-7 w-7 object-contain", className)}
    />
  );
}

export function Logo({ className, showText = true, subtitle }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="text-primary" />
      {showText && (
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-foreground">
            PLP MIS
          </p>
          <p className="text-xs font-medium text-primary">
            {subtitle ?? "National Dashboard"}
          </p>
        </div>
      )}
    </div>
  );
}
