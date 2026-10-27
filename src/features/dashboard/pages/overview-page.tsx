import { translateUi, useSiteLanguage } from '../../../i18n/language';
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Eye, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatCardGrid } from "@/components/shared/stat-card-grid";
import { ChartCard } from "@/components/shared/chart-card";
import { AreaTrendChart } from "@/components/charts/area-trend-chart";
import { DataTable, type Column } from "@/components/shared/data-table";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Pagination } from "@/components/shared/pagination";
import { EntityCell } from "@/components/shared/entity-cell";
import { StatusBadge } from "@/components/shared/status-badge";
import { RowAction, RowActions } from "@/components/shared/row-actions";
import { type TimeRange } from "@/components/shared/time-range-tabs";
import { useTableState } from "@/hooks/use-table-state";
import { useDashboardOverview, } from "@/hooks/use-queries";
import { useApproveActivity, useApproveSchool, useRejectSchool, useGenerateReport } from "@/hooks/use-mutations";
import { DetailDialog } from "@/components/shared/detail-dialog";
import { areaTrend } from "@/api/mock/metrics";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Activity, PlpEvent, School } from "@/types";
function buildActivityColumns(onViewActivity: (row: Activity) => void): Column<Activity>[] {
    return [
        {
            id: "school",
            header: "School",
            cell: (row) => <EntityCell name={row.schoolName} image={row.schoolLogo} square/>,
        },
        { id: "activity", header: "Activity Title", cell: (row) => row.activityName },
        { id: "coordinator", header: "Coordinator", cell: (row) => row.coordinatorName ?? "—" },
        { id: "date", header: "Date", cell: (row) => formatDate(row.date) },
        { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status}/> },
        {
            id: "action",
            header: "Action",
            cell: (row) => <ActivityActions row={row} onView={onViewActivity}/>,
        },
    ];
}
function ActivityActions({ row, onView }: {
    row: Activity;
    onView: (row: Activity) => void;
}) {
    useSiteLanguage();
    const approve = useApproveActivity();
    return (<RowActions>
      <RowAction icon={Eye} label={translateUi("View")} onClick={() => onView(row)}/>
      <RowAction icon={Check} label={translateUi("Approve")} variant="success" onClick={async () => {
            await approve.mutateAsync(row.id);
            toast.success(translateUi("Activity approved"));
        }}/>
    </RowActions>);
}
function buildApplicationColumns(onView: (school: School) => void): Column<School>[] {
    return [
        { id: "name", header: "School Name", cell: (row) => row.name },
        { id: "country", header: "Country", cell: (row) => row.country ?? "Rwanda" },
        { id: "district", header: "District", cell: (row) => row.district },
        { id: "coordinator", header: "Coordinator", cell: (row) => row.coordinatorName },
        { id: "date", header: "Registration", cell: (row) => formatDate(row.lastActivityDate) },
        { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status}/> },
        {
            id: "actions",
            header: "Actions",
            cell: (row) => <ApplicationActions school={row} onView={onView}/>,
        },
    ];
}
function ApplicationActions({ school, onView }: {
    school: School;
    onView: (school: School) => void;
}) {
    useSiteLanguage();
    const approve = useApproveSchool();
    const reject = useRejectSchool();
    return (<RowActions>
      <RowAction icon={Eye} label={translateUi("View")} onClick={() => onView(school)}/>
      <RowAction icon={Check} label={translateUi("Approve")} variant="success" onClick={async () => {
            await approve.mutateAsync(school.id);
            toast.success(translateUi("School approved"));
        }}/>
      <RowAction icon={X} label={translateUi("Reject")} variant="danger" onClick={async () => {
            await reject.mutateAsync(school.id);
            toast.success(translateUi("School rejected"));
        }}/>
    </RowActions>);
}
const eventColumns: Column<PlpEvent>[] = [
    { id: "name", header: "Event Name", cell: (row) => row.title },
    { id: "school", header: "School", cell: (row) => row.school },
    { id: "date", header: "Date", cell: (row) => formatDate(row.date) },
    { id: "location", header: "Location", cell: (row) => row.location ?? "—" },
];
export function OverviewPage() {
    useSiteLanguage();
    const navigate = useNavigate();
    const [range, setRange] = useState<TimeRange>("30d");
    const [viewActivity, setViewActivity] = useState<Activity | null>(null);
    const [viewSchool, setViewSchool] = useState<School | null>(null);
    const activityColumns = useMemo(() => buildActivityColumns(setViewActivity), []);
    const applicationColumns = useMemo(() => buildApplicationColumns(setViewSchool), []);
    const { data: overview, isLoading, isFetching, } = useDashboardOverview("national");
    const stats = overview?.stats ?? [];
    const activities = overview?.activities ?? [];
    const applications = overview?.applications ?? [];
    const events = overview?.events ?? [];
    const generateReport = useGenerateReport();
    const table = useTableState({
        data: activities,
        columns: activityColumns,
        searchFields: (row) => `${row.schoolName} ${row.activityName} ${row.status}`,
    });
    const handleReport = async () => {
        try {
            await generateReport.mutateAsync({
                name: "National Dashboard Report",
                category: "Dashboard",
                rangeStart: new Date(Date.now() - 30 * 86400000).toISOString(),
                rangeEnd: new Date().toISOString(),
                format: "PDF",
            });
            toast.success(translateUi("Report generated"));
        }
        catch (err) {
            toast.error(translateUi(err instanceof Error ? err.message : "Report failed"));
        }
    };
    return (<div className="space-y-6">
      <PageHeader title={translateUi("Welcome to the PLP National Dashboard")} description={translateUi("Real-time view of national activities and impact.")} actions={<>
            <Button variant="secondary" onClick={handleReport}>
              <Download />{translateUi(" Generate a Report ")}</Button>
            <Button onClick={() => navigate("/schools")}>{translateUi(" View Pending Approvals ")}</Button>
          </>}/>

      <FilterBar range={range} onRangeChange={setRange} rangeOptions={["all", "12m", "30d", "7d", "24h"]}/>

      <StatCardGrid metrics={stats} loading={isLoading} columns={5}/>

      <ChartCard title={translateUi("National Activity Trend")} description={translateUi("Verified activities over time")}>
        <AreaTrendChart data={areaTrend}/>
      </ChartCard>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-[15px] font-semibold tracking-tight">{translateUi("Recent Activities")}</h3>
          <span className="text-sm font-medium text-primary">{translateUi(formatNumber(activities.length))}</span>
          {translateUi(isFetching && !isLoading && (<span className="text-xs font-semibold text-muted-foreground">{translateUi("Refreshing...")}</span>))}
        </div>
        <TableToolbar search={table.search} onSearchChange={table.setSearch} searchPlaceholder="Search activities..."/>
        <div className="mt-4">
          <DataTable columns={activityColumns} data={table.rows} getRowId={(row) => row.id} loading={isLoading} sort={table.sort} onSortChange={table.setSort}/>
        </div>
        <Pagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} className="mt-4"/>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-[15px] font-semibold">{translateUi("Upcoming Events")}</h3>
        <DataTable columns={eventColumns} data={events.slice(0, 8)} getRowId={(row) => row.id}/>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 text-[15px] font-semibold">{translateUi("School Applications")}</h3>
        <DataTable columns={applicationColumns} data={applications} getRowId={(row) => row.id}/>
      </Card>

      <DetailDialog open={!!viewActivity} onOpenChange={(open) => !open && setViewActivity(null)} title={translateUi(viewActivity?.activityName ?? "Activity")} fields={viewActivity ? [
            { label: "School", value: viewActivity.schoolName },
            { label: "Coordinator", value: viewActivity.coordinatorName ?? "—" },
            { label: "Category", value: viewActivity.category ?? "—" },
            { label: "Date", value: formatDate(viewActivity.date) },
            { label: "Description", value: viewActivity.description },
            { label: "Status", value: <StatusBadge status={viewActivity.status}/> },
        ] : []}/>

      <DetailDialog open={!!viewSchool} onOpenChange={(open) => !open && setViewSchool(null)} title={translateUi(viewSchool?.name ?? "School Application")} fields={viewSchool ? [
            { label: "District", value: viewSchool.district },
            { label: "Coordinator", value: viewSchool.coordinatorName },
            { label: "Phone", value: viewSchool.coordinatorPhone },
            { label: "Status", value: <StatusBadge status={viewSchool.status}/> },
        ] : []}/>
    </div>);
}
