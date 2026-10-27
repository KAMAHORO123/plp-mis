import { translateUi, useSiteLanguage } from '../../i18n/language';
import { School, Users, Shield, CalendarDays, Award, AlertTriangle, XCircle, PieChart, type LucideIcon, } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { StatMetric } from "@/types";
const ICON_MAP: Record<string, LucideIcon> = {
    school: School,
    users: Users,
    shield: Shield,
    calendar: CalendarDays,
    award: Award,
    alert: AlertTriangle,
    x: XCircle,
    pie: PieChart,
};
interface StatCardGridProps {
    metrics: StatMetric[];
    loading?: boolean;
    columns?: 3 | 4 | 5;
    className?: string;
}
export function StatCardGrid({ metrics, loading, columns = 5, className, }: StatCardGridProps) {
    useSiteLanguage();
    const gridCols = columns === 5
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        : columns === 3
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";
    if (loading) {
        return (<div className={cn("grid gap-4", gridCols, className)}>
        {translateUi(Array.from({ length: columns }).map((_, i) => (<Skeleton key={i} className="h-[132px] rounded-xl"/>)))}
      </div>);
    }
    return (<div className={cn("grid gap-4", gridCols, className)}>
      {translateUi(metrics.map((metric) => (<StatCard key={metric.id} icon={ICON_MAP[metric.icon] ?? School} label={translateUi(metric.label)} value={metric.value} change={metric.change} trend={metric.trend} caption={metric.caption}/>)))}
    </div>);
}
