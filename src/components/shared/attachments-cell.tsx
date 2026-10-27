import { translateUi, useSiteLanguage } from '../../i18n/language';
interface AttachmentsCellProps {
    count: number;
    label?: string;
}
export function AttachmentsCell({ count, label }: AttachmentsCellProps) {
    useSiteLanguage();
    return (<div className="leading-tight">
      <p className="text-sm font-medium text-foreground">{translateUi(count)}</p>
      <p className="text-xs text-muted-foreground">
        {translateUi(count > 0 ? label ?? "Images & Videos" : "No attachments")}
      </p>
    </div>);
}
