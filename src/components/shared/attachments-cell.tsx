interface AttachmentsCellProps {
  count: number;
  label?: string;
}

export function AttachmentsCell({ count, label }: AttachmentsCellProps) {
  return (
    <div className="leading-tight">
      <p className="text-sm font-medium text-foreground">{count}</p>
      <p className="text-xs text-muted-foreground">
        {count > 0 ? label ?? "Images & Videos" : "No attachments"}
      </p>
    </div>
  );
}
