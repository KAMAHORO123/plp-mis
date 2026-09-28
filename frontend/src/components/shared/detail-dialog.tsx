import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

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

export function DetailDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
        <dl className="mt-4 space-y-3">
          {fields.map((field) => (
            <div key={field.label} className="grid grid-cols-[140px_1fr] gap-2 text-sm">
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="font-medium text-foreground">{field.value}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
