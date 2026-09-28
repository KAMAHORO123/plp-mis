import { useMemo, useState } from "react";
import { Download, Eye, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateReport } from "@/lib/actions";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatCardGrid } from "@/components/shared/stat-card-grid";
import { ChartCard } from "@/components/shared/chart-card";
import { MultiLineChart } from "@/components/charts/multi-line-chart";
import { DataTable, type Column } from "@/components/shared/data-table";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Pagination } from "@/components/shared/pagination";
import { EntityCell } from "@/components/shared/entity-cell";
import { AttachmentsCell } from "@/components/shared/attachments-cell";
import { StatusBadge } from "@/components/shared/status-badge";
import { RowAction, RowActions } from "@/components/shared/row-actions";
import { DetailDialog } from "@/components/shared/detail-dialog";
import { type TimeRange } from "@/components/shared/time-range-tabs";
import { useTableState } from "@/hooks/use-table-state";
import { useCertifications } from "@/hooks/use-queries";
import { useApproveCertification } from "@/hooks/use-mutations";
import { certificationStats, certificationTrend } from "@/api/mock/metrics";
import { cn, formatDate } from "@/lib/utils";
import type { CertificationRequest, VerificationStatus } from "@/types";

const TABS: { id: string; label: string; status?: VerificationStatus }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending", status: "pending" },
  { id: "approved", label: "Issued", status: "approved" },
  { id: "rejected", label: "Rejected", status: "rejected" },
];

export function CertificationPage() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [tab, setTab] = useState("all");
  const { data = [], isLoading } = useCertifications();
  const approve = useApproveCertification();
  const [toView, setToView] = useState<CertificationRequest | null>(null);

  const filtered = useMemo(() => {
    const status = TABS.find((t) => t.id === tab)?.status;
    return status ? data.filter((c) => c.status === status) : data;
  }, [data, tab]);

  const columns: Column<CertificationRequest>[] = [
    { id: "school", header: "School Name", cell: (row) => <EntityCell name={row.schoolName} image={row.schoolLogo} square />, sortable: true, sortValue: (row) => row.schoolName },
    { id: "certificates", header: "Number Of Certificates", cell: (row) => row.certificateCount, sortable: true, sortValue: (row) => row.certificateCount },
    { id: "program", header: "Program", cell: (row) => row.activityName ?? "PLP Leadership Program" },
    { id: "requestDate", header: "Request Date", cell: (row) => formatDate(row.requestDate), sortable: true, sortValue: (row) => row.requestDate },
    { id: "attachments", header: "Attachments", cell: (row) => <AttachmentsCell count={row.attachments} /> },
    { id: "status", header: "Verification status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: "action",
      header: "Action",
      cell: (row) => (
        <RowActions>
          <RowAction icon={Eye} label="View" variant="primary" onClick={() => setToView(row)} />
          {row.status === "pending" && (
            <RowAction icon={Check} label="Approve" variant="success" onClick={async () => { await approve.mutateAsync(row.id); toast.success("Certificates issued"); }} />
          )}
        </RowActions>
      ),
    },
  ];

  const table = useTableState({
    data: filtered,
    columns,
    searchFields: (row) => `${row.schoolName} ${row.status}`,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certification Requests & Verification"
        description="Review, approve, and manage PLP certificate requests."
        actions={
          <>
            <Button variant="secondary" onClick={() => generateReport("Certification report")}>
              <Download />
              Generate a Report
            </Button>
            <Button variant={tab === "pending" ? "primary" : "secondary"} onClick={() => setTab("pending")}>
              View Pending Approvals
            </Button>
          </>
        }
      />

      <FilterBar range={range} onRangeChange={setRange} rangeOptions={["all", "12m", "30d", "7d", "24h"]} />
      <StatCardGrid metrics={certificationStats} loading={isLoading} columns={4} />
      <ChartCard title="Certification Trend" description="Monthly certificate requests and issuances.">
        <MultiLineChart data={certificationTrend} series={[{ key: "Issued", name: "Issued", color: "#2563eb" }, { key: "Requested", name: "Requested", color: "#93c5fd" }]} />
      </ChartCard>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", tab === t.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {t.label}
            </button>
          ))}
        </div>
        <TableToolbar search={table.search} onSearchChange={table.setSearch} showColumns />
        <div className="mt-4">
          <DataTable columns={columns} data={table.rows} getRowId={(row) => row.id} loading={isLoading} sort={table.sort} onSortChange={table.setSort} />
        </div>
        <Pagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} className="mt-4" />
      </Card>

      <DetailDialog
        open={!!toView}
        onOpenChange={(open) => !open && setToView(null)}
        title={toView?.schoolName ?? "Certification Request"}
        fields={toView ? [
          { label: "Certificates", value: toView.certificateCount },
          { label: "Program", value: toView.activityName ?? "PLP Leadership Program" },
          { label: "Members", value: toView.memberNames?.join(", ") || "—" },
          { label: "Request Date", value: formatDate(toView.requestDate) },
          { label: "Attachments", value: toView.attachments },
          { label: "Status", value: <StatusBadge status={toView.status} /> },
        ] : []}
      />
    </div>
  );
}
