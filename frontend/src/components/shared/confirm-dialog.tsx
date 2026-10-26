import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="flex gap-4">
          {destructive && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
          <div className="space-y-1.5">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmRequest {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
}
let enqueue: ((request: ConfirmRequest, resolve: (ok: boolean) => void) => void) | null = null;

// In-app replacement for window.confirm; resolves false if no host is mounted.
export function confirmAction(request: ConfirmRequest) {
  return new Promise<boolean>((resolve) => {
    if (enqueue) enqueue(request, resolve);
    else resolve(false);
  });
}

export function ConfirmHost() {
  const [pending, setPending] = useState<{ request: ConfirmRequest; resolve: (ok: boolean) => void } | null>(null);
  useEffect(() => {
    enqueue = (request, resolve) => setPending({ request, resolve });
    return () => { enqueue = null; };
  }, []);
  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };
  return (
    <ConfirmDialog
      open={!!pending}
      onOpenChange={(open) => { if (!open) close(false); }}
      title={pending?.request.title ?? ""}
      description={pending?.request.description ?? ""}
      confirmLabel={pending?.request.confirmLabel}
      destructive={pending?.request.destructive}
      onConfirm={() => close(true)}
    />
  );
}
