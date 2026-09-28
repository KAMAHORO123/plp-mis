import { useQuery } from "@tanstack/react-query";
import { schoolsApi } from "@/api/services";
import { PageHeader } from "@/components/shared/page-header";
import { StatCardGrid } from "@/components/shared/stat-card-grid";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDashboardOverview } from "@/hooks/use-queries";
import { formatDate } from "@/lib/utils";
import type { Activity } from "@/types";

const columns: Column<Activity>[] = [
  { id: "title", header: "Title", cell: (row) => row.activityName },
  { id: "category", header: "Category", cell: (row) => row.category ?? "—" },
  { id: "date", header: "Date", cell: (row) => formatDate(row.date) },
  { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
];

export function CoordinatorOverviewPage() {
  const { data: schools = [] } = useQuery({
    queryKey: ["my-school-summary"],
    queryFn: () => schoolsApi.list(),
    staleTime: 300_000,
  });
  const {
    data: overview,
    isLoading,
  } = useDashboardOverview("coordinator");
  const school = schools[0];
  const stats = overview?.stats ?? [];
  const activities = overview?.activities ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Coordinator Dashboard"
        description="Overview of your school's PLP program."
      />
      {String(school?.status).toUpperCase() === "PENDING" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your school application is pending PLP National approval. You can prepare records while waiting.
        </p>
      )}
      <StatCardGrid metrics={stats} loading={isLoading} columns={3} />
      <Card className="p-5">
        <h3 className="mb-4 text-[15px] font-semibold">Recent Activities</h3>
        <DataTable
          columns={columns}
          data={activities.slice(0, 10)}
          getRowId={(row) => row.id}
          loading={isLoading}
        />
      </Card>
    </div>
  );
}
