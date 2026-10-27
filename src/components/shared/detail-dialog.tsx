import { translateUi, useSiteLanguage } from '../../i18n/language';
import { Dialog, DialogContent, DialogDescription, DialogTitle, } from "@/components/ui/dialog";
export interface DetailField {
    label: string;
    value: React.ReactNode;
}
interface DetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    fields: DetailField[];
}
export function DetailDialog({ open, onOpenChange, title, description, fields, }: DetailDialogProps) {
    useSiteLanguage();
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>{translateUi(title)}</DialogTitle>
        {translateUi(description && <DialogDescription>{translateUi(description)}</DialogDescription>)}
        <dl className="mt-4 space-y-3">
          {translateUi(fields.map((field) => (<div key={field.label} className="grid grid-cols-[140px_1fr] gap-2 text-sm">
              <dt className="text-muted-foreground">{translateUi(field.label)}</dt>
              <dd className="font-medium text-foreground">{translateUi(field.value)}</dd>
            </div>)))}
        </dl>
      </DialogContent>
    </Dialog>);
}
