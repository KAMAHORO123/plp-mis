import { translateUi, useSiteLanguage, LanguageSwitcher } from '../../i18n/language';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, User, Settings, LifeBuoy, LogOut } from "lucide-react";
import { Breadcrumb, type Crumb } from "@/components/shared/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutDialog } from "@/components/shared/sign-out-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/authentication/auth-context";
import { getInitials } from "@/lib/utils";
interface TopbarProps {
    breadcrumb: Crumb[];
    onMenuClick: () => void;
    notificationCount?: number;
}
export function Topbar({ breadcrumb, onMenuClick, notificationCount = 2, }: TopbarProps) {
    useSiteLanguage();
    const { user, logout } = useAuth();
    const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
    const navigate = useNavigate();
    return (<header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} aria-label={translateUi("Open menu")} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden">
          <Menu className="h-5 w-5"/>
        </button>
        <Breadcrumb items={breadcrumb} className="hidden sm:flex"/>
      </div>

      <div className="flex items-center gap-3"><LanguageSwitcher compact/>
        <button onClick={() => navigate("/notifications")} aria-label={translateUi("Notifications")} className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="h-5 w-5"/>
          {translateUi(notificationCount > 0 && (<span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {translateUi(notificationCount)}
            </span>))}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label={translateUi("Account menu")} className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-9 w-9 ring-2 ring-border transition-shadow hover:ring-primary/40">
                <AvatarImage src={user?.avatar} alt={translateUi(user?.name)}/>
                <AvatarFallback>{translateUi(getInitials(user?.name ?? "PL"))}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[14rem]">
            <DropdownMenuLabel className="normal-case">
              <p className="text-sm font-semibold text-foreground">{translateUi(user?.name)}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">
                {translateUi(user?.email)}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <User />{translateUi(" Profile ")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings />{translateUi(" Settings ")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/support")}>
              <LifeBuoy />{translateUi(" Support ")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowSignoutConfirm(true)} className="text-destructive focus:bg-destructive/10 [&_svg]:text-destructive">
              <LogOut />{translateUi(" Log out ")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SignOutDialog open={showSignoutConfirm} onOpenChange={setShowSignoutConfirm} onConfirm={logout} userName={user?.name} userEmail={user?.email}/>
    </header>);
}
