import { translateUi, useSiteLanguage } from '../../i18n/language';
import { CheckCircle2, Clock, AlertTriangle, XCircle, RotateCcw, GraduationCap, Radio, CalendarClock, Archive, } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { VerificationStatus } from "@/types";
type StatusConfig = {
    label: string;
    variant: BadgeProps["variant"];
    icon: React.ComponentType<{
        className?: string;
    }>;
};
const STATUS_MAP: Record<VerificationStatus, StatusConfig> = {
    active: { label: "Active", variant: "success", icon: CheckCircle2 },
    verified: { label: "Verified", variant: "success", icon: CheckCircle2 },
    approved: { label: "Approved", variant: "success", icon: CheckCircle2 },
    pending: { label: "Pending", variant: "info", icon: Clock },
    inactive: { label: "Inactive", variant: "danger", icon: AlertTriangle },
    rejected: { label: "Rejected", variant: "danger", icon: AlertTriangle },
    suspended: { label: "Suspended", variant: "danger", icon: XCircle },
    graduated: { label: "Graduated", variant: "warning", icon: GraduationCap },
    returned: { label: "Returned", variant: "warning", icon: RotateCcw },
    ongoing: { label: "Ongoing", variant: "success", icon: Radio },
    upcoming: { label: "Upcoming", variant: "info", icon: CalendarClock },
    archived: { label: "Archived", variant: "neutral", icon: Archive },
    published: { label: "Published", variant: "success", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", variant: "danger", icon: XCircle },
    issued: { label: "Issued", variant: "success", icon: CheckCircle2 },
};
interface StatusBadgeProps {
    status: VerificationStatus;
    className?: string;
}
export function StatusBadge({ status, className }: StatusBadgeProps) {
    useSiteLanguage();
    const config = STATUS_MAP[status];
    const Icon = config.icon;
    return (<Badge variant={config.variant} className={className}>
      <Icon />
      {translateUi(config.label)}
    </Badge>);
}
