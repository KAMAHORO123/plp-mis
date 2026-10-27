import { translateUi, useSiteLanguage } from '../../i18n/language';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
interface SignOutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    userName?: string;
    userEmail?: string;
}
export function SignOutDialog({ open, onOpenChange, onConfirm, userName, userEmail, }: SignOutDialogProps) {
    useSiteLanguage();
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl border border-border bg-card shadow-xl">
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-100 dark:border-red-900/40">
            <LogOut className="h-6 w-6"/>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">{translateUi(" Sign out of PLP Hub? ")}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            {translateUi(userName ? (<span>{translateUi(" You are currently signed in as ")}<strong className="text-foreground">{translateUi(userName)}</strong>
                {translateUi(userEmail ? <span className="block text-xs text-muted-foreground mt-0.5">{translateUi(userEmail)}</span> : null)}
              </span>) : (<span>{translateUi("Are you sure you want to end your current session?")}</span>))}
            <span className="block mt-2.5 text-xs text-muted-foreground">{translateUi(" You will need to sign in again to access your workspace, upcoming meetings, and verified attendance credits. ")}</span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
          <Button type="button" variant="secondary" className="flex-1 rounded-xl h-11" onClick={() => onOpenChange(false)}>{translateUi(" Stay signed in ")}</Button>
          <Button type="button" variant="destructive" className="flex-1 rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-2" onClick={() => {
            onOpenChange(false);
            onConfirm();
        }}>
            <LogOut className="h-4 w-4"/>{translateUi(" Sign out ")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
