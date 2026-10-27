import { translateUi, useSiteLanguage } from '../../i18n/language';
import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
/** Pop-up used for create and edit forms; rendered only while open, so its fields reset each time. */
export function FormModal({ title, description, onClose, children, wide = false }: {
    title: string;
    description?: string;
    onClose: () => void;
    children: ReactNode;
    wide?: boolean;
}) {
    useSiteLanguage();
    return (<Dialog open onOpenChange={(open) => { if (!open)
        onClose(); }}>
      <DialogContent className={`hub-app hub-dialog max-h-[90vh] overflow-y-auto ${wide ? "max-w-3xl" : "max-w-lg"}`}>
        <DialogTitle>{translateUi(title)}</DialogTitle>
        {translateUi(description && <DialogDescription>{translateUi(description)}</DialogDescription>)}
        <div className="hub-space">{translateUi(children)}</div>
      </DialogContent>
    </Dialog>);
}
